import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCw, 
  Layers, 
  Search, 
  Crosshair, 
  Info, 
  Compass, 
  Sparkles, 
  Zap, 
  Cpu, 
  Radio, 
  Sliders, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Eye, 
  EyeOff, 
  Activity, 
  FileText, 
  ArrowRight,
  SplitSquareVertical,
  Maximize,
  HelpCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Board, BoardComponent, ConnectionNet } from '../types';

interface BoardviewViewerProps {
  board: Board;
  components: BoardComponent[];
  connections: ConnectionNet[];
  onSelectComponent?: (comp: BoardComponent | null) => void;
  selectedComponentProp?: BoardComponent | null;
  onSelectNet?: (net: ConnectionNet | null) => void;
}

export const BoardviewViewer: React.FC<BoardviewViewerProps> = ({
  board,
  components,
  connections,
  onSelectComponent,
  selectedComponentProp,
  onSelectNet,
}) => {
  // Layer state: TOP or BOTTOM
  const [currentLayer, setCurrentLayer] = useState<'TOP' | 'BOTTOM'>('TOP');
  
  // Transform & Viewport
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Selected entities
  const [selectedComp, setSelectedComp] = useState<BoardComponent | null>(null);
  const [hoveredComp, setHoveredComp] = useState<BoardComponent | null>(null);
  const [selectedNet, setSelectedNet] = useState<ConnectionNet | null>(null);

  // In-viewer filters & search
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showPins, setShowPins] = useState<boolean>(true);
  const [showTraces, setShowTraces] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Measure / Probe Mode (Diode mode & multimeter simulation)
  const [probeMode, setProbeMode] = useState<boolean>(false);
  const [probePointA, setProbePointA] = useState<{ x: number; y: number; label?: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Sync external selected component if passed
  useEffect(() => {
    if (selectedComponentProp) {
      setSelectedComp(selectedComponentProp);
      if (selectedComponentProp.layer !== currentLayer) {
        setCurrentLayer(selectedComponentProp.layer);
      }
      // Center on selected component
      centerOnPoint(selectedComponentProp.x, selectedComponentProp.y);
    }
  }, [selectedComponentProp]);

  // Handle Layer Switch
  const toggleLayer = () => {
    setCurrentLayer(prev => (prev === 'TOP' ? 'BOTTOM' : 'TOP'));
  };

  // Center on coordinate
  const centerOnPoint = (x: number, y: number) => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    setPan({
      x: width / 2 - x * zoom,
      y: height / 2 - y * zoom,
    });
  };

  // Reset View
  const handleResetView = () => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    // Default center for 1000x800 board layout
    const targetScale = Math.min(width / 1100, height / 850);
    setZoom(targetScale > 0.3 ? targetScale : 0.8);
    setPan({
      x: (width - 1000 * targetScale) / 2,
      y: (height - 750 * targetScale) / 2,
    });
    setRotation(0);
  };

  useEffect(() => {
    handleResetView();
  }, [board.id]);

  // Mouse wheel Zooming
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.max(0.2, Math.min(zoom * zoomFactor, 15));

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Adjust pan so zoom happens around cursor
      setPan(prev => ({
        x: mouseX - (mouseX - prev.x) * (newZoom / zoom),
        y: mouseY - (mouseY - prev.y) * (newZoom / zoom),
      }));
      setZoom(newZoom);
    }
  };

  // Dragging / Pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) { // Left or middle click
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handling for mobile/tablet pinch & drag
  const touchStartRef = useRef<{ dist: number; x: number; y: number }>({ dist: 0, x: 0, y: 0 });
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = {
        dist,
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / (touchStartRef.current.dist || dist);
      setZoom(prev => Math.max(0.2, Math.min(prev * factor, 15)));
      touchStartRef.current.dist = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Filtered components on current layer
  const visibleComponents = useMemo(() => {
    return components.filter(c => {
      // Must match layer
      if (c.layer !== currentLayer) return false;
      // Filter type
      if (filterType !== 'ALL' && c.type !== filterType) return false;
      // Filter search
      if (searchQuery) {
        const q = searchQuery.toUpperCase();
        const matchesRef = c.refDes.toUpperCase().includes(q);
        const matchesName = c.name?.toUpperCase().includes(q);
        const matchesPart = c.partNumber?.toUpperCase().includes(q);
        const matchesNet = c.connectedNets?.some(n => n.toUpperCase().includes(q));
        if (!matchesRef && !matchesName && !matchesPart && !matchesNet) return false;
      }
      return true;
    });
  }, [components, currentLayer, filterType, searchQuery]);

  // Find connected components when a net or component is selected
  const activeNetPoints = useMemo(() => {
    if (!selectedNet) return [];
    return selectedNet.points.filter(p => p.layer === currentLayer);
  }, [selectedNet, currentLayer]);

  // Click on a component
  const handleComponentClick = (comp: BoardComponent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedComp(comp);
    if (onSelectComponent) onSelectComponent(comp);

    // If component has a primary net, highlight it
    if (comp.connectedNets && comp.connectedNets.length > 0) {
      const net = connections.find(n => n.name === comp.connectedNets![0]);
      if (net) {
        setSelectedNet(net);
        if (onSelectNet) onSelectNet(net);
      }
    } else {
      setSelectedNet(null);
    }
  };

  // Component styling helper
  const getComponentColor = (type: string, isSelected: boolean, isConnected: boolean) => {
    if (isSelected) return '#f59e0b'; // Amber 500
    if (isConnected) return '#06b6d4'; // Cyan 500 (highlighted net connection)
    switch (type) {
      case 'IC':
        return '#8b5cf6'; // Violet
      case 'CAPACITOR':
        return '#3b82f6'; // Blue
      case 'RESISTOR':
        return '#10b981'; // Emerald
      case 'INDUCTOR':
        return '#f97316'; // Orange
      case 'DIODE':
        return '#ec4899'; // Pink
      case 'TEST_POINT':
        return '#eab308'; // Yellow
      case 'CONNECTOR':
        return '#64748b'; // Slate
      default:
        return '#6b7280'; // Gray
    }
  };

  return (
    <div className="relative flex flex-col w-full h-full bg-slate-950 text-slate-100 overflow-hidden select-none border border-slate-800 rounded-xl shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-900/90 backdrop-blur border-b border-slate-800 z-20 gap-2">
        {/* Left Actions: Board side & Navigation */}
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setCurrentLayer('TOP')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                currentLayer === 'TOP'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الوجه العلوي (Top Side A)
            </button>
            <button
              onClick={() => setCurrentLayer('BOTTOM')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                currentLayer === 'BOTTOM'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الوجه السفلي (Bottom Side B)
            </button>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          {/* Zoom & View Controls */}
          <div className="flex items-center space-x-1 space-x-reverse bg-slate-800/80 rounded-lg p-1 border border-slate-700/60">
            <button
              onClick={() => setZoom(prev => Math.min(prev * 1.25, 15))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              title="تكبير (Zoom In)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(prev => Math.max(prev * 0.8, 0.2))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              title="تصغير (Zoom Out)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              title="إعادة ضبط الرؤية (Fit)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              title="تدوير البوردة 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Search & Filter in Boardview */}
        <div className="flex items-center space-x-2 space-x-reverse flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث عن مكون (U1001, C204, TP..)، أو مسار..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">الكل (All Components)</option>
            <option value="IC">الدوائر المتكاملة (ICs)</option>
            <option value="CAPACITOR">المكثفات (Capacitors)</option>
            <option value="RESISTOR">المقاومات (Resistors)</option>
            <option value="DIODE">الدايودات (Diodes)</option>
            <option value="TEST_POINT">نقاط الفحص (Test Points)</option>
            <option value="CONNECTOR">الكونكتورات (Connectors)</option>
          </select>
        </div>

        {/* Right Actions: Display Toggles & Tools */}
        <div className="flex items-center space-x-1.5 space-x-reverse">
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-2.5 py-1 text-xs rounded border transition-colors ${
              showLabels
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="إظهار/إخفاء أسماء المكونات"
          >
            {showLabels ? 'الأسماء ON' : 'الأسماء OFF'}
          </button>

          <button
            onClick={() => setShowTraces(!showTraces)}
            className={`px-2.5 py-1 text-xs rounded border transition-colors ${
              showTraces
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="إظهار/إخفاء خطوط وتوصيلات المسارات"
          >
            {showTraces ? 'المسارات ON' : 'المسارات OFF'}
          </button>

          <button
            onClick={() => setProbeMode(!probeMode)}
            className={`flex items-center space-x-1 space-x-reverse px-2.5 py-1 text-xs rounded border transition-colors ${
              probeMode
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="وضع الفحص / قياس الممانعة Diode Mode"
          >
            <Activity className="w-3.5 h-3.5 ml-1" />
            <span>فحص الممانعة</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Board Canvas */}
      <div 
        ref={containerRef}
        className="relative flex-1 w-full h-full bg-[#070b14] overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          setSelectedComp(null);
          if (onSelectComponent) onSelectComponent(null);
        }}
      >
        {/* Subtle Engineering Grid */}
        {showGrid && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
              backgroundSize: `${40 * zoom}px ${40 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`
            }}
          />
        )}

        {/* SVG Rendering Layer for Board, Traces, Components and Nets */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
        >
          <g
            transform={`translate(${pan.x}, ${pan.y}) scale(${zoom}) rotate(${rotation}, 500, 375)`}
            className="pointer-events-auto"
          >
            {/* PCB Motherboard Outline */}
            <rect
              x="50"
              y="40"
              width="900"
              height="670"
              rx="24"
              ry="24"
              fill={currentLayer === 'TOP' ? '#0f291e' : '#14232f'}
              stroke={currentLayer === 'TOP' ? '#10b981' : '#0284c7'}
              strokeWidth="3"
              className="transition-colors duration-300"
            />
            {/* Ground Plane Texture pattern / Copper Pour */}
            <rect
              x="60"
              y="50"
              width="880"
              height="650"
              rx="18"
              ry="18"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.04"
              strokeDasharray="4 4"
            />

            {/* Board Mounting Holes / Gold Contacts */}
            <circle cx="90" cy="80" r="14" fill="#070b14" stroke="#eab308" strokeWidth="2.5" />
            <circle cx="910" cy="80" r="14" fill="#070b14" stroke="#eab308" strokeWidth="2.5" />
            <circle cx="90" cy="670" r="14" fill="#070b14" stroke="#eab308" strokeWidth="2.5" />
            <circle cx="910" cy="670" r="14" fill="#070b14" stroke="#eab308" strokeWidth="2.5" />

            {/* Render High-Resolution Background Board Image if provided in DB */}
            {currentLayer === 'TOP' && board.boardSideAImage && (
              <image
                href={board.boardSideAImage}
                x="50"
                y="40"
                width="900"
                height="670"
                preserveAspectRatio="none"
                opacity={0.35}
              />
            )}
            {currentLayer === 'BOTTOM' && board.boardSideBImage && (
              <image
                href={board.boardSideBImage}
                x="50"
                y="40"
                width="900"
                height="670"
                preserveAspectRatio="none"
                opacity={0.35}
              />
            )}

            {/* Traces / Connections Vector Lines */}
            {showTraces && connections.map(net => {
              const isSelected = selectedNet?.id === net.id || (selectedComp?.connectedNets?.includes(net.name));
              const netColor = net.color || (net.type === 'POWER' ? '#ef4444' : net.type === 'GROUND' ? '#64748b' : '#06b6d4');

              return (
                <g key={`net-${net.id}`}>
                  {/* Traces paths */}
                  {net.traces?.filter(t => t.layer === currentLayer).map((trace, idx) => {
                    const pointsStr = trace.path.map(pt => `${pt[0]},${pt[1]}`).join(' ');
                    return (
                      <polyline
                        key={`trace-${idx}`}
                        points={pointsStr}
                        fill="none"
                        stroke={netColor}
                        strokeWidth={isSelected ? '4' : '1.5'}
                        strokeOpacity={isSelected ? 0.9 : 0.25}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={isSelected ? 'animate-pulse' : ''}
                      />
                    );
                  })}

                  {/* Net Lines connecting component pins directly */}
                  {isSelected && net.points.length > 1 && (
                    <polyline
                      points={net.points
                        .filter(p => p.layer === currentLayer)
                        .map(p => `${p.x},${p.y}`)
                        .join(' ')}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      className="animate-pulse"
                    />
                  )}
                </g>
              );
            })}

            {/* Components Rendering */}
            {visibleComponents.map(comp => {
              const isSelected = selectedComp?.id === comp.id;
              const isHovered = hoveredComp?.id === comp.id;
              const isNetConnected = !!(
                selectedNet && comp.connectedNets?.includes(selectedNet.name)
              );
              const color = getComponentColor(comp.type, isSelected, isNetConnected);

              return (
                <g
                  key={comp.id}
                  transform={`translate(${comp.x}, ${comp.y}) rotate(${comp.rotation || 0})`}
                  onClick={(e) => handleComponentClick(comp, e)}
                  onMouseEnter={() => setHoveredComp(comp)}
                  onMouseLeave={() => setHoveredComp(null)}
                  className="cursor-pointer group"
                >
                  {/* Highlight Glow when Selected or on Active Net */}
                  {(isSelected || isNetConnected) && (
                    <rect
                      x={-comp.width / 2 - 4}
                      y={-comp.height / 2 - 4}
                      width={comp.width + 8}
                      height={comp.height + 8}
                      rx="4"
                      fill="none"
                      stroke={isSelected ? '#f59e0b' : '#06b6d4'}
                      strokeWidth="2.5"
                      strokeDasharray={isNetConnected ? '4 2' : 'none'}
                      opacity="0.9"
                    />
                  )}

                  {/* Component Body */}
                  <rect
                    x={-comp.width / 2}
                    y={-comp.height / 2}
                    width={comp.width}
                    height={comp.height}
                    rx={comp.type === 'TEST_POINT' ? comp.width / 2 : 2}
                    fill={color}
                    fillOpacity={isSelected ? 0.95 : isHovered ? 0.85 : 0.65}
                    stroke={isSelected ? '#ffffff' : color}
                    strokeWidth={isSelected ? '2' : '1'}
                    className="transition-all duration-150"
                  />

                  {/* Terminal / Solder Pads for standard SMDs */}
                  {comp.type !== 'TEST_POINT' && comp.width > 12 && (
                    <>
                      <rect
                        x={-comp.width / 2}
                        y={-comp.height / 2}
                        width={Math.min(comp.width * 0.22, 6)}
                        height={comp.height}
                        fill="#cbd5e1"
                      />
                      <rect
                        x={comp.width / 2 - Math.min(comp.width * 0.22, 6)}
                        y={-comp.height / 2}
                        width={Math.min(comp.width * 0.22, 6)}
                        height={comp.height}
                        fill="#cbd5e1"
                      />
                    </>
                  )}

                  {/* IC Orientation Dot (Pin 1 Indicator) */}
                  {comp.type === 'IC' && (
                    <circle
                      cx={-comp.width / 2 + 5}
                      cy={-comp.height / 2 + 5}
                      r="2.5"
                      fill="#ffffff"
                    />
                  )}

                  {/* Component Pins (BGA or QFN balls) */}
                  {showPins && comp.pins && comp.pins.map(pin => {
                    const isPinActiveNet = selectedNet && pin.netName === selectedNet.name;
                    return (
                      <circle
                        key={pin.id}
                        cx={pin.x}
                        cy={pin.y}
                        r="2.5"
                        fill={isPinActiveNet ? '#f59e0b' : pin.isGnd ? '#475569' : '#e2e8f0'}
                        stroke={isPinActiveNet ? '#ffffff' : '#000000'}
                        strokeWidth="0.8"
                      />
                    );
                  })}

                  {/* RefDes Label */}
                  {showLabels && (
                    <text
                      x="0"
                      y={comp.height / 2 + (zoom > 1.2 ? 10 : 8)}
                      textAnchor="middle"
                      fill={isSelected ? '#fde047' : '#94a3b8'}
                      fontSize={Math.max(8, Math.min(12, 10 / Math.sqrt(zoom)))}
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      fontFamily="monospace"
                      className="pointer-events-none drop-shadow"
                    >
                      {comp.refDes}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Hover Floating Mini Card */}
        {hoveredComp && !selectedComp && (
          <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-3 rounded-lg shadow-xl text-xs z-30 pointer-events-none animate-fadeIn">
            <div className="flex items-center space-x-2 space-x-reverse mb-1">
              <span className="font-mono font-bold text-amber-400 text-sm">{hoveredComp.refDes}</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">{hoveredComp.type}</span>
            </div>
            {hoveredComp.name && <div className="text-slate-200 font-medium">{hoveredComp.name}</div>}
            {hoveredComp.partNumber && <div className="text-slate-400">رقم القطعة: <span className="font-mono text-cyan-400">{hoveredComp.partNumber}</span></div>}
            {hoveredComp.diodeModeValue && (
              <div className="text-emerald-400 font-mono mt-1">الممانعة (Diode): {hoveredComp.diodeModeValue} V</div>
            )}
          </div>
        )}

        {/* Bottom Status & Coordinate Info */}
        <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center space-x-3 space-x-reverse z-10">
          <span>الطبقة: <b className="text-cyan-400">{currentLayer}</b></span>
          <span>•</span>
          <span>التكبير: <b className="text-white">{Math.round(zoom * 100)}%</b></span>
          <span>•</span>
          <span>المكونات: <b className="text-white">{visibleComponents.length}</b></span>
          {selectedNet && (
            <>
              <span>•</span>
              <span>المسار المحدد: <b className="text-amber-400">{selectedNet.name}</b></span>
            </>
          )}
        </div>
      </div>

      {/* Selected Component Inspection Bottom Drawer */}
      {selectedComp && (
        <div className="bg-slate-900 border-t border-slate-800 p-4 z-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-slideUp">
          <div className="flex items-start space-x-3 space-x-reverse">
            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <h3 className="font-mono font-bold text-lg text-white">{selectedComp.refDes}</h3>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-cyan-400 border border-slate-700">
                  {selectedComp.type}
                </span>
                <span className="text-xs text-slate-400">({selectedComp.layer === 'TOP' ? 'الوجه العلوي' : 'الوجه السفلي'})</span>
              </div>
              <p className="text-sm text-slate-300 mt-0.5">{selectedComp.name || 'مكون إلكتروني'}</p>
              {selectedComp.partNumber && (
                <div className="text-xs text-slate-400 mt-0.5">
                  رقم الشريحة / الكود: <span className="font-mono text-cyan-300 font-semibold">{selectedComp.partNumber}</span>
                  {selectedComp.package && <span className="mr-2 text-slate-500">الحزمة: {selectedComp.package}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Electrical Measurement Readings: Diode mode & Voltages (Crucial for repair technicians) */}
          <div className="flex flex-wrap items-center gap-3">
            {selectedComp.diodeModeValue && (
              <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-emerald-900/60 flex items-center space-x-2 space-x-reverse">
                <Activity className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-[10px] text-slate-400">قيمة الممانعة Diode</div>
                  <div className="font-mono font-bold text-emerald-400 text-sm">{selectedComp.diodeModeValue} V</div>
                </div>
              </div>
            )}

            {selectedComp.voltageValue && (
              <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-amber-900/60 flex items-center space-x-2 space-x-reverse">
                <Zap className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-[10px] text-slate-400">الجهد المتوقع</div>
                  <div className="font-mono font-bold text-amber-400 text-sm">{selectedComp.voltageValue}</div>
                </div>
              </div>
            )}

            {selectedComp.value && (
              <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center space-x-2 space-x-reverse">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-[10px] text-slate-400">القيمة الاسمية</div>
                  <div className="font-mono font-bold text-cyan-400 text-sm">{selectedComp.value}</div>
                </div>
              </div>
            )}

            {/* Connected Nets Tags */}
            {selectedComp.connectedNets && selectedComp.connectedNets.length > 0 && (
              <div className="flex items-center space-x-1 space-x-reverse">
                <span className="text-xs text-slate-400 ml-1">المسارات المتصلة:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedComp.connectedNets.map(netName => {
                    const isCurrent = selectedNet?.name === netName;
                    return (
                      <button
                        key={netName}
                        onClick={() => {
                          const net = connections.find(n => n.name === netName);
                          if (net) {
                            setSelectedNet(net);
                            if (onSelectNet) onSelectNet(net);
                          }
                        }}
                        className={`text-xs font-mono px-2 py-1 rounded transition-colors ${
                          isCurrent
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                        }`}
                      >
                        {netName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedComp(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              إغلاق ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
