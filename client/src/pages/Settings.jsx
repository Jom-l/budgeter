import { useState } from "react";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Card, Button, Field, Input, Select } from "../components/ui.jsx";
import { CURRENCIES } from "../lib/format.js";

export default function Settings() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    currency: user?.currency || "PHP",
    reminderLeadDays: user?.reminderLeadDays ?? 3,
  });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    setSaved(false);
    try {
      const { user: updated } = await api.put("/settings", {
        name: form.name,
        currency: form.currency,
        reminderLeadDays: Number(form.reminderLeadDays),
      });
      setUser(updated);
      setSaved(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
      <Card className="space-y-4">
        <Field label="Name">
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </Field>
        <Field label="Currency">
          <Select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Reminder lead time (days before due date)">
          <Input
            type="number"
            min="0"
            max="28"
            value={form.reminderLeadDays}
            onChange={(e) => setForm((f) => ({ ...f, reminderLeadDays: e.target.value }))}
          />
        </Field>
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save settings"}</Button>
          {saved && <span className="text-sm text-emerald-600">Saved ✓</span>}
        </div>
      </Card>
      <p className="text-sm text-slate-400">Email: {user?.email}</p>
    </div>
  );
}
