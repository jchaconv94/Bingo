import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Ticket, Phone, CreditCard, Trash2, Edit2, Plus, Hash, Fingerprint, Save, XCircle, MessageCircle, FileText } from 'lucide-react';
import { Participant, PatternKey } from '../types.ts';
import BingoCard from './BingoCard.tsx';
import { useAlert } from '../contexts/AlertContext.tsx';

interface Props {
  participant: Participant;
  drawnBalls: number[];
  onClose: () => void;
  currentPattern: PatternKey;
  onAddCard: () => void;
  onSave: (data: { name: string, surname: string, dni: string, phone: string }) => void;
  onDelete: () => void;
  onDeleteCard: (participantId: string, cardId: string) => void;
  onDownloadCard: (participant: Participant, cardId: string) => void;
  onShareCard?: (cardId: string) => void;
  onShareAllCards?: () => void;
}

const ParticipantDetailsModal: React.FC<Props> = ({ 
  participant, 
  drawnBalls, 
  onClose, 
  currentPattern,
  onAddCard,
  onSave,
  onDelete,
  onDeleteCard,
  onDownloadCard,
  onShareCard,
  onShareAllCards
}) => {
  const { showConfirm } = useAlert();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: participant.name,
    surname: participant.surname,
    dni: participant.dni,
    phone: participant.phone || ''
  });

  useEffect(() => {
    setFormData({
      name: participant.name,
      surname: participant.surname,
      dni: participant.dni,
      phone: participant.phone || ''
    });
  }, [participant]);

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: participant.name,
      surname: participant.surname,
      dni: participant.dni,
      phone: participant.phone || ''
    });
    setIsEditing(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border-x-0 sm:border-x border-y-0 sm:border-y border-slate-700 rounded-none sm:rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[90vh]">
        
        <div className="bg-slate-950/50 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <User className="text-cyan-500" size={20} />
            {isEditing ? 'Editando Participante' : 'Gestión de Participante'}
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-3 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
           
           <div className={`bg-gradient-to-br rounded-xl sm:rounded-2xl border overflow-hidden mb-4 sm:mb-6 relative transition-colors duration-300 ${isEditing ? 'from-slate-900 to-slate-950 border-cyan-500/30' : 'from-slate-800 to-slate-900 border-slate-700'}`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

              <div className="flex flex-col lg:flex-row">
                
                <div className="p-4 sm:p-6 flex items-center gap-4 sm:gap-5 lg:border-r border-slate-700/50 flex-1 relative z-10">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-3xl sm:text-4xl shadow-lg shadow-cyan-900/30 flex-shrink-0">
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                       {isEditing ? (
                         <div className="space-y-2">
                            <div>
                               <label className="text-[10px] text-cyan-500 font-bold uppercase">Nombre</label>
                               <input 
                                 value={formData.name}
                                 onChange={e => setFormData({...formData, name: e.target.value})}
                                 className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-lg font-bold focus:border-cyan-500 outline-none"
                               />
                            </div>
                            <div>
                               <label className="text-[10px] text-cyan-500 font-bold uppercase">Apellidos</label>
                               <input 
                                 value={formData.surname}
                                 onChange={e => setFormData({...formData, surname: e.target.value})}
                                 className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-light focus:border-cyan-500 outline-none"
                               />
                            </div>
                         </div>
                       ) : (
                         <>
                           <h3 className="text-2xl font-bold text-white truncate leading-tight">{participant.name}</h3>
                           <div className="text-xl text-slate-300 font-light truncate mb-1">{participant.surname}</div>
                           <span className="inline-flex items-center gap-1 bg-slate-950/50 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 border border-slate-800">
                               ID: {participant.id}
                           </span>
                         </>
                       )}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:flex md:flex-row lg:w-auto bg-slate-950/30 lg:bg-transparent border-t lg:border-t-0 border-slate-700/50">
                    <div className="col-span-1 flex-1 md:w-40 p-3 sm:p-4 lg:p-6 flex flex-col justify-center items-center lg:items-start border-r lg:border-r-0 border-slate-700/50 relative group">
                       <div className="hidden lg:block absolute left-0 top-4 bottom-4 w-px bg-slate-700/50"></div>
                       <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">
                          <Fingerprint size={12} className="sm:w-3.5 sm:h-3.5" /> DNI
                       </div>
                       {isEditing ? (
                          <input 
                            value={formData.dni}
                            onChange={e => setFormData({...formData, dni: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono text-center lg:text-left focus:border-cyan-500 outline-none text-sm sm:text-base"
                          />
                       ) : (
                          <div className="text-sm sm:text-lg lg:text-xl font-mono text-white font-medium break-all text-center lg:text-left truncate w-full">{participant.dni}</div>
                       )}
                    </div>

                    <div className="col-span-1 flex-1 md:w-44 p-3 sm:p-4 lg:p-6 flex flex-col justify-center items-center border-r-0 md:border-r lg:border-r-0 border-slate-700/50 relative">
                       <div className="hidden lg:block absolute left-0 top-4 bottom-4 w-px bg-slate-700/50"></div>
                       <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mb-1 font-bold">
                          <Phone size={12} className="sm:w-3.5 sm:h-3.5" /> Teléfono
                       </div>
                       {isEditing ? (
                          <input 
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono text-center focus:border-cyan-500 outline-none text-sm sm:text-base"
                          />
                       ) : (
                          <div className="text-sm sm:text-lg lg:text-xl font-mono text-white font-medium break-all text-center truncate w-full">
                             {participant.phone || <span className="text-slate-600 text-sm sm:text-base">---</span>}
                          </div>
                       )}
                    </div>

                    <div className="col-span-2 md:col-span-1 flex-1 md:w-40 p-3 sm:p-4 lg:p-6 flex flex-col justify-center items-center bg-emerald-900/10 relative border-t md:border-t-0 border-slate-700/50">
                       <div className="hidden lg:block absolute left-0 top-4 bottom-4 w-px bg-slate-700/50"></div>
                       <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-emerald-400/80 uppercase tracking-wider mb-1 font-bold">
                          <Ticket size={12} className="sm:w-3.5 sm:h-3.5" /> Cartones
                       </div>
                       <div className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-400">{participant.cards.length}</div>
                    </div>
                </div>
              </div>
           </div>

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <button 
                  onClick={handleSave}
                  className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-500 rounded-xl py-2.5 sm:py-3 transition-all shadow-lg shadow-cyan-900/20"
                >
                  <Save size={18} className="sm:w-5 sm:h-5" />
                  <span className="font-bold text-sm">Guardar Cambios</span>
                </button>

                <button 
                  onClick={handleCancel}
                  className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl py-2.5 sm:py-3 transition-all"
                >
                  <XCircle size={18} className="sm:w-5 sm:h-5" />
                  <span className="font-bold text-sm">Cancelar</span>
                </button>
              </div>
           ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <button 
                    onClick={async () => {
                      const confirm = await showConfirm({ 
                          title: 'Agregar Cartón',
                          message: `¿Estás seguro de añadir un cartón extra a ${participant.name} ${participant.surname}?`,
                          confirmText: 'Sí, añadir'
                      });
                      if (confirm) {
                        onAddCard();
                      }
                    }}
                    className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 hover:border-emerald-500/30 rounded-xl py-2.5 sm:py-3 transition-all group shadow-lg shadow-black/20"
                  >
                    <div className="bg-emerald-500/10 p-1.5 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                      <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </div>
                    <span className="font-bold text-sm">Agregar Cartón</span>
                  </button>

                  {participant.phone && participant.cards.length > 0 && onShareAllCards && (
                     <button 
                        onClick={onShareAllCards}
                        className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-emerald-950/50 text-emerald-500 border border-slate-700 hover:border-emerald-500/30 rounded-xl py-2.5 sm:py-3 transition-all group shadow-lg shadow-black/20"
                     >
                        <div className="bg-emerald-500/10 p-1.5 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                           <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </div>
                        <span className="font-bold text-sm">Enviar PDF</span>
                     </button>
                  )}

                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 hover:border-cyan-500/30 rounded-xl py-2.5 sm:py-3 transition-all group shadow-lg shadow-black/20"
                  >
                    <div className="bg-cyan-500/10 p-1.5 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                      <Edit2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </div>
                    <span className="font-bold text-sm">Editar Datos</span>
                  </button>

                  <button 
                    onClick={onDelete}
                    className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 hover:border-rose-500/30 rounded-xl py-2.5 sm:py-3 transition-all group shadow-lg shadow-black/20"
                  >
                    <div className="bg-rose-500/10 p-1.5 rounded-lg group-hover:bg-rose-500/20 transition-colors">
                      <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                    </div>
                    <span className="font-bold text-sm">Eliminar</span>
                  </button>
              </div>
           )}

           <div>
             <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-1 sm:gap-4">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="text-emerald-500" size={18} />
                  Cartones Asignados
                </h3>
                <span className="text-[10px] sm:text-xs text-slate-500">
                   Progreso actual según patrón
                </span>
             </div>
             {participant.cards.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                   {participant.cards.map(card => (
                      <div key={card.id} className="transform transition-transform hover:scale-[1.02] duration-300"> 
                         <BingoCard 
                            card={card}
                            drawnBalls={drawnBalls}
                            onDelete={(cid) => onDeleteCard(participant.id, cid)}
                            onDownload={(cid) => onDownloadCard(participant, cid)}
                            onShare={onShareCard}
                            hasPhone={!!participant.phone}
                            isCompact={true}
                            currentPattern={currentPattern}
                            readOnly={false}
                            isRetired={card.isRetired}
                         />
                      </div>
                   ))}
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
                   <Ticket size={48} className="mb-4 opacity-20" />
                   <p>Este participante no tiene cartones asignados.</p>
                   <button 
                    onClick={async () => {
                        const confirm = await showConfirm({ 
                            title: 'Agregar Cartón',
                            message: `¿Estás seguro de añadir un cartón extra a ${participant.name} ${participant.surname}?`,
                            confirmText: 'Sí, añadir'
                        });
                        if (confirm) {
                          onAddCard();
                        }
                    }} 
                    className="mt-4 text-emerald-500 hover:text-emerald-400 text-sm font-medium underline"
                   >
                      Asignar un cartón ahora
                   </button>
                </div>
             )}
           </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ParticipantDetailsModal;