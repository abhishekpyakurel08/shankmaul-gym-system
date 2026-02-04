import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

export const sendWelcomeEmail = async (email: string, name: string) => {
    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: 'Welcome to Gym Management System',
            html: `<p>Hi ${name},</p><p>Welcome to our gym! We are excited to have you with us.</p>`
        });
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
};

export const sendSubscriptionExpiryEmail = async (email: string, name: string, expiryDate: Date) => {
    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: 'Subscription Expiring Soon',
            html: `<p>Hi ${name},</p><p>Your subscription is expiring on ${expiryDate.toDateString()}. Please renew to continue your fitness journey.</p>`
        });
    } catch (error) {
        console.error('Error sending expiry email:', error);
    }
};

export const sendPaymentSuccessEmail = async (email: string, name: string, amount: number, transactionId: string) => {
    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: 'Payment Successful',
            html: `<p>Hi ${name},</p><p>We received your payment of Rs. ${amount}. Transaction ID: ${transactionId}.</p>`
        });
    } catch (error) {
        console.error('Error sending payment success email:', error);
    }
};

export const sendPaymentFailedEmail = async (email: string, name: string, amount: number) => {
    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: 'Payment Failed',
            html: `<p>Hi ${name},</p><p>Your payment of Rs. ${amount} failed. Please try again or contact support.</p>`
        });
    } catch (error) {
        console.error('Error sending payment failed email:', error);
    }
};

export const sendCheckInConfirmationEmail = async (email: string, name: string, time: Date) => {
    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: 'Check-in Confirmation',
            html: `<p>Hi ${name},</p><p>You successfully checked in at ${time.toLocaleTimeString()}. Have a great workout!</p>`
        });
    } catch (error) {
        console.error('Error sending check-in email:', error);
    }
};
