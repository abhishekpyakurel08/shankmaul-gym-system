import { Request, Response } from 'express';
import { Member } from '../models/member.model';
import { uploadSingle, deleteUploadedFile, getFileUrl } from '../middleware/upload.middleware';
import path from 'path';

/**
 * Upload avatar for a member
 */
export const uploadAvatar = async (req: Request, res: Response) => {
    try {
        const { memberId } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const member = await Member.findById(memberId);
        if (!member) {
            // Delete uploaded file if member not found
            deleteUploadedFile(req.file.path);
            return res.status(404).json({ message: 'Member not found' });
        }

        // Delete old avatar if exists and is a local file
        if (member.avatar && member.avatar.startsWith('/uploads/')) {
            const oldPath = member.avatar.replace('/uploads/', '');
            deleteUploadedFile(oldPath);
        }

        // Update member with new avatar URL
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        member.avatar = avatarUrl;
        await member.save();

        res.json({
            message: 'Avatar uploaded successfully',
            avatar: avatarUrl,
            member
        });
    } catch (error: any) {
        console.error('Upload avatar error:', error);

        // Delete uploaded file on error
        if (req.file) {
            deleteUploadedFile(req.file.path);
        }

        res.status(500).json({ message: 'Error uploading avatar', error: error.message });
    }
};

/**
 * Delete avatar for a member
 */
export const deleteAvatar = async (req: Request, res: Response) => {
    try {
        const { memberId } = req.params;

        const member = await Member.findById(memberId);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // Delete avatar file if it's a local file
        if (member.avatar && member.avatar.startsWith('/uploads/')) {
            const filePath = member.avatar.replace('/uploads/', '');
            deleteUploadedFile(filePath);
        }

        // Clear avatar field
        member.avatar = undefined;
        await member.save();

        res.json({
            message: 'Avatar deleted successfully',
            member
        });
    } catch (error: any) {
        console.error('Delete avatar error:', error);
        res.status(500).json({ message: 'Error deleting avatar', error: error.message });
    }
};

/**
 * Get member with avatar
 */
export const getMemberWithAvatar = async (req: Request, res: Response) => {
    try {
        const { memberId } = req.params;

        const member = await Member.findById(memberId).populate('user', 'email role');
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        // If avatar is a local file, ensure full URL
        if (member.avatar && member.avatar.startsWith('/uploads/')) {
            member.avatar = `${req.protocol}://${req.get('host')}${member.avatar}`;
        }

        res.json(member);
    } catch (error: any) {
        console.error('Get member error:', error);
        res.status(500).json({ message: 'Error fetching member', error: error.message });
    }
};

// Export middleware for use in routes
export { uploadSingle };
