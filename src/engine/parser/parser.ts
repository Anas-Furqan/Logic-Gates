/**
 * LogicLab - Boolean Expression Parser
 * 
 * Implements a recursive descent parser that converts tokens into an AST.
 * Uses Pratt parsing (top-down operator precedence) for clean handling
 * of operator precedence and associativity.
 * 
 * Grammar (informal):
 *   expression := term ((OR | NOR) term)*
 *   term       := factor ((XOR | XNOR) factor)*
 *   factor     := unary ((AND | NAND) unary)*
 *   unary      := NOT unary | primary | primary "'"
 *   primary    := VARIABLE | LITERAL | "(" expression ")"
 */

import { nanoid } from 'nanoid';
import { 
  Token, 
  TokenType, 
  ASTNode, 
  ASTNodeType, 
  ParseError 
} from '@/types';
import { tokenize, isBinaryOperator, getOperatorPrecedence } from './lexer';

export class Parser {
  private tokens: Token[] = [];
  private current: number = 0;
  private variables: Set<string> = new Set();
  
  /**
   * Parse an expression string into an AST
   */
  parse(expression: string): { ast: ASTNode; variables: string[] } {
    // Reset state
    this.current = 0;
    this.variables = new Set();
    
    // Handle empty expression
    if (!expression.trim()) {
      throw this.error('Expression cannot be empty', 0, 0);
    }
    
    // Tokenize
    this.tokens = tokenize(expression);
    
    // Parse
    const ast = this.parseExpression();
    
    // Ensure we consumed all tokens
    if (!this.isAtEnd()) {
      const token = this.peek();
      throw this.error(
        `Unexpected token: ${token.value}`,
        token.position,
        token.length
      );
    }
    
    // Return AST and sorted variables
    return {
      ast,
      variables: Array.from(this.variables).sort(),
    };
  }
  
  /**
   * Parse OR/NOR level (lowest precedence binary ops)
   */
  private parseExpression(): ASTNode {
    let left = this.parseTerm();
    
    while (this.match(TokenType.OR, TokenType.NOR)) {
      const operator = this.previous();
      const right = this.parseTerm();
      left = this.createBinaryNode(operator.type, left, right);
    }
    
    return left;
  }
  
  /**
   * Parse XOR/XNOR level
   */
  private parseTerm(): ASTNode {
    let left = this.parseFactor();
    
    while (this.match(TokenType.XOR, TokenType.XNOR)) {
      const operator = this.previous();
      const right = this.parseFactor();
      left = this.createBinaryNode(operator.type, left, right);
    }
    
    return left;
  }
  
  /**
   * Parse AND/NAND level
   */
  private parseFactor(): ASTNode {
    let left = this.parseUnary();
    
    while (this.match(TokenType.AND, TokenType.NAND)) {
      const operator = this.previous();
      const right = this.parseUnary();
      left = this.createBinaryNode(operator.type, left, right);
    }
    
    // Handle implicit AND (e.g., "AB" means "A AND B")
    while (this.check(TokenType.VARIABLE) || 
           this.check(TokenType.LPAREN) || 
           this.check(TokenType.NOT) ||
           this.check(TokenType.LITERAL)) {
      const right = this.parseUnary();
      left = this.createBinaryNode(TokenType.AND, left, right);
    }
    
    return left;
  }
  
  /**
   * Parse NOT level (prefix and postfix)
   */
  private parseUnary(): ASTNode {
    // Prefix NOT: ~A, !A, NOT A
    if (this.match(TokenType.NOT)) {
      const operand = this.parseUnary();
      return this.createUnaryNode(operand);
    }
    
    let node = this.parsePrimary();
    
    // Postfix NOT: A'
    while (this.check(TokenType.NOT) && this.peek().value === "'") {
      this.advance();
      node = this.createUnaryNode(node);
    }
    
    return node;
  }
  
  /**
   * Parse primary expressions (variables, literals, parenthesized)
   */
  private parsePrimary(): ASTNode {
    // Literal
    if (this.match(TokenType.LITERAL)) {
      const token = this.previous();
      return {
        type: ASTNodeType.LITERAL,
        value: token.value === '1',
        id: nanoid(8),
      };
    }
    
    // Variable
    if (this.match(TokenType.VARIABLE)) {
      const token = this.previous();
      this.variables.add(token.value);
      return {
        type: ASTNodeType.VARIABLE,
        name: token.value,
        id: nanoid(8),
      };
    }
    
    // Parenthesized expression
    if (this.match(TokenType.LPAREN)) {
      const expr = this.parseExpression();
      
      if (!this.match(TokenType.RPAREN)) {
        const token = this.peek();
        throw this.error(
          'Missing closing parenthesis',
          token.position,
          token.length,
          'Add a ) to close the parenthesis'
        );
      }
      
      return expr;
    }
    
    // Unexpected token
    const token = this.peek();
    throw this.error(
      token.type === TokenType.EOF 
        ? 'Unexpected end of expression' 
        : `Expected variable or value, got: ${token.value}`,
      token.position,
      token.length
    );
  }
  
  // =========================================================================
  // AST Node Constructors
  // =========================================================================
  
  private createBinaryNode(
    operatorType: TokenType, 
    left: ASTNode, 
    right: ASTNode
  ): ASTNode {
    const typeMap: Record<string, ASTNodeType> = {
      [TokenType.AND]: ASTNodeType.AND,
      [TokenType.OR]: ASTNodeType.OR,
      [TokenType.XOR]: ASTNodeType.XOR,
      [TokenType.NAND]: ASTNodeType.NAND,
      [TokenType.NOR]: ASTNodeType.NOR,
      [TokenType.XNOR]: ASTNodeType.XNOR,
    };
    
    return {
      type: typeMap[operatorType],
      left,
      right,
      id: nanoid(8),
    } as ASTNode;
  }
  
  private createUnaryNode(operand: ASTNode): ASTNode {
    return {
      type: ASTNodeType.NOT,
      operand,
      id: nanoid(8),
    };
  }
  
  // =========================================================================
  // Token Helpers
  // =========================================================================
  
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }
  
  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }
  
  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }
  
  private peek(): Token {
    return this.tokens[this.current];
  }
  
  private previous(): Token {
    return this.tokens[this.current - 1];
  }
  
  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }
  
  // =========================================================================
  // Error Handling
  // =========================================================================
  
  private error(
    message: string, 
    position: number, 
    length: number,
    suggestion?: string
  ): ParseError {
    return {
      message,
      position,
      length,
      suggestion,
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse a boolean expression string into an AST
 */
export function parseExpression(expression: string): { 
  ast: ASTNode; 
  variables: string[];
  error: ParseError | null;
} {
  const parser = new Parser();
  
  try {
    const result = parser.parse(expression);
    return { ...result, error: null };
  } catch (e) {
    if (isParseError(e)) {
      return { 
        ast: null as unknown as ASTNode, 
        variables: [], 
        error: e 
      };
    }
    // Re-throw unexpected errors
    throw e;
  }
}

/**
 * Type guard for ParseError
 */
function isParseError(e: unknown): e is ParseError {
  return (
    typeof e === 'object' &&
    e !== null &&
    'message' in e &&
    'position' in e
  );
}

/**
 * Convert AST to a human-readable string representation
 */
export function astToString(node: ASTNode): string {
  switch (node.type) {
    case ASTNodeType.VARIABLE:
      return node.name;
      
    case ASTNodeType.LITERAL:
      return node.value ? '1' : '0';
      
    case ASTNodeType.NOT:
      const operandStr = astToString(node.operand);
      // Add parens if operand is complex
      if (node.operand.type !== ASTNodeType.VARIABLE && 
          node.operand.type !== ASTNodeType.LITERAL) {
        return `~(${operandStr})`;
      }
      return `~${operandStr}`;
      
    case ASTNodeType.AND:
    case ASTNodeType.OR:
    case ASTNodeType.XOR:
    case ASTNodeType.NAND:
    case ASTNodeType.NOR:
    case ASTNodeType.XNOR:
      const leftStr = astToString(node.left);
      const rightStr = astToString(node.right);
      const op = getOperatorSymbol(node.type);
      return `(${leftStr} ${op} ${rightStr})`;
      
    default:
      return '?';
  }
}

/**
 * Get the symbolic representation of an operator
 */
function getOperatorSymbol(type: ASTNodeType): string {
  const symbols: Record<string, string> = {
    [ASTNodeType.AND]: '∧',
    [ASTNodeType.OR]: '∨',
    [ASTNodeType.XOR]: '⊕',
    [ASTNodeType.NAND]: '↑',
    [ASTNodeType.NOR]: '↓',
    [ASTNodeType.XNOR]: '⊙',
  };
  return symbols[type] || '?';
}

/**
 * Extract all variable names from an AST
 */
export function extractVariables(node: ASTNode): string[] {
  const variables = new Set<string>();
  
  function traverse(n: ASTNode) {
    switch (n.type) {
      case ASTNodeType.VARIABLE:
        variables.add(n.name);
        break;
      case ASTNodeType.NOT:
        traverse(n.operand);
        break;
      case ASTNodeType.AND:
      case ASTNodeType.OR:
      case ASTNodeType.XOR:
      case ASTNodeType.NAND:
      case ASTNodeType.NOR:
      case ASTNodeType.XNOR:
        traverse(n.left);
        traverse(n.right);
        break;
    }
  }
  
  traverse(node);
  return Array.from(variables).sort();
}

/**
 * Clone an AST node (deep copy)
 */
export function cloneAST(node: ASTNode): ASTNode {
  switch (node.type) {
    case ASTNodeType.VARIABLE:
      return { ...node, id: nanoid(8) };
      
    case ASTNodeType.LITERAL:
      return { ...node, id: nanoid(8) };
      
    case ASTNodeType.NOT:
      return {
        type: ASTNodeType.NOT,
        operand: cloneAST(node.operand),
        id: nanoid(8),
      };
      
    default:
      const binaryNode = node as { left: ASTNode; right: ASTNode };
      return {
        ...node,
        left: cloneAST(binaryNode.left),
        right: cloneAST(binaryNode.right),
        id: nanoid(8),
      } as ASTNode;
  }
}
