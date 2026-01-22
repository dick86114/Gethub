import React, { useEffect, useState } from 'react';
import { Repo } from '../types';
import { Icon } from '../constants';
import { analyzeContent } from '../services/api';
import { marked } from 'marked';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
  repo: Repo | null;
  settings?: any; 
}

export const ReadmeModal: React.FC<ReadmeModalProps> = ({ isOpen, onClose, repo }) => {
  const [content, setContent] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    if (isOpen && repo) {
        setAnalysisResult(null);
        setShowAnalysis(false);
        if (repo.readme) {
            setContent(repo.readme);
        } else {
            setContent('<p class="text-slate-400 p-8 text-center">暂无文档内容</p>');
        }
    }
  }, [isOpen, repo]);

  const handleAnalyze = async () => {
      if (!repo?.readme || isAnalyzing) return;
      
      // If already analyzed, just toggle
      if (analysisResult) {
          setShowAnalysis(!showAnalysis);
          return;
      }

      setIsAnalyzing(true);
      try {
          const result = await analyzeContent(repo.readme);
          const parsedHtml = await marked.parse(result);
          
          const html = `<div class="markdown-analysis p-6 bg-[#161b22] rounded-xl border border-primary/20 mb-8 shadow-inner">
            <h3 class="text-base font-bold text-primary mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-lg">auto_awesome</span>
                AI 深度分析
            </h3>
            <div class="prose prose-invert prose-sm max-w-none prose-headings:text-slate-200 prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white prose-code:text-primary prose-pre:bg-black/30">
                ${parsedHtml}
            </div>
          </div>`;
          
          setAnalysisResult(html);
          setShowAnalysis(true);
      } catch (e) {
          console.error("Analysis failed", e);
          alert("分析失败，请稍后重试");
      } finally {
          setIsAnalyzing(false);
      }
  };

  if (!isOpen || !repo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-[#1b212d] border border-white/10 w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#151922]">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-white/5 p-0.5 overflow-hidden">
                <img src={repo.ownerAvatar} alt="" className="w-full h-full rounded" />
             </div>
             <div>
                <h3 className="text-base font-bold text-white leading-none">{repo.name}</h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    README.md
                </p>
             </div>
          </div>
          <div className="flex gap-2">
            <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !repo.readme}
                title={showAnalysis ? "隐藏 AI 分析" : "AI 深度分析"}
                className={`p-2 rounded-lg transition-colors ${
                    showAnalysis 
                        ? 'text-primary bg-primary/10 hover:bg-primary/20' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                } ${isAnalyzing ? 'opacity-70 cursor-wait' : ''}`}
            >
                {isAnalyzing ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Icon name="auto_awesome" className="text-[20px]" />
                )}
            </button>
            <a 
                href={repo.htmlUrl} 
                target="_blank" 
                rel="noreferrer"
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                title="在 GitHub 上查看"
            >
                <Icon name="open_in_new" className="text-[20px]" />
            </a>
            <button 
                onClick={onClose} 
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
                <Icon name="close" className="text-[20px]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#0d1117]">
            {/* Auto Summary (Core Summary) */}
            {repo.summary?.coreSummary && (
                <div className="mb-6 space-y-4">
                    <div className="bg-black/20 border border-white/10 rounded-xl overflow-hidden mb-6">
                        <div className="bg-white/5 px-5 py-3 border-b border-white/5">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <span className="text-slate-500">=</span> 核心摘要 (CORE SUMMARY)
                            </h3>
                        </div>
                        <div className="p-5">
                            <p className="text-sm text-slate-300 leading-relaxed text-justify">
                                {repo.summary.coreSummary}
                            </p>
                        </div>
                    </div>

                    {/* Features & Use Cases Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {/* Features */}
                         <div className="bg-white/5 border border-white/5 rounded-lg p-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Icon name="feature_search" className="text-[16px]" /> 主要功能 (FEATURES)
                            </h3>
                            <ul className="space-y-2">
                                {repo.summary.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <Icon name="check_circle" className="text-emerald-500 text-[16px] mt-0.5" fill />
                                        <span className="text-sm text-slate-300">{f}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                         {/* Use Cases */}
                         <div className="bg-white/5 border border-white/5 rounded-lg p-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Icon name="lightbulb" className="text-[16px]" /> 应用场景 (USE CASES)
                            </h3>
                            <ul className="space-y-2">
                                {repo.summary.useCases.map((u, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                                        <span className="text-sm text-slate-300">{u}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {showAnalysis && analysisResult && (
                 <div 
                    className="mb-8 animate-[fadeIn_0.3s_ease-out]"
                    dangerouslySetInnerHTML={{ __html: analysisResult }}
                />
            )}
            <div 
                className="readme-content prose prose-invert max-w-none prose-pre:bg-[#161b22] prose-pre:border prose-pre:border-[#30363d] prose-img:rounded-lg"
                dangerouslySetInnerHTML={{ __html: content }}
            />
        </div>
      </div>
    </div>
  );
};
