import { Router } from 'express';
import { addIncome, addExpense, getSummary, getIncomes, getExpenses } from '../controllers/finance.controller';
import { auth, authorize } from '../middleware/auth.middleware';

const router = Router();

// Financials are strictly for Admin and Staff
router.post('/income', auth, authorize(['admin', 'staff']), addIncome);
router.get('/income', auth, authorize(['admin', 'staff']), getIncomes);
router.post('/expense', auth, authorize(['admin', 'staff']), addExpense);
router.get('/expense', auth, authorize(['admin', 'staff']), getExpenses);
router.get('/summary', auth, authorize(['admin', 'staff']), getSummary);

export default router;
