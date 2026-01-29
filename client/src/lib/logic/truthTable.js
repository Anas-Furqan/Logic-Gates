/**
 * LogicLab - Truth Table Generator
 * Generates complete truth tables from AST
 */

/**
 * Generate all possible combinations of input values
 * @param {string[]} variables - Array of variable names
 * @returns {Object[]} - Array of objects with variable assignments
 */
export function generateCombinations(variables) {
  const n = variables.length;
  const combinations = [];
  const totalRows = Math.pow(2, n);

  for (let i = 0; i < totalRows; i++) {
    const row = {};
    for (let j = 0; j < n; j++) {
      // Use Gray code ordering for better K-map compatibility
      const bitPosition = n - 1 - j;
      row[variables[j]] = (i >> bitPosition) & 1;
    }
    combinations.push(row);
  }

  return combinations;
}

/**
 * Generate a truth table from an AST
 * @param {ASTNode} ast - The abstract syntax tree
 * @param {string[]} [variableOrder] - Optional specific variable ordering
 * @returns {Object} - Truth table data
 */
export function generateTruthTable(ast, variableOrder = null) {
  // Extract variables from AST
  const variablesSet = ast.getVariables();
  const variables = variableOrder || Array.from(variablesSet).sort();

  // Generate all input combinations
  const combinations = generateCombinations(variables);

  // Evaluate each combination
  const rows = combinations.map((inputs, index) => {
    let output;
    let error = null;

    try {
      output = ast.evaluate(inputs);
    } catch (e) {
      output = null;
      error = e.message;
    }

    return {
      index,
      inputs: { ...inputs },
      output,
      error,
    };
  });

  // Calculate statistics
  const stats = {
    totalRows: rows.length,
    trueCount: rows.filter(r => r.output === 1).length,
    falseCount: rows.filter(r => r.output === 0).length,
    errorCount: rows.filter(r => r.error !== null).length,
  };

  return {
    variables,
    rows,
    stats,
    expression: ast.toString(),
  };
}

/**
 * Format truth table as a string (for console/text output)
 * @param {Object} truthTable - Truth table data
 * @returns {string} - Formatted string
 */
export function formatTruthTableAsText(truthTable) {
  const { variables, rows, expression } = truthTable;
  const lines = [];

  // Header
  lines.push(`Expression: ${expression}`);
  lines.push('');

  // Column headers
  const headers = [...variables, 'Output'];
  const columnWidth = Math.max(...headers.map(h => h.length), 6) + 2;
  
  lines.push(headers.map(h => h.padStart(columnWidth)).join('│'));
  lines.push('─'.repeat(columnWidth * headers.length + headers.length - 1));

  // Data rows
  for (const row of rows) {
    const values = [
      ...variables.map(v => String(row.inputs[v])),
      row.error ? 'ERR' : String(row.output),
    ];
    lines.push(values.map(v => v.padStart(columnWidth)).join('│'));
  }

  return lines.join('\n');
}

/**
 * Convert truth table to CSV format
 * @param {Object} truthTable - Truth table data
 * @returns {string} - CSV string
 */
export function truthTableToCSV(truthTable) {
  const { variables, rows, expression } = truthTable;
  const lines = [];

  // Add expression as comment
  lines.push(`# Expression: ${expression}`);
  
  // Header row
  lines.push([...variables, 'Output'].join(','));

  // Data rows
  for (const row of rows) {
    const values = [
      ...variables.map(v => row.inputs[v]),
      row.error ? 'ERROR' : row.output,
    ];
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

/**
 * Get minterms (rows where output = 1)
 * @param {Object} truthTable - Truth table data
 * @returns {number[]} - Array of minterm indices
 */
export function getMinterms(truthTable) {
  return truthTable.rows
    .filter(row => row.output === 1)
    .map(row => row.index);
}

/**
 * Get maxterms (rows where output = 0)
 * @param {Object} truthTable - Truth table data
 * @returns {number[]} - Array of maxterm indices
 */
export function getMaxterms(truthTable) {
  return truthTable.rows
    .filter(row => row.output === 0)
    .map(row => row.index);
}

/**
 * Generate SOP (Sum of Products) expression from truth table
 * @param {Object} truthTable - Truth table data
 * @returns {string} - SOP expression
 */
export function generateSOP(truthTable) {
  const { variables, rows } = truthTable;
  const minterms = rows.filter(row => row.output === 1);

  if (minterms.length === 0) return '0';
  if (minterms.length === rows.length) return '1';

  const terms = minterms.map(row => {
    const literals = variables.map(v => {
      return row.inputs[v] ? v : `${v}'`;
    });
    return literals.join('');
  });

  return terms.join(' + ');
}

/**
 * Generate POS (Product of Sums) expression from truth table
 * @param {Object} truthTable - Truth table data
 * @returns {string} - POS expression
 */
export function generatePOS(truthTable) {
  const { variables, rows } = truthTable;
  const maxterms = rows.filter(row => row.output === 0);

  if (maxterms.length === 0) return '1';
  if (maxterms.length === rows.length) return '0';

  const terms = maxterms.map(row => {
    const literals = variables.map(v => {
      return row.inputs[v] ? `${v}'` : v;
    });
    return `(${literals.join(' + ')})`;
  });

  return terms.join('');
}

export default {
  generateCombinations,
  generateTruthTable,
  formatTruthTableAsText,
  truthTableToCSV,
  getMinterms,
  getMaxterms,
  generateSOP,
  generatePOS,
};
