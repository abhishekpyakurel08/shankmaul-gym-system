"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("../controllers/settings.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public/Member read access (some settings might need to be public like gym name)
router.get('/', auth_middleware_1.auth, settings_controller_1.getSettings);
// Admin only write access
router.put('/', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin']), settings_controller_1.updateSettings);
exports.default = router;
