"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendance_controller_1 = require("../controllers/attendance.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Member functionality
router.get('/qr', auth_middleware_1.auth, attendance_controller_1.getQRToken);
router.get('/stats', auth_middleware_1.auth, attendance_controller_1.getMyStats);
router.post('/scan-location', auth_middleware_1.auth, attendance_controller_1.checkInAtLocation);
// Reception (Staff/Admin) functionality
router.post('/check-in', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), attendance_controller_1.checkIn);
router.post('/check-out', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), attendance_controller_1.checkOut);
router.post('/manual', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), attendance_controller_1.manualCheckIn);
// Analytics/View for Staff
router.get('/today', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), attendance_controller_1.getTodayAttendance);
router.get('/analytics', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), attendance_controller_1.getTodayAttendance);
exports.default = router;
