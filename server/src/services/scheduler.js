import cron from "node-cron";
import { env } from "../config/env.js";
import { Bill } from "../models/Bill.js";
import { Budget } from "../models/Budget.js";
import { Expense } from "../models/Expense.js";
import { User } from "../models/User.js";
import { currentMonth } from "../utils/date.js";
import { sendBillReminder } from "./emailService.js";
import { getTips, invalidateTips } from "./aiService.js";

// Daily sweep: send reminders, auto-deduct overdue bills, refresh AI tips.
export async function runDailySweep(now = new Date()) {
  const month = currentMonth(now);
  const today = now.getDate();
  const bills = await Bill.find({ active: true }).lean();
  const userCache = new Map();

  async function getUser(id) {
    const key = String(id);
    if (!userCache.has(key)) userCache.set(key, await User.findById(id).lean());
    return userCache.get(key);
  }

  let reminders = 0;
  let deductions = 0;

  for (const bill of bills) {
    const user = await getUser(bill.userId);
    if (!user) continue;
    const paidThisMonth = bill.lastPaidMonth === month;
    if (paidThisMonth) continue;

    const lead = user.reminderLeadDays ?? 3;

    // Reminder window: lead days before due, once per month
    if (today >= bill.dueDay - lead && today <= bill.dueDay && bill.lastNotifiedMonth !== month) {
      await sendBillReminder(user.email, {
        name: bill.name,
        amount: bill.amount,
        dueDay: bill.dueDay,
        currency: user.currency,
      });
      await Bill.updateOne({ _id: bill._id }, { lastNotifiedMonth: month });
      reminders++;
    }

    // Overdue & not paid -> auto-deduct once
    if (today > bill.dueDay && bill.autoDeduct) {
      await Expense.create({
        userId: bill.userId,
        date: now,
        type: "required",
        category: bill.name,
        amount: bill.amount,
        note: `Auto-deducted: ${bill.name} (unpaid by day ${bill.dueDay})`,
        source: "auto_deduct",
        billId: bill._id,
      });
      await Budget.updateOne(
        { userId: bill.userId, month },
        { $inc: { currentBalance: -bill.amount } }
      );
      await Bill.updateOne({ _id: bill._id }, { lastPaidMonth: month }); // handled for this month
      await invalidateTips(bill.userId);
      deductions++;
    }
  }

  // Morning AI tips refresh for every user
  const users = await User.find().select("_id").lean();
  for (const u of users) {
    await getTips(u._id, { force: true }).catch(() => {});
  }

  console.log(`[scheduler] sweep done: ${reminders} reminders, ${deductions} auto-deductions, ${users.length} tip refreshes`);
  return { reminders, deductions, tipRefreshes: users.length };
}

export function startScheduler() {
  cron.schedule(env.dailySweepCron, () => {
    runDailySweep().catch((e) => console.error("[scheduler] sweep failed:", e));
  });
  console.log(`[scheduler] daily sweep scheduled: ${env.dailySweepCron}`);
}
