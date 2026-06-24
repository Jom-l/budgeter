import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { money } from "../lib/format.js";
import { Card, Field, Input } from "../components/ui.jsx";

const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function Reports() {
  const { user } = useAuth();
  const cur = user?.currency || "PHP";
  const [month, setMonth] = useState(thisMonth());
  const [report, setReport] = useState(null);

  useEffect(() => {
    api.get("/reports", { month }).then(setReport).catch(() => setReport(null));
  }, [month]);

  const maxCat = report?.byCategory?.[0]?.total || 1;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Monthly Report</h1>
        <div className="w-44">
          <Field label="Month">
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </Field>
        </div>
      </div>

      {!report ? (
        <Card><p className="text-sm text-slate-500">No data.</p></Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <div className="text-sm text-slate-500">Required</div>
              <div className="mt-1 text-xl font-bold text-slate-800">{money(report.totals.required, cur)}</div>
            </Card>
            <Card>
              <div className="text-sm text-slate-500">Non-required</div>
              <div className="mt-1 text-xl font-bold text-slate-800">{money(report.totals.non_required, cur)}</div>
            </Card>
            <Card>
              <div className="text-sm text-slate-500">Total spent</div>
              <div className="mt-1 text-xl font-bold text-indigo-600">{money(report.grandTotal, cur)}</div>
            </Card>
          </div>

          <Card>
            <h2 className="mb-3 text-lg font-semibold text-slate-800">By category</h2>
            {report.byCategory.length === 0 ? (
              <p className="text-sm text-slate-500">No expenses this month.</p>
            ) : (
              <ul className="space-y-2">
                {report.byCategory.map((c) => (
                  <li key={c.category}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-slate-600">{c.category}</span>
                      <span className="font-medium text-slate-700">{money(c.total, cur)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-indigo-500"
                        style={{ width: `${(c.total / maxCat) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {report.budget && (
            <Card>
              <h2 className="mb-3 text-lg font-semibold text-slate-800">Budget context</h2>
              <div className="grid gap-3 sm:grid-cols-3 text-sm">
                <Ctx label="Income" value={money(report.budget.totalIncome, cur)} />
                <Ctx label="Savings goal" value={money(report.budget.savingsGoal, cur)} />
                <Ctx label="Balance" value={money(report.budget.currentBalance, cur)} />
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Ctx({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <div className="text-xs uppercase text-slate-400">{label}</div>
      <div className="font-semibold text-slate-700">{value}</div>
    </div>
  );
}
