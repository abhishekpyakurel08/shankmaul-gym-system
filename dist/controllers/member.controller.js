"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMemberById = exports.updateMemberById = exports.updateMemberProfile = exports.deleteMember = exports.updateMemberStatus = exports.getMemberProfile = exports.approveSubscription = exports.getPendingSubscriptions = exports.requestRenewal = exports.getExpiringSubscriptions = exports.renewSubscription = exports.getMembers = exports.createMember = void 0;
const models_1 = require("../models");
const emailService = __importStar(require("../services/email.service"));
const createMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const _a = req.body, { email, password, firstName, lastName, phone, registrationFee } = _a, memberData = __rest(_a, ["email", "password", "firstName", "lastName", "phone", "registrationFee"]);
        let user;
        if (email && password) {
            user = yield models_1.User.create({ email, password, role: 'member' });
        }
        else if (req.body.userId) {
            user = yield models_1.User.findById(req.body.userId);
        }
        if (!user)
            return res.status(400).json({ message: 'User required' });
        const member = yield models_1.Member.create(Object.assign({ user: user._id, firstName,
            lastName,
            phone, avatar: req.body.avatar }, memberData));
        // Record Registration Fee as Income
        if (registrationFee) {
            yield models_1.Income.create({
                category: 'other',
                amount: registrationFee,
                description: `Registration fee for ${firstName} ${lastName}`,
                paymentMethod: req.body.paymentMethod || 'cash',
                memberId: member._id,
                receivedBy: req.user.id
            });
        }
        // Send Welcome Email
        yield emailService.sendWelcomeEmail(user.email, firstName);
        res.status(201).json(member);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating member', error });
    }
});
exports.createMember = createMember;
const getMembers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const members = yield models_1.Member.find().populate('user', '-password');
        // Enrich with subscription status
        const enrichedMembers = yield Promise.all(members.map((m) => __awaiter(void 0, void 0, void 0, function* () {
            const latestSub = yield models_1.Subscription.findOne({ member: m._id }).sort({ createdAt: -1 });
            return Object.assign(Object.assign({}, m.toObject()), { subscriptionStatus: latestSub ? latestSub.status : 'none', subscriptionDetails: latestSub });
        })));
        res.json(enrichedMembers);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching members' });
    }
});
exports.getMembers = getMembers;
const renewSubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { memberId, planName, price, durationMonths } = req.body;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + (durationMonths || 1));
        const subscription = yield models_1.Subscription.create({
            member: memberId,
            planName,
            price,
            startDate,
            endDate,
            status: 'active'
        });
        // Record as Income
        yield models_1.Income.create({
            category: 'subscription',
            amount: price,
            description: `Subscription renewal: ${planName}`,
            paymentMethod: req.body.paymentMethod || 'cash',
            memberId: memberId,
            receivedBy: req.user.id,
            date: startDate
        });
        res.json(subscription);
    }
    catch (error) {
        res.status(500).json({ message: 'Error renewing subscription' });
    }
});
exports.renewSubscription = renewSubscription;
const getExpiringSubscriptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const warningDate = new Date();
        warningDate.setDate(warningDate.getDate() + 7); // Expiring in 7 days
        const subscriptions = yield models_1.Subscription.find({
            endDate: { $lte: warningDate, $gte: new Date() },
            status: 'active'
        }).populate('member');
        res.json(subscriptions);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching expiring subscriptions' });
    }
});
exports.getExpiringSubscriptions = getExpiringSubscriptions;
const requestRenewal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { durationMonths } = req.body;
        if (![1, 3, 6, 12].includes(durationMonths)) {
            return res.status(400).json({ message: 'Invalid duration. Choose 1, 3, 6, or 12 months.' });
        }
        const member = yield models_1.Member.findOne({ user: userId });
        if (!member) {
            return res.status(404).json({ message: 'Member profile not found' });
        }
        // Determine plan name and price (normally these would be from a Plan model)
        let planName = 'Monthly Plan';
        let price = 2000; // Example average price in Nepal
        if (durationMonths === 3) {
            planName = '3 Months Plan';
            price = 5500;
        }
        else if (durationMonths === 6) {
            planName = '6 Months Plan';
            price = 10000;
        }
        else if (durationMonths === 12) {
            planName = 'Yearly Plan';
            price = 18000;
        }
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + durationMonths);
        const subscription = yield models_1.Subscription.create({
            member: member._id,
            planName,
            price,
            startDate,
            endDate,
            status: 'pending',
            paymentStatus: 'pending'
        });
        // Real-time broadcast to Admin/Staff
        const io = req.app.get('io');
        io.emit('new_subscription_request', {
            member: member.firstName + ' ' + member.lastName,
            plan: planName
        });
        res.status(201).json({
            message: 'Subscription request sent. Please contact reception to complete payment.',
            subscription
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error requesting renewal', error });
    }
});
exports.requestRenewal = requestRenewal;
const getPendingSubscriptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subscriptions = yield models_1.Subscription.find({ status: 'pending' }).populate('member');
        res.json(subscriptions);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching requests' });
    }
});
exports.getPendingSubscriptions = getPendingSubscriptions;
const approveSubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { subscriptionId } = req.body;
        const sub = yield models_1.Subscription.findById(subscriptionId).populate('member');
        if (!sub)
            return res.status(404).json({ message: 'Subscription not found' });
        sub.status = 'active';
        sub.paymentStatus = 'paid';
        yield sub.save();
        // Ensure member is active
        const member = yield models_1.Member.findByIdAndUpdate(sub.member, { status: 'active' }).populate('user');
        // Send Payment Success Email
        if (member && member.user) {
            yield emailService.sendPaymentSuccessEmail(member.user.email, member.firstName, sub.price, sub._id.toString());
        }
        // Record as Income
        yield models_1.Income.create({
            category: 'subscription',
            amount: sub.price,
            description: `Subscription approved: ${sub.planName}`,
            paymentMethod: req.body.paymentMethod || 'cash',
            memberId: sub.member,
            receivedBy: req.user.id,
            date: new Date()
        });
        // Real-time broadcast for Analytics update
        const io = req.app.get('io');
        if (member) {
            io.emit('subscription_approved', {
                amount: sub.price,
                member: member.firstName,
                memberId: member._id
            });
        }
        res.json({ message: 'Subscription approved and activated', subscription: sub });
    }
    catch (error) {
        res.status(500).json({ message: 'Error approving subscription' });
    }
});
exports.approveSubscription = approveSubscription;
const getMemberProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const member = yield models_1.Member.findOne({ user: req.user.id }).populate('user', '-password');
        if (!member)
            return res.status(404).json({ message: 'Member profile not found' });
        // Get the latest active subscription
        const activeSub = yield models_1.Subscription.findOne({
            member: member._id,
            status: 'active',
            endDate: { $gte: new Date() }
        }).sort({ endDate: -1 });
        res.json(Object.assign(Object.assign({}, member.toObject()), { activeSubscription: activeSub }));
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});
exports.getMemberProfile = getMemberProfile;
const updateMemberStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const member = yield models_1.Member.findByIdAndUpdate(id, { status }, { new: true }).populate('user');
        if (!member)
            return res.status(404).json({ message: 'Member not found' });
        // Broadcast status change
        const io = req.app.get('io');
        io.emit('member_status_updated', {
            id: member._id,
            name: member.firstName,
            status: member.status
        });
        res.json(member);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating status' });
    }
});
exports.updateMemberStatus = updateMemberStatus;
const deleteMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const member = yield models_1.Member.findById(id);
        if (!member)
            return res.status(404).json({ message: 'Member not found' });
        // Delete associated user as well
        if (member.user) {
            yield models_1.User.findByIdAndDelete(member.user);
        }
        yield models_1.Member.findByIdAndDelete(id);
        res.json({ message: 'Member and associated user deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting member' });
    }
});
exports.deleteMember = deleteMember;
const updateMemberProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const member = yield models_1.Member.findOneAndUpdate({ user: req.user.id }, { $set: req.body }, { new: true });
        if (!member)
            return res.status(404).json({ message: 'Member profile not found' });
        res.json(member);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating profile' });
    }
});
exports.updateMemberProfile = updateMemberProfile;
const updateMemberById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const member = yield models_1.Member.findByIdAndUpdate(id, { $set: req.body }, { new: true }).populate('user', '-password');
        if (!member)
            return res.status(404).json({ message: 'Member not found' });
        res.json(member);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating member' });
    }
});
exports.updateMemberById = updateMemberById;
const getMemberById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const member = yield models_1.Member.findById(id).populate('user', '-password');
        if (!member)
            return res.status(404).json({ message: 'Member profile not found' });
        const activeSub = yield models_1.Subscription.findOne({
            member: member._id,
            status: 'active',
            endDate: { $gte: new Date() }
        }).sort({ endDate: -1 });
        res.json(Object.assign(Object.assign({}, member.toObject()), { activeSubscription: activeSub }));
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching member by ID' });
    }
});
exports.getMemberById = getMemberById;
