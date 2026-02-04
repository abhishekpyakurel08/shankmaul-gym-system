"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Expense = exports.Income = exports.Payment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PaymentSchema = new mongoose_1.Schema({
    member: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Member' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'Rs.' },
    paymentMethod: { type: String, enum: ['cash', 'card', 'bank_transfer', 'online'], required: true },
    transactionId: { type: String },
    status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'completed' },
    date: { type: Date, default: Date.now },
    description: { type: String }
}, { timestamps: true });
const IncomeSchema = new mongoose_1.Schema({
    category: { type: String, enum: ['subscription', 'personal_training', 'merchandise', 'other'], required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    paymentMethod: { type: String, required: true },
    memberId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Member' },
    receivedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now }
}, { timestamps: true });
const ExpenseSchema = new mongoose_1.Schema({
    category: { type: String, enum: ['equipment', 'maintenance', 'utilities', 'salaries', 'rent', 'supplies', 'marketing', 'other'], required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    paymentMethod: { type: String, required: true },
    vendor: { type: String },
    date: { type: Date, default: Date.now },
    receiptUrl: { type: String }
}, { timestamps: true });
exports.Payment = mongoose_1.default.model('Payment', PaymentSchema);
exports.Income = mongoose_1.default.model('Income', IncomeSchema);
exports.Expense = mongoose_1.default.model('Expense', ExpenseSchema);
