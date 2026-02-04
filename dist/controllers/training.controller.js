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
exports.getMyTrainings = exports.enrollMember = exports.createTraining = exports.getAllTrainings = void 0;
const training_model_1 = require("../models/training.model");
const user_model_1 = require("../models/user.model");
const member_model_1 = require("../models/member.model");
const getAllTrainings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const trainings = yield training_model_1.Training.find().populate('trainer', 'firstName lastName');
        // Enhance with enrollment count
        const result = yield Promise.all(trainings.map((t) => __awaiter(void 0, void 0, void 0, function* () {
            const count = yield training_model_1.TrainingMember.countDocuments({ training: t._id, status: 'active' });
            return Object.assign(Object.assign({}, t.toObject()), { enrolledCount: count });
        })));
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching trainings', error });
    }
});
exports.getAllTrainings = getAllTrainings;
const createTraining = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, trainerId, schedule, description } = req.body;
        // Verify trainer exists
        const trainer = yield user_model_1.User.findById(trainerId);
        if (!trainer || (trainer.role !== 'trainer' && trainer.role !== 'admin')) {
            return res.status(400).json({ message: 'Invalid trainer ID' });
        }
        const newTraining = new training_model_1.Training({
            name,
            trainer: trainerId,
            schedule,
            description
        });
        yield newTraining.save();
        res.status(201).json(newTraining);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating training', error });
    }
});
exports.createTraining = createTraining;
const enrollMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { trainingId } = req.params;
        const { memberId } = req.body;
        // If member is enrolling themselves, use req.user (middleware should populate user which might be linked to a Member profile?)
        // Assuming req.body.memberId is provided for flexibility (admin enrolling member)
        const existing = yield training_model_1.TrainingMember.findOne({ training: trainingId, member: memberId, status: 'active' });
        if (existing) {
            return res.status(400).json({ message: 'Member already enrolled' });
        }
        const enrollment = new training_model_1.TrainingMember({
            training: trainingId,
            member: memberId
        });
        yield enrollment.save();
        res.status(201).json(enrollment);
    }
    catch (error) {
        res.status(500).json({ message: 'Error enrolling member', error });
    }
});
exports.enrollMember = enrollMember;
const getMyTrainings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        if (role === 'trainer') {
            const trainings = yield training_model_1.Training.find({ trainer: userId }).populate('trainer', 'firstName lastName');
            const result = yield Promise.all(trainings.map((t) => __awaiter(void 0, void 0, void 0, function* () {
                const count = yield training_model_1.TrainingMember.countDocuments({ training: t._id, status: 'active' });
                return Object.assign(Object.assign({}, t.toObject()), { enrolledCount: count });
            })));
            return res.json(result);
        }
        if (role === 'member') {
            const member = yield member_model_1.Member.findOne({ user: userId });
            if (!member) {
                return res.status(404).json({ message: 'Member profile not found' });
            }
            const enrollments = yield training_model_1.TrainingMember.find({ member: member._id, status: 'active' })
                .populate({
                path: 'training',
                populate: { path: 'trainer', select: 'firstName lastName' }
            });
            // Return training details extracted from enrollments
            const trainings = enrollments.map(e => {
                // Ensure training is not null before accessing properties
                if (!e.training)
                    return null;
                const trainingObj = e.training.toObject ? e.training.toObject() : e.training;
                return Object.assign(Object.assign({}, trainingObj), { enrolledDate: e.enrolledDate });
            }).filter(t => t !== null);
            return res.json(trainings);
        }
        return res.json([]);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching my trainings', error });
    }
});
exports.getMyTrainings = getMyTrainings;
