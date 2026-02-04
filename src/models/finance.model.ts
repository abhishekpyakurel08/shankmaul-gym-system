import mongoose, { Schema, Document } from 'mongoose';
import { IPayment, IIncome, IExpense } from '../types';

export interface IPaymentDocument extends Omit<IPayment, '_id'>, Document { }
export interface IIncomeDocument extends Omit<IIncome, '_id'>, Document { }
export interface IExpenseDocument extends Omit<IExpense, '_id'>, Document { }

const PaymentSchema: Schema = new Schema({
    member: { type: Schema.Types.ObjectId, ref: 'Member' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'Rs.' },
    paymentMethod: { type: String, enum: ['cash', 'card', 'bank_transfer', 'online'], required: true },
    transactionId: { type: String },
    status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'completed' },
    date: { type: Date, default: Date.now },
    description: { type: String }
}, { timestamps: true });

const IncomeSchema: Schema = new Schema({
    category: { type: String, enum: ['subscription', 'personal_training', 'merchandise', 'other'], required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    paymentMethod: { type: String, required: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member' },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'completed' },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

const ExpenseSchema: Schema = new Schema({
    category: { type: String, enum: ['equipment', 'maintenance', 'utilities', 'salaries', 'rent', 'supplies', 'marketing', 'other'], required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    paymentMethod: { type: String, required: true },
    vendor: { type: String },
    date: { type: Date, default: Date.now },
    receiptUrl: { type: String }
}, { timestamps: true });

export const Payment = mongoose.model<IPaymentDocument>('Payment', PaymentSchema);
export const Income = mongoose.model<IIncomeDocument>('Income', IncomeSchema);
export const Expense = mongoose.model<IExpenseDocument>('Expense', ExpenseSchema);
