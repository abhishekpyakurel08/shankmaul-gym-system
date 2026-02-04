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
const seedTactical = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gym_management';
        yield mongoose_1.default.connect(MONGODB_URI);
        console.log('📡 Connected to Tactical Database');
        // 1. Seed Admin
        const adminEmail = 'admin@shankhamul.com';
        const adminPassword = 'admin123';
        let admin = yield models_1.User.findOne({ email: adminEmail });
        if (!admin) {
            admin = yield models_1.User.create({
                email: adminEmail,
                password: adminPassword,
                role: 'admin'
            });
            console.log(`✅ Admin Node Created: ${adminEmail}`);
        }
        else {
            console.log('ℹ️ Admin Node already exists');
        }
        // 2. Seed Member Operative
        const memberEmail = 'member@shankhamul.com';
        const memberPassword = 'member123';
        let memberUser = yield models_1.User.findOne({ email: memberEmail });
        if (!memberUser) {
            memberUser = yield models_1.User.create({
                email: memberEmail,
                password: memberPassword,
                role: 'member'
            });
            yield models_1.Member.create({
                user: memberUser._id,
                firstName: 'Test',
                lastName: 'Operative',
                email: memberEmail,
                phone: '+977 9800000000',
                status: 'active'
            });
            console.log(`✅ Member Operative Created: ${memberEmail}`);
        }
        else {
            console.log('ℹ️ Member Operative already exists');
        }
        // 3. Seed Staff Support
        const staffEmail = 'staff@shankhamul.com';
        const staffPassword = 'staff123';
        let staffUser = yield models_1.User.findOne({ email: staffEmail });
        if (!staffUser) {
            yield models_1.User.create({
                email: staffEmail,
                password: staffPassword,
                role: 'staff'
            });
            console.log(`✅ Staff Support Created: ${staffEmail}`);
        }
        else {
            console.log('ℹ️ Staff Support already exists');
        }
        // 4. Seed Trainer Unit
        const trainerEmail = 'trainer@shankhamul.com';
        const trainerPassword = 'trainer123';
        let trainerUser = yield models_1.User.findOne({ email: trainerEmail });
        if (!trainerUser) {
            yield models_1.User.create({
                email: trainerEmail,
                password: trainerPassword,
                role: 'trainer'
            });
            console.log(`✅ Trainer Unit Created: ${trainerEmail}`);
        }
        else {
            console.log('ℹ️ Trainer Unit already exists');
        }
        console.log('🚀 Tactical Seeding Complete');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Strategic Seeding Failed:', error);
        process.exit(1);
    }
});
seedTactical();
