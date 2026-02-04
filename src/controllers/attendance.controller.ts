import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateQRToken } from '../utils/qrToken';
import { processQRCheckIn, processManualCheckIn } from '../services/attendance.service';
import { Member, Attendance } from '../models';

export const getQRToken = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const member = await Member.findOne({ user: userId });

        if (!member) {
            return res.status(404).json({ message: 'Member profile not found' });
        }

        const token = generateQRToken(member._id.toString());
        res.json({ token, expiresIn: 60 });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const checkIn = async (req: Request, res: Response) => {
    try {
        const { qrToken } = req.body;
        if (!qrToken) return res.status(400).json({ message: 'QR Token required' });

        const { attendance, type, subscription } = await processQRCheckIn(qrToken);

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
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const checkOut = async (req: Request, res: Response) => {
    try {
        const { memberId } = req.body;
        if (!memberId) return res.status(400).json({ message: 'Member ID required' });

        // Find the last attendance for this member that doesn't have a checkOutTime
        const attendance = await Attendance.findOne({
            member: memberId,
            checkOutTime: { $exists: false }
        }).sort({ checkInTime: -1 });

        if (!attendance) {
            return res.status(404).json({ message: 'No active session found for this member' });
        }

        attendance.checkOutTime = new Date();
        const diff = attendance.checkOutTime.getTime() - attendance.checkInTime.getTime();
        attendance.duration = Math.round(diff / 60000); // duration in minutes
        await attendance.save();

        const populated = await Attendance.findById(attendance._id).populate('member');

        // Emit Socket Event
        const io = req.app.get('io');
        if (io) {
            io.emit('attendance:new', { attendance: populated, type: 'checkout' });
        }

        res.json({ message: 'Check-out successful', attendance: populated, type: 'checkout' });
    } catch (error) {
        console.error('Check-out error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getTodayAttendance = async (req: AuthRequest, res: Response) => {
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
        const query: any = {
            date: { $gte: startOfTargetDay, $lte: endOfTargetDay }
        };

        if (req.user.role === 'member' || req.user.role === 'trainer') {
            const member = await Member.findOne({ user: req.user.id });
            if (member) {
                query.member = member._id;
            }
        }

        const attendances = await Attendance.find(query).populate('member');
        res.json(attendances);
    } catch (error) {
        console.error('[GET_TODAY_ATTENDANCE_ERROR]', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getMyStats = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const member = await Member.findOne({ user: userId });
        if (!member) return res.status(404).json({ message: 'Member not found' });

        const totalWorkouts = await Attendance.countDocuments({ member: member._id });

        // This Month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const thisMonthWorkouts = await Attendance.countDocuments({
            member: member._id,
            date: { $gte: startOfMonth }
        });

        // Recent Activity
        const recent = await Attendance.find({ member: member._id })
            .sort({ date: -1 })
            .limit(5);

        // Streak Logic
        const allAttendances = await Attendance.find({ member: member._id })
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
                    } else {
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
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats' });
    }
};

export const checkInAtLocation = async (req: AuthRequest, res: Response) => {
    try {
        const { locationToken } = req.body;
        // In a real app, verify locationToken matches the active Reception QR
        // For now, we assume any token is valid or checking against a static simple secret
        if (!locationToken) return res.status(400).json({ message: 'Location Token required' });

        const userId = req.user.id;
        const member = await Member.findOne({ user: userId });
        if (!member) {
            return res.status(404).json({ message: 'Member profile not found' });
        }

        // Reuse Manual CheckIn Logic but for this specific member
        const { attendance, type, subscription } = await processManualCheckIn(member._id.toString());

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
    } catch (error: any) {
        console.error('[LOCATION_CHECKIN_ERROR]', error.message);
        res.status(400).json({ message: error.message || 'Check-in failed' });
    }
};

export const manualCheckIn = async (req: Request, res: Response) => {
    try {
        const { memberId, allowOverride, customDate } = req.body;
        if (!memberId) return res.status(400).json({ message: 'Member ID required' });

        const dateObj = customDate ? new Date(customDate) : undefined;
        const { attendance, type, subscription } = await processManualCheckIn(memberId, allowOverride, dateObj);

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
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const getAttendanceHistory = async (req: AuthRequest, res: Response) => {
    try {
        const query: any = {};

        // RBAC: If member/trainer, only show their own history
        if (req.user.role === 'member' || req.user.role === 'trainer') {
            const member = await Member.findOne({ user: req.user.id });
            if (!member) return res.status(404).json({ message: 'Member profile not found' });
            query.member = member._id;
        }

        const history = await Attendance.find(query)
            .populate('member')
            .sort({ checkInTime: -1 });

        res.json(history);
    } catch (error) {
        console.error('[GET_HISTORY_ERROR]', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
