import jwt from 'jsonwebtoken';
import { IQRTokenPayload } from '../types';

const QR_SECRET = process.env.QR_SECRET || 'qr_secret';

export const generateQRToken = (memberId: string): string => {
    const payload: IQRTokenPayload = {
        memberId,
        type: 'CHECKIN'
    };

    // Token valid for 60 seconds
    return jwt.sign(payload, QR_SECRET, { expiresIn: '60s' });
};

export const verifyQRToken = (token: string): IQRTokenPayload | null => {
    try {
        const decoded = jwt.verify(token, QR_SECRET);
        if ((decoded as any).type !== 'CHECKIN') return null;
        return decoded as IQRTokenPayload;
    } catch (error) {
        return null;
    }
};
