import jwt from 'jsonwebtoken';
import { IUserDocument } from '../models/user.model';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const generateAuthToken = (user: IUserDocument): string => {
    return jwt.sign(
        { id: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: '1d' }
    );
};
