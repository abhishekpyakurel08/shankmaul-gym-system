"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Only Admin and Staff (Reception) can register new users
router.post('/register', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), auth_controller_1.register);
// Login is public
router.post('/login', auth_controller_1.login);
// Admin only user management
router.get('/users', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin']), auth_controller_1.getUsers);
router.put('/users/:id/role', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin']), auth_controller_1.updateUserRole);
router.delete('/users/:id', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin']), auth_controller_1.deleteUser);
exports.default = router;
