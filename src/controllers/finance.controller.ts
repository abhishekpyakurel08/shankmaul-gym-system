import { Request, Response } from 'express';
import { Income, Expense } from '../models';

export const addIncome = async (req: Request, res: Response) => {
    try {
        const income = await Income.create(req.body);
        res.status(201).json(income);
    } catch (error) {
        res.status(500).json({ message: 'Error adding income', error });
    }
};

export const addExpense = async (req: Request, res: Response) => {
    try {
        const expense = await Expense.create(req.body);
        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ message: 'Error adding expense', error });
    }
};

export const getSummary = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const query: any = {};
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string)
            };
        }

        const incomes = await Income.find(query);
        const expenses = await Expense.find(query);

        const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
        const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
        const netProfit = totalIncome - totalExpense;

        const incomeByCategory = incomes.reduce((acc: any, item) => {
            acc[item.category] = (acc[item.category] || 0) + item.amount;
            return acc;
        }, {});

        const expenseByCategory = expenses.reduce((acc: any, item) => {
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

    } catch (error) {
        res.status(500).json({ message: 'Error generating summary', error });
    }
};

export const getIncomes = async (req: Request, res: Response) => {
    try {
        const incomes = await Income.find().populate('memberId').sort({ date: -1 });
        res.json(incomes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching incomes' });
    }
};

export const getExpenses = async (req: Request, res: Response) => {
    try {
        const expenses = await Expense.find().sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching expenses' });
    }
};
