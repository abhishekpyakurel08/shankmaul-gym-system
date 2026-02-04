import { Router, Request, Response } from 'express';
import { sendExpiryNotifications } from '../services/scheduler.service';
import { auth, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/notifications/send-expiry
 * Manually trigger expiry notification emails
 * Admin only
 */
router.post('/send-expiry', auth, authorize(['admin']), async (req: Request, res: Response) => {
    try {
        const daysBeforeExpiry = req.body.daysBeforeExpiry || 3;

        const result = await sendExpiryNotifications(daysBeforeExpiry);

        res.json({
            message: `Expiry notifications sent for subscriptions expiring in ${daysBeforeExpiry} days`,
            ...result
        });
    } catch (error: any) {
        res.status(500).json({
            message: 'Error sending expiry notifications',
            error: error.message
        });
    }
});

/**
 * GET /api/notifications/expiring
 * Get list of subscriptions expiring in X days
 * Admin/Staff only
 */
router.get('/expiring', auth, authorize(['admin', 'staff']), async (req: Request, res: Response) => {
    try {
        const { Subscription } = await import('../models');
        const days = parseInt(req.query.days as string) || 3;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + days);

        const targetDateEnd = new Date(targetDate);
        targetDateEnd.setHours(23, 59, 59, 999);

        const expiringSubscriptions = await Subscription.find({
            status: 'active',
            endDate: {
                $gte: today,
                $lte: targetDateEnd
            }
        }).populate({
            path: 'member',
            populate: {
                path: 'user',
                select: 'email'
            }
        });

        res.json({
            count: expiringSubscriptions.length,
            days,
            subscriptions: expiringSubscriptions
        });
    } catch (error: any) {
        res.status(500).json({
            message: 'Error fetching expiring subscriptions',
            error: error.message
        });
    }
});

export default router;
