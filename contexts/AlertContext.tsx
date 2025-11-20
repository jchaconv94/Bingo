import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, HelpCircle } from 'lucide-react';

type AlertType = 'info' | 'success' | 'warning' | 'danger' | 'confirm';

interface AlertOptions {
  title?: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => Promise<void>;
  showConfirm: (options: AlertOptions) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<AlertOptions & { resolve: (value: any) => void }>({
    message: '',
    resolve: () => {},
  });

  const showAlert = useCallback((options: AlertOptions) => {
    return new Promise<void>((resolve) => {
      setConfig({ ...options, type: options.type || 'info', resolve });
      setIsOpen(true);
    });
  }, []);

  const showConfirm = useCallback((options: AlertOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfig({ ...options, type: 'confirm', resolve });
      setIsOpen(true);
    });
  }, []);

  const handleClose = (result: boolean = false) => {
    setIsOpen(false);
    // Small delay to allow animation to finish before resolving logic
    setTimeout(() => {
        config.resolve(result);
    }, 100);
  };

  // Visual configurations based on type
  const getIcon = () => {
    switch (config.type) {
      case 'success': return <CheckCircle size={32} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={32} className="text-amber-500" />;
      case 'danger': return <XCircle size={32} className="text-rose-500" />;
      case 'confirm': return <HelpCircle size={32} className="text-cyan-500" />;
      default: return <Info size={32} className="text-blue-500" />;
    }
  };

  const getColors = () => {
    switch (config.type) {
        case 'success': return 'border-emerald-500/50 shadow-emerald-900/20';
        case 'warning': return 'border-amber-500/50 shadow-amber-900/20';
        case 'danger': return 'border-rose-500/50 shadow-rose-900/20';
        case 'confirm': return 'border-cyan-500/50 shadow-cyan-900/20';
        default: return 'border-blue-500/50 shadow-blue-900/20';
    }
  }

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`bg-slate-900 border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 transform scale-100 ${getColors()}`}>
            
            <div className="p-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className="p-3 bg-slate-950 rounded-full border border-slate-800 shadow-inner">
                        {getIcon()}
                    </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">
                    {config.title || (config.type === 'confirm' ? '¿Estás seguro?' : 'Atención')}
                </h3>
                
                <p className="text-slate-300 text-sm leading-relaxed mb-6 whitespace-pre-line">
                    {config.message}
                </p>

                <div className="flex gap-3 justify-center">
                    {config.type === 'confirm' ? (
                        <>
                            <button
                                onClick={() => handleClose(false)}
                                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors border border-slate-700"
                            >
                                {config.cancelText || 'Cancelar'}
                            </button>
                            <button
                                onClick={() => handleClose(true)}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/30"
                            >
                                {config.confirmText || 'Confirmar'}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => handleClose(true)}
                            className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors border border-slate-600"
                        >
                            Entendido
                        </button>
                    )}
                </div>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};