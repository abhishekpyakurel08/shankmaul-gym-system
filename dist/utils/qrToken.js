"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyQRToken = exports.generateQRToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const QR_SECRET = process.env.QR_SECRET || 'qr_secret';
const generateQRToken = (memberId) => {
    const payload = {
        memberId,
        type: 'CHECKIN'
    };
    // Token valid for 60 seconds
    return jsonwebtoken_1.default.sign(payload, QR_SECRET, { expiresIn: '60s' });
};
exports.generateQRToken = generateQRToken;
const verifyQRToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, QR_SECRET);
        if (decoded.type !== 'CHECKIN')
            return null;
        return decoded;
    }
    catch (error) {
        return null;
    }
};
exports.verifyQRToken = verifyQRToken;
