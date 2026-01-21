import React from 'react';
import { Repo, AIAnalysis } from '../types';
import { Icon } from '../constants';

interface RepoCardProps {
  repo: Repo;
  analysis: AIAnalysis | null;
  loading: boolean;
  onNext: () => void;
  onViewDetails: () => void;
}

export const RepoCard = React.memo<RepoCardProps>(({ repo, analysis, loading, onNext, onViewDetails }) => {
  
  return (
    <div className="glass-panel w-full max-w-[900px] rounded-3xl overflow-hidden relative transition-all duration-500 md:hover:shadow-[0_0_50px_-12px_rgba(13,89,242,0.25)] flex flex-col md:min-h-[600px]">
      
      {/* Top Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent"></div>

      <div className="p-8 md:p-12 flex flex-col flex-1 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
            <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 p-1 shrink-0 overflow-hidden">
                    <img 
                        src={repo.ownerAvatar} 
                        alt={repo.ownerLogin}
                        loading="lazy"
                        className="w-full h-full rounded-xl object-cover" 
                    />
                </div>
                <div>
                    <p className="font-mono text-sm font-medium text-primary uppercase tracking-widest mb-1 opacity-80">
                        {repo.ownerLogin} /
                    </p>
                    <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-none break-all">
                        {repo.name}
                    </h1>
                </div>
            </div>

            {/* Stats Pills */}
            <div className="flex items-center gap-3 bg-black/50 rounded-xl p-2 border border-white/5 self-start md:self-center shrink-0">
                <div className="flex items-center gap-1.5 px-2 text-yellow-400">
                    <Icon name="star" className="text-[18px]" fill />
                    <span className="text-sm font-bold font-mono text-white">
                        {(repo.stars / 1000).toFixed(1)}k
                    </span>
                </div>
                <div className="w-[1px] h-4 bg-white/10"></div>
                <div className="flex items-center gap-1.5 px-2 text-slate-400">
                    <Icon name="call_split" className="text-[18px]" />
                    <span className="text-sm font-bold font-mono text-white">
                        {(repo.forks / 1000).toFixed(1)}k
                    </span>
                </div>
                <div className="w-[1px] h-4 bg-white/10"></div>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails();
                    }}
                    className="flex items-center gap-1.5 px-2 text-primary hover:text-primary-light transition-colors group"
                >
                    <Icon name="description" className="text-[18px]" />
                    <span className="text-sm font-bold text-white group-hover:text-primary transition-colors whitespace-nowrap">
                        详情
                    </span>
                </button>
            </div>
        </div>

        {/* AI Content Area */}
        <div className="flex-1">
            {loading ? (
                 <div className="space-y-4 animate-pulse">
                    <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden mb-8">
                        <div className="px-5 py-3 border-b border-white/5 bg-white/5 flex items-center gap-2">
                            <div className="h-4 w-4 bg-white/10 rounded"></div>
                            <div className="h-4 w-32 bg-white/10 rounded"></div>
                        </div>
                        <div className="p-6 space-y-2">
                            <div className="h-4 bg-white/5 rounded w-full"></div>
                            <div className="h-4 bg-white/5 rounded w-[90%]"></div>
                            <div className="h-4 bg-white/5 rounded w-[95%]"></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 hidden md:grid">
                        <div className="h-32 bg-white/5 rounded-xl"></div>
                        <div className="h-32 bg-white/5 rounded-xl"></div>
                    </div>
                </div>
            ) : analysis ? (
                <div className="animate-[fadeIn_0.5s_ease-out]">
                    <div className="bg-black/20 border border-white/10 rounded-xl overflow-hidden mb-8">
                        <div className="bg-white/5 px-5 py-3 border-b border-white/5">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <span className="text-slate-500">=</span> 核心摘要 (CORE SUMMARY)
                            </h3>
                        </div>
                        <div className="p-5">
                            <p className="text-sm text-slate-300 leading-relaxed text-justify">
                                {analysis.coreSummary}
                            </p>
                        </div>
                    </div>

                    <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Features */}
                        <div className="bg-white/5 border border-white/5 rounded-xl p-5 hover:bg-white/10 transition-colors">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Icon name="feature_search" className="text-[18px]" /> 主要功能 (FEATURES)
                            </h3>
                            <ul className="space-y-3">
                                {analysis.features.map((f, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <Icon name="check_circle" className="text-emerald-500 text-[18px] mt-0.5" fill />
                                        <span className="text-sm text-slate-300">{f}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                         {/* Use Cases */}
                         <div className="bg-white/5 border border-white/5 rounded-xl p-5 hover:bg-white/10 transition-colors">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Icon name="lightbulb" className="text-[18px]" /> 应用场景 (USE CASES)
                            </h3>
                            <ul className="space-y-3">
                                {analysis.useCases.map((u, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></div>
                                        <span className="text-sm text-slate-300">{u}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-10 text-slate-500">
                    无法生成分析结果，请检查 API 设置。
                </div>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
                <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-300 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div> {repo.language || '未知语言'}
                </span>
                {repo.topics.slice(0, 4).map(topic => (
                     <span key={topic} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-400">
                        {topic}
                     </span>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
});
