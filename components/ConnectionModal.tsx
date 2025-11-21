
import React, { useState } from 'react';
import { X, Cloud, Link, CheckCircle, AlertTriangle, Save, Database } from 'lucide-react';
import { SheetAPI } from '../services/googleSheetService.ts';

interface Props {
  currentUrl: string;
  onSave: (url: string) => void;
  onClose: () => void;
  onSyncNow: () => void;
}

const ConnectionModal: React.FC<Props> = ({ currentUrl, onSave, onClose, onSyncNow }) => {
  const [url, setUrl] = useState(currentUrl);
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
        setStatusMsg('No se pudo conectar. Verifica la URL y que el script esté implementado como "Aplicación Web" con acceso "Cualquier usuario".');
    }
    setIsTesting(false);
  };

  const handleSave = () => {
    onSave(url);
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
                    Conecta tu aplicativo con una Hoja de Cálculo de Google para guardar automáticamente los participantes y sus cartones. Los cambios se reflejarán en la nube.
                </p>
            </div>

            <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">URL del Apps Script (Web App)</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
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
