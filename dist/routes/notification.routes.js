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
const express_1 = require("express");
const scheduler_service_1 = require("../services/scheduler.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * POST /api/notifications/send-expiry
 * Manually trigger expiry notification emails
 * Admin only
 */
router.post('/send-expiry', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin']), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const daysBeforeExpiry = req.body.daysBeforeExpiry || 3;
        const result = yield (0, scheduler_service_1.sendExpiryNotifications)(daysBeforeExpiry);
        res.json(Object.assign({ message: `Expiry notifications sent for subscriptions expiring in ${daysBeforeExpiry} days` }, result));
    }
    catch (error) {
        res.status(500).json({
            message: 'Error sending expiry notifications',
            error: error.message
        });
    }
}));
/**
 * GET /api/notifications/expiring
 * Get list of subscriptions expiring in X days
 * Admin/Staff only
 */
router.get('/expiring', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { Subscription } = yield Promise.resolve().then(() => __importStar(require('../models')));
        const days = parseInt(req.query.days) || 3;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + days);
        const targetDateEnd = new Date(targetDate);
        targetDateEnd.setHours(23, 59, 59, 999);
        const expiringSubscriptions = yield Subscription.find({
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
    }
    catch (error) {
        res.status(500).json({
            message: 'Error fetching expiring subscriptions',
            error: error.message
        });
    }
}));
exports.default = router;
