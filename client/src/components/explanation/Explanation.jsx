import React, { useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Button,
  Chip,
  Accordion,
  AccordionItem,
  Code,
  Divider,
} from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  ChevronRight, 
  Code2, 
  Binary, 
  GitBranch,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { useLogic } from '../../context/LogicContext.jsx';

/**
 * Step Card Component
 */
function StepCard({ title, icon: Icon, children, stepNumber, isActive }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: stepNumber * 0.1 }}
      className={`
        p-4 rounded-xl border-2 transition-all duration-300
        ${isActive 
          ? 'border-primary bg-primary/5' 
          : 'border-default-200 bg-content2/30 hover:border-default-300'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
          ${isActive ? 'bg-primary text-white' : 'bg-content3 text-default-500'}
        `}>
          {Icon ? <Icon className="w-5 h-5" /> : stepNumber}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-lg mb-2">{title}</h4>
          <div className="text-sm text-default-600">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Token Display Component
 */
function TokenDisplay({ tokens }) {
  if (!tokens || tokens.length === 0) return null;

  const tokenColors = {
    VARIABLE: 'primary',
    AND: 'warning',
    OR: 'secondary',
    NOT: 'danger',
    XOR: 'success',
    NAND: 'warning',
    NOR: 'secondary',
    XNOR: 'success',
    LPAREN: 'default',
    RPAREN: 'default',
    CONSTANT: 'default',
    EOF: 'default',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tokens.filter(t => t.type !== 'EOF').map((token, index) => (
        <Chip
          key={index}
          size="sm"
          color={tokenColors[token.type] || 'default'}
          variant="flat"
        >
          <span className="font-mono">{token.value}</span>
          <span className="text-xs ml-1 opacity-70">({token.type})</span>
        </Chip>
      ))}
    </div>
  );
}

/**
 * AST Tree Display Component
 */
function ASTTree({ node, depth = 0 }) {
  if (!node) return null;

  const indent = depth * 20;
  const nodeColors = {
    VARIABLE: '#3b82f6',
    CONSTANT: '#6b7280',
    NOT: '#f59e0b',
    AND: '#3b82f6',
    OR: '#8b5cf6',
    XOR: '#10b981',
    NAND: '#ec4899',
    NOR: '#f97316',
    XNOR: '#06b6d4',
  };

  return (
    <div style={{ marginLeft: indent }}>
      <div className="flex items-center gap-2 py-1">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: nodeColors[node.type] || '#6b7280' }}
        />
        <span className="font-mono text-sm">
          {node.type}
          {node.name && <span className="text-primary ml-1">({node.name})</span>}
          {node.value !== undefined && node.type === 'CONSTANT' && (
            <span className="text-default-400 ml-1">({node.value})</span>
          )}
        </span>
      </div>
      
      {node.operand && <ASTTree node={node.operand} depth={depth + 1} />}
      {node.left && <ASTTree node={node.left} depth={depth + 1} />}
      {node.right && <ASTTree node={node.right} depth={depth + 1} />}
    </div>
  );
}

/**
 * Explanation Component
 * Provides step-by-step educational explanations
 */
export default function Explanation() {
  const { result, expression } = useLogic();
  const [activeStep, setActiveStep] = useState(0);

  if (!result) {
    return (
      <Card className="bg-content1/50 backdrop-blur-md">
        <CardBody className="text-center py-12">
          <BookOpen className="w-12 h-12 text-default-300 mx-auto mb-4" />
          <p className="text-default-400">
            Enter an expression and click Analyze to see step-by-step explanations
          </p>
        </CardBody>
      </Card>
    );
  }

  const steps = [
    {
      title: 'Expression Input',
      icon: Code2,
      content: (
        <div className="space-y-3">
          <p>The original Boolean expression entered:</p>
          <Code className="block p-3 text-lg">{expression}</Code>
          <p className="text-xs text-default-400">
            Supported operators: AND (&, .), OR (|, +), NOT (~, !), XOR (^), NAND, NOR, XNOR
          </p>
        </div>
      ),
    },
    {
      title: 'Lexical Analysis (Tokenization)',
      icon: Binary,
      content: (
        <div className="space-y-3">
          <p>
            The lexer breaks the expression into individual tokens. Each token 
            represents a meaningful unit like a variable, operator, or parenthesis.
          </p>
          <div className="p-3 bg-content2/50 rounded-lg">
            <TokenDisplay tokens={result.tokens} />
          </div>
          <p className="text-xs text-default-400">
            {result.tokens?.length - 1} tokens identified
          </p>
        </div>
      ),
    },
    {
      title: 'Parsing to AST',
      icon: GitBranch,
      content: (
        <div className="space-y-3">
          <p>
            The parser converts tokens into an Abstract Syntax Tree (AST). 
            This tree structure represents the hierarchical relationship 
            between operators and operands, respecting operator precedence.
          </p>
          <div className="p-3 bg-content2/50 rounded-lg overflow-x-auto">
            <ASTTree node={result.ast} />
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-default-400">Operator Precedence:</span>
            <span>NOT (highest)</span>
            <ArrowRight className="w-3 h-3" />
            <span>AND</span>
            <ArrowRight className="w-3 h-3" />
            <span>XOR</span>
            <ArrowRight className="w-3 h-3" />
            <span>OR (lowest)</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Variable Detection',
      icon: Lightbulb,
      content: (
        <div className="space-y-3">
          <p>
            Variables are extracted from the AST. These become the inputs 
            in the truth table and circuit diagram.
          </p>
          <div className="flex flex-wrap gap-2">
            {result.variables?.map((v, i) => (
              <Chip key={i} color="primary" variant="solid" size="lg">
                {v}
              </Chip>
            ))}
          </div>
          <p className="text-default-400">
            {result.variables?.length} variables detected → 
            {' '}{Math.pow(2, result.variables?.length || 0)} possible input combinations
          </p>
        </div>
      ),
    },
    {
      title: 'Truth Table Generation',
      icon: Binary,
      content: (
        <div className="space-y-3">
          <p>
            The truth table is generated by evaluating the AST for every 
            possible combination of input values.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-success-100/20 rounded-lg text-center">
              <p className="text-2xl font-bold text-success">
                {result.truthTable?.stats?.trueCount}
              </p>
              <p className="text-xs text-default-400">Output = 1</p>
            </div>
            <div className="p-3 bg-danger-100/20 rounded-lg text-center">
              <p className="text-2xl font-bold text-danger">
                {result.truthTable?.stats?.falseCount}
              </p>
              <p className="text-xs text-default-400">Output = 0</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Circuit Generation',
      icon: GitBranch,
      content: (
        <div className="space-y-3">
          <p>
            The AST is converted into a circuit graph (Directed Acyclic Graph). 
            Each node becomes a logic gate, and edges become wires.
          </p>
          {result.circuit && (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-content2/50 rounded-lg text-center">
                <p className="text-xl font-bold text-primary">
                  {result.circuit.inputs?.length}
                </p>
                <p className="text-xs text-default-400">Inputs</p>
              </div>
              <div className="p-3 bg-content2/50 rounded-lg text-center">
                <p className="text-xl font-bold text-warning">
                  {result.circuit.getStatistics?.()?.totalGates || 0}
                </p>
                <p className="text-xs text-default-400">Gates</p>
              </div>
              <div className="p-3 bg-content2/50 rounded-lg text-center">
                <p className="text-xl font-bold text-secondary">
                  {result.circuit.edges?.length}
                </p>
                <p className="text-xs text-default-400">Wires</p>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Expression Simplification',
      icon: Lightbulb,
      content: (
        <div className="space-y-3">
          <p>
            The Quine-McCluskey algorithm finds the minimal expression by:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-default-600">
            <li>Identifying all prime implicants</li>
            <li>Finding essential prime implicants</li>
            <li>Covering remaining minterms optimally</li>
          </ol>
          {result.simplification && (
            <div className="mt-3 p-3 bg-success-100/20 rounded-lg">
              <p className="text-xs text-default-400 mb-1">Simplified result:</p>
              <Code className="text-success-600">{result.simplification.simplified}</Code>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-primary-500/10 to-secondary-500/10">
        <CardBody>
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
            <div>
              <h3 className="text-xl font-bold">Step-by-Step Explanation</h3>
              <p className="text-sm text-default-500">
                Learn how Boolean expressions are processed
              </p>
            </div>
          </div>
          
          {/* Progress indicators */}
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`
                  flex-1 h-2 rounded-full transition-all
                  ${index === activeStep 
                    ? 'bg-primary' 
                    : index < activeStep 
                      ? 'bg-success' 
                      : 'bg-default-200'
                  }
                `}
              />
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} onClick={() => setActiveStep(index)}>
            <StepCard
              title={step.title}
              icon={step.icon}
              stepNumber={index + 1}
              isActive={index === activeStep}
            >
              <AnimatePresence mode="wait">
                {index === activeStep && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {step.content}
                  </motion.div>
                )}
              </AnimatePresence>
            </StepCard>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <Card className="bg-content1/50 backdrop-blur-md">
        <CardBody>
          <div className="flex justify-between items-center">
            <Button
              variant="light"
              isDisabled={activeStep === 0}
              onClick={() => setActiveStep(prev => prev - 1)}
            >
              Previous
            </Button>
            
            <span className="text-sm text-default-400">
              Step {activeStep + 1} of {steps.length}
            </span>
            
            <Button
              color="primary"
              isDisabled={activeStep === steps.length - 1}
              onClick={() => setActiveStep(prev => prev + 1)}
              endContent={<ChevronRight className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}
