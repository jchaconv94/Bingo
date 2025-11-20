import React, { useState, useRef } from 'react';
import { Gift, Plus, Trash2, CheckCircle, Circle, DollarSign, Edit2, Save, X } from 'lucide-react';
import { Prize } from '../types.ts';
import { useAlert } from '../contexts/AlertContext.tsx';

interface Props {
  prizes: Prize[];
  onAddPrize: (name: string, description: string) => void;
  onRemovePrize: (id: string) => void;
  onEditPrize: (id: string, name: string, description: string) => void;
  onTogglePrize: (id: string) => void;
}

const PrizesPanel: React.FC<Props> = ({ prizes, onAddPrize, onRemovePrize, onEditPrize, onTogglePrize }) => {
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

  const saveEdit = () => {
    if (editingId && editForm.description) {
      onEditPrize(editingId, editForm.name, editForm.description);
      setEditingId(null);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-sm flex flex-col gap-4 shrink-0">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Gift className="text-amber-500" size={20} />
          Premios
        </h2>
        <span className="text-xs font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
          {prizes.filter(p => !p.isAwarded).length} Pendientes
        </span>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 space-y-3">
        <div>
          <input
            ref={nameInputRef}
            type="text"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none placeholder-slate-600"
            placeholder={getNextName()}
          />
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
             <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
             <input
              type="number"
              min="1"
              max="10000"
              step="0.01"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-6 pr-3 py-2 text-sm text-white focus:border-amber-500 outline-none placeholder-slate-600 font-mono"
              placeholder="0.00"
              required
            />
          </div>
          <button 
            type="submit"
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-3 rounded-lg transition-all shadow-lg shadow-amber-900/20"
            title="Agregar Premio"
          >
            <Plus size={20} />
          </button>
        </div>
      </form>

      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
        {prizes.length === 0 && (
          <div className="text-center text-xs text-slate-600 py-4 italic border border-dashed border-slate-800 rounded-lg">
            No hay premios registrados
          </div>
        )}
        
        {prizes.map(prize => {
          const isEditing = editingId === prize.id;

          return (
            <div 
              key={prize.id} 
              className={`
                flex items-center justify-between p-2 rounded-lg border transition-all group
                ${prize.isAwarded 
                  ? 'bg-slate-800/30 border-slate-800 opacity-60' 
                  : 'bg-slate-800/80 border-slate-700 hover:border-slate-600 hover:shadow-md'
                }
              `}
            >
              {isEditing ? (
                <div className="flex-1 flex flex-col gap-2 animate-in fade-in duration-200">
                  <input 
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white outline-none focus:border-cyan-500"
                    placeholder="Nombre"
                  />
                  <div className="flex gap-2">
                    <input 
                      value={editForm.description}
                      onChange={e => setEditForm({...editForm, description: e.target.value})}
                      className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white outline-none focus:border-cyan-500 flex-1"
                      placeholder="Desc"
                    />
                    <button onClick={saveEdit} className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 rounded">
                      <Save size={12} />
                    </button>
                    <button onClick={cancelEdit} className="bg-slate-700 hover:bg-slate-600 text-white px-2 rounded">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <button 
                      onClick={() => onTogglePrize(prize.id)}
                      className={`flex-shrink-0 transition-colors p-1 rounded-full bg-slate-900/50 ${prize.isAwarded ? 'text-emerald-500' : 'text-slate-600 hover:text-emerald-500'}`}
                      title={prize.isAwarded ? "Marcar como pendiente" : "Marcar como entregado"}
                    >
                      {prize.isAwarded ? <CheckCircle size={16} /> : <Circle size={16} />}
                    </button>
                    
                    <div className="flex flex-col min-w-0">
                      <span className={`text-xs font-bold truncate ${prize.isAwarded ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {prize.name}
                      </span>
                      <span className={`text-[11px] truncate ${prize.isAwarded ? 'text-slate-600' : 'text-amber-400 font-mono'}`}>
                        {prize.description}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => startEdit(prize)}
                      className="text-slate-500 hover:text-cyan-400 p-1.5 rounded hover:bg-slate-700/50 transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => onRemovePrize(prize.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded hover:bg-slate-700/50 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PrizesPanel;