/**
 * LogicLab - Main Logic Library Export
 * Central entry point for all logic processing functions
 */

// Lexer and Token types
export { Lexer, Token, TokenType, Precedence, LexerError } from './lexer.js';

// Parser
export { Parser, ParserError } from './parser.js';

// AST Node types
export {
  ASTNode,
  VariableNode,
  ConstantNode,
  NotNode,
  AndNode,
  OrNode,
  XorNode,
  NandNode,
  NorNode,
  XnorNode,
} from './ast.js';

// Truth Table
export {
  generateCombinations,
  generateTruthTable,
  formatTruthTableAsText,
  truthTableToCSV,
  getMinterms,
  getMaxterms,
  generateSOP,
  generatePOS,
} from './truthTable.js';

// K-Map
export {
  generateKMap,
  findKMapGroups,
  generateSimplifiedSOP,
  generateKMapVisualization,
} from './kmap.js';

// Simplifier
export {
  quineMcCluskey,
  applyBooleanLaws,
  simplifyExpression,
} from './simplifier.js';

// Circuit Graph
export {
  CircuitGraph,
  CircuitNode,
  CircuitEdge,
  CircuitNodeType,
  GateProperties,
} from './circuitGraph.js';

// Circuit Layout
export {
  layoutCircuit,
  centerLayout,
  LayoutConfig,
} from './circuitLayout.js';

/**
 * Parse and process a Boolean expression
 * Main entry point for expression processing
 * 
 * @param {string} expression - The Boolean expression to parse
 * @returns {Object} - Complete analysis result
 */
export function processExpression(expression) {
  // Lexical analysis
  const lexer = new Lexer(expression);
  const tokens = lexer.tokenize();

  // Parse to AST
  const parser = new Parser(tokens);
  const ast = parser.parse();

  // Extract variables
  const variables = Array.from(ast.getVariables()).sort();

  // Generate truth table
  const truthTable = generateTruthTable(ast, variables);

  // Generate circuit graph
  const circuit = CircuitGraph.fromAST(ast);
  const layout = layoutCircuit(circuit);

  // Generate K-map (if 2-4 variables)
  let kmap = null;
  let kmapGroups = null;
  
  if (variables.length >= 2 && variables.length <= 4) {
    kmap = generateKMap(truthTable);
    kmapGroups = findKMapGroups(kmap);
  }

  // Simplify expression
  const simplification = variables.length <= 6 
    ? simplifyExpression(truthTable)
    : null;

  return {
    expression,
    tokens,
    ast,
    variables,
    truthTable,
    circuit,
    layout,
    kmap,
    kmapGroups,
    simplification,
  };
}

/**
 * Validate a Boolean expression without full processing
 * 
 * @param {string} expression - The expression to validate
 * @returns {Object} - Validation result
 */
export function validateExpression(expression) {
  try {
    const lexer = new Lexer(expression);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const variables = Array.from(ast.getVariables()).sort();

    return {
      valid: true,
      variables,
      variableCount: variables.length,
      error: null,
    };
  } catch (error) {
    return {
      valid: false,
      variables: [],
      variableCount: 0,
      error: error.message || 'Invalid expression',
    };
  }
}

// Import Lexer class for default export
import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { CircuitGraph } from './circuitGraph.js';
import { generateTruthTable } from './truthTable.js';
import { generateKMap, findKMapGroups } from './kmap.js';
import { simplifyExpression } from './simplifier.js';
import { layoutCircuit } from './circuitLayout.js';

export default {
  processExpression,
  validateExpression,
};
