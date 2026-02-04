import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
    gymName: string;
    supportContact: string;
    address: string;
    darkMode: boolean;
    verifyMembership: boolean;
    cooldownPeriod: boolean;
    notifications: {
        expiryAlerts: boolean;
        paymentReceipts: boolean;
        marketingEmails: boolean;
    };
    updatedBy: Schema.Types.ObjectId;
}

const SettingsSchema: Schema = new Schema({
    gymName: { type: String, default: 'Shankhamul Physical Fitness' },
    supportContact: { type: String, default: '+977 980-000000' },
    address: { type: String, default: 'Shankhamul, Kathmandu, Nepal' },
    darkMode: { type: Boolean, default: false },
    verifyMembership: { type: Boolean, default: true },
    cooldownPeriod: { type: Boolean, default: true },
    notifications: {
        expiryAlerts: { type: Boolean, default: true },
        paymentReceipts: { type: Boolean, default: true },
        marketingEmails: { type: Boolean, default: false }
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
