import mongoose, { Schema, Document } from 'mongoose';
import { IAttendance } from '../types';

export interface IAttendanceDocument extends Omit<IAttendance, '_id'>, Document { }

const AttendanceSchema: Schema = new Schema({
    member: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    date: { type: Date, default: Date.now },
    checkInTime: { type: Date, required: true },
    checkOutTime: { type: Date },
    method: { type: String, enum: ['qr', 'manual', 'auto'], required: true },
    duration: { type: Number } // calculated in minutes
}, { timestamps: true });

// Ensure one check-in per day per member? The prompt says "No duplicate check-in today".
// We can handle that in logic, but indexing might help.
AttendanceSchema.index({ member: 1, date: 1 }); // Just an example, date logic is tricky because of timestamps.

export const Attendance = mongoose.model<IAttendanceDocument>('Attendance', AttendanceSchema);
