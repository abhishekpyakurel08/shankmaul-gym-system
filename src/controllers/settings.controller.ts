import { Request, Response } from 'express';
import { Settings } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';

// Get system settings (create default if not exists)
export const getSettings = async (req: Request, res: Response) => {
    try {
        let settings = await Settings.findOne();

        if (!settings) {
            settings = await Settings.create({});
        }

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings' });
    }
};

// Update system settings
export const updateSettings = async (req: AuthRequest, res: Response) => {
    try {
        const updates = req.body;

        // Find existing or create new
        let settings = await Settings.findOne();

        if (settings) {
            Object.assign(settings, updates);
            settings.updatedBy = req.user.id;
            await settings.save();
        } else {
            settings = await Settings.create({
                ...updates,
                updatedBy: req.user.id
            });
        }

        res.json({ message: 'Settings updated successfully', settings });
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings' });
    }
};
