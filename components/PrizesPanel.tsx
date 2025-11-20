
import React, { useState } from 'react';
import { Gift, Plus, Trash2, CheckCircle, Circle, DollarSign, Edit2, Save, X } from 'lucide-react';
import { Prize } from '../types.ts';

interface Props {
  prizes: Prize[];
  onAddPrize: (name: string, description: string) => void;
  onRemovePrize: (id: string) => void;
  onEditPrize: (id: string, name: string, description: string) => void;
  onTogglePrize: (id: string) => void;
}

const PrizesPanel: React.FC<Props> = ({ prizes, onAddPrize, onRemovePrize, onEditPrize, onTogglePrize }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Estado para controlar qué premio se está editando
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  // Auto-sugerir nombre basado en la cantidad actual
  const getNextName = () => `Premio ${String(prizes.length + 1).padStart(2, '0')}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description) return;

    // Si el nombre está vacío, usar el sugerido
    const nameToUse = formData.name.trim() || getNextName();
    
    // Formatear el monto a S/.0.00
    const amountValue = parseFloat(formData.description);
    
    // Validación simple para asegurar que es un número válido
    if (isNaN(amountValue)) return;

    // Validación de rango: 1 a 10000
    if (amountValue < 1 || amountValue > 10000) {
      alert("El monto del premio debe estar entre 1 y 10,000");
      return;
    }

    const formattedDescription = `S/.${amountValue.toFixed(2)}`;
    
    onAddPrize(nameToUse, formattedDescription);
    setFormData({ name: '', description: '' });
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
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 shadow-xl backdrop-blur-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm 2xl:text-[20px] font-bold text-white flex items-center gap-2">
          <Gift className="text-amber-500 w-4 h-4 2xl:w-6 2xl:h-6" />
          Premios
        </h2>
        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full border border-slate-700">
          {prizes.filter(p => !p.isAwarded).length}
        </span>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-slate-950/50 p-2 rounded border border-slate-800/50 space-y-1.5">
        <div>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-white focus:border-amber-500 outline-none placeholder-slate-600"
            placeholder={getNextName()} // Placeholder dinámico
          />
        </div>
        <div className="flex gap-1.5">
          <div className="relative flex-1">
             <DollarSign className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-500" size={10} />
             <input
              type="number"
              min="1"
              max="10000"
              step="0.01"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded pl-4 pr-2 py-1 text-[10px] text-white focus:border-amber-500 outline-none placeholder-slate-600"
              placeholder="0.00"
              required
            />

          </div>
          <button 
            type="submit"
            className="bg-amber-600 hover:bg-amber-500 text-white px-2 rounded transition-colors shadow-lg shadow-amber-900/20"
            title="Agregar Premio"
          >
            <Plus size={14} />
          </button>
        </div>
      </form>

      {/* Lista de Premios */}
      <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
        {prizes.length === 0 && (
          <div className="text-center text-[10px] text-slate-600 py-2 italic">
            Sin premios
          </div>
        )}
        
        {prizes.map(prize => {
          const isEditing = editingId === prize.id;

          return (
            <div 
              key={prize.id} 
              className={`
                flex items-center justify-between p-1.5 rounded border transition-all group
                ${prize.isAwarded 
                  ? 'bg-slate-800/30 border-slate-800 opacity-60' 
                  : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                }
              `}
            >
              {isEditing ? (
                /* MODO EDICIÓN */
                <div className="flex-1 flex flex-col gap-1 animate-in fade-in duration-200">
                  <input 
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    className="bg-slate-900 border border-slate-600 rounded px-2 py-0.5 text-[10px] text-white outline-none focus:border-cyan-500"
                    placeholder="Nombre"
                  />
                  <div className="flex gap-1">
                    <input 
                      value={editForm.description}
                      onChange={e => setEditForm({...editForm, description: e.target.value})}
                      className="bg-slate-900 border border-slate-600 rounded px-2 py-0.5 text-[10px] text-white outline-none focus:border-cyan-500 flex-1"
                      placeholder="Desc"
                    />
                    <button onClick={saveEdit} className="bg-emerald-600 hover:bg-emerald-500 text-white px-1 rounded">
                      <Save size={10} />
                    </button>
                    <button onClick={cancelEdit} className="bg-slate-700 hover:bg-slate-600 text-white px-1 rounded">
                      <X size={10} />
                    </button>
                  </div>
                </div>
              ) : (
                /* MODO VISUALIZACIÓN */
                <>
                  <div className="flex items-center gap-2 min-w-0">
                    <button 
                      onClick={() => onTogglePrize(prize.id)}
                      className={`flex-shrink-0 transition-colors ${prize.isAwarded ? 'text-emerald-500' : 'text-slate-600 hover:text-emerald-500'}`}
                      title={prize.isAwarded ? "Marcar como pendiente" : "Marcar como entregado"}
                    >
                      {prize.isAwarded ? <CheckCircle size={14} /> : <Circle size={14} />}
                    </button>
                    
                    <div className="flex flex-col min-w-0">
                      <span className={`text-[10px] font-bold truncate ${prize.isAwarded ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {prize.name}
                      </span>
                      <span className={`text-[9px] truncate ${prize.isAwarded ? 'text-slate-600' : 'text-amber-400 font-mono'}`}>
                        {prize.description}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => startEdit(prize)}
                      className="text-slate-500 hover:text-cyan-400 p-0.5 transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={() => onRemovePrize(prize.id)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={12} />
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
