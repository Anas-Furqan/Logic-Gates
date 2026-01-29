/**
 * LogicLab - Karnaugh Map Generator
 * Generates K-maps and finds optimal groupings for Boolean simplification
 */

/**
 * Gray code sequences for K-map indexing
 */
const GRAY_CODE = {
  2: ['00', '01', '11', '10'],
  4: ['00', '01', '11', '10'],
};

/**
 * Convert binary string to decimal
 */
function binaryToDecimal(binary) {
  return parseInt(binary, 2);
}

/**
 * Convert decimal to binary string with padding
 */
function decimalToBinary(num, bits) {
  return num.toString(2).padStart(bits, '0');
}

/**
 * Get Gray code value for a position
 */
function getGrayCode(position, bits) {
  const gray = position ^ (position >> 1);
  return decimalToBinary(gray, bits);
}

/**
 * Generate K-map structure from truth table
 * @param {Object} truthTable - Truth table data
 * @returns {Object} - K-map data structure
 */
export function generateKMap(truthTable) {
  const { variables, rows } = truthTable;
  const numVars = variables.length;

  if (numVars < 2 || numVars > 4) {
    throw new Error('K-map generation supports 2-4 variables only');
  }

  // Determine row and column variable split
  let rowVars, colVars;
  if (numVars === 2) {
    rowVars = [variables[0]];
    colVars = [variables[1]];
  } else if (numVars === 3) {
    rowVars = [variables[0]];
    colVars = [variables[1], variables[2]];
  } else {
    rowVars = [variables[0], variables[1]];
    colVars = [variables[2], variables[3]];
  }

  const numRows = Math.pow(2, rowVars.length);
  const numCols = Math.pow(2, colVars.length);

  // Generate Gray code headers
  const rowHeaders = [];
  for (let i = 0; i < numRows; i++) {
    rowHeaders.push(getGrayCode(i, rowVars.length));
  }

  const colHeaders = [];
  for (let i = 0; i < numCols; i++) {
    colHeaders.push(getGrayCode(i, colVars.length));
  }

  // Create K-map grid
  const grid = [];
  const cellData = [];

  for (let r = 0; r < numRows; r++) {
    const gridRow = [];
    const dataRow = [];

    for (let c = 0; c < numCols; c++) {
      // Build the full binary value for this cell
      const rowBits = rowHeaders[r];
      const colBits = colHeaders[c];
      
      // Create variable assignment
      const assignment = {};
      for (let i = 0; i < rowVars.length; i++) {
        assignment[rowVars[i]] = parseInt(rowBits[i]);
      }
      for (let i = 0; i < colVars.length; i++) {
        assignment[colVars[i]] = parseInt(colBits[i]);
      }

      // Find matching row in truth table
      const matchingRow = rows.find(row => {
        return variables.every(v => row.inputs[v] === assignment[v]);
      });

      const value = matchingRow ? matchingRow.output : 0;
      const minterm = matchingRow ? matchingRow.index : -1;

      gridRow.push(value);
      dataRow.push({
        value,
        minterm,
        row: r,
        col: c,
        assignment,
      });
    }

    grid.push(gridRow);
    cellData.push(dataRow);
  }

  return {
    variables,
    rowVars,
    colVars,
    rowHeaders,
    colHeaders,
    grid,
    cellData,
    numRows,
    numCols,
  };
}

/**
 * Find all valid K-map groups (rectangles of 1s, 2s, 4s, 8s, or 16s)
 * Groups can wrap around edges
 * @param {Object} kmap - K-map data
 * @returns {Object[]} - Array of group objects
 */
export function findKMapGroups(kmap) {
  const { grid, numRows, numCols, cellData } = kmap;
  const groups = [];

  // Get all cells with value 1
  const ones = [];
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      if (grid[r][c] === 1) {
        ones.push({ r, c });
      }
    }
  }

  if (ones.length === 0) return [];
  if (ones.length === numRows * numCols) {
    // All ones - single group covering everything
    return [{
      cells: ones,
      size: ones.length,
      term: '1',
    }];
  }

  // Possible group sizes (must be powers of 2)
  const groupSizes = [16, 8, 4, 2, 1].filter(s => s <= numRows * numCols);

  const covered = new Set();
  const validGroups = [];

  // Try to find groups starting from largest
  for (const size of groupSizes) {
    const possibleDimensions = getPossibleDimensions(size, numRows, numCols);

    for (const [height, width] of possibleDimensions) {
      // Try all starting positions
      for (let startR = 0; startR < numRows; startR++) {
        for (let startC = 0; startC < numCols; startC++) {
          const group = tryGroup(grid, startR, startC, height, width, numRows, numCols);
          
          if (group) {
            // Check if this group covers any uncovered cells
            const groupKey = group.cells
              .map(c => `${c.r},${c.c}`)
              .sort()
              .join('|');

            const hasNewCells = group.cells.some(
              c => !covered.has(`${c.r},${c.c}`)
            );

            if (hasNewCells) {
              // Calculate the term this group represents
              const term = calculateGroupTerm(group.cells, cellData, kmap);
              
              validGroups.push({
                ...group,
                term,
                key: groupKey,
              });

              // Mark cells as covered
              group.cells.forEach(c => covered.add(`${c.r},${c.c}`));
            }
          }
        }
      }
    }
  }

  // Remove redundant groups (groups fully contained in larger groups)
  return removeRedundantGroups(validGroups);
}

/**
 * Get possible dimensions for a group of given size
 */
function getPossibleDimensions(size, maxRows, maxCols) {
  const dimensions = [];
  
  for (let h = 1; h <= Math.min(size, maxRows); h++) {
    if (size % h === 0) {
      const w = size / h;
      if (w <= maxCols && isPowerOf2(h) && isPowerOf2(w)) {
        dimensions.push([h, w]);
      }
    }
  }
  
  return dimensions;
}

/**
 * Check if a number is a power of 2
 */
function isPowerOf2(n) {
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Try to form a group starting at given position with given dimensions
 */
function tryGroup(grid, startR, startC, height, width, numRows, numCols) {
  const cells = [];

  for (let dr = 0; dr < height; dr++) {
    for (let dc = 0; dc < width; dc++) {
      const r = (startR + dr) % numRows;
      const c = (startC + dc) % numCols;

      if (grid[r][c] !== 1) {
        return null; // Group contains a 0
      }

      cells.push({ r, c });
    }
  }

  return {
    cells,
    size: cells.length,
    startR,
    startC,
    height,
    width,
  };
}

/**
 * Calculate the Boolean term represented by a group
 */
function calculateGroupTerm(cells, cellData, kmap) {
  const { rowVars, colVars, rowHeaders, colHeaders } = kmap;
  const allVars = [...rowVars, ...colVars];

  // Find which variables are constant across the group
  const firstCell = cellData[cells[0].r][cells[0].c];
  const term = [];

  for (const v of allVars) {
    const firstValue = firstCell.assignment[v];
    const isConstant = cells.every(c => {
      const cell = cellData[c.r][c.c];
      return cell.assignment[v] === firstValue;
    });

    if (isConstant) {
      term.push(firstValue ? v : `${v}'`);
    }
  }

  return term.length > 0 ? term.join('') : '1';
}

/**
 * Remove redundant groups
 */
function removeRedundantGroups(groups) {
  // Sort by size descending
  groups.sort((a, b) => b.size - a.size);
  
  const essential = [];
  const covered = new Set();

  for (const group of groups) {
    const newCells = group.cells.filter(c => !covered.has(`${c.r},${c.c}`));
    
    if (newCells.length > 0) {
      essential.push(group);
      group.cells.forEach(c => covered.add(`${c.r},${c.c}`));
    }
  }

  return essential;
}

/**
 * Generate simplified SOP expression from K-map groups
 */
export function generateSimplifiedSOP(kmap, groups) {
  if (groups.length === 0) return '0';
  
  const terms = groups.map(g => g.term);
  
  // Remove duplicate terms
  const uniqueTerms = [...new Set(terms)];
  
  if (uniqueTerms.length === 1 && uniqueTerms[0] === '1') {
    return '1';
  }

  return uniqueTerms.join(' + ');
}

/**
 * Generate K-map visualization data for UI rendering
 */
export function generateKMapVisualization(kmap, groups) {
  const { grid, rowHeaders, colHeaders, rowVars, colVars, cellData, numRows, numCols } = kmap;

  // Assign colors to groups
  const groupColors = [
    'rgba(59, 130, 246, 0.3)',   // blue
    'rgba(239, 68, 68, 0.3)',    // red
    'rgba(34, 197, 94, 0.3)',    // green
    'rgba(168, 85, 247, 0.3)',   // purple
    'rgba(249, 115, 22, 0.3)',   // orange
    'rgba(236, 72, 153, 0.3)',   // pink
    'rgba(6, 182, 212, 0.3)',    // cyan
    'rgba(234, 179, 8, 0.3)',    // yellow
  ];

  const cellGroups = {};
  groups.forEach((group, idx) => {
    const color = groupColors[idx % groupColors.length];
    group.cells.forEach(c => {
      const key = `${c.r},${c.c}`;
      if (!cellGroups[key]) {
        cellGroups[key] = [];
      }
      cellGroups[key].push({ groupIndex: idx, color });
    });
  });

  return {
    rowHeaders,
    colHeaders,
    rowVars,
    colVars,
    grid,
    cellData,
    groups,
    cellGroups,
    numRows,
    numCols,
  };
}

export default {
  generateKMap,
  findKMapGroups,
  generateSimplifiedSOP,
  generateKMapVisualization,
};
