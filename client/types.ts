export interface Repo {
  id: number;
  githubId: number;
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
  language: string;
  stars: number;
  forks: number;
  topics: string[];
  ownerLogin: string;
  ownerAvatar: string;
  defaultBranch: string;
  
  summary: AIAnalysis | null;
  readme: string | null;
}

export interface AIAnalysis {
  coreSummary: string;
  features: string[];
  useCases: string[];
}

export interface AppConfig {
  AI_PROVIDER: string;
  GEMINI_API_KEY: string;
  OPENAI_BASE_URL: string;
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  GITHUB_TOKEN: string;
  PULL_FREQUENCY_MINUTES: string;
  PULL_COUNT: string;
  PULL_TYPE: string;
  PROXY_URL?: string;
}
