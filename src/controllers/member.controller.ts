import { Request, Response } from 'express';
import { Member, Subscription, User, Income } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';
import * as emailService from '../services/email.service';

export const createMember = async (req: AuthRequest, res: Response) => {
    try {
        const { email, password, firstName, lastName, phone, registrationFee, subscriptionPlan, ...memberData } = req.body;

        let user;
        if (email && password) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already exists' });
            }

            user = await User.create({ email, password, role: 'member' });
        } else if (req.body.userId) {
            user = await User.findById(req.body.userId);
        }

        if (!user) return res.status(400).json({ message: 'User required' });

        const member = await Member.create({
            user: user._id,
            firstName,
            lastName,
            phone,
            avatar: req.body.avatar,
            ...memberData
        });

        // Track Total Income for this transaction
        let totalReceived = 0;

        // 1. Record Registration Fee
        if (registrationFee && parseInt(registrationFee) > 0) {
            const regFee = parseInt(registrationFee);
            await Income.create({
                category: 'other',
                amount: regFee,
                description: `Registration fee for ${firstName} ${lastName}`,
                paymentMethod: req.body.paymentMethod || 'cash',
                memberId: member._id,
                receivedBy: req.user.id
            });
            totalReceived += regFee;
        }

        // 2. Handle Subscription Plan
        if (subscriptionPlan) {
            const plans: any = {
                monthly: { name: 'Monthly Plan', price: 2000, months: 1 },
                quarterly: { name: 'Quarterly Plan', price: 5500, months: 3 },
                biannual: { name: 'Six Months Plan', price: 10000, months: 6 },
                annual: { name: 'Yearly Plan', price: 18000, months: 12 }
            };

            const plan = plans[subscriptionPlan];
            if (plan) {
                const startDate = new Date();
                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + plan.months);

                await Subscription.create({
                    member: member._id,
                    planName: plan.name,
                    price: plan.price,
                    startDate,
                    endDate,
                    status: 'active',
                    paymentStatus: 'paid'
                });

                // Record Plan Payment as Income
                await Income.create({
                    category: 'subscription',
                    amount: plan.price,
                    description: `Plan Payment: ${plan.name} - ${firstName} ${lastName}`,
                    paymentMethod: req.body.paymentMethod || 'cash',
                    memberId: member._id,
                    receivedBy: req.user.id
                });
                totalReceived += plan.price;
            }
        }

        // Send Welcome Email
        try {
            await emailService.sendWelcomeEmail(user.email, firstName);
        } catch (mailError) {
            console.error('Failed to send welcome email:', mailError);
        }

        res.status(201).json({
            message: 'Member registered successfully',
            member,
            totalReceived
        });
    } catch (error) {
        console.error('Create Member Error:', error);
        res.status(500).json({ message: 'Error creating member', error });
    }
};

export const getMembers = async (req: Request, res: Response) => {
    try {
        const members = await Member.find().populate('user', '-password');

        // Enrich with subscription status
        const enrichedMembers = await Promise.all(members.map(async (m) => {
            const latestSub = await Subscription.findOne({ member: m._id }).sort({ endDate: -1 });
            let status = 'none';
            if (latestSub) {
                const now = new Date();
                if (latestSub.status === 'active' && latestSub.endDate < now) {
                    status = 'expired';
                } else {
                    status = latestSub.status;
                }
            }
            return {
                ...m.toObject(),
                subscriptionStatus: status,
                subscriptionDetails: latestSub
            };
        }));

        res.json(enrichedMembers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching members' });
    }
};

export const renewSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const { memberId, planName, price, durationMonths } = req.body;

        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + (durationMonths || 1));

        const subscription = await Subscription.create({
            member: memberId,
            planName,
            price,
            startDate,
            endDate,
            status: 'active'
        });

        // Update Member status
        await Member.findByIdAndUpdate(memberId, { status: 'active' });

        // Record as Income
        await Income.create({
            category: 'subscription',
            amount: price,
            description: `Subscription renewal: ${planName}`,
            paymentMethod: req.body.paymentMethod || 'cash',
            memberId: memberId,
            receivedBy: req.user.id,
            date: startDate
        });

        res.json(subscription);
    } catch (error) {
        res.status(500).json({ message: 'Error renewing subscription' });
    }
};

export const getExpiringSubscriptions = async (req: Request, res: Response) => {
    try {
        const warningDate = new Date();
        warningDate.setDate(warningDate.getDate() + 7); // Expiring in 7 days

        const subscriptions = await Subscription.find({
            endDate: { $lte: warningDate, $gte: new Date() },
            status: 'active'
        }).populate('member');

        res.json(subscriptions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching expiring subscriptions' });
    }
};

export const getAllSubscriptions = async (req: Request, res: Response) => {
    try {
        const subscriptions = await Subscription.find().populate('member').sort({ createdAt: -1 });
        res.json(subscriptions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching subscription history' });
    }
};

export const requestRenewal = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const { durationMonths } = req.body;

        if (![1, 3, 6, 12].includes(durationMonths)) {
            return res.status(400).json({ message: 'Invalid duration. Choose 1, 3, 6, or 12 months.' });
        }

        const member = await Member.findOne({ user: userId });
        if (!member) {
            return res.status(404).json({ message: 'Member profile not found' });
        }

        // Determine plan name and price (normally these would be from a Plan model)
        let planName = 'Monthly Plan';
        let price = 2000; // Example average price in Nepal
        if (durationMonths === 3) {
            planName = '3 Months Plan';
            price = 5500;
        } else if (durationMonths === 6) {
            planName = '6 Months Plan';
            price = 10000;
        } else if (durationMonths === 12) {
            planName = 'Yearly Plan';
            price = 18000;
        }

        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + durationMonths);

        const subscription = await Subscription.create({
            member: member._id,
            planName,
            price,
            startDate,
            endDate,
            status: 'pending',
            paymentStatus: 'pending'
        });

        // Real-time broadcast to Admin/Staff
        const io = req.app.get('io');
        io.emit('new_subscription_request', {
            member: member.firstName + ' ' + member.lastName,
            plan: planName
        });

        res.status(201).json({
            message: 'Subscription request sent. Please contact reception to complete payment.',
            subscription
        });
    } catch (error) {
        res.status(500).json({ message: 'Error requesting renewal', error });
    }
};

export const getPendingSubscriptions = async (req: Request, res: Response) => {
    try {
        const subscriptions = await Subscription.find({ status: 'pending' }).populate('member');
        res.json(subscriptions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching requests' });
    }
};

export const approveSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const { subscriptionId } = req.body;
        const sub = await Subscription.findById(subscriptionId).populate('member');
        if (!sub) return res.status(404).json({ message: 'Subscription not found' });

        sub.status = 'active';
        sub.paymentStatus = 'paid';
        await sub.save();

        // Ensure member is active
        const member = await Member.findByIdAndUpdate(sub.member, { status: 'active' }).populate('user');

        // Send Payment Success Email
        if (member && (member as any).user) {
            await emailService.sendPaymentSuccessEmail(
                (member as any).user.email,
                member.firstName,
                sub.price,
                sub._id.toString()
            );
        }

        // Record as Income
        await Income.create({
            category: 'subscription',
            amount: sub.price,
            description: `Subscription approved: ${sub.planName}`,
            paymentMethod: req.body.paymentMethod || 'cash',
            memberId: sub.member,
            receivedBy: req.user.id,
            date: new Date()
        });

        // Real-time broadcast for Analytics update
        const io = req.app.get('io');
        if (member) {
            io.emit('subscription_approved', {
                amount: sub.price,
                member: member.firstName,
                memberId: member._id
            });
        }

        res.json({ message: 'Subscription approved and activated', subscription: sub });
    } catch (error) {
        res.status(500).json({ message: 'Error approving subscription' });
    }
};

export const declineSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const { subscriptionId } = req.body;
        const sub = await Subscription.findById(subscriptionId);
        if (!sub) return res.status(404).json({ message: 'Subscription not found' });

        if (sub.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending subscriptions can be declined' });
        }

        sub.status = 'cancelled';
        await sub.save();

        res.json({ message: 'Subscription declined successfully', sub });
    } catch (error) {
        res.status(500).json({ message: 'Error declining subscription' });
    }
};

export const getMemberProfile = async (req: AuthRequest, res: Response) => {
    try {
        const member = await Member.findOne({ user: req.user.id }).populate('user', '-password');
        if (!member) return res.status(404).json({ message: 'Member profile not found' });

        // Get the latest active subscription
        const activeSub = await Subscription.findOne({
            member: member._id,
            status: 'active',
            endDate: { $gte: new Date() }
        }).sort({ endDate: -1 });

        // Update member status if subscription expired
        if (!activeSub && member.status === 'active') {
            member.status = 'inactive';
            await member.save();
        }

        // Ensure user has a qrLoginToken for auto-login
        const userDoc = await User.findById(req.user.id);
        if (userDoc && !userDoc.qrLoginToken) {
            userDoc.qrLoginToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            await userDoc.save();
        }

        res.json({
            ...member.toObject(),
            activeSubscription: activeSub,
            qrLoginToken: userDoc?.qrLoginToken
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
};

export const updateMemberStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const member = await Member.findByIdAndUpdate(id, { status }, { new: true }).populate('user');
        if (!member) return res.status(404).json({ message: 'Member not found' });

        // Broadcast status change
        const io = req.app.get('io');
        io.emit('member_status_updated', {
            id: member._id,
            name: member.firstName,
            status: member.status
        });

        res.json(member);
    } catch (error) {
        res.status(500).json({ message: 'Error updating status' });
    }
};

export const deleteMember = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const member = await Member.findById(id);
        if (!member) return res.status(404).json({ message: 'Member not found' });

        // Delete associated user as well
        if (member.user) {
            await User.findByIdAndDelete(member.user);
        }
        await Member.findByIdAndDelete(id);

        res.json({ message: 'Member and associated user deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting member' });
    }
};

export const updateMemberProfile = async (req: AuthRequest, res: Response) => {
    try {
        const member = await Member.findOneAndUpdate(
            { user: req.user.id },
            { $set: req.body },
            { new: true }
        );
        if (!member) return res.status(404).json({ message: 'Member profile not found' });
        res.json(member);
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile' });
    }
};
export const updateMemberById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const member = await Member.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true }
        ).populate('user', '-password');

        if (!member) return res.status(404).json({ message: 'Member not found' });
        res.json(member);
    } catch (error) {
        res.status(500).json({ message: 'Error updating member' });
    }
};

export const getMemberById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const member = await Member.findById(id).populate('user', '-password');
        if (!member) return res.status(404).json({ message: 'Member profile not found' });

        const activeSub = await Subscription.findOne({
            member: member._id,
            status: 'active',
            endDate: { $gte: new Date() }
        }).sort({ endDate: -1 });

        res.json({
            ...member.toObject(),
            activeSubscription: activeSub
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching member by ID' });
    }
};
