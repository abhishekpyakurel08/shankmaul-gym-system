import { Subscription, Member, User } from '../models';
import * as emailService from './email.service';

/**
 * Send email notifications to members whose subscriptions are expiring in the specified number of days
 * @param daysBeforeExpiry - Number of days before expiry to send notification (default: 3)
 */
export const sendExpiryNotifications = async (daysBeforeExpiry: number = 3): Promise<{
    success: boolean;
    notificationsSent: number;
    errors: string[];
}> => {
    const errors: string[] = [];
    let notificationsSent = 0;

    try {
        // Calculate the target date (X days from now)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + daysBeforeExpiry);

        // Set the end of target date
        const targetDateEnd = new Date(targetDate);
        targetDateEnd.setHours(23, 59, 59, 999);

        console.log(`[Scheduled Job] Checking for subscriptions expiring on ${targetDate.toDateString()}`);

        // Find active subscriptions expiring on the target date
        const expiringSubscriptions = await Subscription.find({
            status: 'active',
            endDate: {
                $gte: targetDate,
                $lte: targetDateEnd
            }
        }).populate({
            path: 'member',
            populate: {
                path: 'user',
                select: 'email'
            }
        });

        console.log(`[Scheduled Job] Found ${expiringSubscriptions.length} subscription(s) expiring in ${daysBeforeExpiry} days`);

        // Send email to each member with expiring subscription
        for (const subscription of expiringSubscriptions) {
            try {
                const member = subscription.member as any;

                if (!member || !member.user?.email) {
                    errors.push(`Subscription ${subscription._id}: Member or email not found`);
                    continue;
                }

                const email = member.user.email;
                const name = member.firstName || 'Member';
                const expiryDate = new Date(subscription.endDate);

                await emailService.sendSubscriptionExpiryEmail(email, name, expiryDate);
                notificationsSent++;

                console.log(`[Scheduled Job] Expiry notification sent to ${email} for subscription ending ${expiryDate.toDateString()}`);
            } catch (emailError: any) {
                errors.push(`Subscription ${subscription._id}: Failed to send email - ${emailError.message}`);
            }
        }

        return {
            success: true,
            notificationsSent,
            errors
        };
    } catch (error: any) {
        console.error('[Scheduled Job] Error in sendExpiryNotifications:', error);
        return {
            success: false,
            notificationsSent,
            errors: [...errors, error.message]
        };
    }
};

/**
 * Scan for subscriptions that have passed their endDate and update status to 'expired'
 */
export const updateExpiredSubscriptions = async (): Promise<{
    count: number;
    success: boolean;
}> => {
    try {
        const now = new Date();

        // 1. Find all active subscriptions where endDate is in the past
        const expiredSubs = await Subscription.find({
            status: 'active',
            endDate: { $lt: now }
        });

        if (expiredSubs.length > 0) {
            console.log(`[Scheduled Job] Marking ${expiredSubs.length} subscriptions as expired`);

            // 2. Update Subscription statuses
            await Subscription.updateMany(
                { _id: { $in: expiredSubs.map(s => s._id) } },
                { status: 'expired' }
            );

            // 3. Update Member statuses to 'inactive' if no other active subscription exists
            for (const sub of expiredSubs) {
                const otherActiveSub = await Subscription.findOne({
                    member: sub.member,
                    status: 'active',
                    endDate: { $gte: now }
                });

                if (!otherActiveSub) {
                    await Member.findByIdAndUpdate(sub.member, { status: 'inactive' });
                    console.log(`[Scheduled Job] Member ${sub.member} status updated to inactive`);
                }
            }
        }

        return { count: expiredSubs.length, success: true };
    } catch (error) {
        console.error('[Scheduled Job] Error in updateExpiredSubscriptions:', error);
        return { count: 0, success: false };
    }
};

/**
 * Run all scheduled notification jobs
 * This can be called by a cron job or scheduler
 */
export const runScheduledNotifications = async (): Promise<void> => {
    console.log('[Scheduled Job] Starting scheduled notification run at', new Date().toISOString());

    // Send 3-day expiry notifications
    const result = await sendExpiryNotifications(3);

    // Update statuses for subscriptions that already expired
    const statusUpdateResult = await updateExpiredSubscriptions();

    console.log('[Scheduled Job] Notification run completed:', {
        notificationsSent: result.notificationsSent,
        expiredCount: statusUpdateResult.count,
        errors: result.errors.length,
        success: result.success && statusUpdateResult.success
    });
};
