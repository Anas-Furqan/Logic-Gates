/**
 * LogicLab - Boolean Expression Lexer
 * Tokenizes Boolean expressions into a stream of tokens
 */

// Token types enumeration
export const TokenType = {
  VARIABLE: 'VARIABLE',
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',
  XOR: 'XOR',
  NAND: 'NAND',
  NOR: 'NOR',
  XNOR: 'XNOR',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  CONSTANT: 'CONSTANT',
  EOF: 'EOF',
};

// Operator precedence (higher = binds tighter)
export const Precedence = {
  [TokenType.OR]: 1,
  [TokenType.NOR]: 1,
  [TokenType.XOR]: 2,
  [TokenType.XNOR]: 2,
  [TokenType.AND]: 3,
  [TokenType.NAND]: 3,
  [TokenType.NOT]: 4,
};

/**
 * Token class representing a single lexical unit
 */
export class Token {
  constructor(type, value, position) {
    this.type = type;
    this.value = value;
    this.position = position;
  }

  toString() {
    return `Token(${this.type}, "${this.value}", pos=${this.position})`;
  }
}

/**
 * Lexer class - converts input string to tokens
 */
export class Lexer {
  constructor(input) {
    this.input = input;
    this.position = 0;
    this.tokens = [];
  }

  /**
   * Check if we've reached the end of input
   */
  isAtEnd() {
    return this.position >= this.input.length;
  }

  /**
   * Get current character without advancing
   */
  peek() {
    if (this.isAtEnd()) return null;
    return this.input[this.position];
  }

  /**
   * Get current character and advance position
   */
  advance() {
    if (this.isAtEnd()) return null;
    return this.input[this.position++];
  }

  /**
   * Skip whitespace characters
   */
  skipWhitespace() {
    while (!this.isAtEnd() && /\s/.test(this.peek())) {
      this.advance();
    }
  }

  /**
   * Read a keyword or variable name
   */
  readIdentifier() {
    const startPos = this.position;
    let value = '';

    while (!this.isAtEnd() && /[a-zA-Z0-9_]/.test(this.peek())) {
      value += this.advance();
    }

    const upperValue = value.toUpperCase();

    // Check for keywords
    const keywords = {
      'AND': TokenType.AND,
      'OR': TokenType.OR,
      'NOT': TokenType.NOT,
      'XOR': TokenType.XOR,
      'NAND': TokenType.NAND,
      'NOR': TokenType.NOR,
      'XNOR': TokenType.XNOR,
    };

    if (keywords[upperValue]) {
      return new Token(keywords[upperValue], upperValue, startPos);
    }

    // Check for boolean constants
    if (upperValue === 'TRUE' || value === '1') {
      return new Token(TokenType.CONSTANT, 1, startPos);
    }
    if (upperValue === 'FALSE' || value === '0') {
      return new Token(TokenType.CONSTANT, 0, startPos);
    }

    // Otherwise it's a variable
    return new Token(TokenType.VARIABLE, value, startPos);
  }

  /**
   * Tokenize the entire input
   */
  tokenize() {
    this.tokens = [];

    while (!this.isAtEnd()) {
      this.skipWhitespace();
      if (this.isAtEnd()) break;

      const startPos = this.position;
      const char = this.peek();

      // Single character tokens
      if (char === '(') {
        this.advance();
        this.tokens.push(new Token(TokenType.LPAREN, '(', startPos));
        continue;
      }

      if (char === ')') {
        this.advance();
        this.tokens.push(new Token(TokenType.RPAREN, ')', startPos));
        continue;
      }

      // Operators
      if (char === '&') {
        this.advance();
        this.tokens.push(new Token(TokenType.AND, '&', startPos));
        continue;
      }

      if (char === '|') {
        this.advance();
        this.tokens.push(new Token(TokenType.OR, '|', startPos));
        continue;
      }

      if (char === '~' || char === '!') {
        this.advance();
        this.tokens.push(new Token(TokenType.NOT, '~', startPos));
        continue;
      }

      if (char === '^') {
        this.advance();
        this.tokens.push(new Token(TokenType.XOR, '^', startPos));
        continue;
      }

      if (char === '+') {
        this.advance();
        this.tokens.push(new Token(TokenType.OR, '+', startPos));
        continue;
      }

      if (char === '.') {
        this.advance();
        this.tokens.push(new Token(TokenType.AND, '.', startPos));
        continue;
      }

      if (char === '*') {
        this.advance();
        this.tokens.push(new Token(TokenType.AND, '*', startPos));
        continue;
      }

      // NOT as postfix apostrophe (A')
      if (char === "'") {
        this.advance();
        this.tokens.push(new Token(TokenType.NOT, "'", startPos));
        continue;
      }

      // XOR symbol ⊕
      if (char === '⊕') {
        this.advance();
        this.tokens.push(new Token(TokenType.XOR, '⊕', startPos));
        continue;
      }

      // Constants
      if (char === '0') {
        this.advance();
        this.tokens.push(new Token(TokenType.CONSTANT, 0, startPos));
        continue;
      }

      if (char === '1') {
        this.advance();
        this.tokens.push(new Token(TokenType.CONSTANT, 1, startPos));
        continue;
      }

      // Identifiers (variables and keywords)
      if (/[a-zA-Z_]/.test(char)) {
        this.tokens.push(this.readIdentifier());
        continue;
      }

      // Unknown character
      throw new LexerError(`Unexpected character '${char}'`, startPos);
    }

    this.tokens.push(new Token(TokenType.EOF, '', this.position));
    return this.tokens;
  }
}

/**
 * Custom error class for lexer errors
 */
export class LexerError extends Error {
  constructor(message, position) {
    super(message);
    this.name = 'LexerError';
    this.position = position;
  }

  toUserFriendly(input) {
    const line = input.substring(0, this.position).split('\n').length;
    const column = this.position - input.lastIndexOf('\n', this.position - 1);
    return `Syntax Error at position ${this.position} (line ${line}, column ${column}): ${this.message}`;
  }
}

export default Lexer;
