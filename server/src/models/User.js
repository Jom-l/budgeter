import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    currency: { type: String, default: "PHP", trim: true }, // chosen at signup, editable
    reminderLeadDays: { type: Number, default: 3, min: 0, max: 28 },
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    email: this.email,
    name: this.name,
    currency: this.currency,
    reminderLeadDays: this.reminderLeadDays,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model("User", userSchema);
