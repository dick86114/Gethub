import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  content: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  content,
  onConfirm,
  onCancel,
  confirmText = '确定',
  cancelText = '取消',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s]">
      <div className="w-full max-w-sm bg-[#0e1015] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-[scaleIn_0.2s]">
        <div className="p-6">
          <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          <p className="text-slate-400 text-sm leading-relaxed">{content}</p>
        </div>
        <div className="flex border-t border-white/10 bg-[#151922]/50">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {cancelText}
          </button>
          <div className="w-[1px] bg-white/10"></div>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 text-sm font-bold transition-colors ${
              type === 'danger' 
                ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' 
                : 'text-primary hover:text-primary-hover hover:bg-primary/10'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
