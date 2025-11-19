
import React, { useState } from 'react';
import { X, Type, Save, AlignLeft, RotateCcw } from 'lucide-react';

interface Props {
  currentTitle: string;
  currentSubtitle: string;
  onSave: (newTitle: string, newSubtitle: string) => void;
  onClose: () => void;
}

const EditTitleModal: React.FC<Props> = ({ currentTitle, currentSubtitle, onSave, onClose }) => {
  const [title, setTitle] = useState(currentTitle);
  const [subtitle, setSubtitle] = useState(currentSubtitle);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(title, subtitle);
  };

  const handleReset = () => {
    if (window.confirm("¿Restaurar título y descripción originales?")) {
      setTitle("VIRTUAL BINGO PRO");
      setSubtitle("Aplicación web de bingo virtual");
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-slate-950/50 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Type className="text-cyan-500" size={20} />
            Personalizar Bingo
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div>
            <label className="block text-xs text-slate-400 font-bold uppercase mb-1.5 flex items-center gap-1.5">
              <Type size={12} /> Título del Evento
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all font-bold tracking-wide"
              placeholder="Ej: GRAN BINGO BAILABLE"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-bold uppercase mb-1.5 flex items-center gap-1.5">
              <AlignLeft size={12} /> Descripción / Subtítulo
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-sm"
              placeholder="Ej: A beneficio de..."
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800/50 mt-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-amber-400 transition-colors flex items-center gap-1.5"
              title="Restaurar valores por defecto"
            >
              <RotateCcw size={14} /> Resetear
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                Guardar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTitleModal;
