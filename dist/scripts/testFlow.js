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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Mock Env for Testing to avoid Resend crash
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test_123456789';
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const qrToken_1 = require("../utils/qrToken");
const attendance_service_1 = require("../services/attendance.service");
const runFlow = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gym_management';
        yield mongoose_1.default.connect(MONGODB_URI);
        console.log('🔗 Connected to Database for Flow Integration Test');
        // ==========================================
        // 1. REGISTER MEMBER
        // ==========================================
        console.log('\n[1] Registering New Member...');
        const uniqueSuffix = Date.now().toString().slice(-4);
        const email = `flow_test_${uniqueSuffix}@example.com`;
        const user = yield models_1.User.create({
            email,
            password: 'password123',
            role: 'member'
        });
        const member = yield models_1.Member.create({
            user: user._id,
            firstName: 'Flow',
            lastName: 'Tester',
            phone: '9800000000',
            status: 'active'
        });
        console.log(`✅ Member Created: ${member.firstName} (${email})`);
        // ==========================================
        // 2. PURCHASE SUBSCRIPTION
        // ==========================================
        console.log('\n[2] Purchasing Subscription...');
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        const subscription = yield models_1.Subscription.create({
            member: member._id,
            planName: 'Integration Test Plan',
            price: 1500,
            startDate,
            endDate,
            status: 'active',
            paymentStatus: 'paid'
        });
        yield models_1.Income.create({
            category: 'subscription',
            amount: 1500,
            description: `Subscription: ${subscription.planName}`,
            paymentMethod: 'cash',
            memberId: member._id,
            date: new Date()
        });
        console.log(`✅ Subscription Active: ${subscription.planName}`);
        // ==========================================
        // 3. GENERATE QR TOKEN
        // ==========================================
        console.log('\n[3] Generating access token...');
        const qrToken = (0, qrToken_1.generateQRToken)(member._id.toString());
        console.log('✅ Token Generated');
        // ==========================================
        // 4. CHECK-IN (QR)
        // ==========================================
        console.log('\n[4] Simulating Check-in...');
        const checkInResult = yield (0, attendance_service_1.processQRCheckIn)(qrToken);
        if (checkInResult.type !== 'checkin')
            throw new Error('Expected checkin type');
        if (!checkInResult.attendance)
            throw new Error('Attendance not returned for checkin');
        console.log(`✅ Check-in Successful at ${checkInResult.attendance.checkInTime}`);
        // ==========================================
        // 5. CHECK-OUT (QR Toggle)
        // ==========================================
        console.log('\n[5] Simulating Check-out (Toggle)...');
        // Wait a small moment to ensure timestamps differ slightly if needed
        yield new Promise(r => setTimeout(r, 1000));
        // Use same function to test the toggle logic
        const checkOutResult = yield (0, attendance_service_1.processQRCheckIn)(qrToken);
        if (checkOutResult.type !== 'checkout')
            throw new Error('Expected checkout type');
        if (!checkOutResult.attendance)
            throw new Error('Attendance not returned for checkout');
        if (!checkOutResult.attendance.checkOutTime)
            throw new Error('Checkout time missing');
        console.log(`✅ Check-out Successful at ${checkOutResult.attendance.checkOutTime}`);
        console.log(`⏱️ Duration: ${checkOutResult.attendance.duration || 0} minutes`);
        // ==========================================
        // 6. CLEANUP
        // ==========================================
        console.log('\n[6] Cleanup...');
        yield models_1.Attendance.deleteMany({ member: member._id });
        yield models_1.Subscription.deleteMany({ member: member._id });
        yield models_1.Income.deleteMany({ memberId: member._id });
        yield models_1.Member.findByIdAndDelete(member._id);
        yield models_1.User.findByIdAndDelete(user._id);
        console.log('✅ Test Data Cleaned');
        console.log('\n✨ GYM FLOW INTEGRATION TEST PASSED ✨');
        process.exit(0);
    }
    catch (error) {
        console.error('\n❌ Flow Integration Failed:', error);
        process.exit(1);
    }
});
runFlow();
