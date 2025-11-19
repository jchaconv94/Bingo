
import React from 'react';
import { BingoCard as BingoCardType, PatternKey } from '../types.ts';
import { Download, Trash2, Star } from 'lucide-react';
import { WIN_PATTERNS } from '../utils/helpers.ts';

interface Props {
  card: BingoCardType;
  drawnBalls: number[];
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  isCompact?: boolean;
  currentPattern?: PatternKey; // Optional, defaults to FULL if not provided
  readOnly?: boolean;
}

const BingoCard: React.FC<Props> = ({ 
  card, 
  drawnBalls, 
  onDelete, 
  onDownload, 
  isCompact = false, 
  currentPattern = 'FULL',
  readOnly = false
}) => {
  
  const patternIndices = WIN_PATTERNS[currentPattern].indices;

  // Calculate if this card is a winner based on the pattern
  const isWinner = patternIndices.every(idx => {
    const val = card.numbers[idx];
    return val === 0 || drawnBalls.includes(val);
  });

  // Calculate progress for UI
  const matchesCount = patternIndices.filter(idx => {
    const val = card.numbers[idx];
    return val !== 0 && drawnBalls.includes(val);
  }).length;
  
  // Total required excluding the free space (0) if it's part of the pattern
  const totalRequired = patternIndices.filter(idx => card.numbers[idx] !== 0).length;

  // Columns headers
  const headers = ['B', 'I', 'N', 'G', 'O'];

  return (
    <div className={`relative overflow-hidden rounded-xl border transition-all duration-300 flex flex-col ${isWinner ? 'bg-amber-900/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-800/50 border-white/5 hover:border-white/10'}`}>
      {/* Header Info */}
      <div className={`flex items-center justify-between ${isCompact ? 'px-2 py-1' : 'px-3 py-2'} border-b ${isWinner ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/5 bg-white/5'}`}>
        <div className="flex items-center gap-2">
          <span className={`font-mono font-bold ${isWinner ? 'text-amber-400' : 'text-slate-400'} ${isCompact ? 'text-[10px]' : 'text-sm'}`}>
            {card.id}
          </span>
          {isWinner && <span className="text-[9px] bg-amber-500 text-amber-950 font-bold px-1 py-0 rounded">WIN!</span>}
        </div>
        
        {!readOnly && (
          <div className="flex gap-0.5">
            <button 
              onClick={() => onDownload(card.id)} 
              className={`p-1 rounded transition-colors ${
                isWinner 
                  ? 'text-amber-200 hover:text-white hover:bg-amber-500/30' 
                  : 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/50'
              }`}
              title="Descargar PNG"
            >
              <Download size={isCompact ? 12 : 14} />
            </button>
            <button 
              onClick={() => onDelete(card.id)} 
              className={`p-1 rounded transition-colors ${
                isWinner 
                  ? 'text-amber-200 hover:text-white hover:bg-amber-500/30' 
                  : 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/50'
              }`}
              title="Eliminar"
            >
              <Trash2 size={isCompact ? 12 : 14} />
            </button>
          </div>
        )}
      </div>

      <div className={`${isCompact ? 'p-1.5' : 'p-3'} flex-1 flex flex-col`}>
        {/* BINGO Letters Header */}
        <div className={`grid grid-cols-5 ${isCompact ? 'gap-0.5 mb-1' : 'gap-1 mb-2'}`}>
           {headers.map((letter, i) => (
             <div key={i} className={`text-center font-black text-slate-500 ${isCompact ? 'text-[12px]' : 'text-3xl'}`}>{letter}</div>
           ))}
        </div>

        {/* Numbers Grid 5x5 */}
        <div className={`grid grid-cols-5 ${isCompact ? 'gap-0.5 text-[9px]' : 'gap-1.5 text-sm'}`}>
          {card.numbers.map((number, index) => {
            const isCenter = index === 12;
            const isMarked = drawnBalls.includes(number);
            const isRequiredByPattern = patternIndices.includes(index);
            
            // Styles calculation
            let bgClass = 'bg-slate-900/40 text-slate-500'; // Default dim
            let scaleClass = '';

            if (isCenter) {
              // Center is always highlighted if it's part of the pattern, or just standard star if not
               return (
                <div
                  key={index}
                  className={`aspect-square flex flex-col items-center justify-center rounded font-bold shadow-inner
                     ${isRequiredByPattern 
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-amber-950 ring-2 ring-amber-500/50' 
                        : 'bg-slate-800 text-slate-600 opacity-50' 
                     }
                  `}
                >
                  <Star size={isCompact ? 12 : 22} fill="currentColor" className={isRequiredByPattern ? "opacity-75" : "opacity-30"} />
                </div>
               );
            }

            if (isRequiredByPattern) {
               if (isMarked) {
                  // Marked and Required -> Green/Active
                  bgClass = 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-900/50 z-10 ring-1 ring-emerald-400/50';
                  scaleClass = 'scale-105';
               } else {
                  // Required but Not Marked -> Waiting state (distinct from non-required)
                  bgClass = 'bg-slate-800 text-slate-200 border border-slate-600';
               }
            } else {
                if (isMarked) {
                  // Marked but NOT Required -> Just visual noise, dim it out but show it was called
                   bgClass = 'bg-slate-800/80 text-slate-400 opacity-60';
                }
            }

            return (
              <div
                key={index}
                className={`
                  aspect-square flex items-center justify-center rounded font-bold transition-all duration-500
                  ${bgClass} ${scaleClass}
                `}
              >
                {number}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className={`${isCompact ? 'px-2 py-0.5 text-[8px]' : 'px-3 py-1 text-[10px]'} text-slate-500 text-right bg-slate-950/30 flex justify-between items-center`}>
         <span className={`text-slate-600 uppercase tracking-wider ${isCompact ? 'text-[8px]' : 'text-[9px]'}`}>{WIN_PATTERNS[currentPattern].label}</span>
         <span>{matchesCount}/{totalRequired}</span>
      </div>
    </div>
  );
};

export default BingoCard;
