import React, { useEffect } from 'react';
import { Tabs, Tab, Card, CardBody, Spinner } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CircuitBoard, 
  Table2, 
  Grid3X3, 
  Minimize2, 
  BookOpen,
  Zap
} from 'lucide-react';

import { LogicProvider, useLogic } from './context/LogicContext.jsx';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import ExpressionInput from './components/input/ExpressionInput.jsx';
import CircuitDiagram from './components/circuit/CircuitDiagram.jsx';
import TruthTable from './components/truthtable/TruthTable.jsx';
import KMap from './components/kmap/KMap.jsx';
import Simplifier from './components/simplifier/Simplifier.jsx';
import Explanation from './components/explanation/Explanation.jsx';

/**
 * Main content component (needs access to context)
 */
function MainContent() {
  const { 
    activeTab, 
    setActiveTab, 
    isProcessing, 
    result, 
    darkMode, 
    setDarkMode,
    process 
  } = useLogic();

  // Process default expression on mount
  useEffect(() => {
    process();
  }, []);

  const tabs = [
    { 
      key: 'circuit', 
      title: 'Circuit', 
      icon: CircuitBoard,
      description: 'Interactive circuit diagram'
    },
    { 
      key: 'truthtable', 
      title: 'Truth Table', 
      icon: Table2,
      description: 'All input combinations'
    },
    { 
      key: 'kmap', 
      title: 'K-Map', 
      icon: Grid3X3,
      description: 'Karnaugh map visualization'
    },
    { 
      key: 'simplifier', 
      title: 'Simplify', 
      icon: Minimize2,
      description: 'Boolean expression minimization'
    },
    { 
      key: 'explanation', 
      title: 'Learn', 
      icon: BookOpen,
      description: 'Step-by-step explanations'
    },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      
      <main className="flex-1 px-4 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                Boolean Logic Analyzer
              </span>
            </h1>
            <p className="text-default-500 max-w-2xl mx-auto">
              Enter any Boolean expression to generate circuit diagrams, truth tables, 
              Karnaugh maps, and simplified expressions - all in real-time.
            </p>
          </motion.div>

          {/* Expression Input */}
          <Card className="bg-content1/50 backdrop-blur-md">
            <CardBody className="p-6">
              <ExpressionInput />
            </CardBody>
          </Card>

          {/* Loading State */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center py-8"
              >
                <Spinner size="lg" color="primary" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Section */}
          {result && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Tab Navigation */}
              <Tabs
                aria-label="Logic analysis options"
                selectedKey={activeTab}
                onSelectionChange={setActiveTab}
                color="primary"
                variant="underlined"
                classNames={{
                  tabList: 'gap-6 w-full relative rounded-none p-0 border-b border-default-200',
                  cursor: 'w-full bg-primary',
                  tab: 'max-w-fit px-2 h-12',
                  tabContent: 'group-data-[selected=true]:text-primary',
                }}
              >
                {tabs.map((tab) => (
                  <Tab
                    key={tab.key}
                    title={
                      <div className="flex items-center gap-2">
                        <tab.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.title}</span>
                      </div>
                    }
                  />
                ))}
              </Tabs>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'circuit' && <CircuitDiagram />}
                  {activeTab === 'truthtable' && <TruthTable />}
                  {activeTab === 'kmap' && <KMap />}
                  {activeTab === 'simplifier' && <Simplifier />}
                  {activeTab === 'explanation' && <Explanation />}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {/* Empty State */}
          {!result && !isProcessing && (
            <Card className="bg-content1/50 backdrop-blur-md">
              <CardBody className="py-16 text-center">
                <Zap className="w-16 h-16 text-default-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Ready to Analyze</h3>
                <p className="text-default-400 max-w-md mx-auto">
                  Enter a Boolean expression above and click "Analyze" to generate 
                  circuit diagrams, truth tables, and more.
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

/**
 * App Component - Main application entry point
 */
export default function App() {
  return (
    <LogicProvider>
      <MainContent />
    </LogicProvider>
  );
}
