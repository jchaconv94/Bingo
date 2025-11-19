import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Trophy, Hash, History } from 'lucide-react';

interface Props {
  drawnBalls: number[];
  onDrawBall: () => void;
  onReset: () => void;
  historyLog: string[];
  hasParticipants: boolean;
}

const GamePanel: React.FC<Props> = ({ drawnBalls, onDrawBall, onReset, historyLog, hasParticipants }) => {
  const [currentBall, setCurrentBall] = useState<number | string>('—');
  const [isAnimating, setIsAnimating] = useState(false);
  const lastBall = drawnBalls[drawnBalls.length - 1];

  // Effect to update current ball when drawnBalls changes
  useEffect(() => {
    if (lastBall) {
      setCurrentBall(lastBall);
    } else {
      setCurrentBall('—');
    }
  }, [lastBall]);

  const handleDraw = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    // Simple animation effect
    let duration = 800;
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

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Big Ball Display */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-amber-500" size={24} />
            Sorteo
          </h2>
          <div className="text-slate-400 text-sm font-mono bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
            <span className="text-white font-bold">{drawnBalls.length}</span> / 75
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-4">
          <div 
            className={`
              w-48 h-48 rounded-full flex items-center justify-center text-8xl font-black shadow-[0_0_40px_rgba(0,0,0,0.5)] border-4 border-slate-800
              ${isAnimating ? 'text-slate-500 bg-slate-900 animate-pulse' : 'bg-gradient-to-b from-amber-400 to-orange-600 text-white shadow-amber-900/50'}
              transition-all duration-300
            `}
          >
            {currentBall}
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
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Board of drawn numbers */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm flex flex-col h-64 sm:h-80">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Hash size={16} /> Tablero de control
          </h3>
          <div className="flex-1 flex flex-wrap content-start gap-1.5 overflow-y-auto pr-2 custom-scrollbar">
            {drawnBalls.slice().reverse().map((n, i) => (
              <div 
                key={i}
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                  ${i === 0 ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20 ring-2 ring-amber-300' : 'bg-slate-800 text-slate-300 border border-slate-700'}
                  animate-in fade-in zoom-in duration-300
                `}
              >
                {n}
              </div>

            ))}
            {drawnBalls.length === 0 && (
              <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm italic">
                Esperando inicio...
              </div>
            )}
          </div>
        </div>

        {/* Text Log */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-sm flex flex-col h-64 sm:h-80">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <History size={16} /> Historial
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
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