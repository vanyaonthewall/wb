import React, { useMemo } from 'react';
import { Footprints } from 'lucide-react';
import { ShapeType, EntryPosition, StoragePosition } from '../types';

interface PlanVisualizerProps {
  shape: ShapeType;
  entry?: EntryPosition | null;
  storage?: StoragePosition | null;
  area?: number; // Used for default calculation if width/depth missing
  width?: number; // Explicit width (meters)
  depth?: number; // Explicit depth (meters)
  onSelectEntry?: (pos: EntryPosition) => void;
  onSelectStorage?: (pos: StoragePosition) => void;
  interactive?: boolean;
  showFootprints?: boolean;
  showZoneLabel?: boolean;
  showDimensions?: boolean; // New prop to control dimensions visibility
  className?: string;
}

const PlanVisualizer: React.FC<PlanVisualizerProps> = ({ 
  shape, 
  entry, 
  storage, 
  area = 30,
  width: customWidth,
  depth: customDepth,
  onSelectEntry,
  onSelectStorage,
  interactive = false,
  showFootprints = true,
  showZoneLabel = false,
  showDimensions = true, // Default to true
  className = ''
}) => {
  
  // Real World Dimensions Calculation (Meters)
  const realDims = useMemo(() => {
    // If explicit dimensions are provided, use them
    if (customWidth && customDepth) {
      return { realW: customWidth, realH: customDepth };
    }

    // Fallback based on Area + Shape defaults
    let ar = 1;
    switch (shape) {
      case 'Horizontal': ar = 1.5; break;
      case 'Vertical': ar = 1/1.5; break;
      case 'Square': ar = 1; break;
      default: ar = 1;
    }

    // Area = W * H
    // AR = W / H  => W = H * AR
    // Area = (H * AR) * H = H^2 * AR
    // H = sqrt(Area / AR)
    const realH = Math.sqrt(area / ar);
    const realW = realH * ar;

    return { realW, realH };
  }, [area, shape, customWidth, customDepth]);

  // SVG Dimensions Calculation
  // We want to fit the Real Dimensions into a nice bounding box (e.g., max 90 units)
  const dimensions = useMemo(() => {
    const maxViewSize = 90;
    const { realW, realH } = realDims;
    const aspectRatio = realW / realH;

    let w, h;

    if (aspectRatio >= 1) {
      // Wider than tall or square
      w = maxViewSize;
      h = maxViewSize / aspectRatio;
    } else {
      // Taller than wide
      h = maxViewSize;
      w = maxViewSize * aspectRatio;
    }

    return { w, h };
  }, [realDims]);

  const { w, h } = dimensions;
  const cx = 50; // Center X of ViewBox
  const cy = 50; // Center Y of ViewBox
  const x = cx - w / 2;
  const y = cy - h / 2;

  // Scale: Pixels per Meter
  const pxPerMeter = w / realDims.realW;

  // Unified Colors for consistency across the app
  const ENTRY_COLOR = '#22c55e'; 
  const ENTRY_BG_HOVER = '#dcfce7'; 
  const ENTRY_STROKE = '#15803d'; 
  const ENTRY_STROKE_LIGHT = '#86efac'; 

  const STORAGE_COLOR = '#f97316'; 
  const STORAGE_BG_HOVER = '#ffedd5'; 
  const STORAGE_STROKE = '#c2410c'; 
  const STORAGE_STROKE_LIGHT = '#fdba74'; 

  // --- Render Functions ---

  const renderGrid = () => {
    const gridLines = [];
    const color = "#e4e4e7"; // zinc-200
    
    // Wall stroke is 2, so inner edge is at 1 unit offset
    const strokeOffset = 1; 

    // Vertical Lines
    const cols = Math.floor(realDims.realW);
    for (let i = 1; i <= cols; i++) {
        // If it's very close to the edge (within 0.1m), don't draw it to avoid clashing with border
        if (realDims.realW - i < 0.1) continue;
        const lineX = x + i * pxPerMeter;
        // Check if lineX is within the inner area (should be, given the loop)
        if (lineX <= x + strokeOffset || lineX >= x + w - strokeOffset) continue;

        gridLines.push(
            <line 
              key={`v-${i}`} 
              x1={lineX} 
              y1={y + strokeOffset} 
              x2={lineX} 
              y2={y + h - strokeOffset} 
              stroke={color} 
              strokeWidth="0.5" 
            />
        );
    }

    // Horizontal Lines
    const rows = Math.floor(realDims.realH);
    for (let i = 1; i <= rows; i++) {
        if (realDims.realH - i < 0.1) continue;
        const lineY = y + i * pxPerMeter;
        if (lineY <= y + strokeOffset || lineY >= y + h - strokeOffset) continue;

        gridLines.push(
            <line 
              key={`h-${i}`} 
              x1={x + strokeOffset} 
              y1={lineY} 
              x2={x + w - strokeOffset} 
              y2={lineY} 
              stroke={color} 
              strokeWidth="0.5" 
            />
        );
    }

    return <g className="pointer-events-none">{gridLines}</g>;
  };

  const renderDimensions = () => {
    // Only render if not interactive AND explicitly enabled
    if (interactive || !showDimensions) return null; 

    // Reduced offsets to be closer to the plan
    const topOffset = 6; // Increased from 4 to 6 to avoid overlap with wall
    const rightOffset = 5; 
    
    const tickSize = 3;
    const textColor = "#71717a"; // zinc-500
    const lineColor = "#a1a1aa"; // zinc-400
    const fontSize = 5.5; // Roughly maps to ~16px visually in typical card size

    const renderLabel = (value: number, xPos: number, yPos: number, rotate: number = 0) => {
        const text = `${value.toFixed(1)} м`;
        // Estimate width based on char count. 
        // 5.5 fontSize -> approx 3.2 width per char average for numerical/short text
        const textWidth = text.length * 3.2; 
        const paddingX = 4; // Horizontal padding total
        const paddingY = 2; // Vertical padding total
        const rectH = fontSize + paddingY;
        const rectW = textWidth + paddingX;
        
        return (
            <g transform={`translate(${xPos}, ${yPos}) rotate(${rotate})`}>
                <rect 
                    x={-rectW / 2} 
                    y={-rectH / 2} 
                    width={rectW} 
                    height={rectH} 
                    rx={rectH / 2} 
                    fill="white"
                />
                <text 
                    x={0} 
                    y={0} 
                    dy="0.35em" 
                    textAnchor="middle" 
                    fontSize={fontSize}
                    className="font-semibold" 
                    fill={textColor}
                >
                    {text}
                </text>
            </g>
        );
    };

    return (
      <g className="pointer-events-none select-none">
        {/* Top Wall Dimension */}
        <line x1={x} y1={y - topOffset} x2={x + w} y2={y - topOffset} stroke={lineColor} strokeWidth="0.5" />
        <line x1={x} y1={y - topOffset - tickSize/2} x2={x} y2={y - topOffset + tickSize/2} stroke={lineColor} strokeWidth="0.5" />
        <line x1={x + w} y1={y - topOffset - tickSize/2} x2={x + w} y2={y - topOffset + tickSize/2} stroke={lineColor} strokeWidth="0.5" />
        
        {/* Center label on the line */}
        {renderLabel(realDims.realW, cx, y - topOffset)}

        {/* Right Wall Dimension */}
        <line x1={x + w + rightOffset} y1={y} x2={x + w + rightOffset} y2={y + h} stroke={lineColor} strokeWidth="0.5" />
        <line x1={x + w + rightOffset - tickSize/2} y1={y} x2={x + w + rightOffset + tickSize/2} y2={y} stroke={lineColor} strokeWidth="0.5" />
        <line x1={x + w + rightOffset - tickSize/2} y1={y + h} x2={x + w + rightOffset + tickSize/2} y2={y + h} stroke={lineColor} strokeWidth="0.5" />
        
        {/* Center label on the line */}
        {renderLabel(realDims.realH, x + w + rightOffset, cy, 90)}
      </g>
    );
  };

  const renderDoor = (type: 'entry' | 'storage', position: string, isSelected: boolean) => {
    let dx = 0, dy = 0, dw = 0, dh = 0;
    // Reduced size from 22 to 14 to prevent overlap on narrow walls (e.g. vertical layout top/bottom)
    const size = 14; 
    const depth = 4; // Wall thickness
    const hitPadding = 10; 
    const offset = depth / 2; 

    // Determine basic hit-box and position inside the wall
    if (type === 'entry') {
      dy = y + h - offset;
      dh = depth;
      dw = size;
      if (position === 'Left') dx = x + w * 0.25 - size / 2;
      else if (position === 'Center') dx = x + w * 0.5 - size / 2;
      else if (position === 'Right') dx = x + w * 0.75 - size / 2;
    } else {
      const [wall, subPos] = position.split(' ');
      if (wall === 'Top') {
        dy = y - offset;
        dh = depth;
        dw = size;
        if (subPos === 'Left') dx = x + w * 0.25 - size / 2;
        else if (subPos === 'Center') dx = x + w * 0.5 - size / 2;
        else if (subPos === 'Right') dx = x + w * 0.75 - size / 2;
      } else if (wall === 'Left') {
        dx = x - offset;
        dw = depth;
        dh = size;
        if (subPos === 'Top') dy = y + h * 0.25 - size / 2;
        else if (subPos === 'Center') dy = y + h * 0.5 - size / 2;
        else if (subPos === 'Bottom') dy = y + h * 0.75 - size / 2;
      } else if (wall === 'Right') {
        dx = x + w - offset;
        dw = depth;
        dh = size;
        if (subPos === 'Top') dy = y + h * 0.25 - size / 2;
        else if (subPos === 'Center') dy = y + h * 0.5 - size / 2;
        else if (subPos === 'Bottom') dy = y + h * 0.75 - size / 2;
      }
    }

    const mainColor = type === 'entry' ? ENTRY_COLOR : STORAGE_COLOR;
    const hoverColor = type === 'entry' ? ENTRY_BG_HOVER : STORAGE_BG_HOVER;
    const strokeColor = type === 'entry' ? ENTRY_STROKE : STORAGE_STROKE;
    const lightStrokeColor = type === 'entry' ? ENTRY_STROKE_LIGHT : STORAGE_STROKE_LIGHT;

    // --- BTI Style Rendering for Selected State ---
    const renderBtiDoor = () => {
        const leafThick = 2.5;
        let leafX = 0, leafY = 0, leafW = 0, leafH = 0;
        let arcPath = '';
        
        // We assume standard swing:
        // Top/Bottom walls: Hinge on Left of the opening
        // Left/Right walls: Hinge on Top of the opening

        if (type === 'entry') { // Bottom Wall, opens Out (Down)
             // Hinge at Left (dx), opens Down
             leafX = dx;
             leafY = dy + depth; // Start below the wall
             leafW = leafThick;
             leafH = size;
             
             // Arc: Center (dx, dy+depth), Radius size. From 0deg (right) to 90deg (down)? 
             // Actually, from (dx+size, dy+depth) to (dx, dy+depth+size)
             const cx = dx;
             const cy = dy + depth;
             arcPath = `M ${cx + size} ${cy} A ${size} ${size} 0 0 1 ${cx + leafThick/2} ${cy + size}`;
        } else {
             const [wall] = position.split(' ');
             if (wall === 'Top') { // Top Wall, opens Out (Up)
                // Hinge at Left (dx), opens Up
                leafX = dx;
                leafY = dy - size;
                leafW = leafThick;
                leafH = size;
                
                const cx = dx;
                const cy = dy; // Bottom of the top wall rect roughly
                // Arc: From (dx+size, cy) to (dx, cy-size)
                arcPath = `M ${cx + size} ${cy} A ${size} ${size} 0 0 0 ${cx + leafThick/2} ${cy - size}`;

             } else if (wall === 'Left') { // Left Wall, opens Out (Left)
                // Hinge at Top (dy), opens Left
                leafX = dx - size;
                leafY = dy;
                leafW = size;
                leafH = leafThick;

                const cx = dx;
                const cy = dy;
                // Arc: From (cx, cy+size) to (cx-size, cy)
                arcPath = `M ${cx} ${cy + size} A ${size} ${size} 0 0 1 ${cx - size} ${cy + leafThick/2}`;

             } else if (wall === 'Right') { // Right Wall, opens Out (Right)
                // Hinge at Top (dy), opens Right
                leafX = dx + depth;
                leafY = dy;
                leafW = size;
                leafH = leafThick;

                const cx = dx + depth;
                const cy = dy;
                // Arc: From (cx, cy+size) to (cx+size, cy)
                arcPath = `M ${cx} ${cy + size} A ${size} ${size} 0 0 0 ${cx + size} ${cy + leafThick/2}`;
             }
        }

        return (
            <g className="animate-in fade-in duration-200">
                {/* 1. White mask to create the "hole" in the wall */}
                <rect x={dx} y={dy} width={dw} height={dh} fill="#fafafa" stroke="none" />
                
                {/* 2. Swing Arc */}
                <path d={arcPath} fill="none" stroke={mainColor} strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />

                {/* 3. Door Leaf (The physical door) */}
                <rect 
                  x={leafX} y={leafY} width={leafW} height={leafH} 
                  fill={mainColor} 
                  stroke={strokeColor}
                  strokeWidth="0.5"
                  rx="0.5"
                />
            </g>
        );
    };

    return (
      <g 
        key={`${type}-${position}`} 
        onClick={(e) => {
          e.stopPropagation();
          if (interactive) {
             if (type === 'entry' && onSelectEntry) onSelectEntry(position as EntryPosition);
             if (type === 'storage' && onSelectStorage) onSelectStorage(position as StoragePosition);
          }
        }}
        className={interactive ? "cursor-pointer group" : ""}
      >
        {/* Invisible larger hit box for easier clicking */}
        <rect 
          x={dx - hitPadding/2} 
          y={dy - hitPadding/2} 
          width={dw + hitPadding} 
          height={dh + hitPadding} 
          fill="transparent"
        />

        {isSelected ? (
            renderBtiDoor()
        ) : (
            // Default Inactive State (Interactive mode)
            // UPDATED: Fill color is now the hover color (pale green/orange), Stroke removed
            <rect 
                x={dx} y={dy} width={dw} height={dh} 
                fill={interactive ? hoverColor : 'transparent'}
                stroke="transparent"
                strokeWidth={0}
                className="transition-all"
            />
        )}
        
        {/* Hover Highlight (only if interactive and NOT selected) */}
        {interactive && !isSelected && (
           <rect 
             x={dx} y={dy} width={dw} height={dh} 
             fill={mainColor}
             className="opacity-0 group-hover:opacity-20 transition-opacity"
           />
        )}

        {/* Small dot for indication when interactive but not selected. Uses mainColor and full opacity. */}
        {interactive && !isSelected && (
           <circle cx={dx + dw/2} cy={dy + dh/2} r={2} fill={mainColor} className="pointer-events-none opacity-100" />
        )}
      </g>
    );
  };

  const renderInteractiveZones = () => {
    if (!interactive) return null;
    const zones: React.JSX.Element[] = [];
    ['Left', 'Center', 'Right'].forEach(p => zones.push(renderDoor('entry', p, entry === p)));
    ['Top Left', 'Top Center', 'Top Right', 'Left Top', 'Left Center', 'Left Bottom', 'Right Top', 'Right Center', 'Right Bottom'].forEach(p => 
      zones.push(renderDoor('storage', p, storage === p))
    );
    return zones;
  };

  const renderStaticDoors = () => {
    if (interactive) return null;
    return (
      <>
        {entry && renderDoor('entry', entry, true)}
        {storage && renderDoor('storage', storage, true)}
      </>
    );
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* 
        ViewBox expanded slightly to accommodate dimension lines 
        Orig: -5 -5 110 125
        New: -10 -15 120 135 to give room for top/right labels
      */}
      <svg viewBox="-15 -20 130 145" className="w-full h-full overflow-visible">
        
        {/* Wall Background and content group with Shadow */}
        <g className="drop-shadow-sm">
          <rect 
            x={x} y={y} width={w} height={h} 
            fill="#fafafa"       
            stroke="#27272a"     
            strokeWidth="2"      
            rx="0"               
          />

          {/* Grid Overlay */}
          {renderGrid()}

          {/* Zone Label */}
          {showZoneLabel && (
            <text 
              x={cx} 
              y={cy} 
              textAnchor="middle" 
              dominantBaseline="middle" 
              className="text-[4px] font-semibold fill-zinc-400 pointer-events-none select-none uppercase tracking-widest"
            >
              Клиентская зона
            </text>
          )}
          
          {/* Doors */}
          {renderInteractiveZones()}
          {renderStaticDoors()}
        </g>
        
        {/* Dimensions (Outside Shadow Group) */}
        {renderDimensions()}

        {/* User Icon */}
        {showFootprints && (
          <foreignObject x={42} y={110} width={16} height={16}>
              <div className="flex justify-center text-[#22c55e]">
                  <Footprints size={16} fill="currentColor" fillOpacity={0.2} />
              </div>
          </foreignObject>
        )}
      </svg>
    </div>
  );
};

export default PlanVisualizer;