"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScheduledNotifications = exports.updateExpiredSubscriptions = exports.sendExpiryNotifications = void 0;
const models_1 = require("../models");
const emailService = __importStar(require("./email.service"));
/**
 * Send email notifications to members whose subscriptions are expiring in the specified number of days
 * @param daysBeforeExpiry - Number of days before expiry to send notification (default: 3)
 */
const sendExpiryNotifications = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (daysBeforeExpiry = 3) {
    var _a;
    const errors = [];
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
        const expiringSubscriptions = yield models_1.Subscription.find({
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
                const member = subscription.member;
                if (!member || !((_a = member.user) === null || _a === void 0 ? void 0 : _a.email)) {
                    errors.push(`Subscription ${subscription._id}: Member or email not found`);
                    continue;
                }
                const email = member.user.email;
                const name = member.firstName || 'Member';
                const expiryDate = new Date(subscription.endDate);
                yield emailService.sendSubscriptionExpiryEmail(email, name, expiryDate);
                notificationsSent++;
                console.log(`[Scheduled Job] Expiry notification sent to ${email} for subscription ending ${expiryDate.toDateString()}`);
            }
            catch (emailError) {
                errors.push(`Subscription ${subscription._id}: Failed to send email - ${emailError.message}`);
            }
        }
        return {
            success: true,
            notificationsSent,
            errors
        };
    }
    catch (error) {
        console.error('[Scheduled Job] Error in sendExpiryNotifications:', error);
        return {
            success: false,
            notificationsSent,
            errors: [...errors, error.message]
        };
    }
});
exports.sendExpiryNotifications = sendExpiryNotifications;
/**
 * Scan for subscriptions that have passed their endDate and update status to 'expired'
 */
const updateExpiredSubscriptions = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        // 1. Find all active subscriptions where endDate is in the past
        const expiredSubs = yield models_1.Subscription.find({
            status: 'active',
            endDate: { $lt: now }
        });
        if (expiredSubs.length > 0) {
            console.log(`[Scheduled Job] Marking ${expiredSubs.length} subscriptions as expired`);
            // 2. Update Subscription statuses
            yield models_1.Subscription.updateMany({ _id: { $in: expiredSubs.map(s => s._id) } }, { status: 'expired' });
            // 3. Update Member statuses to 'inactive' if no other active subscription exists
            for (const sub of expiredSubs) {
                const otherActiveSub = yield models_1.Subscription.findOne({
                    member: sub.member,
                    status: 'active',
                    endDate: { $gte: now }
                });
                if (!otherActiveSub) {
                    yield models_1.Member.findByIdAndUpdate(sub.member, { status: 'inactive' });
                    console.log(`[Scheduled Job] Member ${sub.member} status updated to inactive`);
                }
            }
        }
        return { count: expiredSubs.length, success: true };
    }
    catch (error) {
        console.error('[Scheduled Job] Error in updateExpiredSubscriptions:', error);
        return { count: 0, success: false };
    }
});
exports.updateExpiredSubscriptions = updateExpiredSubscriptions;
/**
 * Run all scheduled notification jobs
 * This can be called by a cron job or scheduler
 */
const runScheduledNotifications = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('[Scheduled Job] Starting scheduled notification run at', new Date().toISOString());
    // Send 3-day expiry notifications
    const result = yield (0, exports.sendExpiryNotifications)(3);
    // Update statuses for subscriptions that already expired
    const statusUpdateResult = yield (0, exports.updateExpiredSubscriptions)();
    console.log('[Scheduled Job] Notification run completed:', {
        notificationsSent: result.notificationsSent,
        expiredCount: statusUpdateResult.count,
        errors: result.errors.length,
        success: result.success && statusUpdateResult.success
    });
});
exports.runScheduledNotifications = runScheduledNotifications;
