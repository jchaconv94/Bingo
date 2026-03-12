import React from 'react';
import { Trophy, Sparkles, Check, Eye, Hash, UserX, Ticket } from 'lucide-react';
import { Winner } from '../types.ts';
import { useAlert } from '../contexts/AlertContext.tsx';

interface Props {
  winners: Winner[];
  onClose: () => void; 
  onViewDetails: (winner: Winner) => void;
  onConfirmRound: () => void;
  onRejectWinner: (winner: Winner) => void;
}

const WinnerModal: React.FC<Props> = ({ winners, onClose, onViewDetails, onConfirmRound, onRejectWinner }) => {
  const { showConfirm } = useAlert();
  
  const handleReject = async (w: Winner) => {
    const isSoleWinner = winners.length === 1;
    const message = isSoleWinner
      ? `¿INVALIDAR a ${w.participantName}?\n\nAl ser el único ganador:\n1. Se eliminará de la lista.\n2. El premio volverá a estar disponible.\n3. El juego se REANUDARÁ para buscar otro ganador.`
      : `¿INVALIDAR a ${w.participantName}?\n\nHay ${winners.length} ganadores. Esta acción solo eliminará a este participante. El premio seguirá asignado a los restantes.`;

    const confirmed = await showConfirm({
        title: 'Invalidar Ganador',
        message: message,
        type: 'danger',
        confirmText: 'Sí, invalidar'
    });

    if (confirmed) {
      onRejectWinner(w);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="relative w-full max-w-lg transform transition-all animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        <div className="absolute -inset-1 bg-gradient-to-b from-amber-300 via-amber-500 to-orange-600 rounded-2xl blur opacity-75"></div>
        
        <div className="relative bg-slate-950 border border-amber-500/50 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
          
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

          <div className="p-4 sm:p-6 pt-2 overflow-y-auto custom-scrollbar flex-1">
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar py-2">
              {winners.map((w, idx) => (
                <div 
                  key={idx} 
                  onClick={() => onViewDetails(w)}
                  className="bg-[#0f172a] border border-slate-800/50 rounded-xl flex items-stretch overflow-hidden hover:border-slate-700 hover:bg-slate-800/30 transition-all group cursor-pointer"
                >
                  {/* Badge de Premio (Izquierda) */}
                  <div className="w-20 sm:w-24 flex-shrink-0 bg-gradient-to-b from-amber-400 to-orange-500 p-2 sm:p-3 flex flex-col items-center justify-center gap-0.5">
                    <span className="text-[8px] sm:text-[9px] font-black text-black/60 uppercase leading-none">PREMIO</span>
                    <span className="text-xs sm:text-sm font-black text-black leading-none text-center">
                      {w.prizeDescription || w.prizeName || 'Bingo'}
                    </span>
                  </div>

                  {/* Contenido Central */}
                  <div className="flex-1 p-3 sm:p-4 flex flex-col justify-center min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
                      <h4 className="text-white font-bold text-sm sm:text-base truncate tracking-tight">
                        {w.participantName}
                      </h4>
                      <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium shrink-0">
                        {new Date(w.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-3">
                      <div className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-slate-950 border border-slate-800 flex items-center gap-1 sm:gap-2">
                        <Ticket size={10} className="text-emerald-500/70 sm:w-[12px] sm:h-[12px]" />
                        <span className="text-[10px] sm:text-[11px] font-mono text-emerald-400 font-bold">{w.cardId}</span>
                      </div>
                      <div className="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-slate-950 border border-slate-800 flex items-center gap-1 sm:gap-2">
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-500 text-[8px] sm:text-[9px] flex items-center justify-center text-black font-black">
                          {w.winningNumber}
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Bola</span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de Acción (Derecha) */}
                  <div className="flex-shrink-0 flex items-center gap-1 sm:gap-2 pr-2 sm:pr-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(w);
                      }}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-center text-slate-500 hover:bg-cyan-500/10 hover:text-cyan-500 hover:border-cyan-500/30 transition-all"
                      title="Ver detalles"
                    >
                      <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(w);
                      }}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-center text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 transition-all"
                      title="Invalidar"
                    >
                      <UserX size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
