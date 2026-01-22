import React, { useState, useEffect, useRef } from 'react';
import { login, changePassword, getConfigs, updateConfigs, triggerFetch, getJobStatus, getRepos, testAiConfig, testGithubConfig, addRepo, deleteRepo, reAnalyzeRepo, getRepoDetail, cleanupRepos } from '../services/api';
import { AppConfig, Repo } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ... existing code ...

const RepoDetailModal = ({ repo, onClose }: { repo: Repo; onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s]">
            <div className="w-full max-w-6xl bg-[#0e1015] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#151922]">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <img src={repo.ownerAvatar} className="w-6 h-6 rounded-full" />
                        {repo.fullName}
                    </h2>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-hidden flex">
                    <div className="flex-1 grid grid-cols-2 divide-x divide-white/5 h-full">
                        {/* Original */}
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="p-3 bg-white/5 border-b border-white/5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                                原始描述 (GitHub)
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div>
                                    <h4 className="text-sm font-bold text-primary mb-2">Description</h4>
                                    <p className="text-slate-300 text-sm leading-relaxed">{repo.description || 'No description provided.'}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-primary mb-2">Topics</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {repo.topics?.map(t => (
                                            <span key={t} className="px-2 py-1 bg-white/5 rounded text-xs text-slate-400">{t}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* AI Summary */}
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="p-3 bg-white/5 border-b border-white/5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                                AI 智能分析
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {repo.summary ? (
                                    <>
                                        <div className="bg-black/20 border border-white/10 rounded-xl overflow-hidden mb-6">
                                            <div className="bg-white/5 px-4 py-3 border-b border-white/5">
                                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                    <span className="text-slate-500">=</span> 核心摘要 (CORE SUMMARY)
                                                </h3>
                                            </div>
                                            <div className="p-4">
                                                <p className="text-sm text-slate-300 leading-relaxed text-justify">
                                                    {repo.summary.coreSummary}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-primary mb-2">主要功能 (FEATURES)</h4>
                                            <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                                                {repo.summary.features.map((f, i) => <li key={i}>{f}</li>)}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-primary mb-2">应用场景 (USE CASES)</h4>
                                            <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm">
                                                {repo.summary.useCases.map((u, i) => <li key={i}>{u}</li>)}
                                            </ul>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                                        <span className="material-symbols-outlined text-4xl">smart_toy</span>
                                        <p>暂无 AI 分析数据</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AI_PROVIDERS = [
    { id: 'gemini', name: 'Google Gemini' },
    { id: 'deepseek', name: 'DeepSeek (深度求索)', preset: { url: 'https://api.deepseek.com', model: 'deepseek-chat' } },
    { id: 'siliconflow', name: 'SiliconCloud (硅基流动)', preset: { url: 'https://api.siliconflow.cn/v1', model: 'deepseek-ai/DeepSeek-V3' } },
    { id: 'bigmodel', name: 'Zhipu BigModel (智谱)', preset: { url: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4' } },
    { id: 'openrouter', name: 'OpenRouter', preset: { url: 'https://openrouter.ai/api/v1', model: 'google/gemini-2.0-flash-exp:free' } },
    { id: 'custom', name: 'Custom / Other (OpenAI Compatible)', preset: { url: '', model: '' } },
];

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [activeTab, setActiveTab] = useState<'config' | 'projects'>('config');
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Config State
  const [configs, setConfigs] = useState<Partial<AppConfig>>({});
  
  // Project State
  const [repos, setRepos] = useState<Repo[]>([]);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [totalRepos, setTotalRepos] = useState(0);
  const [repoPage, setRepoPage] = useState(1);
  const repoPageRef = useRef(repoPage);

  useEffect(() => {
    repoPageRef.current = repoPage;
  }, [repoPage]);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingGithub, setTestingGithub] = useState(false);
  const [testStatus, setTestStatus] = useState<{success?: boolean, message?: string, duration?: number} | null>(null);
  const [testGithubStatus, setTestGithubStatus] = useState<{success?: boolean, message?: string} | null>(null);
  const [msg, setMsg] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [manualRepo, setManualRepo] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', content: '', onConfirm: () => {} });

  // Password Change State
  const [changePasswordOld, setChangePasswordOld] = useState('');
  const [changePasswordNew, setChangePasswordNew] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  // New State for Detail View
  const [viewingRepo, setViewingRepo] = useState<Repo | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  // New Handlers
  const handleView = async (repo: Repo) => {
      setLoadingDetail(true);
      try {
          const detail = await getRepoDetail(token!, repo.id);
          setViewingRepo(detail);
      } catch (e) {
          alert('获取详情失败');
      } finally {
          setLoadingDetail(false);
      }
  };

  const handleDelete = async (id: number) => {
      setConfirmModal({
          isOpen: true,
          title: '确认删除',
          content: '确定要删除该项目吗？此操作无法撤销。',
          onConfirm: async () => {
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
              try {
                  await deleteRepo(token!, id);
                  setMsg('删除成功');
                  refreshRepos();
              } catch (e: any) {
                  alert(`删除失败: ${e.message}`);
              }
          }
      });
  };

  const handleReAnalyze = async (id: number) => {
      try {
          await reAnalyzeRepo(token!, id);
          setMsg('已触发重新分析');
          refreshRepos();
      } catch (e: any) {
          alert(`请求失败: ${e.message}`);
      }
  };

  const handleCleanup = async () => {
      if (!token) return;
      setConfirmModal({
          isOpen: true,
          title: '确认清理',
          content: '确定要清理所有没有描述且没有 Readme 的项目吗？这将无法恢复。',
          onConfirm: async () => {
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
              setLoading(true);
              try {
                  const res = await cleanupRepos(token);
                  setMsg(`清理完成，共删除 ${res.count} 个项目`);
                  refreshRepos();
              } catch (e: any) {
                  setMsg(`清理失败: ${e.message}`);
              } finally {
                  setLoading(false);
              }
          }
      });
  };

  const handleChangePassword = async () => {
      if (!token || !changePasswordOld || !changePasswordNew) return;
      setChangePasswordLoading(true);
      try {
          await changePassword(token, changePasswordOld, changePasswordNew);
          setMsg('密码修改成功');
          setChangePasswordOld('');
          setChangePasswordNew('');
          setTimeout(() => setMsg(''), 2000);
      } catch (e: any) {
          setMsg(`修改失败: ${e.message}`);
      } finally {
          setChangePasswordLoading(false);
      }
  };

  const togglePassword = (key: string) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (isOpen && token) {
      loadConfigs();
      loadRepos();
      startPolling();
    }
    return () => stopPolling();
  }, [isOpen, token]);

  const startPolling = () => {
    stopPolling();
    pollInterval.current = setInterval(async () => {
        try {
            const status = await getJobStatus(token!);
            setJobStatus(status);
            if (status.state === 'completed' || status.state === 'idle') {
                refreshRepos(); // Refresh list when done
            }
        } catch (e) {
            // ignore
        }
    }, 2000);
  };

  const stopPolling = () => {
    if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await login(username, password);
      setToken(res.token);
      localStorage.setItem('admin_token', res.token);
      setMsg('');
    } catch (e) {
      setMsg('登录失败');
    } finally {
      setLoading(false);
    }
  };

  const loadConfigs = async () => {
    if (!token) return;
    try {
      const data = await getConfigs(token);
      setConfigs(data);
    } catch (e) {
      if (e instanceof Error && e.message.includes('401')) {
          handleLogout();
      }
    }
  };

  const [loadingMore, setLoadingMore] = useState(false);

  // Helper to refresh list (reset to page 1)
  const refreshRepos = () => {
      if (repoPage === 1) {
          loadRepos();
      } else {
          setRepoPage(1);
      }
  };

  const loadRepos = async () => {
      try {
          const currentPage = repoPageRef.current;
          // If loading more pages (page > 1), don't show global loading
          if (currentPage === 1) {
              // optional: setLoading(true) if we want global spinner for first page
          }
          
          const res = await getRepos(currentPage, 10, searchQuery);
          
          setRepos(prev => {
              if (currentPage === 1) {
                  return res.data;
              } else {
                  // Append mode: avoid duplicates
                  const existingIds = new Set(prev.map(r => r.id));
                  const newItems = res.data.filter(r => !existingIds.has(r.id));
                  return [...prev, ...newItems];
              }
          });
          setTotalRepos(res.total);
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingMore(false);
      }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      // Threshold 50px
      if (scrollHeight - scrollTop - clientHeight < 50) {
          if (!loadingMore && repos.length < totalRepos) {
              setLoadingMore(true);
              setRepoPage(p => p + 1);
          }
      }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        if (repoPage === 1) {
            loadRepos();
        } else {
            setRepoPage(1);
        }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setMsg('已复制到剪贴板');
      setTimeout(() => setMsg(''), 2000);
  };

  useEffect(() => {
    if (activeTab === 'projects') {
        loadRepos();
    }
  }, [repoPage, activeTab]);

  const handleManualAdd = async () => {
    if (!manualRepo || !token) return;
    setManualLoading(true);
    try {
        await addRepo(token, manualRepo);
        setMsg('项目添加成功，后台正在进行 AI 分析...');
        setManualRepo('');
        refreshRepos();
    } catch (e: any) {
        setMsg(`添加失败: ${e.message}`);
    } finally {
        setManualLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token) return;
    setLoading(true);
    try {
      await updateConfigs(token, configs);
      setMsg('配置已保存');
      setTimeout(() => setMsg(''), 2000);
    } catch (e) {
      setMsg('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!token) return;
    setTesting(true);
    setTestStatus(null);
    try {
      const res = await testAiConfig(token, configs);
      setTestStatus(res);
    } catch (e) {
      setTestStatus({ success: false, message: 'Test request failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleTestGithub = async () => {
    if (!token) return;
    setTestingGithub(true);
    setTestGithubStatus(null);
    try {
      const res = await testGithubConfig(token, configs.PROXY_URL || '', configs.GITHUB_TOKEN || '');
      setTestGithubStatus(res);
    } catch (e) {
      setTestGithubStatus({ success: false, message: 'Test failed' });
    } finally {
      setTestingGithub(false);
    }
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const providerId = e.target.value;
      const provider = AI_PROVIDERS.find(p => p.id === providerId);
      const updates: any = { AI_PROVIDER: providerId };
      
      if (provider?.preset && provider.id !== 'custom') {
          updates.OPENAI_BASE_URL = provider.preset.url;
          updates.OPENAI_MODEL = provider.preset.model;
      }
      setConfigs({ ...configs, ...updates });
  };

  const handleTrigger = async () => {
      if (!token) return;
      try {
          await triggerFetch(token);
          setMsg('已触发后台拉取任务');
          startPolling();
      } catch(e) {
          setMsg('触发失败');
      }
  };

  const handleLogout = () => {
      setToken(null);
      localStorage.removeItem('admin_token');
      stopPolling();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s]">
      {/* Glow Effect for Login */}
      {!token && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[360px] h-[400px] bg-gradient-to-r from-primary to-purple-600 rounded-full opacity-20 blur-3xl pointer-events-none"></div>
      )}

      <div className={`relative flex flex-col transition-all duration-300 ${
        token 
          ? 'w-full max-w-5xl h-[85vh] bg-[#0e1015] border border-white/10 rounded-xl shadow-2xl overflow-hidden' 
          : 'w-full max-w-[380px] glass-panel rounded-2xl shadow-2xl p-8'
      }`}>
        
        {/* Close Button for Login State */}
        {!token && (
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-1"
            >
                <span className="material-symbols-outlined">close</span>
            </button>
        )}

        {/* Admin Header - Only show when logged in */}
        {token && (
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#151922]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                后台管理
              </h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
        )}

        <div className={`flex-1 flex flex-col ${token ? 'overflow-hidden' : ''}`}>
          {!token ? (
            <div className="flex flex-col items-center w-full">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 ring-1 ring-white/10">
                    <span className="material-symbols-outlined text-2xl text-primary">admin_panel_settings</span>
                </div>
                
                <h3 className="text-white font-bold text-xl mb-2">管理员登录</h3>
                <p className="text-slate-400 text-sm mb-8">请验证您的身份以继续</p>
                
                <div className="w-full space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 ml-1">用户名</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                <span className="material-symbols-outlined text-[20px]">person</span>
                            </div>
                            <input
                                type="text"
                                placeholder="Admin Username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-primary/50 focus:bg-black/60 outline-none transition-all placeholder:text-slate-600"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 ml-1">密码</label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                                <span className="material-symbols-outlined text-[20px]">lock</span>
                            </div>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:border-primary/50 focus:bg-black/60 outline-none transition-all placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 mt-2"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                                <span>验证中...</span>
                            </div>
                        ) : '立即登录'}
                    </button>
                    
                    {msg && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 animate-[shake_0.5s]">
                            <span className="material-symbols-outlined text-red-400 text-sm">error</span>
                            <p className="text-red-400 text-xs">{msg}</p>
                        </div>
                    )}
                </div>
            </div>
          ) : (
            <>
                <div className="flex border-b border-white/5 bg-[#151922]/50">
                    <button 
                        onClick={() => setActiveTab('config')}
                        className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'config' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-white'}`}
                    >
                        系统配置
                    </button>
                    <button 
                        onClick={() => setActiveTab('projects')}
                        className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'projects' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-white'}`}
                    >
                        项目管理
                    </button>
                    <div className="flex-1 flex justify-end items-center px-4">
                         <button onClick={handleLogout} className="text-slate-500 hover:text-white text-sm flex items-center gap-1">
                             <span className="material-symbols-outlined text-[16px]">logout</span> 退出
                         </button>
                    </div>
                </div>

                <div 
                    className="p-6 overflow-y-auto custom-scrollbar flex-1"
                    onScroll={handleScroll}
                >
                    {activeTab === 'config' ? (
                        <div className="space-y-6 max-w-2xl mx-auto">
                            {/* ... Config Form ... */}
                             <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">通用配置</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">拉取频率 (分钟)</label>
                                        <input
                                            type="number"
                                            value={configs.PULL_FREQUENCY_MINUTES || ''}
                                            onChange={e => setConfigs({ ...configs, PULL_FREQUENCY_MINUTES: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-sm focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">拉取数量 (每次)</label>
                                        <input
                                            type="number"
                                            value={configs.PULL_COUNT || '10'}
                                            onChange={e => setConfigs({ ...configs, PULL_COUNT: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-sm focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">拉取类型</label>
                                        <select
                                            value={configs.PULL_TYPE || 'trending'}
                                            onChange={e => setConfigs({ ...configs, PULL_TYPE: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-sm focus:border-primary outline-none"
                                        >
                                            <option value="trending">Trending (7天最热)</option>
                                            <option value="newest">Newest (最新更新)</option>
                                        </select>
                                    </div>
                                </div>

                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pt-4">AI 配置</h3>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Provider</label>
                                    <select
                                        value={configs.AI_PROVIDER || 'gemini'}
                                        onChange={handleProviderChange}
                                        className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-sm focus:border-primary outline-none"
                                    >
                                        {AI_PROVIDERS.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                {configs.AI_PROVIDER === 'gemini' ? (
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Gemini API Key</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords['gemini'] ? 'text' : 'password'}
                                                value={configs.GEMINI_API_KEY || ''}
                                                onChange={e => setConfigs({ ...configs, GEMINI_API_KEY: e.target.value })}
                                                className="w-full bg-black/20 border border-white/10 rounded p-2 pr-10 text-white text-sm font-mono focus:border-primary outline-none"
                                            />
                                            <button 
                                                onClick={() => togglePassword('gemini')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                            >
                                                <span className="material-symbols-outlined text-sm">
                                                    {showPasswords['gemini'] ? 'visibility_off' : 'visibility'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Base URL</label>
                                            <input
                                                value={configs.OPENAI_BASE_URL || ''}
                                                onChange={e => setConfigs({ ...configs, OPENAI_BASE_URL: e.target.value })}
                                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-sm font-mono focus:border-primary outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">API Key</label>
                                            <div className="relative">
                                                <input
                                                    type={showPasswords['openai'] ? 'text' : 'password'}
                                                    value={configs.OPENAI_API_KEY || ''}
                                                    onChange={e => setConfigs({ ...configs, OPENAI_API_KEY: e.target.value })}
                                                    className="w-full bg-black/20 border border-white/10 rounded p-2 pr-10 text-white text-sm font-mono focus:border-primary outline-none"
                                                />
                                                <button 
                                                    onClick={() => togglePassword('openai')}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                                >
                                                    <span className="material-symbols-outlined text-sm">
                                                        {showPasswords['openai'] ? 'visibility_off' : 'visibility'}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Model</label>
                                            <input
                                                value={configs.OPENAI_MODEL || ''}
                                                onChange={e => setConfigs({ ...configs, OPENAI_MODEL: e.target.value })}
                                                className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-sm font-mono focus:border-primary outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-4 pt-2">
                                    <button 
                                        onClick={handleTest}
                                        disabled={testing}
                                        className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-slate-300 transition-colors flex items-center gap-1 disabled:opacity-50"
                                    >
                                        {testing ? <span className="material-symbols-outlined text-sm animate-spin">sync</span> : <span className="material-symbols-outlined text-sm">check_circle</span>}
                                        {testing ? '测试连接中...' : '测试连接'}
                                    </button>
                                    {testStatus && (
                                        <span className={`text-xs ${testStatus.success ? 'text-green-400' : 'text-red-400'}`}>
                                            {testStatus.message} {testStatus.duration ? `(${testStatus.duration}ms)` : ''}
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pt-4">GitHub 配置</h3>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">GitHub Token</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords['github'] ? 'text' : 'password'}
                                            value={configs.GITHUB_TOKEN || ''}
                                            onChange={e => setConfigs({ ...configs, GITHUB_TOKEN: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded p-2 pr-10 text-white text-sm font-mono focus:border-primary outline-none"
                                        />
                                        <button 
                                            onClick={() => togglePassword('github')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                        >
                                            <span className="material-symbols-outlined text-sm">
                                                {showPasswords['github'] ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                    <div className="pt-2 flex items-center gap-4">
                                        <button 
                                            onClick={handleTestGithub}
                                            disabled={testingGithub}
                                            className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-slate-300 transition-colors flex items-center gap-1 disabled:opacity-50"
                                        >
                                            {testingGithub ? <span className="material-symbols-outlined text-sm animate-spin">sync</span> : <span className="material-symbols-outlined text-sm">check_circle</span>}
                                            {testingGithub ? '测试 GitHub...' : '测试 GitHub 连接'}
                                        </button>
                                        {testGithubStatus && (
                                            <span className={`text-xs ${testGithubStatus.success ? 'text-green-400' : 'text-red-400'}`}>
                                                {testGithubStatus.message}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-xs text-slate-500 mb-1">代理地址 (可选)</label>
                                    <input
                                        type="text"
                                        placeholder="例如 http://192.168.31.60:7890"
                                        value={configs.PROXY_URL || ''}
                                        onChange={e => setConfigs({ ...configs, PROXY_URL: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-sm font-mono focus:border-primary outline-none"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        如果部署在 Docker 中，请使用宿主机局域网 IP (如 192.168.x.x)，<span className="text-orange-400">不要使用 127.0.0.1 或 localhost</span>。
                                        同时请确保代理软件已开启"允许局域网连接"。
                                    </p>
                                </div>
                             </div>

                             <div className="pt-4 border-t border-white/5">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">修改密码</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">当前密码</label>
                                        <input
                                            type="password"
                                            value={changePasswordOld}
                                            onChange={e => setChangePasswordOld(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-sm focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">新密码</label>
                                        <input
                                            type="password"
                                            value={changePasswordNew}
                                            onChange={e => setChangePasswordNew(e.target.value)}
                                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-sm focus:border-primary outline-none"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={handleChangePassword}
                                            disabled={changePasswordLoading || !changePasswordOld || !changePasswordNew}
                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-slate-300 text-sm transition-colors disabled:opacity-50"
                                        >
                                            {changePasswordLoading ? '修改中...' : '修改密码'}
                                        </button>
                                    </div>
                                </div>
                             </div>
                             
                             <div className="pt-4 flex justify-end border-t border-white/5">
                                <button 
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-6 py-2 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                                >
                                    {loading ? '保存中...' : '保存配置'}
                                </button>
                             </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Manual Add */}
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="输入项目名称 (例如 facebook/react)" 
                                    value={manualRepo}
                                    onChange={e => setManualRepo(e.target.value)}
                                    className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-primary outline-none"
                                    onKeyDown={e => e.key === 'Enter' && handleManualAdd()}
                                />
                                <button 
                                    onClick={handleManualAdd}
                                    disabled={manualLoading || !manualRepo}
                                    className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {manualLoading ? <span className="material-symbols-outlined text-sm animate-spin">sync</span> : <span className="material-symbols-outlined text-sm">add</span>}
                                    添加
                                </button>
                            </div>

                            <div className="flex justify-between items-start bg-black/20 p-4 rounded-lg border border-white/5">
                                <div>
                                    <h3 className="text-white font-bold mb-1">拉取任务状态</h3>
                                    {jobStatus ? (
                                        <div className="text-sm space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${jobStatus.state === 'fetching' || jobStatus.state === 'processing' ? 'bg-yellow-400 animate-pulse' : jobStatus.state === 'error' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                                <span className="text-slate-300 capitalize">{{ idle: '空闲', fetching: '拉取中', processing: '处理中', completed: '完成', error: '错误' }[jobStatus.state as string] || jobStatus.state}</span>
                                            </div>
                                            <p className="text-slate-400">{jobStatus.message}</p>
                                            {jobStatus.total > 0 && (
                                                <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                                                    <div 
                                                        className="bg-primary h-full transition-all duration-300"
                                                        style={{ width: `${(jobStatus.processed / jobStatus.total) * 100}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-sm">暂无任务运行</p>
                                    )}
                                </div>
                                <button 
                                    onClick={handleTrigger}
                                    className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">sync</span>
                                    立即拉取
                                </button>
                            </div>

                            <div>
                                <h3 className="text-white font-bold mb-4 flex justify-between items-center">
                                    <span>已保存项目 ({totalRepos})</span>
                                    <div className="flex gap-2">
                                        <button onClick={handleCleanup} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 border border-red-400/20 px-2 py-1 rounded hover:bg-red-400/10 transition-colors">
                                            <span className="material-symbols-outlined text-[14px]">delete_sweep</span> 清理无效项目
                                        </button>
                                        <button onClick={refreshRepos} className="text-slate-500 hover:text-white text-xs flex items-center gap-1 border border-white/10 px-2 py-1 rounded hover:bg-white/5 transition-colors">
                                            <span className="material-symbols-outlined text-[14px]">refresh</span> 刷新
                                        </button>
                                    </div>
                                </h3>



                                {/* Search Control */}
                                <div className="mb-4 relative">
                                    <input 
                                        type="text" 
                                        placeholder="搜索项目..." 
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-2 pl-9 text-white text-sm focus:border-primary outline-none"
                                    />
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                                </div>

                                <div className="border border-white/10 rounded-lg overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-white/5 text-slate-400">
                                            <tr>
                                                <th className="p-3 font-medium">项目名称</th>
                                                <th className="p-3 font-medium">Stars</th>
                                                <th className="p-3 font-medium">AI 分析</th>
                                                <th className="p-3 font-medium">更新时间</th>
                                                <th className="p-3 font-medium text-right">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {repos.map(repo => (
                                                <tr key={repo.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="p-3 text-white">
                                                        <a href={repo.htmlUrl} target="_blank" className="hover:text-primary flex items-center gap-2">
                                                            <img src={repo.ownerAvatar} className="w-5 h-5 rounded-full" />
                                                            {repo.fullName}
                                                        </a>
                                                    </td>
                                                    <td className="p-3 text-slate-300">{(repo.stars / 1000).toFixed(1)}k</td>
                                                    <td className="p-3">
                                                        {repo.summary ? (
                                                            <span className="text-green-400 text-xs px-2 py-0.5 bg-green-400/10 rounded">已完成</span>
                                                        ) : (
                                                            <div className="flex items-center gap-1 text-yellow-500 text-xs px-2 py-0.5 bg-yellow-500/10 rounded w-fit">
                                                                <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
                                                                <span>处理中</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-slate-500 text-xs">
                                                        {new Date(repo.updatedAt).toLocaleString('zh-CN', { 
                                                            year: 'numeric', 
                                                            month: '2-digit', 
                                                            day: '2-digit', 
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        })}
                                                    </td>
                                                    <td className="p-3 flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleCopy(repo.fullName)}
                                                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                                            title="复制名称"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">content_copy</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleView(repo)}
                                                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                                            title="查看详情与对比"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">visibility</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(repo.id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                                            title="删除项目"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">delete</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {repos.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                                        暂无数据
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                
                                {loadingMore && (
                                    <div className="flex justify-center items-center p-4">
                                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                                            <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                                            加载更多...
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                {msg && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 text-white text-sm rounded-lg backdrop-blur border border-white/10">{msg}</div>}
            </>
          )}
        </div>
      </div>
      {/* Readme Modal */}
      {viewingRepo && (
        <RepoDetailModal 
            repo={viewingRepo} 
            onClose={() => setViewingRepo(null)} 
        />
      )}
      {loadingDetail && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4">
                  <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
                  <p className="text-white font-bold">加载详情中...</p>
              </div>
          </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        content={confirmModal.content}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
