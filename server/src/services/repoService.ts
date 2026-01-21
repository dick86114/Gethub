import { prisma } from '../prisma';
import { AiService } from './aiService';
import { GithubService } from './githubService';

export class RepoService {
  static async saveBasicInfo(repo: any) {
    // 1. Check if exists (Optional, upsert handles it)
    
    // 2. Upsert basic info
    const savedRepo = await prisma.repo.upsert({
      where: { githubId: repo.id },
      update: {
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        updatedAt: new Date(),
      },
      create: {
        githubId: repo.id,
        fullName: repo.full_name,
        name: repo.name,
        description: repo.description || '',
        htmlUrl: repo.html_url,
        language: repo.language || 'Unknown',
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        topics: repo.topics || [],
        ownerLogin: repo.owner.login,
        ownerAvatar: repo.owner.avatar_url,
        defaultBranch: repo.default_branch,
      }
    });
    return savedRepo;
  }

  static async enrichRepo(savedRepo: any, repo: any, force = false) {
    let readmeContent = savedRepo.readme;

    // 4. Fetch Readme (if missing or forced)
    if (!readmeContent || force) {
        console.log(`Processing Readme for ${repo.full_name} (force=${force})...`);
        try {
            const readmeHtml = await GithubService.fetchReadme(repo.owner.login, repo.name, repo.default_branch || 'main');
            
            if (readmeHtml && !readmeHtml.includes('not found')) {
                // Save original
                await prisma.repo.update({
                    where: { id: savedRepo.id },
                    data: { readme: readmeHtml }
                });
                readmeContent = readmeHtml;
            }
        } catch (e) {
            console.error(`Readme processing failed for ${repo.full_name}:`, e);
        }
    }

    // 3. AI Analysis (if missing or forced)
    if (!savedRepo.summary || force) {
        console.log(`Analyzing ${repo.full_name} (force=${force})...`);
        try {
            const analysis = await AiService.analyzeRepo(repo, readmeContent);
            await prisma.repo.update({
                where: { id: savedRepo.id },
                data: { summary: JSON.stringify(analysis) }
            });
        } catch (e) {
            console.error(`AI Analysis failed for ${repo.full_name}:`, e);
        }
    }
  }

  static async processRepo(repo: any) {
    console.log(`Processing repo: ${repo.full_name}`);
    
    const savedRepo = await this.saveBasicInfo(repo);
    await this.enrichRepo(savedRepo, repo);

    return savedRepo;
  }
}
