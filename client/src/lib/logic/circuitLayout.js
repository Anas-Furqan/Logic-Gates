/**
 * LogicLab - Circuit Layout Algorithm
 * Positions circuit nodes for optimal visualization
 */

import { CircuitNodeType } from './circuitGraph.js';

/**
 * Layout configuration
 */
export const LayoutConfig = {
  nodeWidth: 80,
  nodeHeight: 50,
  inputWidth: 60,
  inputHeight: 40,
  outputWidth: 60,
  outputHeight: 40,
  horizontalGap: 120,
  verticalGap: 70,
  padding: 50,
  wireRadius: 10,
};

/**
 * Assign levels to nodes using longest path from inputs
 */
function assignLevels(graph) {
  const levels = new Map();
  
  // Initialize input nodes at level 0
  for (const input of graph.inputs) {
    levels.set(input.id, 0);
  }

  // Constants also at level 0
  for (const node of graph.nodes.values()) {
    if (node.type === CircuitNodeType.CONSTANT) {
      levels.set(node.id, 0);
    }
  }

  // BFS to assign levels
  let changed = true;
  while (changed) {
    changed = false;
    
    for (const node of graph.nodes.values()) {
      if (node.inputs.length === 0) continue;
      
      // Node level = max(input levels) + 1
      let maxInputLevel = -1;
      let allInputsAssigned = true;
      
      for (const input of node.inputs) {
        if (!levels.has(input.id)) {
          allInputsAssigned = false;
          break;
        }
        maxInputLevel = Math.max(maxInputLevel, levels.get(input.id));
      }
      
      if (allInputsAssigned) {
        const newLevel = maxInputLevel + 1;
        if (!levels.has(node.id) || levels.get(node.id) !== newLevel) {
          levels.set(node.id, newLevel);
          changed = true;
        }
      }
    }
  }

  // Apply levels to nodes
  for (const [nodeId, level] of levels) {
    graph.nodes.get(nodeId).level = level;
  }

  return Math.max(...levels.values()) + 1;
}

/**
 * Group nodes by level
 */
function groupByLevel(graph, numLevels) {
  const groups = Array.from({ length: numLevels }, () => []);
  
  for (const node of graph.nodes.values()) {
    groups[node.level].push(node);
  }
  
  return groups;
}

/**
 * Order nodes within levels to minimize edge crossings
 */
function orderNodesInLevels(groups) {
  // Sort first level (inputs) alphabetically
  groups[0].sort((a, b) => a.label.localeCompare(b.label));

  // For subsequent levels, order based on average position of inputs
  for (let level = 1; level < groups.length; level++) {
    const prevLevel = groups[level - 1];
    const prevPositions = new Map();
    
    prevLevel.forEach((node, index) => {
      prevPositions.set(node.id, index);
    });

    groups[level].sort((a, b) => {
      const avgA = getAverageInputPosition(a, prevPositions);
      const avgB = getAverageInputPosition(b, prevPositions);
      return avgA - avgB;
    });
  }

  return groups;
}

/**
 * Get average position of a node's inputs
 */
function getAverageInputPosition(node, positions) {
  if (node.inputs.length === 0) return 0;
  
  let sum = 0;
  let count = 0;
  
  for (const input of node.inputs) {
    if (positions.has(input.id)) {
      sum += positions.get(input.id);
      count++;
    }
  }
  
  return count > 0 ? sum / count : 0;
}

/**
 * Calculate node positions
 */
function calculatePositions(groups, config) {
  const positions = new Map();
  let maxY = 0;
  
  for (let level = 0; level < groups.length; level++) {
    const nodes = groups[level];
    const levelHeight = nodes.length * (config.nodeHeight + config.verticalGap);
    const startY = config.padding;
    
    nodes.forEach((node, index) => {
      const x = config.padding + level * (config.nodeWidth + config.horizontalGap);
      const y = startY + index * (config.nodeHeight + config.verticalGap);
      
      node.x = x;
      node.y = y;
      positions.set(node.id, { x, y });
      
      maxY = Math.max(maxY, y + config.nodeHeight);
    });
  }

  return {
    positions,
    width: config.padding * 2 + groups.length * (config.nodeWidth + config.horizontalGap),
    height: maxY + config.padding,
  };
}

/**
 * Calculate wire routing points using orthogonal routing
 */
function calculateWireRoutes(graph, config) {
  for (const edge of graph.edges) {
    const from = edge.from;
    const to = edge.to;
    
    // Calculate port positions
    const fromX = from.x + getNodeWidth(from.type, config);
    const fromY = from.y + config.nodeHeight / 2;
    
    const toX = to.x;
    const toInputCount = to.inputs.length;
    const toPortOffset = toInputCount > 1 
      ? (edge.toPort - (toInputCount - 1) / 2) * 15 
      : 0;
    const toY = to.y + config.nodeHeight / 2 + toPortOffset;

    // Calculate intermediate points for orthogonal routing
    const midX = (fromX + toX) / 2;
    
    if (Math.abs(fromY - toY) < 5) {
      // Direct horizontal line
      edge.points = [
        { x: fromX, y: fromY },
        { x: toX, y: toY },
      ];
    } else {
      // Orthogonal routing with smooth corners
      edge.points = [
        { x: fromX, y: fromY },
        { x: midX, y: fromY },
        { x: midX, y: toY },
        { x: toX, y: toY },
      ];
    }
  }
}

/**
 * Get node width based on type
 */
function getNodeWidth(type, config) {
  switch (type) {
    case CircuitNodeType.INPUT:
      return config.inputWidth;
    case CircuitNodeType.OUTPUT:
      return config.outputWidth;
    default:
      return config.nodeWidth;
  }
}

/**
 * Main layout function
 */
export function layoutCircuit(graph, customConfig = {}) {
  const config = { ...LayoutConfig, ...customConfig };

  // Step 1: Assign levels to nodes
  const numLevels = assignLevels(graph);

  // Step 2: Group nodes by level
  let groups = groupByLevel(graph, numLevels);

  // Step 3: Order nodes within levels to minimize crossings
  groups = orderNodesInLevels(groups);

  // Step 4: Calculate positions
  const { width, height } = calculatePositions(groups, config);

  // Step 5: Calculate wire routes
  calculateWireRoutes(graph, config);

  return {
    graph,
    width,
    height,
    config,
  };
}

/**
 * Center the layout within given bounds
 */
export function centerLayout(graph, canvasWidth, canvasHeight, layoutWidth, layoutHeight) {
  const offsetX = Math.max(0, (canvasWidth - layoutWidth) / 2);
  const offsetY = Math.max(0, (canvasHeight - layoutHeight) / 2);

  for (const node of graph.nodes.values()) {
    node.x += offsetX;
    node.y += offsetY;
  }

  for (const edge of graph.edges) {
    for (const point of edge.points) {
      point.x += offsetX;
      point.y += offsetY;
    }
  }
}

export default {
  layoutCircuit,
  centerLayout,
  LayoutConfig,
};
