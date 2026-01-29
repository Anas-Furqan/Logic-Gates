import express from 'express';
import { processExpression, validateExpression } from '../logic/index.js';

const router = express.Router();

/**
 * POST /api/logic/parse
 * Parse and analyze a Boolean expression
 */
router.post('/parse', (req, res, next) => {
  try {
    const { expression } = req.body;

    if (!expression || typeof expression !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Expression is required and must be a string',
      });
    }

    // Validate first
    const validation = validateExpression(expression);
    
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid expression',
        message: validation.error,
      });
    }

    // Process the expression
    const result = processExpression(expression);

    // Return serializable result
    res.json({
      success: true,
      data: {
        expression: result.expression,
        variables: result.variables,
        truthTable: result.truthTable,
        simplification: result.simplification ? {
          original: result.simplification.original,
          simplified: result.simplification.simplified,
          statistics: result.simplification.statistics,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/logic/validate
 * Validate a Boolean expression without full processing
 */
router.post('/validate', (req, res) => {
  try {
    const { expression } = req.body;

    if (!expression || typeof expression !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Expression is required and must be a string',
      });
    }

    const validation = validateExpression(expression);
    res.json(validation);
  } catch (error) {
    res.status(500).json({
      error: 'Validation failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/logic/simplify
 * Simplify a Boolean expression
 */
router.post('/simplify', (req, res, next) => {
  try {
    const { expression } = req.body;

    if (!expression || typeof expression !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Expression is required and must be a string',
      });
    }

    const result = processExpression(expression);

    if (!result.simplification) {
      return res.status(400).json({
        error: 'Simplification not available',
        message: 'Expression has too many variables (max 6)',
      });
    }

    res.json({
      success: true,
      data: {
        original: result.simplification.original,
        simplified: result.simplification.simplified,
        statistics: result.simplification.statistics,
        steps: result.simplification.steps,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/logic/examples
 * Get example expressions
 */
router.get('/examples', (req, res) => {
  const examples = [
    { name: 'Simple AND', expression: 'A AND B', category: 'basic' },
    { name: 'Simple OR', expression: 'A OR B', category: 'basic' },
    { name: 'NOT Gate', expression: 'NOT A', category: 'basic' },
    { name: 'XOR Gate', expression: 'A XOR B', category: 'basic' },
    { name: 'NAND Gate', expression: 'A NAND B', category: 'basic' },
    { name: 'NOR Gate', expression: 'A NOR B', category: 'basic' },
    { name: 'Combined Logic', expression: '(A AND B) OR (C AND D)', category: 'intermediate' },
    { name: 'Half Adder Sum', expression: 'A XOR B', category: 'circuits' },
    { name: 'Half Adder Carry', expression: 'A AND B', category: 'circuits' },
    { name: 'Full Adder Sum', expression: 'A XOR B XOR Cin', category: 'circuits' },
    { name: 'Full Adder Carry', expression: '(A AND B) OR (Cin AND (A XOR B))', category: 'circuits' },
    { name: '2:1 Multiplexer', expression: '(A AND NOT S) OR (B AND S)', category: 'circuits' },
    { name: 'De Morgan Example', expression: 'NOT (A AND B)', category: 'theorems' },
    { name: 'Complex Expression', expression: '(A AND B) OR (NOT C AND D) XOR E', category: 'advanced' },
  ];

  res.json({
    success: true,
    data: examples,
  });
});

export default router;
