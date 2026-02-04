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
exports.deleteUser = exports.updateUserRole = exports.getUsers = exports.qrTokenLogin = exports.login = exports.register = void 0;
const models_1 = require("../models");
const auth_1 = require("../utils/auth");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, role } = req.body;
        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        const existingUser = yield models_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const user = yield models_1.User.create({ email, password, role });
        const token = (0, auth_1.generateAuthToken)(user);
        res.status(201).json({ token, user: { id: user._id, email: user.email, role: user.role } });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield models_1.User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = yield user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = (0, auth_1.generateAuthToken)(user);
        // Subscription-based check for members
        let memberData = null;
        if (user.role === 'member') {
            const member = yield models_1.Member.findOne({ user: user._id });
            if (member) {
                const activeSub = yield models_1.Subscription.findOne({
                    member: member._id,
                    status: 'active',
                    endDate: { $gte: new Date() }
                });
                if (!activeSub) {
                    member.status = 'inactive';
                    yield member.save();
                    return res.status(403).json({
                        message: 'Your membership has expired. Please contact reception to renew.',
                        expired: true
                    });
                }
                memberData = {
                    id: member._id,
                    status: member.status,
                    hasActiveSubscription: true
                };
            }
        }
        res.json({
            token,
            user: { id: user._id, email: user.email, role: user.role },
            member: memberData
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.login = login;
const qrTokenLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token: qrToken } = req.body;
        if (!qrToken)
            return res.status(400).json({ message: 'Token required' });
        const user = yield models_1.User.findOne({ qrLoginToken: qrToken });
        if (!user)
            return res.status(401).json({ message: 'Invalid or expired token' });
        const authToken = (0, auth_1.generateAuthToken)(user);
        // Subscription check for members (duplicated logic from login for consistency)
        let memberData = null;
        if (user.role === 'member') {
            const member = yield models_1.Member.findOne({ user: user._id });
            if (member) {
                const activeSub = yield models_1.Subscription.findOne({
                    member: member._id,
                    status: 'active',
                    endDate: { $gte: new Date() }
                });
                if (!activeSub) {
                    member.status = 'inactive';
                    yield member.save();
                    return res.status(403).json({ message: 'Membership expired', expired: true });
                }
                memberData = { id: member._id, status: member.status, hasActiveSubscription: true };
            }
        }
        res.json({
            token: authToken,
            user: { id: user._id, email: user.email, role: user.role },
            member: memberData
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.qrTokenLogin = qrTokenLogin;
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield models_1.User.find().select('-password');
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});
exports.getUsers = getUsers;
const updateUserRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const user = yield models_1.User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating user role' });
    }
});
exports.updateUserRole = updateUserRole;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield models_1.User.findByIdAndDelete(id);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
});
exports.deleteUser = deleteUser;
