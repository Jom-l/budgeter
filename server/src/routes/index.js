import { Router } from "express";
import rateLimit from "express-rate-limit";

import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

import * as auth from "../controllers/authController.js";
import * as settings from "../controllers/settingsController.js";
import * as budget from "../controllers/budgetController.js";
import * as expenses from "../controllers/expenseController.js";
import * as bills from "../controllers/billController.js";
import * as reports from "../controllers/reportController.js";
import * as ai from "../controllers/aiController.js";

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

// Auth
router.post("/auth/signup", authLimiter, validate(auth.signupSchema), auth.signup);
router.post("/auth/login", authLimiter, validate(auth.loginSchema), auth.login);
router.post("/auth/logout", auth.logout);
router.get("/auth/me", requireAuth, auth.me);

// Settings
router.put("/settings", requireAuth, validate(settings.settingsSchema), settings.updateSettings);

// Budget
router.get("/budget", requireAuth, budget.getBudget);
router.put("/budget", requireAuth, validate(budget.budgetSchema), budget.updateBudget);

// Expenses
router.post("/expenses", requireAuth, validate(expenses.expenseSchema), expenses.createExpense);
router.get("/expenses", requireAuth, expenses.listExpenses);
router.get("/expenses/summary", requireAuth, expenses.summary);
router.delete("/expenses/:id", requireAuth, expenses.deleteExpense);

// Bills
router.get("/bills", requireAuth, bills.listBills);
router.post("/bills", requireAuth, validate(bills.billSchema), bills.createBill);
router.put("/bills/:id", requireAuth, validate(bills.billUpdateSchema), bills.updateBill);
router.delete("/bills/:id", requireAuth, bills.deleteBill);
router.post("/bills/:id/undo-deduct", requireAuth, bills.undoAutoDeduct);

// Reports
router.get("/reports", requireAuth, reports.monthlyReport);

// AI tips
router.get("/ai/tips", requireAuth, aiLimiter, ai.tips);
router.post("/ai/tips", requireAuth, aiLimiter, ai.tips);

export default router;
