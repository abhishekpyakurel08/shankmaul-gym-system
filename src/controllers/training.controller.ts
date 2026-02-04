import { Request, Response } from 'express';
import { Training, TrainingMember } from '../models/training.model';
import { User } from '../models/user.model';
import { Member } from '../models/member.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllTrainings = async (req: Request, res: Response) => {
    try {
        const trainings = await Training.find().populate('trainer', 'firstName lastName');

        // Enhance with enrollment count
        const result = await Promise.all(trainings.map(async (t) => {
            const count = await TrainingMember.countDocuments({ training: t._id, status: 'active' });
            return { ...t.toObject(), enrolledCount: count };
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching trainings', error });
    }
};

export const createTraining = async (req: Request, res: Response) => {
    try {
        const { name, trainerId, schedule, description } = req.body;

        // Verify trainer exists
        const trainer = await User.findById(trainerId);
        if (!trainer || (trainer.role !== 'trainer' && trainer.role !== 'admin')) {
            return res.status(400).json({ message: 'Invalid trainer ID' });
        }

        const newTraining = new Training({
            name,
            trainer: trainerId,
            schedule,
            description
        });

        await newTraining.save();
        res.status(201).json(newTraining);
    } catch (error) {
        res.status(500).json({ message: 'Error creating training', error });
    }
};

export const enrollMember = async (req: Request, res: Response) => {
    try {
        const { trainingId } = req.params;
        const { memberId } = req.body;

        // If member is enrolling themselves, use req.user (middleware should populate user which might be linked to a Member profile?)
        // Assuming req.body.memberId is provided for flexibility (admin enrolling member)

        const existing = await TrainingMember.findOne({ training: trainingId, member: memberId, status: 'active' });
        if (existing) {
            return res.status(400).json({ message: 'Member already enrolled' });
        }

        const enrollment = new TrainingMember({
            training: trainingId,
            member: memberId
        });

        await enrollment.save();
        res.status(201).json(enrollment);
    } catch (error) {
        res.status(500).json({ message: 'Error enrolling member', error });
    }
};

export const getMyTrainings = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        if (role === 'trainer') {
            const trainings = await Training.find({ trainer: userId }).populate('trainer', 'firstName lastName');

            const result = await Promise.all(trainings.map(async (t) => {
                const count = await TrainingMember.countDocuments({ training: t._id, status: 'active' });
                return { ...t.toObject(), enrolledCount: count };
            }));

            return res.json(result);
        }

        if (role === 'member') {
            const member = await Member.findOne({ user: userId });
            if (!member) {
                return res.status(404).json({ message: 'Member profile not found' });
            }

            const enrollments = await TrainingMember.find({ member: member._id, status: 'active' })
                .populate({
                    path: 'training',
                    populate: { path: 'trainer', select: 'firstName lastName' }
                });

            // Return training details extracted from enrollments
            const trainings = enrollments.map(e => {
                // Ensure training is not null before accessing properties
                if (!e.training) return null;
                const trainingObj = (e.training as any).toObject ? (e.training as any).toObject() : e.training;
                return {
                    ...trainingObj,
                    enrolledDate: e.enrolledDate
                };
            }).filter(t => t !== null);

            return res.json(trainings);
        }

        return res.json([]);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching my trainings', error });
    }
};
