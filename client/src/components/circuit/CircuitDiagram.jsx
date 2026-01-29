import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { Stage, Layer, Group, Rect, Text, Line, Circle, Path } from 'react-konva';
import { Card, CardHeader, CardBody, Button, Switch, Chip, Tooltip } from '@heroui/react';
import { motion } from 'framer-motion';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Download, 
  RotateCcw,
  Play,
  Pause
} from 'lucide-react';
import { useLogic } from '../../context/LogicContext.jsx';
import { CircuitNodeType, LayoutConfig, layoutCircuit } from '../../lib/logic/index.js';

/**
 * Gate shape paths and dimensions
 */
const GateShapes = {
  AND: {
    width: 60,
    height: 40,
    draw: (ctx) => {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(30, 0);
      ctx.arc(30, 20, 20, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(0, 40);
      ctx.closePath();
    },
    path: 'M0,0 L30,0 A20,20 0 0,1 30,40 L0,40 Z',
  },
  OR: {
    width: 60,
    height: 40,
    path: 'M0,0 Q20,0 35,20 Q20,40 0,40 Q15,20 0,0 Z',
  },
  NOT: {
    width: 40,
    height: 30,
    path: 'M0,0 L30,15 L0,30 Z',
    hasInversion: true,
  },
  XOR: {
    width: 65,
    height: 40,
    path: 'M5,0 Q25,0 40,20 Q25,40 5,40 Q20,20 5,0 Z M0,0 Q15,20 0,40',
  },
  NAND: {
    width: 65,
    height: 40,
    path: 'M0,0 L30,0 A20,20 0 0,1 30,40 L0,40 Z',
    hasInversion: true,
  },
  NOR: {
    width: 65,
    height: 40,
    path: 'M0,0 Q20,0 35,20 Q20,40 0,40 Q15,20 0,0 Z',
    hasInversion: true,
  },
  XNOR: {
    width: 70,
    height: 40,
    path: 'M5,0 Q25,0 40,20 Q25,40 5,40 Q20,20 5,0 Z M0,0 Q15,20 0,40',
    hasInversion: true,
  },
};

/**
 * Gate colors
 */
const GateColors = {
  AND: '#3b82f6',
  OR: '#8b5cf6',
  NOT: '#f59e0b',
  XOR: '#10b981',
  NAND: '#ec4899',
  NOR: '#f97316',
  XNOR: '#06b6d4',
  INPUT: '#6b7280',
  OUTPUT: '#22c55e',
  CONSTANT: '#9ca3af',
};

/**
 * Input node component
 */
function InputNode({ node, x, y, value, onToggle, isAnimating }) {
  const isHigh = value === 1;
  
  return (
    <Group x={x} y={y}>
      {/* Input background */}
      <Rect
        width={50}
        height={35}
        cornerRadius={8}
        fill={isHigh ? '#22c55e' : '#374151'}
        stroke={isHigh ? '#16a34a' : '#4b5563'}
        strokeWidth={2}
        shadowColor="black"
        shadowBlur={5}
        shadowOpacity={0.3}
      />
      
      {/* Label */}
      <Text
        x={0}
        y={8}
        width={50}
        text={node.label}
        fontSize={14}
        fontFamily="JetBrains Mono, monospace"
        fontStyle="bold"
        fill="white"
        align="center"
      />
      
      {/* Value indicator */}
      <Circle
        x={25}
        y={25}
        radius={4}
        fill={isHigh ? '#86efac' : '#6b7280'}
      />

      {/* Clickable overlay */}
      <Rect
        width={50}
        height={35}
        fill="transparent"
        onClick={onToggle}
        onTap={onToggle}
        style={{ cursor: 'pointer' }}
      />
    </Group>
  );
}

/**
 * Output node component
 */
function OutputNode({ node, x, y, value }) {
  const isHigh = value === 1;
  
  return (
    <Group x={x} y={y}>
      {/* LED indicator */}
      <Circle
        x={20}
        y={17}
        radius={15}
        fill={isHigh ? '#22c55e' : '#374151'}
        stroke={isHigh ? '#16a34a' : '#4b5563'}
        strokeWidth={3}
        shadowColor={isHigh ? '#22c55e' : 'transparent'}
        shadowBlur={isHigh ? 15 : 0}
      />
      
      {/* Inner glow */}
      {isHigh && (
        <Circle
          x={20}
          y={17}
          radius={8}
          fill="#86efac"
        />
      )}
      
      {/* Label */}
      <Text
        x={0}
        y={38}
        width={40}
        text={node.label}
        fontSize={12}
        fontFamily="JetBrains Mono, monospace"
        fill="#9ca3af"
        align="center"
      />
    </Group>
  );
}

/**
 * Logic gate component
 */
function GateNode({ node, x, y, value }) {
  const gateType = node.type;
  const shape = GateShapes[gateType] || GateShapes.AND;
  const color = GateColors[gateType] || GateColors.AND;
  const isHigh = value === 1;

  return (
    <Group x={x} y={y}>
      {/* Gate body */}
      <Path
        data={shape.path}
        fill={color}
        stroke={isHigh ? '#22c55e' : '#1f2937'}
        strokeWidth={2}
        shadowColor="black"
        shadowBlur={5}
        shadowOpacity={0.3}
      />
      
      {/* Inversion bubble for NAND, NOR, XNOR, NOT */}
      {shape.hasInversion && (
        <Circle
          x={gateType === 'NOT' ? 35 : shape.width - 5}
          y={shape.height / 2}
          radius={5}
          fill="#1f2937"
          stroke={color}
          strokeWidth={2}
        />
      )}
      
      {/* Gate label */}
      <Text
        x={gateType === 'NOT' ? 5 : 10}
        y={shape.height / 2 - 6}
        text={gateType}
        fontSize={10}
        fontFamily="Inter, sans-serif"
        fontStyle="bold"
        fill="white"
      />
    </Group>
  );
}

/**
 * Wire component
 */
function Wire({ points, value, isAnimating }) {
  const isHigh = value === 1;
  const color = isHigh ? '#22c55e' : '#ef4444';
  
  // Convert points to flat array
  const flatPoints = points.flatMap(p => [p.x, p.y]);
  
  return (
    <Group>
      {/* Wire shadow */}
      <Line
        points={flatPoints}
        stroke={color}
        strokeWidth={4}
        lineCap="round"
        lineJoin="round"
        opacity={0.3}
      />
      
      {/* Main wire */}
      <Line
        points={flatPoints}
        stroke={color}
        strokeWidth={2}
        lineCap="round"
        lineJoin="round"
        dash={isAnimating ? [5, 5] : undefined}
      />
      
      {/* Junction dots */}
      {points.slice(1, -1).map((point, index) => (
        <Circle
          key={index}
          x={point.x}
          y={point.y}
          radius={3}
          fill={color}
        />
      ))}
    </Group>
  );
}

/**
 * Circuit Diagram Component
 */
export default function CircuitDiagram() {
  const { result, inputValues, toggleInput, evaluatedOutput, resetInputs } = useLogic();
  const stageRef = useRef(null);
  const containerRef = useRef(null);
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: width - 32, height: Math.max(400, height - 100) });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Evaluate circuit and get node values
  const circuitData = useMemo(() => {
    if (!result?.circuit) return null;

    // Re-evaluate with current inputs
    result.circuit.evaluate(inputValues);
    
    // Re-layout
    const layout = layoutCircuit(result.circuit);
    
    return {
      graph: result.circuit,
      layout,
    };
  }, [result, inputValues]);

  // Handle zoom
  const handleZoom = useCallback((delta) => {
    setScale(prev => Math.max(0.25, Math.min(2, prev + delta)));
  }, []);

  // Reset view
  const handleResetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Export as image
  const handleExport = useCallback(() => {
    if (!stageRef.current) return;
    
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = 'circuit_diagram.png';
    link.href = uri;
    link.click();
  }, []);

  // Handle drag
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback((e) => {
    setIsDragging(false);
    setPosition({ x: e.target.x(), y: e.target.y() });
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    const delta = e.evt.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta);
  }, [handleZoom]);

  if (!circuitData) {
    return (
      <Card className="bg-content1/50 backdrop-blur-md">
        <CardBody className="text-center py-12">
          <p className="text-default-400">
            Enter an expression and click Analyze to generate a circuit diagram
          </p>
        </CardBody>
      </Card>
    );
  }

  const { graph, layout } = circuitData;
  const nodes = graph.getNodes();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
      ref={containerRef}
    >
      {/* Circuit Card */}
      <Card className="bg-content1/50 backdrop-blur-md">
        <CardHeader className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Circuit Diagram</h3>
            <Chip
              color={evaluatedOutput === 1 ? 'success' : 'danger'}
              variant="flat"
              size="sm"
            >
              Output: {evaluatedOutput}
            </Chip>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip content="Toggle Animation">
              <Button
                isIconOnly
                variant={isAnimating ? 'solid' : 'light'}
                size="sm"
                color={isAnimating ? 'primary' : 'default'}
                onClick={() => setIsAnimating(!isAnimating)}
              >
                {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            </Tooltip>
            
            <Tooltip content="Zoom Out">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onClick={() => handleZoom(-0.2)}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <span className="text-sm text-default-400 min-w-[50px] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <Tooltip content="Zoom In">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onClick={() => handleZoom(0.2)}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <Tooltip content="Reset View">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onClick={handleResetView}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </Tooltip>
            
            <Tooltip content="Export as PNG">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onClick={handleExport}
              >
                <Download className="w-4 h-4" />
              </Button>
            </Tooltip>
          </div>
        </CardHeader>
        
        <CardBody className="p-4">
          <div 
            className="circuit-canvas rounded-lg overflow-hidden border border-default-200"
            style={{ width: dimensions.width, height: dimensions.height }}
          >
            <Stage
              ref={stageRef}
              width={dimensions.width}
              height={dimensions.height}
              scaleX={scale}
              scaleY={scale}
              x={position.x}
              y={position.y}
              draggable
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onWheel={handleWheel}
            >
              <Layer>
                {/* Grid background */}
                {Array.from({ length: Math.ceil(layout.width / 50) }).map((_, i) => (
                  <Line
                    key={`v-${i}`}
                    points={[i * 50, 0, i * 50, layout.height]}
                    stroke="#1f2937"
                    strokeWidth={1}
                    opacity={0.3}
                  />
                ))}
                {Array.from({ length: Math.ceil(layout.height / 50) }).map((_, i) => (
                  <Line
                    key={`h-${i}`}
                    points={[0, i * 50, layout.width, i * 50]}
                    stroke="#1f2937"
                    strokeWidth={1}
                    opacity={0.3}
                  />
                ))}

                {/* Wires */}
                {graph.edges.map((edge) => (
                  <Wire
                    key={edge.id}
                    points={edge.points}
                    value={edge.value}
                    isAnimating={isAnimating}
                  />
                ))}

                {/* Nodes */}
                {nodes.map((node) => {
                  if (node.type === CircuitNodeType.INPUT) {
                    return (
                      <InputNode
                        key={node.id}
                        node={node}
                        x={node.x}
                        y={node.y}
                        value={inputValues[node.label] ?? 0}
                        onToggle={() => toggleInput(node.label)}
                        isAnimating={isAnimating}
                      />
                    );
                  }

                  if (node.type === CircuitNodeType.OUTPUT) {
                    return (
                      <OutputNode
                        key={node.id}
                        node={node}
                        x={node.x}
                        y={node.y}
                        value={node.value}
                      />
                    );
                  }

                  if (node.type === CircuitNodeType.CONSTANT) {
                    return (
                      <Group key={node.id} x={node.x} y={node.y}>
                        <Rect
                          width={30}
                          height={30}
                          cornerRadius={4}
                          fill="#374151"
                          stroke="#4b5563"
                          strokeWidth={2}
                        />
                        <Text
                          x={0}
                          y={8}
                          width={30}
                          text={node.label}
                          fontSize={14}
                          fontFamily="JetBrains Mono, monospace"
                          fontStyle="bold"
                          fill="white"
                          align="center"
                        />
                      </Group>
                    );
                  }

                  return (
                    <GateNode
                      key={node.id}
                      node={node}
                      x={node.x}
                      y={node.y}
                      value={node.value}
                    />
                  );
                })}
              </Layer>
            </Stage>
          </div>
        </CardBody>
      </Card>

      {/* Input Controls Card */}
      <Card className="bg-content1/50 backdrop-blur-md">
        <CardHeader className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Input Controls</h3>
          <Button
            size="sm"
            variant="light"
            startContent={<RotateCcw className="w-4 h-4" />}
            onClick={resetInputs}
          >
            Reset All
          </Button>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-4">
            {Object.entries(inputValues).map(([variable, value]) => (
              <div
                key={variable}
                className="flex items-center gap-3 p-3 bg-content2/50 rounded-lg"
              >
                <span className="font-mono font-semibold text-lg">{variable}</span>
                <Switch
                  isSelected={value === 1}
                  onValueChange={() => toggleInput(variable)}
                  aria-label={`Toggle input ${variable}`}
                  color="success"
                  size="lg"
                />
                <Chip
                  size="sm"
                  color={value === 1 ? 'success' : 'default'}
                  variant={value === 1 ? 'solid' : 'flat'}
                >
                  {value}
                </Chip>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Circuit Statistics */}
      <Card className="bg-content1/50 backdrop-blur-md">
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">
                {graph.inputs.length}
              </p>
              <p className="text-sm text-default-400">Inputs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-success">
                {graph.outputs.length}
              </p>
              <p className="text-sm text-default-400">Outputs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">
                {graph.getStatistics().totalGates}
              </p>
              <p className="text-sm text-default-400">Gates</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary">
                {graph.edges.length}
              </p>
              <p className="text-sm text-default-400">Wires</p>
            </div>
            <div>
              <p className={`text-2xl font-bold ${evaluatedOutput === 1 ? 'text-success' : 'text-danger'}`}>
                {evaluatedOutput}
              </p>
              <p className="text-sm text-default-400">Output</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}
