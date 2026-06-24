import { z } from "zod";
import { Bill } from "../models/Bill.js";
import { Budget } from "../models/Budget.js";
import { Expense } from "../models/Expense.js";
import { HttpError } from "../middleware/error.js";
import { currentMonth } from "../utils/date.js";
import { invalidateTips } from "../services/aiService.js";

export const billSchema = z.object({
  name: z.string().min(1).max(80),
  amount: z.number().min(0),
  dueDay: z.number().int().min(1).max(31),
  autoDeduct: z.boolean().default(true),
  active: z.boolean().default(true),
});

export const billUpdateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  amount: z.number().min(0).optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  autoDeduct: z.boolean().optional(),
  active: z.boolean().optional(),
  markPaid: z.boolean().optional(), // mark paid for current month
});

export async function listBills(req, res) {
  const bills = await Bill.find({ userId: req.session.userId }).sort({ dueDay: 1 });
  res.json({ bills });
}

export async function createBill(req, res) {
  const bill = await Bill.create({ ...req.body, userId: req.session.userId });
  res.status(201).json({ bill });
}

export async function updateBill(req, res) {
  const { markPaid, ...patch } = req.body;
  if (markPaid) patch.lastPaidMonth = currentMonth();

  const bill = await Bill.findOneAndUpdate(
    { _id: req.params.id, userId: req.session.userId },
    { $set: patch },
    { new: true, runValidators: true }
  );
  if (!bill) throw new HttpError(404, "Bill not found");
  await invalidateTips(req.session.userId);
  res.json({ bill });
}

export async function deleteBill(req, res) {
  await Bill.findOneAndDelete({ _id: req.params.id, userId: req.session.userId });
  res.json({ ok: true });
}

// Undo an auto-deduction for a bill this month (someone else paid, etc.)
export async function undoAutoDeduct(req, res) {
  const month = currentMonth();
  const expense = await Expense.findOneAndDelete({
    userId: req.session.userId,
    billId: req.params.id,
    source: "auto_deduct",
  }).sort({ date: -1 });

  if (expense) {
    await Budget.updateOne(
      { userId: req.session.userId, month },
      { $inc: { currentBalance: expense.amount } } // refund
    );
    await Bill.updateOne(
      { _id: req.params.id, userId: req.session.userId },
      { $set: { lastPaidMonth: "" } }
    );
    await invalidateTips(req.session.userId);
  }
  res.json({ ok: true, refunded: expense?.amount || 0 });
}
