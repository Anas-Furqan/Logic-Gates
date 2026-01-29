/**
 * LogicLab Server - Logic Library
 * Re-exports from client logic library for server-side processing
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

/**
 * Token class
 */
export class Token {
  constructor(type, value, position) {
    this.type = type;
    this.value = value;
    this.position = position;
  }
}

/**
 * Lexer Error
 */
export class LexerError extends Error {
  constructor(message, position) {
    super(message);
    this.name = 'LexerError';
    this.position = position;
  }
}

/**
 * Lexer class
 */
export class Lexer {
  constructor(input) {
    this.input = input;
    this.position = 0;
    this.tokens = [];
  }

  isAtEnd() {
    return this.position >= this.input.length;
  }

  peek() {
    if (this.isAtEnd()) return null;
    return this.input[this.position];
  }

  advance() {
    if (this.isAtEnd()) return null;
    return this.input[this.position++];
  }

  skipWhitespace() {
    while (!this.isAtEnd() && /\s/.test(this.peek())) {
      this.advance();
    }
  }

  readIdentifier() {
    const startPos = this.position;
    let value = '';

    while (!this.isAtEnd() && /[a-zA-Z0-9_]/.test(this.peek())) {
      value += this.advance();
    }

    const upperValue = value.toUpperCase();
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

    if (upperValue === 'TRUE' || value === '1') {
      return new Token(TokenType.CONSTANT, 1, startPos);
    }
    if (upperValue === 'FALSE' || value === '0') {
      return new Token(TokenType.CONSTANT, 0, startPos);
    }

    return new Token(TokenType.VARIABLE, value, startPos);
  }

  tokenize() {
    this.tokens = [];

    while (!this.isAtEnd()) {
      this.skipWhitespace();
      if (this.isAtEnd()) break;

      const startPos = this.position;
      const char = this.peek();

      if (char === '(') { this.advance(); this.tokens.push(new Token(TokenType.LPAREN, '(', startPos)); continue; }
      if (char === ')') { this.advance(); this.tokens.push(new Token(TokenType.RPAREN, ')', startPos)); continue; }
      if (char === '&') { this.advance(); this.tokens.push(new Token(TokenType.AND, '&', startPos)); continue; }
      if (char === '|') { this.advance(); this.tokens.push(new Token(TokenType.OR, '|', startPos)); continue; }
      if (char === '~' || char === '!') { this.advance(); this.tokens.push(new Token(TokenType.NOT, '~', startPos)); continue; }
      if (char === '^') { this.advance(); this.tokens.push(new Token(TokenType.XOR, '^', startPos)); continue; }
      if (char === '+') { this.advance(); this.tokens.push(new Token(TokenType.OR, '+', startPos)); continue; }
      if (char === '.' || char === '*') { this.advance(); this.tokens.push(new Token(TokenType.AND, '.', startPos)); continue; }
      if (char === "'") { this.advance(); this.tokens.push(new Token(TokenType.NOT, "'", startPos)); continue; }
      if (char === '0') { this.advance(); this.tokens.push(new Token(TokenType.CONSTANT, 0, startPos)); continue; }
      if (char === '1') { this.advance(); this.tokens.push(new Token(TokenType.CONSTANT, 1, startPos)); continue; }
      if (/[a-zA-Z_]/.test(char)) { this.tokens.push(this.readIdentifier()); continue; }

      throw new LexerError(`Unexpected character '${char}'`, startPos);
    }

    this.tokens.push(new Token(TokenType.EOF, '', this.position));
    return this.tokens;
  }
}

// AST Node classes
class ASTNode {
  constructor(type) {
    this.type = type;
    this.id = `node_${++ASTNode.idCounter}`;
  }
  static idCounter = 0;
  static resetIds() { ASTNode.idCounter = 0; }
  getVariables() { return new Set(); }
  evaluate(values) { throw new Error('Not implemented'); }
  toString() { throw new Error('Not implemented'); }
}

export class VariableNode extends ASTNode {
  constructor(name) { super('VARIABLE'); this.name = name; }
  getVariables() { return new Set([this.name]); }
  evaluate(values) { return values[this.name] ? 1 : 0; }
  toString() { return this.name; }
}

export class ConstantNode extends ASTNode {
  constructor(value) { super('CONSTANT'); this.value = value ? 1 : 0; }
  evaluate() { return this.value; }
  toString() { return String(this.value); }
}

export class NotNode extends ASTNode {
  constructor(operand) { super('NOT'); this.operand = operand; }
  getVariables() { return this.operand.getVariables(); }
  evaluate(values) { return this.operand.evaluate(values) ? 0 : 1; }
  toString() { return `~(${this.operand.toString()})`; }
}

export class AndNode extends ASTNode {
  constructor(left, right) { super('AND'); this.left = left; this.right = right; }
  getVariables() { return new Set([...this.left.getVariables(), ...this.right.getVariables()]); }
  evaluate(values) { return (this.left.evaluate(values) && this.right.evaluate(values)) ? 1 : 0; }
  toString() { return `(${this.left.toString()} AND ${this.right.toString()})`; }
}

export class OrNode extends ASTNode {
  constructor(left, right) { super('OR'); this.left = left; this.right = right; }
  getVariables() { return new Set([...this.left.getVariables(), ...this.right.getVariables()]); }
  evaluate(values) { return (this.left.evaluate(values) || this.right.evaluate(values)) ? 1 : 0; }
  toString() { return `(${this.left.toString()} OR ${this.right.toString()})`; }
}

export class XorNode extends ASTNode {
  constructor(left, right) { super('XOR'); this.left = left; this.right = right; }
  getVariables() { return new Set([...this.left.getVariables(), ...this.right.getVariables()]); }
  evaluate(values) { return (this.left.evaluate(values) !== this.right.evaluate(values)) ? 1 : 0; }
  toString() { return `(${this.left.toString()} XOR ${this.right.toString()})`; }
}

export class NandNode extends ASTNode {
  constructor(left, right) { super('NAND'); this.left = left; this.right = right; }
  getVariables() { return new Set([...this.left.getVariables(), ...this.right.getVariables()]); }
  evaluate(values) { return (this.left.evaluate(values) && this.right.evaluate(values)) ? 0 : 1; }
  toString() { return `(${this.left.toString()} NAND ${this.right.toString()})`; }
}

export class NorNode extends ASTNode {
  constructor(left, right) { super('NOR'); this.left = left; this.right = right; }
  getVariables() { return new Set([...this.left.getVariables(), ...this.right.getVariables()]); }
  evaluate(values) { return (this.left.evaluate(values) || this.right.evaluate(values)) ? 0 : 1; }
  toString() { return `(${this.left.toString()} NOR ${this.right.toString()})`; }
}

export class XnorNode extends ASTNode {
  constructor(left, right) { super('XNOR'); this.left = left; this.right = right; }
  getVariables() { return new Set([...this.left.getVariables(), ...this.right.getVariables()]); }
  evaluate(values) { return (this.left.evaluate(values) === this.right.evaluate(values)) ? 1 : 0; }
  toString() { return `(${this.left.toString()} XNOR ${this.right.toString()})`; }
}

/**
 * Parser Error
 */
export class ParserError extends Error {
  constructor(message, token) {
    super(message);
    this.name = 'ParserError';
    this.token = token;
  }
}

/**
 * Parser class
 */
export class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.position = 0;
  }

  isAtEnd() { return this.peek().type === TokenType.EOF; }
  peek() { return this.tokens[this.position]; }
  previous() { return this.tokens[this.position - 1]; }
  advance() { if (!this.isAtEnd()) this.position++; return this.previous(); }
  check(type) { return !this.isAtEnd() && this.peek().type === type; }
  
  match(...types) {
    for (const type of types) {
      if (this.check(type)) { this.advance(); return true; }
    }
    return false;
  }

  consume(type, message) {
    if (this.check(type)) return this.advance();
    throw new ParserError(message, this.peek());
  }

  parse() {
    ASTNode.resetIds();
    const ast = this.expression();
    if (!this.isAtEnd()) throw new ParserError(`Unexpected token '${this.peek().value}'`, this.peek());
    return ast;
  }

  expression() { return this.orExpression(); }

  orExpression() {
    let left = this.xorExpression();
    while (this.match(TokenType.OR, TokenType.NOR)) {
      const op = this.previous();
      const right = this.xorExpression();
      left = op.type === TokenType.OR ? new OrNode(left, right) : new NorNode(left, right);
    }
    return left;
  }

  xorExpression() {
    let left = this.andExpression();
    while (this.match(TokenType.XOR, TokenType.XNOR)) {
      const op = this.previous();
      const right = this.andExpression();
      left = op.type === TokenType.XOR ? new XorNode(left, right) : new XnorNode(left, right);
    }
    return left;
  }

  andExpression() {
    let left = this.unary();
    while (this.match(TokenType.AND, TokenType.NAND)) {
      const op = this.previous();
      const right = this.unary();
      left = op.type === TokenType.AND ? new AndNode(left, right) : new NandNode(left, right);
    }
    while (this.check(TokenType.VARIABLE) || this.check(TokenType.LPAREN) || this.check(TokenType.CONSTANT)) {
      const right = this.unary();
      left = new AndNode(left, right);
    }
    return left;
  }

  unary() {
    if (this.match(TokenType.NOT)) return new NotNode(this.unary());
    return this.postfix();
  }

  postfix() {
    let node = this.primary();
    while (this.match(TokenType.NOT)) {
      if (this.previous().value === "'") node = new NotNode(node);
      else { this.position--; break; }
    }
    return node;
  }

  primary() {
    if (this.match(TokenType.CONSTANT)) return new ConstantNode(this.previous().value);
    if (this.match(TokenType.VARIABLE)) return new VariableNode(this.previous().value);
    if (this.match(TokenType.LPAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RPAREN, "Expected ')' after expression");
      return expr;
    }
    throw new ParserError(`Expected variable, constant, or '('`, this.peek());
  }
}

// Truth Table Generation
export function generateTruthTable(ast, variableOrder = null) {
  const variablesSet = ast.getVariables();
  const variables = variableOrder || Array.from(variablesSet).sort();
  const totalRows = Math.pow(2, variables.length);
  const rows = [];

  for (let i = 0; i < totalRows; i++) {
    const inputs = {};
    for (let j = 0; j < variables.length; j++) {
      const bitPosition = variables.length - 1 - j;
      inputs[variables[j]] = (i >> bitPosition) & 1;
    }
    
    let output;
    try { output = ast.evaluate(inputs); }
    catch { output = null; }
    
    rows.push({ index: i, inputs, output });
  }

  const stats = {
    totalRows: rows.length,
    trueCount: rows.filter(r => r.output === 1).length,
    falseCount: rows.filter(r => r.output === 0).length,
  };

  return { variables, rows, stats, expression: ast.toString() };
}

export function getMinterms(truthTable) {
  return truthTable.rows.filter(row => row.output === 1).map(row => row.index);
}

// Simplifier (Quine-McCluskey)
class Implicant {
  constructor(minterms, binary) {
    this.minterms = Array.isArray(minterms) ? minterms : [minterms];
    this.binary = binary;
    this.used = false;
  }

  countOnes() { return this.binary.split('').filter(c => c === '1').length; }

  canCombineWith(other) {
    if (this.binary.length !== other.binary.length) return null;
    let diffIndex = -1, diffCount = 0;
    for (let i = 0; i < this.binary.length; i++) {
      if (this.binary[i] === '-' || other.binary[i] === '-') {
        if (this.binary[i] !== other.binary[i]) return null;
        continue;
      }
      if (this.binary[i] !== other.binary[i]) {
        diffCount++;
        diffIndex = i;
        if (diffCount > 1) return null;
      }
    }
    return diffCount === 1 ? diffIndex : null;
  }

  combineWith(other, diffIndex) {
    const newBinary = this.binary.split('');
    newBinary[diffIndex] = '-';
    const newMinterms = [...new Set([...this.minterms, ...other.minterms])].sort((a, b) => a - b);
    return new Implicant(newMinterms, newBinary.join(''));
  }

  covers(minterm, numVars) {
    const mintermBinary = minterm.toString(2).padStart(numVars, '0');
    for (let i = 0; i < this.binary.length; i++) {
      if (this.binary[i] !== '-' && this.binary[i] !== mintermBinary[i]) return false;
    }
    return true;
  }

  toTerm(variables) {
    const literals = [];
    for (let i = 0; i < this.binary.length; i++) {
      if (this.binary[i] === '1') literals.push(variables[i]);
      else if (this.binary[i] === '0') literals.push(`${variables[i]}'`);
    }
    return literals.length > 0 ? literals.join('') : '1';
  }
}

export function quineMcCluskey(minterms, numVars, variables) {
  const steps = [];

  if (minterms.length === 0) return { primeImplicants: [], essentialImplicants: [], expression: '0', steps: [] };
  if (minterms.length === Math.pow(2, numVars)) return { primeImplicants: [], essentialImplicants: [], expression: '1', steps: [] };

  let implicants = minterms.map(m => new Implicant(m, m.toString(2).padStart(numVars, '0')));
  let primeImplicants = [];

  while (implicants.length > 0) {
    const groups = {};
    for (const imp of implicants) {
      const ones = imp.countOnes();
      if (!groups[ones]) groups[ones] = [];
      groups[ones].push(imp);
    }

    const groupKeys = Object.keys(groups).map(Number).sort((a, b) => a - b);
    const newImplicants = [];
    const usedImplicants = new Set();

    for (let i = 0; i < groupKeys.length - 1; i++) {
      for (const imp1 of groups[groupKeys[i]]) {
        for (const imp2 of groups[groupKeys[i + 1]]) {
          const diffIndex = imp1.canCombineWith(imp2);
          if (diffIndex !== null) {
            const combined = imp1.combineWith(imp2, diffIndex);
            if (!newImplicants.some(ni => ni.binary === combined.binary)) {
              newImplicants.push(combined);
            }
            usedImplicants.add(imp1);
            usedImplicants.add(imp2);
          }
        }
      }
    }

    for (const imp of implicants) {
      if (!usedImplicants.has(imp)) primeImplicants.push(imp);
    }

    implicants = newImplicants;
  }

  // Find essential prime implicants
  const essential = [];
  const covered = new Set();

  for (const minterm of minterms) {
    const coveringPIs = primeImplicants.filter(pi => pi.covers(minterm, numVars));
    if (coveringPIs.length === 1 && !essential.includes(coveringPIs[0])) {
      essential.push(coveringPIs[0]);
      coveringPIs[0].minterms.forEach(m => covered.add(m));
    }
  }

  const uncovered = minterms.filter(m => !covered.has(m));
  const remaining = primeImplicants.filter(pi => !essential.includes(pi));

  while (uncovered.length > 0) {
    let bestPI = null, bestCount = 0;
    for (const pi of remaining) {
      const count = uncovered.filter(m => pi.covers(m, numVars)).length;
      if (count > bestCount) { bestCount = count; bestPI = pi; }
    }
    if (bestPI && bestCount > 0) {
      essential.push(bestPI);
      const newUncovered = uncovered.filter(m => !bestPI.covers(m, numVars));
      uncovered.length = 0;
      uncovered.push(...newUncovered);
      remaining.splice(remaining.indexOf(bestPI), 1);
    } else break;
  }

  const terms = essential.map(ei => ei.toTerm(variables));
  const expression = terms.length > 0 ? terms.join(' + ') : '0';

  return { primeImplicants, essentialImplicants: essential, expression, steps };
}

export function simplifyExpression(truthTable) {
  const { variables, expression } = truthTable;
  const minterms = getMinterms(truthTable);
  const qmResult = quineMcCluskey(minterms, variables.length, variables);

  return {
    original: expression,
    simplified: qmResult.expression,
    primeImplicants: qmResult.primeImplicants,
    essentialImplicants: qmResult.essentialImplicants,
    steps: qmResult.steps,
    statistics: { originalGateCount: 0, simplifiedGateCount: 0, reduction: 0 },
  };
}

// Main processing function
export function processExpression(expression) {
  const lexer = new Lexer(expression);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const variables = Array.from(ast.getVariables()).sort();
  const truthTable = generateTruthTable(ast, variables);
  const simplification = variables.length <= 6 ? simplifyExpression(truthTable) : null;

  return { expression, tokens, ast, variables, truthTable, simplification };
}

export function validateExpression(expression) {
  try {
    const lexer = new Lexer(expression);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const variables = Array.from(ast.getVariables()).sort();
    return { valid: true, variables, variableCount: variables.length, error: null };
  } catch (error) {
    return { valid: false, variables: [], variableCount: 0, error: error.message };
  }
}

export default { processExpression, validateExpression };
