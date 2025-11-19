
import React, { useState } from 'react';
import { Search, Users, Medal, Ticket, Edit2, Trash2, Save, X, Eye, EyeOff, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { Participant, Winner, BingoCard as BingoCardType, PatternKey } from '../types.ts';
import BingoCard from './BingoCard.tsx';
import WinnerDetailsModal from './WinnerDetailsModal.tsx';

interface Props {
  participants: Participant[];
  drawnBalls: number[];
  winners: Winner[];
  onAddCard: (participantId: string) => void;
  onDeleteCard: (participantId: string, cardId: string) => void;
  onDownloadCard: (participant: Participant, cardId: string) => void;
  onEditParticipant: (id: string, data: { name: string, surname: string, dni: string, phone: string }) => void;
  onDeleteParticipant: (id: string) => void;
  currentPattern: PatternKey;
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
  currentPattern
}) => {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', surname: '', dni: '', phone: '' });
  const [hideParticipants, setHideParticipants] = useState(false);
  
  // Global visibility state
  const [showCardsGlobal, setShowCardsGlobal] = useState(true);
  // Individual visibility overrides (id -> boolean)
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>({});
  
  // State to control the details modal
  const [viewingWinnerData, setViewingWinnerData] = useState<{
    winner: Winner;
    participant: Participant;
    card: BingoCardType;
  } | null>(null);

  // Defensive filtering: convert fields to String before checking to prevent crashes if data is null/number
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
      const card = participant.cards.find(c => c.id === winner.cardId);
      if (card) {
        setViewingWinnerData({ winner, participant, card });
      } else {
        alert("El cartón ganador parece haber sido eliminado.");
      }
    } else {
      alert("El participante parece haber sido eliminado.");
    }
  };

  const toggleGlobalCards = () => {
    // When toggling global, we clear individual overrides to "reset" the view to uniform
    setShowCardsGlobal(!showCardsGlobal);
    setExpandedStates({});
  };

  const toggleIndividualCard = (id: string) => {
    setExpandedStates(prev => {
      // If currently undefined, it follows global. We want to invert that.
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
        />
      )}

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm flex flex-col h-full">
        <div className="flex flex-col gap-4 mb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="text-emerald-500" size={24} />
                Participantes
                <span className="ml-2 text-sm font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  {participants.length}
                </span>
              </h2>
              
              <div className="flex gap-1 ml-2">
                <button
                  onClick={toggleGlobalCards}
                  className={`p-1.5 rounded-lg transition-colors border border-slate-700 ${showCardsGlobal ? 'bg-slate-800 text-slate-400 hover:text-cyan-400' : 'bg-cyan-900/30 text-cyan-400 border-cyan-800'}`}
                  title={showCardsGlobal ? "Ocultar TODOS los cartones" : "Mostrar TODOS los cartones"}
                >
                  <CreditCard size={16} />
                </button>
                <button
                  onClick={() => setHideParticipants(!hideParticipants)}
                  className={`p-1.5 rounded-lg transition-colors border border-slate-700 ${hideParticipants ? 'bg-cyan-900/30 text-cyan-400 border-cyan-800' : 'bg-slate-800 text-slate-400 hover:text-cyan-400'}`}
                  title={hideParticipants ? "Mostrar nombres" : "Ocultar nombres (Privacidad)"}
                >
                  {hideParticipants ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Winners Section */}
          {winners.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 animate-in slide-in-from-top-2">
              <h3 className="text-amber-400 text-sm font-bold flex items-center gap-2 mb-2">
                <Medal size={16} /> GANADORES ({winners.length})
              </h3>
              <div className="max-h-24 overflow-y-auto custom-scrollbar space-y-1">
                {winners.map((w, i) => (
                  <div key={i} className="text-xs text-amber-100 bg-amber-900/40 px-2 py-1 rounded flex justify-between items-center group">
                    <span className={hideParticipants ? "blur-sm select-none" : ""}>{w.participantName}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono opacity-70">{w.cardId}</span>
                      <button 
                        onClick={() => handleViewWinner(w)}
                        className="text-amber-400 hover:text-white hover:bg-amber-500/40 p-1 rounded transition-colors"
                        title="Ver detalles"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre o DNI..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {filteredParticipants.map(p => {
             // Determine visibility: Override exists ? use Override : use Global
             const isExpanded = expandedStates[p.id] !== undefined ? expandedStates[p.id] : showCardsGlobal;
             
             return (
              <div key={p.id} className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50 hover:border-slate-700 transition-colors group">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-900/20 flex-shrink-0">
                    {String(p.name || '?').charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {editingId === p.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            value={editForm.name} 
                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full"
                            placeholder="Nombre"
                          />
                          <input 
                            value={editForm.surname} 
                            onChange={e => setEditForm({...editForm, surname: e.target.value})}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full"
                            placeholder="Apellido"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            value={editForm.dni} 
                            onChange={e => setEditForm({...editForm, dni: e.target.value})}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full"
                            placeholder="DNI"
                          />
                          <input 
                            value={editForm.phone} 
                            onChange={e => setEditForm({...editForm, phone: e.target.value})}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full"
                            placeholder="Teléfono"
                          />
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                          <button onClick={saveEdit} className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs transition-colors">
                            <Save size={12} /> Guardar
                          </button>
                          <button onClick={cancelEdit} className="flex items-center gap-1 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs transition-colors">
                            <X size={12} /> Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 
                            className={`font-semibold text-slate-200 truncate group-hover:text-cyan-400 transition-colors ${hideParticipants ? 'blur-sm select-none' : ''}`}
                            title={`${p.name} ${p.surname}`}
                          >
                            {p.name} {p.surname}
                          </h3>
                          <p className={`text-xs text-slate-500 truncate ${hideParticipants ? 'blur-sm select-none' : ''}`}>
                            DNI: {p.dni} {p.phone && `• ${p.phone}`}
                          </p>
                        </div>
                        
                        <div className="flex gap-1 items-start flex-shrink-0">
                           <button 
                            onClick={() => toggleIndividualCard(p.id)}
                            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition-colors mr-1"
                            title={isExpanded ? "Ocultar cartones" : "Mostrar cartones"}
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>

                          <button 
                            onClick={() => startEdit(p)}
                            className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-cyan-950/30 rounded transition-colors"
                            title="Editar datos"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => onDeleteParticipant(p.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors"
                            title="Eliminar participante"
                          >
                            <Trash2 size={14} />
                          </button>
                          <button 
                            onClick={() => onAddCard(p.id)}
                            className="ml-1 text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 px-2 py-1.5 rounded border border-slate-700 transition-colors flex items-center gap-1"
                            title="Agregar cartón extra"
                          >
                            <Ticket size={12} /> +1
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {isExpanded ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in slide-in-from-top-1 duration-200">
                    {p.cards.map(card => (
                      <BingoCard 
                        key={card.id}
                        card={card}
                        drawnBalls={drawnBalls}
                        onDelete={(cid) => onDeleteCard(p.id, cid)}
                        onDownload={(cid) => onDownloadCard(p, cid)}
                        isCompact
                        currentPattern={currentPattern}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="pl-[52px] flex items-center gap-2 animate-in fade-in duration-200">
                    <button 
                      onClick={() => toggleIndividualCard(p.id)}
                      className="text-xs text-slate-500 bg-slate-900/50 hover:bg-slate-800 hover:text-slate-300 px-2 py-1 rounded border border-slate-800 inline-flex items-center gap-2 transition-all"
                      title="Click para desplegar"
                    >
                      <Ticket size={12} />
                      {p.cards.length} cartón{p.cards.length !== 1 ? 'es' : ''} oculto{p.cards.length !== 1 ? 's' : ''}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          
          {filteredParticipants.length === 0 && (
            <div className="text-center text-slate-600 py-10 italic text-sm">
              No se encontraron participantes
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ParticipantsPanel;
