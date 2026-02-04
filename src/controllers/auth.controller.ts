import { Request, Response } from 'express';
import { User, Member, Subscription } from '../models';
import { generateAuthToken } from '../utils/auth';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, role } = req.body;

        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ email, password, role });
        const token = generateAuthToken(user);

        res.status(201).json({ token, user: { id: user._id, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateAuthToken(user);

        // Subscription-based check for members
        let memberData = null;
        if (user.role === 'member') {
            const member = await Member.findOne({ user: user._id });
            if (member) {
                const activeSub = await Subscription.findOne({
                    member: member._id,
                    status: 'active',
                    endDate: { $gte: new Date() }
                });

                if (!activeSub) {
                    member.status = 'inactive';
                    await member.save();

                    return res.status(403).json({
                        message: 'Your membership has expired. Please contact reception to renew.',
                        expired: true
                    });
                }

                memberData = {
                    id: member._id,
                    status: member.status,
                    hasActiveSubscription: true
                };
            }
        }

        res.json({
            token,
            user: { id: user._id, email: user.email, role: user.role },
            member: memberData
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const qrTokenLogin = async (req: Request, res: Response) => {
    try {
        const { token: qrToken } = req.body;
        if (!qrToken) return res.status(400).json({ message: 'Token required' });

        const user = await User.findOne({ qrLoginToken: qrToken });
        if (!user) return res.status(401).json({ message: 'Invalid or expired token' });

        const authToken = generateAuthToken(user);

        // Subscription check for members (duplicated logic from login for consistency)
        let memberData = null;
        if (user.role === 'member') {
            const member = await Member.findOne({ user: user._id });
            if (member) {
                const activeSub = await Subscription.findOne({
                    member: member._id,
                    status: 'active',
                    endDate: { $gte: new Date() }
                });

                if (!activeSub) {
                    member.status = 'inactive';
                    await member.save();
                    return res.status(403).json({ message: 'Membership expired', expired: true });
                }

                memberData = { id: member._id, status: member.status, hasActiveSubscription: true };
            }
        }

        res.json({
            token: authToken,
            user: { id: user._id, email: user.email, role: user.role },
            member: memberData
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};

export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user role' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
};
