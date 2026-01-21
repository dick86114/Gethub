import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import { AuthController } from './controllers/authController';
import { SchedulerService } from './services/scheduler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.send('OK');
});

const start = async () => {
  try {
    // Setup Default Admin
    await AuthController.setupDefaultAdmin();
    
    // Init Scheduler
    await SchedulerService.init();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (e) {
    console.error('Failed to start server:', e);
  }
};

start();
