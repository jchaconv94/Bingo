
import React from 'react';
import { BingoCard as BingoCardType, PatternKey } from '../types.ts';
import { Download, Trash2, Star, MessageCircle, Share2 } from 'lucide-react';
import { WIN_PATTERNS } from '../utils/helpers.ts';

interface Props {
  card: BingoCardType;
  drawnBalls: number[];
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  onShare?: (id: string) => void;
  hasPhone?: boolean;
  isCompact?: boolean;
  currentPattern?: PatternKey; // Optional, defaults to FULL if not provided
  readOnly?: boolean;
}

const BingoCard: React.FC<Props> = ({ 
  card, 
  drawnBalls, 
  onDelete, 
  onDownload, 
  onShare,
  hasPhone = false,
  isCompact = false, 
  currentPattern = 'FULL',
  readOnly = false
}) => {
  
  const patternIndices = WIN_PATTERNS[currentPattern].indices;

  // Calculate if this card is a winner based on the pattern
  const isWinner = patternIndices.length > 0 && patternIndices.every(idx => {
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

  // Columns headers config with Colors
  const headers = [
    { letter: 'B', color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-950/30' },
    { letter: 'I', color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-950/30' },
    { letter: 'N', color: 'text-white', border: 'border-slate-500/30', bg: 'bg-slate-800/50' },
    { letter: 'G', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-950/30' },
    { letter: 'O', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-950/30' },
  ];

  return (
    <div className={`
      relative overflow-hidden rounded-2xl transition-all duration-300 flex flex-col shadow-xl
      ${isWinner 
        ? 'bg-gradient-to-br from-amber-900/80 to-slate-900 border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)] scale-[1.02] z-10' 
        : 'bg-slate-900 border border-slate-700 hover:border-slate-500'
      }
    `}>
      
      {/* Top Bar: ID and Actions */}
      <div className={`
        flex items-center justify-between bg-slate-950 border-b border-slate-800
        ${isCompact ? 'px-3 py-1.5' : 'px-4 py-2.5'}
      `}>
        <div className="flex flex-col leading-none">
          <span className={`uppercase font-bold text-slate-500 tracking-widest ${isCompact ? 'text-[7px]' : 'text-[9px]'}`}>
            Cartón N°
          </span>
          <span className={`font-mono font-black text-white tracking-tight ${isCompact ? 'text-base' : 'text-2xl'}`}>
            {card.id}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isWinner && (
            <div className={`font-black uppercase bg-amber-500 text-slate-950 rounded px-2 py-0.5 animate-pulse ${isCompact ? 'text-[9px]' : 'text-xs'}`}>
              WINNER
            </div>
          )}
          
          {!readOnly && (
            <div className="flex gap-1 pl-2 border-l border-slate-800 ml-1">
              {hasPhone && onShare && (
                <button 
                  onClick={() => onShare(card.id)} 
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/50 transition-colors"
                  title="Enviar a WhatsApp"
                >
                  <MessageCircle size={isCompact ? 14 : 16} />
                </button>
              )}
              <button 
                onClick={() => onDownload(card.id)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/50 transition-colors"
                title="Descargar Imagen"
              >
                <Download size={isCompact ? 14 : 16} />
              </button>
              <button 
                onClick={() => onDelete(card.id)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 transition-colors"
                title="Eliminar"
              >
                <Trash2 size={isCompact ? 14 : 16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`${isCompact ? 'p-2' : 'p-4'} flex-1 flex flex-col bg-slate-900/50`}>
        
        {/* BINGO Header with Colored Pills */}
        <div className={`grid grid-cols-5 ${isCompact ? 'gap-1 mb-1.5' : 'gap-2 mb-3'}`}>
           {headers.map((h, i) => (
             <div 
               key={i} 
               className={`
                 flex items-center justify-center font-black rounded-md border shadow-sm select-none
                 ${h.bg} ${h.border} ${h.color}
                 ${isCompact ? 'text-sm py-0.5' : 'text-2xl py-1'}
               `}
             >
               {h.letter}
             </div>
           ))}
        </div>

        {/* Numbers Grid 5x5 */}
        <div className={`grid grid-cols-5 ${isCompact ? 'gap-1 text-[10px]' : 'gap-2 text-base'}`}>
          {card.numbers.map((number, index) => {
            const isCenter = index === 12;
            const isMarked = drawnBalls.includes(number);
            const isRequiredByPattern = patternIndices.includes(index);
            
            // Determine Styles
            let cellStyle = 'bg-slate-800 border-slate-700 text-slate-400'; // Default inactive
            let content = <span className="opacity-80">{number}</span>;
            
            if (isCenter) {
               // Center Star
               const activeClass = isRequiredByPattern 
                  ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" 
                  : "text-slate-600";
               
               cellStyle = "bg-slate-800/80 border-slate-700";
               content = <Star fill="currentColor" size={isCompact ? 14 : 24} className={activeClass} />;
            } else if (isMarked) {
               // Marked Number
               if (isRequiredByPattern) {
                 // Marked AND Required (Good!)
                 cellStyle = "bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)] scale-105 z-10 ring-1 ring-emerald-300/50";
                 content = <span className="font-black drop-shadow-md">{number}</span>;
               } else {
                 // Marked but useless for pattern
                 cellStyle = "bg-slate-700 border-slate-600 text-slate-400 opacity-50";
                 content = <span className="font-medium line-through decoration-slate-500/50">{number}</span>;
               }
            } else {
               // Not Marked
               if (isRequiredByPattern) {
                 // Required but waiting
                 cellStyle = "bg-slate-800 border-slate-600 text-white ring-1 ring-white/10";
                 content = <span className="font-bold">{number}</span>;
               }
            }

            return (
              <div
                key={index}
                className={`
                  aspect-square flex items-center justify-center rounded-md border transition-all duration-300 cursor-default
                  ${cellStyle}
                `}
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Footer Info */}
      <div className={`
        ${isCompact ? 'px-3 py-1 text-[9px]' : 'px-4 py-2 text-xs'} 
        bg-slate-950 border-t border-slate-800 flex justify-between items-center font-medium text-slate-500
      `}>
         <span className="uppercase tracking-wider truncate max-w-[70%]">{WIN_PATTERNS[currentPattern].label}</span>
         <span className={`${matchesCount === totalRequired ? 'text-emerald-400 font-bold animate-pulse' : 'text-slate-400'}`}>
            {matchesCount} / {totalRequired}
         </span>
      </div>
    </div>
  );
};

export default BingoCard;
