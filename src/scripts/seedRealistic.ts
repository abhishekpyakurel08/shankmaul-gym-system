import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model';
import { Member } from '../models/member.model';
import { Subscription } from '../models/subscription.model';
import { Attendance } from '../models/attendance.model';
import { Income, Expense, Payment } from '../models/finance.model';
import { Training, TrainingMember } from '../models/training.model';
import { Notification } from '../models/notification.model';
import { Product } from '../models/product.model';
import { fileStorage } from '../utils/fileStorage';

dotenv.config();

/**
 * Comprehensive Realistic Seeder for Gym Management System
 * Features:
 * - Real Nepali names and addresses
 * - Realistic contact information
 * - Historical data (6+ months)
 * - Avatar generation
 * - Varied subscription plans
 * - Realistic attendance patterns
 * - Financial transactions
 */

// Realistic Nepali Data
const NEPALI_FIRST_NAMES = {
    male: ['Aayush', 'Bibek', 'Kiran', 'Nishant', 'Samir', 'Sushant', 'Rohan', 'Prakash', 'Ashish', 'Dinesh', 'Rajesh', 'Suresh', 'Manish', 'Anil', 'Santosh'],
    female: ['Reema', 'Pooja', 'Maya', 'Elena', 'Tara', 'Shreya', 'Priya', 'Aarti', 'Sunita', 'Kabita', 'Sangita', 'Anita', 'Sita', 'Gita', 'Krishna']
};

const NEPALI_LAST_NAMES = ['Sharma', 'KC', 'Adhikari', 'Thapa', 'Rai', 'Sunuwar', 'Magar', 'Gurung', 'Bista', 'Tamang', 'Shrestha', 'Karki', 'Poudel', 'Neupane', 'Ghimire', 'Pant', 'Subedi', 'Acharya', 'Bhattarai', 'Basnet'];

const KATHMANDU_AREAS = [
    'Thamel, Kathmandu',
    'Sanepa, Lalitpur',
    'Baluwatar, Kathmandu',
    'Jhamsikhel, Lalitpur',
    'Baneshwor, Kathmandu',
    'Kupondole, Lalitpur',
    'Naxal, Kathmandu',
    'Pulchowk, Lalitpur',
    'Koteshwor, Kathmandu',
    'Maharajgunj, Kathmandu',
    'Chabahil, Kathmandu',
    'Buddhanagar, Kathmandu',
    'Satdobato, Lalitpur',
    'Kalanki, Kathmandu',
    'New Baneshwor, Kathmandu'
];

const TRAINING_PROGRAMS = [
    {
        name: 'HIIT Intensive',
        description: 'High-Intensity Interval Training for maximum fat burn',
        schedule: [
            { dayOfWeek: 1, startTime: '07:00', endTime: '08:00', capacity: 15 },
            { dayOfWeek: 3, startTime: '07:00', endTime: '08:00', capacity: 15 },
            { dayOfWeek: 5, startTime: '07:00', endTime: '08:00', capacity: 15 }
        ]
    },
    {
        name: 'Strength & Conditioning',
        description: 'Build muscle and improve overall strength',
        schedule: [
            { dayOfWeek: 2, startTime: '18:00', endTime: '19:30', capacity: 20 },
            { dayOfWeek: 4, startTime: '18:00', endTime: '19:30', capacity: 20 }
        ]
    },
    {
        name: 'Yoga Basics',
        description: 'Flexibility, balance, and mindfulness for beginners',
        schedule: [
            { dayOfWeek: 1, startTime: '06:00', endTime: '07:00', capacity: 12 },
            { dayOfWeek: 3, startTime: '06:00', endTime: '07:00', capacity: 12 },
            { dayOfWeek: 5, startTime: '06:00', endTime: '07:00', capacity: 12 }
        ]
    },
    {
        name: 'Powerlifting 101',
        description: 'Learn proper form and technique for compound lifts',
        schedule: [
            { dayOfWeek: 2, startTime: '17:00', endTime: '18:30', capacity: 10 },
            { dayOfWeek: 5, startTime: '17:00', endTime: '18:30', capacity: 10 }
        ]
    },
    {
        name: 'Cardio Blast',
        description: 'Heart-pumping cardio sessions for endurance',
        schedule: [
            { dayOfWeek: 1, startTime: '18:00', endTime: '19:00', capacity: 25 },
            { dayOfWeek: 4, startTime: '18:00', endTime: '19:00', capacity: 25 }
        ]
    },
    {
        name: 'CrossFit Warriors',
        description: 'Functional fitness for everyday life',
        schedule: [
            { dayOfWeek: 2, startTime: '06:30', endTime: '07:30', capacity: 18 },
            { dayOfWeek: 4, startTime: '06:30', endTime: '07:30', capacity: 18 },
            { dayOfWeek: 6, startTime: '08:00', endTime: '09:00', capacity: 18 }
        ]
    }
];

const SUBSCRIPTION_PLANS = [
    { name: 'Monthly Basic', price: 2000, months: 1, popular: false },
    { name: 'Monthly Premium', price: 3500, months: 1, popular: false },
    { name: 'Quarterly Basic', price: 5500, months: 3, popular: true },
    { name: 'Quarterly Premium', price: 9500, months: 3, popular: false },
    { name: 'Six Months Basic', price: 10000, months: 6, popular: true },
    { name: 'Six Months Premium', price: 18000, months: 6, popular: false },
    { name: 'Yearly Basic', price: 18000, months: 12, popular: false },
    { name: 'Yearly Premium', price: 32000, months: 12, popular: true }
];

// Helper Functions
const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const randomInt = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const randomDate = (start: Date, end: Date): Date =>
    new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const generatePhone = (): string => {
    const prefixes = ['984', '985', '986'];
    const prefix = randomElement(prefixes);
    const number = randomInt(1000000, 9999999);
    return `${prefix}${number}`;
};

const generateEmail = (firstName: string, lastName: string): string => {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const formats = [
        `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
        `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
        `${firstName.toLowerCase()}${randomInt(1, 999)}`
    ];
    return `${randomElement(formats)}@${randomElement(domains)}`;
};

const generateEmergencyContact = (): string => {
    const relations = ['Father', 'Mother', 'Spouse', 'Sibling', 'Friend'];
    const relation = randomElement(relations);
    const name = randomElement(NEPALI_FIRST_NAMES.male.concat(NEPALI_FIRST_NAMES.female));
    const lastName = randomElement(NEPALI_LAST_NAMES);
    const phone = generatePhone();
    return `${name} ${lastName} (${relation}) - ${phone}`;
};

const generateDOB = (): Date => {
    const year = randomInt(1980, 2005);
    const month = randomInt(0, 11);
    const day = randomInt(1, 28);
    return new Date(year, month, day);
};

// Main Seeder Function
const seedRealisticData = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gym_management';
        await mongoose.connect(MONGODB_URI);
        console.log('📡 Connected to MongoDB for Realistic Seeding\n');

        // Clear existing data (optional - comment out if you want to keep existing data)
        console.log('🧹 Clearing existing data...');
        await User.deleteMany({ email: { $ne: 'admin@shankhamul.com' } });
        await Member.deleteMany({});
        await Subscription.deleteMany({});
        await Attendance.deleteMany({});
        await Income.deleteMany({});
        await Expense.deleteMany({});
        await Payment.deleteMany({});
        await Training.deleteMany({});
        await TrainingMember.deleteMany({});
        await Notification.deleteMany({});
        await Product.deleteMany({});
        console.log('✅ Database cleared\n');

        // ===== 1. CREATE ADMIN, STAFF, AND TRAINERS =====
        console.log('👥 Creating admin, staff, and trainers...');

        let admin = await User.findOne({ email: 'admin@shankhamul.com' });
        if (!admin) {
            admin = await User.create({
                email: 'admin@shankhamul.com',
                password: 'admin123',
                role: 'admin'
            });
        }

        const staff = await User.create({
            email: 'staff@shankhamul.com',
            password: 'staff123',
            role: 'staff'
        });

        const trainers = [];
        for (let i = 0; i < 3; i++) {
            const firstName = randomElement(NEPALI_FIRST_NAMES.male);
            const lastName = randomElement(NEPALI_LAST_NAMES);
            const trainer = await User.create({
                email: `${firstName.toLowerCase()}.trainer@shankhamul.com`,
                password: 'trainer123',
                role: 'trainer'
            });
            trainers.push({ user: trainer, firstName, lastName });
        }

        console.log(`✅ Created 1 admin, 1 staff, ${trainers.length} trainers\n`);

        // ===== 2. CREATE MEMBERS =====
        console.log('👤 Creating members with realistic data...');

        const members = [];
        const totalMembers = 50; // Create 50 members for realistic data

        for (let i = 0; i < totalMembers; i++) {
            const gender = Math.random() > 0.5 ? 'male' : 'female';
            const firstName = randomElement(NEPALI_FIRST_NAMES[gender]);
            const lastName = randomElement(NEPALI_LAST_NAMES);
            const email = generateEmail(firstName, lastName);
            const phone = generatePhone();
            const dob = generateDOB();
            const address = randomElement(KATHMANDU_AREAS);
            const emergencyContact = generateEmergencyContact();

            // Generate avatar URL
            const avatar = fileStorage.generateAvatarUrl(firstName, lastName);

            // Determine member status (80% active, 15% inactive, 5% suspended)
            let status: 'active' | 'inactive' | 'suspended' = 'active';
            const rand = Math.random();
            if (rand < 0.05) status = 'suspended';
            else if (rand < 0.2) status = 'inactive';

            // Generate join date (some older members, some new)
            const joinedDate = randomDate(
                new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
                new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 1 week ago
            );

            const user = await User.create({
                email,
                password: 'password123',
                role: 'member',
                qrLoginToken: `QR_${Date.now()}_${i}`
            });

            const member = await Member.create({
                user: user._id,
                firstName,
                lastName,
                phone,
                status,
                joinedDate,
                address,
                emergencyContact,
                dateOfBirth: dob,
                gender,
                avatar,
                qrCode: `MEMBER_${user._id}`
            });

            members.push(member);
        }

        console.log(`✅ Created ${members.length} members with realistic profiles\n`);

        // ===== 3. CREATE TRAINING PROGRAMS =====
        console.log('🏋️ Creating training programs...');

        const createdTrainings = [];
        for (const program of TRAINING_PROGRAMS) {
            const trainer = randomElement(trainers);
            const training = await Training.create({
                name: program.name,
                trainer: trainer.user._id,
                schedule: program.schedule,
                description: program.description
            });
            createdTrainings.push(training);
        }

        console.log(`✅ Created ${createdTrainings.length} training programs\n`);

        // ===== 4. ASSIGN MEMBERS TO TRAINING PROGRAMS =====
        console.log('📋 Assigning members to training programs...');

        let trainingMembersCount = 0;
        for (const member of members) {
            if (member.status === 'active' && Math.random() > 0.4) {
                const numPrograms = randomInt(1, 3);
                const selectedPrograms = [...createdTrainings]
                    .sort(() => 0.5 - Math.random())
                    .slice(0, numPrograms);

                for (const training of selectedPrograms) {
                    await TrainingMember.create({
                        training: training._id,
                        member: member._id,
                        enrolledDate: randomDate(member.joinedDate, new Date()),
                        status: 'active'
                    });
                    trainingMembersCount++;
                }
            }
        }

        console.log(`✅ ${trainingMembersCount} training enrollments created\n`);

        // ===== 5. CREATE SUBSCRIPTIONS =====
        console.log('💳 Creating subscriptions...');

        for (const member of members) {
            const plan = randomElement(SUBSCRIPTION_PLANS);

            let startDate, endDate, status, paymentStatus;

            if (member.status === 'active') {
                // Active members have valid subscriptions
                startDate = randomDate(member.joinedDate, new Date());
                endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + plan.months);
                status = 'active';
                paymentStatus = Math.random() > 0.9 ? 'pending' : 'paid';
            } else if (member.status === 'inactive') {
                // Inactive members have expired subscriptions
                startDate = randomDate(
                    new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
                    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                );
                endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + plan.months);
                status = 'expired';
                paymentStatus = 'paid';
            } else {
                // Suspended members
                startDate = randomDate(member.joinedDate, new Date());
                endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + plan.months);
                status = 'cancelled';
                paymentStatus = 'failed';
            }

            await Subscription.create({
                member: member._id,
                planName: plan.name,
                price: plan.price,
                startDate,
                endDate,
                status,
                paymentStatus
            });

            // Create corresponding payment
            await Payment.create({
                member: member._id,
                amount: plan.price,
                paymentMethod: randomElement(['cash', 'card', 'bank_transfer', 'online']),
                status: paymentStatus === 'paid' ? 'completed' : paymentStatus === 'pending' ? 'pending' : 'failed',
                date: startDate,
                description: `Subscription - ${plan.name}`,
                transactionId: paymentStatus === 'paid' ? `TXN${Date.now()}${randomInt(1000, 9999)}` : undefined
            });

            // Create income record
            if (paymentStatus === 'paid') {
                await Income.create({
                    category: 'subscription',
                    amount: plan.price,
                    description: `${plan.name} - ${member.firstName} ${member.lastName}`,
                    paymentMethod: randomElement(['cash', 'card', 'bank_transfer', 'online']),
                    memberId: member._id,
                    receivedBy: staff._id,
                    date: startDate,
                    status: 'completed'
                });
            }
        }

        console.log(`✅ Created subscriptions and payments for ${members.length} members\n`);

        // ===== 6. CREATE ATTENDANCE RECORDS (Last 90 days) =====
        console.log('📅 Generating attendance records (90 days)...');

        let attendanceCount = 0;
        const activeMembers = members.filter(m => m.status === 'active');

        for (let i = 0; i < 90; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            // Skip some days randomly (gym closed or low attendance)
            if (Math.random() < 0.1) continue;

            // 40-70% of active members attend each day
            const attendanceRate = Math.random() * 0.3 + 0.4;
            const attendeesCount = Math.floor(activeMembers.length * attendanceRate);

            const shuffled = [...activeMembers].sort(() => 0.5 - Math.random());
            const attendees = shuffled.slice(0, attendeesCount);

            for (const member of attendees) {
                // Morning (6-11 AM) or Evening (4-9 PM) sessions
                const isMorning = Math.random() > 0.4;
                const checkInHour = isMorning ? randomInt(6, 11) : randomInt(16, 21);
                const checkInMinute = randomInt(0, 59);

                const checkIn = new Date(date);
                checkIn.setHours(checkInHour, checkInMinute, 0, 0);

                // Workout duration: 45-150 minutes
                const duration = randomInt(45, 150);
                const checkOut = new Date(checkIn);
                checkOut.setMinutes(checkOut.getMinutes() + duration);

                await Attendance.create({
                    member: member._id,
                    date: checkIn,
                    checkInTime: checkIn,
                    checkOutTime: checkOut,
                    method: randomElement(['qr', 'manual', 'qr', 'qr']), // 75% QR
                    duration
                });

                attendanceCount++;
            }
        }

        console.log(`✅ Created ${attendanceCount} attendance records\n`);

        // ===== 7. CREATE FINANCIAL RECORDS (Last 6 months) =====
        console.log('💰 Generating financial data (6 months)...');

        const expenseCategories = [
            { category: 'rent', amount: 45000, variance: 0 },
            { category: 'salaries', amount: 80000, variance: 5000 },
            { category: 'equipment', amount: 15000, variance: 10000 },
            { category: 'utilities', amount: 12000, variance: 3000 },
            { category: 'maintenance', amount: 8000, variance: 5000 },
            { category: 'marketing', amount: 10000, variance: 5000 },
            { category: 'supplies', amount: 5000, variance: 2000 },
            { category: 'other', amount: 3000, variance: 2000 }
        ];

        let expenseCount = 0;
        let additionalIncomeCount = 0;

        for (let i = 0; i < 6; i++) {
            const monthDate = new Date();
            monthDate.setMonth(monthDate.getMonth() - i);
            monthDate.setDate(15);

            // Monthly expenses
            for (const exp of expenseCategories) {
                const amount = exp.amount + (Math.random() * exp.variance * 2 - exp.variance);

                await Expense.create({
                    category: exp.category,
                    amount: Math.round(amount),
                    description: `Monthly ${exp.category} expense`,
                    paymentMethod: exp.category === 'rent' || exp.category === 'salaries' ? 'bank_transfer' : randomElement(['cash', 'card', 'bank_transfer']),
                    vendor: exp.category === 'equipment' ? 'FitGear Nepal' : exp.category === 'utilities' ? 'NEA/NTC' : 'Various',
                    date: monthDate
                });
                expenseCount++;
            }

            // Additional income: Personal Training
            const ptSessions = randomInt(10, 25);
            for (let j = 0; j < ptSessions; j++) {
                const sessionDate = new Date(monthDate);
                sessionDate.setDate(randomInt(1, 28));

                await Income.create({
                    category: 'personal_training',
                    amount: randomElement([3000, 5000, 7000]),
                    description: 'Personal Training Session',
                    paymentMethod: randomElement(['cash', 'card', 'online']),
                    memberId: randomElement(activeMembers)._id,
                    receivedBy: randomElement(trainers).user._id,
                    date: sessionDate,
                    status: 'completed'
                });
                additionalIncomeCount++;
            }

            // Additional income: Merchandise
            const merchandiseSales = randomInt(5, 15);
            for (let j = 0; j < merchandiseSales; j++) {
                const saleDate = new Date(monthDate);
                saleDate.setDate(randomInt(1, 28));

                await Income.create({
                    category: 'merchandise',
                    amount: randomInt(5, 50) * 100,
                    description: randomElement(['Protein Shake', 'Gym Bag', 'Water Bottle', 'Gym Apparel', 'Towel', 'Resistance Bands']),
                    paymentMethod: randomElement(['cash', 'card', 'online']),
                    memberId: Math.random() > 0.3 ? randomElement(activeMembers)._id : undefined,
                    receivedBy: staff._id,
                    date: saleDate,
                    status: 'completed'
                });
                additionalIncomeCount++;
            }

            // Additional income: Other
            const otherIncome = randomInt(2, 5);
            for (let j = 0; j < otherIncome; j++) {
                const incomeDate = new Date(monthDate);
                incomeDate.setDate(randomInt(1, 28));

                await Income.create({
                    category: 'other',
                    amount: randomInt(10, 100) * 100,
                    description: randomElement(['Locker Rental', 'Guest Pass', 'Late Fee', 'Document Fee']),
                    paymentMethod: randomElement(['cash', 'card']),
                    receivedBy: staff._id,
                    date: incomeDate,
                    status: 'completed'
                });
                additionalIncomeCount++;
            }
        }

        console.log(`✅ Created ${expenseCount} expense records`);
        console.log(`✅ Created ${additionalIncomeCount} additional income records\n`);

        // ===== 8. CREATE NOTIFICATIONS =====
        console.log('🔔 Creating notifications...');

        let notificationCount = 0;

        // Welcome notifications for all members
        for (const member of members) {
            const user = await User.findById(member.user);
            if (user) {
                await Notification.create({
                    recipient: user._id,
                    title: 'Welcome to Shankhamul Gym!',
                    message: `Hello ${member.firstName}! Welcome to our fitness family. We're excited to help you achieve your fitness goals.`,
                    type: 'success',
                    read: Math.random() > 0.3,
                    createdAt: member.joinedDate
                });
                notificationCount++;
            }
        }

        // Expiring subscription warnings
        const expiringMembers = members.filter(m => m.status === 'active').slice(0, 10);
        for (const member of expiringMembers) {
            const user = await User.findById(member.user);
            if (user) {
                await Notification.create({
                    recipient: user._id,
                    title: 'Subscription Expiring Soon',
                    message: 'Your subscription will expire in 7 days. Please renew to continue enjoying our services.',
                    type: 'warning',
                    read: Math.random() > 0.5,
                    createdAt: new Date(Date.now() - randomInt(1, 5) * 24 * 60 * 60 * 1000)
                });
                notificationCount++;
            }
        }

        console.log(`✅ Created ${notificationCount} notifications\n`);

        // ===== 9. CREATE PRODUCTS (INVENTORY) =====
        console.log('🛍️ Creating product inventory...');

        const products = [
            { name: 'Whey Protein Isolate (2.2kg)', category: 'supplements', price: 8500, cost: 6500, stock: 20 },
            { name: 'Creatine Monohydrate (250g)', category: 'supplements', price: 1500, cost: 900, stock: 50 },
            { name: 'Pre-Workout Energy (30 servings)', category: 'supplements', price: 3500, cost: 2200, stock: 30 },
            { name: 'BCAA Powder', category: 'supplements', price: 2500, cost: 1600, stock: 25 },
            { name: 'Gym T-Shirt (M)', category: 'apparel', price: 1200, cost: 600, stock: 50 },
            { name: 'Gym Hoodie (L)', category: 'apparel', price: 2500, cost: 1500, stock: 30 },
            { name: 'Shaker Bottle', category: 'gear', price: 500, cost: 250, stock: 100 },
            { name: 'Lifting Straps', category: 'gear', price: 800, cost: 350, stock: 40 },
            { name: 'Water (1L)', category: 'drinks', price: 50, cost: 30, stock: 200 },
            { name: 'Energy Drink', category: 'drinks', price: 250, cost: 150, stock: 100 }
        ];

        let productCount = 0;
        for (const p of products) {
            await Product.create({
                name: p.name,
                category: p.category,
                price: p.price,
                costPrice: p.cost,
                stock: p.stock,
                sku: `SKU-${Date.now().toString().slice(-6)}-${productCount}`,
                description: `High quality ${p.category} item`,
                isActive: true
            });
            productCount++;
        }

        console.log(`✅ Created ${productCount} products in inventory\n`);

        // ===== SUMMARY =====
        console.log('\n🎉 ========================================');
        console.log('🌟 REALISTIC SEEDING COMPLETE! 🌟');
        console.log('========================================');
        console.log(`👥 Users Created: ${members.length + trainers.length + 2}`);
        console.log(`   - Admin: 1`);
        console.log(`   - Staff: 1`);
        console.log(`   - Trainers: ${trainers.length}`);
        console.log(`   - Members: ${members.length}`);
        console.log(`\n🏋️ Training Programs: ${createdTrainings.length}`);
        console.log(`📋 Training Enrollments: ${trainingMembersCount}`);
        console.log(`💳 Subscriptions: ${members.length}`);
        console.log(`📅 Attendance Records: ${attendanceCount}`);
        console.log(`\n🛍️ Store Inventory: ${productCount} products`);
        console.log(`💰 Financial Records:`);
        console.log(`   - Income: ${members.length + additionalIncomeCount}`);
        console.log(`   - Expenses: ${expenseCount}`);
        console.log(`   - Payments: ${members.length}`);
        console.log(`🔔 Notifications: ${notificationCount}`);
        console.log('========================================\n');

        console.log('📊 Test Login Credentials:');
        console.log('----------------------------------------');
        console.log('Admin:');
        console.log('  Email: admin@shankhamul.com');
        console.log('  Password: admin123');
        console.log('\nStaff:');
        console.log('  Email: staff@shankhamul.com');
        console.log('  Password: staff123');
        console.log('\nTrainer:');
        console.log(`  Email: ${trainers[0].firstName.toLowerCase()}.trainer@shankhamul.com`);
        console.log('  Password: trainer123');
        console.log('\nMember (example):');
        console.log(`  Email: ${members[0].firstName.toLowerCase()}.${members[0].lastName.toLowerCase()}@gmail.com`);
        console.log('  Password: password123');
        console.log('----------------------------------------\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
};

// Run the seeder
seedRealisticData();
