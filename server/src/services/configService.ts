import { prisma } from '../prisma';

export const DEFAULT_CONFIG = {
  AI_PROVIDER: 'gemini',
  GEMINI_API_KEY: '',
  OPENAI_BASE_URL: 'https://api.deepseek.com',
  OPENAI_API_KEY: '',
  OPENAI_MODEL: 'deepseek-chat',
  GITHUB_TOKEN: '',
  PULL_FREQUENCY_MINUTES: '60',
  PULL_COUNT: '10',
  PULL_TYPE: 'trending', // trending | new
  PROXY_URL: '',
};

export class ConfigService {
  static async get(key: keyof typeof DEFAULT_CONFIG): Promise<string> {
    const config = await prisma.config.findUnique({ where: { key } });
    return config?.value || DEFAULT_CONFIG[key];
  }

  static async getAll(): Promise<Record<string, string>> {
    const configs = await prisma.config.findMany();
    const result = { ...DEFAULT_CONFIG };
    configs.forEach(c => {
      // @ts-ignore
      if (result.hasOwnProperty(c.key)) {
        // @ts-ignore
        result[c.key] = c.value;
      }
    });
    return result;
  }

  static async set(key: string, value: string) {
    await prisma.config.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  static async setMany(configs: Record<string, string>) {
    for (const [key, value] of Object.entries(configs)) {
      await this.set(key, value);
    }
  }
}
