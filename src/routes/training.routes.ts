import { Router } from 'express';
import { getAllTrainings, createTraining, enrollMember, getMyTrainings } from '../controllers/training.controller';
import { auth, authorize } from '../middleware/auth.middleware';

const router = Router();

// Public or Authenticated generic read
router.get('/', auth, getAllTrainings);
router.get('/my', auth, getMyTrainings);

// Admin/Staff/Trainer create
router.post('/', auth, authorize(['admin', 'staff', 'trainer']), createTraining);

// Member enrollment
router.post('/:trainingId/enroll', auth, enrollMember);

export default router;
