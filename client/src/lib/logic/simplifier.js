/**
 * LogicLab - Boolean Expression Simplifier
 * Implements Quine-McCluskey algorithm and Boolean algebra laws
 */

import { getMinterms } from './truthTable.js';

/**
 * Represents a minterm or implicant
 */
class Implicant {
  constructor(minterms, binary, mask = null) {
    this.minterms = Array.isArray(minterms) ? minterms : [minterms];
    this.binary = binary;
    this.mask = mask || binary.split('').map(() => false);
    this.used = false;
  }

  /**
   * Count the number of 1s in the binary representation
   */
  countOnes() {
    return this.binary.split('').filter(c => c === '1').length;
  }

  /**
   * Check if two implicants can be combined (differ by exactly one bit)
   */
  canCombineWith(other) {
    if (this.binary.length !== other.binary.length) return null;

    let diffIndex = -1;
    let diffCount = 0;

    for (let i = 0; i < this.binary.length; i++) {
      // Skip positions that are already "don't care"
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

    if (diffCount === 1) {
      return diffIndex;
    }
    return null;
  }

  /**
   * Combine with another implicant
   */
  combineWith(other, diffIndex) {
    const newBinary = this.binary.split('');
    newBinary[diffIndex] = '-';

    const newMinterms = [...new Set([...this.minterms, ...other.minterms])].sort((a, b) => a - b);
    const newMask = [...this.mask];
    newMask[diffIndex] = true;

    return new Implicant(newMinterms, newBinary.join(''), newMask);
  }

  /**
   * Check if this implicant covers a given minterm
   */
  covers(minterm, numVars) {
    const mintermBinary = minterm.toString(2).padStart(numVars, '0');
    
    for (let i = 0; i < this.binary.length; i++) {
      if (this.binary[i] !== '-' && this.binary[i] !== mintermBinary[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Convert to a Boolean term
   */
  toTerm(variables) {
    const literals = [];
    
    for (let i = 0; i < this.binary.length; i++) {
      if (this.binary[i] === '1') {
        literals.push(variables[i]);
      } else if (this.binary[i] === '0') {
        literals.push(`${variables[i]}'`);
      }
      // Skip '-' (don't care)
    }

    return literals.length > 0 ? literals.join('') : '1';
  }

  toString() {
    return `Implicant(${this.minterms.join(',')}, ${this.binary})`;
  }
}

/**
 * Quine-McCluskey Algorithm Implementation
 * @param {number[]} minterms - Array of minterm indices
 * @param {number} numVars - Number of variables
 * @param {string[]} variables - Variable names
 * @returns {Object} - Simplification result
 */
export function quineMcCluskey(minterms, numVars, variables) {
  const steps = [];

  if (minterms.length === 0) {
    return {
      primeImplicants: [],
      essentialImplicants: [],
      expression: '0',
      steps: [{ description: 'No minterms - output is always 0', data: null }],
    };
  }

  const totalMinterms = Math.pow(2, numVars);
  if (minterms.length === totalMinterms) {
    return {
      primeImplicants: [],
      essentialImplicants: [],
      expression: '1',
      steps: [{ description: 'All minterms present - output is always 1', data: null }],
    };
  }

  // Step 1: Create initial implicants from minterms
  let implicants = minterms.map(m => {
    const binary = m.toString(2).padStart(numVars, '0');
    return new Implicant(m, binary);
  });

  steps.push({
    description: 'Initial minterms converted to binary',
    data: implicants.map(i => ({ minterm: i.minterms[0], binary: i.binary })),
  });

  // Step 2: Group implicants by number of 1s
  let primeImplicants = [];
  let iteration = 0;

  while (implicants.length > 0) {
    iteration++;
    const groups = {};
    
    // Group by number of 1s
    for (const imp of implicants) {
      const ones = imp.countOnes();
      if (!groups[ones]) groups[ones] = [];
      groups[ones].push(imp);
    }

    const groupKeys = Object.keys(groups).map(Number).sort((a, b) => a - b);
    const newImplicants = [];
    const usedImplicants = new Set();

    // Compare adjacent groups
    for (let i = 0; i < groupKeys.length - 1; i++) {
      const currentGroup = groups[groupKeys[i]];
      const nextGroup = groups[groupKeys[i + 1]];

      for (const imp1 of currentGroup) {
        for (const imp2 of nextGroup) {
          const diffIndex = imp1.canCombineWith(imp2);
          
          if (diffIndex !== null) {
            const combined = imp1.combineWith(imp2, diffIndex);
            
            // Check if this combined implicant already exists
            const exists = newImplicants.some(
              ni => ni.binary === combined.binary
            );
            
            if (!exists) {
              newImplicants.push(combined);
            }
            
            usedImplicants.add(imp1);
            usedImplicants.add(imp2);
          }
        }
      }
    }

    // Collect prime implicants (those that couldn't be combined)
    for (const imp of implicants) {
      if (!usedImplicants.has(imp)) {
        primeImplicants.push(imp);
      }
    }

    if (newImplicants.length > 0) {
      steps.push({
        description: `Iteration ${iteration}: Combined ${usedImplicants.size} implicants into ${newImplicants.length} new implicants`,
        data: newImplicants.map(i => ({ minterms: i.minterms, binary: i.binary })),
      });
    }

    implicants = newImplicants;
  }

  // Remove duplicate prime implicants
  const uniquePrimeImplicants = [];
  const seen = new Set();
  
  for (const pi of primeImplicants) {
    const key = pi.binary;
    if (!seen.has(key)) {
      seen.add(key);
      uniquePrimeImplicants.push(pi);
    }
  }
  primeImplicants = uniquePrimeImplicants;

  steps.push({
    description: `Found ${primeImplicants.length} prime implicants`,
    data: primeImplicants.map(pi => ({ 
      minterms: pi.minterms, 
      binary: pi.binary,
      term: pi.toTerm(variables) 
    })),
  });

  // Step 3: Find essential prime implicants using a coverage chart
  const essentialImplicants = findEssentialPrimeImplicants(
    primeImplicants,
    minterms,
    numVars
  );

  steps.push({
    description: `Selected ${essentialImplicants.length} essential prime implicants`,
    data: essentialImplicants.map(ei => ({
      minterms: ei.minterms,
      binary: ei.binary,
      term: ei.toTerm(variables),
    })),
  });

  // Generate simplified expression
  const terms = essentialImplicants.map(ei => ei.toTerm(variables));
  const expression = terms.length > 0 ? terms.join(' + ') : '0';

  return {
    primeImplicants,
    essentialImplicants,
    expression,
    steps,
  };
}

/**
 * Find essential prime implicants using the coverage chart method
 */
function findEssentialPrimeImplicants(primeImplicants, minterms, numVars) {
  if (primeImplicants.length === 0) return [];

  const essential = [];
  const covered = new Set();

  // First pass: find essential prime implicants
  // (those that are the only cover for some minterm)
  for (const minterm of minterms) {
    const coveringPIs = primeImplicants.filter(pi => pi.covers(minterm, numVars));
    
    if (coveringPIs.length === 1 && !essential.includes(coveringPIs[0])) {
      essential.push(coveringPIs[0]);
      coveringPIs[0].minterms.forEach(m => covered.add(m));
    }
  }

  // Second pass: cover remaining minterms using greedy selection
  const uncovered = minterms.filter(m => !covered.has(m));
  const remainingPIs = primeImplicants.filter(pi => !essential.includes(pi));

  while (uncovered.length > 0 && remainingPIs.length > 0) {
    // Find the PI that covers the most uncovered minterms
    let bestPI = null;
    let bestCount = 0;

    for (const pi of remainingPIs) {
      const count = uncovered.filter(m => pi.covers(m, numVars)).length;
      if (count > bestCount) {
        bestCount = count;
        bestPI = pi;
      }
    }

    if (bestPI && bestCount > 0) {
      essential.push(bestPI);
      bestPI.minterms.forEach(m => covered.add(m));
      
      // Remove covered minterms
      const newUncovered = uncovered.filter(m => !bestPI.covers(m, numVars));
      uncovered.length = 0;
      uncovered.push(...newUncovered);
      
      // Remove used PI
      const idx = remainingPIs.indexOf(bestPI);
      if (idx !== -1) remainingPIs.splice(idx, 1);
    } else {
      break;
    }
  }

  return essential;
}

/**
 * Apply Boolean algebra simplification rules
 * @param {string} expression - Boolean expression string
 * @returns {Object} - Simplified expression and steps
 */
export function applyBooleanLaws(expression) {
  const steps = [];
  let current = expression;

  const rules = [
    // Identity laws
    { pattern: /(\w+)\s*\+\s*0/g, replacement: '$1', name: 'Identity Law (A + 0 = A)' },
    { pattern: /0\s*\+\s*(\w+)/g, replacement: '$1', name: 'Identity Law (0 + A = A)' },
    { pattern: /(\w+)\s*\.\s*1/g, replacement: '$1', name: 'Identity Law (A · 1 = A)' },
    { pattern: /1\s*\.\s*(\w+)/g, replacement: '$1', name: 'Identity Law (1 · A = A)' },
    
    // Null laws
    { pattern: /(\w+)\s*\+\s*1/g, replacement: '1', name: 'Null Law (A + 1 = 1)' },
    { pattern: /1\s*\+\s*(\w+)/g, replacement: '1', name: 'Null Law (1 + A = 1)' },
    { pattern: /(\w+)\s*\.\s*0/g, replacement: '0', name: 'Null Law (A · 0 = 0)' },
    { pattern: /0\s*\.\s*(\w+)/g, replacement: '0', name: 'Null Law (0 · A = 0)' },
    
    // Idempotent laws
    { pattern: /(\w+)\s*\+\s*\1(?!\w)/g, replacement: '$1', name: 'Idempotent Law (A + A = A)' },
    { pattern: /(\w+)\s*\.\s*\1(?!\w)/g, replacement: '$1', name: 'Idempotent Law (A · A = A)' },
    
    // Complement laws
    { pattern: /(\w+)\s*\+\s*\1'/g, replacement: '1', name: 'Complement Law (A + A\' = 1)' },
    { pattern: /(\w+)'\s*\+\s*\1(?!\w)/g, replacement: '1', name: 'Complement Law (A\' + A = 1)' },
    { pattern: /(\w+)\s*\.\s*\1'/g, replacement: '0', name: 'Complement Law (A · A\' = 0)' },
    { pattern: /(\w+)'\s*\.\s*\1(?!\w)/g, replacement: '0', name: 'Complement Law (A\' · A = 0)' },
    
    // Double negation
    { pattern: /(\w+)''/g, replacement: '$1', name: 'Double Negation (A\'\' = A)' },
  ];

  let changed = true;
  let iterations = 0;
  const maxIterations = 100;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (const rule of rules) {
      const newExpr = current.replace(rule.pattern, rule.replacement);
      if (newExpr !== current) {
        steps.push({
          rule: rule.name,
          before: current,
          after: newExpr,
        });
        current = newExpr;
        changed = true;
      }
    }
  }

  return {
    original: expression,
    simplified: current,
    steps,
  };
}

/**
 * Main simplification function that combines all methods
 * @param {Object} truthTable - Truth table data
 * @returns {Object} - Complete simplification result
 */
export function simplifyExpression(truthTable) {
  const { variables, rows, expression } = truthTable;
  const minterms = getMinterms(truthTable);

  // Apply Quine-McCluskey algorithm
  const qmResult = quineMcCluskey(minterms, variables.length, variables);

  // Calculate gate count reduction
  const originalGates = estimateGateCount(expression);
  const simplifiedGates = estimateGateCount(qmResult.expression);

  return {
    original: expression,
    simplified: qmResult.expression,
    primeImplicants: qmResult.primeImplicants,
    essentialImplicants: qmResult.essentialImplicants,
    steps: qmResult.steps,
    statistics: {
      originalGateCount: originalGates,
      simplifiedGateCount: simplifiedGates,
      reduction: originalGates > 0 
        ? Math.round((1 - simplifiedGates / originalGates) * 100) 
        : 0,
    },
  };
}

/**
 * Estimate the number of gates in an expression
 */
function estimateGateCount(expression) {
  if (!expression || expression === '0' || expression === '1') return 0;
  
  let count = 0;
  
  // Count ANDs (implicit or explicit)
  const terms = expression.split('+').map(t => t.trim());
  count += terms.length - 1; // OR gates
  
  for (const term of terms) {
    // Count literals (variables)
    const literals = term.match(/\w+'?/g) || [];
    if (literals.length > 1) {
      count += literals.length - 1; // AND gates
    }
    // Count NOT gates
    count += (term.match(/'/g) || []).length;
  }
  
  return count;
}

export default {
  quineMcCluskey,
  applyBooleanLaws,
  simplifyExpression,
};
