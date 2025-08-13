import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard';
import { authenticate } from '../middleware/auth';

const router = Router();
const dashboardController = new DashboardController();

router.use(authenticate);

router.get('/stats', dashboardController.getStats);
router.get('/activity', dashboardController.getRecentActivity);

export default router;

