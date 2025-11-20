
import React from 'react';
import { Trophy, Sparkles, Check, Eye, Hash, UserX } from 'lucide-react';
import { Winner } from '../types.ts';

interface Props {
  winners: Winner[];
  onClose: () => void; // Used for fallback or background click
  onViewDetails: (winner: Winner) => void;
  onConfirmRound: () => void;
  onRejectWinner: (winner: Winner) => void;
}

const WinnerModal: React.FC<Props> = ({ winners, onClose, onViewDetails, onConfirmRound, onRejectWinner }) => {
  
  const handleReject = (w: Winner) => {
    if (window.confirm(`¿INVALIDAR a ${w.participantName}?\n\nEsta acción:\n1. Eliminará a este ganador.\n2. Reseteará las bolillas.\n3. Dejará el premio ABIERTO para jugar de nuevo.`)) {
      onRejectWinner(w);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      {/* Glow Effect Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="relative w-full max-w-lg transform transition-all animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        {/* Card Border Gradient */}
        <div className="absolute -inset-1 bg-gradient-to-b from-amber-300 via-amber-500 to-orange-600 rounded-2xl blur opacity-75"></div>
        
        <div className="relative bg-slate-950 border border-amber-500/50 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
          
          {/* Header */}
          <div className="bg-gradient-to-b from-amber-900/50 to-slate-950 p-6 text-center relative flex-shrink-0">
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
                <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
             </div>
             
             <div className="flex flex-col items-center justify-center">
               <div className="inline-flex items-center justify-center p-3 rounded-full bg-gradient-to-b from-amber-300 to-amber-600 shadow-lg shadow-amber-500/50 mb-3 animate-bounce">
                  <Trophy size={32} className="text-slate-900 fill-amber-100" />
               </div>
               
               <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)] uppercase">
                 ¡TENEMOS BINGO!
               </h2>
               <p className="text-amber-300 font-medium text-sm tracking-widest uppercase mt-1 flex items-center justify-center gap-2">
                 <Sparkles size={14} /> {winners.length} Ganador{winners.length > 1 ? 'es' : ''} <Sparkles size={14} />
               </p>
               <p className="text-slate-400 text-xs mt-2 max-w-xs mx-auto leading-tight">
                 Verifique la validez de los ganadores antes de confirmar el sorteo.
               </p>
             </div>
          </div>

          {/* List Content */}
          <div className="p-6 pt-2 overflow-y-auto custom-scrollbar flex-1">
            <div className="space-y-3">
              {winners.map((w, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between group hover:border-amber-500/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-amber-900/40 ring-2 ring-amber-500/50">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="text-white font-bold leading-tight">{w.participantName}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1"><Hash size={10} /> Cartón: <span className="text-emerald-400 font-mono">{w.cardId}</span></span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Bolilla: <span className="text-amber-400 font-bold">{w.winningNumber}</span></span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(w)}
                      className="p-2 bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 hover:border-rose-500/50 transition-all"
                      title="INVALIDAR GANADOR (Borra ganador y resetea sorteo)"
                    >
                      <UserX size={20} />
                    </button>

                    <button
                      onClick={() => onViewDetails(w)}
                      className="p-2 bg-slate-800 hover:bg-cyan-900/50 text-slate-400 hover:text-cyan-400 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-all"
                      title="Ver cartón completo"
                    >
                      <Eye size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-4 bg-slate-950/50 border-t border-slate-800 flex-shrink-0">
            <button
              onClick={onConfirmRound}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-900/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Check size={24} strokeWidth={3} />
              Continuar Sorteo
            </button>
            <div className="text-center mt-2">
               <span className="text-[10px] text-slate-500">
                 Al continuar: Se marcan premios como entregados, se borran bolillas y se limpia el patrón.
               </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WinnerModal;
