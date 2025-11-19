import React from 'react';
import { BingoCard as BingoCardType } from '../types.ts';
import { Download, Trash2, Star } from 'lucide-react';

interface Props {
  card: BingoCardType;
  drawnBalls: number[];
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  isCompact?: boolean;
}

const BingoCard: React.FC<Props> = ({ card, drawnBalls, onDelete, onDownload, isCompact = false }) => {
  // Filter out the 0 (center) to check matches correctly
  const numbersOnly = card.numbers.filter(n => n !== 0);
  const matches = numbersOnly.filter(n => drawnBalls.includes(n));
  const isWinner = matches.length === 24; // 24 valid numbers matched

  // Columns headers
  const headers = ['B', 'I', 'N', 'G', 'O'];

  return (
    <div className={`relative overflow-hidden rounded-xl border transition-all duration-300 flex flex-col ${isWinner ? 'bg-amber-900/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-800/50 border-white/5 hover:border-white/10'}`}>
      {/* Header Info */}
      <div className={`flex items-center justify-between px-3 py-2 border-b ${isWinner ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/5 bg-white/5'}`}>
        <div className="flex items-center gap-2">
          <span className={`font-mono font-bold ${isWinner ? 'text-amber-400' : 'text-slate-400'}`}>
            {card.id}
          </span>
          {isWinner && <span className="text-[10px] bg-amber-500 text-amber-950 font-bold px-1.5 py-0.5 rounded">BINGO!</span>}
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => onDownload(card.id)} 
            className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/50 rounded transition-colors" 
            title="Descargar PNG"
          >
            <Download size={14} />
          </button>
          <button 
            onClick={() => onDelete(card.id)} 
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 rounded transition-colors"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col">
        {/* BINGO Letters Header */}
        <div className="grid grid-cols-5 gap-1 mb-2">
           {headers.map((letter, i) => (
             <div key={i} className="text-center font-black text-slate-500 text-2xl">{letter}</div>
           ))}
        </div>

        {/* Numbers Grid 5x5 */}
        <div className={`grid grid-cols-5 gap-1.5 ${isCompact ? 'text-xs' : 'text-sm'}`}>
          {card.numbers.map((number, index) => {
            const isCenter = index === 12;
            const isMarked = drawnBalls.includes(number);
            
            if (isCenter) {
               return (
                <div
                  key={index}
                  className="aspect-square flex flex-col items-center justify-center rounded font-bold bg-gradient-to-br from-amber-400 to-orange-500 text-amber-950 shadow-inner"
                >
                  <Star size={isCompact ? 16 : 22} fill="currentColor" className="opacity-75" />
                </div>
               );
            }

            return (
              <div
                key={index}
                className={`
                  aspect-square flex items-center justify-center rounded font-bold transition-all duration-500
                  ${isMarked 
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-900/50 scale-105 z-10' 
                    : 'bg-slate-900/80 text-slate-300'
                  }
                `}
              >
                {number}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="px-3 py-1 text-[10px] text-slate-500 text-right bg-slate-950/30">
        {matches.length}/24 aciertos
      </div>
    </div>
  );
};

export default BingoCard;