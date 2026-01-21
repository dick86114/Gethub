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

  // Swipe State
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchMoveX, setTouchMoveX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();

  // Load Repos
  const loadRepos = useCallback(async (pageNum: number, isInitial = false) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    
    try {
      const res = await getRepos(pageNum, 10);
      if (res.data && res.data.length > 0) {
          if (isInitial) {
              setRepos(res.data);
          } else {
              setRepos(prev => [...prev, ...res.data]);
          }
          setHasMore(res.data.length === 10);
      } else {
          setHasMore(false);
          if (isInitial) setError("暂无数据，请进入后台拉取数据");
      }
    } catch (err: any) {
      setError("连接服务器失败");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Initial Load
  useEffect(() => {
    loadRepos(1, true);
  }, []);

  // Load more when reaching end
  useEffect(() => {
    if (repos.length > 0 && currentIndex >= repos.length - 2 && hasMore && !loading) {
        setPage(p => {
            const nextPage = p + 1;
            loadRepos(nextPage);
            return nextPage;
        });
    }
  }, [currentIndex, repos.length, hasMore, loading, loadRepos]);

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

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

      // Important: Use 'relative' for the active card so it takes up space in the document flow,
      // allowing the page to scroll if the card is tall.
      // Use 'absolute' for others so they stack behind/beside without affecting layout height.
      const isCurrent = position === 0;
      
      const style: React.CSSProperties = {
          position: isCurrent ? 'relative' : 'absolute',
          top: isCurrent ? 'auto' : 0,
          left: isCurrent ? 'auto' : 0, // 'auto' allows flex centering to work if relative
          width: '100%',
          // height: isCurrent ? 'auto' : '100%', // Allow current to grow
          // Actually, if we use 'absolute', top/left 0 is relative to container.
          // If we use 'relative', it sits in the flex container.
          
          // But wait, if we mix relative and absolute, the absolute ones are relative to the parent.
          // If parent height is determined by the 'relative' child, then 'absolute' children with h-100% will match that height.
          // This is perfect.
          
          willChange: 'transform',
          transition: isSwiping ? 'none' : 'all 0.3s ease-out',
          zIndex: zIndex,
          opacity: opacity,
          transform: `translateX(${translateX}%) scale(${scale})`,
          transformOrigin: 'center center',
          pointerEvents: isCurrent ? 'auto' : 'none', // Only current is interactive
      };
      
      // Special handling for absolute positioning centering
      if (!isCurrent) {
          style.top = 0;
          style.left = 0;
      }

      return (
          <div key={repo.id} style={style} className={`w-full flex items-center justify-center p-4 ${!isCurrent ? 'h-full' : 'my-auto'}`}>
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
      
      {/* Main Content */}
      <main className="flex-1 relative z-10 w-full flex flex-col items-center min-h-0"> 
        {/* min-h-0 is important for nested flex scroll, but here we want main to grow and be scrollable if needed. 
            Actually, we removed overflow-hidden, so document body will scroll. 
            The main just takes space. */}
        
        {loading && repos.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-500 gap-4 h-[50vh]">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p>正在加载项目...</p>
            </div>
        ) : error && repos.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-red-400 gap-4 h-[50vh]">
                <Icon name="error" className="text-4xl" />
                <p>{error}</p>
                <button onClick={() => loadRepos(1, true)} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20">重试</button>
            </div>
        ) : (
            <div 
                ref={containerRef}
                className="flex-1 flex items-center justify-center relative w-full max-w-[1400px] mx-auto perspective-1000 touch-pan-y"
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

                {repos.map((repo, index) => renderCard(repo, index))}
            </div>
        )}

      </main>

      {/* Navbar */}
      <Navbar onOpenAdmin={handleOpenAdmin} />

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
