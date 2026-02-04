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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const models_1 = require("../models");
dotenv_1.default.config();
const seedComprehensive = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gym_management';
        yield mongoose_1.default.connect(MONGODB_URI);
        console.log('📡 Connected to Database for Comprehensive Seeding');
        // 1. Create Staff & Trainers if not exist
        const staffEmail = 'staff@shankhamul.com';
        let staff = yield models_1.User.findOne({ email: staffEmail });
        if (!staff) {
            staff = yield models_1.User.create({ email: staffEmail, password: 'staff123', role: 'staff' });
        }
        const trainerEmail = 'trainer_pro@shankhamul.com';
        let trainerUser = yield models_1.User.findOne({ email: trainerEmail });
        if (!trainerUser) {
            trainerUser = yield models_1.User.create({ email: trainerEmail, password: 'trainer123', role: 'trainer' });
        }
        // 2. Create Members
        const memberData = [
            { first: 'Aayush', last: 'Sharma', phone: '9841000001', status: 'active', email: 'aayush@gmail.com' },
            { first: 'Sushant', last: 'KC', phone: '9841000002', status: 'active', email: 'sushant@gmail.com' },
            { first: 'Reema', last: 'Adhikari', phone: '9841000003', status: 'active', email: 'reema@gmail.com' },
            { first: 'Bibek', last: 'Thapa', phone: '9841000004', status: 'active', email: 'bibek@gmail.com' },
            { first: 'Pooja', last: 'Rai', phone: '9841000005', status: 'inactive', email: 'pooja@gmail.com' },
            { first: 'Kiran', last: 'Sunuwar', phone: '9841000006', status: 'active', email: 'kiran@gmail.com' },
            { first: 'Samir', last: 'Magar', phone: '9841000007', status: 'active', email: 'samir@gmail.com' },
            { first: 'Maya', last: 'Gurung', phone: '9841000008', status: 'active', email: 'maya@gmail.com' },
            { first: 'Nishant', last: 'Bista', phone: '9841000009', status: 'active', email: 'nishant@gmail.com' },
            { first: 'Elena', last: 'Tamang', phone: '9841000010', status: 'inactive', email: 'elena@gmail.com' },
        ];
        const createdMembers = [];
        for (const m of memberData) {
            let u = yield models_1.User.findOne({ email: m.email });
            if (!u) {
                u = yield models_1.User.create({ email: m.email, password: 'password123', role: 'member' });
            }
            let member = yield models_1.Member.findOne({ user: u._id });
            if (!member) {
                member = yield models_1.Member.create({
                    user: u._id,
                    firstName: m.first,
                    lastName: m.last,
                    phone: m.phone,
                    email: m.email,
                    status: m.status,
                    joinedDate: new Date(Date.now() - Math.random() * 10000000000)
                });
            }
            createdMembers.push(member);
        }
        console.log(`✅ ${createdMembers.length} Members created/verified`);
        // 3. Create Subscriptions
        const plans = [
            { name: 'Monthly Plan', price: 2000, months: 1 },
            { name: 'Quarterly Plan', price: 5500, months: 3 },
            { name: 'Six Months Plan', price: 10000, months: 6 },
            { name: 'Yearly Plan', price: 18000, months: 12 },
        ];
        for (const member of createdMembers) {
            const plan = plans[Math.floor(Math.random() * plans.length)];
            const status = member.status === 'active' ? 'active' : 'expired';
            let startDate, endDate;
            if (status === 'active') {
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 5);
                endDate = new Date();
                endDate.setMonth(endDate.getMonth() + plan.months);
            }
            else {
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - (plan.months + 1));
                endDate = new Date();
                endDate.setMonth(endDate.getMonth() - 1);
            }
            yield models_1.Subscription.create({
                member: member._id,
                planName: plan.name,
                price: plan.price,
                startDate,
                endDate,
                status,
                paymentStatus: 'paid'
            });
            yield models_1.Income.create({
                category: 'subscription',
                amount: plan.price,
                description: `Payment for ${plan.name} - ${member.firstName}`,
                paymentMethod: 'cash',
                memberId: member._id,
                receivedBy: staff._id,
                date: startDate,
                status: Math.random() > 0.8 ? 'pending' : 'completed'
            });
        }
        console.log('✅ Subscriptions and related Incomes created');
        // 4. Create Trainings
        const trainingPrograms = [
            { name: 'HIIT Intensive', trainer: trainerUser._id, schedule: [{ day: 'Monday', startTime: '07:00', endTime: '08:00', capacity: 15 }] },
            { name: 'Strength & Conditioning', trainer: trainerUser._id, schedule: [{ day: 'Tuesday', startTime: '18:00', endTime: '19:30', capacity: 20 }] },
            { name: 'Yoga Basics', trainer: trainerUser._id, schedule: [{ day: 'Wednesday', startTime: '06:00', endTime: '07:00', capacity: 12 }] },
            { name: 'Powerlifting 101', trainer: trainerUser._id, schedule: [{ day: 'Friday', startTime: '17:00', endTime: '18:30', capacity: 10 }] },
        ];
        for (const t of trainingPrograms) {
            yield models_1.Training.findOneAndUpdate({ name: t.name }, t, { upsert: true });
        }
        console.log('✅ Training programs created');
        // 5. Create Attendance history (30 days)
        console.log('⏳ Generating attendance history...');
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const attendeesCount = Math.floor(Math.random() * 5) + 3;
            const shuffled = [...createdMembers].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, attendeesCount);
            for (const m of selected) {
                const checkIn = new Date(date);
                checkIn.setHours(Math.floor(Math.random() * 12) + 6, Math.floor(Math.random() * 60));
                const checkOut = new Date(checkIn);
                checkOut.setMinutes(checkOut.getMinutes() + Math.floor(Math.random() * 90) + 30);
                yield models_1.Attendance.create({
                    member: m._id,
                    date: checkIn,
                    checkInTime: checkIn,
                    checkOutTime: checkOut,
                    method: 'qr'
                });
            }
        }
        console.log('✅ Attendance seeded');
        // 6. Create Historical Financial Data (last 6 months)
        console.log('⏳ Generating financial trends...');
        const catsExpense = ['rent', 'salaries', 'equipment', 'utilities', 'marketing', 'other'];
        const expAmts = { rent: 45000, salaries: 60000, equipment: 15000, utilities: 8000, marketing: 5000, other: 3000 };
        for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            d.setDate(15);
            for (const cat of catsExpense) {
                yield models_1.Expense.create({
                    category: cat,
                    amount: expAmts[cat] + (Math.random() * 2000 - 1000),
                    description: `Monthly ${cat} payment`,
                    date: d,
                    paymentMethod: 'bank_transfer'
                });
            }
            // Random Merchandise Incomes
            for (let j = 0; j < 5; j++) {
                yield models_1.Income.create({
                    category: 'merchandise',
                    amount: Math.floor(Math.random() * 50) * 100 + 500,
                    description: 'Items Sale',
                    date: new Date(d.getTime() + Math.random() * 10000000),
                    paymentMethod: 'cash',
                    receivedBy: staff._id
                });
            }
            // Random PT Incomes
            for (let j = 0; j < 3; j++) {
                yield models_1.Income.create({
                    category: 'personal_training',
                    amount: 5000,
                    description: 'PT Session',
                    date: new Date(d.getTime() + Math.random() * 10000000),
                    paymentMethod: 'cash',
                    receivedBy: staff._id
                });
            }
        }
        console.log('✅ Financial trends seeded');
        console.log('\n🌟 COMPREHENSIVE SEEDING COMPLETE 🌟');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
});
seedComprehensive();
