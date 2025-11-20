

import React from 'react';
import { X, User, Calendar, Hash, Trophy, Gift, Users, Divide } from 'lucide-react';
import { Participant, Winner, BingoCard as BingoCardType, PatternKey, Prize } from '../types.ts';
import BingoCard from './BingoCard.tsx';

interface Props {
  winner: Winner;
  participant: Participant;
  card: BingoCardType;
  drawnBalls: number[];
  onClose: () => void;
  currentPattern?: PatternKey;
  onDeleteCard: (participantId: string, cardId: string) => void;
  onDownloadCard: (participant: Participant, cardId: string) => void;
  onShareCard?: (cardId: string) => void;
  prizes?: Prize[];
  allWinners?: Winner[];
}

const WinnerDetailsModal: React.FC<Props> = ({ 
  winner, 
  participant, 
  card, 
  drawnBalls, 
  onClose, 
  currentPattern = 'FULL',
  onDeleteCard,
  onDownloadCard,
  onShareCard,
  prizes = [],
  allWinners = []
}) => {

  // --- PRIZE CALCULATION LOGIC ---
  
  // 1. Identify concurrent winners (winners with the exact same timestamp)
  const concurrentWinners = allWinners.filter(w => w.timestamp === winner.timestamp);
  const winnerCount = concurrentWinners.length;

  // 2. Get the Prize details directly from the winner object (Snapshot)
  // This ensures historical accuracy even if prizes are changed later
  const prizeName = winner.prizeName;
  const prizeDescription = winner.prizeDescription;

  // 3. Parse amount and calculate split
  let prizeAmount = 0;
  let splitAmount = 0;
  let currencySymbol = "S/.";

  if (prizeName && prizeDescription) {
    // Extract numbers from description (e.g. "S/. 100.00" -> 100.00)
    const match = prizeDescription.match(/[0-9.,]+/);
    if (match) {
       // Remove commas if present to parse correctly
       const cleanNum = match[0].replace(/,/g, '');
       prizeAmount = parseFloat(cleanNum);
       
       // Try to detect currency symbol if it's not default
       if (prizeDescription.includes('$')) currencySymbol = "$";
       if (prizeDescription.includes('€')) currencySymbol = "€";
    }
    
    if (prizeAmount > 0 && winnerCount > 0) {
      splitAmount = prizeAmount / winnerCount;
    }
  }

  // DETERMINAR PATRÓN DE VICTORIA
  // Prioridad: 1. El guardado en el ganador (Histórico), 2. El actual del juego (En vivo/Fallback)
  const displayPattern = winner.winningPattern || currentPattern;

  // DETERMINAR BOLILLAS (Snapshot vs Current)
  // Si el ganador tiene guardado el historial de bolillas (Snapshot), lo usamos.
  // Esto asegura que el cartón se vea "pintado" tal cual ganó, incluso si se reseteó el sorteo.
  const displayDrawnBalls = (winner.drawnBalls && winner.drawnBalls.length > 0) 
      ? winner.drawnBalls 
      : drawnBalls;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-950/50 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-amber-500" size={20} />
            Detalles del Ganador
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Participant Data & Prize Info */}
            <div className="space-y-4">
              {/* Participant Box */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User size={16} /> Datos del Participante
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 block">Nombre Completo</label>
                    <div className="text-lg font-semibold text-white">{participant.name} {participant.surname}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                      <label className="text-xs text-slate-500 block">DNI / ID</label>
                      <div className="text-sm font-mono text-slate-200">{participant.dni}</div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block">Teléfono</label>
                      <div className="text-sm font-mono text-slate-200">{participant.phone || '---'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prize Box (NEW) */}
              {prizeName && (
                 <div className="bg-emerald-900/20 rounded-xl p-4 border border-emerald-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                       <Gift size={48} className="text-emerald-400" />
                    </div>
                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2 relative z-10">
                      <Gift size={16} /> {prizeName}
                    </h3>
                    
                    <div className="space-y-3 relative z-10">
                       <div className="flex justify-between items-end border-b border-emerald-500/20 pb-2">
                          <span className="text-xs text-slate-400">Premio Total</span>
                          <span className="text-lg font-mono font-bold text-emerald-300">
                             {prizeAmount > 0 ? `${currencySymbol} ${prizeAmount.toFixed(2)}` : prizeDescription}
                          </span>
                       </div>
                       
                       {prizeAmount > 0 && winnerCount > 1 && (
                         <>
                           <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400 flex items-center gap-1"><Users size={12}/> Total Ganadores</span>
                              <span className="text-white font-bold">{winnerCount}</span>
                           </div>
                           <div className="flex justify-between items-end bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                              <span className="text-xs text-emerald-200 font-medium flex items-center gap-1">
                                 <Divide size={12} /> Corresponde a c/u
                              </span>
                              <span className="text-xl font-black text-white drop-shadow-sm">
                                 {currencySymbol} {splitAmount.toFixed(2)}
                              </span>
                           </div>
                         </>
                       )}
                       
                       {winnerCount === 1 && prizeAmount > 0 && (
                          <div className="text-xs text-emerald-200/70 italic text-right">
                             Ganador único, se lleva el pozo completo.
                          </div>
                       )}
                    </div>
                 </div>
              )}

              {/* Win Details Box */}
              <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-500/30">
                 <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Trophy size={16} /> Datos de la Victoria
                </h3>
                 <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b border-amber-500/20 pb-2">
                      <span className="text-slate-400">Hora del Bingo</span>
                      <span className="text-amber-100 font-mono flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(winner.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-amber-500/20 pb-2">
                      <span className="text-slate-400">Bolilla Ganadora</span>
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <Hash size={12} />
                        {winner.winningNumber}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-slate-400">ID Cartón</span>
                      <span className="text-white font-mono">{winner.cardId}</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Right: The Winning Card */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Cartón Ganador</h3>
              <div> 
                <BingoCard 
                  card={card} 
                  drawnBalls={displayDrawnBalls}
                  onDelete={(cardId) => onDeleteCard(participant.id, cardId)} 
                  onDownload={(cardId) => onDownloadCard(participant, cardId)}
                  onShare={onShareCard}
                  hasPhone={!!participant.phone}
                  isCompact={false}
                  currentPattern={displayPattern}
                  readOnly={false} 
                />
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950/50 px-6 py-4 border-t border-slate-800 text-right">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default WinnerDetailsModal;