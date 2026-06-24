import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { money } from "../lib/format.js";
import { Card, Button } from "../components/ui.jsx";
import TipsPanel from "../components/TipsPanel.jsx";

function Stat({ label, value, accent = "text-slate-800" }) {
  return (
    <Card>
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent}`}>{value}</div>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const cur = user?.currency || "PHP";
  const [budget, setBudget] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get("/budget").then((d) => setBudget(d.budget)).catch(() => {});
    api.get("/expenses/summary", { range: "month" }).then(setSummary).catch(() => {});
  }, []);

  const requiredTotal = (budget?.requiredItems || []).reduce((s, i) => s + i.amount, 0);
  const plannedLeftover =
    (budget?.totalIncome || 0) - requiredTotal - (budget?.savingsGoal || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Hi {user?.name} 👋</h1>
        <Link to="/check-in">
          <Button>+ Log spending</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Income (month)" value={money(budget?.totalIncome, cur)} />
        <Stat label="Required planned" value={money(requiredTotal, cur)} />
        <Stat label="Savings goal" value={money(budget?.savingsGoal, cur)} accent="text-indigo-600" />
        <Stat
          label="Current balance"
          value={money(budget?.currentBalance, cur)}
          accent={(budget?.currentBalance || 0) < 0 ? "text-rose-600" : "text-emerald-600"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TipsPanel currency={cur} />
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-slate-800">This month's spending</h2>
          {summary ? (
            <div className="space-y-3">
              <Row label="Required" value={money(summary.summary.required, cur)} />
              <Row label="Non-required" value={money(summary.summary.non_required, cur)} />
              <div className="border-t border-slate-100 pt-3">
                <Row label="Total spent" value={money(summary.total, cur)} bold />
              </div>
              <Row
                label="Planned leftover"
                value={money(plannedLeftover, cur)}
                accent={plannedLeftover < 0 ? "text-rose-600" : "text-emerald-600"}
              />
            </div>
          ) : (
            <p className="text-sm text-slate-500">No data yet.</p>
          )}
          <div className="mt-4 flex gap-2">
            <Link to="/setup"><Button variant="ghost">Edit budget</Button></Link>
            <Link to="/reports"><Button variant="ghost">View reports</Button></Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, bold, accent = "text-slate-700" }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`${bold ? "font-bold" : "font-medium"} ${accent}`}>{value}</span>
    </div>
  );
}
