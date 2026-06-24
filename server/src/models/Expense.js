import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: Date, required: true, default: Date.now },
    type: { type: String, enum: ["required", "non_required"], required: true },
    category: { type: String, default: "general", trim: true },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, default: "", trim: true },
    source: { type: String, enum: ["manual", "auto_deduct"], default: "manual" },
    billId: { type: mongoose.Schema.Types.ObjectId, ref: "Bill", default: null },
  },
  { timestamps: true }
);

// Drives day/week/month rollups
expenseSchema.index({ userId: 1, date: -1 });

export const Expense = mongoose.model("Expense", expenseSchema);
