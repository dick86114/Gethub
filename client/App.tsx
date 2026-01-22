import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Repo } from './types';
import { getRepos } from './services/api';
import { AdminModal } from './components/AdminModal';
import { RepoCard } from './components/RepoCard';
import { ReadmeModal } from './components/ReadmeModal';
import { Navbar } from './components/Navbar';
import { Icon } from './constants';

const App = () => {
  // State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isReadmeOpen, setIsReadmeOpen] = useState(false);
  
  const [repos, setRepos] = useState<Repo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New States
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<'newest' | 'random'>('random');

  // Swipe State
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchMoveX, setTouchMoveX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();

  // Load Repos
  const loadRepos = useCallback(async (pageNum: number, isInitial: boolean, search: string, sortType: string) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    
    try {
      const res = await getRepos(pageNum, 10, search, sortType);
      if (res.data && res.data.length > 0) {
          if (isInitial) {
              setRepos(res.data);
          } else {
              setRepos(prev => [...prev, ...res.data]);
          }
          setHasMore(res.data.length === 10);
      } else {
          setHasMore(false);
          if (isInitial) {
              if (search) setError("未找到相关项目");
              else setError("暂无数据，请进入后台拉取数据");
          }
      }
    } catch (err: any) {
      setError("连接服务器失败");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Debounced Search & Sort Effect
  useEffect(() => {
    const timer = setTimeout(() => {
        // Reset state
        setRepos([]);
        setPage(1);
        setCurrentIndex(0);
        setHasMore(true);
        loadRepos(1, true, searchQuery, sort);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, sort]); // Intentionally omitting loadRepos to avoid loops

  // Load more when reaching end
  useEffect(() => {
    if (repos.length > 0 && currentIndex >= repos.length - 2 && hasMore && !loading) {
        setPage(p => {
            const nextPage = p + 1;
            loadRepos(nextPage, false, searchQuery, sort);
            return nextPage;
        });
    }
  }, [currentIndex, repos.length, hasMore, loading, loadRepos, searchQuery, sort]);

  const handleNext = useCallback(() => {
    if (repos.length === 0) return;
    setCurrentIndex(prev => (prev + 1) % repos.length);
  }, [repos.length]);

  const handlePrev = useCallback(() => {
    if (repos.length === 0) return;
    setCurrentIndex(prev => (prev - 1 + repos.length) % repos.length);
  }, [repos.length]);

  const handleViewDetails = useCallback(() => setIsReadmeOpen(true), []);
  const handleOpenAdmin = useCallback(() => setIsAdminOpen(true), []);

  const handleRefresh = useCallback(() => {
    setRepos([]);
    setPage(1);
    setCurrentIndex(0);
    setHasMore(true);
    loadRepos(1, true, searchQuery, sort);
  }, [searchQuery, sort, loadRepos]);

  const handleShuffle = useCallback(() => {
    setSearchQuery('');
    setSort('random');
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable shortcuts when typing in search input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.code === 'Space' && !isReadmeOpen && !isAdminOpen) {
        e.preventDefault();
        handleNext();
      }
      if (e.code === 'ArrowLeft' && !isReadmeOpen && !isAdminOpen) {
          handlePrev();
      }
      if (e.code === 'ArrowRight' && !isReadmeOpen && !isAdminOpen) {
          handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReadmeOpen, isAdminOpen, currentIndex, repos.length]);

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
      setTouchStartX(e.touches[0].clientX);
      setTouchStartY(e.touches[0].clientY);
      // Don't set isSwiping yet, wait for move to determine direction
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (touchStartX === 0) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - touchStartX;
      const diffY = currentY - touchStartY;

      // If vertical scroll is dominant, ignore swipe
      if (!isSwiping) {
          if (Math.abs(diffY) > Math.abs(diffX)) {
              // Vertical scroll - let browser handle it
              return;
          }
          // Horizontal swipe detected
          if (Math.abs(diffX) > 10) { // Small threshold
             setIsSwiping(true);
          }
      }

      if (isSwiping) {
          // Prevent vertical scroll while swiping horizontally
          if (e.cancelable) e.preventDefault(); 
          
          if (rafRef.current) return;
          rafRef.current = requestAnimationFrame(() => {
              setTouchMoveX(currentX);
              rafRef.current = undefined;
          });
      }
  };

  const handleTouchEnd = () => {
      if (!isSwiping) {
          setTouchStartX(0);
          setTouchStartY(0);
          return;
      }
      
      const diff = touchMoveX - touchStartX;
      const threshold = 50; 

      if (touchMoveX !== 0) {
          if (diff < -threshold) {
              handleNext();
          } else if (diff > threshold) {
              handlePrev();
          }
      }
      
      setTouchStartX(0);
      setTouchStartY(0);
      setTouchMoveX(0);
      setIsSwiping(false);
  };

  const currentRepo = repos[currentIndex];

  // Helper to render card with styles
  const renderCard = (repo: Repo, index: number) => {
      // Calculate cyclic position
      const N = repos.length;
      let position = index - currentIndex;
      
      // Adjust for cyclic wrap-around
      if (position > N / 2) position -= N;
      if (position < -N / 2) position += N;
      
      // Only render visible cards (current, prev, next, and their neighbors for depth)
      if (Math.abs(position) > 2) return null;

      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      
      // Layout Constants
      const GAP_PC = 25; // %
      const GAP_MOBILE = 35; // %
      const GAP = isMobile ? GAP_MOBILE : GAP_PC;
      
      let translateX = 0;
      let scale = 1;
      let zIndex = 10 - Math.abs(position);
      let opacity = 1;
      
      // Layout Logic
      // Center (0)
      if (position === 0) {
          translateX = 0;
          scale = 1;
          opacity = 1;
      } 
      // Prev (-1)
      else if (position === -1) {
          translateX = -GAP;
          scale = 0.5;
          opacity = 0.5;
      } 
      // Next (1)
      else if (position === 1) {
          translateX = GAP;
          scale = 0.5;
          opacity = 0.5;
      }
      // Far Prev (-2)
      else if (position === -2) {
          translateX = -GAP * 1.6;
          scale = 0.3;
          opacity = 0.2;
      }
      // Far Next (2)
      else if (position === 2) {
          translateX = GAP * 1.6;
          scale = 0.3;
          opacity = 0.2;
      }

      // Swipe Interaction
      if (isSwiping && touchMoveX !== 0) {
          const diff = touchMoveX - touchStartX;
          const screenWidth = window.innerWidth;
          const dragPercent = (diff / screenWidth) * 100;

          if (position === 0) {
              translateX = dragPercent;
              scale = 1 - Math.abs(dragPercent/100) * 0.5; // Scale down towards 0.5
          } else if (position === -1) {
              // If dragging right (prev comes in), move towards 0, scale up
              if (dragPercent > 0) {
                  translateX = -GAP + dragPercent;
                  // Lerp scale from 0.5 to 1
                  scale = 0.5 + (dragPercent/100) * 0.5;
                  opacity = 0.5 + (dragPercent/100) * 0.5;
              } else {
                  translateX = -GAP; 
              }
          } else if (position === 1) {
              // If dragging left (next comes in), move towards 0, scale up
              if (dragPercent < 0) {
                  translateX = GAP + dragPercent;
                  // Lerp scale from 0.5 to 1
                  scale = 0.5 + (Math.abs(dragPercent)/100) * 0.5;
                  opacity = 0.5 + (Math.abs(dragPercent)/100) * 0.5;
              } else {
                  translateX = GAP;
              }
          }
      }

      const isCurrent = position === 0;
      
      const style: React.CSSProperties = {
          // Use Grid layout instead of absolute/relative swap
          gridArea: '1 / 1',
          
          willChange: 'transform, opacity',
          // Optimize transition: avoid 'all', use specific properties and easing
          transition: isSwiping ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
          zIndex: zIndex,
          opacity: opacity,
          transform: `translateX(${translateX}%) scale(${scale})`,
          transformOrigin: 'center center',
          pointerEvents: isCurrent ? 'auto' : 'none', // Only current is interactive
      };

      return (
          <div key={repo.id} style={style} className="w-full flex items-center justify-center p-4">
              <div className="w-full max-w-[900px]">
                  <RepoCard 
                      repo={repo} 
                      analysis={repo.summary ? repo.summary : null} 
                      loading={false}
                      onNext={handleNext}
                      onViewDetails={handleViewDetails}
                  />
              </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-primary/30 relative flex flex-col overflow-x-hidden">
      {/* Background Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 mesh-bg opacity-60"></div>
      
      {/* Navbar */}
      <Navbar 
        onOpenAdmin={handleOpenAdmin} 
        onRefresh={handleRefresh}
        onShuffle={handleShuffle}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content */}
      <main className="flex-1 relative z-10 w-full flex flex-col items-center min-h-0"> 
        
        {loading && repos.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-500 gap-4 h-[50vh]">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p>正在加载项目...</p>
            </div>
        ) : error && repos.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-red-400 gap-4 h-[50vh]">
                <Icon name="error" className="text-4xl" />
                <p>{error}</p>
                <button onClick={handleRefresh} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20">重试</button>
            </div>
        ) : (
            <div 
                ref={containerRef}
                className="flex-1 grid place-items-center relative w-full max-w-[1400px] mx-auto perspective-1000 touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Desktop Navigation Buttons - Fixed Position relative to screen */}
                <div className="hidden md:flex fixed top-1/2 left-8 -translate-y-1/2 z-50">
                    <button 
                        onClick={handlePrev}
                        disabled={repos.length === 0}
                        className={`w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white transition-all hover:bg-white/10 hover:scale-110 active:scale-95 ${repos.length === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
                    >
                        <Icon name="arrow_back" className="text-2xl" />
                    </button>
                </div>
                <div className="hidden md:flex fixed top-1/2 right-8 -translate-y-1/2 z-50">
                     <button 
                        onClick={handleNext}
                        disabled={repos.length === 0}
                        className={`w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white transition-all hover:bg-white/10 hover:scale-110 active:scale-95 ${repos.length === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100'}`}
                    >
                        <Icon name="arrow_forward" className="text-2xl" />
                    </button>
                </div>

                {(() => {
                    const N = repos.length;
                    if (N === 0) return null;
                    
                    const indices = new Set<number>();
                    // Only render visible range (-2 to +2)
                    for (let i = -2; i <= 2; i++) {
                        indices.add(((currentIndex + i) % N + N) % N);
                    }
                    
                    return Array.from(indices).map(index => renderCard(repos[index], index));
                })()}
            </div>
        )}

      </main>

      {/* Modals */}
      <AdminModal 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
      />
      
      {currentRepo && (
        <ReadmeModal
            isOpen={isReadmeOpen}
            onClose={() => setIsReadmeOpen(false)}
            repo={currentRepo}
        />
      )}
    </div>
  );
};

export default App;
