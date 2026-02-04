"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpenses = exports.getIncomes = exports.getSummary = exports.addExpense = exports.addIncome = void 0;
const models_1 = require("../models");
const addIncome = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const income = yield models_1.Income.create(req.body);
        res.status(201).json(income);
    }
    catch (error) {
        res.status(500).json({ message: 'Error adding income', error });
    }
});
exports.addIncome = addIncome;
const addExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const expense = yield models_1.Expense.create(req.body);
        res.status(201).json(expense);
    }
    catch (error) {
        res.status(500).json({ message: 'Error adding expense', error });
    }
});
exports.addExpense = addExpense;
const getSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate } = req.query;
        const query = {};
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        const incomes = yield models_1.Income.find(query);
        const expenses = yield models_1.Expense.find(query);
        const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
        const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
        const netProfit = totalIncome - totalExpense;
        const incomeByCategory = incomes.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + item.amount;
            return acc;
        }, {});
        const expenseByCategory = expenses.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + item.amount;
            return acc;
        }, {});
        res.json({
            totalIncome,
            totalExpense,
            netProfit,
            incomeByCategory,
            expenseByCategory
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error generating summary', error });
    }
});
exports.getSummary = getSummary;
const getIncomes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const incomes = yield models_1.Income.find().sort({ date: -1 });
        res.json(incomes);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching incomes' });
    }
});
exports.getIncomes = getIncomes;
const getExpenses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const expenses = yield models_1.Expense.find().sort({ date: -1 });
        res.json(expenses);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching expenses' });
    }
});
exports.getExpenses = getExpenses;
