"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const member_controller_1 = require("../controllers/member.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Subscriptions managed by Admin/Staff
router.post('/renew', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), member_controller_1.renewSubscription);
router.get('/expiring', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), member_controller_1.getExpiringSubscriptions);
router.get('/pending', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), member_controller_1.getPendingSubscriptions);
router.get('/history', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), member_controller_1.getAllSubscriptions);
router.post('/approve', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), member_controller_1.approveSubscription);
router.post('/decline', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), member_controller_1.declineSubscription);
// Members can request a renewal
router.post('/request', auth_middleware_1.auth, member_controller_1.requestRenewal);
exports.default = router;
