import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { money, shortDate } from "../lib/format.js";
import { Card, Button, Field, Input, Select } from "../components/ui.jsx";

export default function DailyCheckIn() {
  const { user } = useAuth();
  const cur = user?.currency || "PHP";
  const [form, setForm] = useState({ amount: "", category: "", note: "", type: "non_required" });
  const [today, setToday] = useState([]);
  const [busy, setBusy] = useState(false);

  const loadToday = () => api.get("/expenses", { range: "day" }).then((d) => setToday(d.expenses));

  useEffect(() => {
    loadToday();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.amount) return;
    setBusy(true);
    try {
      await api.post("/expenses", {
        amount: Number(form.amount),
        type: form.type,
        category: form.category || "general",
        note: form.note,
      });
      setForm({ amount: "", category: "", note: "", type: "non_required" });
      loadToday();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    await api.del(`/expenses/${id}`);
    loadToday();
  };

  const total = today.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Daily Check-in</h1>
      <p className="text-slate-500">What did you spend today that wasn't part of the budget?</p>

      <Card>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={`Amount (${cur})`}>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
            </Field>
            <Field label="Type">
              <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                <option value="non_required">Non-required</option>
                <option value="required">Required</option>
              </Select>
            </Field>
          </div>
          <Field label="Category">
            <Input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="e.g. coffee, transport, snack"
            />
          </Field>
          <Field label="Note (optional)">
            <Input
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </Field>
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Add expense"}</Button>
        </form>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Today</h2>
          <span className="text-sm font-medium text-slate-600">Total: {money(total, cur)}</span>
        </div>
        {today.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing logged today.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {today.map((e) => (
              <li key={e._id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="font-medium text-slate-700">{e.category}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    {e.type === "required" ? "required" : "non-required"} · {shortDate(e.date)}
                  </span>
                  {e.note && <div className="text-xs text-slate-400">{e.note}</div>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-slate-700">{money(e.amount, cur)}</span>
                  <button onClick={() => remove(e._id)} className="text-rose-500 hover:text-rose-700">
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
