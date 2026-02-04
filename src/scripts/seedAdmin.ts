import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Member } from '../models';

dotenv.config();

const seedTactical = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gym_management';
        await mongoose.connect(MONGODB_URI);
        console.log('📡 Connected to Tactical Database');

        const usersToSeed = [
            { email: 'admin@shankhamul.com', password: 'admin123', role: 'admin', firstName: 'System', lastName: 'Admin' },
            { email: 'admin2@shankhamul.com', password: 'admin123', role: 'admin', firstName: 'Second', lastName: 'Admin' },
            { email: 'staff@shankhamul.com', password: 'staff123', role: 'staff', firstName: 'Reception', lastName: 'Staff' },
            { email: 'staff2@shankhamul.com', password: 'staff123', role: 'staff', firstName: 'Morning', lastName: 'Staff' },
            { email: 'trainer@shankhamul.com', password: 'trainer123', role: 'trainer', firstName: 'Head', lastName: 'Trainer' },
            { email: 'trainer2@shankhamul.com', password: 'trainer123', role: 'trainer', firstName: 'Fitness', lastName: 'Coach' },
            { email: 'member@shankhamul.com', password: 'member123', role: 'member', firstName: 'Test', lastName: 'Member' },
            { email: 'member1@shankhamul.com', password: 'password123', role: 'member', firstName: 'Active', lastName: 'User' },
            { email: 'member2@shankhamul.com', password: 'password123', role: 'member', firstName: 'New', lastName: 'Member' },
        ];

        console.log('👥 Seeding specific test accounts...');

        for (const u of usersToSeed) {
            let existingUser = await User.findOne({ email: u.email });
            if (!existingUser) {
                const newUser = await User.create({
                    email: u.email,
                    password: u.password,
                    role: u.role
                });

                if (u.role === 'member') {
                    await Member.create({
                        user: newUser._id,
                        firstName: u.firstName,
                        lastName: u.lastName,
                        phone: '+977 98' + Math.floor(10000000 + Math.random() * 90000000),
                        status: 'active'
                    });
                }
                console.log(`✅ Created ${u.role}: ${u.email}`);
            } else {
                console.log(`ℹ️ ${u.role} already exists: ${u.email}`);
            }
        }

        console.log('\n🚀 Tactical Seeding Complete');
        console.log('\n🔑 ACCESS CREDENTIALS TABLE:');
        console.log('------------------------------------------------------------');
        console.log('| ROLE     | EMAIL ID                   | PASSWORD    |');
        console.log('------------------------------------------------------------');
        usersToSeed.forEach(u => {
            const roleStr = u.role.padEnd(8);
            const emailStr = u.email.padEnd(26);
            const passStr = u.password.padEnd(11);
            console.log(`| ${roleStr} | ${emailStr} | ${passStr} |`);
        });
        console.log('------------------------------------------------------------\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Strategic Seeding Failed:', error);
        process.exit(1);
    }
};

seedTactical();
