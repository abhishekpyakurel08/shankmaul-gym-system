import { Request, Response } from 'express';
import { Income, Expense, Member, Subscription, Attendance } from '../models';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // 1. Total Members
        const totalMembers = await Member.countDocuments();
        const activeMembers = await Member.countDocuments({ status: 'active' });

        // 2. Active Subscriptions
        const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });

        // 3. Today's Attendance & On Floor
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todayAttendance = await Attendance.countDocuments({ date: { $gte: startOfDay } });
        const onFloorCount = await Attendance.countDocuments({
            date: { $gte: startOfDay },
            checkOutTime: { $exists: false }
        });

        // 4. Financial Summary (Current Month)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const monthlyIncomes = await Income.find({ date: { $gte: startOfMonth } });
        const monthlyExpenses = await Expense.find({ date: { $gte: startOfMonth } });

        const monthlyRevenue = monthlyIncomes.reduce((sum, item) => sum + item.amount, 0);
        const monthlyExpense = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0);
        const monthlyProfit = monthlyRevenue - monthlyExpense;

        // 5. Revenue by Category (Lifetime)
        const lifetimeIncomes = await Income.aggregate([
            { $group: { _id: '$category', total: { $sum: '$amount' } } }
        ]);

        res.json({
            overview: {
                totalMembers,
                activeMembers,
                activeSubscriptions,
                todayAttendance,
                onFloorCount,
            },
            financials: {
                monthlyRevenue,
                monthlyExpense,
                monthlyProfit,
                revenueByCategory: lifetimeIncomes,
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching dashboard stats', error });
    }
};

export const getRevenueReport = async (req: Request, res: Response) => {
    try {
        // Get last 6 months revenue trend
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const revenueTrend = await Income.aggregate([
            { $match: { date: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' }
                    },
                    revenue: { $sum: '$amount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        res.json(revenueTrend);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching revenue report', error });
    }
};
