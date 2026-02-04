import { Router } from 'express';
import { getDashboardStats, getRevenueReport } from '../controllers/analytics.controller';
import { auth, authorize } from '../middleware/auth.middleware';

const router = Router();

// Only Admin/Staff can see analytics
router.get('/dashboard', auth, authorize(['admin', 'staff']), getDashboardStats);
router.get('/revenue', auth, authorize(['admin', 'staff']), getRevenueReport);

export default router;
