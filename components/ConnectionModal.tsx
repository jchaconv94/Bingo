
import React, { useState } from 'react';
import { X, Cloud, Link, CheckCircle, AlertTriangle, Save, Database, Clock, Zap, RefreshCw, ChevronDown } from 'lucide-react';
import { SheetAPI } from '../services/googleSheetService.ts';

interface Props {
  currentUrl: string;
  currentAutoSync: boolean;
  currentInterval: number;
  onSave: (url: string, autoSync: boolean, interval: number) => void;
  onClose: () => void;
  onSyncNow: () => void;
}

const ConnectionModal: React.FC<Props> = ({ currentUrl, currentAutoSync, currentInterval, onSave, onClose, onSyncNow }) => {
  const [url, setUrl] = useState(currentUrl);
  const [autoSync, setAutoSync] = useState(currentAutoSync);
  const [interval, setIntervalVal] = useState(currentInterval);

  const [isTesting, setIsTesting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  const handleTest = async () => {
    if (!url) return;
    setIsTesting(true);
    setStatus('idle');

    // Probamos una lectura simple
    const result = await SheetAPI.fetchAll(url);

    if (result.success && Array.isArray(result.data)) {
      setStatus('success');
      setStatusMsg('Conexión exitosa. Se encontraron ' + result.data.length + ' registros.');
    } else {
      setStatus('error');
      setStatusMsg('No se pudo conectar: ' + (result.message || result.error || 'Verifica la URL y permisos.'));
    }
    setIsTesting(false);
  };

  const handleSave = () => {
    onSave(url, autoSync, interval);
    onClose();
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header Premium - Más refinado para desktop */}
      <div className="bg-slate-900 px-6 py-5 sm:px-10 border-b border-white/[0.05] flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 shadow-inner">
            <Cloud size={24} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-white tracking-tight">Conexión a la Nube</h2>
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Servicio de Google Sheets v3.0</span>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-2.5 bg-slate-800/50 hover:bg-slate-700/80 rounded-2xl text-slate-400 hover:text-white transition-all border border-slate-700/50 group"
        >
          <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      <div className="p-6 sm:p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
        {/* Banner de Sincronización */}
        <div className="relative group overflow-hidden bg-slate-800/30 p-6 rounded-3xl border border-emerald-500/20 shadow-2xl">
          <div className="absolute right-0 top-0 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <Database size={200} className="translate-x-1/4 -translate-y-1/4" />
          </div>
          
          <div className="relative flex flex-col sm:flex-row items-center gap-6">
            <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-400">
              <Zap size={32} className="animate-pulse" />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-bold text-emerald-400 mb-1">Sincronización en Tiempo Real</h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                Al activar el enlace con Google Sheets, tus datos estarán protegidos y disponibles en cualquier dispositivo. 
                Ideal para operativos con múltiples cajeros o administradores.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 items-start">
          {/* Input URL */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] pl-1">
              <Link size={14} className="text-emerald-500" />
              URL del Backend (Apps Script)
            </label>
            <div className="group relative">
              <div className="absolute inset-0 bg-emerald-500/5 blur-xl group-focus-within:bg-emerald-500/10 transition-colors rounded-full opacity-0 group-focus-within:opacity-100"></div>
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setStatus('idle');
                }}
                placeholder="https://script.google.com/macros/s/..."
                className="relative w-full bg-slate-950/80 border border-slate-700 px-6 py-5 rounded-3xl text-sm text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-2xl placeholder:text-slate-700 font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 pl-6 italic">Pega aquí el enlace "Web App" generado desde tu Editor de Scripts</p>
          </div>

          {/* Controles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950/40 p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-black text-slate-200 flex items-center gap-2">
                  <Zap size={18} className={autoSync ? "text-yellow-400" : "text-slate-600"} /> 
                  Auto-Sincronización
                </span>
                <button
                  onClick={() => setAutoSync(!autoSync)}
                  className={`w-14 h-7 rounded-full relative transition-all duration-300 shadow-inner ${autoSync ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 transform ${autoSync ? 'translate-x-8' : 'translate-x-1'}`}></div>
                </button>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors">
                Envía cambios de forma invisible mientras trabajas.
              </p>
            </div>

            <div className="bg-slate-950/40 p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all group">
              <label className="text-sm font-black text-slate-200 flex items-center gap-2 mb-3">
                <Clock size={16} className="text-cyan-400" /> Frecuencia de envío
              </label>
              <div className="relative">
                <select
                  value={interval}
                  onChange={(e) => setIntervalVal(Number(e.target.value))}
                  disabled={!autoSync}
                  className={`w-full bg-slate-900/80 border border-slate-700 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:border-cyan-500 appearance-none transition-all shadow-inner ${!autoSync ? 'opacity-30 grayscale cursor-not-allowed' : 'opacity-100 hover:border-slate-600'}`}
                >
                  <option value={2000}>🚀 Tiempo Real (2 seg.)</option>
                  <option value={5000}>⚡ Rápido (5 seg.)</option>
                  <option value={10000}>⚓ Estándar (10 seg.)</option>
                  <option value={30000}>🔋 Ahorro de Datos (30 seg.)</option>
                  <option value={60000}>📦 Bajo consumo (1 min.)</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {status !== 'idle' && (
          <div className={`p-6 rounded-3xl text-sm font-bold flex items-center gap-4 animate-in zoom-in-95 duration-300 border bg-slate-950/40 shadow-2xl ${status === 'success' ? 'text-emerald-400 border-emerald-500/20' : 'text-rose-400 border-rose-500/20'}`}>
            <div className={`p-3 rounded-2xl ${status === 'success' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
              {status === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-widest opacity-60 mb-1">{status === 'success' ? 'Éxito' : 'Error detectado'}</span>
              <span className="text-lg leading-tight uppercase tracking-tight">{statusMsg}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Premium para Desktop - Uniforme y sin overlaps */}
      <div className="p-6 sm:p-8 bg-slate-900 border-t border-white/[0.05] shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={handleTest}
            disabled={!url || isTesting}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border ${!url || isTesting ? 'opacity-50 cursor-not-allowed border-slate-800 text-slate-500' : 'border-slate-700 bg-slate-800 text-white hover:bg-slate-750'}`}
          >
            {isTesting ? 'Verificando...' : 'Probar conexión'}
          </button>

          {currentUrl && (
            <button
              onClick={onSyncNow}
              className="w-full py-4 bg-slate-800/50 hover:bg-slate-700 text-white rounded-2xl transition-all border border-slate-700 flex items-center justify-center gap-2 group"
            >
              <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
              <span className="font-bold text-xs uppercase tracking-widest">Forzar Bajada</span>
            </button>
          )}

          <button
            onClick={handleSave}
            className={`w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all uppercase tracking-widest ${currentUrl ? 'lg:col-span-1' : 'sm:col-span-1'}`}
          >
            <Save size={18} />
            <span>Guardar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionModal;
