import mongoose, { Schema, Document } from 'mongoose';
import { ISubscription } from '../types';

export interface ISubscriptionDocument extends Omit<ISubscription, '_id'>, Document { }

const SubscriptionSchema: Schema = new Schema({
    member: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    planName: { type: String, required: true },
    price: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'expired', 'cancelled', 'pending'], default: 'active' },
    paymentStatus: { type: String, enum: ['paid', 'pending', 'failed'], default: 'paid' }
}, { timestamps: true });

export const Subscription = mongoose.model<ISubscriptionDocument>('Subscription', SubscriptionSchema);
