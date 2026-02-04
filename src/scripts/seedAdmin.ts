import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Member } from '../models';

dotenv.config();

const seedTactical = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gym_management';
        await mongoose.connect(MONGODB_URI);
        console.log('📡 Connected to Tactical Database');

        // 1. Seed Admin
        const adminEmail = 'admin@shankhamul.com';
        const adminPassword = 'admin123';

        let admin = await User.findOne({ email: adminEmail });
        if (!admin) {
            admin = await User.create({
                email: adminEmail,
                password: adminPassword,
                role: 'admin'
            });
            console.log(`✅ Admin Node Created: ${adminEmail}`);
        } else {
            console.log('ℹ️ Admin Node already exists');
        }

        // 2. Seed Member Operative
        const memberEmail = 'member@shankhamul.com';
        const memberPassword = 'member123';

        let memberUser = await User.findOne({ email: memberEmail });
        if (!memberUser) {
            memberUser = await User.create({
                email: memberEmail,
                password: memberPassword,
                role: 'member'
            });

            await Member.create({
                user: memberUser._id,
                firstName: 'Test',
                lastName: 'Operative',
                email: memberEmail,
                phone: '+977 9800000000',
                status: 'active'
            });
            console.log(`✅ Member Operative Created: ${memberEmail}`);
        } else {
            console.log('ℹ️ Member Operative already exists');
        }

        // 3. Seed Staff Support
        const staffEmail = 'staff@shankhamul.com';
        const staffPassword = 'staff123';

        let staffUser = await User.findOne({ email: staffEmail });
        if (!staffUser) {
            await User.create({
                email: staffEmail,
                password: staffPassword,
                role: 'staff'
            });
            console.log(`✅ Staff Support Created: ${staffEmail}`);
        } else {
            console.log('ℹ️ Staff Support already exists');
        }

        // 4. Seed Trainer Unit
        const trainerEmail = 'trainer@shankhamul.com';
        const trainerPassword = 'trainer123';

        let trainerUser = await User.findOne({ email: trainerEmail });
        if (!trainerUser) {
            await User.create({
                email: trainerEmail,
                password: trainerPassword,
                role: 'trainer'
            });
            console.log(`✅ Trainer Unit Created: ${trainerEmail}`);
        } else {
            console.log('ℹ️ Trainer Unit already exists');
        }

        console.log('🚀 Tactical Seeding Complete');
        process.exit(0);
    } catch (error) {
        console.error('❌ Strategic Seeding Failed:', error);
        process.exit(1);
    }
};

seedTactical();
