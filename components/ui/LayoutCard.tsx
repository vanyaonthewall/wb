import React from 'react';
import { Layout } from '../../types';
import PlanVisualizer from '../PlanVisualizer';
import { MoveRight, Star } from 'lucide-react';

interface LayoutCardProps {
  layout: Layout;
  isBestMatch?: boolean;
  onSelect?: () => void;
}

const translateStorage = (pos: string): string => {
  const map: Record<string, string> = {
    'Top Left': 'Сверху-Слева',
    'Top Center': 'Сверху-Центр',
    'Top Right': 'Сверху-Справа',
    'Left Top': 'Слева-Сверху',
    'Left Center': 'Слева-Центр',
    'Left Bottom': 'Слева-Снизу',
    'Right Top': 'Справа-Сверху',
    'Right Center': 'Справа-Центр',
    'Right Bottom': 'Справа-Снизу'
  };
  return map[pos] || pos;
};

const translateEntry = (pos: string): string => {
  const map: Record<string, string> = {
    'Left': 'Слева',
    'Center': 'По центру',
    'Right': 'Справа'
  };
  return map[pos] || pos;
};

export const generateLayoutCode = (layout: Layout): string => {
  // 1. Shape: К (Square), Г (Horizontal), В (Vertical)
  const shapeMap: Record<string, string> = {
    'Square': 'К',
    'Horizontal': 'Г',
    'Vertical': 'В'
  };
  const shapeCode = shapeMap[layout.shape] || 'К';

  // 2. Entry: Л (Left), Ц (Center), П (Right)
  const entryMap: Record<string, string> = {
    'Left': 'Л',
    'Center': 'Ц',
    'Right': 'П'
  };
  const entryCode = entryMap[layout.entry] || 'Ц';

  // 3. Storage
  // Walls: Ф (Top/Front), Л (Left), П (Right)
  // Logic from spec:
  // Left Wall (Л): 1 (near facade/bottom), 2 (center), 3 (near corner/top)
  // Front Wall (Ф): 1 (left corner), 2 (center), 3 (right corner)
  // Right Wall (П): 1 (far corner/top), 2 (center), 3 (near facade/bottom)
  
  let storageCode = '';
  const s = layout.storage;

  // Front/Top Wall
  if (s === 'Top Left') storageCode = 'Ф1';
  if (s === 'Top Center') storageCode = 'Ф2';
  if (s === 'Top Right') storageCode = 'Ф3';

  // Left Wall
  // Note: My data 'Left Bottom' is closer to facade -> 1
  if (s === 'Left Bottom') storageCode = 'Л1'; 
  if (s === 'Left Center') storageCode = 'Л2';
  if (s === 'Left Top') storageCode = 'Л3';

  // Right Wall
  // Note: My data 'Right Top' is far corner -> 1
  if (s === 'Right Top') storageCode = 'П1'; 
  if (s === 'Right Center') storageCode = 'П2';
  if (s === 'Right Bottom') storageCode = 'П3'; 

  // Fallback
  if (!storageCode) storageCode = 'Ф2';

  // 4. Variant (.01 default)
  const variant = '.01';

  return `${shapeCode}${layout.area}-${entryCode}${storageCode}${variant}`;
};

const LayoutCard: React.FC<LayoutCardProps> = ({ layout, isBestMatch, onSelect }) => {
  const namingCode = generateLayoutCode(layout);

  return (
    <div className="group bg-white rounded-xl border border-zinc-200 overflow-hidden hover:shadow-lg hover:border-zinc-300 transition-all duration-300 flex flex-col h-full relative">
      
      {/* Top Section: Plan with fixed aspect ratio and padding */}
      {/* Added cursor-pointer and onClick to the container */}
      <div 
        onClick={onSelect}
        className="w-full aspect-[4/3] p-4 relative flex items-center justify-center bg-white border-b border-zinc-100 cursor-pointer"
      >
        {/* Best Match Badge - Yellow - text-xs (12px) */}
        {isBestMatch && (
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-yellow-50 text-yellow-700 border border-yellow-200 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
            <Star size={10} fill="currentColor" /> Подходит больше всего
          </div>
        )}

        {/* Visualizer Container - scalable */}
        <div className="w-full h-full flex items-center justify-center transform group-hover:scale-105 transition-transform duration-500">
          <PlanVisualizer 
            shape={layout.shape} 
            entry={layout.entry} 
            storage={layout.storage} 
            area={layout.area} // Pass area here for grid/dims
            width={layout.width}
            depth={layout.depth}
            showFootprints={false}
          />
        </div>
        
        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <button 
            // onClick bubbling is handled by parent, but keeping it ensures semantic correctness if focused via keyboard
            onClick={(e) => {
              e.stopPropagation();
              onSelect && onSelect();
            }}
            className="btn-ios-style rounded-full px-5 py-2.5 text-sm font-medium flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
          >
            Подробнее <MoveRight size={14} />
          </button>
        </div>
      </div>

      {/* Info Footer */}
      <div className="px-6 py-5 bg-zinc-50/50 flex flex-col gap-5 flex-grow">
        
        {/* Main Stat: Area + Code */}
        <div className="flex justify-between items-end">
           <div className="text-3xl font-bold tracking-tight text-zinc-900 leading-none">
             {layout.area} <span className="text-sm text-zinc-500 font-medium ml-0.5">м²</span>
           </div>
           {/* Naming Code: Justified Right, Muted, 16px (text-base) */}
           <div className="text-base font-medium text-zinc-400 select-all">
             {namingCode}
           </div>
        </div>

        {/* Specs */}
        <div className="mt-auto flex flex-col gap-2">
          {/* Entry */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
               {/* Unified Color: Emerald-500 (#22c55e) */}
               <div className="w-3 h-3 rounded-full bg-[#22c55e] flex-shrink-0 shadow-sm border border-[#15803d]/20"></div>
               <span className="text-sm text-zinc-500 font-medium">Вход</span>
            </div>
            <span className="font-medium text-zinc-900 text-sm">
              {translateEntry(layout.entry)}
            </span>
          </div>

          {/* Storage */}
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2.5">
               {/* Unified Color: Orange-500 (#f97316) */}
               <div className="w-3 h-3 rounded-full bg-[#f97316] flex-shrink-0 shadow-sm border border-[#c2410c]/20"></div>
               <span className="text-sm text-zinc-500 font-medium">Склад</span>
            </div>
            <span className="font-medium text-zinc-900 text-sm max-w-[140px] truncate text-right" title={translateStorage(layout.storage)}>
              {translateStorage(layout.storage)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutCard;