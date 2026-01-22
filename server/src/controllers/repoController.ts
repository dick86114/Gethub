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
    const sort = req.query.sort as string || 'newest';
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
        where.OR = [
            { fullName: { contains: search } },
            { description: { contains: search } }
        ];
    }

    try {
        let repos: any[];
        let total: number;

        if (sort === 'random') {
             // For random sort, we use raw query for better randomization
             // Note: This works for PostgreSQL. For MySQL use RAND(). For SQLite use RANDOM().
             // Since we use Postgres (from schema), RANDOM() is correct.
             if (search) {
                // If search is active, random sort within search results
                // This is complex with raw query, so we fallback to Prisma findMany with client-side shuffle?
                // Or just ignore random sort when searching (usually search results are relevance or date sorted)
                // Let's keep it simple: if search, ignore random.
                const [results, count] = await Promise.all([
                    prisma.repo.findMany({
                        where,
                        take: limit,
                        skip: skip, // Standard pagination for search
                        orderBy: { createdAt: 'desc' },
                    }),
                    prisma.repo.count({ where }),
                ]);
                repos = results;
                total = count;
             } else {
                 // Pure random discovery mode
                 // We use raw query. Note: "Repo" table name is case-sensitive in Postgres if quoted.
                 // Prisma usually maps model Repo to table "Repo" or "repo". 
                 // We try "Repo" first.
                 const totalCount = await prisma.repo.count();
                 total = totalCount;
                 
                 repos = await prisma.$queryRaw`
                    SELECT * FROM "Repo" 
                    ORDER BY RANDOM() 
                    LIMIT ${limit} 
                    OFFSET ${skip}
                 `;
             }
        } else {
            // Default newest
            const [results, count] = await Promise.all([
                prisma.repo.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' }, 
                }),
                prisma.repo.count({ where }),
            ]);
            repos = results;
            total = count;
        }

        // Parse summary JSON
        const parsedRepos = repos.map(r => ({
            ...r,
            summary: r.summary ? (typeof r.summary === 'string' ? JSON.parse(r.summary) : r.summary) : null,
            // Ensure other fields match expected types if raw query returns different types (e.g. dates)
        }));

        res.json({ data: parsedRepos, total, page, limit });
    } catch (e: any) {
        console.error("List error:", e);
        // Fallback to standard list if raw query fails
        const [fallbackRepos, count] = await Promise.all([
             prisma.repo.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
             }),
             prisma.repo.count({ where }),
        ]);
        const parsed = fallbackRepos.map(r => ({
             ...r,
             summary: r.summary ? JSON.parse(r.summary) : null
        }));
        res.json({ data: parsed, total: count, page, limit });
    }
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
                AND: [
                    {
                        OR: [
                            { description: null },
                            { description: '' }
                        ]
                    },
                    {
                        OR: [
                            { readme: null },
                            { readme: '' }
                        ]
                    }
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
