# LogicLab Development Notes

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │  Expression │ │   Circuit   │ │   Truth     │ │   K-Map   │ │
│  │    Input    │ │   Diagram   │ │   Table     │ │           │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOGIC CONTEXT (React)                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  expression │ result │ inputValues │ evaluatedOutput    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       LOGIC LIBRARY                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Lexer   │──│  Parser  │──│   AST    │──│ Evaluator│        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│        │              │             │                           │
│        ▼              ▼             ▼                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Truth   │  │  Circuit │  │  K-Map   │  │Simplifier│        │
│  │  Table   │  │  Graph   │  │Generator │  │  (Q-M)   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Core Algorithms

### 1. Lexer (Tokenization)

```
Input: "A AND B OR NOT C"

Tokens: [
  Token(VARIABLE, "A", 0),
  Token(AND, "AND", 2),
  Token(VARIABLE, "B", 6),
  Token(OR, "OR", 8),
  Token(NOT, "NOT", 11),
  Token(VARIABLE, "C", 15),
  Token(EOF, "", 16)
]
```

### 2. Parser (AST Generation)

Grammar:
```
expression  → or_expr
or_expr     → xor_expr (('OR' | 'NOR') xor_expr)*
xor_expr    → and_expr (('XOR' | 'XNOR') and_expr)*
and_expr    → unary (('AND' | 'NAND') unary)*
unary       → ('NOT') unary | postfix
postfix     → primary ("'")*
primary     → VARIABLE | CONSTANT | '(' expression ')'
```

### 3. Quine-McCluskey Algorithm

1. **Initial Implicants**: Convert minterms to binary
2. **Combination**: Merge implicants differing by 1 bit
3. **Prime Implicants**: Collect unmarked implicants
4. **Essential Selection**: Find implicants covering unique minterms
5. **Coverage**: Greedy selection for remaining minterms

### 4. Circuit Layout Algorithm

1. **Level Assignment**: BFS from inputs
2. **Node Ordering**: Minimize crossings using barycenter heuristic
3. **Position Calculation**: Grid-based placement
4. **Wire Routing**: Orthogonal routing with junction detection

## Performance Considerations

- Maximum 6 variables for simplification (64 minterms)
- Debounced expression parsing (300ms)
- Memoized truth table and K-map generation
- Canvas rendering for circuit (60fps)
- Virtual scrolling for large truth tables

## Testing Strategy

1. **Unit Tests**: Logic library functions
2. **Integration Tests**: API endpoints
3. **E2E Tests**: User workflows
4. **Visual Regression**: Circuit diagram rendering

## Future Enhancements

- [ ] Multi-output circuits
- [ ] Sequential logic (flip-flops)
- [ ] Circuit export to Verilog/VHDL
- [ ] Collaborative editing
- [ ] AI-powered circuit suggestions
