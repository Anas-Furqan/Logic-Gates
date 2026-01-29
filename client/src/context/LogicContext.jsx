import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { processExpression, validateExpression } from '../lib/logic/index.js';

/**
 * Logic Context - Global state for the application
 */
const LogicContext = createContext(null);

/**
 * Custom hook to use logic context
 */
export function useLogic() {
  const context = useContext(LogicContext);
  if (!context) {
    throw new Error('useLogic must be used within a LogicProvider');
  }
  return context;
}

/**
 * Logic Provider Component
 */
export function LogicProvider({ children }) {
  // Expression state
  const [expression, setExpression] = useState('A AND B OR C');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Processed result state
  const [result, setResult] = useState(null);

  // Input values for simulation
  const [inputValues, setInputValues] = useState({});

  // UI state
  const [activeTab, setActiveTab] = useState('circuit');
  const [showExplanation, setShowExplanation] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  /**
   * Process the current expression
   */
  const process = useCallback((expr = expression) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Validate first
      const validation = validateExpression(expr);
      
      if (!validation.valid) {
        setError(validation.error);
        setResult(null);
        setIsProcessing(false);
        return false;
      }

      // Check variable limit
      if (validation.variableCount > 6) {
        setError('Expression has more than 6 variables. Please simplify for best performance.');
      }

      // Full processing
      const processed = processExpression(expr);
      setResult(processed);

      // Initialize input values
      const initialInputs = {};
      for (const variable of processed.variables) {
        initialInputs[variable] = inputValues[variable] ?? 0;
      }
      setInputValues(initialInputs);

      setIsProcessing(false);
      return true;
    } catch (err) {
      setError(err.message || 'An error occurred while processing the expression');
      setResult(null);
      setIsProcessing(false);
      return false;
    }
  }, [expression, inputValues]);

  /**
   * Update expression and optionally process
   */
  const updateExpression = useCallback((newExpression, shouldProcess = false) => {
    setExpression(newExpression);
    if (shouldProcess) {
      setTimeout(() => process(newExpression), 0);
    }
  }, [process]);

  /**
   * Toggle an input value
   */
  const toggleInput = useCallback((variable) => {
    setInputValues(prev => ({
      ...prev,
      [variable]: prev[variable] ? 0 : 1,
    }));
  }, []);

  /**
   * Set a specific input value
   */
  const setInput = useCallback((variable, value) => {
    setInputValues(prev => ({
      ...prev,
      [variable]: value ? 1 : 0,
    }));
  }, []);

  /**
   * Reset all inputs to 0
   */
  const resetInputs = useCallback(() => {
    setInputValues(prev => {
      const reset = {};
      for (const key of Object.keys(prev)) {
        reset[key] = 0;
      }
      return reset;
    });
  }, []);

  /**
   * Evaluate circuit with current inputs
   */
  const evaluatedOutput = useMemo(() => {
    if (!result || !result.circuit) return null;
    try {
      return result.circuit.evaluate(inputValues);
    } catch {
      return null;
    }
  }, [result, inputValues]);

  /**
   * Load an example expression
   */
  const loadExample = useCallback((example) => {
    setExpression(example.expression);
    setTimeout(() => process(example.expression), 0);
  }, [process]);

  // Context value
  const value = useMemo(() => ({
    // State
    expression,
    result,
    error,
    isProcessing,
    inputValues,
    evaluatedOutput,
    activeTab,
    showExplanation,
    darkMode,

    // Actions
    setExpression: updateExpression,
    process,
    toggleInput,
    setInput,
    resetInputs,
    setActiveTab,
    setShowExplanation,
    setDarkMode,
    loadExample,
  }), [
    expression,
    result,
    error,
    isProcessing,
    inputValues,
    evaluatedOutput,
    activeTab,
    showExplanation,
    darkMode,
    updateExpression,
    process,
    toggleInput,
    setInput,
    resetInputs,
    loadExample,
  ]);

  return (
    <LogicContext.Provider value={value}>
      {children}
    </LogicContext.Provider>
  );
}

export default LogicContext;
