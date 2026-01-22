import React, { memo, useState } from 'react';
import { Icon } from '../constants';

interface NavbarProps {
  onOpenAdmin: () => void;
  onRefresh: () => void;
  onShuffle: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Navbar = memo<NavbarProps>(({ 
  onOpenAdmin, 
  onRefresh, 
  onShuffle, 
  searchQuery, 
  setSearchQuery
}) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <nav className="relative z-50 w-full px-4 md:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0">
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-3">
            <img src="/logo-v2.png" alt="Gethub Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain drop-shadow-[0_0_8px_rgba(13,89,242,0.5)]" />
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Gethub
            </span>
        </div>
        
        {/* Mobile Actions */}
        <div className="flex items-center gap-2 md:hidden">
             <button 
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                className={`w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors ${isMobileSearchOpen ? 'text-white bg-white/10' : 'text-slate-400'}`}
             >
                <Icon name="search" className="text-lg" />
             </button>
             <button 
                onClick={onRefresh}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
             >
                <Icon name="refresh" className="text-lg" />
             </button>
             <button 
                onClick={onOpenAdmin}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
             >
                <Icon name="settings" className="text-lg" />
             </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className={`flex-1 max-w-md w-full relative group ${isMobileSearchOpen ? 'block' : 'hidden md:block'}`}>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
            <Icon name="search" className="text-lg" />
        </div>
        <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search repositories..." 
            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all placeholder:text-slate-600"
        />
        {searchQuery && (
            <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                title="清除"
            >
                <Icon name="close" className="text-lg" />
            </button>
        )}
      </div>

      <div className="hidden md:flex items-center gap-3">
        <button 
          onClick={onShuffle}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          title="随机推荐"
        >
          <Icon name="shuffle" className="text-lg" />
        </button>

        <button 
          onClick={onRefresh}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          title="刷新"
        >
          <Icon name="refresh" className="text-lg" />
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

        <button 
          onClick={onOpenAdmin}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          title="管理后台"
        >
          <Icon name="settings" className="text-lg" />
        </button>
        
        <a 
          href="https://github.com/dick86114/Gethub" 
          target="_blank" 
          rel="noreferrer"
          className="opacity-60 hover:opacity-100 transition-opacity ml-1"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.05-.015-2.055-3.33 1.245-4.035-1.605-4.035-1.605-.54-1.38-1.335-1.755-1.335-1.755-1.087-.75.075-.735.075-.735 1.2.09 1.83 1.245 1.83 1.245 1.065 1.815 2.805 1.29 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405 1.02 0 2.04.135 3 .405 2.28-1.545 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.92 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.285 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>
      </div>
    </nav>
  );
});