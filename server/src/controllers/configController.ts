import { Request, Response } from 'express';
import { ConfigService } from '../services/configService';
import { SchedulerService } from '../services/scheduler';
import { AiService } from '../services/aiService';

export class ConfigController {
  static async getAll(req: Request, res: Response) {
    const configs = await ConfigService.getAll();
    // Mask secrets
    // configs['GEMINI_API_KEY'] = '******';
    // configs['OPENAI_API_KEY'] = '******';
    res.json(configs);
  }

  static async update(req: Request, res: Response) {
    const updates = req.body;
    await ConfigService.setMany(updates);
    
    // If frequency changed, restart scheduler
    if (updates['PULL_FREQUENCY_MINUTES']) {
      await SchedulerService.schedule();
    }
    
    res.json({ success: true });
  }

  static async testAi(req: Request, res: Response) {
    const result = await AiService.testConnection(req.body);
    res.json(result);
  }

  static async testGithub(req: Request, res: Response) {
      const { proxyUrl, token } = req.body;
      const { GithubService } = require('../services/githubService');
      const result = await GithubService.testConnection(proxyUrl, token);
      res.json(result);
  }
}
