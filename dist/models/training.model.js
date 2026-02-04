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
exports.TrainingMember = exports.Training = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TrainingSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    trainer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true }, // Trainer is a User
    schedule: [{
            dayOfWeek: { type: Number, required: true }, // 0 (Sun) - 6 (Sat)
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
            capacity: { type: Number, default: 20 }
        }],
    description: { type: String }
}, { timestamps: true });
const TrainingMemberSchema = new mongoose_1.Schema({
    training: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Training', required: true },
    member: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Member', required: true },
    enrolledDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' }
}, { timestamps: true });
exports.Training = mongoose_1.default.model('Training', TrainingSchema);
exports.TrainingMember = mongoose_1.default.model('TrainingMember', TrainingMemberSchema);
