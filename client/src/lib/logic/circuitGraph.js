/**
 * LogicLab - Circuit Graph Generator
 * Converts AST to a directed acyclic graph (DAG) for circuit visualization
 */

/**
 * Node types in the circuit graph
 */
export const CircuitNodeType = {
  INPUT: 'INPUT',
  OUTPUT: 'OUTPUT',
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',
  XOR: 'XOR',
  NAND: 'NAND',
  NOR: 'NOR',
  XNOR: 'XNOR',
  CONSTANT: 'CONSTANT',
};

/**
 * Gate visual properties
 */
export const GateProperties = {
  AND: { inputs: 2, symbol: '&', color: '#3b82f6' },
  OR: { inputs: 2, symbol: '≥1', color: '#8b5cf6' },
  NOT: { inputs: 1, symbol: '1', color: '#f59e0b' },
  XOR: { inputs: 2, symbol: '=1', color: '#10b981' },
  NAND: { inputs: 2, symbol: '&', color: '#ec4899', inverted: true },
  NOR: { inputs: 2, symbol: '≥1', color: '#f97316', inverted: true },
  XNOR: { inputs: 2, symbol: '=1', color: '#06b6d4', inverted: true },
  INPUT: { inputs: 0, symbol: '', color: '#6b7280' },
  OUTPUT: { inputs: 1, symbol: '', color: '#22c55e' },
  CONSTANT: { inputs: 0, symbol: '', color: '#9ca3af' },
};

/**
 * Circuit node class
 */
export class CircuitNode {
  constructor(id, type, label = '') {
    this.id = id;
    this.type = type;
    this.label = label;
    this.inputs = [];
    this.outputs = [];
    this.value = null;
    this.x = 0;
    this.y = 0;
    this.level = 0;
    this.properties = GateProperties[type] || GateProperties.AND;
  }

  addInput(node) {
    this.inputs.push(node);
    node.outputs.push(this);
  }
}

/**
 * Circuit edge (wire) class
 */
export class CircuitEdge {
  constructor(from, to, fromPort = 0, toPort = 0) {
    this.id = `edge_${from.id}_${to.id}_${toPort}`;
    this.from = from;
    this.to = to;
    this.fromPort = fromPort;
    this.toPort = toPort;
    this.value = null;
    this.points = [];
  }
}

/**
 * Circuit graph class
 */
export class CircuitGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
    this.inputs = [];
    this.outputs = [];
    this.nodeIdCounter = 0;
  }

  /**
   * Generate unique node ID
   */
  generateNodeId() {
    return `node_${++this.nodeIdCounter}`;
  }

  /**
   * Add a node to the graph
   */
  addNode(type, label = '') {
    const id = this.generateNodeId();
    const node = new CircuitNode(id, type, label);
    this.nodes.set(id, node);
    return node;
  }

  /**
   * Add an edge between two nodes
   */
  addEdge(from, to, fromPort = 0, toPort = 0) {
    const edge = new CircuitEdge(from, to, fromPort, toPort);
    this.edges.push(edge);
    return edge;
  }

  /**
   * Get all nodes as array
   */
  getNodes() {
    return Array.from(this.nodes.values());
  }

  /**
   * Build circuit from AST
   */
  static fromAST(ast) {
    const graph = new CircuitGraph();
    const inputNodes = new Map(); // Variable name -> input node

    /**
     * Recursively process AST node
     */
    function processNode(astNode) {
      switch (astNode.type) {
        case 'VARIABLE': {
          // Reuse existing input node or create new one
          if (inputNodes.has(astNode.name)) {
            return inputNodes.get(astNode.name);
          }
          const inputNode = graph.addNode(CircuitNodeType.INPUT, astNode.name);
          inputNodes.set(astNode.name, inputNode);
          graph.inputs.push(inputNode);
          return inputNode;
        }

        case 'CONSTANT': {
          const constNode = graph.addNode(
            CircuitNodeType.CONSTANT,
            String(astNode.value)
          );
          constNode.value = astNode.value;
          return constNode;
        }

        case 'NOT': {
          const operand = processNode(astNode.operand);
          const notNode = graph.addNode(CircuitNodeType.NOT);
          notNode.addInput(operand);
          graph.addEdge(operand, notNode, 0, 0);
          return notNode;
        }

        case 'AND': {
          const left = processNode(astNode.left);
          const right = processNode(astNode.right);
          const andNode = graph.addNode(CircuitNodeType.AND);
          andNode.addInput(left);
          andNode.addInput(right);
          graph.addEdge(left, andNode, 0, 0);
          graph.addEdge(right, andNode, 0, 1);
          return andNode;
        }

        case 'OR': {
          const left = processNode(astNode.left);
          const right = processNode(astNode.right);
          const orNode = graph.addNode(CircuitNodeType.OR);
          orNode.addInput(left);
          orNode.addInput(right);
          graph.addEdge(left, orNode, 0, 0);
          graph.addEdge(right, orNode, 0, 1);
          return orNode;
        }

        case 'XOR': {
          const left = processNode(astNode.left);
          const right = processNode(astNode.right);
          const xorNode = graph.addNode(CircuitNodeType.XOR);
          xorNode.addInput(left);
          xorNode.addInput(right);
          graph.addEdge(left, xorNode, 0, 0);
          graph.addEdge(right, xorNode, 0, 1);
          return xorNode;
        }

        case 'NAND': {
          const left = processNode(astNode.left);
          const right = processNode(astNode.right);
          const nandNode = graph.addNode(CircuitNodeType.NAND);
          nandNode.addInput(left);
          nandNode.addInput(right);
          graph.addEdge(left, nandNode, 0, 0);
          graph.addEdge(right, nandNode, 0, 1);
          return nandNode;
        }

        case 'NOR': {
          const left = processNode(astNode.left);
          const right = processNode(astNode.right);
          const norNode = graph.addNode(CircuitNodeType.NOR);
          norNode.addInput(left);
          norNode.addInput(right);
          graph.addEdge(left, norNode, 0, 0);
          graph.addEdge(right, norNode, 0, 1);
          return norNode;
        }

        case 'XNOR': {
          const left = processNode(astNode.left);
          const right = processNode(astNode.right);
          const xnorNode = graph.addNode(CircuitNodeType.XNOR);
          xnorNode.addInput(left);
          xnorNode.addInput(right);
          graph.addEdge(left, xnorNode, 0, 0);
          graph.addEdge(right, xnorNode, 0, 1);
          return xnorNode;
        }

        default:
          throw new Error(`Unknown AST node type: ${astNode.type}`);
      }
    }

    // Process the entire AST
    const outputGate = processNode(ast);

    // Add output node
    const outputNode = graph.addNode(CircuitNodeType.OUTPUT, 'Y');
    outputNode.addInput(outputGate);
    graph.addEdge(outputGate, outputNode, 0, 0);
    graph.outputs.push(outputNode);

    // Sort inputs alphabetically
    graph.inputs.sort((a, b) => a.label.localeCompare(b.label));

    return graph;
  }

  /**
   * Evaluate the circuit with given input values
   */
  evaluate(inputValues) {
    const nodeValues = new Map();

    // Set input values
    for (const input of this.inputs) {
      const value = inputValues[input.label] ?? 0;
      nodeValues.set(input.id, value);
      input.value = value;
    }

    // Topological sort for evaluation order
    const visited = new Set();
    const order = [];

    const visit = (node) => {
      if (visited.has(node.id)) return;
      visited.add(node.id);
      
      for (const input of node.inputs) {
        visit(input);
      }
      
      order.push(node);
    };

    for (const output of this.outputs) {
      visit(output);
    }

    // Evaluate in topological order
    for (const node of order) {
      let value;

      switch (node.type) {
        case CircuitNodeType.INPUT:
        case CircuitNodeType.CONSTANT:
          value = nodeValues.get(node.id) ?? node.value ?? 0;
          break;

        case CircuitNodeType.NOT:
          value = nodeValues.get(node.inputs[0].id) ? 0 : 1;
          break;

        case CircuitNodeType.AND:
          value = node.inputs.every(i => nodeValues.get(i.id)) ? 1 : 0;
          break;

        case CircuitNodeType.OR:
          value = node.inputs.some(i => nodeValues.get(i.id)) ? 1 : 0;
          break;

        case CircuitNodeType.XOR:
          value = node.inputs.reduce((acc, i) => acc ^ (nodeValues.get(i.id) ? 1 : 0), 0);
          break;

        case CircuitNodeType.NAND:
          value = node.inputs.every(i => nodeValues.get(i.id)) ? 0 : 1;
          break;

        case CircuitNodeType.NOR:
          value = node.inputs.some(i => nodeValues.get(i.id)) ? 0 : 1;
          break;

        case CircuitNodeType.XNOR:
          value = node.inputs.reduce((acc, i) => acc ^ (nodeValues.get(i.id) ? 1 : 0), 0) ? 0 : 1;
          break;

        case CircuitNodeType.OUTPUT:
          value = nodeValues.get(node.inputs[0].id);
          break;

        default:
          value = 0;
      }

      nodeValues.set(node.id, value);
      node.value = value;
    }

    // Update edge values
    for (const edge of this.edges) {
      edge.value = nodeValues.get(edge.from.id);
    }

    return nodeValues.get(this.outputs[0].id);
  }

  /**
   * Get circuit statistics
   */
  getStatistics() {
    const stats = {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.length,
      inputs: this.inputs.length,
      outputs: this.outputs.length,
      gates: {},
    };

    for (const node of this.nodes.values()) {
      if (node.type !== CircuitNodeType.INPUT && 
          node.type !== CircuitNodeType.OUTPUT &&
          node.type !== CircuitNodeType.CONSTANT) {
        stats.gates[node.type] = (stats.gates[node.type] || 0) + 1;
      }
    }

    stats.totalGates = Object.values(stats.gates).reduce((a, b) => a + b, 0);

    return stats;
  }
}

export default CircuitGraph;
