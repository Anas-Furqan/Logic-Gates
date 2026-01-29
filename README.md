# LogicLab 🔌

An interactive, production-ready web application for Boolean logic analysis and circuit simulation.

![LogicLab Preview](./docs/preview.png)

## ✨ Features

### Core Functionality

- **🔤 Boolean Expression Parser**
  - Supports: AND, OR, NOT, XOR, NAND, NOR, XNOR
  - Multiple syntax options: `A AND B`, `A & B`, `A . B`
  - Parentheses for grouping
  - Operator precedence handling
  - Real-time syntax validation

- **📊 Truth Table Generator**
  - Automatic variable detection
  - All 2^n input combinations
  - Row highlighting for output=1
  - Export to CSV
  - Interactive row selection

- **🔲 Circuit Diagram Visualization**
  - Automatic layout algorithm
  - Interactive gate rendering
  - Live signal propagation
  - Zoom and pan controls
  - Export as PNG

- **🗺️ Karnaugh Map (K-Map)**
  - Support for 2-4 variables
  - Gray code ordering
  - Automatic grouping detection
  - Visual highlighting
  - SOP/POS generation

- **⚡ Boolean Expression Simplifier**
  - Quine-McCluskey algorithm
  - Prime implicant identification
  - Essential prime implicant selection
  - Gate count reduction metrics
  - Step-by-step explanations

- **📚 Educational Mode**
  - Step-by-step parsing explanation
  - AST visualization
  - Token breakdown
  - Interactive learning

### UI/UX

- 🎨 Modern, clean interface with Hero UI
- 🌙 Dark/Light mode support
- 📱 Fully responsive design
- ⚡ Real-time updates
- 🎭 Smooth animations with Framer Motion

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/logiclab.git
cd logiclab

# Install all dependencies
npm run install:all

# Start development servers
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
logiclab/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── circuit/    # Circuit diagram
│   │   │   ├── input/      # Expression input
│   │   │   ├── kmap/       # Karnaugh map
│   │   │   ├── layout/     # Header/Footer
│   │   │   ├── simplifier/ # Simplification
│   │   │   ├── truthtable/ # Truth table
│   │   │   └── explanation/# Educational mode
│   │   ├── context/        # React context
│   │   ├── lib/
│   │   │   └── logic/      # Core logic library
│   │   │       ├── lexer.js
│   │   │       ├── parser.js
│   │   │       ├── ast.js
│   │   │       ├── truthTable.js
│   │   │       ├── kmap.js
│   │   │       ├── simplifier.js
│   │   │       ├── circuitGraph.js
│   │   │       └── circuitLayout.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── logic/
│   │   └── index.js
│   └── package.json
│
├── package.json           # Root package.json
└── README.md
```

## 🔧 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Hero UI** - Component library
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Konva.js / React-Konva** - Canvas rendering
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Helmet** - Security
- **CORS** - Cross-origin support

## 📖 API Reference

### POST /api/logic/parse
Parse and analyze a Boolean expression.

```json
{
  "expression": "A AND B OR NOT C"
}
```

### POST /api/logic/validate
Validate expression syntax.

```json
{
  "expression": "A AND B"
}
```

### POST /api/logic/simplify
Get simplified expression using Quine-McCluskey.

```json
{
  "expression": "(A AND B) OR (A AND C)"
}
```

### GET /api/logic/examples
Get example expressions.

## 🎯 Supported Operators

| Operator | Keywords | Symbols |
|----------|----------|---------|
| AND | `AND` | `&`, `.`, `*` |
| OR | `OR` | `\|`, `+` |
| NOT | `NOT` | `~`, `!`, `'` (postfix) |
| XOR | `XOR` | `^`, `⊕` |
| NAND | `NAND` | - |
| NOR | `NOR` | - |
| XNOR | `XNOR` | - |

## 🔬 Algorithm Details

### Lexer
Custom lexical analyzer that tokenizes input expressions into meaningful tokens (variables, operators, parentheses).

### Parser
Recursive descent parser that builds an Abstract Syntax Tree (AST) respecting operator precedence:
1. NOT (highest)
2. AND, NAND
3. XOR, XNOR
4. OR, NOR (lowest)

### Truth Table Generation
Generates all 2^n input combinations and evaluates the AST for each.

### Quine-McCluskey Algorithm
1. Generate initial implicants from minterms
2. Iteratively combine implicants differing by one bit
3. Identify prime implicants
4. Select essential prime implicants
5. Cover remaining minterms optimally

### Circuit Layout
Custom layout algorithm:
1. Assign levels based on longest path from inputs
2. Order nodes within levels to minimize crossings
3. Calculate positions with proper spacing
4. Route wires with orthogonal routing

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Hero UI for the beautiful component library
- Framer Motion for smooth animations
- The digital logic community for inspiration

---

**Made with ❤️ for digital logic education**
