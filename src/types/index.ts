/**
 * LogicLab - Core Type Definitions
 * 
 * This file contains all the type definitions used throughout the application.
 * Types are organized by domain: Parser, Circuit, Simulation, UI.
 */

// ============================================================================
// TOKEN & LEXER TYPES
// ============================================================================

export enum TokenType {
  // Operands
  VARIABLE = 'VARIABLE',
  LITERAL = 'LITERAL',
  
  // Binary operators
  AND = 'AND',
  OR = 'OR',
  XOR = 'XOR',
  NAND = 'NAND',
  NOR = 'NOR',
  XNOR = 'XNOR',
  
  // Unary operators
  NOT = 'NOT',
  
  // Delimiters
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  
  // Special
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
  length: number;
}

// ============================================================================
// AST (ABSTRACT SYNTAX TREE) TYPES
// ============================================================================

export enum ASTNodeType {
  VARIABLE = 'VARIABLE',
  LITERAL = 'LITERAL',
  NOT = 'NOT',
  AND = 'AND',
  OR = 'OR',
  XOR = 'XOR',
  NAND = 'NAND',
  NOR = 'NOR',
  XNOR = 'XNOR',
}

export interface ASTVariable {
  type: ASTNodeType.VARIABLE;
  name: string;
  id: string;
}

export interface ASTLiteral {
  type: ASTNodeType.LITERAL;
  value: boolean;
  id: string;
}

export interface ASTUnaryOp {
  type: ASTNodeType.NOT;
  operand: ASTNode;
  id: string;
}

export interface ASTBinaryOp {
  type: ASTNodeType.AND | ASTNodeType.OR | ASTNodeType.XOR | 
        ASTNodeType.NAND | ASTNodeType.NOR | ASTNodeType.XNOR;
  left: ASTNode;
  right: ASTNode;
  id: string;
}

export type ASTNode = ASTVariable | ASTLiteral | ASTUnaryOp | ASTBinaryOp;

// ============================================================================
// CIRCUIT GRAPH TYPES
// ============================================================================

export enum GateType {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  XOR = 'XOR',
  NAND = 'NAND',
  NOR = 'NOR',
  XNOR = 'XNOR',
  BUFFER = 'BUFFER',
}

export interface Position {
  x: number;
  y: number;
}

export interface GateNode {
  id: string;
  type: GateType;
  label: string;
  position: Position;
  inputs: string[];      // IDs of input connections
  outputs: string[];     // IDs of output connections
  value?: boolean;       // Current signal value
  level: number;         // Depth in the circuit for layout
}

export interface Wire {
  id: string;
  from: {
    gateId: string;
    port: 'output' | number;  // 'output' for output port, number for input index
  };
  to: {
    gateId: string;
    port: 'input' | number;
  };
  value?: boolean;
  waypoints?: Position[];    // For routing
}

export interface Circuit {
  gates: Map<string, GateNode>;
  wires: Wire[];
  inputs: string[];          // IDs of input gates
  outputs: string[];         // IDs of output gates
  expression: string;
  ast: ASTNode | null;
}

// ============================================================================
// TRUTH TABLE TYPES
// ============================================================================

export interface TruthTableRow {
  inputs: Record<string, boolean>;
  output: boolean;
  minterm: number;
  maxterm: number;
}

export interface TruthTable {
  variables: string[];
  rows: TruthTableRow[];
  expression: string;
}

// ============================================================================
// KARNAUGH MAP TYPES
// ============================================================================

export interface KMapCell {
  row: number;
  col: number;
  value: boolean;
  minterm: number;
  variables: Record<string, boolean>;
  grouped: boolean;
  groupIds: string[];
}

export interface KMapGroup {
  id: string;
  cells: number[];         // Minterm numbers
  color: string;
  term: string;            // Simplified term for this group
}

export interface KMap {
  variables: string[];
  numVars: number;
  cells: KMapCell[][];
  groups: KMapGroup[];
  rowLabels: string[];
  colLabels: string[];
  rowVars: string[];
  colVars: string[];
}

// ============================================================================
// SIMPLIFICATION TYPES
// ============================================================================

export interface Implicant {
  minterms: number[];
  binary: string;          // Binary representation with '-' for don't cares
  variables: string[];
  isPrime: boolean;
  isEssential: boolean;
  covered: boolean;
}

export interface SimplificationStep {
  step: number;
  description: string;
  expression: string;
  rule: string;
  details?: string;
}

export interface SimplificationResult {
  original: string;
  simplified: string;
  steps: SimplificationStep[];
  primeImplicants: Implicant[];
  essentialImplicants: Implicant[];
  gateCountBefore: number;
  gateCountAfter: number;
}

// ============================================================================
// SIMULATION TYPES
// ============================================================================

export interface SimulationState {
  inputs: Record<string, boolean>;
  gateValues: Record<string, boolean>;
  wireValues: Record<string, boolean>;
  output: boolean;
  timestamp: number;
}

export interface SimulationConfig {
  propagationDelay: number;  // ms
  animationEnabled: boolean;
  highlightPath: boolean;
}

// ============================================================================
// UI & APPLICATION STATE TYPES
// ============================================================================

export type ViewMode = 'circuit' | 'truthTable' | 'kmap' | 'all';
export type ThemeMode = 'light' | 'dark' | 'system';
export type ExportFormat = 'png' | 'svg' | 'pdf' | 'csv';

export interface AppSettings {
  theme: ThemeMode;
  showGrid: boolean;
  animationSpeed: number;
  autoSimulate: boolean;
  showSteps: boolean;
}

export interface ParseError {
  message: string;
  position: number;
  length: number;
  suggestion?: string;
}

export interface AppState {
  // Expression
  expression: string;
  ast: ASTNode | null;
  parseError: ParseError | null;
  
  // Generated data
  circuit: Circuit | null;
  truthTable: TruthTable | null;
  kmap: KMap | null;
  simplificationResult: SimplificationResult | null;
  
  // Simulation
  simulationState: SimulationState | null;
  isSimulating: boolean;
  
  // UI
  viewMode: ViewMode;
  settings: AppSettings;
  selectedGateId: string | null;
  
  // History
  expressionHistory: string[];
}

// ============================================================================
// EXPLANATION / EDUCATIONAL TYPES
// ============================================================================

export interface ExplanationStep {
  id: string;
  title: string;
  content: string;
  highlight?: {
    type: 'ast' | 'gate' | 'wire' | 'cell';
    ids: string[];
  };
  code?: string;
}

export interface Explanation {
  topic: string;
  steps: ExplanationStep[];
}

// ============================================================================
// EXPORT / SHARING TYPES
// ============================================================================

export interface ShareableState {
  v: number;              // Version for compatibility
  e: string;              // Expression
  i: Record<string, boolean>;  // Input values
}

export interface ExportOptions {
  format: ExportFormat;
  includeTable: boolean;
  includeKmap: boolean;
  backgroundColor: string;
  scale: number;
}
