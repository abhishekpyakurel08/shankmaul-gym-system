import { Router } from 'express';
import { createMember, getMembers, getMemberProfile, updateMemberProfile, updateMemberStatus, deleteMember, updateMemberById, getMemberById } from '../controllers/member.controller';
import { auth, authorize } from '../middleware/auth.middleware';

const router = Router();

// Member profile routes
router.get('/profile', auth, getMemberProfile);
router.get('/:id', auth, authorize(['admin', 'staff']), getMemberById);
router.put('/profile', auth, updateMemberProfile);

// Management routes
router.get('/', auth, authorize(['admin', 'staff']), getMembers);
router.post('/', auth, authorize(['admin', 'staff']), createMember);
router.put('/:id', auth, authorize(['admin', 'staff']), updateMemberById);
router.put('/:id/status', auth, authorize(['admin', 'staff']), updateMemberStatus);
router.delete('/:id', auth, authorize(['admin', 'staff']), deleteMember);

export default router;
