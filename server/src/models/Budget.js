import mongoose from "mongoose";

const requiredItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const budgetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    month: { type: String, required: true }, // "YYYY-MM"
    totalIncome: { type: Number, default: 0, min: 0 },
    savingsGoal: { type: Number, default: 0, min: 0 },
    currentBalance: { type: Number, default: 0 },
    extraPlan: { type: String, default: "", trim: true },
    requiredItems: { type: [requiredItemSchema], default: [] },
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, month: 1 }, { unique: true });

export const Budget = mongoose.model("Budget", budgetSchema);
