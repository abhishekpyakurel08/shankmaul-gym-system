import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { auth, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public/Member read access (some settings might need to be public like gym name)
router.get('/', auth, getSettings);

// Admin only write access
router.put('/', auth, authorize(['admin']), updateSettings);

export default router;
