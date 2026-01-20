import React, { useCallback, useEffect, useState, useRef } from 'react';

interface DualRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  minGap?: number;
  className?: string;
}

const DualRangeSlider: React.FC<DualRangeSliderProps> = ({ 
  min, 
  max, 
  value, 
  onChange, 
  minGap = 0,
  className = '' 
}) => {
  const [minVal, setMinVal] = useState(value[0]);
  const [maxVal, setMaxVal] = useState(value[1]);
  const minValRef = useRef(value[0]);
  const maxValRef = useRef(value[1]);
  const range = useRef<HTMLDivElement>(null);

  // Convert to percentage
  const getPercent = useCallback(
    (value: number) => Math.round(((value - min) / (max - min)) * 100),
    [min, max]
  );

  // Sync internal state if external props change
  useEffect(() => {
    setMinVal(value[0]);
    setMaxVal(value[1]);
    minValRef.current = value[0];
    maxValRef.current = value[1];
  }, [value]);

  // Update range bar width/position
  useEffect(() => {
    if (range.current) {
      const minPercent = getPercent(minVal);
      const maxPercent = getPercent(maxVal);
      
      range.current.style.left = `${minPercent}%`;
      range.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [minVal, maxVal, getPercent]);

  return (
    <div className={`relative w-full flex items-center justify-center h-6 select-none ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        value={minVal}
        onChange={(event) => {
          const rawValue = Number(event.target.value);
          // Clamp to maxVal - minGap
          const value = Math.min(rawValue, maxVal - minGap);
          setMinVal(value);
          minValRef.current = value;
          onChange([value, maxVal]);
        }}
        className="thumb thumb--left absolute w-full h-5 top-1/2 left-0 -translate-y-1/2 z-[3] cursor-pointer m-0 p-0 appearance-none"
        style={{ zIndex: minVal > max - 10 ? 5 : 3 }}
      />
      
      <input
        type="range"
        min={min}
        max={max}
        value={maxVal}
        onChange={(event) => {
          const rawValue = Number(event.target.value);
          // Clamp to minVal + minGap
          const value = Math.max(rawValue, minVal + minGap);
          setMaxVal(value);
          maxValRef.current = value;
          onChange([minVal, value]);
        }}
        className="thumb thumb--right absolute w-full h-5 top-1/2 left-0 -translate-y-1/2 z-[4] cursor-pointer m-0 p-0 appearance-none"
      />

      {/* Visual Track */}
      <div className="relative w-full h-1.5 bg-zinc-100 rounded-full z-[1]">
        <div
          ref={range}
          className="absolute h-full bg-zinc-900 rounded-full"
        ></div>
      </div>

      <style>{`
        /* Reset Input Defaults */
        input[type=range] {
          -webkit-appearance: none; 
          background: transparent;
          pointer-events: none;
        }
        
        input[type=range]::-webkit-slider-runnable-track {
           height: 100%;
           background: transparent;
           border: none;
        }
        
        input[type=range]::-moz-range-track {
           height: 100%;
           background: transparent;
           border: none;
        }

        /* Webkit Thumb */
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          pointer-events: auto;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background-color: #ffffff;
          border: 2px solid #18181b; /* zinc-900 */
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          cursor: pointer;
          margin-top: 0; 
        }

        /* Firefox Thumb */
        input[type=range]::-moz-range-thumb {
          pointer-events: auto;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background-color: #ffffff;
          border: 2px solid #18181b;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          cursor: pointer;
        }
        
        /* Focus states */
        input[type=range]:focus::-webkit-slider-thumb {
           box-shadow: 0 0 0 4px rgba(24, 24, 27, 0.1);
        }
        input[type=range]:focus::-moz-range-thumb {
           box-shadow: 0 0 0 4px rgba(24, 24, 27, 0.1);
        }
      `}</style>
    </div>
  );
};

export default DualRangeSlider;