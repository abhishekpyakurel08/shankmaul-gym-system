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
exports.getRevenueReport = exports.getDashboardStats = void 0;
const models_1 = require("../models");
const getDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1. Total Members
        const totalMembers = yield models_1.Member.countDocuments();
        const activeMembers = yield models_1.Member.countDocuments({ status: 'active' });
        // 2. Active Subscriptions
        const activeSubscriptions = yield models_1.Subscription.countDocuments({ status: 'active' });
        // 3. Today's Attendance & On Floor
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todayAttendance = yield models_1.Attendance.countDocuments({ date: { $gte: startOfDay } });
        const onFloorCount = yield models_1.Attendance.countDocuments({
            date: { $gte: startOfDay },
            checkOutTime: { $exists: false }
        });
        // 4. Financial Summary (Current Month)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const monthlyIncomes = yield models_1.Income.find({ date: { $gte: startOfMonth } });
        const monthlyExpenses = yield models_1.Expense.find({ date: { $gte: startOfMonth } });
        const monthlyRevenue = monthlyIncomes.reduce((sum, item) => sum + item.amount, 0);
        const monthlyExpense = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0);
        const monthlyProfit = monthlyRevenue - monthlyExpense;
        // 5. Revenue by Category (Lifetime)
        const lifetimeIncomes = yield models_1.Income.aggregate([
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching dashboard stats', error });
    }
});
exports.getDashboardStats = getDashboardStats;
const getRevenueReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get last 6 months revenue trend
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const revenueTrend = yield models_1.Income.aggregate([
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching revenue report', error });
    }
});
exports.getRevenueReport = getRevenueReport;
