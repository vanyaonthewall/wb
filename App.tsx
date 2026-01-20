import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  LayoutGrid, 
  RefreshCcw, 
  Box, 
  ChevronDown, 
  ArrowUp, 
  ArrowDown, 
  Info, 
  AlertCircle, 
  ChevronLeft, 
  Loader2, 
  SlidersHorizontal, 
  X
} from 'lucide-react';
import { 
  FilterState, 
  SHAPES, 
  Layout
} from './types';
import { getLayouts } from './data';
import PlanVisualizer from './components/PlanVisualizer';
import LayoutCard, { generateLayoutCode } from './components/ui/LayoutCard';
import NumberInput from './components/ui/NumberInput';
import DualRangeSlider from './components/ui/DualRangeSlider';

const ALL_LAYOUTS = getLayouts();
const MIN_AREA = 10; 
const MAX_AREA = 70; 
const MIN_AREA_GAP = 5;

type SortOption = 'relevance' | 'area-asc' | 'area-desc';

// --- Helper Components defined OUTSIDE App to prevent re-mounting/re-animating on state changes ---

const AnimatedIconWrapper = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
  <motion.div
    initial={{ scale: 0.5, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", stiffness: 400, damping: 12, mass: 0.8 }}
    className={`shrink-0 ${className}`}
  >
    {children}
  </motion.div>
);

const YellowTip = ({ text }: { text: React.ReactNode }) => (
  <div className="p-3 lg:p-4 bg-yellow-50/50 border border-yellow-200/60 rounded-lg text-[14px] text-yellow-900 mb-4 lg:mb-6 leading-relaxed flex gap-3 shadow-sm">
    <AnimatedIconWrapper className="mt-0.5">
       <Info size={16} className="text-yellow-600 lg:w-[18px] lg:h-[18px]" />
    </AnimatedIconWrapper>
    <span className="opacity-90">{text}</span>
  </div>
);

const ShapeIcon = ({ shape, active }: { shape: string, active: boolean }) => {
  // Icon color: Active = Black, Inactive = Zinc-400
  const color = active ? "#18181b" : "#a1a1aa"; 
  
  if (shape === 'Square') {
    return (
      <svg className="w-10 h-10 lg:w-16 lg:h-16" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="8" width="24" height="24" stroke={color} strokeWidth="2.5"/>
      </svg>
    );
  }
  if (shape === 'Horizontal') {
    return (
      <svg className="w-10 h-10 lg:w-16 lg:h-16" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="12" width="32" height="16" stroke={color} strokeWidth="2.5"/>
      </svg>
    );
  }
  if (shape === 'Vertical') {
    return (
      <svg className="w-10 h-10 lg:w-16 lg:h-16" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="4" width="16" height="32" stroke={color} strokeWidth="2.5"/>
      </svg>
    );
  }
  return null;
};

function App() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [showResults, setShowResults] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  const [selectedLayoutId, setSelectedLayoutId] = useState<number | null>(null);
  const [imageError, setImageError] = useState(false);
  
  // Mobile specific state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  
  // Immediate Filters (bound to UI inputs)
  const [filters, setFilters] = useState<FilterState>({
    areaRange: [MIN_AREA, MAX_AREA],
    shape: null, // Default: nothing selected
    entry: null,
    storage: null,
  });

  // Debounced Filters (used for calculations/results)
  const [debouncedFilters, setDebouncedFilters] = useState<FilterState>(filters);
  const [isFiltering, setIsFiltering] = useState(false);

  // Debounce Effect: Sync filters to debouncedFilters after a delay
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
      setIsFiltering(false);
    }, 600); // 600ms delay for visible loading spinner

    return () => clearTimeout(timer);
  }, [filters]);

  const getStorageWall = (pos: string | null) => pos ? pos.split(' ')[0] : null;

  // 1. Exact Matches Logic (Uses debouncedFilters)
  const exactLayouts = useMemo(() => {
    return ALL_LAYOUTS.filter(layout => {
      if (layout.area < debouncedFilters.areaRange[0] || layout.area > debouncedFilters.areaRange[1]) return false;
      if (debouncedFilters.shape && layout.shape !== debouncedFilters.shape) return false;
      if (currentStep === 3 || showResults) {
        if (debouncedFilters.entry && layout.entry !== debouncedFilters.entry) return false;
        if (debouncedFilters.storage && layout.storage !== debouncedFilters.storage) return false;
      }
      return true;
    });
  }, [debouncedFilters, currentStep, showResults]);

  // 2. Fallback / Similar Matches Logic (Uses debouncedFilters)
  const similarLayouts = useMemo(() => {
    if (exactLayouts.length > 0) return [];
    if (!showResults && currentStep < 3) return [];

    const userStorageWall = getStorageWall(debouncedFilters.storage);
    if (!userStorageWall) return [];

    const sameWallLayouts = ALL_LAYOUTS.filter(l => getStorageWall(l.storage) === userStorageWall);
    if (sameWallLayouts.length === 0) return [];

    const level1 = sameWallLayouts.filter(l => 
      l.shape === debouncedFilters.shape &&
      l.area >= debouncedFilters.areaRange[0] &&
      l.area <= debouncedFilters.areaRange[1]
    );
    if (level1.length > 0) return level1;

    const level2 = sameWallLayouts.filter(l => 
      l.area >= debouncedFilters.areaRange[0] &&
      l.area <= debouncedFilters.areaRange[1]
    );
    if (level2.length > 0) return level2;

    const expandedMin = Math.max(MIN_AREA, debouncedFilters.areaRange[0] - 10);
    const expandedMax = Math.min(MAX_AREA, debouncedFilters.areaRange[1] + 10);
    
    const level3 = sameWallLayouts.filter(l => 
      l.area >= expandedMin &&
      l.area <= expandedMax
    );

    return level3;

  }, [debouncedFilters, exactLayouts.length, showResults, currentStep]);

  const hasExactMatches = exactLayouts.length > 0;
  const activeLayouts = hasExactMatches ? exactLayouts : similarLayouts;

  const bestMatchId = useMemo(() => {
    if (activeLayouts.length === 0) return null;
    const median = (debouncedFilters.areaRange[0] + debouncedFilters.areaRange[1]) / 2;
    const best = activeLayouts.reduce((prev, curr) => {
      return (Math.abs(curr.area - median) < Math.abs(prev.area - median) ? curr : prev);
    });
    return best.id; 
  }, [activeLayouts, debouncedFilters.areaRange]);

  const displayedLayouts = useMemo(() => {
    const result = [...activeLayouts];
    if (showResults) {
      if (sortOption === 'area-asc') {
        result.sort((a, b) => a.area - b.area);
      } else if (sortOption === 'area-desc') {
        result.sort((a, b) => b.area - a.area);
      } else {
        const median = (debouncedFilters.areaRange[0] + debouncedFilters.areaRange[1]) / 2;
        result.sort((a, b) => Math.abs(a.area - median) - Math.abs(b.area - median));
      }
    }
    return result;
  }, [activeLayouts, showResults, sortOption, debouncedFilters.areaRange]);

  // Handlers
  const handleNextStep = () => {
    if (currentStep < 3) setCurrentStep(prev => (prev + 1) as 1|2|3);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => (prev - 1) as 1|2|3);
  };

  const handleShowResults = () => {
    setShowResults(true);
    setIsMobileFiltersOpen(false); // Close mobile filters if open
  };

  // Reset logic 1: Reset filters only (keep user in results view)
  const handleResetFilters = () => {
    setFilters({
      areaRange: [MIN_AREA, MAX_AREA],
      shape: null,
      entry: null,
      storage: null,
    });
    // Intentionally NOT changing showResults or currentStep here
  };

  // Reset logic 2: Reset everything (go back to start)
  const handleFullReset = () => {
    setFilters({
      areaRange: [MIN_AREA, MAX_AREA],
      shape: null,
      entry: null,
      storage: null,
    });
    setCurrentStep(1);
    setShowResults(false);
    setIsMobileFiltersOpen(false);
  };

  const handleLayoutSelect = (id: number) => {
    setSelectedLayoutId(id);
  };

  const handleBackFromDetail = () => {
    setSelectedLayoutId(null);
  };

  const handleSortChange = (option: SortOption) => {
    if (option === sortOption) return;
    setIsFiltering(true);
    setSortOption(option);
    setTimeout(() => {
      setIsFiltering(false);
    }, 600);
  };

  const translateStorage = (pos: string | null): string => {
    if (!pos) return 'Не выбрано';
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

  const translateEntry = (pos: string | null): string => {
    if (!pos) return 'Не выбрано';
    const map: Record<string, string> = {
      'Left': 'Слева',
      'Center': 'По центру',
      'Right': 'Справа'
    };
    return map[pos] || pos;
  };

  // --- RENDER CONTENT FUNCTIONS ---

  const renderStep1Content = () => (
    <>
      {!showResults && <YellowTip text="Задайте диапазон площади, в который входит ваша планировка. Не бойтесь ошибиться, значение можно будет изменить." />}
      <div className="flex gap-2 lg:gap-3 items-center mb-5 lg:mb-6">
        <div className="relative flex-1">
          <NumberInput 
            value={filters.areaRange[0]}
            onChange={(val) => setFilters(prev => ({ ...prev, areaRange: [val, prev.areaRange[1]] }))}
            min={MIN_AREA}
            max={filters.areaRange[1] - MIN_AREA_GAP} 
            className="w-full pl-3 pr-8 py-2 lg:py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 font-medium text-sm lg:text-base transition-shadow"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs lg:text-sm pointer-events-none">м²</span>
        </div>
        <span className="text-zinc-300">—</span>
        <div className="relative flex-1">
          <NumberInput 
            value={filters.areaRange[1]}
            onChange={(val) => setFilters(prev => ({ ...prev, areaRange: [prev.areaRange[0], val] }))}
            min={filters.areaRange[0] + MIN_AREA_GAP} 
            max={MAX_AREA}
            className="w-full pl-3 pr-8 py-2 lg:py-2.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 font-medium text-sm lg:text-base transition-shadow"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs lg:text-sm pointer-events-none">м²</span>
        </div>
      </div>
      <div className="px-1 mb-1 lg:mb-2">
        <DualRangeSlider 
          min={MIN_AREA} 
          max={MAX_AREA} 
          value={filters.areaRange} 
          onChange={(val) => setFilters(prev => ({ ...prev, areaRange: val }))}
          minGap={MIN_AREA_GAP}
        />
        <div className="flex justify-between mt-3 text-xs lg:text-sm text-muted-foreground font-medium">
          <span>{MIN_AREA} м²</span>
          <span>{MAX_AREA} м²</span>
        </div>
      </div>
    </>
  );

  const renderStep2Content = () => (
    <>
      {!showResults && <YellowTip text="Представьте, что вы стоите на входе. Выберите форму комнаты относительно входа: квадратную (равные стены), горизонтальную (расходится по сторонам) или вертикальную (уходит вглубь)." />}
      <div className="flex p-1 bg-zinc-100 rounded-lg gap-1">
        {SHAPES.map((shape) => {
          const isActive = filters.shape === shape.value;
          return (
            <button
              key={shape.value}
              onClick={() => {
                // Toggle logic: Only in results mode
                if (showResults && filters.shape === shape.value) {
                  setFilters(prev => ({...prev, shape: null}));
                } else {
                  setFilters(prev => ({...prev, shape: shape.value}));
                }
              }}
              className={`flex-1 py-3 lg:py-4 flex flex-col items-center justify-center gap-1.5 lg:gap-2 rounded-lg transition-all text-xs lg:text-sm font-medium ${
                isActive
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/50'
              }`}
            >
              <ShapeIcon shape={shape.value} active={isActive} />
              <span>{shape.label}</span>
            </button>
          )
        })}
      </div>
    </>
  );

  const renderStep3Content = (averageArea: number) => (
    <>
      {showResults ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
          <div className="text-xs lg:text-sm font-medium uppercase tracking-wide text-zinc-500 mb-2">Изменить расположение:</div>
          <div className="flex items-center justify-center">
                <PlanVisualizer 
                  shape={filters.shape || 'Square'} 
                  entry={filters.entry}
                  storage={filters.storage}
                  interactive={true}
                  area={averageArea}
                  onSelectEntry={(pos) => setFilters(prev => ({
                    ...prev, 
                    // Toggle logic: Only in results mode (checked via showResults in parent logic context, which is true here)
                    entry: prev.entry === pos ? null : pos
                  }))}
                  onSelectStorage={(pos) => setFilters(prev => ({
                    ...prev, 
                    storage: prev.storage === pos ? null : pos
                  }))}
                  showFootprints={false}
                  showDimensions={false} 
                  className="w-[280px] h-[280px] lg:w-[360px] lg:h-[360px]" 
                />
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-left-4">
          <YellowTip text="Укажите расположение дверей, кликая по точкам. Главный вход (зеленый) — всегда снизу, складской (оранжевый) — на любой другой стороне. Достаточно указать позиции примерно, чтобы мы подобрали для вас подходящие варианты в каталоге." />
        </div>
      )}

      {/* Legend */}
      <div className="space-y-1.5 pt-4 lg:pt-6 border-t border-zinc-100 mt-2">
          {/* Entry Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-[#22c55e] flex-shrink-0 shadow-sm border border-[#15803d]/20"></div>
              <span className="text-xs lg:text-sm text-zinc-500 font-medium">Вход</span>
            </div>
            <span className="text-xs lg:text-sm font-medium text-zinc-900">{translateEntry(filters.entry) || 'Не выбрано'}</span>
          </div>
          
          {/* Storage Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-[#f97316] flex-shrink-0 shadow-sm border border-[#c2410c]/20"></div>
              <span className="text-xs lg:text-sm text-zinc-500 font-medium">Склад</span>
            </div>
            <span className="text-xs lg:text-sm font-medium text-zinc-900">{translateStorage(filters.storage) || 'Не выбрано'}</span>
          </div>
      </div>
    </>
  );

  // --------------------------------------------------------------------------
  // Detail View Rendering
  // --------------------------------------------------------------------------
  if (selectedLayoutId) {
    const selectedLayout = ALL_LAYOUTS.find(l => l.id === selectedLayoutId);

    if (!selectedLayout) {
      setSelectedLayoutId(null);
      return null;
    }

    const namingCode = generateLayoutCode(selectedLayout);

    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
        {/* Detail Header */}
        <header className="shrink-0 bg-white border-b border-zinc-200 h-16 lg:h-20 flex items-center px-4 lg:px-10 z-30 sticky top-0 shadow-sm">
          <button 
            onClick={handleBackFromDetail}
            className="mr-4 lg:mr-6 flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors font-medium text-sm lg:text-base whitespace-nowrap"
          >
            <ChevronLeft size={20} />
            Назад
          </button>
          
          <div className="h-6 w-px bg-zinc-200 mr-4 lg:mr-6"></div>

          <h1 className="text-lg lg:text-2xl font-semibold tracking-tight text-zinc-900">
            {namingCode}
          </h1>
        </header>

        {/* Empty Detail Content */}
        <main className="flex-1 p-6 lg:p-10 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 mb-4">
                 <LayoutGrid className="text-zinc-300" size={32} />
              </div>
              <p className="text-zinc-400 font-medium">Детальная страница планировки</p>
            </div>
        </main>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Main App Rendering
  // --------------------------------------------------------------------------

  const renderSidebar = () => {
    const isStep1Open = showResults || currentStep === 1;
    const isStep2Open = showResults || currentStep === 2;
    const isStep3Open = showResults || currentStep === 3;

    // Helper for desktop coloring "Completed" steps
    const getDesktopStepColorClass = (isActive: boolean, isCompleted: boolean) => {
      // Apply .btn-ios-style for the active step
      if (isActive) return 'btn-ios-style lg:shadow-sm'; 
      if (isCompleted) return 'lg:bg-emerald-500 lg:text-white lg:shadow-sm'; 
      return 'lg:bg-zinc-100 lg:text-zinc-400 lg:border lg:border-transparent';
    };

    const isStep1Completed = currentStep > 1 || showResults;
    const isStep2Completed = currentStep > 2 || showResults;
    const totalCount = ALL_LAYOUTS.length;
    
    const foundText = exactLayouts.length === totalCount 
      ? `Все ${totalCount} вариантов` 
      : `Найдено ${exactLayouts.length} вариантов`;

    const averageArea = (filters.areaRange[0] + filters.areaRange[1]) / 2;

    let containerClasses = "";
    
    if (showResults) {
      if (isMobileFiltersOpen) {
        containerClasses = "fixed inset-0 z-50 bg-white flex flex-col lg:static lg:w-[440px] lg:flex-shrink-0 lg:border-r lg:border-zinc-200 lg:h-screen lg:shadow-xl lg:shadow-zinc-200/50";
      } else {
        containerClasses = "hidden lg:flex lg:w-[440px] lg:flex-shrink-0 lg:bg-white lg:border-r lg:border-zinc-200 lg:h-screen lg:flex-col lg:z-20 lg:shadow-xl lg:shadow-zinc-200/50";
      }
    } else {
      containerClasses = "w-full bg-white border-t border-zinc-200 flex flex-col order-2 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] lg:shadow-xl lg:shadow-zinc-200/50 lg:w-[440px] lg:flex-shrink-0 lg:border-t-0 lg:border-r lg:h-full lg:order-1 lg:static";
    }

    const renderMobileStepper = () => {
      if (showResults) return null;
      
      const steps = [
        { id: 1, label: 'Площадь' },
        { id: 2, label: 'Форма' },
        { id: 3, label: 'Двери' }
      ];

      return (
        <div className="flex w-full border-b border-zinc-100 lg:hidden">
           {steps.map((step) => {
             const isActive = currentStep === step.id;
             const isCompleted = currentStep > step.id;
             
             return (
               <button
                 key={step.id}
                 onClick={() => {
                   // Allow going back to previous steps, but only go forward if current step logic allows (simplified here)
                   if (step.id < currentStep) setCurrentStep(step.id as any);
                 }}
                 className={`flex-1 py-3 text-center text-sm font-medium relative transition-colors ${
                   isActive ? 'text-zinc-900' : (isCompleted ? 'text-zinc-500' : 'text-zinc-300')
                 }`}
               >
                 <span className="relative z-10 flex items-center justify-center gap-1.5 whitespace-nowrap">
                    {isCompleted && <Check size={14} strokeWidth={3} className="text-emerald-500" />}
                    {step.id}. {step.label}
                 </span>
                 {isActive && (
                   <motion.div 
                     layoutId="mobile-step-indicator"
                     className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-900" 
                   />
                 )}
               </button>
             )
           })}
        </div>
      );
    };

    return (
      <aside className={containerClasses}>
        
        {/* Header - Desktop Only */}
        <div className={`shrink-0 flex items-center justify-between px-6 border-b border-zinc-100 ${showResults && isMobileFiltersOpen ? 'h-16' : 'hidden lg:flex lg:h-20 lg:px-8'}`}>
          <span 
            onClick={handleFullReset} // CHANGED: Reset App completely
            className="font-semibold text-xl lg:text-2xl tracking-tight text-zinc-900 cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
          >
             {showResults && isMobileFiltersOpen ? 'Фильтры' : 'Типовой ПВЗ'}
          </span>
          {showResults && isMobileFiltersOpen && (
            <button onClick={() => setIsMobileFiltersOpen(false)} className="p-2 -mr-2 text-zinc-500 hover:text-zinc-900">
              <X size={24} />
            </button>
          )}
        </div>

        {/* MOBILE STEPPER (Horizontal) */}
        {!showResults && renderMobileStepper()}

        {/* 
            Content Area 
        */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 lg:space-y-4">
          
          {/* --- MOBILE CONTENT (Shows only active step) --- */}
          {/* Hide if in Results Mode (we want full list then) */}
          <div className={`lg:hidden ${showResults ? 'hidden' : 'block'}`}>
              {currentStep === 1 && renderStep1Content()}
              {currentStep === 2 && renderStep2Content()}
              {currentStep === 3 && renderStep3Content(averageArea)}
          </div>

          {/* --- DESKTOP CONTENT (Shows Vertical List) --- */}
          {/* In Results Mode on Mobile, we show this list to allow filtering by all params */}
          <div className={`${showResults ? 'block' : 'hidden lg:block'} space-y-4`}>
            {/* Step 1: Area */}
            <div className={`border rounded-xl transition-all duration-300 overflow-hidden ${isStep1Open ? 'bg-white border-zinc-200' : (isStep1Completed ? 'bg-emerald-50/50 border-emerald-200/50' : '')}`}>
              <div 
                onClick={() => !showResults && currentStep > 1 && setCurrentStep(1)}
                className={`flex items-center justify-between p-[18px] ${!showResults && currentStep > 1 ? 'cursor-pointer hover:bg-zinc-50/50' : 'cursor-default'}`}
              >
                <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${getDesktopStepColorClass(isStep1Open, isStep1Completed)}`}>
                      {(isStep1Completed && !isStep1Open) ? <Check size={14} strokeWidth={3} /> : '1'}
                    </div>
                    <div className="flex flex-col justify-center">
                      <h3 className={`text-lg font-semibold tracking-tight leading-none ${!showResults && currentStep > 1 ? 'text-muted-foreground' : 'text-zinc-900'}`}>Площадь</h3>
                       <div className="text-sm font-medium text-zinc-500 mt-1 whitespace-nowrap">
                          {(!showResults && currentStep > 1) ? `${filters.areaRange[0]} — ${filters.areaRange[1]} м²` : ''}
                       </div>
                    </div>
                </div>
                {!showResults && currentStep > 1 && <ChevronDown size={16} className="text-zinc-400" />}
              </div>

              {isStep1Open && (
                <div className="px-[18px] pb-6 pt-0">
                    {renderStep1Content()}
                </div>
              )}
            </div>

            {/* Step 2: Shape */}
            <div className={`border rounded-xl transition-all duration-300 overflow-hidden ${isStep2Open ? 'bg-white border-zinc-200' : (isStep2Completed ? 'bg-emerald-50/50 border-emerald-200/50' : '')}`}>
              <div 
                onClick={() => !showResults && currentStep > 2 && setCurrentStep(2)}
                className={`flex items-center justify-between p-[18px] ${!showResults && currentStep > 2 ? 'cursor-pointer hover:bg-zinc-50/50' : 'cursor-default'}`}
              >
                <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${getDesktopStepColorClass(isStep2Open, isStep2Completed)}`}>
                      {(isStep2Completed && !isStep2Open) ? <Check size={14} strokeWidth={3} /> : '2'}
                    </div>
                    <div className="flex flex-col justify-center">
                      <h3 className={`text-lg font-semibold tracking-tight leading-none ${!showResults && currentStep > 2 ? 'text-muted-foreground' : 'text-zinc-900'}`}>Форма</h3>
                      <div className="text-sm font-medium text-zinc-500 mt-1">
                         {(!showResults && currentStep > 2) ? (filters.shape ? SHAPES.find(s => s.value === filters.shape)?.label : 'Не выбрано') : ''}
                      </div>
                    </div>
                </div>
                {!showResults && currentStep > 2 && <ChevronDown size={16} className="text-zinc-400" />}
              </div>

              {isStep2Open && (
                <div className="px-[18px] pb-6 pt-0">
                    {renderStep2Content()}
                </div>
              )}
            </div>

            {/* Step 3: Doors */}
            <div className={`border rounded-xl transition-all duration-300 overflow-hidden ${isStep3Open ? 'bg-white border-zinc-200' : ''} ${showResults ? 'bg-white border-zinc-200' : ''}`}>
              <div className="flex items-center gap-4 p-[18px]">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${getDesktopStepColorClass(isStep3Open, false)}`}>
                    3
                  </div>
                  <h3 className={`text-lg font-semibold tracking-tight leading-none ${isStep3Open ? 'text-zinc-900' : 'text-muted-foreground'}`}>
                     Двери
                  </h3>
              </div>

              {isStep3Open && (
                <div className="px-[18px] pb-6 pt-0">
                  {renderStep3Content(averageArea)}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 lg:p-6 border-t border-zinc-200 bg-white shrink-0 flex flex-col gap-2 lg:gap-3">
          
          {/* Counter: Clickable on Step 1 & 2 */}
          {!showResults && currentStep < 3 && (
            <button 
              onClick={handleShowResults}
              className="flex justify-center -mt-2 mb-1 lg:mb-2 min-h-[20px] w-full group cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className="text-sm lg:text-base font-medium text-zinc-500 group-hover:text-zinc-800 transition-colors underline decoration-zinc-300 underline-offset-4 whitespace-nowrap">
                {foundText}
              </span>
            </button>
          )}

          {!showResults ? (
            <div className="flex gap-2 lg:gap-3 w-full">
               {/* Back Button */}
               {currentStep > 1 && (
                 <button 
                  onClick={handlePrevStep}
                  className="flex-1 py-3 lg:py-3.5 rounded-lg border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 transition-colors text-sm lg:text-base whitespace-nowrap"
                 >
                   Назад
                 </button>
               )}
               
               {/* Main Action Button */}
               <button 
                onClick={currentStep === 3 ? handleShowResults : handleNextStep}
                disabled={currentStep === 3 && (!filters.entry || !filters.storage)}
                className="flex-1 py-3 lg:py-3.5 btn-ios-style rounded-lg shadow hover:opacity-90 transition-all flex justify-center items-center gap-2 font-medium text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
               >
                 {currentStep === 3 ? (
                   <>
                    Показать варианты
                    {exactLayouts.length > 0 && (
                      <span className="flex items-center justify-center bg-white text-zinc-900 text-xs font-bold rounded-full h-5 px-2 ml-1">
                        {exactLayouts.length}
                      </span>
                    )}
                   </>
                 ) : (
                   <>
                    Далее
                   </>
                 )}
               </button>
            </div>
          ) : (
            // Results Mode Footer
            <button 
              onClick={handleResetFilters} // CHANGED: Call specific filter reset, stay in results
              className="w-full py-3 lg:py-3.5 border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2 font-medium text-sm lg:text-base whitespace-nowrap"
            >
              <RefreshCcw size={16} /> Сбросить фильтры
            </button>
          )}
        </div>
      </aside>
    );
  };

  const renderCanvas = () => {
    // Calculate average area for the main visualizer if specific not set
    const averageArea = (filters.areaRange[0] + filters.areaRange[1]) / 2;
    
    if (showResults) {
      // Sorting button styles
      const containerClass = "flex p-1 bg-zinc-100 rounded-lg gap-1";
      const itemBase = "px-2 lg:px-3 py-1.5 rounded-md text-xs lg:text-sm font-medium transition-all flex items-center justify-center gap-1.5 lg:gap-2 whitespace-nowrap";
      const itemActive = "bg-white text-zinc-900 shadow-sm";
      const itemInactive = "text-zinc-500 hover:text-zinc-900 hover:bg-white/50";

      const cardVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: (i: number) => ({
          opacity: 1,
          y: 0,
          transition: {
            delay: i * 0.03, 
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94] as const
          }
        }),
        exit: { opacity: 0, transition: { duration: 0.1, ease: "easeIn" as const } }
      };

      const loadingVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
      };

      return (
        <main className="flex-1 bg-zinc-50/50 h-screen flex flex-col overflow-hidden order-1 lg:order-2">
          {/* Sticky Header */}
          <header className="shrink-0 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-4 lg:px-10 h-16 lg:h-20 flex justify-between items-center z-30">
             <div>
                <h1 className="text-lg lg:text-2xl font-semibold tracking-tight text-zinc-900 leading-tight">Результаты</h1>
                <p className="text-xs lg:text-sm text-muted-foreground mt-0.5 lg:mt-1">Найдено {activeLayouts.length} вариантов</p>
             </div>

             <div className="flex items-center gap-2 lg:gap-3">
                {/* Mobile Filter Trigger */}
                <button 
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="lg:hidden p-2 rounded-md bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                >
                  <SlidersHorizontal size={20} />
                </button>

                {/* Sort - hidden on very small screens if needed, or compact */}
                <div className="hidden md:flex items-center gap-3">
                  <span className="text-sm text-muted-foreground font-medium mr-1 whitespace-nowrap">Сортировка:</span>
                  <div className={containerClass}>
                    <button 
                      onClick={() => handleSortChange('relevance')}
                      className={`${itemBase} ${sortOption === 'relevance' ? itemActive : itemInactive}`}
                    >
                      Релевантность
                    </button>
                    <button 
                      onClick={() => handleSortChange('area-asc')}
                      className={`${itemBase} ${sortOption === 'area-asc' ? itemActive : itemInactive}`}
                    >
                      Площадь <ArrowUp size={14} />
                    </button>
                    <button 
                      onClick={() => handleSortChange('area-desc')}
                      className={`${itemBase} ${sortOption === 'area-desc' ? itemActive : itemInactive}`}
                    >
                      Площадь <ArrowDown size={14} />
                    </button>
                  </div>
                </div>
             </div>
          </header>

           {/* Mobile Sort Bar (Separate row for mobile) */}
           <div className="md:hidden px-4 py-2 border-b border-zinc-100 bg-white/50 flex overflow-x-auto no-scrollbar">
                <div className={containerClass + " w-full"}>
                   <button 
                     onClick={() => handleSortChange('relevance')}
                     className={`${itemBase} flex-1 ${sortOption === 'relevance' ? itemActive : itemInactive}`}
                   >
                     Релевантность
                   </button>
                   <button 
                     onClick={() => handleSortChange('area-asc')}
                     className={`${itemBase} flex-1 ${sortOption === 'area-asc' ? itemActive : itemInactive}`}
                   >
                     Площадь <ArrowUp size={14} />
                   </button>
                   <button 
                     onClick={() => handleSortChange('area-desc')}
                     className={`${itemBase} flex-1 ${sortOption === 'area-desc' ? itemActive : itemInactive}`}
                   >
                     Площадь <ArrowDown size={14} />
                   </button>
                </div>
           </div>

          {/* Alert Banner */}
          {!hasExactMatches && activeLayouts.length > 0 && !isFiltering && (
             <div className="shrink-0 px-4 lg:px-10 pt-4 lg:pt-6 pb-2 bg-zinc-50/50 z-20">
                <div className="p-3 lg:p-4 bg-rose-50 border border-rose-200 rounded-lg flex gap-3 text-rose-900 animate-in fade-in slide-in-from-top-2">
                  <AnimatedIconWrapper className="mt-0.5">
                    <AlertCircle size={20} />
                  </AnimatedIconWrapper>
                  <div>
                    <h3 className="font-semibold mb-1 text-sm lg:text-base">Нет подходящих планировок</h3>
                    <p className="text-[14px] opacity-90 leading-relaxed">
                      Мы не нашли точного совпадения, но вот похожие варианты.
                    </p>
                  </div>
                </div>
             </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-10 lg:pt-6 relative">
            <AnimatePresence mode="wait">
              {isFiltering ? (
                 <motion.div 
                   key="loading"
                   variants={loadingVariants}
                   initial="hidden"
                   animate="visible"
                   exit="exit"
                   className="absolute inset-0 flex items-center justify-center pb-20 pointer-events-none"
                 >
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="animate-spin text-zinc-900" size={48} strokeWidth={1.5} />
                    </div>
                 </motion.div>
              ) : (
                 <motion.div 
                   key="grid"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   transition={{ duration: 0.2 }}
                   className="w-full h-full"
                 >
                   {displayedLayouts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[50vh] text-zinc-400">
                         <LayoutGrid size={64} className="mb-4 opacity-20" />
                         <h3 className="text-lg font-semibold text-zinc-900">Нет подходящих планировок</h3>
                         <p className="text-sm text-muted-foreground mt-2">Попробуйте изменить параметры</p>
                      </div>
                   ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-8 pb-20">
                       <AnimatePresence mode="popLayout">
                         {displayedLayouts.map((layout, index) => (
                           <motion.div
                             layout
                             key={`${layout.id}-${layout.isMirrored ? 'm' : 'o'}`}
                             custom={index}
                             variants={cardVariants}
                             initial="hidden"
                             animate="visible"
                             exit="exit"
                             transition={{ layout: { duration: 0.3, type: "tween", ease: "easeInOut" } }}
                             className="h-full"
                           >
                              <LayoutCard 
                                 layout={layout} 
                                 isBestMatch={hasExactMatches && layout.id === bestMatchId} 
                                 onSelect={() => handleLayoutSelect(layout.id)}
                              />
                           </motion.div>
                         ))}
                       </AnimatePresence>
                     </div>
                   )}
                 </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      );
    }

    // Default Canvas (Stepper Mode)
    return (
      <main className="flex-1 bg-zinc-50 relative flex flex-col h-full overflow-hidden order-1 lg:order-2">
        {/* 
           Main Canvas Container 
           Mobile: Aligns to Top/Center, visualizer smaller
           Desktop: Strictly Centered
        */}
        <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full p-4 lg:p-8">
          <div className="absolute inset-0 opacity-[0.03]" 
               style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          </div>

          {currentStep === 1 ? (
             <div className="flex flex-col items-center justify-center max-w-md text-center animate-in fade-in zoom-in duration-500 z-10 px-4">
                {!imageError ? (
                  <img 
                    src="intro.png" 
                    alt="Intro" 
                    onError={() => setImageError(true)}
                    className="w-full max-w-[420px] h-auto object-contain mb-6 lg:mb-8 drop-shadow-2xl rounded-2xl"
                  />
                ) : (
                  <div className="mb-6 lg:mb-8 flex items-center justify-center">
                     <LayoutGrid size={80} strokeWidth={1} className="text-zinc-300" />
                  </div>
                )}
                <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight text-zinc-900 mb-2 lg:mb-3">Начните с параметров</h2>
                <p className="text-sm lg:text-lg text-muted-foreground leading-relaxed">
                   Задайте параметры помещения клиентской зоны, и мы подберем для вас подходящие планировки.
                </p>
             </div>
          ) : (
             // Step 2 & 3: Visualizer
             <div className="z-10 flex flex-col items-center justify-center w-full h-full animate-in fade-in duration-500">
                 
                 <div className="text-center mb-4 lg:mb-8 mt-4 lg:mt-0">
                    <h2 className="text-xl lg:text-3xl font-semibold text-zinc-900 tracking-tight mb-2 lg:mb-3">
                      {currentStep === 2 ? "Геометрия" : "Расположение дверей"}
                    </h2>
                    <p className="text-xs lg:text-lg text-muted-foreground px-4">
                      {currentStep === 2 ? "Определите форму клиентской зоны" : "Кликните на стены, чтобы разместить вход и склад"}
                    </p>
                 </div>

                 {/* Responsive Container for Visualizer */}
                 <div className="w-full aspect-square max-w-[320px] lg:max-w-[600px] lg:h-[600px] flex items-center justify-center transition-all duration-300">
                    <div className="w-full h-full p-2 lg:p-4">
                        <PlanVisualizer 
                          shape={filters.shape || 'Square'} 
                          entry={filters.entry}
                          storage={filters.storage}
                          interactive={currentStep === 3}
                          area={averageArea}
                          onSelectEntry={(pos) => setFilters(prev => ({...prev, entry: pos}))}
                          onSelectStorage={(pos) => setFilters(prev => ({...prev, storage: pos}))}
                          showFootprints={true}
                          showZoneLabel={true} 
                          showDimensions={false} 
                        />
                    </div>
                 </div>
             </div>
          )}
        </div>
      </main>
    );
  };

  return (
    // Change: flex-col on mobile, flex-row on desktop. Fixed 100dvh height.
    <div className="flex flex-col lg:flex-row h-[100dvh] bg-zinc-50 text-zinc-900 font-sans overflow-hidden selection:bg-zinc-200">
      {renderSidebar()}
      {renderCanvas()}
    </div>
  );
}

export default App;