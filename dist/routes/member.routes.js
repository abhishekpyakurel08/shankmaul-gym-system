"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const member_controller_1 = require("../controllers/member.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Member profile routes
router.get('/profile', auth_middleware_1.auth, member_controller_1.getMemberProfile);
router.get('/:id', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), member_controller_1.getMemberById);
router.put('/profile', auth_middleware_1.auth, member_controller_1.updateMemberProfile);
// Management routes
router.get('/', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), member_controller_1.getMembers);
router.post('/', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), member_controller_1.createMember);
router.put('/:id', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), member_controller_1.updateMemberById);
router.put('/:id/status', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), member_controller_1.updateMemberStatus);
router.delete('/:id', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), member_controller_1.deleteMember);
exports.default = router;
