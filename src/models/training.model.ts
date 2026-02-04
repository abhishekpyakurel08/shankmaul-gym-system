import mongoose, { Schema, Document } from 'mongoose';
import { ITraining, ITrainingMember } from '../types';

export interface ITrainingDocument extends Omit<ITraining, '_id'>, Document { }
export interface ITrainingMemberDocument extends Omit<ITrainingMember, '_id'>, Document { }

const TrainingSchema: Schema = new Schema({
    name: { type: String, required: true },
    trainer: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Trainer is a User
    schedule: [{
        dayOfWeek: { type: Number, required: true }, // 0 (Sun) - 6 (Sat)
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        capacity: { type: Number, default: 20 }
    }],
    description: { type: String }
}, { timestamps: true });

const TrainingMemberSchema: Schema = new Schema({
    training: { type: Schema.Types.ObjectId, ref: 'Training', required: true },
    member: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    enrolledDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' }
}, { timestamps: true });

export const Training = mongoose.model<ITrainingDocument>('Training', TrainingSchema);
export const TrainingMember = mongoose.model<ITrainingMemberDocument>('TrainingMember', TrainingMemberSchema);
