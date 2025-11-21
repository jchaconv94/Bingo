
import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Trophy, Hash, History, LayoutGrid, Eye, X, Star, Gift, CheckCircle, Circle, PauseCircle, PlayCircle, Lock } from 'lucide-react';
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
  isPaused?: boolean;
  onTogglePause?: () => void;
}

const getBingoLetter = (num: number): string => {
  if (num >= 1 && num <= 15) return 'B';
  if (num >= 16 && num <= 30) return 'I';
  if (num >= 31 && num <= 45) return 'N';
  if (num >= 46 && num <= 60) return 'G';
  if (num >= 61 && num <= 75) return 'O';
  return '';
};

const getBallStyles = (val: number | string) => {
  const defaultStyle = {
    background: 'radial-gradient(circle at 30% 30%, #334155 0%, #0f172a 100%)',
    color: 'text-slate-500',
    shadow: 'rgba(0,0,0,0.5)',
    border: 'border-slate-700',
    inkShadow: '0 1px 1px rgba(255,255,255,0.1)'
  };

  if (typeof val !== 'number') return defaultStyle;

  // Common ink shadow for white text: subtle dark drop to simulate paint thickness
  const whiteTextInk = '0px 2px 4px rgba(0,0,0,0.3)';
  // Ink for dark text (on white ball): subtle light drop
  const darkTextInk = '0px 1px 0px rgba(255,255,255,0.5)';

  // B (1-15): Blue / Cyan
  if (val >= 1 && val <= 15) {
    return {
      background: 'radial-gradient(circle at 35% 35%, #22d3ee 0%, #06b6d4 20%, #0891b2 50%, #155e75 85%, #0e7490 100%)',
      color: 'text-white/95', // Slightly transparent to blend with texture
      shadow: 'rgba(6, 182, 212, 0.5)',
      border: 'border-cyan-400/30',
      inkShadow: whiteTextInk
    };
  }
  // I (16-30): Red / Rose
  if (val >= 16 && val <= 30) {
    return {
      background: 'radial-gradient(circle at 35% 35%, #fb7185 0%, #f43f5e 20%, #e11d48 50%, #be123c 85%, #881337 100%)',
      color: 'text-white/95',
      shadow: 'rgba(225, 29, 72, 0.5)',
      border: 'border-rose-400/30',
      inkShadow: whiteTextInk
    };
  }
  // N (31-45): White / Silver (Bingo balls for N are usually white)
  if (val >= 31 && val <= 45) {
    return {
      background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #f8fafc 20%, #cbd5e1 50%, #64748b 85%, #334155 100%)',
      color: 'text-slate-900/90',
      shadow: 'rgba(148, 163, 184, 0.5)',
      border: 'border-white/30',
      inkShadow: darkTextInk
    };
  }
  // G (46-60): Green / Emerald
  if (val >= 46 && val <= 60) {
    return {
      background: 'radial-gradient(circle at 35% 35%, #34d399 0%, #10b981 20%, #059669 50%, #047857 85%, #064e3b 100%)',
      color: 'text-white/95',
      shadow: 'rgba(16, 185, 129, 0.5)',
      border: 'border-emerald-400/30',
      inkShadow: whiteTextInk
    };
  }
  // O (61-75): Yellow / Amber
  if (val >= 61 && val <= 75) {
    return {
      background: 'radial-gradient(circle at 35% 35%, #fcd34d 0%, #fbbf24 20%, #d97706 50%, #b45309 85%, #78350f 100%)',
      color: 'text-white/95',
      shadow: 'rgba(217, 119, 6, 0.5)',
      border: 'border-amber-400/30',
      inkShadow: whiteTextInk
    };
  }

  return defaultStyle;
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
  roundLocked,
  isPaused = false,
  onTogglePause
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
    if (currentPattern !== 'NONE') {
      setShowPatternPreview(true);
    }
  }, [currentPattern]);

  const handleDraw = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Animation config
    let duration = 3000;
    let intervalTime = 60;
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

  // --- Validations ---
  const allPrizesAwarded = prizes.length > 0 && prizes.every(p => p.isAwarded);
  const noPrizes = prizes.length === 0;
  const roundFinishedNeedsReset = roundLocked;
  const noPattern = currentPattern === 'NONE';
  const gameStarted = drawnBalls.length > 0;

  const isDrawDisabled = isAnimating || drawnBalls.length >= 75 || !hasParticipants || noPrizes || noPattern || allPrizesAwarded || roundLocked || isPaused;

  let buttonTooltip = "";
  let buttonLabel = "SACAR BOLILLA";

  if (isPaused) {
    buttonTooltip = "Juego Pausado. Reanuda para continuar.";
    buttonLabel = "PAUSADO";
  } else if (noPrizes) {
    buttonTooltip = "Registra al menos un premio para comenzar.";
  } else if (allPrizesAwarded) {
    buttonTooltip = "¡Juego Terminado! Todos los premios entregados.";
    buttonLabel = "EVENTO FINALIZADO";
  } else if (roundFinishedNeedsReset) {
    buttonTooltip = "Resetea las bolillas para jugar el siguiente premio.";
    buttonLabel = "RONDA FINALIZADA";
  } else if (noPattern) {
    buttonTooltip = "Selecciona una forma de ganar (patrón) para continuar.";
    buttonLabel = "SELECCIONA PATRÓN";
  } else if (!hasParticipants) {
    buttonTooltip = "Registra participantes para comenzar.";
  }

  const boardRows = [
    { letter: 'B', min: 1, max: 15, color: 'text-cyan-400' },
    { letter: 'I', min: 16, max: 30, color: 'text-rose-400' },
    { letter: 'N', min: 31, max: 45, color: 'text-white' },
    { letter: 'G', min: 46, max: 60, color: 'text-emerald-400' },
    { letter: 'O', min: 61, max: 75, color: 'text-amber-400' },
  ];

  // Obtener estilos dinámicos de la bola actual
  const ballStyle = getBallStyles(currentBall);

  return (
    <div className="flex flex-col w-full gap-4 relative h-full">

      {/* Modal de Previsualización del Patrón - MEJORADO */}
      {showPatternPreview && currentPattern !== 'NONE' && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setShowPatternPreview(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md relative animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header Gradient Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"></div>

            <div className="p-6">
              <button
                onClick={() => setShowPatternPreview(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
              >
                <X size={24} />
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-800 text-cyan-400 mb-3 border border-slate-700 shadow-lg">
                  <LayoutGrid size={28} />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight mb-1">
                  {WIN_PATTERNS[currentPattern].label}
                </h3>
                <p className="text-sm text-slate-400">
                  Complete las casillas resaltadas para ganar.
                </p>
              </div>

              {/* Grid 5x5 */}
              <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 shadow-inner mx-auto w-full max-w-[320px]">
                <div className="grid grid-cols-5 gap-3 mb-3">
                  {['B', 'I', 'N', 'G', 'O'].map((letter, i) => {
                    const colors = [
                      'text-cyan-400 bg-cyan-950/30 border-cyan-500/20',
                      'text-rose-400 bg-rose-950/30 border-rose-500/20',
                      'text-white bg-slate-800/50 border-slate-500/20',
                      'text-emerald-400 bg-emerald-950/30 border-emerald-500/20',
                      'text-amber-400 bg-amber-950/30 border-amber-500/20'
                    ];
                    return (
                      <div key={letter} className={`text-center font-black text-lg py-1 rounded border ${colors[i]} shadow-sm select-none`}>
                        {letter}
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-5 gap-3 aspect-square">
                  {Array.from({ length: 25 }).map((_, index) => {
                    const isActive = WIN_PATTERNS[currentPattern].indices.includes(index);
                    const isCenter = index === 12;

                    let cellClass = "bg-slate-900 border-slate-800";
                    let content = null;

                    if (isCenter) {
                      cellClass = "bg-amber-500 text-slate-900 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.6)] scale-110 z-20 ring-2 ring-amber-500/30";
                      content = <Star size={20} fill="currentColor" className="animate-pulse" />;
                    } else if (isActive) {
                      cellClass = "bg-gradient-to-br from-cyan-500 to-blue-600 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-105 z-10 ring-1 ring-cyan-400/50";
                      content = <div className="w-3 h-3 rounded-full bg-white shadow-sm" />;
                    } else {
                      // Inactive cells - Mejorada la visibilidad: borde más claro y sin opacidad baja
                      cellClass = "bg-slate-900 border-slate-600 opacity-100";
                    }

                    return (
                      <div
                        key={index}
                        className={`
                              rounded-lg border flex items-center justify-center transition-all duration-500 relative
                              ${cellClass}
                            `}
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setShowPatternPreview(false)}
                className="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-all border border-slate-700 hover:border-slate-600 shadow-lg text-sm uppercase tracking-wide"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel de Sorteo */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm flex-shrink-0 relative overflow-hidden">

        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
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
                disabled={roundLocked}
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
              >
                <Eye size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Zona Central de la Bola */}
        <div className="relative min-h-[240px] flex items-center justify-center py-2 perspective-1000">

          {/* Lista de Premios (Izquierda) */}
          {prizes.length > 0 && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-64 hidden lg:flex flex-col gap-3 max-h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pl-2 pr-3 py-2">
              {prizes.map((prize, idx) => {
                const previousWon = idx === 0 || prizes[idx - 1].isAwarded;
                const isNext = !prize.isAwarded && previousWon;
                const textLen = prize.description.length;
                let dynamicFontSize = 'text-lg';
                if (isNext) {
                  if (textLen <= 6) dynamicFontSize = 'text-4xl';
                  else if (textLen <= 8) dynamicFontSize = 'text-3xl';
                  else if (textLen <= 10) dynamicFontSize = 'text-2xl';
                  else if (textLen <= 13) dynamicFontSize = 'text-xl';
                  else dynamicFontSize = 'text-sm';
                } else {
                  dynamicFontSize = textLen > 15 ? 'text-xs' : 'text-sm';
                }

                return (
                  <div
                    key={prize.id}
                    onClick={() => onTogglePrize && onTogglePrize(prize.id)}
                    className={`
                        relative rounded-xl cursor-pointer transition-all duration-500
                        ${prize.isAwarded
                        ? 'bg-slate-900 border border-emerald-900/50 opacity-70 hover:opacity-100 grayscale-[0.3]'
                        : isNext
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-105 z-10 ring-4 ring-amber-500/10'
                          : 'bg-slate-900/50 border border-slate-800 opacity-50'
                      }
                      `}
                  >
                    <div className="p-3 flex items-center gap-3 relative overflow-hidden">
                      <div className={`
                             flex-shrink-0 flex items-center justify-center rounded-lg backdrop-blur-md shadow-inner
                             ${isNext ? 'w-14 h-14 bg-white/20 text-white' : prize.isAwarded ? 'w-10 h-10 bg-emerald-950 text-emerald-500' : 'w-8 h-8 bg-slate-800 text-slate-600'}
                          `}>
                        {prize.isAwarded ? <CheckCircle size={20} /> : <Gift size={isNext ? 32 : 20} />}
                      </div>
                      <div className="flex-1 min-w-0 z-10">
                        {isNext && <div className="text-[9px] font-black text-amber-100 uppercase tracking-widest mb-0.5 animate-pulse">JUGANDO</div>}
                        {prize.isAwarded && <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">ENTREGADO</div>}
                        <div className={`text-[10px] uppercase font-bold tracking-wide leading-none mb-1 ${isNext ? 'text-white/90' : 'text-slate-400'}`}>
                          {prize.name}
                        </div>
                        <div className={`font-black leading-none whitespace-nowrap ${dynamicFontSize} tracking-tight ${isNext ? 'text-white drop-shadow-sm' : prize.isAwarded ? 'text-slate-500 line-through' : 'text-slate-500'}`}>
                          {prize.description}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Centro: Bolilla 3D Estilo Bingo */}
          <div className="relative flex items-center justify-center lg:ml-10">

            {/* Letra Columna */}
            <div className="absolute right-full top-1/2 -translate-y-1/2 pr-6 flex justify-end min-w-[60px]">
              {typeof currentBall === 'number' && (
                <div className={`flex flex-col items-center duration-500 ${isAnimating ? 'opacity-50 scale-90 blur-[1px]' : 'opacity-100 scale-100 animate-in slide-in-from-right-4'}`}>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 whitespace-nowrap">Columna</span>
                  <span className="text-6xl sm:text-7xl font-black leading-none text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" style={{ textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                    {getBingoLetter(currentBall)}
                  </span>
                </div>
              )}
            </div>

            {/* La Bolilla 3D */}
            <div className="relative">
              {/* Sombra de suelo */}
              <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-8 bg-black/60 rounded-[100%] blur-md transition-all duration-200 ${isAnimating ? 'scale-75 opacity-40' : 'scale-100 opacity-60'}`}></div>

              {/* Cuerpo de la Esfera */}
              <div
                className={`
                   w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center relative
                   transition-all duration-150 border-b-4
                   ${isAnimating ? 'animate-bounce' : 'animate-in zoom-in-90 duration-500'}
                   ${ballStyle.border}
                 `}
                style={{
                  background: ballStyle.background,
                  boxShadow: `inset -10px -10px 30px rgba(0,0,0,0.5), inset 10px 10px 30px rgba(255,255,255,0.1), 0 20px 40px ${ballStyle.shadow}`
                }}
              >
                {/* Número en la esfera - Z-INDEX 10 (Por debajo del brillo) */}
                <div className={`
                     relative z-10 flex items-center justify-center w-full h-full
                     ${isAnimating ? 'animate-spin' : ''} 
                  `} style={{ animationDuration: '0.4s' }}>

                  {/* Línea de unión de plástico (opcional, sutil) */}
                  <div className="absolute inset-0 rounded-full border border-white/10 opacity-30 pointer-events-none transform rotate-45"></div>

                  {typeof currentBall === 'number' ? (
                    <span
                      className={`
                             text-7xl sm:text-[7rem] font-black tracking-tighter leading-none select-none
                             ${ballStyle.color}
                             ${isAnimating ? 'blur-[4px] scale-75 opacity-50' : 'blur-0 scale-100 opacity-100'}
                             transition-all duration-200
                          `}
                      style={{
                        // Efecto de impresión: Sombra dura y corta (ink shadow)
                        textShadow: ballStyle.inkShadow,
                        // Fusión sutil para que parezca parte del material
                        mixBlendMode: 'normal'
                      }}
                    >
                      {currentBall}
                    </span>
                  ) : (
                    <span className="text-7xl sm:text-[7rem] font-black select-none text-slate-500/30">{currentBall}</span>
                  )}
                </div>

                {/* Brillos y Reflejos - Z-INDEX 20 (Por encima del número) */}
                {/* Esto hace que el número parezca impreso EN la bola, debajo del acabado brillante */}

                {/* Brillo Plástico Principal (Highlight) */}
                <div className="absolute top-[10%] left-[20%] w-[30%] h-[15%] bg-gradient-to-b from-white/90 to-transparent rounded-[100%] rotate-[-45deg] blur-[2px] opacity-80 pointer-events-none z-20"></div>

                {/* Brillo Secundario pequeño */}
                <div className="absolute top-[20%] left-[15%] w-[10%] h-[5%] bg-white rounded-full blur-[1px] opacity-90 pointer-events-none z-20"></div>

                {/* Reflejo inferior (Bounce light) */}
                <div className="absolute bottom-[10%] right-[20%] w-[40%] h-[20%] bg-white/10 rounded-[100%] blur-md rotate-[-45deg] pointer-events-none z-20"></div>
              </div>
            </div>
          </div>

          {/* Pattern Mini Preview */}
          <div className="absolute bottom-0 right-0 sm:right-4 text-xs sm:text-sm text-slate-400 font-bold bg-slate-950/90 px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-2 shadow-lg z-20">
            <LayoutGrid size={14} /> {WIN_PATTERNS[currentPattern].label}
          </div>
        </div>

        {/* Botones de Control */}
        <div className="grid grid-cols-4 gap-3 mt-4 relative z-10">
          <button
            onClick={handleDraw}
            disabled={isDrawDisabled}
            title={buttonTooltip}
            className={`
              col-span-3 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-xl sm:text-2xl shadow-lg transition-all relative overflow-hidden group
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
            <div className={`relative ${isAnimating ? 'animate-spin' : ''}`}>
              <Play fill="currentColor" size={26} />
            </div>
            {isAnimating ? 'Mezclando...' : buttonLabel}

            {!isDrawDisabled && !isAnimating && (
              <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-white/10 to-transparent transform skew-x-12 group-hover:translate-x-full transition-transform duration-700"></div>
            )}
          </button>

          <div className="col-span-1 flex flex-col gap-2">
            {gameStarted && (
              <button
                onClick={onTogglePause}
                className={`flex-1 rounded-lg transition-all flex flex-col items-center justify-center text-[10px] font-bold uppercase tracking-wider gap-1 border ${isPaused ? 'bg-amber-500 text-slate-900 border-amber-400 animate-pulse' : 'bg-slate-800 text-amber-500 border-slate-700 hover:bg-slate-700'}`}
                title="Pausar sorteo para realizar acciones administrativas"
              >
                {isPaused ? <PlayCircle size={20} /> : <PauseCircle size={20} />}
                {isPaused ? 'REANUDAR' : 'PAUSAR'}
              </button>
            )}

            <button
              onClick={onReset}
              className={`flex-1 rounded-lg transition-colors flex flex-col items-center justify-center text-[10px] font-bold uppercase tracking-wider gap-1 ${roundFinishedNeedsReset ? 'bg-amber-900/30 text-amber-400 border border-amber-500/30 animate-pulse hover:bg-amber-900/50' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300 hover:bg-slate-700'}`}
            >
              <RotateCcw size={16} />
              RESETEAR
            </button>
          </div>
        </div>
      </div>

      {/* Tablero de Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-sm flex flex-col h-full lg:col-span-2 overflow-hidden">
          <h3 className="text-sm 2xl:text-[20px] font-semibold text-slate-300 mb-3 flex items-center gap-2 flex-shrink-0">
            <Hash className="w-3.5 h-3.5 2xl:w-6 2xl:h-6" /> Tablero de control
          </h3>
          <div className="flex flex-col gap-1 py-1 flex-1 min-h-0 justify-between">
            {boardRows.map((row) => (
              <div key={row.letter} className="flex items-stretch justify-start gap-1 flex-1 min-h-0 w-full">
                <div className={`flex-1 h-full flex items-center justify-center text-sm sm:text-xl font-black ${row.color} bg-slate-950/80 rounded border border-slate-700`}>
                  {row.letter}
                </div>
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

        {/* Historial */}
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