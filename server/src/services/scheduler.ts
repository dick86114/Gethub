import cron, { ScheduledTask } from 'node-cron';
import { prisma } from '../prisma';
import { ConfigService } from './configService';
import { GithubService } from './githubService';
import { AiService } from './aiService';
import { RepoService } from './repoService';

export class SchedulerService {
  private static task: ScheduledTask | null = null;
  private static isRunning = false;
  public static status = {
    state: 'idle', // idle, fetching, processing, completed, error
    message: '',
    processed: 0,
    total: 0
  };

  static async init() {
    await this.schedule();
    console.log('Scheduler initialized');
  }

  static async schedule() {
    if (this.task) {
      this.task.stop();
    }

    const minutes = await ConfigService.get('PULL_FREQUENCY_MINUTES');
    const cronExpression = `*/${minutes} * * * *`; // Every N minutes
    
    // Validate cron expression basic safety (fallback to hourly if invalid)
    const validCron = cron.validate(cronExpression) ? cronExpression : '0 * * * *';

    console.log(`Scheduling job with expression: ${validCron}`);
    this.task = cron.schedule(validCron, () => {
      this.runJob();
    });
  }

  static async runJob() {
    if (this.isRunning) {
      console.log('Job already running, skipping...');
      return;
    }
    this.isRunning = true;
    this.status = { state: 'fetching', message: 'Starting GitHub fetch...', processed: 0, total: 0 };
    console.log('Starting scheduled repo fetch...');

    try {
      this.status = { state: 'fetching', message: 'Fetching repos from GitHub...', processed: 0, total: 0 };
      const repos = await GithubService.fetchRepos();
      console.log(`Fetched ${repos.length} repos from GitHub`);
      
      if (repos.length === 0) {
        this.status = { state: 'completed', message: 'Fetched 0 repos. Check your search criteria or connection.', processed: 0, total: 0 };
        this.isRunning = false;
        return;
      }

      this.status = { state: 'processing', message: `Fetched ${repos.length} repos. Processing...`, processed: 0, total: repos.length };

      for (let i = 0; i < repos.length; i++) {
        const repo = repos[i];
        this.status.message = `Processing ${i + 1}/${repos.length}: ${repo.full_name}`;
        
        try {
          await RepoService.processRepo(repo);
          this.status.processed = i + 1;
        } catch (e) {
          console.error(`Failed to process ${repo.full_name}`, e);
          this.status.message = `Error processing ${repo.full_name}: ${e instanceof Error ? e.message : 'Unknown error'}`;
          // Wait a bit so user can see the error
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      console.log('Job completed successfully');
      this.status = { state: 'completed', message: `Job completed. Processed ${repos.length} repos.`, processed: repos.length, total: repos.length };
    } catch (e) {
      console.error('Job failed:', e);
      this.status = { state: 'error', message: `Job failed: ${e instanceof Error ? e.message : String(e)}`, processed: 0, total: 0 };
    } finally {
      this.isRunning = false;
    }
  }
}
