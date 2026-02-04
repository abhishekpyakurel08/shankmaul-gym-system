import { Router } from 'express';
import { renewSubscription, getExpiringSubscriptions, requestRenewal, getPendingSubscriptions, approveSubscription, declineSubscription, getAllSubscriptions } from '../controllers/member.controller';
import { auth, authorize } from '../middleware/auth.middleware';

const router = Router();

// Subscriptions managed by Admin/Staff
router.post('/renew', auth, authorize(['admin', 'staff']), renewSubscription);
router.get('/expiring', auth, authorize(['admin', 'staff']), getExpiringSubscriptions);
router.get('/pending', auth, authorize(['admin', 'staff']), getPendingSubscriptions);
router.get('/history', auth, authorize(['admin', 'staff']), getAllSubscriptions);
router.post('/approve', auth, authorize(['admin', 'staff']), approveSubscription);
router.post('/decline', auth, authorize(['admin', 'staff']), declineSubscription);

// Members can request a renewal
router.post('/request', auth, requestRenewal);

export default router;
