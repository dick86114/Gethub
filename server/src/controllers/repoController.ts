import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { SchedulerService } from '../services/scheduler';
import { GithubService } from '../services/githubService';
import { RepoService } from '../services/repoService';

export class RepoController {
  static async addManual(req: Request, res: Response) {
    const { repoName } = req.body; // "owner/repo"
    
    if (!repoName || !repoName.includes('/')) {
        return res.status(400).json({ error: 'Invalid repo name format. Use owner/repo' });
    }

    const [owner, repo] = repoName.split('/');
    
    try {
        const detail = await GithubService.fetchRepoDetail(owner, repo);
        if (!detail) {
            return res.status(404).json({ error: 'Repository not found on GitHub' });
        }

        // Save basic info first to respond quickly
        const saved = await RepoService.saveBasicInfo(detail);
        
        // Trigger async enrichment (AI analysis & Translation)
        RepoService.enrichRepo(saved, detail).catch(e => {
            console.error(`Background enrichment failed for ${detail.full_name}:`, e);
        });

        res.json(saved);
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
  }

  static async list(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
        where.OR = [
            { fullName: { contains: search } }, // Case sensitive in SQLite/MySQL usually, but Prisma handles it well
            { description: { contains: search } }
        ];
    }

    const [repos, total] = await Promise.all([
      prisma.repo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }, 
      }),
      prisma.repo.count({ where }),
    ]);

    // Parse summary JSON
    const parsedRepos = repos.map(r => ({
      ...r,
      summary: r.summary ? JSON.parse(r.summary) : null
    }));

    res.json({ data: parsedRepos, total, page, limit });
  }

  static async getRandom(req: Request, res: Response) {
    const count = await prisma.repo.count();
    if (count === 0) return res.json(null);
    
    const skip = Math.floor(Math.random() * count);
    const repo = await prisma.repo.findFirst({
      skip,
    });

    if (repo) {
        // @ts-ignore
        repo.summary = repo.summary ? JSON.parse(repo.summary) : null;
    }

    res.json(repo);
  }

  static async triggerFetch(req: Request, res: Response) {
    // Run in background
    SchedulerService.runJob();
    res.json({ message: 'Job triggered' });
  }

  static async getJobStatus(req: Request, res: Response) {
    res.json(SchedulerService.status);
  }

  static async delete(req: Request, res: Response) {
    const id = req.params.id as string;
    try {
        await prisma.repo.delete({ where: { id: parseInt(id) } });
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
  }

  static async cleanup(req: Request, res: Response) {
    try {
        const result = await prisma.repo.deleteMany({
            where: {
                OR: [
                    { description: null },
                    { description: '' }
                ]
            }
        });
        res.json({ count: result.count });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
  }

  static async reAnalyze(req: Request, res: Response) {
    const id = req.params.id as string;
    try {
        const repo = await prisma.repo.findUnique({ where: { id: parseInt(id) } });
        if (!repo) return res.status(404).json({ error: 'Repo not found' });

        // Fetch latest details from GitHub to ensure fresh data
        let detail;
        try {
             detail = await GithubService.fetchRepoDetail(repo.ownerLogin || '', repo.name || '');
        } catch (e: any) {
             // If 404, it means repo is gone from GitHub
             if (e.message.includes('404')) {
                await prisma.repo.delete({ where: { id: parseInt(id) } });
                return res.json({ success: true, message: 'Repo deleted (not found on GitHub)' });
             }
             // Other errors (network, etc), just throw to stop process but keep repo
             throw e;
        }
        
        // If repo has no description, check if it has a readme
        if (!detail.description) {
            const readme = await GithubService.fetchReadme(detail.owner.login, detail.name, detail.default_branch);
            // If no readme either (or not found), delete it
            if (!readme || readme.includes('not found')) {
                await prisma.repo.delete({ where: { id: parseInt(id) } });
                return res.json({ success: true, message: 'Repo deleted (no details)' });
            }
        }

        // Update basic info
        const saved = await RepoService.saveBasicInfo(detail);
        
        // Trigger async forced enrichment
        RepoService.enrichRepo(saved, detail, true).catch(e => {
            console.error(`Re-analysis failed for ${detail.full_name}:`, e);
        });

        res.json({ success: true, message: 'Re-analysis started' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
  }

  static async getDetail(req: Request, res: Response) {
    const id = req.params.id as string;
    const repo = await prisma.repo.findUnique({ where: { id: parseInt(id) } });
    if (!repo) return res.status(404).json({ error: 'Repo not found' });
    
    // @ts-ignore
    repo.summary = repo.summary ? JSON.parse(repo.summary) : null;
    res.json(repo);
  }

  static async analyzeContent(req: Request, res: Response) {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: 'Text is required' });

      try {
          const { AiService } = require('../services/aiService');
          const analysis = await AiService.analyzeContent(text);
          res.json({ analysis });
      } catch (e: any) {
          console.error('Analysis error:', e);
          res.status(500).json({ error: 'Analysis failed' });
      }
  }
}
