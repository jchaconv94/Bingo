
import React from 'react';
import { X, User, Calendar, Hash, Trophy } from 'lucide-react';
import { Participant, Winner, BingoCard as BingoCardType, PatternKey } from '../types.ts';
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
}

const WinnerDetailsModal: React.FC<Props> = ({ 
  winner, 
  participant, 
  card, 
  drawnBalls, 
  onClose, 
  currentPattern = 'FULL',
  onDeleteCard,
  onDownloadCard
}) => {
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
            
            {/* Left: Participant Data */}
            <div className="space-y-6">
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
                  drawnBalls={drawnBalls}
                  onDelete={(cardId) => onDeleteCard(participant.id, cardId)} 
                  onDownload={(cardId) => onDownloadCard(participant, cardId)}
                  isCompact={false}
                  currentPattern={currentPattern}
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
