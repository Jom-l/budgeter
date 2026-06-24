import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { money } from "../lib/format.js";
import { Card, Button, Field, Input } from "../components/ui.jsx";

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function Bills() {
  const { user } = useAuth();
  const cur = user?.currency || "PHP";
  const [bills, setBills] = useState([]);
  const [form, setForm] = useState({ name: "", amount: "", dueDay: "" });
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/bills").then((d) => setBills(d.bills));
  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/bills", {
        name: form.name,
        amount: Number(form.amount),
        dueDay: Number(form.dueDay),
      });
      setForm({ name: "", amount: "", dueDay: "" });
      load();
    } finally {
      setBusy(false);
    }
  };

  const update = async (id, patch) => {
    await api.put(`/bills/${id}`, patch);
    load();
  };
  const remove = async (id) => {
    await api.del(`/bills/${id}`);
    load();
  };
  const undo = async (id) => {
    await api.post(`/bills/${id}/undo-deduct`);
    load();
  };

  const month = currentMonth();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Bills & Scheduled Payments</h1>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Add a bill</h2>
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <Field label="Name">
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Electricity"
                required
              />
            </Field>
          </div>
          <Field label={`Amount (${cur})`}>
            <Input
              type="number"
              min="0"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
            />
          </Field>
          <Field label="Due day (1–31)">
            <Input
              type="number"
              min="1"
              max="31"
              value={form.dueDay}
              onChange={(e) => setForm((f) => ({ ...f, dueDay: e.target.value }))}
              required
            />
          </Field>
          <div className="sm:col-span-4">
            <Button type="submit" disabled={busy}>{busy ? "Adding…" : "Add bill"}</Button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {bills.length === 0 && (
          <Card><p className="text-sm text-slate-500">No bills yet.</p></Card>
        )}
        {bills.map((b) => {
          const paid = b.lastPaidMonth === month;
          return (
            <Card key={b._id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-800">
                    {b.name}{" "}
                    {paid && <span className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">paid/handled</span>}
                    {!b.active && <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">inactive</span>}
                  </div>
                  <div className="text-sm text-slate-500">
                    {money(b.amount, cur)} · due day {b.dueDay} · {b.autoDeduct ? "auto-deduct on" : "auto-deduct off"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <EditableAmount bill={b} cur={cur} onSave={(amount) => update(b._id, { amount })} />
                  {!paid && <Button variant="ghost" onClick={() => update(b._id, { markPaid: true })}>Mark paid</Button>}
                  <Button variant="ghost" onClick={() => update(b._id, { autoDeduct: !b.autoDeduct })}>
                    {b.autoDeduct ? "Disable auto" : "Enable auto"}
                  </Button>
                  <Button variant="ghost" onClick={() => undo(b._id)}>Undo deduct</Button>
                  <Button variant="danger" onClick={() => remove(b._id)}>Delete</Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <p className="text-xs text-slate-400">
        Reminders email you {user?.reminderLeadDays ?? 3} day(s) before the due date. Unpaid bills with auto-deduct on are deducted after the due date — you can edit the amount or undo if someone else paid.
      </p>
    </div>
  );
}

function EditableAmount({ bill, cur, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(bill.amount);
  if (!editing) return <Button variant="ghost" onClick={() => setEditing(true)}>Edit amount</Button>;
  return (
    <span className="flex items-center gap-1">
      <Input
        type="number"
        min="0"
        value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        className="max-w-[110px]"
      />
      <Button onClick={() => { onSave(val); setEditing(false); }}>Save</Button>
    </span>
  );
}
