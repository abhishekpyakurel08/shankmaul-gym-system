"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const training_controller_1 = require("../controllers/training.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public or Authenticated generic read
router.get('/', auth_middleware_1.auth, training_controller_1.getAllTrainings);
router.get('/my', auth_middleware_1.auth, training_controller_1.getMyTrainings);
// Admin/Staff/Trainer create
router.post('/', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff', 'trainer']), training_controller_1.createTraining);
// Member enrollment
router.post('/:trainingId/enroll', auth_middleware_1.auth, training_controller_1.enrollMember);
exports.default = router;
