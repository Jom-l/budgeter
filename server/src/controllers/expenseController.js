import { z } from "zod";
import mongoose from "mongoose";
import { Expense } from "../models/Expense.js";
import { Budget } from "../models/Budget.js";
import { currentMonth, rangeStart } from "../utils/date.js";
import { invalidateTips } from "../services/aiService.js";

export const expenseSchema = z.object({
  amount: z.number().min(0),
  type: z.enum(["required", "non_required"]).default("non_required"),
  category: z.string().max(60).default("general"),
  note: z.string().max(300).default(""),
  date: z.coerce.date().optional(),
});

export async function createExpense(req, res) {
  const { amount, type, category, note, date } = req.body;
  const expense = await Expense.create({
    userId: req.session.userId,
    amount,
    type,
    category,
    note,
    date: date || new Date(),
    source: "manual",
  });
  // Reflect in current month's balance
  await Budget.updateOne(
    { userId: req.session.userId, month: currentMonth() },
    { $inc: { currentBalance: -amount } },
    { upsert: true, setDefaultsOnInsert: true }
  );
  await invalidateTips(req.session.userId); // refresh tips on change
  res.status(201).json({ expense });
}

export async function listExpenses(req, res) {
  const range = ["day", "week", "month"].includes(req.query.range) ? req.query.range : "month";
  const start = rangeStart(range);
  const expenses = await Expense.find({
    userId: req.session.userId,
    date: { $gte: start },
  }).sort({ date: -1 });
  res.json({ range, expenses });
}

export async function summary(req, res) {
  const range = ["day", "week", "month"].includes(req.query.range) ? req.query.range : "month";
  const start = rangeStart(range);
  const rows = await Expense.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(String(req.session.userId)),
        date: { $gte: start },
      },
    },
    { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  const out = { required: 0, non_required: 0 };
  for (const r of rows) out[r._id] = r.total;
  res.json({ range, summary: out, total: out.required + out.non_required });
}

export async function deleteExpense(req, res) {
  const expense = await Expense.findOneAndDelete({
    _id: req.params.id,
    userId: req.session.userId,
  });
  if (expense) {
    await Budget.updateOne(
      { userId: req.session.userId, month: currentMonth() },
      { $inc: { currentBalance: expense.amount } } // refund
    );
    await invalidateTips(req.session.userId);
  }
  res.json({ ok: true });
}
