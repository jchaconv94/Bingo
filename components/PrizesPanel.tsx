import React, { useState, useRef } from 'react';
import { Gift, Plus, Trash2, CheckCircle, Circle, DollarSign, Edit2, Save, X, Minus } from 'lucide-react';
import { Prize } from '../types.ts';
import { useAlert } from '../contexts/AlertContext.tsx';

interface Props {
  prizes: Prize[];
  onAddPrize: (name: string, description: string) => void;
  onRemovePrize: (id: string) => void;
  onEditPrize: (id: string, name: string, description: string) => void;
  onTogglePrize: (id: string) => void;
  onClose: () => void;
}

const PrizesPanel: React.FC<Props> = ({ prizes, onAddPrize, onRemovePrize, onEditPrize, onTogglePrize, onClose }) => {
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const nameInputRef = useRef<HTMLInputElement>(null); 

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  const getNextName = () => `Premio ${String(prizes.length + 1).padStart(2, '0')}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description) return;

    const nameToUse = formData.name.trim() || getNextName();
    
    if (prizes.some(p => p.name.toLowerCase() === nameToUse.toLowerCase())) {
      await showAlert({ title: 'Nombre Duplicado', message: "Ya existe un premio con ese nombre.", type: 'warning' });
      return;
    }

    const amountValue = parseFloat(formData.description);
    
    if (isNaN(amountValue)) return;

    if (amountValue < 1 || amountValue > 10000) {
      await showAlert({ title: 'Monto Inválido', message: "El monto del premio debe estar entre 1 y 10,000", type: 'warning' });
      return;
    }

    const formattedDescription = `S/.${amountValue.toFixed(2)}`;
    
    onAddPrize(nameToUse, formattedDescription);
    setFormData({ name: '', description: '' });
    
    setTimeout(() => {
        nameInputRef.current?.focus();
    }, 0);
  };

  const startEdit = (prize: Prize) => {
    setEditingId(prize.id);
    setEditForm({ name: prize.name, description: prize.description });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', description: '' });
  };

  const saveEdit = async () => {
    if (editingId && editForm.description) {
      if (prizes.some(p => p.id !== editingId && p.name.toLowerCase() === editForm.name.toLowerCase())) {
        await showAlert({ title: 'Nombre Duplicado', message: "Ya existe otro premio con ese nombre.", type: 'warning' });
        return;
      }
      onEditPrize(editingId, editForm.name, editForm.description);
      setEditingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 shrink-0 relative overflow-hidden h-full sm:max-h-[90vh]">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

      <div className="flex items-center justify-between pb-4 sm:pb-5 border-b border-slate-800/60 relative z-10 gap-2 shrink-0">
        <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400 shadow-lg shadow-amber-900/10">
            <Gift size={20} />
          </div>
          PREMIOS
        </h2>
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="flex flex-col items-end">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-wider">Pendientes</span>
            <span className="text-md sm:text-xl font-black text-amber-500 leading-none">{prizes.filter(p => !p.isAwarded).length}</span>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors border border-slate-700/50 shadow-sm">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden relative z-10">
        {/* Left Column: Form */}
        <div className="flex flex-col gap-4">
          <div className="relative z-10 shrink-0">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent rounded-2xl pointer-events-none"></div>
            <form onSubmit={handleSubmit} className="relative bg-slate-900/50 p-5 rounded-2xl border border-slate-800/80 shadow-inner space-y-4">
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Nombre del Premio</label>
                <div className="relative group/input">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-amber-400 transition-colors">
                    <Gift size={18} />
                  </div>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all shadow-sm placeholder-slate-700"
                    placeholder={getNextName()}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Valor del Premio (S/.)</label>
                <div className="flex items-center justify-between gap-4 bg-slate-950 p-2 rounded-xl border border-slate-800 shadow-inner">
                  <button
                    type="button"
                    onClick={() => {
                      const current = parseFloat(formData.description) || 0;
                      setFormData({ ...formData, description: (current >= 10 ? current - 10 : 0).toString() });
                    }}
                    className="w-12 h-12 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 shadow-sm"
                  >
                    <Minus size={20} />
                  </button>
                  
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    step="10"
                    required
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="flex-1 bg-transparent text-white font-black text-3xl text-center border-none focus:ring-0 p-0 h-auto placeholder-slate-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const current = parseFloat(formData.description) || 0;
                      setFormData({ ...formData, description: (current + 10).toString() });
                    }}
                    className="w-12 h-12 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 flex items-center justify-center text-emerald-500 hover:text-emerald-400 transition-all active:scale-95 shadow-sm"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black tracking-wide py-4 rounded-xl transition-all shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98]"
              >
                <Plus size={22} strokeWidth={3} />
                AÑADIR PREMIO
              </button>
            </form>
          </div>
          
          <div className="hidden lg:flex flex-col gap-2 p-5 bg-slate-900/30 border border-slate-800/50 rounded-2xl mt-2">
             <div className="flex items-center gap-2 text-cyan-400">
                <Gift size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Sugerencia</span>
             </div>
             <p className="text-[11px] text-slate-400 italic">"Define premios atractivos para incentivar la participación y hacer el juego más emocionante."</p>
          </div>
        </div>

        {/* Right Column: List */}
        <div className="flex flex-col overflow-hidden bg-slate-900/40 border border-slate-800/60 rounded-2xl">
          <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/30 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lista de Premios</span>
            <span className="text-[10px] text-slate-600 italic">Total: {prizes.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {prizes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-700/50">
                  <Gift className="text-slate-600" size={24} />
                </div>
                <p className="text-sm font-bold text-slate-400">No hay premios registrados</p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[180px]">Agrega el primer premio usando el formulario de la izquierda</p>
              </div>
            )}
            
            {prizes.map(prize => {
              const isEditing = editingId === prize.id;

              return (
                <div 
                  key={prize.id} 
                  className={`
                    relative overflow-hidden flex items-center justify-between p-3.5 rounded-xl border transition-all group
                    ${prize.isAwarded 
                      ? 'bg-slate-950/40 border-slate-800/30 opacity-60' 
                      : 'bg-slate-800/40 border-slate-700/50 hover:border-amber-500/30 hover:bg-slate-800/80 hover:shadow-xl hover:shadow-black/20'
                    }
                  `}
                >
                  {/* Highlight bar */}
                  {!prize.isAwarded && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-orange-500 rounded-l-xl opacity-70"></div>
                  )}

                  {isEditing ? (
                    <div className="flex-1 flex flex-col gap-3 animate-in fade-in slide-in-from-left-2 duration-200 pl-2">
                      <input 
                        value={editForm.name}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 font-bold"
                        placeholder="Nombre"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                          <input 
                            type="number"
                            step="1"
                            value={editForm.description}
                            onChange={e => setEditForm({...editForm, description: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 font-black"
                            placeholder="Valor"
                          />
                        </div>
                        <button 
                          onClick={saveEdit}
                          className="p-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors border border-emerald-500/20"
                          title="Guardar"
                        >
                          <Save size={18} />
                        </button>
                        <button 
                          onClick={cancelEdit}
                          className="p-2 bg-slate-700 text-slate-300 hover:bg-slate-600 rounded-lg transition-colors border border-slate-600"
                          title="Cancelar"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4 pl-2">
                        <button
                          onClick={() => onTogglePrize(prize.id)}
                          className={`
                            w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0
                            ${prize.isAwarded 
                              ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' 
                              : 'bg-slate-950 border border-slate-700 text-slate-600 hover:border-amber-500/50 hover:text-amber-500'
                            }
                          `}
                          title={prize.isAwarded ? "Marcar como pendiente" : "Marcar como entregado"}
                        >
                          {prize.isAwarded ? <CheckCircle size={14} /> : <Circle size={14} />}
                        </button>
                        <div className="flex flex-col">
                          <span className={`font-bold text-xs sm:text-sm ${prize.isAwarded ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                            {prize.name}
                          </span>
                          <span className={`text-sm sm:text-base font-black mt-0.5 ${prize.isAwarded ? 'text-slate-600' : 'text-emerald-400'}`}>
                            {prize.description}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => startEdit(prize)}
                          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => onRemovePrize(prize.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrizesPanel;