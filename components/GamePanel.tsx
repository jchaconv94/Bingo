

import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Trophy, Hash, History, LayoutGrid, Eye, X, Star, Gift, CheckCircle, Circle } from 'lucide-react';
import { PatternKey, WinPattern, Prize } from '../types.ts';
import { WIN_PATTERNS } from '../utils/helpers.ts';

interface Props {
  drawnBalls: number[];
  onDrawBall: () => void;
  onReset: () => void;
  historyLog: string[];
  hasParticipants: boolean;
  currentPattern: PatternKey;
  onPatternChange: (pattern: PatternKey) => void;
  prizes?: Prize[];
  onTogglePrize?: (id: string) => void;
  roundLocked: boolean;
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
  onPatternChange,
  prizes = [],
  onTogglePrize,
  roundLocked
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

  // Efecto para abrir el modal automáticamente al cambiar de patrón (excepto en NONE o inicial)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (currentPattern !== 'NONE') {
      setShowPatternPreview(true);
    }
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

  // --- Validations for button disable ---
  const allPrizesAwarded = prizes.length > 0 && prizes.every(p => p.isAwarded);
  const noPrizes = prizes.length === 0;
  
  // ESTADO CRITICO: Premio entregado (roundLocked = true).
  // El patrón sigue visible, pero el juego está bloqueado hasta resetear.
  const roundFinishedNeedsReset = roundLocked;
  
  const noPattern = currentPattern === 'NONE';
  
  const isDrawDisabled = isAnimating || drawnBalls.length >= 75 || !hasParticipants || noPrizes || noPattern || allPrizesAwarded || roundLocked;

  let buttonTooltip = "";
  let buttonLabel = "SACAR BOLILLA";

  // Orden de prioridad de mensajes
  if (noPrizes) {
    buttonTooltip = "Registra al menos un premio para comenzar.";
  } else if (allPrizesAwarded) {
    buttonTooltip = "¡Juego Terminado! Todos los premios entregados.";
    buttonLabel = "EVENTO FINALIZADO";
  } else if (roundFinishedNeedsReset) {
    // MENSAJE ESPECÍFICO SOLICITADO
    buttonTooltip = "Resetea las bolillas para jugar el siguiente premio.";
    buttonLabel = "RONDA FINALIZADA";
  } else if (noPattern) {
    buttonTooltip = "Selecciona una forma de ganar (patrón) para continuar.";
    buttonLabel = "SELECCIONA PATRÓN";
  } else if (!hasParticipants) {
    buttonTooltip = "Registra participantes para comenzar.";
  }

  // Configuración de las filas del tablero
  const boardRows = [
    { letter: 'B', min: 1, max: 15, color: 'text-cyan-400' },
    { letter: 'I', min: 16, max: 30, color: 'text-red-400' },
    { letter: 'N', min: 31, max: 45, color: 'text-white' },
    { letter: 'G', min: 46, max: 60, color: 'text-green-400' },
    { letter: 'O', min: 61, max: 75, color: 'text-amber-400' },
  ];

  return (
    <div className="flex flex-col w-full gap-4 relative h-full">
      
      {/* Modal de Previsualización del Patrón */}
      {showPatternPreview && currentPattern !== 'NONE' && (
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
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm flex-shrink-0 relative overflow-hidden">
        
        {/* Background Pattern Decoration */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Pattern Selection Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-4 relative z-10">
          <div>
             <h2 className="text-lg 2xl:text-3xl font-bold text-white flex items-center gap-2 mb-0.5">
              <Trophy className="text-amber-500 w-5 h-5 2xl:w-8 2xl:h-8" />
              Sorteo
            </h2>
             <div className="text-[12px] text-slate-500">Progreso: <span className="text-slate-300 font-mono">{drawnBalls.length} / 75</span></div>
          </div>
          
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <label className="text-[10px] sm:text-xs uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
              <LayoutGrid size={12} /> Forma de Ganar
            </label>
            <div className="flex items-center gap-2">
              <select 
                value={currentPattern}
                onChange={(e) => onPatternChange(e.target.value as PatternKey)}
                disabled={roundLocked} // Bloquear si el premio ya fue entregado para forzar reset
                title={roundLocked ? "Resetea las bolillas para cambiar el patrón" : "Selecciona la forma ganadora"}
                className={`
                  bg-slate-950 border text-white text-xs sm:text-sm rounded-lg block w-full px-2.5 py-1.5 cursor-pointer transition-all
                  ${currentPattern === 'NONE' ? 'border-amber-500 ring-1 ring-amber-500/50 text-amber-300 animate-pulse' : 'border-slate-700 focus:ring-cyan-500 focus:border-cyan-500 hover:border-cyan-500/50'}
                `}
              >
                {Object.values(WIN_PATTERNS).map((pattern: WinPattern) => (
                  <option key={pattern.key} value={pattern.key} disabled={pattern.key === 'NONE'}>
                    {pattern.label}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => setShowPatternPreview(true)}
                disabled={currentPattern === 'NONE'}
                className={`p-2 border rounded-lg transition-colors ${currentPattern === 'NONE' ? 'bg-slate-900 border-slate-800 text-slate-600' : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-slate-700'}`}
                title="Ver forma de ganar"
              >
                <Eye size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Display Area */}
        <div className="relative min-h-[220px] flex items-center justify-center py-2">
          
          {/* Left Column: Prizes List (Visual Integration) - REDUCED WIDTH */}
          {prizes.length > 0 && (
             <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-48 hidden lg:flex flex-col gap-2 max-h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-2 py-1">
                {prizes.map((prize, idx) => {
                  // Logic to highlight the NEXT prize to be won
                  const previousWon = idx === 0 || prizes[idx - 1].isAwarded;
                  const isNext = !prize.isAwarded && previousWon;
                  
                  return (
                    <div 
                      key={prize.id}
                      onClick={() => onTogglePrize && onTogglePrize(prize.id)}
                      className={`
                        relative p-2 rounded-lg border backdrop-blur-md cursor-pointer transition-all duration-300
                        ${prize.isAwarded 
                          ? 'bg-slate-900/40 border-slate-800 text-slate-500 grayscale opacity-70' 
                          : isNext 
                             ? 'bg-amber-950/80 border-amber-400 border shadow-[0_0_15px_rgba(245,158,11,0.25)] scale-105 z-10' 
                             : 'bg-slate-900/60 border-slate-700 text-slate-300 opacity-80'
                        }
                      `}
                    >
                      {isNext && (
                        <div className="absolute -top-2 -right-1 bg-amber-500 text-amber-950 text-[8px] font-black px-1 py-0.5 rounded shadow-sm animate-pulse">
                           JUGANDO
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                         <div className={`mt-0.5 ${prize.isAwarded ? 'text-emerald-500' : isNext ? 'text-amber-400' : 'text-slate-500'}`}>
                           {prize.isAwarded ? <CheckCircle size={14} /> : <Gift size={14} />}
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="text-[9px] uppercase font-bold tracking-wider opacity-70 mb-0 leading-none">{prize.name}</div>
                            <div className={`text-xs font-bold truncate leading-tight mt-0.5 ${prize.isAwarded ? 'line-through decoration-slate-600' : isNext ? 'text-amber-200 text-sm' : 'text-white'}`}>
                              {prize.description}
                            </div>
                         </div>
                      </div>
                    </div>
                  );
                })}
             </div>
          )}

          {/* Center: The Ball & Letter */}
          <div className="relative flex items-center justify-center lg:ml-10">
            {/* Letra de Bingo (Izquierda) - Absolute relative to Ball */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 pr-3 flex justify-end min-w-[50px]">
              {typeof currentBall === 'number' && (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                   <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-0 whitespace-nowrap">Columna</span>
                   <span className={`text-4xl sm:text-5xl font-black leading-none ${isAnimating ? 'text-slate-600' : 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]'}`}>
                     {getBingoLetter(currentBall)}
                   </span>
                </div>
              )}
            </div>

            {/* La Bolilla (Centro) - REDUCED SIZE */}
            <div 
              className={`
                w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.6)] border-[6px] border-slate-800 relative overflow-hidden flex-shrink-0 z-10
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
                <div className="relative z-10 flex items-center justify-center w-full h-full">
                   {/* REMOVED BOTTOM PADDING FOR CENTERING */}
                   <span className={`text-5xl sm:text-7xl font-black tracking-tighter leading-none select-none ${isAnimating ? 'text-slate-700' : 'text-white drop-shadow-md'}`}>
                      {currentBall}
                   </span>
                </div>
              ) : (
                 <span className="text-5xl sm:text-7xl font-black select-none text-slate-700 opacity-30">{currentBall}</span>
              )}
            </div>
          </div>
          
          {/* Pattern Mini Preview (Bottom Right Floating) */}
          <div className="absolute bottom-0 right-0 sm:right-4 text-xs sm:text-sm text-slate-400 font-bold bg-slate-950/90 px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-2 shadow-lg z-20">
            <LayoutGrid size={14} /> {WIN_PATTERNS[currentPattern].label}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 relative z-10">
          <button
            onClick={handleDraw}
            disabled={isDrawDisabled}
            title={buttonTooltip}
            className={`
              col-span-2 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-xl sm:text-2xl shadow-lg transition-all relative overflow-hidden
              ${isDrawDisabled
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-900/30 active:scale-95'
              }
            `}
          >
            {isDrawDisabled && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px] z-20">
                 <span className="text-sm font-bold text-amber-400 px-4 py-2 text-center animate-pulse">{buttonTooltip}</span>
              </div>
            )}
            <Play fill="currentColor" size={26} />
            {isAnimating ? 'Girando...' : buttonLabel}
          </button>
          
          <button
            onClick={onReset}
            className={`col-span-2 text-xs sm:text-sm py-2 rounded transition-colors flex items-center justify-center gap-2 ${roundFinishedNeedsReset ? 'bg-amber-900/30 text-amber-400 border border-amber-500/30 animate-pulse hover:bg-amber-900/50' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
          >
            <RotateCcw size={16} /> 
            {roundFinishedNeedsReset ? 'Resetear bolillas' : 'Resetear Sorteo'}
          </button>
        </div>
      </div>

      {/* Recent Balls & History Split - FIXED HEIGHT REMOVED, COMPACT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        
        {/* Board of drawn numbers (Control Board) */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-sm flex flex-col h-full lg:col-span-2 overflow-hidden">
          <h3 className="text-sm 2xl:text-[20px] font-semibold text-slate-300 mb-3 flex items-center gap-2 flex-shrink-0">
            <Hash className="w-3.5 h-3.5 2xl:w-6 2xl:h-6" /> Tablero de control
          </h3>
          
          {/* CONTROL BOARD CONTAINER: fluid, takes all available space */}
          <div className="flex flex-col gap-1 py-1 flex-1 min-h-0 justify-between">
            {boardRows.map((row) => (
              <div key={row.letter} className="flex items-stretch justify-start gap-1 flex-1 min-h-0 w-full">
                
                {/* Letra Vertical - Fluid sizing (flex-1, h-full, removed fixed pixels) */}
                <div className={`
                   flex-1 h-full
                   flex items-center justify-center 
                   text-sm sm:text-xl font-black 
                   ${row.color} bg-slate-950/80 rounded border border-slate-700
                `}>
                  {row.letter}
                </div>
                
                {/* Números de la fila - Fluid sizing */}
                {Array.from({ length: 15 }, (_, i) => row.min + i).map(num => {
                    const isDrawn = drawnBalls.includes(num);
                    const isLast = lastBall === num;
                    
                    return (
                      <div 
                        key={num}
                        className={`
                          flex-1 h-full rounded flex items-center justify-center text-xs sm:text-base font-bold transition-all duration-500 border
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
            ))}
          </div>
        </div>

        {/* Text Log - Wrapper Relative + Absolute Inner for Correct Scroll Behavior */}
        <div className="relative h-48 lg:h-auto w-full">
          <div className="absolute inset-0 bg-slate-900/50 border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-sm flex flex-col overflow-hidden">
            <h3 className="text-sm 2xl:text-[20px] font-semibold text-slate-300 mb-2 flex items-center gap-2 flex-shrink-0">
              <History className="w-3.5 h-3.5 2xl:w-5 2xl:h-5" /> Historial
            </h3>
            <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar min-h-0">
              {historyLog.slice().reverse().map((log, i) => (
                <div key={i} className="text-[10px] text-slate-400 border-b border-slate-800/50 pb-1">
                  {log}
                </div>
              ))}
              {historyLog.length === 0 && (
                <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs italic">
                  Sin eventos
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePanel;