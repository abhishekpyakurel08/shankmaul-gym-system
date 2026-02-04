import { Router } from 'express';
import { getQRToken, checkIn, checkOut, getTodayAttendance, getMyStats, manualCheckIn, checkInAtLocation, getAttendanceHistory } from '../controllers/attendance.controller';
import { auth, authorize } from '../middleware/auth.middleware';

const router = Router();

// Member functionality
router.get('/qr', auth, getQRToken);
router.get('/stats', auth, getMyStats);
router.post('/scan-location', auth, checkInAtLocation);

// Reception (Staff/Admin) functionality
router.post('/check-in', auth, authorize(['admin', 'staff']), checkIn);
router.post('/check-out', auth, authorize(['admin', 'staff']), checkOut);
router.post('/manual', auth, authorize(['admin', 'staff']), manualCheckIn);

// Analytics/View 
router.get('/today', auth, getTodayAttendance);
router.get('/analytics', auth, getAttendanceHistory);

// Force Restart: 2026-02-03T16:21:00
export default router;
