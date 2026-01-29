import React, { useMemo } from 'react';
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Chip,
  Tooltip,
} from '@heroui/react';
import { motion } from 'framer-motion';
import { useLogic } from '../../context/LogicContext.jsx';
import { generateKMapVisualization, generateSimplifiedSOP } from '../../lib/logic/index.js';

/**
 * K-Map Cell Component
 */
function KMapCell({ cell, groups, onClick }) {
  // Determine cell background based on groups it belongs to
  const cellStyle = useMemo(() => {
    const key = `${cell.row},${cell.col}`;
    const cellGroups = groups[key] || [];
    
    if (cellGroups.length === 0) {
      return {};
    }

    // Blend colors for multiple groups
    if (cellGroups.length === 1) {
      return { backgroundColor: cellGroups[0].color };
    }

    // Create gradient for multiple groups
    const colors = cellGroups.map(g => g.color).join(', ');
    return {
      background: `linear-gradient(135deg, ${colors})`,
    };
  }, [cell, groups]);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        kmap-cell
        w-14 h-14 flex items-center justify-center
        border border-default-300 dark:border-default-600
        rounded-lg cursor-pointer
        font-mono text-lg font-semibold
        transition-all duration-200
        ${cell.value === 1 
          ? 'text-success-600 dark:text-success-400' 
          : 'text-default-400'
        }
      `}
      style={cellStyle}
      onClick={() => onClick?.(cell)}
    >
      {cell.value}
    </motion.div>
  );
}

/**
 * K-Map Header Component
 */
function KMapHeader({ labels, isRow = false }) {
  return (
    <div className={`flex ${isRow ? 'flex-col gap-1' : 'gap-1'}`}>
      {labels.map((label, index) => (
        <div
          key={index}
          className={`
            ${isRow ? 'w-14 h-14' : 'w-14 h-8'}
            flex items-center justify-center
            font-mono text-sm text-default-500
            bg-content2/30 rounded
          `}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

/**
 * K-Map Component
 * Displays Karnaugh Map with groupings
 */
export default function KMap() {
  const { result } = useLogic();

  const kmapData = useMemo(() => {
    if (!result?.kmap || !result?.kmapGroups) return null;
    return generateKMapVisualization(result.kmap, result.kmapGroups);
  }, [result]);

  const simplifiedExpression = useMemo(() => {
    if (!result?.kmap || !result?.kmapGroups) return '';
    return generateSimplifiedSOP(result.kmap, result.kmapGroups);
  }, [result]);

  if (!kmapData) {
    return (
      <Card className="bg-content1/50 backdrop-blur-md">
        <CardBody className="text-center py-12">
          <p className="text-default-400">
            K-Map generation requires 2-4 variables.
            {result?.variables?.length > 4 && (
              <span className="block mt-2">
                Current expression has {result.variables.length} variables.
              </span>
            )}
          </p>
        </CardBody>
      </Card>
    );
  }

  const { rowVars, colVars, rowHeaders, colHeaders, cellData, groups, numRows, numCols } = kmapData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* K-Map Card */}
      <Card className="bg-content1/50 backdrop-blur-md">
        <CardHeader className="flex flex-col items-start gap-2">
          <h3 className="text-lg font-semibold">Karnaugh Map</h3>
          <div className="flex gap-2 text-sm text-default-400">
            <span>
              Rows: <span className="text-primary font-mono">{rowVars.join('')}</span>
            </span>
            <span>•</span>
            <span>
              Columns: <span className="text-primary font-mono">{colVars.join('')}</span>
            </span>
          </div>
        </CardHeader>
        
        <CardBody>
          <div className="flex justify-center">
            <div className="inline-block">
              {/* Column variable labels */}
              <div className="flex items-center mb-2 ml-20">
                <span className="text-sm text-default-500 font-semibold mr-2">
                  {colVars.join('')}
                </span>
              </div>

              <div className="flex">
                {/* Row variable labels */}
                <div className="flex flex-col items-end justify-center mr-2">
                  <span className="text-sm text-default-500 font-semibold mb-2">
                    {rowVars.join('')}
                  </span>
                  <KMapHeader labels={rowHeaders} isRow />
                </div>

                {/* Main K-Map Grid */}
                <div>
                  {/* Column headers */}
                  <div className="flex gap-1 mb-1">
                    {colHeaders.map((header, index) => (
                      <div
                        key={index}
                        className="w-14 h-8 flex items-center justify-center font-mono text-sm text-default-500 bg-content2/30 rounded"
                      >
                        {header}
                      </div>
                    ))}
                  </div>

                  {/* Grid cells */}
                  <div className="space-y-1">
                    {cellData.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex gap-1">
                        {row.map((cell, colIndex) => (
                          <KMapCell
                            key={`${rowIndex}-${colIndex}`}
                            cell={cell}
                            groups={kmapData.cellGroups}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend for groups */}
          {kmapData.groups.length > 0 && (
            <div className="mt-6 pt-4 border-t border-default-200">
              <h4 className="text-sm font-semibold text-default-600 mb-3">Groups</h4>
              <div className="flex flex-wrap gap-2">
                {kmapData.groups.map((group, index) => {
                  const colors = [
                    'primary', 'danger', 'success', 'secondary', 
                    'warning', 'default'
                  ];
                  return (
                    <Tooltip
                      key={index}
                      content={`Covers ${group.cells.length} cells`}
                    >
                      <Chip
                        size="sm"
                        color={colors[index % colors.length]}
                        variant="flat"
                      >
                        <span className="font-mono">{group.term}</span>
                      </Chip>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Simplified Expression Card */}
      <Card className="bg-content1/50 backdrop-blur-md">
        <CardHeader>
          <h3 className="text-lg font-semibold">Simplified Expression (from K-Map)</h3>
        </CardHeader>
        <CardBody>
          <div className="flex items-center gap-2 mb-2">
            <Chip size="sm" color="success" variant="flat">SOP</Chip>
            <span className="text-sm text-default-400">Minimized Sum of Products</span>
          </div>
          <code className="block p-4 bg-content2/50 rounded-lg font-mono text-lg">
            {simplifiedExpression || '0'}
          </code>
        </CardBody>
      </Card>

      {/* K-Map Info Card */}
      <Card className="bg-content1/50 backdrop-blur-md">
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">
                {numRows}×{numCols}
              </p>
              <p className="text-sm text-default-400">Grid Size</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success">
                {kmapData.groups.length}
              </p>
              <p className="text-sm text-default-400">Groups</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">
                {cellData.flat().filter(c => c.value === 1).length}
              </p>
              <p className="text-sm text-default-400">Minterms</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary">
                {result?.variables?.length || 0}
              </p>
              <p className="text-sm text-default-400">Variables</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}
