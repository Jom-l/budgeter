import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { Budget } from "../models/Budget.js";
import { HttpError } from "../middleware/error.js";
import { currentMonth } from "../utils/date.js";

export const signupSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  currency: z.string().min(1).max(8).default("PHP"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function signup(req, res) {
  const { name, email, password, currency } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw new HttpError(409, "Email already registered");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, currency });

  // Create the current month's empty budget
  await Budget.create({ userId: user._id, month: currentMonth() });

  req.session.userId = String(user._id);
  res.status(201).json({ user: user.toSafeJSON() });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new HttpError(401, "Invalid credentials");
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, "Invalid credentials");

  req.session.userId = String(user._id);
  res.json({ user: user.toSafeJSON() });
}

export async function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
}

export async function me(req, res) {
  const user = await User.findById(req.session.userId);
  if (!user) throw new HttpError(401, "Not authenticated");
  res.json({ user: user.toSafeJSON() });
}
