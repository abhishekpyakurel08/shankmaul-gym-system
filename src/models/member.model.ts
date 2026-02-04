import mongoose, { Schema, Document } from 'mongoose';
import { IMember } from '../types';

export interface IMemberDocument extends Omit<IMember, '_id'>, Document { }

const MemberSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },
    qrCode: { type: String }, // Can store a persistent QR code string or ID if needed, though we use dynamic tokens too
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    joinedDate: { type: Date, default: Date.now },
    address: { type: String },
    emergencyContact: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    avatar: { type: String } // URL to the hosted image
}, { timestamps: true });

export const Member = mongoose.model<IMemberDocument>('Member', MemberSchema);
