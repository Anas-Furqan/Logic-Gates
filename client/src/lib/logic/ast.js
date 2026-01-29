/**
 * LogicLab - Abstract Syntax Tree (AST) Node Types
 * Defines all node types for representing Boolean expressions
 */

/**
 * Base AST Node class
 */
export class ASTNode {
  constructor(type) {
    this.type = type;
    this.id = ASTNode.generateId();
  }

  static idCounter = 0;
  
  static generateId() {
    return `node_${++ASTNode.idCounter}`;
  }

  static resetIds() {
    ASTNode.idCounter = 0;
  }

  /**
   * Get all variables used in this node and its children
   */
  getVariables() {
    return new Set();
  }

  /**
   * Evaluate the node given variable values
   */
  evaluate(values) {
    throw new Error('evaluate() must be implemented by subclass');
  }

  /**
   * Convert to human-readable string
   */
  toString() {
    throw new Error('toString() must be implemented by subclass');
  }

  /**
   * Clone this node and all children
   */
  clone() {
    throw new Error('clone() must be implemented by subclass');
  }
}

/**
 * Variable node (e.g., A, B, x, y)
 */
export class VariableNode extends ASTNode {
  constructor(name) {
    super('VARIABLE');
    this.name = name;
  }

  getVariables() {
    return new Set([this.name]);
  }

  evaluate(values) {
    if (!(this.name in values)) {
      throw new Error(`Variable '${this.name}' is not defined`);
    }
    return values[this.name] ? 1 : 0;
  }

  toString() {
    return this.name;
  }

  clone() {
    return new VariableNode(this.name);
  }
}

/**
 * Constant node (0 or 1)
 */
export class ConstantNode extends ASTNode {
  constructor(value) {
    super('CONSTANT');
    this.value = value ? 1 : 0;
  }

  getVariables() {
    return new Set();
  }

  evaluate() {
    return this.value;
  }

  toString() {
    return String(this.value);
  }

  clone() {
    return new ConstantNode(this.value);
  }
}

/**
 * NOT node (unary operator)
 */
export class NotNode extends ASTNode {
  constructor(operand) {
    super('NOT');
    this.operand = operand;
    this.gateType = 'NOT';
  }

  getVariables() {
    return this.operand.getVariables();
  }

  evaluate(values) {
    return this.operand.evaluate(values) ? 0 : 1;
  }

  toString() {
    const operandStr = this.operand.toString();
    if (this.operand instanceof VariableNode || this.operand instanceof ConstantNode) {
      return `~${operandStr}`;
    }
    return `~(${operandStr})`;
  }

  clone() {
    return new NotNode(this.operand.clone());
  }
}

/**
 * Binary operator base class
 */
export class BinaryNode extends ASTNode {
  constructor(type, left, right, gateType) {
    super(type);
    this.left = left;
    this.right = right;
    this.gateType = gateType;
  }

  getVariables() {
    const leftVars = this.left.getVariables();
    const rightVars = this.right.getVariables();
    return new Set([...leftVars, ...rightVars]);
  }

  clone() {
    throw new Error('clone() must be implemented by subclass');
  }
}

/**
 * AND node
 */
export class AndNode extends BinaryNode {
  constructor(left, right) {
    super('AND', left, right, 'AND');
  }

  evaluate(values) {
    return (this.left.evaluate(values) && this.right.evaluate(values)) ? 1 : 0;
  }

  toString() {
    const leftStr = this.left.toString();
    const rightStr = this.right.toString();
    return `(${leftStr} AND ${rightStr})`;
  }

  clone() {
    return new AndNode(this.left.clone(), this.right.clone());
  }
}

/**
 * OR node
 */
export class OrNode extends BinaryNode {
  constructor(left, right) {
    super('OR', left, right, 'OR');
  }

  evaluate(values) {
    return (this.left.evaluate(values) || this.right.evaluate(values)) ? 1 : 0;
  }

  toString() {
    const leftStr = this.left.toString();
    const rightStr = this.right.toString();
    return `(${leftStr} OR ${rightStr})`;
  }

  clone() {
    return new OrNode(this.left.clone(), this.right.clone());
  }
}

/**
 * XOR node
 */
export class XorNode extends BinaryNode {
  constructor(left, right) {
    super('XOR', left, right, 'XOR');
  }

  evaluate(values) {
    const l = this.left.evaluate(values);
    const r = this.right.evaluate(values);
    return (l !== r) ? 1 : 0;
  }

  toString() {
    const leftStr = this.left.toString();
    const rightStr = this.right.toString();
    return `(${leftStr} XOR ${rightStr})`;
  }

  clone() {
    return new XorNode(this.left.clone(), this.right.clone());
  }
}

/**
 * NAND node
 */
export class NandNode extends BinaryNode {
  constructor(left, right) {
    super('NAND', left, right, 'NAND');
  }

  evaluate(values) {
    return (this.left.evaluate(values) && this.right.evaluate(values)) ? 0 : 1;
  }

  toString() {
    const leftStr = this.left.toString();
    const rightStr = this.right.toString();
    return `(${leftStr} NAND ${rightStr})`;
  }

  clone() {
    return new NandNode(this.left.clone(), this.right.clone());
  }
}

/**
 * NOR node
 */
export class NorNode extends BinaryNode {
  constructor(left, right) {
    super('NOR', left, right, 'NOR');
  }

  evaluate(values) {
    return (this.left.evaluate(values) || this.right.evaluate(values)) ? 0 : 1;
  }

  toString() {
    const leftStr = this.left.toString();
    const rightStr = this.right.toString();
    return `(${leftStr} NOR ${rightStr})`;
  }

  clone() {
    return new NorNode(this.left.clone(), this.right.clone());
  }
}

/**
 * XNOR node
 */
export class XnorNode extends BinaryNode {
  constructor(left, right) {
    super('XNOR', left, right, 'XNOR');
  }

  evaluate(values) {
    const l = this.left.evaluate(values);
    const r = this.right.evaluate(values);
    return (l === r) ? 1 : 0;
  }

  toString() {
    const leftStr = this.left.toString();
    const rightStr = this.right.toString();
    return `(${leftStr} XNOR ${rightStr})`;
  }

  clone() {
    return new XnorNode(this.left.clone(), this.right.clone());
  }
}

export default {
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
};
