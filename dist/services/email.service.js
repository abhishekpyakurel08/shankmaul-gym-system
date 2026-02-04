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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCheckInConfirmationEmail = exports.sendPaymentFailedEmail = exports.sendPaymentSuccessEmail = exports.sendSubscriptionExpiryEmail = exports.sendWelcomeEmail = void 0;
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const sendWelcomeEmail = (email, name) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: 'Welcome to Gym Management System',
            html: `<p>Hi ${name},</p><p>Welcome to our gym! We are excited to have you with us.</p>`
        });
    }
    catch (error) {
        console.error('Error sending welcome email:', error);
    }
});
exports.sendWelcomeEmail = sendWelcomeEmail;
const sendSubscriptionExpiryEmail = (email, name, expiryDate) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: 'Subscription Expiring Soon',
            html: `<p>Hi ${name},</p><p>Your subscription is expiring on ${expiryDate.toDateString()}. Please renew to continue your fitness journey.</p>`
        });
    }
    catch (error) {
        console.error('Error sending expiry email:', error);
    }
});
exports.sendSubscriptionExpiryEmail = sendSubscriptionExpiryEmail;
const sendPaymentSuccessEmail = (email, name, amount, transactionId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: 'Payment Successful',
            html: `<p>Hi ${name},</p><p>We received your payment of Rs. ${amount}. Transaction ID: ${transactionId}.</p>`
        });
    }
    catch (error) {
        console.error('Error sending payment success email:', error);
    }
});
exports.sendPaymentSuccessEmail = sendPaymentSuccessEmail;
const sendPaymentFailedEmail = (email, name, amount) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: 'Payment Failed',
            html: `<p>Hi ${name},</p><p>Your payment of Rs. ${amount} failed. Please try again or contact support.</p>`
        });
    }
    catch (error) {
        console.error('Error sending payment failed email:', error);
    }
});
exports.sendPaymentFailedEmail = sendPaymentFailedEmail;
const sendCheckInConfirmationEmail = (email, name, time) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: 'Check-in Confirmation',
            html: `<p>Hi ${name},</p><p>You successfully checked in at ${time.toLocaleTimeString()}. Have a great workout!</p>`
        });
    }
    catch (error) {
        console.error('Error sending check-in email:', error);
    }
});
exports.sendCheckInConfirmationEmail = sendCheckInConfirmationEmail;
