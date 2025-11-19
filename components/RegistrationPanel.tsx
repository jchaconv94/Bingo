
import React, { useState, useRef } from 'react';
import { UserPlus, Upload, Download, FileSpreadsheet, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { Participant } from '../types.ts';

interface Props {
  onRegister: (data: Omit<Participant, 'id' | 'cards'>, cardsCount: number) => void;
  onImport: (file: File) => void;
  onExport: () => void;
  onGenerateAllImages: () => void;
  totalParticipants: number;
}

const RegistrationPanel: React.FC<Props> = ({ onRegister, onImport, onExport, onGenerateAllImages, totalParticipants }) => {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    dni: '',
    phone: '',
    cardsCount: 1
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.dni) return;
    
    onRegister(
      {
        name: formData.name,
        surname: formData.surname,
        dni: formData.dni,
        phone: formData.phone
      },
      formData.cardsCount
    );

    setFormData({
      name: '',
      surname: '',
      dni: '',
      phone: '',
      cardsCount: 1
    });
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm 2xl:text-[20px] font-bold text-white flex items-center gap-2">
          <UserPlus className="text-cyan-500 w-[18px] h-[18px] 2xl:w-6 2xl:h-6" />
          Registro
        </h2>
        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
          Total: {totalParticipants}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="grid grid-cols-1 gap-2">
          <div>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
              placeholder="Nombre"
            />
          </div>
          <div>
            <input
              type="text"
              value={formData.surname}
              onChange={e => setFormData({...formData, surname: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
              placeholder="Apellidos"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              type="text"
              required
              value={formData.dni}
              onChange={e => setFormData({...formData, dni: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
              placeholder="DNI / ID"
            />
          </div>
          <div>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-cyan-500 focus:border-transparent outline-none transition-all"
              placeholder="Teléfono"
            />
          </div>
        </div>

        <div>
          <select
            value={formData.cardsCount}
            onChange={e => setFormData({...formData, cardsCount: Number(e.target.value)})}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-cyan-500 focus:border-transparent outline-none"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <option key={n} value={n}>{n} Cartón{n > 1 ? 'es' : ''}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 rounded transition-all shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2 text-xs"
        >
          <UserPlus size={14} />
          Registrar
        </button>
      </form>

      <div className="my-3 border-t border-slate-800"></div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium py-1.5 px-2 rounded border border-slate-700 transition-colors"
          >
            <Upload size={12} />
            Importar
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx, .xls"
            onChange={(e) => {
              if (e.target.files?.[0]) onImport(e.target.files[0]);
              e.target.value = ''; // reset
            }}
          />
          
          <button
            onClick={onExport}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-medium py-1.5 px-2 rounded border border-slate-700 transition-colors"
          >
            <FileSpreadsheet size={12} />
            Exportar
          </button>
        </div>

        <button
          onClick={onGenerateAllImages}
          className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-medium py-1.5 px-2 rounded border border-slate-700 transition-colors"
        >
          <ImageIcon size={12} />
          Descargar Todo (ZIP)
        </button>
      </div>
    </div>
  );
};

export default RegistrationPanel;
