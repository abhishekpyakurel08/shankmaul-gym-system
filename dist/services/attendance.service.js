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
exports.processManualCheckIn = exports.processQRCheckIn = void 0;
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
    // If checked out and trying to scan again -> Normally we block or allow new session
    // For simplicity, let's block second session today as per "No duplicate check-in today" rule
    if (existingAttendance && existingAttendance.checkOutTime) {
        throw new Error('Session already completed for today');
    }
    // 5. Record new check-in
    const newAttendance = yield models_1.Attendance.create({
        member: memberId,
        checkInTime: new Date(),
        method: 'qr',
        date: new Date()
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
const processManualCheckIn = (memberId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Member exists & active
    const member = yield models_1.Member.findById(memberId).populate('user');
    if (!member)
        throw new Error('Member not found');
    if (member.status !== 'active')
        throw new Error('Member is not active');
    // 2. Active subscription exists
    const activeSubscription = yield models_1.Subscription.findOne({
        member: memberId,
        status: 'active',
        endDate: { $gte: new Date() }
    });
    if (!activeSubscription) {
        throw new Error('No active subscription found');
    }
    // 3. Check for existing attendance today (Toggle Logic)
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
        const diff = existingAttendance.checkOutTime.getTime() - existingAttendance.checkInTime.getTime();
        existingAttendance.duration = Math.round(diff / 60000);
        yield existingAttendance.save();
        const populated = yield models_1.Attendance.findById(existingAttendance._id).populate('member');
        return { attendance: populated, type: 'checkout', subscription: activeSubscription };
    }
    if (existingAttendance && existingAttendance.checkOutTime) {
        throw new Error('Session already completed for today');
    }
    // 4. Record new check-in
    const newAttendance = yield models_1.Attendance.create({
        member: memberId,
        checkInTime: new Date(),
        method: 'manual',
        date: new Date()
    });
    const populated = yield models_1.Attendance.findById(newAttendance._id).populate('member');
    return { attendance: populated, type: 'checkin', subscription: activeSubscription };
});
exports.processManualCheckIn = processManualCheckIn;
