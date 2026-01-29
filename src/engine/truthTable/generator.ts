/**
 * LogicLab - Truth Table Generator
 * 
 * Generates complete truth tables from AST nodes.
 * Supports up to 8 variables (256 rows) for practical use.
 */

import { ASTNode, TruthTable, TruthTableRow } from '@/types';
import { 
  evaluate, 
  generateCombinations, 
  getMintermNumber 
} from '@/engine/evaluator';

const MAX_VARIABLES = 8;

/**
 * Generate a complete truth table for the given AST
 */
export function generateTruthTable(
  ast: ASTNode,
  variables: string[],
  expression: string
): TruthTable {
  // Validate variable count
  if (variables.length > MAX_VARIABLES) {
    throw new Error(
      `Too many variables (${variables.length}). Maximum supported: ${MAX_VARIABLES}`
    );
  }
  
  // Generate all combinations
  const combinations = generateCombinations(variables);
  const numCombinations = Math.pow(2, variables.length);
  
  // Build rows
  const rows: TruthTableRow[] = combinations.map((inputs, index) => {
    const output = evaluate(ast, inputs);
    const minterm = getMintermNumber(inputs, variables);
    
    return {
      inputs,
      output,
      minterm,
      maxterm: numCombinations - 1 - minterm, // Complement
    };
  });
  
  return {
    variables,
    rows,
    expression,
  };
}

/**
 * Get minterms (rows where output is 1)
 */
export function getMinterms(table: TruthTable): number[] {
  return table.rows
    .filter(row => row.output)
    .map(row => row.minterm);
}

/**
 * Get maxterms (rows where output is 0)
 */
export function getMaxterms(table: TruthTable): number[] {
  return table.rows
    .filter(row => !row.output)
    .map(row => row.minterm);
}

/**
 * Generate Sum of Products (SOP) expression from truth table
 */
export function generateSOP(table: TruthTable): string {
  const minterms = getMinterms(table);
  
  if (minterms.length === 0) {
    return '0';
  }
  
  if (minterms.length === Math.pow(2, table.variables.length)) {
    return '1';
  }
  
  const terms = minterms.map(minterm => {
    const row = table.rows.find(r => r.minterm === minterm)!;
    const literals = table.variables.map((v, i) => {
      return row.inputs[v] ? v : `${v}'`;
    });
    return literals.join('');
  });
  
  return terms.join(' + ');
}

/**
 * Generate Product of Sums (POS) expression from truth table
 */
export function generatePOS(table: TruthTable): string {
  const maxterms = getMaxterms(table);
  
  if (maxterms.length === 0) {
    return '1';
  }
  
  if (maxterms.length === Math.pow(2, table.variables.length)) {
    return '0';
  }
  
  const terms = maxterms.map(maxterm => {
    const row = table.rows.find(r => r.minterm === maxterm)!;
    const literals = table.variables.map((v, i) => {
      return row.inputs[v] ? `${v}'` : v;
    });
    return `(${literals.join(' + ')})`;
  });
  
  return terms.join('');
}

/**
 * Convert truth table to CSV format
 */
export function truthTableToCSV(table: TruthTable): string {
  const headers = [...table.variables, 'Output', 'Minterm'];
  const lines = [headers.join(',')];
  
  for (const row of table.rows) {
    const values = [
      ...table.variables.map(v => row.inputs[v] ? '1' : '0'),
      row.output ? '1' : '0',
      row.minterm.toString(),
    ];
    lines.push(values.join(','));
  }
  
  return lines.join('\n');
}

/**
 * Generate a LaTeX representation of the truth table
 */
export function truthTableToLaTeX(table: TruthTable): string {
  const cols = 'c'.repeat(table.variables.length + 1);
  const header = [...table.variables, 'F'].join(' & ');
  
  let latex = `\\begin{tabular}{|${cols}|}\n\\hline\n${header} \\\\\n\\hline\n`;
  
  for (const row of table.rows) {
    const values = [
      ...table.variables.map(v => row.inputs[v] ? '1' : '0'),
      row.output ? '1' : '0',
    ];
    latex += `${values.join(' & ')} \\\\\n`;
  }
  
  latex += '\\hline\n\\end{tabular}';
  return latex;
}

/**
 * Count the number of 1s (true outputs) in the truth table
 */
export function countOnes(table: TruthTable): number {
  return table.rows.filter(row => row.output).length;
}

/**
 * Count the number of 0s (false outputs) in the truth table
 */
export function countZeros(table: TruthTable): number {
  return table.rows.filter(row => !row.output).length;
}

/**
 * Check if the truth table represents a constant function
 */
export function isConstant(table: TruthTable): { isConstant: boolean; value?: boolean } {
  const ones = countOnes(table);
  const total = table.rows.length;
  
  if (ones === 0) {
    return { isConstant: true, value: false };
  }
  if (ones === total) {
    return { isConstant: true, value: true };
  }
  return { isConstant: false };
}

/**
 * Generate a compact string representation of the truth table
 */
export function truthTableToString(table: TruthTable): string {
  const maxVarLength = Math.max(...table.variables.map(v => v.length));
  const colWidth = Math.max(maxVarLength, 1);
  
  // Header
  const header = table.variables.map(v => v.padStart(colWidth)).join(' | ') + ' | F';
  const separator = '-'.repeat(header.length);
  
  let result = `${header}\n${separator}\n`;
  
  // Rows
  for (const row of table.rows) {
    const values = table.variables.map(v => 
      (row.inputs[v] ? '1' : '0').padStart(colWidth)
    );
    result += `${values.join(' | ')} | ${row.output ? '1' : '0'}\n`;
  }
  
  return result;
}
