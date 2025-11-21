
import React, { useState, useRef, useEffect } from 'react';
import { UserPlus, Upload, FileSpreadsheet, Archive, Save, Ticket, User, Hash, Phone, ChevronRight, RefreshCw } from 'lucide-react';
import { Participant } from '../types.ts';

interface Props {
  onRegister: (data: Omit<Participant, 'id' | 'cards'>, cardsCount: number) => void;
  onImport: (file: File) => void;
  onExport: () => void;
  onGenerateAllImages: () => void;
  totalParticipants: number;
  totalCards: number;
}

// Función auxiliar para generar ID numérico de 8 dígitos
const generateRandomDNI = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

const RegistrationPanel: React.FC<Props> = ({ onRegister, onImport, onExport, onGenerateAllImages, totalParticipants, totalCards }) => {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    dni: generateRandomDNI(), // Inicializar con un ID generado
    phone: '',
    cardsCount: 1
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null); // Referencia para el foco

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo permite números y máximo 9 dígitos
    const value = e.target.value.replace(/\D/g, '').slice(0, 9);
    setFormData(prev => ({ ...prev, phone: value }));
  };

  const regenerateDNI = () => {
    setFormData(prev => ({ ...prev, dni: generateRandomDNI() }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.dni) return;
    
    const count = Math.max(1, Math.floor(formData.cardsCount));

    onRegister(
      {
        name: formData.name,
        surname: formData.surname,
        dni: formData.dni,
        phone: formData.phone
      },
      count
    );

    setFormData({
      name: '',
      surname: '',
      dni: generateRandomDNI(), // Generar nuevo ID para el siguiente usuario
      phone: '',
      cardsCount: 1
    });

    // Regresar el foco al primer input (Nombre)
    setTimeout(() => {
        nameInputRef.current?.focus();
    }, 0);
  };

  return (
    // Expanded Design: p-6 instead of p-4, gap-5 instead of gap-4
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md flex flex-col gap-5 relative overflow-hidden group shrink-0">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

      {/* Header Expanded */}
      <div className="flex items-center justify-between relative z-10 pb-4 border-b border-slate-800/60">
        <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-900/10">
                <UserPlus size={22} />
            </div>
            Nuevo Jugador
            </h2>
        </div>
        <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-wider">Estadísticas</span>
            <div className="flex items-center gap-3">
               <div className="flex flex-col items-end">
                  <span className="text-[9px] text-slate-400">Jugadores</span>
                  <span className="text-lg font-black text-white leading-none">{totalParticipants}</span>
               </div>
               <div className="w-px h-8 bg-slate-700/50"></div>
               <div className="flex flex-col items-end">
                  <span className="text-[9px] text-emerald-500 font-bold">Cartones</span>
                  <span className="text-lg font-black text-emerald-400 leading-none">{totalCards}</span>
               </div>
            </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        <div className="space-y-4">
          
          {/* Nombre */}
          <div className="relative group/input">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-cyan-400 transition-colors">
                <User size={20} />
            </div>
            <input
              ref={nameInputRef}
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              // Expanded Inputs: py-3.5 instead of py-3
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-base text-white placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none transition-all shadow-sm"
              placeholder="Nombres del participante"
            />
          </div>

          {/* Apellidos */}
          <div className="relative group/input">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-cyan-400 transition-colors">
                <User size={20} />
            </div>
            <input
              type="text"
              value={formData.surname}
              onChange={e => setFormData({...formData, surname: e.target.value})}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-base text-white placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none transition-all shadow-sm"
              placeholder="Apellidos"
            />
          </div>

          {/* Grid Responsive: 1 Col on mobile, 2 cols on larger */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {/* DNI */}
            <div className="relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-cyan-400 transition-colors">
                    <Hash size={20} />
                </div>
                <input
                  type="text"
                  required
                  value={formData.dni}
                  onChange={e => {
                      // Permitir edición manual pero restringir a números y 8 dígitos
                      const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setFormData({...formData, dni: val});
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-10 py-3.5 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none transition-all shadow-sm font-mono tracking-widest"
                  placeholder="ID AUTO"
                />
                <button
                  type="button"
                  onClick={regenerateDNI}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors p-1 rounded-md hover:bg-slate-800"
                  title="Generar nuevo ID aleatorio"
                >
                    <RefreshCw size={14} />
                </button>
            </div>

            {/* Phone */}
            <div className="relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-cyan-400 transition-colors">
                    <Phone size={20} />
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-3 py-3.5 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none transition-all shadow-sm font-mono"
                  placeholder="9 Digitos"
                  maxLength={9}
                />
            </div>
          </div>
        </div>

        {/* Cards Count Section */}
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 flex items-center gap-4 hover:border-emerald-500/30 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-900/10">
                <Ticket size={24} />
            </div>
            <div className="flex-1">
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wide">Cantidad de Cartones</label>
                <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={formData.cardsCount}
                    onChange={e => setFormData({...formData, cardsCount: Number(e.target.value)})}
                    className="w-full bg-transparent text-white font-black text-2xl border-none focus:ring-0 p-0 h-auto placeholder-slate-600"
                    placeholder="1"
                />
            </div>
            <div className="text-[11px] font-bold text-slate-500 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">UNIDADES</div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 mt-2"
        >
          <Save size={20} />
          REGISTRAR
          <ChevronRight size={20} className="opacity-50" />
        </button>
      </form>

      <div className="mt-auto pt-4 border-t border-slate-800/60 grid grid-cols-3 gap-3">
          
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx, .xls"
            onChange={(e) => {
              if (e.target.files?.[0]) onImport(e.target.files[0]);
              e.target.value = ''; 
            }}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white text-[11px] font-medium py-3 rounded-xl border border-slate-800 hover:border-slate-600 transition-all group shadow-sm"
          >
            <div className="bg-slate-800 group-hover:bg-slate-700 p-2 rounded-lg transition-colors">
               <Upload size={18} className="text-slate-400 group-hover:text-cyan-400 transition-colors" />
            </div>
            <span>Importar</span>
          </button>

          <button
            onClick={onExport}
            className="flex flex-col items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white text-[11px] font-medium py-3 rounded-xl border border-slate-800 hover:border-slate-600 transition-all group shadow-sm"
          >
            <div className="bg-slate-800 group-hover:bg-slate-700 p-2 rounded-lg transition-colors">
               <FileSpreadsheet size={18} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
            </div>
            <span>Exportar</span>
          </button>

          <button
            onClick={onGenerateAllImages}
            className="flex flex-col items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white text-[11px] font-medium py-3 rounded-xl border border-slate-800 hover:border-slate-600 transition-all group shadow-sm"
          >
             <div className="bg-slate-800 group-hover:bg-slate-700 p-2 rounded-lg transition-colors">
               <Archive size={18} className="text-slate-400 group-hover:text-amber-400 transition-colors" />
             </div>
            <span>Backup ZIP</span>
          </button>
      </div>
    </div>
  );
};

export default RegistrationPanel;
