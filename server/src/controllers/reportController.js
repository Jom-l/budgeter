import mongoose from "mongoose";
import { Expense } from "../models/Expense.js";
import { Budget } from "../models/Budget.js";
import { currentMonth, monthBounds } from "../utils/date.js";

// Monthly spending report: totals by type, by category, and budget context.
export async function monthlyReport(req, res) {
  const month = /^\d{4}-\d{2}$/.test(req.query.month) ? req.query.month : currentMonth();
  const [start, end] = monthBounds(month);
  const userId = new mongoose.Types.ObjectId(String(req.session.userId));

  const [byType, byCategory, budget] = await Promise.all([
    Expense.aggregate([
      { $match: { userId, date: { $gte: start, $lt: end } } },
      { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Expense.aggregate([
      { $match: { userId, date: { $gte: start, $lt: end } } },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    Budget.findOne({ userId: req.session.userId, month }).lean(),
  ]);

  const totals = { required: 0, non_required: 0 };
  for (const r of byType) totals[r._id] = r.total;

  res.json({
    month,
    totals,
    grandTotal: totals.required + totals.non_required,
    byCategory: byCategory.map((c) => ({ category: c._id, total: c.total, count: c.count })),
    budget: budget
      ? {
          totalIncome: budget.totalIncome,
          savingsGoal: budget.savingsGoal,
          currentBalance: budget.currentBalance,
        }
      : null,
  });
}
