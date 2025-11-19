
import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Trophy, Hash, History, LayoutGrid, Eye, X, Star } from 'lucide-react';
import { PatternKey, WinPattern } from '../types.ts';
import { WIN_PATTERNS } from '../utils/helpers.ts';

interface Props {
  drawnBalls: number[];
  onDrawBall: () => void;
  onReset: () => void;
  historyLog: string[];
  hasParticipants: boolean;
  currentPattern: PatternKey;
  onPatternChange: (pattern: PatternKey) => void;
}

const getBingoLetter = (num: number): string => {
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  if (num >= 61 && num <= 75) return 'O';
  return '';
};

const GamePanel: React.FC<Props> = ({ 
  drawnBalls, 
  onDrawBall, 
  onReset, 
  historyLog, 
  hasParticipants,
  currentPattern,
  onPatternChange
}) => {
  const [currentBall, setCurrentBall] = useState<number | string>('—');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPatternPreview, setShowPatternPreview] = useState(false);
  const lastBall = drawnBalls[drawnBalls.length - 1];
  
  // Ref para evitar que el modal se abra en la carga inicial
  const isFirstRender = useRef(true);

  // Efecto para actualizar la bola actual
  useEffect(() => {
    if (lastBall) {
      setCurrentBall(lastBall);
    } else {
      setCurrentBall('—');
    }
  }, [lastBall]);

  // Efecto para abrir el modal automáticamente al cambiar de patrón
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setShowPatternPreview(true);
  }, [currentPattern]);

  const handleDraw = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Simple animation effect
    let duration = 1000;
    let intervalTime = 50;
    let elapsed = 0;

    const interval = setInterval(() => {
      const random = Math.floor(Math.random() * 75) + 1;
      setCurrentBall(random);
      elapsed += intervalTime;

      if (elapsed >= duration) {
        clearInterval(interval);
        setIsAnimating(false);
        onDrawBall();
      }
    }, intervalTime);
  };

  const isDrawDisabled = isAnimating || drawnBalls.length >= 75 || !hasParticipants;

  // Configuración de las filas del tablero
  const boardRows = [
    { letter: 'B', min: 1, max: 15, color: 'text-cyan-400' },
    { letter: 'I', min: 16, max: 30, color: 'text-red-400' },
    { letter: 'N', min: 31, max: 45, color: 'text-white' },
    { letter: 'G', min: 46, max: 60, color: 'text-green-400' },
    { letter: 'O', min: 61, max: 75, color: 'text-amber-400' },
  ];

  return (
    <div className="flex flex-col h-full gap-6 relative">
      
      {/* Modal de Previsualización del Patrón */}
      {showPatternPreview && (
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-xs p-5 relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowPatternPreview(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <LayoutGrid className="text-cyan-500" size={20} />
              Patrón: {WIN_PATTERNS[currentPattern].label}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Las casillas resaltadas son necesarias para ganar.</p>

            {/* Mini Grid 5x5 with BINGO Header */}
            <div className="w-full bg-slate-950 rounded-lg p-3 border border-slate-800">
               {/* BINGO Letters Header */}
               <div className="grid grid-cols-5 gap-2 mb-2">
                  {['B', 'I', 'N', 'G', 'O'].map(letter => (
                    <div key={letter} className="text-center font-black text-slate-500 text-lg select-none">
                      {letter}
                    </div>
                  ))}
               </div>

               {/* Cells Grid */}
               <div className="grid grid-cols-5 gap-2 aspect-square">
                 {Array.from({ length: 25 }).map((_, index) => {
                    const isActive = WIN_PATTERNS[currentPattern].indices.includes(index);
                    const isCenter = index === 12;
                    
                    return (
                      <div 
                        key={index}
                        className={`
                          rounded flex items-center justify-center transition-all duration-300 border
                          ${isCenter 
                            ? 'bg-amber-900/40 border-amber-500/50 text-amber-500' 
                            : isActive 
                              ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                              : 'bg-slate-900 border-slate-800 opacity-40'
                          }
                        `}
                      >
                        {isCenter ? <Star size={16} fill="currentColor" /> : (isActive && <div className="w-2 h-2 rounded-full bg-white/80" />)}
                      </div>
                    );
                 })}
               </div>
            </div>
            
            <div className="mt-4 text-center">
              <button 
                 onClick={() => setShowPatternPreview(false)}
                 className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pattern Selector & Big Ball Display */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex-shrink-0">
        
        {/* Pattern Selection Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <div>
             <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
              <Trophy className="text-amber-500" size={24} />
              Sorteo
            </h2>
             <div className="text-xs text-slate-500">Progreso: <span className="text-slate-300 font-mono">{drawnBalls.length} / 75</span></div>
          </div>
          
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
              <LayoutGrid size={12} /> Forma de Ganar
            </label>
            <div className="flex items-center gap-2">
              <select 
                value={currentPattern}
                onChange={(e) => onPatternChange(e.target.value as PatternKey)}
                title={drawnBalls.length > 0 ? "Cambiar patrón (requiere confirmación)" : "Selecciona la forma ganadora"}
                className={`
                  bg-slate-950 border border-slate-700 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5
                  hover:border-cyan-500/50 cursor-pointer
                `}
              >
                {Object.values(WIN_PATTERNS).map((pattern: WinPattern) => (
                  <option key={pattern.key} value={pattern.key}>
                    {pattern.label}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => setShowPatternPreview(true)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-lg transition-colors"
                title="Ver forma de ganada"
              >
                <Eye size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Display: Letter Left, Ball Right */}
        <div className="flex items-center justify-center py-6 relative">
          
          <div className="relative">
            {/* Letra de Bingo (Izquierda) - Absolute relative to Ball */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 pr-3 sm:pr-5 flex justify-end min-w-[60px]">
              {typeof currentBall === 'number' && (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                   <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 whitespace-nowrap">Columna</span>
                   <span className={`text-7xl sm:text-8xl font-black leading-none ${isAnimating ? 'text-slate-600' : 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]'}`}>
                     {getBingoLetter(currentBall)}
                   </span>
                </div>
              )}
            </div>

            {/* La Bolilla (Centro) */}
            <div 
              className={`
                w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.6)] border-[6px] border-slate-800 relative overflow-hidden flex-shrink-0 z-10
                ${isAnimating 
                  ? 'bg-slate-900' 
                  : 'bg-gradient-to-br from-amber-400 via-orange-500 to-orange-700 shadow-orange-900/30'
                }
                transition-all duration-200
              `}
            >
              {/* Efectos de brillo para dar volumen (Glossy) */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-[45%] bg-gradient-to-b from-white/30 to-transparent rounded-full pointer-events-none blur-[1px]" />
              
              {typeof currentBall === 'number' ? (
                <div className="relative z-10">
                   <span className={`text-7xl sm:text-9xl font-black tracking-tighter leading-none select-none flex items-center justify-center h-full pb-4 ${isAnimating ? 'text-slate-700' : 'text-white drop-shadow-md'}`}>
                      {currentBall}
                   </span>
                </div>
              ) : (
                 <span className="text-6xl sm:text-8xl font-black select-none text-slate-700 opacity-30">{currentBall}</span>
              )}
            </div>
          </div>
          
          {/* Pattern Mini Preview */}
          <div className="absolute bottom-0 right-0 sm:right-4 text-[10px] text-slate-500 font-mono bg-slate-950/80 px-3 py-1.5 rounded-full border border-slate-800 flex items-center gap-1 shadow-lg z-20">
            <LayoutGrid size={10} /> {WIN_PATTERNS[currentPattern].label}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={handleDraw}
            disabled={isDrawDisabled}
            title={!hasParticipants ? "Registra participantes para comenzar" : ""}
            className={`
              col-span-2 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg shadow-lg transition-all
              ${isDrawDisabled
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-900/30 active:scale-95'
              }
            `}
          >
            <Play fill="currentColor" size={20} />
            {isAnimating ? 'Girando...' : 'SACAR BOLILLA'}
          </button>
          
          <button
            onClick={onReset}
            className="col-span-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 py-2 rounded transition-colors flex items-center justify-center gap-1"
          >
            <RotateCcw size={12} /> Resetear Sorteo
          </button>
        </div>
      </div>

      {/* Recent Balls & History Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        
        {/* Board of drawn numbers (Control Board) */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm flex flex-col h-fit lg:col-span-2 overflow-hidden">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2 flex-shrink-0">
            <Hash size={16} /> Tablero de control
          </h3>
          
          <div className="flex flex-col gap-3 overflow-x-auto custom-scrollbar py-2">
            {boardRows.map((row) => (
              <div key={row.letter} className="flex items-center gap-3 flex-shrink-0 justify-center">
                {/* Letra Vertical */}
                <div className={`w-10 aspect-square flex items-center justify-center text-2xl font-black ${row.color} bg-slate-950/50 rounded border border-slate-800`}>
                  {row.letter}
                </div>
                
                {/* Números de la fila */}
                <div className="flex-1 flex gap-1 justify-center">
                  {Array.from({ length: 15 }, (_, i) => row.min + i).map(num => {
                    const isDrawn = drawnBalls.includes(num);
                    const isLast = lastBall === num;
                    
                    return (
                      <div 
                        key={num}
                        className={`
                          flex-1 aspect-square min-w-[24px] rounded-md flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-500 border
                          ${isLast
                            ? 'bg-amber-500 text-slate-900 border-amber-300 scale-110 shadow-[0_0_15px_rgba(245,158,11,0.5)] z-10'
                            : isDrawn 
                              ? 'bg-gradient-to-b from-slate-700 to-slate-800 text-white border-slate-500 shadow-inner'
                              : 'bg-transparent text-slate-700 border-slate-800/50'
                          }
                        `}
                      >
                        {num}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Text Log */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm flex flex-col h-80 lg:h-[32rem] xl:h-full overflow-hidden">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2 flex-shrink-0">
            <History size={16} /> Historial
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar min-h-0">
            {historyLog.slice().reverse().map((log, i) => (
              <div key={i} className="text-xs text-slate-400 border-b border-slate-800/50 pb-1.5">
                {log}
              </div>
            ))}
            {historyLog.length === 0 && (
              <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm italic">
                Sin eventos
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePanel;
