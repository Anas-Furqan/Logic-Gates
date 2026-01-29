/**
 * LogicLab - Boolean Expression Parser
 * Recursive descent parser that builds an AST from tokens
 * 
 * Grammar:
 *   expression     → or_expr
 *   or_expr        → xor_expr (('OR' | 'NOR' | '|' | '+') xor_expr)*
 *   xor_expr       → and_expr (('XOR' | 'XNOR' | '^') and_expr)*
 *   and_expr       → unary (('AND' | 'NAND' | '&' | '.') unary)*
 *   unary          → ('NOT' | '~' | '!') unary | postfix
 *   postfix        → primary ("'")*
 *   primary        → VARIABLE | CONSTANT | '(' expression ')'
 */

import { TokenType, Precedence, LexerError } from './lexer.js';
import {
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

/**
 * Parser error class
 */
export class ParserError extends Error {
  constructor(message, token) {
    super(message);
    this.name = 'ParserError';
    this.token = token;
  }

  toUserFriendly() {
    if (this.token) {
      return `Parse Error at position ${this.token.position}: ${this.message}`;
    }
    return `Parse Error: ${this.message}`;
  }
}

/**
 * Parser class - converts tokens to AST
 */
export class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.position = 0;
  }

  /**
   * Check if we've reached the end of tokens
   */
  isAtEnd() {
    return this.peek().type === TokenType.EOF;
  }

  /**
   * Get current token without advancing
   */
  peek() {
    return this.tokens[this.position];
  }

  /**
   * Get previous token
   */
  previous() {
    return this.tokens[this.position - 1];
  }

  /**
   * Advance to next token and return current
   */
  advance() {
    if (!this.isAtEnd()) {
      this.position++;
    }
    return this.previous();
  }

  /**
   * Check if current token matches given type
   */
  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  /**
   * If current token matches any of the given types, advance and return true
   */
  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  /**
   * Consume a token of expected type, or throw error
   */
  consume(type, message) {
    if (this.check(type)) {
      return this.advance();
    }
    throw new ParserError(message, this.peek());
  }

  /**
   * Parse the expression and return AST
   */
  parse() {
    ASTNode.resetIds();
    const ast = this.expression();
    
    if (!this.isAtEnd()) {
      throw new ParserError(
        `Unexpected token '${this.peek().value}' after expression`,
        this.peek()
      );
    }
    
    return ast;
  }

  /**
   * expression → or_expr
   */
  expression() {
    return this.orExpression();
  }

  /**
   * or_expr → xor_expr (('OR' | 'NOR') xor_expr)*
   */
  orExpression() {
    let left = this.xorExpression();

    while (this.match(TokenType.OR, TokenType.NOR)) {
      const operator = this.previous();
      const right = this.xorExpression();

      if (operator.type === TokenType.OR) {
        left = new OrNode(left, right);
      } else {
        left = new NorNode(left, right);
      }
    }

    return left;
  }

  /**
   * xor_expr → and_expr (('XOR' | 'XNOR') and_expr)*
   */
  xorExpression() {
    let left = this.andExpression();

    while (this.match(TokenType.XOR, TokenType.XNOR)) {
      const operator = this.previous();
      const right = this.andExpression();

      if (operator.type === TokenType.XOR) {
        left = new XorNode(left, right);
      } else {
        left = new XnorNode(left, right);
      }
    }

    return left;
  }

  /**
   * and_expr → unary (('AND' | 'NAND') unary)*
   */
  andExpression() {
    let left = this.unary();

    while (this.match(TokenType.AND, TokenType.NAND)) {
      const operator = this.previous();
      const right = this.unary();

      if (operator.type === TokenType.AND) {
        left = new AndNode(left, right);
      } else {
        left = new NandNode(left, right);
      }
    }

    // Handle implicit AND (e.g., "AB" means "A AND B")
    while (
      this.check(TokenType.VARIABLE) ||
      this.check(TokenType.LPAREN) ||
      this.check(TokenType.CONSTANT)
    ) {
      const right = this.unary();
      left = new AndNode(left, right);
    }

    return left;
  }

  /**
   * unary → ('NOT' | '~') unary | postfix
   */
  unary() {
    if (this.match(TokenType.NOT)) {
      const operand = this.unary();
      return new NotNode(operand);
    }

    return this.postfix();
  }

  /**
   * postfix → primary ("'")*
   * Handles postfix NOT notation like A'
   */
  postfix() {
    let node = this.primary();

    // Handle postfix NOT (apostrophe notation)
    while (this.match(TokenType.NOT)) {
      // Check if it's an apostrophe (postfix NOT)
      if (this.previous().value === "'") {
        node = new NotNode(node);
      } else {
        // It's a prefix NOT on the next term, put it back
        this.position--;
        break;
      }
    }

    return node;
  }

  /**
   * primary → VARIABLE | CONSTANT | '(' expression ')'
   */
  primary() {
    if (this.match(TokenType.CONSTANT)) {
      return new ConstantNode(this.previous().value);
    }

    if (this.match(TokenType.VARIABLE)) {
      return new VariableNode(this.previous().value);
    }

    if (this.match(TokenType.LPAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RPAREN, "Expected ')' after expression");
      return expr;
    }

    throw new ParserError(
      `Expected variable, constant, or '(' but found '${this.peek().value}'`,
      this.peek()
    );
  }
}

export default Parser;
