import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { UserPlus, Gift, Users, Upload, FileSpreadsheet, Archive, X, Settings, Cloud } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenModal: (modal: 'register' | 'prizes' | 'participants' | 'settings' | 'connection') => void;
  onImport: (file: File) => void;
  onExport: () => void;
  onBackup: () => void;
  totalParticipants: number;
  totalCards: number;
}

const ManagementMenu: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenModal,
  onImport,
  onExport,
  onBackup,
  totalParticipants,
  totalCards
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300 p-0 sm:p-8">
      <div className="bg-slate-900 border-x-0 sm:border-x border-y-0 sm:border-y border-slate-800 rounded-none sm:rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800/50 bg-slate-900/50">
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)]"></div>
            Menú de Gestión
          </h2>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Grid */}
        <div className="p-4 sm:p-10 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            
            {/* Nuevo Jugador */}
            <button 
              onClick={() => onOpenModal('register')}
              className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center gap-3 sm:gap-4 transition-all hover:-translate-y-1 shadow-lg hover:shadow-cyan-900/20"
            >
              <div className="p-3 sm:p-4 bg-cyan-500/10 rounded-xl sm:rounded-2xl text-cyan-400 group-hover:scale-110 transition-transform">
                <UserPlus size={28} strokeWidth={1.5} className="sm:w-10 sm:h-10" />
              </div>
              <div className="text-center">
                <h3 className="text-[13px] sm:text-lg font-bold text-white mb-1">Nuevo Jugador</h3>
                <p className="text-[9px] sm:text-xs text-slate-400 line-clamp-2">Registrar participante y generar cartones</p>
              </div>
            </button>

            {/* Registrar Premios */}
            <button 
              onClick={() => onOpenModal('prizes')}
              className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center gap-3 sm:gap-4 transition-all hover:-translate-y-1 shadow-lg hover:shadow-amber-900/20"
            >
              <div className="p-3 sm:p-4 bg-amber-500/10 rounded-xl sm:rounded-2xl text-amber-400 group-hover:scale-110 transition-transform">
                <Gift size={28} strokeWidth={1.5} className="sm:w-10 sm:h-10" />
              </div>
              <div className="text-center">
                <h3 className="text-[13px] sm:text-lg font-bold text-white mb-1">Registrar Premios</h3>
                <p className="text-[9px] sm:text-xs text-slate-400 line-clamp-2">Configurar los premios del sorteo</p>
              </div>
            </button>

            {/* Consultar Participantes */}
            <button 
              onClick={() => onOpenModal('participants')}
              className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center gap-3 sm:gap-4 transition-all hover:-translate-y-1 shadow-lg hover:shadow-emerald-900/20"
            >
              <div className="p-3 sm:p-4 bg-emerald-500/10 rounded-xl sm:rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform">
                <Users size={28} strokeWidth={1.5} className="sm:w-10 sm:h-10" />
              </div>
              <div className="text-center">
                <h3 className="text-[13px] sm:text-lg font-bold text-white mb-1">Consultar Participantes</h3>
                <p className="text-[9px] sm:text-xs text-slate-400 line-clamp-2">Ver, editar y eliminar jugadores ({totalParticipants})</p>
              </div>
            </button>

            {/* Importar */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center gap-3 sm:gap-4 transition-all hover:-translate-y-1 shadow-lg hover:shadow-blue-900/20"
            >
              <div className="p-3 sm:p-4 bg-blue-500/10 rounded-xl sm:rounded-2xl text-blue-400 group-hover:scale-110 transition-transform">
                <Upload size={28} strokeWidth={1.5} className="sm:w-10 sm:h-10" />
              </div>
              <div className="text-center">
                <h3 className="text-[13px] sm:text-lg font-bold text-white mb-1">Importar Excel</h3>
                <p className="text-[9px] sm:text-xs text-slate-400 line-clamp-2">Cargar participantes desde un archivo</p>
              </div>
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
            </button>

            {/* Exportar */}
            <button 
              onClick={onExport}
              className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center gap-3 sm:gap-4 transition-all hover:-translate-y-1 shadow-lg hover:shadow-indigo-900/20"
            >
              <div className="p-3 sm:p-4 bg-indigo-500/10 rounded-xl sm:rounded-2xl text-indigo-400 group-hover:scale-110 transition-transform">
                <FileSpreadsheet size={28} strokeWidth={1.5} className="sm:w-10 sm:h-10" />
              </div>
              <div className="text-center">
                <h3 className="text-[13px] sm:text-lg font-bold text-white mb-1">Exportar Excel</h3>
                <p className="text-[9px] sm:text-xs text-slate-400 line-clamp-2">Descargar lista de participantes</p>
              </div>
            </button>

            {/* Backup ZIP */}
            <button 
              onClick={onBackup}
              className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center gap-3 sm:gap-4 transition-all hover:-translate-y-1 shadow-lg hover:shadow-purple-900/20"
            >
              <div className="p-3 sm:p-4 bg-purple-500/10 rounded-xl sm:rounded-2xl text-purple-400 group-hover:scale-110 transition-transform">
                <Archive size={28} strokeWidth={1.5} className="sm:w-10 sm:h-10" />
              </div>
              <div className="text-center">
                <h3 className="text-[13px] sm:text-lg font-bold text-white mb-1">Backup ZIP</h3>
                <p className="text-[9px] sm:text-xs text-slate-400 line-clamp-2">Descargar todos los cartones en imágenes</p>
              </div>
            </button>

            {/* Configuración */}
            <button 
              onClick={() => onOpenModal('settings')}
              className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center gap-3 sm:gap-4 transition-all hover:-translate-y-1 shadow-lg hover:shadow-cyan-900/20"
            >
              <div className="p-3 sm:p-4 bg-cyan-500/10 rounded-xl sm:rounded-2xl text-cyan-400 group-hover:scale-110 transition-transform">
                <Settings size={28} strokeWidth={1.5} className="sm:w-10 sm:h-10" />
              </div>
              <div className="text-center">
                <h3 className="text-[13px] sm:text-lg font-bold text-white mb-1">Configuración</h3>
                <p className="text-[9px] sm:text-xs text-slate-400 line-clamp-2">Parámetros del evento y precio de cartón</p>
              </div>
            </button>

            {/* Conexión */}
            <button 
              onClick={() => onOpenModal('connection')}
              className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center gap-3 sm:gap-4 transition-all hover:-translate-y-1 shadow-lg hover:shadow-emerald-900/20"
            >
              <div className="p-3 sm:p-4 bg-emerald-500/10 rounded-xl sm:rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform">
                <Cloud size={28} strokeWidth={1.5} className="sm:w-10 sm:h-10" />
              </div>
              <div className="text-center">
                <h3 className="text-[13px] sm:text-lg font-bold text-white mb-1">Conexión</h3>
                <p className="text-[9px] sm:text-xs text-slate-400 line-clamp-2">Enlace con Google Sheets y Sincronización</p>
              </div>
            </button>

          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default ManagementMenu;
