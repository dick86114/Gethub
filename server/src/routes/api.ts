import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { ConfigController } from '../controllers/configController';
import { RepoController } from '../controllers/repoController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Auth
router.post('/auth/login', AuthController.login);
router.post('/auth/change-password', authenticate, AuthController.changePassword);

// Config (Protected)
router.get('/config', authenticate, ConfigController.getAll);
router.post('/config', authenticate, ConfigController.update);
router.post('/config/test-ai', authenticate, ConfigController.testAi);
router.post('/config/test-github', authenticate, ConfigController.testGithub);

// Repos
router.get('/repos', RepoController.list);
router.get('/repos/random', RepoController.getRandom);
router.post('/repos/fetch', authenticate, RepoController.triggerFetch);
router.post('/repos/add', authenticate, RepoController.addManual);
router.get('/repos/job-status', authenticate, RepoController.getJobStatus);
router.post('/repos/cleanup', authenticate, RepoController.cleanup);
router.delete('/repos/:id', authenticate, RepoController.delete);
router.post('/repos/:id/analyze', authenticate, RepoController.reAnalyze);
router.get('/repos/:id', authenticate, RepoController.getDetail);
router.post('/analyze-content', RepoController.analyzeContent);

export default router;
