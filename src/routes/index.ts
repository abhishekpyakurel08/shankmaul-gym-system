import { Router } from 'express';
import authRoutes from './auth.routes';
import attendanceRoutes from './attendance.routes';
import memberRoutes from './member.routes';
import subscriptionRoutes from './subscription.routes';
import financeRoutes from './financial.routes';
import analyticsRoutes from './analytics.routes';
import notificationRoutes from './notification.routes';
import settingsRoutes from './settings.routes';
import uploadRoutes from './upload.routes';
import productRoutes from './product.routes';


const router = Router();

router.use('/auth', authRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/members', memberRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/financial', financeRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingsRoutes);
router.use('/upload', uploadRoutes);
router.use('/products', productRoutes);

export default router;

