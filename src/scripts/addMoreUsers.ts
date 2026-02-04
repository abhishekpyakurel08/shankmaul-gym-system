import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model';
import { Member } from '../models/member.model';
import { fileStorage } from '../utils/fileStorage';

dotenv.config();

const NEPALI_FIRST_NAMES = {
    male: ['Aayush', 'Bibek', 'Kiran', 'Nishant', 'Samir', 'Sushant', 'Rohan', 'Prakash', 'Ashish', 'Dinesh', 'Rajesh', 'Suresh', 'Manish', 'Anil', 'Santosh'],
    female: ['Reema', 'Pooja', 'Maya', 'Elena', 'Tara', 'Shreya', 'Priya', 'Aarti', 'Sunita', 'Kabita', 'Sangita', 'Anita', 'Sita', 'Gita', 'Krishna']
};

const NEPALI_LAST_NAMES = ['Sharma', 'KC', 'Adhikari', 'Thapa', 'Rai', 'Sunuwar', 'Magar', 'Gurung', 'Bista', 'Tamang', 'Shrestha', 'Karki', 'Poudel', 'Neupane', 'Ghimire', 'Pant', 'Subedi', 'Acharya', 'Bhattarai', 'Basnet'];

const KATHMANDU_AREAS = [
    'Thamel, Kathmandu', 'Sanepa, Lalitpur', 'Baluwatar, Kathmandu', 'Jhamsikhel, Lalitpur',
    'Baneshwor, Kathmandu', 'Kupondole, Lalitpur', 'Naxal, Kathmandu', 'Pulchowk, Lalitpur',
    'Koteshwor, Kathmandu', 'Maharajgunj, Kathmandu'
];

const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

async function addUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('📡 Connected to MongoDB');

        const roles = ['admin', 'staff', 'trainer', 'member'] as const;

        for (const role of roles) {
            console.log(`\nAdding 5 ${role}s...`);
            for (let i = 1; i <= 5; i++) {
                const gender = Math.random() > 0.5 ? 'male' : 'female';
                const firstName = randomElement(NEPALI_FIRST_NAMES[gender]);
                const lastName = randomElement(NEPALI_LAST_NAMES);
                const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${role}${Math.floor(Math.random() * 1000)}@shanka.com`;
                const password = role === 'admin' ? 'admin123' :
                    role === 'staff' ? 'staff123' :
                        role === 'trainer' ? 'trainer123' : 'password123';

                const userData: any = {
                    email,
                    password,
                    role
                };

                if (role === 'member') {
                    userData.qrLoginToken = `QR_AUTO_${Date.now()}_${i}_${Math.random().toString(36).substring(7)}`;
                }

                const user = await User.create(userData);

                if (role === 'member') {
                    await Member.create({
                        user: user._id,
                        firstName,
                        lastName,
                        phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
                        status: 'active',
                        address: randomElement(KATHMANDU_AREAS),
                        gender,
                        avatar: fileStorage.generateAvatarUrl(firstName, lastName),
                        joinedDate: new Date()
                    });
                }

                console.log(`✅ Created ${role}: ${email}`);
            }
        }

        console.log('\n🚀 All 20 users added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding users:', error);
        process.exit(1);
    }
}

addUsers();
