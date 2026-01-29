/**
 * LogicLab - Boolean Expression Lexer
 * 
 * Tokenizes boolean expressions into a stream of tokens.
 * Supports multiple syntaxes for each operator for user flexibility.
 * 
 * Supported operators:
 * - AND: AND, &, ., ∧, *
 * - OR:  OR, |, +, ∨
 * - NOT: NOT, ~, !, ¬, '
 * - XOR: XOR, ^, ⊕
 * - NAND: NAND, ↑
 * - NOR:  NOR, ↓
 * - XNOR: XNOR, ⊙, ↔
 */

import { Token, TokenType, ParseError } from '@/types';

// Token patterns mapped to their types
const TOKEN_PATTERNS: Array<{ pattern: RegExp; type: TokenType | null }> = [
  // Whitespace (ignored)
  { pattern: /^\s+/, type: null },
  
  // Keywords (must come before variable pattern)
  { pattern: /^XNOR\b/i, type: TokenType.XNOR },
  { pattern: /^NAND\b/i, type: TokenType.NAND },
  { pattern: /^NOR\b/i, type: TokenType.NOR },
  { pattern: /^XOR\b/i, type: TokenType.XOR },
  { pattern: /^AND\b/i, type: TokenType.AND },
  { pattern: /^OR\b/i, type: TokenType.OR },
  { pattern: /^NOT\b/i, type: TokenType.NOT },
  
  // Literals
  { pattern: /^[01](?![a-zA-Z0-9_])/, type: TokenType.LITERAL },
  { pattern: /^(true|false)\b/i, type: TokenType.LITERAL },
  
  // Variables (single letter or letter followed by digits/underscores)
  { pattern: /^[a-zA-Z][a-zA-Z0-9_]*/, type: TokenType.VARIABLE },
  
  // Parentheses
  { pattern: /^\(/, type: TokenType.LPAREN },
  { pattern: /^\)/, type: TokenType.RPAREN },
  
  // Symbolic operators - AND
  { pattern: /^[&∧]/, type: TokenType.AND },
  { pattern: /^\.(?![0-9])/, type: TokenType.AND },  // Dot not followed by digit
  { pattern: /^\*/, type: TokenType.AND },
  
  // Symbolic operators - OR
  { pattern: /^[|∨]/, type: TokenType.OR },
  { pattern: /^\+/, type: TokenType.OR },
  
  // Symbolic operators - NOT
  { pattern: /^[~!¬]/, type: TokenType.NOT },
  { pattern: /^'/, type: TokenType.NOT },  // Postfix NOT will be handled in parser
  
  // Symbolic operators - XOR
  { pattern: /^[\^⊕]/, type: TokenType.XOR },
  
  // Symbolic operators - NAND/NOR/XNOR
  { pattern: /^↑/, type: TokenType.NAND },
  { pattern: /^↓/, type: TokenType.NOR },
  { pattern: /^[⊙↔]/, type: TokenType.XNOR },
];

export class Lexer {
  private input: string;
  private position: number = 0;
  private tokens: Token[] = [];
  
  constructor(input: string) {
    this.input = input;
  }
  
  /**
   * Tokenize the entire input string
   */
  tokenize(): Token[] {
    this.tokens = [];
    this.position = 0;
    
    while (this.position < this.input.length) {
      const token = this.nextToken();
      if (token) {
        this.tokens.push(token);
      }
    }
    
    // Add EOF token
    this.tokens.push({
      type: TokenType.EOF,
      value: '',
      position: this.position,
      length: 0,
    });
    
    return this.tokens;
  }
  
  /**
   * Get the next token from input
   */
  private nextToken(): Token | null {
    const remaining = this.input.slice(this.position);
    
    for (const { pattern, type } of TOKEN_PATTERNS) {
      const match = remaining.match(pattern);
      
      if (match) {
        const value = match[0];
        const startPos = this.position;
        this.position += value.length;
        
        // Skip whitespace
        if (type === null) {
          return null;
        }
        
        return {
          type,
          value: this.normalizeValue(type, value),
          position: startPos,
          length: value.length,
        };
      }
    }
    
    // Unknown character - throw error
    throw this.createError(
      `Unexpected character: '${remaining[0]}'`,
      this.position,
      1
    );
  }
  
  /**
   * Normalize token values for consistent representation
   */
  private normalizeValue(type: TokenType, value: string): string {
    switch (type) {
      case TokenType.VARIABLE:
        return value.toUpperCase();
      case TokenType.LITERAL:
        const lower = value.toLowerCase();
        return lower === 'true' || lower === '1' ? '1' : '0';
      default:
        return value;
    }
  }
  
  /**
   * Create a parse error with context
   */
  private createError(message: string, position: number, length: number): ParseError {
    return {
      message,
      position,
      length,
      suggestion: this.getSuggestion(position),
    };
  }
  
  /**
   * Provide helpful suggestions for common errors
   */
  private getSuggestion(position: number): string | undefined {
    const char = this.input[position];
    
    const suggestions: Record<string, string> = {
      '[': 'Use parentheses () instead of brackets []',
      ']': 'Use parentheses () instead of brackets []',
      '{': 'Use parentheses () instead of braces {}',
      '}': 'Use parentheses () instead of braces {}',
      '=': 'Use AND (&), OR (|), or XOR (^) operators',
      '<': 'Invalid operator. Did you mean NOR (↓)?',
      '>': 'Invalid operator. Did you mean NAND (↑)?',
      '@': 'Unknown symbol. Supported: AND (&), OR (|), NOT (~), XOR (^)',
      '#': 'Unknown symbol. Supported: AND (&), OR (|), NOT (~), XOR (^)',
      '$': 'Unknown symbol. Supported: AND (&), OR (|), NOT (~), XOR (^)',
    };
    
    return suggestions[char];
  }
}

/**
 * Utility function to tokenize an expression
 */
export function tokenize(expression: string): Token[] {
  const lexer = new Lexer(expression);
  return lexer.tokenize();
}

/**
 * Check if a token is a binary operator
 */
export function isBinaryOperator(type: TokenType): boolean {
  return [
    TokenType.AND,
    TokenType.OR,
    TokenType.XOR,
    TokenType.NAND,
    TokenType.NOR,
    TokenType.XNOR,
  ].includes(type);
}

/**
 * Get operator precedence (higher = binds tighter)
 * 
 * Precedence levels:
 * 1. NOT (highest)
 * 2. AND, NAND
 * 3. XOR, XNOR
 * 4. OR, NOR (lowest)
 */
export function getOperatorPrecedence(type: TokenType): number {
  switch (type) {
    case TokenType.NOT:
      return 4;
    case TokenType.AND:
    case TokenType.NAND:
      return 3;
    case TokenType.XOR:
    case TokenType.XNOR:
      return 2;
    case TokenType.OR:
    case TokenType.NOR:
      return 1;
    default:
      return 0;
  }
}
