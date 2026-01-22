import { Repo, AppConfig } from '../types';

const API_BASE = '/api';

const handleResponse = async (res: Response, defaultError: string) => {
  if (res.status === 401) {
    throw new Error('401 Unauthorized');
  }
  if (!res.ok) {
    try {
      const data = await res.json();
      throw new Error(data.error || defaultError);
    } catch (e) {
      if (e instanceof Error && e.message.includes('401')) throw e;
      throw new Error(defaultError);
    }
  }
  return res.json();
};

export const getRandomRepo = async (): Promise<Repo | null> => {
  const res = await fetch(`${API_BASE}/repos/random`);
  if (!res.ok) return null;
  return res.json();
};

export const login = async (username: string, password: string): Promise<{ token: string }> => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
};

export const changePassword = async (token: string, oldPassword: string, newPassword: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ oldPassword, newPassword })
  });
  await handleResponse(res, 'Failed to change password');
};

export const getConfigs = async (token: string): Promise<AppConfig> => {
  const res = await fetch(`${API_BASE}/config`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(res, 'Failed to fetch config');
};

export const updateConfigs = async (token: string, configs: Partial<AppConfig>): Promise<void> => {
  const res = await fetch(`${API_BASE}/config`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(configs)
  });
  if (res.status === 401) throw new Error('401 Unauthorized');
  if (!res.ok) throw new Error('Failed to update config');
};

export const triggerFetch = async (token: string) => {
  const res = await fetch(`${API_BASE}/repos/fetch`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res, 'Failed to trigger fetch');
};

export const getJobStatus = async (token: string) => {
  const res = await fetch(`${API_BASE}/repos/job-status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res, 'Failed to get status');
};

export const getRepos = async (page = 1, limit = 10, search = '', sort = 'newest') => {
  const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      sort
  });
  const res = await fetch(`${API_BASE}/repos?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch repos');
  return res.json();
};

export const testAiConfig = async (token: string, config: any) => {
  const res = await fetch(`${API_BASE}/config/test-ai`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({
      provider: config.AI_PROVIDER,
      geminiKey: config.GEMINI_API_KEY,
      openaiBaseUrl: config.OPENAI_BASE_URL,
      openaiKey: config.OPENAI_API_KEY,
      openaiModel: config.OPENAI_MODEL
    })
  });
  return handleResponse(res, 'Failed to test AI config');
};

export const testGithubConfig = async (token: string, proxyUrl: string, githubToken: string) => {
    const res = await fetch(`${API_BASE}/config/test-github`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ proxyUrl, token: githubToken })
    });
    return handleResponse(res, 'Failed to test GitHub config');
};

export const addRepo = async (token: string, repoName: string) => {
  const res = await fetch(`${API_BASE}/repos/add`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ repoName })
  });
  return handleResponse(res, 'Failed to add repo');
};

export const cleanupRepos = async (token: string) => {
  const res = await fetch(`${API_BASE}/repos/cleanup`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(res, 'Failed to cleanup repos');
};

export const deleteRepo = async (token: string, id: number) => {
  const res = await fetch(`${API_BASE}/repos/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(res, 'Failed to delete repo');
};

export const reAnalyzeRepo = async (token: string, id: number) => {
  const res = await fetch(`${API_BASE}/repos/${id}/analyze`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(res, 'Failed to re-analyze repo');
};

export const getRepoDetail = async (token: string, id: number) => {
  const res = await fetch(`${API_BASE}/repos/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleResponse(res, 'Failed to fetch repo detail');
};

export const analyzeContent = async (text: string): Promise<string> => {
  const res = await fetch(`${API_BASE}/analyze-content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (!res.ok) throw new Error('Analysis failed');
  const data = await res.json();
  return data.analysis;
};
