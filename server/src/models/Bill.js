import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 }, // editable; not static
    dueDay: { type: Number, required: true, min: 1, max: 31 },
    recurrence: { type: String, enum: ["monthly"], default: "monthly" },
    lastPaidMonth: { type: String, default: "" }, // "YYYY-MM"
    lastNotifiedMonth: { type: String, default: "" }, // "YYYY-MM"
    autoDeduct: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

billSchema.index({ userId: 1, active: 1 });

export const Bill = mongoose.model("Bill", billSchema);
