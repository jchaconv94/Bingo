
import React, { useState } from 'react';
import { X, Cloud, Link, CheckCircle, AlertTriangle, Save, Database, Clock, Zap } from 'lucide-react';
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

    if (result !== null) {
      setStatus('success');
      setStatusMsg('Conexión exitosa. Se encontraron ' + result.length + ' registros.');
    } else {
      setStatus('error');
      setStatusMsg('No se pudo conectar. Verifica la URL y permisos.');
    }
    setIsTesting(false);
  };

  const handleSave = () => {
    onSave(url, autoSync, interval);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">

        <div className="bg-gradient-to-r from-emerald-900 to-slate-900 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Cloud className="text-emerald-400" size={24} />
            Conexión Google Sheets
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-sm text-slate-300">
            <p className="mb-2 flex items-start gap-2">
              <Database size={16} className="text-emerald-400 mt-0.5 shrink-0" />
              <strong>Sincronización en la Nube:</strong>
            </p>
            <p className="opacity-80 ml-6">
              Los datos de participantes se sincronizan automáticamente con tu hoja de cálculo. Cualquier cambio realizado en otra PC se reflejará aquí.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">URL del Apps Script (Web App)</label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setStatus('idle');
                  }}
                  placeholder="https://script.google.com/macros/s/..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Zap size={14} className={autoSync ? "text-yellow-400" : "text-slate-600"} /> Auto-Sync
                  </span>
                  <span className="text-[10px] text-slate-500">Actualizar en segundo plano</span>
                </div>
                <button
                  onClick={() => setAutoSync(!autoSync)}
                  className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${autoSync ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-md transition-transform duration-300 ${autoSync ? 'left-6' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 mb-1">
                  <Clock size={14} className="text-cyan-400" /> Frecuencia
                </label>
                <select
                  value={interval}
                  onChange={(e) => setIntervalVal(Number(e.target.value))}
                  disabled={!autoSync}
                  className={`w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-cyan-500 ${!autoSync ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value={2000}>Cada 2 segundos (Rápido)</option>
                  <option value={5000}>Cada 5 segundos (Normal)</option>
                  <option value={10000}>Cada 10 segundos</option>
                  <option value={30000}>Cada 30 segundos</option>
                  <option value={60000}>Cada 1 minuto</option>
                </select>
              </div>
            </div>
          </div>

          {status !== 'idle' && (
            <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${status === 'success' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30' : 'bg-rose-900/30 text-rose-400 border border-rose-500/30'}`}>
              {status === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
              {statusMsg}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <button
              onClick={handleTest}
              disabled={!url || isTesting}
              className={`text-xs font-bold px-4 py-2 rounded-lg border transition-all ${!url ? 'text-slate-600 border-transparent cursor-not-allowed' : 'text-slate-300 border-slate-600 hover:bg-slate-800'}`}
            >
              {isTesting ? 'Probando...' : 'Probar Conexión'}
            </button>

            <div className="flex gap-3">
              {currentUrl && (
                <button
                  onClick={() => {
                    onSyncNow();
                    onClose();
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  Forzar Descarga
                </button>
              )}
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-emerald-900/30 flex items-center gap-2"
              >
                <Save size={16} />
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionModal;
