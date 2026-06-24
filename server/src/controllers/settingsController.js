import { z } from "zod";
import { User } from "../models/User.js";
import { HttpError } from "../middleware/error.js";

export const settingsSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  currency: z.string().min(1).max(8).optional(),
  reminderLeadDays: z.number().int().min(0).max(28).optional(),
});

export async function updateSettings(req, res) {
  const user = await User.findByIdAndUpdate(req.session.userId, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new HttpError(404, "User not found");
  res.json({ user: user.toSafeJSON() });
}
