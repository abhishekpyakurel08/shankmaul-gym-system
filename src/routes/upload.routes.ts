import { Router } from 'express';
import { uploadAvatar, deleteAvatar, getMemberWithAvatar, uploadSingle } from '../controllers/upload.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/upload/avatar/:memberId
 * @desc    Upload avatar for a member
 * @access  Private (Admin, Staff)
 */
router.post(
    '/avatar/:memberId',
    authenticate,
    authorize(['admin', 'staff']),
    uploadSingle('avatar'),
    uploadAvatar
);

/**
 * @route   DELETE /api/upload/avatar/:memberId
 * @desc    Delete avatar for a member
 * @access  Private (Admin, Staff)
 */
router.delete(
    '/avatar/:memberId',
    authenticate,
    authorize(['admin', 'staff']),
    deleteAvatar
);

/**
 * @route   GET /api/upload/member/:memberId
 * @desc    Get member with avatar
 * @access  Private
 */
router.get(
    '/member/:memberId',
    authenticate,
    getMemberWithAvatar
);

export default router;
