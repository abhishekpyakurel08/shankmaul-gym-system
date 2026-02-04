
import dotenv from 'dotenv';
dotenv.config();

// Mock Env for Testing to avoid Resend crash
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test_123456789';

import mongoose from 'mongoose';
import { User, Member, Subscription, Attendance, Income } from '../models';
import { generateQRToken } from '../utils/qrToken';
import { processQRCheckIn } from '../services/attendance.service';

const runFlow = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gym_management';
        await mongoose.connect(MONGODB_URI);
        console.log('🔗 Connected to Database for Flow Integration Test');

        // ==========================================
        // 1. REGISTER MEMBER
        // ==========================================
        console.log('\n[1] Registering New Member...');
        const uniqueSuffix = Date.now().toString().slice(-4);
        const email = `flow_test_${uniqueSuffix}@example.com`;

        const user = await User.create({
            email,
            password: 'password123',
            role: 'member'
        });

        const member = await Member.create({
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

        const subscription = await Subscription.create({
            member: member._id,
            planName: 'Integration Test Plan',
            price: 1500,
            startDate,
            endDate,
            status: 'active',
            paymentStatus: 'paid'
        });

        await Income.create({
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
        const qrToken = generateQRToken(member._id.toString());
        console.log('✅ Token Generated');

        // ==========================================
        // 4. CHECK-IN (QR)
        // ==========================================
        console.log('\n[4] Simulating Check-in...');
        const checkInResult = await processQRCheckIn(qrToken);

        if (checkInResult.type !== 'checkin') throw new Error('Expected checkin type');
        if (!checkInResult.attendance) throw new Error('Attendance not returned for checkin');

        console.log(`✅ Check-in Successful at ${checkInResult.attendance.checkInTime}`);

        // ==========================================
        // 5. CHECK-OUT (QR Toggle)
        // ==========================================
        console.log('\n[5] Simulating Check-out (Toggle)...');

        // Wait a small moment to ensure timestamps differ slightly if needed
        await new Promise(r => setTimeout(r, 1000));

        // Use same function to test the toggle logic
        const checkOutResult = await processQRCheckIn(qrToken);

        if (checkOutResult.type !== 'checkout') throw new Error('Expected checkout type');
        if (!checkOutResult.attendance) throw new Error('Attendance not returned for checkout');
        if (!checkOutResult.attendance.checkOutTime) throw new Error('Checkout time missing');

        console.log(`✅ Check-out Successful at ${checkOutResult.attendance.checkOutTime}`);
        console.log(`⏱️ Duration: ${checkOutResult.attendance.duration || 0} minutes`);

        // ==========================================
        // 6. CLEANUP
        // ==========================================
        console.log('\n[6] Cleanup...');
        await Attendance.deleteMany({ member: member._id });
        await Subscription.deleteMany({ member: member._id });
        await Income.deleteMany({ memberId: member._id });
        await Member.findByIdAndDelete(member._id);
        await User.findByIdAndDelete(user._id);
        console.log('✅ Test Data Cleaned');

        console.log('\n✨ GYM FLOW INTEGRATION TEST PASSED ✨');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Flow Integration Failed:', error);
        process.exit(1);
    }
};

runFlow();
