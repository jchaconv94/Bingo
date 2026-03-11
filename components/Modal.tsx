import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  noPadding?: boolean;
  fullScreenMobile?: boolean;
}

const Modal: React.FC<Props> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md', noPadding = false, fullScreenMobile = true }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[130] flex items-center justify-center bg-black/5 backdrop-blur-md ${fullScreenMobile ? 'p-0' : 'p-4'} animate-in fade-in duration-300`}>
      <div className={`relative bg-slate-900 border border-slate-800 ${fullScreenMobile ? 'rounded-none sm:rounded-2xl h-[100dvh] sm:h-auto sm:max-h-[85vh] border-x-0 sm:border-x' : 'rounded-2xl max-h-[85vh]'} shadow-2xl w-full ${maxWidth} flex flex-col overflow-hidden animate-in zoom-in-95 duration-200`}>
        
        {title && (
          <div className="flex justify-between items-center p-4 border-b border-slate-800/50 flex-shrink-0">
            <h3 className="font-bold text-white text-lg">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        )}
        <div className={`flex flex-col flex-1 min-h-0 overflow-hidden ${noPadding ? '' : 'overflow-y-auto custom-scrollbar p-4'}`}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
