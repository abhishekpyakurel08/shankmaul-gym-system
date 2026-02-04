"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const finance_controller_1 = require("../controllers/finance.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Financials are strictly for Admin and Staff
router.post('/income', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), finance_controller_1.addIncome);
router.get('/income', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), finance_controller_1.getIncomes);
router.post('/expense', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), finance_controller_1.addExpense);
router.get('/expense', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), finance_controller_1.getExpenses);
router.get('/summary', auth_middleware_1.auth, (0, auth_middleware_1.authorize)(['admin', 'staff']), finance_controller_1.getSummary);
exports.default = router;
