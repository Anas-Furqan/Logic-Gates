import React, { useMemo, useCallback } from 'react';
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Tooltip,
  Divider,
} from '@heroui/react';
import { motion } from 'framer-motion';
import { Download, FileText, FileSpreadsheet, Copy, Check } from 'lucide-react';
import { useLogic } from '../../context/LogicContext.jsx';
import { truthTableToCSV, generateSOP, generatePOS } from '../../lib/logic/index.js';

/**
 * Truth Table Component
 * Displays the complete truth table with export options
 */
export default function TruthTable() {
  const { result, inputValues, setInput } = useLogic();
  const [copied, setCopied] = React.useState(false);

  const truthTable = result?.truthTable;

  /**
   * Column definitions for the table
   */
  const columns = useMemo(() => {
    if (!truthTable) return [];
    
    return [
      ...truthTable.variables.map((v) => ({
        key: v,
        label: v,
        type: 'input',
      })),
      {
        key: 'output',
        label: 'Output',
        type: 'output',
      },
    ];
  }, [truthTable]);

  /**
   * Format row data for display
   */
  const rows = useMemo(() => {
    if (!truthTable) return [];
    
    return truthTable.rows.map((row, index) => ({
      key: index,
      ...row.inputs,
      output: row.output,
      isHighlighted: row.output === 1,
    }));
  }, [truthTable]);

  /**
   * Check if a row matches current input values
   */
  const isCurrentRow = useCallback((row) => {
    if (!truthTable) return false;
    return truthTable.variables.every((v) => row[v] === inputValues[v]);
  }, [truthTable, inputValues]);

  /**
   * Handle CSV export
   */
  const handleExportCSV = useCallback(() => {
    if (!truthTable) return;
    
    const csv = truthTableToCSV(truthTable);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'truth_table.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [truthTable]);

  /**
   * Handle copy to clipboard
   */
  const handleCopy = useCallback(async () => {
    if (!truthTable) return;
    
    const csv = truthTableToCSV(truthTable);
    await navigator.clipboard.writeText(csv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [truthTable]);

  /**
   * Click on row to set inputs
   */
  const handleRowClick = useCallback((row) => {
    if (!truthTable) return;
    
    truthTable.variables.forEach((v) => {
      setInput(v, row[v]);
    });
  }, [truthTable, setInput]);

  if (!truthTable) {
    return (
      <Card className="bg-content1/50 backdrop-blur-md">
        <CardBody className="text-center py-12">
          <p className="text-default-400">
            Enter an expression and click Analyze to generate a truth table
          </p>
        </CardBody>
      </Card>
    );
  }

  // Generate canonical forms
  const sopExpression = generateSOP(truthTable);
  const posExpression = generatePOS(truthTable);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Truth Table Card */}
      <Card className="bg-content1/50 backdrop-blur-md">
        <CardHeader className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Truth Table</h3>
            <p className="text-sm text-default-400">
              {truthTable.rows.length} rows • {truthTable.variables.length} variables
            </p>
          </div>
          <div className="flex gap-2">
            <Tooltip content="Copy to clipboard">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </Tooltip>
            <Tooltip content="Export as CSV">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onClick={handleExportCSV}
              >
                <FileSpreadsheet className="w-4 h-4" />
              </Button>
            </Tooltip>
          </div>
        </CardHeader>
        
        <CardBody className="overflow-auto max-h-[500px]">
          <Table
            aria-label="Truth table"
            removeWrapper
            isHeaderSticky
            classNames={{
              base: 'truth-table',
              th: 'bg-content2/50 text-default-600 font-semibold',
              td: 'text-center font-mono',
            }}
          >
            <TableHeader>
              {columns.map((col) => (
                <TableColumn
                  key={col.key}
                  className={col.type === 'output' ? 'bg-primary-100/20 dark:bg-primary-900/20' : ''}
                >
                  <span className={col.type === 'output' ? 'text-primary font-bold' : ''}>
                    {col.label}
                  </span>
                </TableColumn>
              ))}
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.key}
                  className={`
                    cursor-pointer transition-colors
                    ${row.isHighlighted ? 'bg-success-100/30 dark:bg-success-900/20' : ''}
                    ${isCurrentRow(row) ? 'ring-2 ring-primary ring-inset' : ''}
                    hover:bg-default-100/50
                  `}
                  onClick={() => handleRowClick(row)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.type === 'output' ? (
                        <Chip
                          size="sm"
                          color={row.output === 1 ? 'success' : 'default'}
                          variant={row.output === 1 ? 'solid' : 'flat'}
                        >
                          {row.output}
                        </Chip>
                      ) : (
                        <span className={row[col.key] === 1 ? 'text-success-600 font-bold' : 'text-default-400'}>
                          {row[col.key]}
                        </span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Statistics Card */}
      <Card className="bg-content1/50 backdrop-blur-md">
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">
                {truthTable.stats.totalRows}
              </p>
              <p className="text-sm text-default-400">Total Rows</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success">
                {truthTable.stats.trueCount}
              </p>
              <p className="text-sm text-default-400">True (1)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-danger">
                {truthTable.stats.falseCount}
              </p>
              <p className="text-sm text-default-400">False (0)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">
                {truthTable.variables.length}
              </p>
              <p className="text-sm text-default-400">Variables</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Canonical Forms Card */}
      <Card className="bg-content1/50 backdrop-blur-md">
        <CardHeader>
          <h3 className="text-lg font-semibold">Canonical Forms</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Chip size="sm" color="success" variant="flat">SOP</Chip>
              <span className="text-sm text-default-400">Sum of Products</span>
            </div>
            <code className="block p-3 bg-content2/50 rounded-lg font-mono text-sm overflow-x-auto">
              {sopExpression}
            </code>
          </div>
          
          <Divider />
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Chip size="sm" color="primary" variant="flat">POS</Chip>
              <span className="text-sm text-default-400">Product of Sums</span>
            </div>
            <code className="block p-3 bg-content2/50 rounded-lg font-mono text-sm overflow-x-auto">
              {posExpression}
            </code>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}
