import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Card, Button, Field, Input } from "../components/ui.jsx";

export default function Setup() {
  const { user } = useAuth();
  const cur = user?.currency || "PHP";
  const [form, setForm] = useState({
    totalIncome: 0,
    savingsGoal: 0,
    currentBalance: 0,
    extraPlan: "",
    requiredItems: [],
  });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/budget").then(({ budget }) => {
      setForm({
        totalIncome: budget.totalIncome || 0,
        savingsGoal: budget.savingsGoal || 0,
        currentBalance: budget.currentBalance || 0,
        extraPlan: budget.extraPlan || "",
        requiredItems: budget.requiredItems || [],
      });
    });
  }, []);

  const num = (k) => (e) => setForm((f) => ({ ...f, [k]: Number(e.target.value) }));

  const addItem = () =>
    setForm((f) => ({ ...f, requiredItems: [...f.requiredItems, { name: "", amount: 0 }] }));
  const setItem = (i, key, val) =>
    setForm((f) => {
      const items = [...f.requiredItems];
      items[i] = { ...items[i], [key]: key === "amount" ? Number(val) : val };
      return { ...f, requiredItems: items };
    });
  const removeItem = (i) =>
    setForm((f) => ({ ...f, requiredItems: f.requiredItems.filter((_, idx) => idx !== i) }));

  const save = async () => {
    setBusy(true);
    setSaved(false);
    try {
      await api.put("/budget", {
        ...form,
        requiredItems: form.requiredItems.filter((it) => it.name.trim()),
      });
      setSaved(true);
    } finally {
      setBusy(false);
    }
  };

  const requiredTotal = form.requiredItems.reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Budget Setup</h1>

      <Card className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={`Total income (${cur})`}>
            <Input type="number" min="0" value={form.totalIncome} onChange={num("totalIncome")} />
          </Field>
          <Field label={`Savings goal (${cur})`}>
            <Input type="number" min="0" value={form.savingsGoal} onChange={num("savingsGoal")} />
          </Field>
          <Field label={`Current balance (${cur})`}>
            <Input type="number" value={form.currentBalance} onChange={num("currentBalance")} />
          </Field>
        </div>
        <Field label="What to do with the extra?">
          <Input
            value={form.extraPlan}
            onChange={(e) => setForm((f) => ({ ...f, extraPlan: e.target.value }))}
            placeholder="e.g. emergency fund, family treat, invest…"
          />
        </Field>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Required / priority payments</h2>
          <Button variant="ghost" onClick={addItem}>+ Add item</Button>
        </div>
        <div className="space-y-2">
          {form.requiredItems.length === 0 && (
            <p className="text-sm text-slate-500">Add items like food, electricity, internet…</p>
          )}
          {form.requiredItems.map((item, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Name (e.g. Electricity)"
                value={item.name}
                onChange={(e) => setItem(i, "name", e.target.value)}
              />
              <Input
                type="number"
                min="0"
                placeholder="Amount"
                value={item.amount}
                onChange={(e) => setItem(i, "amount", e.target.value)}
                className="max-w-[140px]"
              />
              <Button variant="danger" onClick={() => removeItem(i)}>✕</Button>
            </div>
          ))}
        </div>
        <div className="mt-3 text-right text-sm text-slate-600">
          Required total: <span className="font-semibold">{cur} {requiredTotal.toLocaleString()}</span>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save budget"}</Button>
        {saved && <span className="text-sm text-emerald-600">Saved ✓</span>}
      </div>
    </div>
  );
}
