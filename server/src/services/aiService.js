import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env.js";
import { redis } from "../config/redis.js";
import { Budget } from "../models/Budget.js";
import { Bill } from "../models/Bill.js";
import { Expense } from "../models/Expense.js";
import { User } from "../models/User.js";
import { currentMonth, monthBounds, rangeStart } from "../utils/date.js";

const client = env.anthropicApiKey ? new Anthropic({ apiKey: env.anthropicApiKey }) : null;

const MODEL = "claude-opus-4-8";
const TIPS_TTL_SECONDS = 60 * 60 * 12; // 12h cache; invalidated on change
const tipsKey = (userId) => `tips:${userId}:${currentMonth()}`;

const SYSTEM_PROMPT = `You are a warm, practical personal-finance coach inside a budgeting app.
You receive a JSON snapshot of one user's budget and spending for the current month.
Your job:
- Analyze income vs required payments, savings goal, current balance, and ad-hoc (non-required) spending.
- Suggest a budget the user MAY follow — it is advisory, not enforced. Make that clear.
- Set tone by their situation:
  - Surplus: encourage a small, specific treat (e.g. "you could treat your family to a drink worth ~X").
  - Tight or over budget: warn gently and give 2-3 concrete adjustments.
- Always use the user's currency symbol/code from the snapshot.
- Be concrete, kind, and brief. No lectures, no shaming.
Respond as JSON only, matching this shape:
{ "status": "surplus" | "on_track" | "tight" | "over",
  "headline": string,
  "tips": string[],
  "suggestedBudget": { "savings": number, "required": number, "discretionary": number },
  "treat": string | null,
  "warning": string | null }`;

async function buildSnapshot(userId) {
  const month = currentMonth();
  const [user, budget] = await Promise.all([
    User.findById(userId).lean(),
    Budget.findOne({ userId, month }).lean(),
  ]);
  const [monthStart, monthEnd] = monthBounds(month);

  const spendAgg = await Expense.aggregate([
    { $match: { userId: toId(userId), date: { $gte: monthStart, $lt: monthEnd } } },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);
  const spent = { required: 0, non_required: 0 };
  for (const row of spendAgg) spent[row._id] = row.total;

  const upcomingBills = await Bill.find({ userId, active: true })
    .select("name amount dueDay lastPaidMonth")
    .lean();

  return {
    currency: user?.currency || "PHP",
    month,
    totalIncome: budget?.totalIncome || 0,
    savingsGoal: budget?.savingsGoal || 0,
    currentBalance: budget?.currentBalance || 0,
    requiredItems: budget?.requiredItems || [],
    requiredItemsTotal: (budget?.requiredItems || []).reduce((s, i) => s + i.amount, 0),
    extraPlan: budget?.extraPlan || "",
    spentThisMonth: spent,
    upcomingBills: upcomingBills.map((b) => ({
      name: b.name,
      amount: b.amount,
      dueDay: b.dueDay,
      paidThisMonth: b.lastPaidMonth === month,
    })),
  };
}

function toId(id) {
  // aggregate needs ObjectId; Mongoose casts in find but not in $match
  return new (Budget.base.Types.ObjectId)(String(id));
}

function fallbackTips(snapshot) {
  const income = snapshot.totalIncome;
  const required = snapshot.requiredItemsTotal + snapshot.spentThisMonth.required;
  const discretionary = snapshot.spentThisMonth.non_required;
  const leftover = income - required - discretionary - snapshot.savingsGoal;
  const sym = snapshot.currency;
  let status = "on_track";
  if (leftover > income * 0.1) status = "surplus";
  else if (leftover < 0) status = "over";
  else if (leftover < income * 0.05) status = "tight";
  return {
    status,
    headline:
      status === "surplus"
        ? "You have room to breathe this month."
        : status === "over"
        ? "You're over budget — let's adjust."
        : "You're roughly on track.",
    tips: [
      "AI tips are unavailable (no ANTHROPIC_API_KEY set) — showing a basic estimate.",
      `Estimated leftover after required spend and savings: ${sym} ${leftover.toFixed(2)}.`,
    ],
    suggestedBudget: {
      savings: snapshot.savingsGoal,
      required,
      discretionary: Math.max(0, leftover),
    },
    treat: status === "surplus" ? `You could treat yourself to something small, around ${sym} ${(leftover * 0.1).toFixed(0)}.` : null,
    warning: status === "over" ? "Spending exceeds income plus savings goal this month." : null,
  };
}

export async function getTips(userId, { force = false } = {}) {
  if (!force) {
    const cached = await redis.get(tipsKey(userId)).catch(() => null);
    if (cached) return JSON.parse(cached);
  }

  const snapshot = await buildSnapshot(userId);

  let result;
  if (!client) {
    result = fallbackTips(snapshot);
  } else {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [
        { role: "user", content: `Snapshot:\n${JSON.stringify(snapshot)}` },
      ],
    });
    const text = response.content.find((b) => b.type === "text")?.text ?? "{}";
    result = safeParse(text) || fallbackTips(snapshot);
  }

  await redis.set(tipsKey(userId), JSON.stringify(result), { EX: TIPS_TTL_SECONDS }).catch(() => {});
  return result;
}

export async function invalidateTips(userId) {
  await redis.del(tipsKey(userId)).catch(() => {});
}

function safeParse(text) {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}
