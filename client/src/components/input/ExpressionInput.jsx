import React, { useState, useCallback } from 'react';
import { Input, Button, Chip, Tooltip, Card, CardBody } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  AlertCircle, 
  CheckCircle, 
  HelpCircle,
  Zap,
  Code,
  Lightbulb
} from 'lucide-react';
import { useLogic } from '../../context/LogicContext.jsx';
import { validateExpression } from '../../lib/logic/index.js';

/**
 * Operator help content
 */
const operatorHelp = [
  { symbol: 'AND', alt: '&, .', desc: 'Logical AND' },
  { symbol: 'OR', alt: '|, +', desc: 'Logical OR' },
  { symbol: 'NOT', alt: '~, !', desc: 'Logical NOT' },
  { symbol: 'XOR', alt: '^, ⊕', desc: 'Exclusive OR' },
  { symbol: 'NAND', alt: '', desc: 'NOT AND' },
  { symbol: 'NOR', alt: '', desc: 'NOT OR' },
  { symbol: 'XNOR', alt: '', desc: 'Exclusive NOR' },
  { symbol: '( )', alt: '', desc: 'Grouping' },
];

/**
 * Example expressions
 */
const examples = [
  { name: 'Simple AND', expression: 'A AND B' },
  { name: 'Simple OR', expression: 'A OR B' },
  { name: 'NOT Gate', expression: 'NOT A' },
  { name: 'XOR Gate', expression: 'A XOR B' },
  { name: 'Combined', expression: '(A AND B) OR (C AND D)' },
  { name: 'Half Adder Sum', expression: 'A XOR B' },
  { name: 'Half Adder Carry', expression: 'A AND B' },
  { name: 'Full Adder Sum', expression: 'A XOR B XOR Cin' },
  { name: 'Multiplexer', expression: '(A AND NOT S) OR (B AND S)' },
  { name: 'Complex', expression: '(A AND B) OR (NOT C AND D) XOR E' },
];

/**
 * Expression Input Component
 * Main input for Boolean expressions with validation and examples
 */
export default function ExpressionInput() {
  const { expression, setExpression, process, isProcessing, error, result } = useLogic();
  const [localExpression, setLocalExpression] = useState(expression);
  const [validation, setValidation] = useState({ valid: true });
  const [showHelp, setShowHelp] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  /**
   * Handle expression change with debounced validation
   */
  const handleChange = useCallback((value) => {
    setLocalExpression(value);
    
    // Validate on change
    if (value.trim()) {
      const result = validateExpression(value);
      setValidation(result);
    } else {
      setValidation({ valid: true });
    }
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback((e) => {
    e?.preventDefault();
    if (validation.valid && localExpression.trim()) {
      setExpression(localExpression);
      process(localExpression);
    }
  }, [localExpression, validation.valid, setExpression, process]);

  /**
   * Load an example expression
   */
  const handleLoadExample = useCallback((example) => {
    setLocalExpression(example.expression);
    setExpression(example.expression);
    process(example.expression);
    setShowExamples(false);
  }, [setExpression, process]);

  /**
   * Insert operator at cursor
   */
  const insertOperator = useCallback((op) => {
    setLocalExpression(prev => prev + ` ${op} `);
  }, []);

  return (
    <div className="w-full space-y-4">
      {/* Main Input Section */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <Input
            value={localExpression}
            onValueChange={handleChange}
            placeholder="Enter Boolean expression (e.g., A AND B OR NOT C)"
            aria-label="Boolean expression input"
            size="lg"
            variant="bordered"
            classNames={{
              input: 'expression-input text-lg',
              inputWrapper: 'bg-content1/50 backdrop-blur-md border-default-200 hover:border-primary-400 focus-within:border-primary-500',
            }}
            startContent={
              <Code className="w-5 h-5 text-default-400" />
            }
            endContent={
              validation.valid && localExpression.trim() ? (
                <CheckCircle className="w-5 h-5 text-success-500" />
              ) : !validation.valid ? (
                <AlertCircle className="w-5 h-5 text-danger-500" />
              ) : null
            }
            isInvalid={!validation.valid}
            errorMessage={!validation.valid ? validation.error : ''}
          />
          
          <Button
            type="submit"
            color="primary"
            size="lg"
            isLoading={isProcessing}
            isDisabled={!validation.valid || !localExpression.trim()}
            startContent={!isProcessing && <Play className="w-5 h-5" />}
            className="px-8 font-semibold"
          >
            Analyze
          </Button>
        </div>

        {/* Quick Operators */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-default-500 mr-2">Quick insert:</span>
          {['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR', '(', ')'].map((op) => (
            <Chip
              key={op}
              variant="flat"
              size="sm"
              className="cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
              onClick={() => insertOperator(op)}
            >
              {op}
            </Chip>
          ))}
          
          <div className="flex-1" />
          
          <Button
            variant="light"
            size="sm"
            startContent={<HelpCircle className="w-4 h-4" />}
            onClick={() => setShowHelp(!showHelp)}
          >
            Operators
          </Button>
          
          <Button
            variant="light"
            size="sm"
            startContent={<Lightbulb className="w-4 h-4" />}
            onClick={() => setShowExamples(!showExamples)}
          >
            Examples
          </Button>
        </div>
      </form>

      {/* Validation Info */}
      <AnimatePresence>
        {validation.valid && validation.variables?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-sm"
          >
            <span className="text-default-500">Variables detected:</span>
            {validation.variables.map((v) => (
              <Chip key={v} size="sm" variant="flat" color="primary">
                {v}
              </Chip>
            ))}
            <span className="text-default-400 ml-2">
              ({Math.pow(2, validation.variables.length)} combinations)
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Panel */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-content1/50 backdrop-blur-md">
              <CardBody>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-warning" />
                  Supported Operators
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {operatorHelp.map((op) => (
                    <div key={op.symbol} className="text-sm">
                      <span className="font-mono font-semibold text-primary">
                        {op.symbol}
                      </span>
                      {op.alt && (
                        <span className="text-default-400 ml-1">({op.alt})</span>
                      )}
                      <p className="text-default-500 text-xs">{op.desc}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Examples Panel */}
      <AnimatePresence>
        {showExamples && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-content1/50 backdrop-blur-md">
              <CardBody>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-success" />
                  Example Expressions
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {examples.map((example) => (
                    <Button
                      key={example.name}
                      variant="flat"
                      size="sm"
                      className="justify-start"
                      onClick={() => handleLoadExample(example)}
                    >
                      <div className="text-left">
                        <div className="font-medium">{example.name}</div>
                        <div className="text-xs text-default-400 font-mono truncate">
                          {example.expression}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
              <CardBody className="py-3">
                <div className="flex items-center gap-2 text-danger">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">{error}</span>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
