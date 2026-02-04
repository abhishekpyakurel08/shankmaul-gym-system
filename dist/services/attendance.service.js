"use strict";
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
exports.autoCheckOut = exports.processManualCheckIn = exports.processQRCheckIn = void 0;
const models_1 = require("../models");
const qrToken_1 = require("../utils/qrToken");
const email_service_1 = require("./email.service");
const processQRCheckIn = (qrToken) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Validate Token
    const payload = (0, qrToken_1.verifyQRToken)(qrToken);
    if (!payload) {
        throw new Error('Invalid or expired QR token');
    }
    const { memberId } = payload;
    // 2. Member exists & active
    const member = yield models_1.Member.findById(memberId).populate('user');
    if (!member)
        throw new Error('Member not found');
    if (member.status !== 'active')
        throw new Error('Member is not active');
    // 3. Active subscription exists
    const activeSubscription = yield models_1.Subscription.findOne({
        member: memberId,
        status: 'active',
        endDate: { $gte: new Date() }
    });
    if (!activeSubscription) {
        throw new Error('No active subscription found');
    }
    // 4. Check for existing attendance today (Toggle Logic)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const existingAttendance = yield models_1.Attendance.findOne({
        member: memberId,
        date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ checkInTime: -1 });
    // If already checked in and hasn't checked out yet -> Check Out
    if (existingAttendance && !existingAttendance.checkOutTime) {
        existingAttendance.checkOutTime = new Date();
        // Calculate duration in minutes
        const diff = existingAttendance.checkOutTime.getTime() - existingAttendance.checkInTime.getTime();
        existingAttendance.duration = Math.round(diff / 60000);
        yield existingAttendance.save();
        const populatedAttendance = yield models_1.Attendance.findById(existingAttendance._id).populate('member');
        // Return with a flag or different message
        return { attendance: populatedAttendance, type: 'checkout', subscription: activeSubscription };
    }
    // If checked out and trying to scan again -> Enforce one-session-per-day limit
    if (existingAttendance && existingAttendance.checkOutTime) {
        throw new Error('Attendance protocol already completed for today. Only one session permitted.');
    }
    // 5. Record new check-in
    const newAttendance = yield models_1.Attendance.create({
        member: memberId,
        checkInTime: new Date(),
        method: 'qr',
        date: startOfDay // Use normalized date for easier querying
    });
    // Populate member for the response
    const populatedAttendance = yield models_1.Attendance.findById(newAttendance._id).populate('member');
    // 6. Send Email (Optional)
    if (member.user && member.user.email) {
        const userEmail = member.user.email;
        const userName = member.firstName;
        (0, email_service_1.sendCheckInConfirmationEmail)(userEmail, userName, newAttendance.checkInTime).catch(console.error);
    }
    return { attendance: populatedAttendance, type: 'checkin', subscription: activeSubscription };
});
exports.processQRCheckIn = processQRCheckIn;
const processManualCheckIn = (memberId_1, ...args_1) => __awaiter(void 0, [memberId_1, ...args_1], void 0, function* (memberId, allowOverride = false, customDate) {
    // 1. Member exists & active
    const member = yield models_1.Member.findById(memberId).populate('user');
    if (!member)
        throw new Error('Member not found');
    // 2. Active subscription exists (unless overridden)
    const activeSubscription = yield models_1.Subscription.findOne({
        member: memberId,
        status: 'active',
        endDate: { $gte: new Date() }
    });
    if (!activeSubscription && !allowOverride) {
        throw new Error('No active subscription found. Access to facility denied.');
    }
    if (member.status !== 'active' && !allowOverride) {
        throw new Error('Member account is not active. Please see reception.');
    }
    // 3. Check for existing attendance on that date (Toggle Logic)
    const targetDate = customDate || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    const existingAttendance = yield models_1.Attendance.findOne({
        member: memberId,
        date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ checkInTime: -1 });
    // If already checked in and hasn't checked out yet -> Check Out
    if (existingAttendance && !existingAttendance.checkOutTime) {
        existingAttendance.checkOutTime = customDate || new Date();
        const diff = existingAttendance.checkOutTime.getTime() - existingAttendance.checkInTime.getTime();
        existingAttendance.duration = Math.round(diff / 60000);
        yield existingAttendance.save();
        const populated = yield models_1.Attendance.findById(existingAttendance._id).populate('member');
        return { attendance: populated, type: 'checkout', subscription: activeSubscription };
    }
    // If already checked out -> Enforce limit unless override is granted
    if (existingAttendance && existingAttendance.checkOutTime && !allowOverride) {
        throw new Error('Member has already completed a session today. Clear override required to re-entry.');
    }
    // 4. Record new check-in
    const newAttendance = yield models_1.Attendance.create({
        member: memberId,
        checkInTime: customDate || new Date(),
        method: 'manual',
        date: startOfDay
    });
    const populated = yield models_1.Attendance.findById(newAttendance._id).populate('member');
    return { attendance: populated, type: 'checkin', subscription: activeSubscription };
});
exports.processManualCheckIn = processManualCheckIn;
const autoCheckOut = () => __awaiter(void 0, void 0, void 0, function* () {
    const ONE_HOUR_AGO = new Date(Date.now() - 60 * 60 * 1000);
    // Find all active sessions where check-in was more than 1 hour ago
    const activeSessions = yield models_1.Attendance.find({
        checkOutTime: { $exists: false },
        checkInTime: { $lt: ONE_HOUR_AGO }
    }).populate('member');
    console.log(`[AUTO-CHECKOUT] Processing ${activeSessions.length} sessions...`);
    const results = [];
    for (const session of activeSessions) {
        session.checkOutTime = new Date(session.checkInTime.getTime() + 60 * 60 * 1000); // Set to exactly 1 hour after check-in for fairness
        session.duration = 60; // 60 minutes
        session.method = 'auto';
        yield session.save();
        results.push(session);
    }
    return results;
});
exports.autoCheckOut = autoCheckOut;
