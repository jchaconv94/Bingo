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
}

const Modal: React.FC<Props> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md', noPadding = false }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full ${maxWidth} flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200`}>
        
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
