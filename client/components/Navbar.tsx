import React, { memo } from 'react';
import { Icon } from '../constants';

interface NavbarProps {
  onOpenAdmin: () => void;
}

export const Navbar = memo<NavbarProps>(({ onOpenAdmin }) => {
  return (
    <nav className="relative z-10 w-full px-6 py-4 flex items-center justify-between border-t border-white/5 bg-[#050505]/50 backdrop-blur-sm sticky bottom-0">
      <div className="flex items-center gap-3">
        <img src="/logo-v2.png" alt="Gethub Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(13,89,242,0.5)]" />
        <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
          Gethub
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenAdmin}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          title="管理后台"
        >
          <Icon name="settings" className="text-lg" />
        </button>
        <a 
          href="https://github.com" 
          target="_blank" 
          rel="noreferrer"
          className="opacity-60 hover:opacity-100 transition-opacity"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.05-.015-2.055-3.33 1.245-4.035-1.605-4.035-1.605-.54-1.38-1.335-1.755-1.335-1.755-1.087-.75.075-.735.075-.735 1.2.09 1.83 1.245 1.83 1.245 1.065 1.815 2.805 1.29 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405 1.02 0 2.04.135 3 .405 2.28-1.545 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.92 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.285 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>
      </div>
    </nav>
  );
});
