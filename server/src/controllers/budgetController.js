import { z } from "zod";
import { Budget } from "../models/Budget.js";
import { currentMonth } from "../utils/date.js";
import { invalidateTips } from "../services/aiService.js";

export const budgetSchema = z.object({
  totalIncome: z.number().min(0).optional(),
  savingsGoal: z.number().min(0).optional(),
  currentBalance: z.number().optional(),
  extraPlan: z.string().max(1000).optional(),
  requiredItems: z
    .array(z.object({ name: z.string().min(1), amount: z.number().min(0) }))
    .optional(),
});

export async function getBudget(req, res) {
  const month = currentMonth();
  let budget = await Budget.findOne({ userId: req.session.userId, month });
  if (!budget) {
    budget = await Budget.create({ userId: req.session.userId, month });
  }
  res.json({ budget });
}

export async function updateBudget(req, res) {
  const month = currentMonth();
  const budget = await Budget.findOneAndUpdate(
    { userId: req.session.userId, month },
    { $set: req.body },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  await invalidateTips(req.session.userId);
  res.json({ budget });
}
