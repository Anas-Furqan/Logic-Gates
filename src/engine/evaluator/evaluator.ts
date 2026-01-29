/**
 * LogicLab - Boolean Expression Evaluator
 * 
 * Evaluates AST nodes against a given set of input values.
 * Provides both single-evaluation and batch-evaluation capabilities.
 */

import { ASTNode, ASTNodeType } from '@/types';

export type VariableBindings = Record<string, boolean>;

/**
 * Evaluate an AST node with the given variable bindings
 */
export function evaluate(
  node: ASTNode, 
  bindings: VariableBindings
): boolean {
  switch (node.type) {
    case ASTNodeType.VARIABLE:
      const value = bindings[node.name];
      if (value === undefined) {
        throw new Error(`Undefined variable: ${node.name}`);
      }
      return value;
      
    case ASTNodeType.LITERAL:
      return node.value;
      
    case ASTNodeType.NOT:
      return !evaluate(node.operand, bindings);
      
    case ASTNodeType.AND:
      return evaluate(node.left, bindings) && evaluate(node.right, bindings);
      
    case ASTNodeType.OR:
      return evaluate(node.left, bindings) || evaluate(node.right, bindings);
      
    case ASTNodeType.XOR:
      return evaluate(node.left, bindings) !== evaluate(node.right, bindings);
      
    case ASTNodeType.NAND:
      return !(evaluate(node.left, bindings) && evaluate(node.right, bindings));
      
    case ASTNodeType.NOR:
      return !(evaluate(node.left, bindings) || evaluate(node.right, bindings));
      
    case ASTNodeType.XNOR:
      return evaluate(node.left, bindings) === evaluate(node.right, bindings);
      
    default:
      throw new Error(`Unknown node type: ${(node as ASTNode).type}`);
  }
}

/**
 * Evaluate an AST node and track values at each sub-node
 * Useful for circuit simulation to show values at each gate
 */
export function evaluateWithTrace(
  node: ASTNode,
  bindings: VariableBindings
): { result: boolean; trace: Map<string, boolean> } {
  const trace = new Map<string, boolean>();
  
  function eval_trace(n: ASTNode): boolean {
    let result: boolean;
    
    switch (n.type) {
      case ASTNodeType.VARIABLE:
        result = bindings[n.name];
        if (result === undefined) {
          throw new Error(`Undefined variable: ${n.name}`);
        }
        break;
        
      case ASTNodeType.LITERAL:
        result = n.value;
        break;
        
      case ASTNodeType.NOT:
        result = !eval_trace(n.operand);
        break;
        
      case ASTNodeType.AND:
        result = eval_trace(n.left) && eval_trace(n.right);
        break;
        
      case ASTNodeType.OR:
        result = eval_trace(n.left) || eval_trace(n.right);
        break;
        
      case ASTNodeType.XOR:
        result = eval_trace(n.left) !== eval_trace(n.right);
        break;
        
      case ASTNodeType.NAND:
        result = !(eval_trace(n.left) && eval_trace(n.right));
        break;
        
      case ASTNodeType.NOR:
        result = !(eval_trace(n.left) || eval_trace(n.right));
        break;
        
      case ASTNodeType.XNOR:
        result = eval_trace(n.left) === eval_trace(n.right);
        break;
        
      default:
        throw new Error(`Unknown node type`);
    }
    
    trace.set(n.id, result);
    return result;
  }
  
  const result = eval_trace(node);
  return { result, trace };
}

/**
 * Generate all possible input combinations for n variables
 */
export function generateCombinations(variables: string[]): VariableBindings[] {
  const n = variables.length;
  const count = Math.pow(2, n);
  const combinations: VariableBindings[] = [];
  
  for (let i = 0; i < count; i++) {
    const binding: VariableBindings = {};
    for (let j = 0; j < n; j++) {
      // MSB first ordering
      binding[variables[j]] = Boolean((i >> (n - 1 - j)) & 1);
    }
    combinations.push(binding);
  }
  
  return combinations;
}

/**
 * Evaluate AST for all possible input combinations
 * Returns an array of results indexed by minterm number
 */
export function evaluateAll(
  node: ASTNode,
  variables: string[]
): boolean[] {
  const combinations = generateCombinations(variables);
  return combinations.map(binding => evaluate(node, binding));
}

/**
 * Get the minterm number for a given variable binding
 */
export function getMintermNumber(
  binding: VariableBindings, 
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
 * Get the maxterm number for a given variable binding
 */
export function getMaxtermNumber(
  binding: VariableBindings,
  variables: string[]
): number {
  // Maxterm is the complement of minterm numbering
  return getMintermNumber(binding, variables);
}

/**
 * Convert a minterm number to variable bindings
 */
export function mintermToBinding(
  minterm: number,
  variables: string[]
): VariableBindings {
  const binding: VariableBindings = {};
  const n = variables.length;
  
  for (let i = 0; i < n; i++) {
    binding[variables[i]] = Boolean((minterm >> (n - 1 - i)) & 1);
  }
  
  return binding;
}
