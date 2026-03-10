
import React, { useState, useRef } from 'react';
import { UserPlus, Hash, Phone, ChevronRight, RefreshCw, Minus, Plus, Ticket, User, Save, X } from 'lucide-react';
import { Participant } from '../types.ts';

interface Props {
  onRegister: (data: Omit<Participant, 'id' | 'cards'>, cardsCount: number) => void;
  totalParticipants: number;
  totalCards: number;
  onClose: () => void;
}

// Función auxiliar para generar ID numérico de 8 dígitos
const generateRandomDNI = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

const RegistrationPanel: React.FC<Props> = ({ onRegister, totalParticipants, totalCards, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    dni: generateRandomDNI(), // Inicializar con un ID generado
    phone: '',
    cardsCount: '1' as string | number
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

    const count = Math.max(1, Math.floor(Number(formData.cardsCount) || 1));

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
      cardsCount: '1'
    });

    // Regresar el foco al primer input (Nombre)
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 0);
  };

  return (
    <div className="p-4 flex flex-col gap-3 relative overflow-hidden group shrink-0 h-full max-h-[90vh]">

      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

      {/* Header - Simplified */}
      <div className="flex items-center justify-between relative z-10 shrink-0">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20 text-cyan-400">
            <UserPlus size={18} />
          </div>
          Nuevo Jugador
        </h2>
        <button onClick={onClose} className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors border border-slate-700/50 shadow-sm">
          <X size={18} />
        </button>
      </div>

      {/* Stats - Compact */}
      <div className="flex items-center justify-between bg-slate-800/30 p-3 rounded-xl border border-slate-700/30 relative z-10 shrink-0">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Jugadores</span>
          <span className="text-lg font-black text-white leading-none">{totalParticipants}</span>
        </div>
        <div className="w-px h-8 bg-slate-700/50"></div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-bold uppercase text-emerald-500 tracking-wider">Cartones</span>
          <span className="text-lg font-black text-emerald-400 leading-none">{totalCards}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 relative z-10">
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
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
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-base text-white placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none transition-all shadow-sm"
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
              onChange={e => setFormData({ ...formData, surname: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-base text-white placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none transition-all shadow-sm"
              placeholder="Apellidos"
            />
          </div>

          {/* Grid Responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone */}
            <div className="relative group/input">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-cyan-400 transition-colors">
                <Phone size={20} />
              </div>
              <input
                type="tel"
                value={formData.phone}
                onChange={handlePhoneChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-base text-white placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none transition-all shadow-sm font-mono"
                placeholder="Teléfono"
                maxLength={9}
              />
            </div>
            {/* DNI */}
            <div className="relative group/input">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-cyan-400 transition-colors">
                <Hash size={20} />
              </div>
              <input
                type="text"
                required
                value={formData.dni}
                onChange={e => setFormData({ ...formData, dni: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-12 py-4 text-base text-white placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none transition-all shadow-sm font-mono tracking-widest font-bold"
                placeholder="DNI / ID"
              />
              <button
                type="button"
                onClick={regenerateDNI}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors p-1"
                title="Generar nuevo ID"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>

          {/* Cards Count Section - Premium Redesign */}
          <div className="bg-slate-900/40 rounded-3xl p-5 border border-slate-800/50 backdrop-blur-sm relative overflow-hidden group/cards">
            {/* Subtle background glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover/cards:bg-emerald-500/10 transition-colors duration-500"></div>
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <Ticket size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.2em] leading-none mb-1">Volumen de</span>
                  <span className="text-base uppercase font-black text-white tracking-wider leading-none">Cartones</span>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                Unidades
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-950/50 rounded-2xl p-2 border border-slate-800/50 relative z-10">
              <button
                type="button"
                onClick={() => setFormData({...formData, cardsCount: Math.max(1, Number(formData.cardsCount) - 1)})}
                className="w-14 h-14 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition-all active:scale-90 shadow-lg"
              >
                <Minus size={20} />
              </button>
              
              <div className="flex-1 flex flex-col items-center justify-center">
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={formData.cardsCount}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData({ ...formData, cardsCount: val === '' ? '' : Number(val) });
                  }}
                  className="w-full bg-transparent text-4xl font-black text-white text-center border-none focus:ring-0 p-0 h-auto placeholder-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                  placeholder="1"
                />
                <div className="w-8 h-1 bg-emerald-500/30 rounded-full mt-1"></div>
              </div>

              <button
                type="button"
                onClick={() => setFormData({...formData, cardsCount: Number(formData.cardsCount) + 1})}
                className="w-14 h-14 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 flex items-center justify-center text-emerald-500 hover:text-emerald-400 transition-all active:scale-90 shadow-lg"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Fixed Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 mt-4 shrink-0 uppercase tracking-widest text-sm"
        >
          <Save size={20} />
          Registrar Jugador
        </button>
      </form>
    </div>
  );
};

export default RegistrationPanel;
