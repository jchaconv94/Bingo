
import React from 'react';
import { BingoCard as BingoCardType, PatternKey } from '../types.ts';
import { Download, Trash2, Star, MessageCircle, Share2, Ban } from 'lucide-react';
import { WIN_PATTERNS } from '../utils/helpers.ts';

interface Props {
  card: BingoCardType;
  drawnBalls: number[];
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  onShare?: (id: string) => void;
  hasPhone?: boolean;
  isCompact?: boolean;
  isPanelVariant?: boolean;
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
  isPanelVariant = false,
  currentPattern = 'FULL',
  readOnly = false
}) => {
  
  const isInvalid = card.isInvalid;
  const patternIndices = WIN_PATTERNS[currentPattern].indices;

  // Calculate if this card is a winner based on the pattern
  // IMPORTANT: If invalid, it's never a winner
  const isWinner = !isInvalid && patternIndices.length > 0 && patternIndices.every(idx => {
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
      relative overflow-hidden transition-all duration-300 flex flex-col shadow-xl
      ${isPanelVariant ? 'rounded-none' : isCompact ? 'rounded-lg' : 'rounded-2xl'}
      ${isInvalid 
         ? 'bg-slate-950 border-2 border-rose-900/50 grayscale opacity-70'
         : isWinner 
            ? 'bg-gradient-to-br from-amber-900/80 to-slate-900 border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)] scale-[1.02] z-10' 
            : 'bg-slate-900 border border-slate-700 hover:border-slate-500'
      }
    `}>
      
      {/* Overlay for Invalid Cards */}
      {isInvalid && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] pointer-events-none">
            <div className="bg-rose-600/90 text-white font-black text-lg sm:text-2xl border-4 border-white/20 px-4 py-1 rotate-[-15deg] shadow-2xl tracking-widest uppercase">
               ANULADO
            </div>
         </div>
      )}

      {/* Top Bar: ID and Actions */}
      <div className={`
        flex flex-col bg-slate-950 border-b border-slate-800
        ${isPanelVariant ? 'p-0.5' : isCompact ? 'p-1' : 'p-3'}
      `}>
        <div className="flex items-start justify-between w-full">
          <div className="flex flex-col leading-none">
            <span className={`uppercase font-bold text-slate-500 tracking-widest ${isPanelVariant ? 'text-[8px]' : isCompact ? 'text-[8px] sm:text-[9px]' : 'text-[9px]'}`}>
              Cartón N°
            </span>
            <span className={`font-mono font-black tracking-tight ${isInvalid ? 'text-rose-900' : 'text-white'} ${isPanelVariant ? 'text-[13px]' : isCompact ? 'text-lg' : 'text-2xl'}`}>
              {card.id}
            </span>
          </div>

          <div className={`flex flex-col items-end gap-0.5`}>
            {isWinner && (
              <div className={`font-black uppercase bg-amber-500 text-slate-950 rounded px-1 animate-pulse ${isPanelVariant ? 'text-[5px] py-0' : isCompact ? 'text-[7px] py-0.5' : 'text-xs py-0.5'}`}>
                WINNER
              </div>
            )}
            {isInvalid && (
               <div className={`font-black uppercase bg-rose-900 text-rose-400 rounded px-1 ${isPanelVariant ? 'text-[5px] py-0' : isCompact ? 'text-[7px] py-0.5' : 'text-xs py-0.5'}`}>
                  VOID
               </div>
            )}
          </div>
        </div>

        {!readOnly && (
          <div className={`flex items-center w-full relative z-50 border-t border-slate-800/50 ${isPanelVariant ? 'gap-1 mt-1 pt-1' : 'gap-1 mt-1.5 pt-1.5'}`}>
            {hasPhone && onShare && (
              <button 
                onClick={() => onShare(card.id)} 
                className={`flex-1 flex items-center justify-center bg-slate-900 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-900/50 transition-colors font-bold uppercase tracking-wider ${isPanelVariant ? 'gap-0.5 py-1.5 text-[6px] rounded-[3px]' : 'gap-1 py-2 rounded-md text-[8px]'}`}
                title="Enviar a WhatsApp"
              >
                <MessageCircle size={isPanelVariant ? 10 : 12} />
                {!isCompact && !isPanelVariant && <span>Enviar</span>}
              </button>
            )}
            <button 
              onClick={() => onDownload(card.id)} 
              className={`flex-1 flex items-center justify-center bg-slate-900 text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-900/50 transition-colors font-bold uppercase tracking-wider ${isPanelVariant ? 'gap-0.5 py-1.5 text-[6px] rounded-[3px]' : 'gap-1 py-2 rounded-md text-[8px]'}`}
              title="Descargar Imagen"
            >
              <Download size={isPanelVariant ? 10 : 12} />
              {!isCompact && !isPanelVariant && <span>Guardar</span>}
            </button>
            <button 
              onClick={() => onDelete(card.id)} 
              className={`flex-1 flex items-center justify-center bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 border border-slate-800 hover:border-rose-900/50 transition-colors font-bold uppercase tracking-wider ${isPanelVariant ? 'gap-0.5 py-1.5 text-[6px] rounded-[3px]' : 'gap-1 py-2 rounded-md text-[8px]'}`}
              title="Eliminar"
            >
              <Trash2 size={isPanelVariant ? 10 : 12} />
              {!isCompact && !isPanelVariant && <span>Borrar</span>}
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className={`${isPanelVariant ? 'p-0.5' : isCompact ? 'p-1.5 sm:p-2' : 'p-4'} flex-1 flex flex-col bg-slate-900/50`}>
        
        {/* BINGO Header with Colored Pills */}
        <div className={`grid grid-cols-5 ${isPanelVariant ? 'gap-0.5 mb-1' : isCompact ? 'gap-1 mb-2' : 'gap-2 mb-3'}`}>
           {headers.map((h, i) => (
             <div 
               key={i} 
               className={`
                 aspect-square flex items-center justify-center font-black rounded-[2px] sm:rounded-md border shadow-sm select-none
                 ${isInvalid ? 'bg-slate-800 border-slate-700 text-slate-600' : `${h.bg} ${h.border} ${h.color}`}
                 ${isPanelVariant ? 'text-[9px]' : isCompact ? 'text-sm sm:text-[17px]' : 'text-2xl'}
               `}
             >
               {h.letter}
             </div>
           ))}
        </div>

        {/* Numbers Grid 5x5 */}
        <div className={`grid grid-cols-5 ${isPanelVariant ? 'gap-px text-[10px]' : isCompact ? 'gap-1 text-[15px] sm:text-base' : 'gap-2 text-base'}`}>
          {card.numbers.map((number, index) => {
            const isCenter = index === 12;
            const isMarked = drawnBalls.includes(number);
            const isRequiredByPattern = patternIndices.includes(index);
            
            // Determine Styles
            let cellStyle = 'bg-slate-800 border-slate-700 text-slate-400'; // Default inactive
            let content = <span className="opacity-80">{number}</span>;
            
            if (isInvalid) {
               cellStyle = "bg-slate-900 border-slate-800 text-slate-700";
               if (isCenter) {
                  content = <Ban size={isPanelVariant ? 10 : isCompact ? 18 : 24} className="text-slate-700" />;
               }
            } else {
               // Normal Logic
                if (isCenter) {
                   // Center Star
                   const activeClass = isRequiredByPattern 
                      ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" 
                      : "text-slate-600";
                   
                   cellStyle = "bg-slate-800/80 border-slate-700";
                   content = <Star fill="currentColor" size={isPanelVariant ? 8 : isCompact ? 16 : 24} className={activeClass} />;
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
            }

            return (
              <div
                key={index}
                className={`
                  aspect-square flex items-center justify-center rounded-[3px] sm:rounded-md border transition-all duration-300 cursor-default
                  ${cellStyle}
                  ${isCompact || isPanelVariant ? 'font-bold' : ''}
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
        ${isPanelVariant ? 'px-1.5 py-0.5 text-[9px]' : isCompact ? 'px-1.5 py-0.5 text-[8px]' : 'px-4 py-2 text-xs'} 
        bg-slate-950 border-t border-slate-800 flex justify-between items-center font-medium text-slate-500
      `}>
         <span className="uppercase tracking-wider truncate max-w-[70%]">{WIN_PATTERNS[currentPattern].label}</span>
         <span className={`${!isInvalid && matchesCount === totalRequired ? 'text-emerald-400 font-bold animate-pulse' : 'text-slate-400'}`}>
            {matchesCount} / {totalRequired}
         </span>
      </div>
    </div>
  );
};

export default BingoCard;
