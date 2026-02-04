import { Router } from 'express';
import { register, login, qrTokenLogin, getUsers, updateUserRole, deleteUser } from '../controllers/auth.controller';
import { auth, authorize } from '../middleware/auth.middleware';

const router = Router();

// Only Admin and Staff (Reception) can register new users
router.post('/register', auth, authorize(['admin', 'staff']), register);

// Login is public
router.post('/login', login);
router.post('/qr-login', qrTokenLogin);

// Admin only user management
router.get('/users', auth, authorize(['admin']), getUsers);
router.put('/users/:id/role', auth, authorize(['admin']), updateUserRole);
router.delete('/users/:id', auth, authorize(['admin']), deleteUser);

export default router;
