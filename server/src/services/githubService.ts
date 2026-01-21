import axios from 'axios';
import { ConfigService } from './configService';
import { ProxyAgent } from 'proxy-agent';

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  default_branch: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  topics: string[];
}

export class GithubService {
  private static async getHeaders() {
    const token = await ConfigService.get('GITHUB_TOKEN');
    return {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': token ? `token ${token}` : undefined,
    };
  }

  static async fetchRepos(): Promise<GithubRepo[]> {
    const pullType = await ConfigService.get('PULL_TYPE');
    const pullCount = parseInt(await ConfigService.get('PULL_COUNT'), 10) || 10;
    const headers = await this.getHeaders();
    const proxyUrl = (await ConfigService.get('PROXY_URL'))?.trim();

    try {
      let query = '';
      if (pullType === 'trending') {
        // Trending in last 7 days
        const date = new Date();
        date.setDate(date.getDate() - 7);
        const dateStr = date.toISOString().split('T')[0];
        query = `created:>${dateStr}`;
      } else {
        // Newest
        query = `is:public`;
      }

      const axiosConfig: any = {
        headers,
        params: {
          q: query,
          sort: pullType === 'trending' ? 'stars' : 'updated',
          per_page: pullCount,
          order: 'desc',
        },
      };
  
      if (proxyUrl) {
        axiosConfig.httpsAgent = new ProxyAgent(proxyUrl as any);
        axiosConfig.proxy = false;
      }

      const maxRetries = 3;
      for (let i = 0; i < maxRetries; i++) {
        try {
          const response = await axios.get(`https://api.github.com/search/repositories`, axiosConfig);
          return response.data.items;
        } catch (error) {
          console.error(`GitHub Fetch Attempt ${i + 1} failed:`, axios.isAxiosError(error) ? error.message : error);
          
          // If it's the last attempt, throw the error
          if (i === maxRetries - 1) {
            if (axios.isAxiosError(error)) {
              console.error('Axios error details:', error.message, error.code);
              throw new Error(`GitHub Search Failed: ${error.message} (${error.code || 'Unknown'})`);
            }
            throw error;
          }
          
          // Wait before retrying
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      return []; // Should not reach here
    } catch (error) {
      // Catch error from ConfigService or others
      console.error('GitHub Fetch Critical Error:', error);
      throw error;
    }
  }

  static async fetchRepoDetail(owner: string, repo: string): Promise<GithubRepo> {
    const headers = await this.getHeaders();
    const proxyUrl = (await ConfigService.get('PROXY_URL'))?.trim();
    
    const axiosConfig: any = { headers };

    if (proxyUrl) {
      axiosConfig.httpsAgent = new ProxyAgent(proxyUrl as any);
      axiosConfig.proxy = false;
    }

    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, axiosConfig);
      return response.data;
    } catch (error: any) {
      console.error('GitHub Fetch Detail Error:', error);
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        throw new Error(`GitHub API Error: ${status ? status + ' ' : ''}${message}`);
      }
      throw error;
    }
  }

  static async fetchReadme(owner: string, repo: string, branch: string = 'main'): Promise<string> {
    const headers = await this.getHeaders();
    const proxyUrl = (await ConfigService.get('PROXY_URL'))?.trim();
    // Try main, master, then default
    const branches = [branch, 'main', 'master'];
    
    const axiosConfig: any = {
      headers: { ...headers, Accept: 'application/vnd.github.html' } // Request HTML
    };

    if (proxyUrl) {
      axiosConfig.httpsAgent = new ProxyAgent(proxyUrl as any);
      axiosConfig.proxy = false;
    }
    
    for (const b of branches) {
        try {
            // Get raw content
            // Note: raw.githubusercontent.com might be blocked in some regions.
            // Using API is safer: /repos/{owner}/{repo}/readme
            const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}/readme`, axiosConfig);
            return res.data;
        } catch (e) {
            continue;
        }
    }
    return "README not found or inaccessible.";
  }

  static async testConnection(proxyUrl?: string, token?: string): Promise<{ success: boolean; message: string }> {
      const headers: any = {};
      if (token) headers.Authorization = `token ${token}`;

      const axiosConfig: any = { headers };
      if (proxyUrl && proxyUrl.trim()) {
          try {
              axiosConfig.httpsAgent = new ProxyAgent(proxyUrl.trim() as any);
              axiosConfig.proxy = false;
          } catch (e: any) {
              return { success: false, message: `Invalid proxy URL: ${e.message}` };
          }
      }

      try {
          await axios.get('https://api.github.com/zen', axiosConfig);
          return { success: true, message: 'GitHub connection successful' };
      } catch (error: any) {
          const msg = error.response?.data?.message || error.message;
          return { success: false, message: `Connection failed: ${msg}` };
      }
  }
}
