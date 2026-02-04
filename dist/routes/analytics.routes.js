"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("../controllers/analytics.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Only Admin/Staff can see analytics
router.get('/dashboard', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), analytics_controller_1.getDashboardStats);
router.get('/revenue', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), analytics_controller_1.getRevenueReport);
exports.default = router;
