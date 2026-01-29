import React, { useMemo } from 'react';
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Chip,
  Divider,
  Accordion,
  AccordionItem,
  Progress,
} from '@heroui/react';
import { motion } from 'framer-motion';
import { 
  Minimize2, 
  ArrowRight, 
  CheckCircle, 
  TrendingDown,
  Zap,
  Layers
} from 'lucide-react';
import { useLogic } from '../../context/LogicContext.jsx';

/**
 * Simplification step component
 */
function SimplificationStep({ step, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-start gap-3 p-3 bg-content2/30 rounded-lg"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
        <span className="text-sm font-semibold text-primary">{index + 1}</span>
      </div>
      <div className="flex-1">
        <p className="text-sm text-default-600">{step.description}</p>
        {step.data && (
          <div className="mt-2 text-xs font-mono text-default-400 overflow-x-auto">
            {Array.isArray(step.data) ? (
              <ul className="space-y-1">
                {step.data.slice(0, 10).map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-default-500">{item.binary || item.term}</span>
                    {item.minterms && (
                      <span className="text-primary">
                        m({item.minterms.join(',')})
                      </span>
                    )}
                  </li>
                ))}
                {step.data.length > 10 && (
                  <li className="text-default-400">
                    ... and {step.data.length - 10} more
                  </li>
                )}
              </ul>
            ) : (
              <pre>{JSON.stringify(step.data, null, 2)}</pre>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Prime implicant display component
 */
function PrimeImplicantCard({ implicant, variables }) {
  return (
    <div className="p-3 bg-content2/50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-sm">
          {implicant.binary}
        </span>
        <Chip size="sm" variant="flat" color="primary">
          {implicant.minterms.length} terms
        </Chip>
      </div>
      <div className="text-xs text-default-400">
        Covers: m({implicant.minterms.join(', ')})
      </div>
    </div>
  );
}

/**
 * Simplifier Component
 * Displays simplified expression and simplification steps
 */
export default function Simplifier() {
  const { result } = useLogic();

  const simplification = result?.simplification;

  const reductionPercentage = useMemo(() => {
    if (!simplification?.statistics) return 0;
    return simplification.statistics.reduction;
  }, [simplification]);

  if (!simplification) {
    return (
      <Card className="bg-content1/50 backdrop-blur-md">
        <CardBody className="text-center py-12">
          <p className="text-default-400">
            Enter an expression with up to 6 variables to see simplification.
            {result?.variables?.length > 6 && (
              <span className="block mt-2 text-warning">
                Current expression has {result.variables.length} variables (max 6 for simplification).
              </span>
            )}
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Main Simplification Result */}
      <Card className="bg-content1/50 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Minimize2 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Boolean Expression Simplifier</h3>
          </div>
        </CardHeader>
        
        <CardBody className="space-y-6">
          {/* Original Expression */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Chip size="sm" variant="flat">Original</Chip>
            </div>
            <code className="block p-4 bg-content2/50 rounded-lg font-mono text-sm overflow-x-auto">
              {simplification.original}
            </code>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-default-400">
              <TrendingDown className="w-5 h-5" />
              <span className="text-sm">Quine-McCluskey Algorithm</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          {/* Simplified Expression */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Chip size="sm" color="success" variant="flat">Simplified</Chip>
              {reductionPercentage > 0 && (
                <Chip size="sm" color="success" variant="solid">
                  {reductionPercentage}% reduction
                </Chip>
              )}
            </div>
            <code className="block p-4 bg-success-100/20 dark:bg-success-900/20 rounded-lg font-mono text-lg text-success-600 dark:text-success-400 overflow-x-auto border border-success-200 dark:border-success-800">
              {simplification.simplified}
            </code>
          </div>
        </CardBody>
      </Card>

      {/* Statistics Card */}
      <Card className="bg-content1/50 backdrop-blur-md">
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-default-600">Gate Reduction</span>
              <span className="font-semibold text-success">
                {simplification.statistics.originalGateCount} → {simplification.statistics.simplifiedGateCount}
              </span>
            </div>
            <Progress
              value={reductionPercentage}
              color="success"
              className="max-w-full"
              showValueLabel={true}
            />
          </div>
          
          <Divider className="my-4" />
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-default-600">
                {simplification.statistics.originalGateCount}
              </p>
              <p className="text-sm text-default-400">Original Gates</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success">
                {simplification.statistics.simplifiedGateCount}
              </p>
              <p className="text-sm text-default-400">Simplified Gates</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">
                {simplification.primeImplicants?.length || 0}
              </p>
              <p className="text-sm text-default-400">Prime Implicants</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Detailed Steps */}
      <Accordion variant="shadow">
        <AccordionItem
          key="steps"
          aria-label="Simplification Steps"
          title={
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>Simplification Steps</span>
              <Chip size="sm" variant="flat">
                {simplification.steps?.length || 0} steps
              </Chip>
            </div>
          }
        >
          <div className="space-y-3 py-2">
            {simplification.steps?.map((step, index) => (
              <SimplificationStep key={index} step={step} index={index} />
            ))}
          </div>
        </AccordionItem>

        <AccordionItem
          key="prime-implicants"
          aria-label="Prime Implicants"
          title={
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-warning" />
              <span>Prime Implicants</span>
              <Chip size="sm" variant="flat">
                {simplification.primeImplicants?.length || 0}
              </Chip>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 py-2">
            {simplification.primeImplicants?.map((pi, index) => (
              <PrimeImplicantCard
                key={index}
                implicant={pi}
                variables={result?.variables}
              />
            ))}
          </div>
        </AccordionItem>

        <AccordionItem
          key="essential"
          aria-label="Essential Prime Implicants"
          title={
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Essential Prime Implicants</span>
              <Chip size="sm" color="success" variant="flat">
                {simplification.essentialImplicants?.length || 0}
              </Chip>
            </div>
          }
        >
          <div className="space-y-2 py-2">
            {simplification.essentialImplicants?.map((ei, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-success-100/20 dark:bg-success-900/20 rounded-lg border border-success-200 dark:border-success-800"
              >
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                <div>
                  <span className="font-mono">{ei.binary}</span>
                  <span className="mx-2 text-default-400">→</span>
                  <span className="font-mono text-success">{ei.toTerm?.(result?.variables) || ei.term}</span>
                </div>
              </div>
            ))}
          </div>
        </AccordionItem>
      </Accordion>

      {/* Educational Info */}
      <Card className="bg-gradient-to-br from-primary-500/10 to-secondary-500/10">
        <CardBody>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-warning" />
            About Quine-McCluskey Algorithm
          </h4>
          <p className="text-sm text-default-600">
            The Quine-McCluskey algorithm is a method for minimizing Boolean functions. 
            It finds all prime implicants of the function, then determines the minimum 
            set of prime implicants needed to cover all minterms. This results in the 
            simplest possible Sum of Products (SOP) expression.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip size="sm" variant="flat">Systematic</Chip>
            <Chip size="sm" variant="flat">Optimal for ≤6 variables</Chip>
            <Chip size="sm" variant="flat">Automated</Chip>
            <Chip size="sm" variant="flat">Deterministic</Chip>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}
