
import React, { useState } from 'react';
import { Search, Users, Medal, Ticket, Edit2, Trash2, Save, X, Eye, EyeOff, CreditCard, ChevronDown, ChevronUp, ScanEye, Phone, Fingerprint, MessageCircle, FileText, MoreVertical } from 'lucide-react';
import { Participant, Winner, BingoCard as BingoCardType, PatternKey, Prize } from '../types.ts';
import BingoCard from './BingoCard.tsx';
import WinnerDetailsModal from './WinnerDetailsModal.tsx';
import ParticipantDetailsModal from './ParticipantDetailsModal.tsx';
import { useAlert } from '../contexts/AlertContext.tsx';

interface Props {
  participants: Participant[];
  drawnBalls: number[];
  winners: Winner[];
  onAddCard: (participantId: string) => void;
  onDeleteCard: (participantId: string, cardId: string) => void;
  onDownloadCard: (participant: Participant, cardId: string) => void;
  onEditParticipant: (id: string, data: { name: string, surname: string, dni: string, phone: string }) => void;
  onDeleteParticipant: (id: string) => void;
  onDeleteAllParticipants: () => void;
  currentPattern: PatternKey;
  onShareCard?: (participant: Participant, cardId: string) => void;
  onShareAllCards?: (participant: Participant) => void;
  prizes?: Prize[];
  totalCards?: number;
}

const ParticipantsPanel: React.FC<Props> = ({ 
  participants, 
  drawnBalls, 
  winners, 
  onAddCard, 
  onDeleteCard,
  onDownloadCard,
  onEditParticipant,
  onDeleteParticipant,
  onDeleteAllParticipants,
  currentPattern,
  onShareCard,
  onShareAllCards,
  prizes = [],
  totalCards = 0
}) => {
  const { showAlert, showConfirm } = useAlert();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', surname: '', dni: '', phone: '' });
  const [hideParticipants, setHideParticipants] = useState(false);
  
  // Global visibility state
  const [showCardsGlobal, setShowCardsGlobal] = useState(true);
  // Individual visibility overrides (id -> boolean)
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});
  
  const [viewingWinnerData, setViewingWinnerData] = useState<{
    winner: Winner;
    participant: Participant;
    card: BingoCardType;
  } | null>(null);

  const [viewingParticipantId, setViewingParticipantId] = useState<string | null>(null);

  const viewingParticipant = viewingParticipantId 
    ? participants.find(p => p.id === viewingParticipantId) || null
    : null;

  const filteredParticipants = participants.filter(p => {
    const term = search.toLowerCase();
    const name = String(p.name || '').toLowerCase();
    const surname = String(p.surname || '').toLowerCase();
    const dni = String(p.dni || '').toLowerCase();

    return name.includes(term) || surname.includes(term) || dni.includes(term);
  });

  const startEdit = (p: Participant) => {
    setEditingId(p.id);
    setEditForm({ name: p.name, surname: p.surname, dni: p.dni, phone: p.phone || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', surname: '', dni: '', phone: '' });
  };

  const saveEdit = () => {
    if (editingId) {
      onEditParticipant(editingId, editForm);
      setEditingId(null);
    }
  };

  const handleViewWinner = (winner: Winner) => {
    const participant = participants.find(p => p.id === winner.participantId);
    if (participant) {
      let card = participant.cards.find(c => c.id === winner.cardId);
      if (!card && winner.cardSnapshot) {
         card = winner.cardSnapshot;
      }

      if (card) {
        setViewingWinnerData({ winner, participant, card });
      } else {
        showAlert({ title: 'Cartón no encontrado', message: "El cartón ganador ha sido eliminado y no se encontró un registro histórico.", type: 'warning' });
      }
    } else {
      showAlert({ title: 'Participante no encontrado', message: "El participante parece haber sido eliminado.", type: 'warning' });
    }
  };

  const toggleGlobalCards = () => {
    setShowCardsGlobal(!showCardsGlobal);
    setExpandedStates({});
  };

  const toggleIndividualCard = (id: string) => {
    setExpandedStates(prev => {
      const currentVisibility = prev[id] !== undefined ? prev[id] : showCardsGlobal;
      return { ...prev, [id]: !currentVisibility };
    });
  };

  return (
    <>
      {viewingWinnerData && (
        <WinnerDetailsModal 
          winner={viewingWinnerData.winner}
          participant={viewingWinnerData.participant}
          card={viewingWinnerData.card}
          drawnBalls={drawnBalls}
          onClose={() => setViewingWinnerData(null)}
          currentPattern={currentPattern}
          onDeleteCard={onDeleteCard}
          onDownloadCard={onDownloadCard}
          onShareCard={onShareCard ? (cardId) => onShareCard(viewingWinnerData.participant, cardId) : undefined}
          prizes={prizes}
          allWinners={winners}
        />
      )}

      {viewingParticipant && (
        <ParticipantDetailsModal 
          participant={viewingParticipant}
          drawnBalls={drawnBalls}
          onClose={() => setViewingParticipantId(null)}
          currentPattern={currentPattern}
          onAddCard={() => onAddCard(viewingParticipant.id)}
          onSave={(data) => {
             onEditParticipant(viewingParticipant.id, data);
          }}
          onDelete={() => {
              // Participant details handles its own delete confirmation now via App logic when calling this
               onDeleteParticipant(viewingParticipant.id);
               setViewingParticipantId(null);
          }}
          onDeleteCard={onDeleteCard}
          onDownloadCard={onDownloadCard}
          onShareCard={onShareCard ? (cardId) => onShareCard(viewingParticipant, cardId) : undefined}
          onShareAllCards={onShareAllCards ? () => onShareAllCards(viewingParticipant) : undefined}
        />
      )}

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 shadow-xl backdrop-blur-sm flex flex-col h-full">
        <div className="flex flex-col gap-3 mb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 w-full justify-between">
              <h2 className="text-sm 2xl:text-[20px] font-bold text-white flex items-center gap-2">
                <Users className="text-emerald-500 w-[18px] h-[18px] 2xl:w-6 2xl:h-6" />
                Participantes
                <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-full border border-slate-700">
                  {participants.length}
                </span>
                {totalCards > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded-full border border-emerald-800/50 ml-1">
                    <Ticket size={10} /> {totalCards}
                  </span>
                )}
              </h2>
              
              <div className="flex gap-1">
                <button
                  onClick={toggleGlobalCards}
                  className={`p-1 rounded transition-colors border border-slate-700 ${showCardsGlobal ? 'bg-slate-800 text-slate-400 hover:text-cyan-400' : 'bg-cyan-900/30 text-cyan-400 border-cyan-800'}`}
                  title={showCardsGlobal ? "Ocultar TODOS los cartones" : "Mostrar TODOS los cartones"}
                >
                  <CreditCard size={14} />
                </button>
                <button
                  onClick={() => setHideParticipants(!hideParticipants)}
                  className={`p-1 rounded transition-colors border border-slate-700 ${hideParticipants ? 'bg-cyan-900/30 text-cyan-400 border-cyan-800' : 'bg-slate-800 text-slate-400 hover:text-cyan-400'}`}
                  title={hideParticipants ? "Mostrar nombres" : "Ocultar nombres (Privacidad)"}
                >
                  {hideParticipants ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={onDeleteAllParticipants}
                  className="p-1 rounded transition-colors border border-slate-700 bg-slate-800 text-slate-400 hover:bg-rose-950/50 hover:text-rose-400 hover:border-rose-800/50"
                  title="Eliminar TODOS los participantes"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Winners Section */}
          {winners.length > 0 && (
            <div className="bg-slate-950/50 border border-amber-500/30 rounded-xl p-2 animate-in slide-in-from-top-2 shadow-lg">
              <h3 className="text-amber-400 text-xs font-black tracking-wide flex items-center gap-2 mb-2 uppercase px-1">
                <Medal size={14} className="drop-shadow-md" /> Ganadores Recientes ({winners.length})
              </h3>
              <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {winners.map((w, i) => {
                  // Extract amount logic
                  let amountDisplay = "🏆";
                  let currency = "S/";
                  
                  if (w.prizeDescription) {
                     const match = w.prizeDescription.match(/(\d+(?:[.,]\d+)?)/);
                     if (match) {
                        const val = parseFloat(match[0].replace(/,/g, ''));
                        amountDisplay = val >= 1000 ? `${(val/1000).toFixed(1)}k` : match[0];
                        if (w.prizeDescription.includes('$')) currency = '$';
                        else if (w.prizeDescription.includes('€')) currency = '€';
                     }
                  }

                  return (
                    <div key={i} className="relative overflow-hidden bg-slate-900 border border-slate-700/50 p-2 rounded-lg flex items-stretch gap-3 group hover:border-amber-500/50 transition-all duration-300 shadow-sm">
                       <div className="w-[4.5rem] bg-gradient-to-b from-amber-400 to-amber-600 rounded flex flex-col items-center justify-center text-slate-900 shadow-inner shrink-0 relative overflow-hidden">
                          <div className="absolute top-0 inset-x-0 h-[1px] bg-white/40"></div>
                          <span className="text-[8px] font-black uppercase text-amber-900/60 tracking-tighter mb-0 leading-none">PREMIO</span>
                          <div className="flex items-start justify-center gap-0.5 leading-none mt-0.5">
                             <span className="text-[9px] font-bold pt-0.5 opacity-70">{currency}</span>
                             <span className={`font-black tracking-tighter ${amountDisplay.length > 3 ? 'text-lg' : 'text-2xl'}`}>{amountDisplay}</span>
                          </div>
                       </div>
                       <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div className="flex justify-between items-start">
                             <h4 className={`text-sm font-bold text-white truncate pr-2 leading-tight ${hideParticipants ? "blur-md select-none" : ""}`}>
                                {w.participantName}
                             </h4>
                             <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap shrink-0">
                                {new Date(w.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                             <div className="flex items-center gap-1.5 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                <Ticket size={10} className="text-slate-500" />
                                <span className="text-[10px] text-slate-400">
                                   Cartón: <strong className="text-emerald-400 font-mono">{w.cardId}</strong>
                                </span>
                             </div>
                             {w.winningNumber && (
                               <div className="flex items-center gap-1.5 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                  <div className="w-3 h-3 rounded-full bg-amber-500 flex items-center justify-center text-[8px] text-slate-900 font-bold">
                                    {w.winningNumber}
                                  </div>
                                  <span className="text-[10px] text-slate-400">Bolilla</span>
                               </div>
                             )}
                          </div>
                       </div>
                       <button 
                          onClick={() => handleViewWinner(w)}
                          className="self-center flex-shrink-0 w-7 h-7 flex items-center justify-center rounded bg-slate-800 text-slate-400 hover:bg-cyan-900/50 hover:text-cyan-400 transition-colors border border-slate-700"
                          title="Ver detalles"
                       >
                          <Eye size={14} />
                       </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
          {filteredParticipants.map(p => {
             const isExpanded = expandedStates[p.id] !== undefined ? expandedStates[p.id] : showCardsGlobal;
             const isEditing = editingId === p.id;
             
             return (
              <div 
                key={p.id} 
                className="relative bg-slate-900 rounded-xl border border-slate-800 hover:border-cyan-500/30 transition-all duration-300 shadow-sm group flex flex-col overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-slate-700 to-slate-800 group-hover:from-cyan-500 group-hover:to-blue-600 transition-colors duration-300"></div>

                <div className="p-3 pl-5 flex items-start gap-3 relative">
                  
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-md border border-slate-800 shadow-inner">
                     <Ticket size={12} className="text-emerald-500" />
                     <span className="text-xs font-bold text-emerald-400 font-mono">{p.cards.length}</span>
                  </div>

                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700 group-hover:border-cyan-500/50 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0 transition-colors z-10">
                    {String(p.name || '?').charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-10">
                    {isEditing ? (
                      <div className="space-y-2 animate-in fade-in duration-200">
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            value={editForm.name} 
                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] text-white w-full focus:border-cyan-500 outline-none"
                            placeholder="Nombre"
                          />
                          <input 
                            value={editForm.surname} 
                            onChange={e => setEditForm({...editForm, surname: e.target.value})}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] text-white w-full focus:border-cyan-500 outline-none"
                            placeholder="Apellido"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           <input 
                            value={editForm.dni} 
                            onChange={e => setEditForm({...editForm, dni: e.target.value})}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] text-white w-full focus:border-cyan-500 outline-none"
                            placeholder="DNI"
                          />
                           <input 
                            value={editForm.phone} 
                            onChange={e => setEditForm({...editForm, phone: e.target.value})}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[10px] text-white w-full focus:border-cyan-500 outline-none"
                            placeholder="Teléfono"
                          />
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                          <button onClick={saveEdit} className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-colors shadow-lg shadow-emerald-900/20">
                            <Save size={10} /> Guardar
                          </button>
                          <button onClick={cancelEdit} className="flex items-center gap-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold transition-colors">
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col justify-center h-full gap-1.5">
                        <h3 
                          className={`text-sm font-bold text-white truncate leading-tight ${hideParticipants ? 'blur-sm select-none' : ''}`}
                          title={`${p.name} ${p.surname}`}
                        >
                          {p.name} {p.surname}
                        </h3>
                        
                        <div className={`flex flex-wrap gap-2 ${hideParticipants ? 'blur-sm select-none' : ''}`}>
                          <span className="flex items-center gap-1.5 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[9px] text-slate-400 font-medium" title="DNI">
                            <Fingerprint size={10} className="text-slate-500"/> 
                            {p.dni}
                          </span>
                          {p.phone && (
                            <span className="flex items-center gap-1.5 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[9px] text-slate-400 font-medium" title="Teléfono">
                              <Phone size={10} className="text-slate-500"/> 
                              {p.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {!isEditing && (
                  <div className="bg-slate-950/30 border-t border-slate-800 pl-5 pr-3 py-1.5 flex items-center justify-between gap-2">
                    
                    <button 
                      onClick={() => toggleIndividualCard(p.id)}
                      className={`
                        flex-1 text-[10px] font-medium px-2 py-1.5 rounded transition-all flex items-center justify-center gap-1
                        ${isExpanded 
                          ? 'text-cyan-400 bg-cyan-950/20 border border-cyan-900/30' 
                          : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                        }
                      `}
                      title={isExpanded ? "Ocultar cartones" : "Ver cartones"}
                    >
                      {isExpanded ? "Ocultar" : "Ver Cartones"}
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    <div className="h-4 w-px bg-slate-800 mx-1"></div>

                    <div className="flex items-center gap-1">
                       {p.phone && p.cards.length > 0 && (
                          <button 
                            onClick={() => onShareAllCards && onShareAllCards(p)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/30 rounded-md transition-colors"
                            title="Compartir Todo"
                          >
                            <FileText size={14} />
                          </button>
                       )}

                       <button 
                        onClick={() => setViewingParticipantId(p.id)}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/30 rounded-md transition-colors"
                        title="Ver Detalles"
                      >
                        <ScanEye size={14} />
                      </button>

                      <button 
                        onClick={() => startEdit(p)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-950/30 rounded-md transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      
                      <button 
                        onClick={() => onDeleteParticipant(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-md transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>

                      <div className="w-px h-4 bg-slate-800 mx-1"></div>

                      <button 
                        onClick={async () => {
                           const confirm = await showConfirm({ 
                               title: 'Cartón Extra', 
                               message: `¿Estás seguro de añadir un cartón extra a ${p.name} ${p.surname}?`,
                               type: 'confirm',
                               confirmText: 'Sí, añadir'
                           });
                           if (confirm) {
                              onAddCard(p.id);
                           }
                        }}
                        className="flex items-center gap-1 pl-1.5 pr-2 py-1 rounded bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 hover:text-emerald-400 border border-emerald-500/20 transition-all shadow-sm"
                        title="Agregar cartón extra"
                      >
                        <Ticket size={12} /> 
                        <span className="text-[10px] font-bold">+1</span>
                      </button>
                    </div>
                  </div>
                )}
                
                {isExpanded && (
                  <div className="p-3 grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200 border-t border-slate-800 bg-slate-950/50 shadow-inner">
                    {p.cards.map(card => (
                      <BingoCard 
                        key={card.id}
                        card={card}
                        drawnBalls={drawnBalls}
                        onDelete={(cid) => onDeleteCard(p.id, cid)}
                        onDownload={(cid) => onDownloadCard(p, cid)}
                        onShare={onShareCard ? (cid) => onShareCard(p, cid) : undefined}
                        hasPhone={!!p.phone}
                        isCompact={true}
                        currentPattern={currentPattern}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          
          {filteredParticipants.length === 0 && (
            <div className="text-center text-slate-600 py-10 italic text-xs flex flex-col items-center gap-2">
              <Users size={24} className="opacity-20" />
              <p>No se encontraron participantes</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ParticipantsPanel;
