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
exports.getAttendanceHistory = exports.manualCheckIn = exports.checkInAtLocation = exports.getMyStats = exports.getTodayAttendance = exports.checkOut = exports.checkIn = exports.getQRToken = void 0;
const qrToken_1 = require("../utils/qrToken");
const attendance_service_1 = require("../services/attendance.service");
const models_1 = require("../models");
const getQRToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const member = yield models_1.Member.findOne({ user: userId });
        if (!member) {
            return res.status(404).json({ message: 'Member profile not found' });
        }
        const token = (0, qrToken_1.generateQRToken)(member._id.toString());
        res.json({ token, expiresIn: 60 });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getQRToken = getQRToken;
const checkIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { qrToken } = req.body;
        if (!qrToken)
            return res.status(400).json({ message: 'QR Token required' });
        const { attendance, type, subscription } = yield (0, attendance_service_1.processQRCheckIn)(qrToken);
        // Emit Socket Event
        const io = req.app.get('io');
        if (io) {
            io.emit('attendance:new', { attendance, type });
        }
        res.json({
            message: type === 'checkin' ? 'Check-in successful' : 'Check-out successful',
            attendance,
            type,
            subscription
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.checkIn = checkIn;
const checkOut = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { memberId } = req.body;
        if (!memberId)
            return res.status(400).json({ message: 'Member ID required' });
        // Find the last attendance for this member that doesn't have a checkOutTime
        const attendance = yield models_1.Attendance.findOne({
            member: memberId,
            checkOutTime: { $exists: false }
        }).sort({ checkInTime: -1 });
        if (!attendance) {
            return res.status(404).json({ message: 'No active session found for this member' });
        }
        attendance.checkOutTime = new Date();
        const diff = attendance.checkOutTime.getTime() - attendance.checkInTime.getTime();
        attendance.duration = Math.round(diff / 60000); // duration in minutes
        yield attendance.save();
        const populated = yield models_1.Attendance.findById(attendance._id).populate('member');
        // Emit Socket Event
        const io = req.app.get('io');
        if (io) {
            io.emit('attendance:new', { attendance: populated, type: 'checkout' });
        }
        res.json({ message: 'Check-out successful', attendance: populated, type: 'checkout' });
    }
    catch (error) {
        console.error('Check-out error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.checkOut = checkOut;
const getTodayAttendance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date } = req.query;
        let startOfTargetDay = new Date();
        if (date && typeof date === 'string' && date !== '[object Object]') {
            const parsedDate = new Date(date);
            if (!isNaN(parsedDate.getTime())) {
                startOfTargetDay = parsedDate;
            }
        }
        startOfTargetDay.setHours(0, 0, 0, 0);
        const endOfTargetDay = new Date(startOfTargetDay);
        endOfTargetDay.setHours(23, 59, 59, 999);
        // RBAC: If member, only show their own attendance
        const query = {
            date: { $gte: startOfTargetDay, $lte: endOfTargetDay }
        };
        if (req.user.role === 'member' || req.user.role === 'trainer') {
            const member = yield models_1.Member.findOne({ user: req.user.id });
            if (member) {
                query.member = member._id;
            }
        }
        const attendances = yield models_1.Attendance.find(query).populate('member');
        res.json(attendances);
    }
    catch (error) {
        console.error('[GET_TODAY_ATTENDANCE_ERROR]', error);
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getTodayAttendance = getTodayAttendance;
const getMyStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const member = yield models_1.Member.findOne({ user: userId });
        if (!member)
            return res.status(404).json({ message: 'Member not found' });
        const totalWorkouts = yield models_1.Attendance.countDocuments({ member: member._id });
        // This Month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const thisMonthWorkouts = yield models_1.Attendance.countDocuments({
            member: member._id,
            date: { $gte: startOfMonth }
        });
        // Recent Activity
        const recent = yield models_1.Attendance.find({ member: member._id })
            .sort({ date: -1 })
            .limit(5);
        // Streak Logic
        const allAttendances = yield models_1.Attendance.find({ member: member._id })
            .sort({ date: -1 })
            .select('date');
        const uniqueDates = Array.from(new Set(allAttendances.map(a => a.date.toISOString().split('T')[0])));
        let streak = 0;
        if (uniqueDates.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            let lastDate = uniqueDates[0];
            // If the most recent attendance is today or yesterday, streak is alive
            if (lastDate === today || lastDate === yesterday) {
                streak = 1;
                for (let i = 1; i < uniqueDates.length; i++) {
                    const prevDate = new Date(lastDate);
                    prevDate.setDate(prevDate.getDate() - 1);
                    const prevDateStr = prevDate.toISOString().split('T')[0];
                    if (uniqueDates[i] === prevDateStr) {
                        streak++;
                        lastDate = uniqueDates[i];
                    }
                    else {
                        break;
                    }
                }
            }
        }
        res.json({
            totalWorkouts,
            thisMonthWorkouts,
            streak,
            recent
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching stats' });
    }
});
exports.getMyStats = getMyStats;
const checkInAtLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { locationToken } = req.body;
        // In a real app, verify locationToken matches the active Reception QR
        // For now, we assume any token is valid or checking against a static simple secret
        if (!locationToken)
            return res.status(400).json({ message: 'Location Token required' });
        const userId = req.user.id;
        const member = yield models_1.Member.findOne({ user: userId });
        if (!member) {
            return res.status(404).json({ message: 'Member profile not found' });
        }
        // Reuse Manual CheckIn Logic but for this specific member
        const { attendance, type, subscription } = yield (0, attendance_service_1.processManualCheckIn)(member._id.toString());
        // Emit Socket Event
        const io = req.app.get('io');
        if (io) {
            io.emit('attendance:new', { attendance, type });
        }
        res.json({
            message: type === 'checkin' ? 'Check-in successful' : 'Check-out successful',
            attendance,
            type,
            subscription
        });
    }
    catch (error) {
        console.error('[LOCATION_CHECKIN_ERROR]', error.message);
        res.status(400).json({ message: error.message || 'Check-in failed' });
    }
});
exports.checkInAtLocation = checkInAtLocation;
const manualCheckIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { memberId, allowOverride, customDate } = req.body;
        if (!memberId)
            return res.status(400).json({ message: 'Member ID required' });
        const dateObj = customDate ? new Date(customDate) : undefined;
        const { attendance, type, subscription } = yield (0, attendance_service_1.processManualCheckIn)(memberId, allowOverride, dateObj);
        // Emit Socket Event
        const io = req.app.get('io');
        if (io) {
            io.emit('attendance:new', { attendance, type });
        }
        res.json({
            message: type === 'checkin' ? 'Check-in successful' : 'Check-out successful',
            attendance,
            type,
            subscription
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.manualCheckIn = manualCheckIn;
const getAttendanceHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = {};
        // RBAC: If member/trainer, only show their own history
        if (req.user.role === 'member' || req.user.role === 'trainer') {
            const member = yield models_1.Member.findOne({ user: req.user.id });
            if (!member)
                return res.status(404).json({ message: 'Member profile not found' });
            query.member = member._id;
        }
        const history = yield models_1.Attendance.find(query)
            .populate('member')
            .sort({ checkInTime: -1 });
        res.json(history);
    }
    catch (error) {
        console.error('[GET_HISTORY_ERROR]', error);
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getAttendanceHistory = getAttendanceHistory;
