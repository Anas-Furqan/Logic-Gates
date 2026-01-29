/**
 * LogicLab - Karnaugh Map Generator
 * 
 * Generates K-maps for 2, 3, and 4 variable Boolean expressions.
 * Uses Gray code ordering for proper adjacency representation.
 * Implements automatic grouping for simplification visualization.
 */

import { nanoid } from 'nanoid';
import { 
  ASTNode, 
  TruthTable, 
  KMap, 
  KMapCell, 
  KMapGroup 
} from '@/types';
import { evaluate, mintermToBinding } from '@/engine/evaluator';

// Gray code sequences for K-map ordering
const GRAY_CODE_2 = ['00', '01', '11', '10'];
const GRAY_CODE_1 = ['0', '1'];

// Colors for K-map groups (visually distinct)
const GROUP_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

/**
 * Generate a Karnaugh map for the given AST
 */
export function generateKMap(
  ast: ASTNode,
  variables: string[],
  truthTable: TruthTable
): KMap {
  const numVars = variables.length;
  
  if (numVars < 2 || numVars > 4) {
    throw new Error('K-map generation requires 2-4 variables');
  }
  
  // Split variables between rows and columns
  const { rowVars, colVars, rowLabels, colLabels } = getKMapLabels(variables);
  
  // Create cells
  const cells = createKMapCells(
    ast, 
    variables, 
    rowVars, 
    colVars, 
    rowLabels, 
    colLabels
  );
  
  // Find groups for simplification
  const groups = findKMapGroups(cells, numVars, variables);
  
  // Mark grouped cells
  markGroupedCells(cells, groups);
  
  return {
    variables,
    numVars,
    cells,
    groups,
    rowLabels,
    colLabels,
    rowVars,
    colVars,
  };
}

/**
 * Determine row/column variable assignments and labels
 */
function getKMapLabels(variables: string[]): {
  rowVars: string[];
  colVars: string[];
  rowLabels: string[];
  colLabels: string[];
} {
  const n = variables.length;
  
  switch (n) {
    case 2:
      // 2x2 map
      return {
        rowVars: [variables[0]],
        colVars: [variables[1]],
        rowLabels: GRAY_CODE_1,
        colLabels: GRAY_CODE_1,
      };
      
    case 3:
      // 2x4 map
      return {
        rowVars: [variables[0]],
        colVars: [variables[1], variables[2]],
        rowLabels: GRAY_CODE_1,
        colLabels: GRAY_CODE_2,
      };
      
    case 4:
      // 4x4 map
      return {
        rowVars: [variables[0], variables[1]],
        colVars: [variables[2], variables[3]],
        rowLabels: GRAY_CODE_2,
        colLabels: GRAY_CODE_2,
      };
      
    default:
      throw new Error(`Unsupported variable count: ${n}`);
  }
}

/**
 * Create the K-map cell grid
 */
function createKMapCells(
  ast: ASTNode,
  variables: string[],
  rowVars: string[],
  colVars: string[],
  rowLabels: string[],
  colLabels: string[]
): KMapCell[][] {
  const cells: KMapCell[][] = [];
  
  for (let r = 0; r < rowLabels.length; r++) {
    const row: KMapCell[] = [];
    
    for (let c = 0; c < colLabels.length; c++) {
      // Build variable bindings from Gray code labels
      const binding: Record<string, boolean> = {};
      
      // Row variables
      for (let i = 0; i < rowVars.length; i++) {
        binding[rowVars[i]] = rowLabels[r][i] === '1';
      }
      
      // Column variables
      for (let i = 0; i < colVars.length; i++) {
        binding[colVars[i]] = colLabels[c][i] === '1';
      }
      
      // Calculate minterm number
      const minterm = calculateMinterm(binding, variables);
      
      // Evaluate the expression
      const value = evaluate(ast, binding);
      
      row.push({
        row: r,
        col: c,
        value,
        minterm,
        variables: { ...binding },
        grouped: false,
        groupIds: [],
      });
    }
    
    cells.push(row);
  }
  
  return cells;
}

/**
 * Calculate minterm number from variable binding
 */
function calculateMinterm(
  binding: Record<string, boolean>,
  variables: string[]
): number {
  let minterm = 0;
  for (let i = 0; i < variables.length; i++) {
    if (binding[variables[i]]) {
      minterm |= (1 << (variables.length - 1 - i));
    }
  }
  return minterm;
}

/**
 * Find groups in the K-map for simplification
 * Groups are powers of 2 (1, 2, 4, 8, 16) cells that are adjacent
 */
function findKMapGroups(
  cells: KMapCell[][],
  numVars: number,
  variables: string[]
): KMapGroup[] {
  const groups: KMapGroup[] = [];
  const rows = cells.length;
  const cols = cells[0].length;
  
  // Get all minterms with value 1
  const oneCells = new Set<number>();
  for (const row of cells) {
    for (const cell of row) {
      if (cell.value) {
        oneCells.add(cell.minterm);
      }
    }
  }
  
  if (oneCells.size === 0) return groups;
  
  // Find all possible rectangular groups (must be power of 2)
  const possibleGroups: Array<{
    cells: number[];
    size: number;
    term: string;
  }> = [];
  
  // Try all possible group sizes and positions
  const groupSizes = [
    { rows: rows, cols: cols },      // Full map
    { rows: rows, cols: cols / 2 },  // Half columns
    { rows: rows / 2, cols: cols },  // Half rows
    { rows: rows / 2, cols: cols / 2 }, // Quarter
    { rows: 1, cols: cols },         // Full row
    { rows: rows, cols: 1 },         // Full column
    { rows: 1, cols: cols / 2 },     // Half row
    { rows: rows / 2, cols: 1 },     // Half column
    { rows: 2, cols: 2 },            // 2x2
    { rows: 1, cols: 2 },            // Pair horizontal
    { rows: 2, cols: 1 },            // Pair vertical
    { rows: 1, cols: 1 },            // Single
  ].filter(s => s.rows >= 1 && s.cols >= 1);
  
  for (const size of groupSizes) {
    for (let startRow = 0; startRow < rows; startRow++) {
      for (let startCol = 0; startCol < cols; startCol++) {
        const groupCells: number[] = [];
        let allOnes = true;
        
        for (let r = 0; r < size.rows && allOnes; r++) {
          for (let c = 0; c < size.cols && allOnes; c++) {
            // Wrap around (K-map adjacency)
            const actualRow = (startRow + r) % rows;
            const actualCol = (startCol + c) % cols;
            const cell = cells[actualRow][actualCol];
            
            if (!cell.value) {
              allOnes = false;
            } else {
              groupCells.push(cell.minterm);
            }
          }
        }
        
        if (allOnes && groupCells.length > 0) {
          // Ensure it's a power of 2
          if ((groupCells.length & (groupCells.length - 1)) === 0) {
            // Check if this exact group already exists
            const sorted = [...groupCells].sort((a, b) => a - b).join(',');
            if (!possibleGroups.some(g => 
              [...g.cells].sort((a, b) => a - b).join(',') === sorted
            )) {
              possibleGroups.push({
                cells: groupCells,
                size: groupCells.length,
                term: generateTermFromGroup(groupCells, variables),
              });
            }
          }
        }
      }
    }
  }
  
  // Use greedy set cover to find minimal groups
  const covered = new Set<number>();
  const usedGroups: typeof possibleGroups = [];
  
  // Sort by size descending (prefer larger groups)
  possibleGroups.sort((a, b) => b.size - a.size);
  
  while (covered.size < oneCells.size) {
    // Find the best group that covers uncovered cells
    let bestGroup: typeof possibleGroups[0] | null = null;
    let bestNewCoverage = 0;
    
    for (const group of possibleGroups) {
      const newCoverage = group.cells.filter(m => !covered.has(m)).length;
      if (newCoverage > bestNewCoverage) {
        bestNewCoverage = newCoverage;
        bestGroup = group;
      }
    }
    
    if (!bestGroup) break;
    
    usedGroups.push(bestGroup);
    for (const minterm of bestGroup.cells) {
      covered.add(minterm);
    }
  }
  
  // Convert to KMapGroup objects
  return usedGroups.map((g, i) => ({
    id: nanoid(8),
    cells: g.cells,
    color: GROUP_COLORS[i % GROUP_COLORS.length],
    term: g.term,
  }));
}

/**
 * Generate a simplified term from a group of minterms
 */
function generateTermFromGroup(
  minterms: number[],
  variables: string[]
): string {
  if (minterms.length === 0) return '';
  
  const n = variables.length;
  
  // Find which bits are constant across all minterms
  const literals: string[] = [];
  
  for (let i = 0; i < n; i++) {
    const bitPos = n - 1 - i;
    const firstBit = (minterms[0] >> bitPos) & 1;
    let isConstant = true;
    
    for (const m of minterms) {
      if (((m >> bitPos) & 1) !== firstBit) {
        isConstant = false;
        break;
      }
    }
    
    if (isConstant) {
      literals.push(firstBit ? variables[i] : `${variables[i]}'`);
    }
  }
  
  return literals.length > 0 ? literals.join('') : '1';
}

/**
 * Mark cells that are part of groups
 */
function markGroupedCells(cells: KMapCell[][], groups: KMapGroup[]): void {
  for (const group of groups) {
    for (const row of cells) {
      for (const cell of row) {
        if (group.cells.includes(cell.minterm)) {
          cell.grouped = true;
          cell.groupIds.push(group.id);
        }
      }
    }
  }
}

/**
 * Generate SOP expression from K-map groups
 */
export function kmapToSOP(kmap: KMap): string {
  if (kmap.groups.length === 0) {
    // Check if all cells are 0
    const hasOne = kmap.cells.some(row => row.some(cell => cell.value));
    return hasOne ? '?' : '0';
  }
  
  // Check if result is 1 (all cells are covered and all are 1)
  const allOnes = kmap.cells.every(row => row.every(cell => cell.value));
  if (allOnes) return '1';
  
  return kmap.groups.map(g => g.term).join(' + ');
}

/**
 * Generate POS expression from K-map (by finding groups in the 0 cells)
 */
export function kmapToPOS(kmap: KMap): string {
  // Find minterms where output is 0
  const zeroMinterms: number[] = [];
  for (const row of kmap.cells) {
    for (const cell of row) {
      if (!cell.value) {
        zeroMinterms.push(cell.minterm);
      }
    }
  }
  
  if (zeroMinterms.length === 0) return '1';
  
  const numCells = kmap.cells.length * kmap.cells[0].length;
  if (zeroMinterms.length === numCells) return '0';
  
  // Generate maxterm product
  const terms = zeroMinterms.map(m => {
    const binding = mintermToBinding(m, kmap.variables);
    const literals = kmap.variables.map(v => 
      binding[v] ? `${v}'` : v
    );
    return `(${literals.join(' + ')})`;
  });
  
  return terms.join('');
}

/**
 * Get display label for a K-map row/column
 */
export function getKMapLabel(
  vars: string[],
  grayCode: string
): string {
  return vars.map((v, i) => 
    grayCode[i] === '1' ? v : `${v}'`
  ).join('');
}
