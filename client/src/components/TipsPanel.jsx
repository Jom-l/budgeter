import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { Card, Button } from "./ui.jsx";

const statusStyles = {
  surplus: "bg-emerald-50 text-emerald-700 border-emerald-200",
  on_track: "bg-sky-50 text-sky-700 border-sky-200",
  tight: "bg-amber-50 text-amber-700 border-amber-200",
  over: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function TipsPanel({ currency = "PHP" }) {
  const [tips, setTips] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async (force = false) => {
    setLoading(true);
    try {
      const { tips } = force ? await api.post("/ai/tips") : await api.get("/ai/tips");
      setTips(tips);
    } catch {
      setTips(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">🤖 AI Coach</h2>
        <Button variant="ghost" onClick={() => load(true)} disabled={loading}>
          {loading ? "Thinking…" : "Refresh"}
        </Button>
      </div>

      {loading && !tips && <p className="text-sm text-slate-500">Analyzing your budget…</p>}

      {tips && (
        <div className="space-y-3">
          <div
            className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${
              statusStyles[tips.status] || statusStyles.on_track
            }`}
          >
            {tips.status?.replace("_", " ")}
          </div>
          <p className="font-medium text-slate-800">{tips.headline}</p>

          {tips.tips?.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
              {tips.tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          )}

          {tips.treat && (
            <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">🎉 {tips.treat}</div>
          )}
          {tips.warning && (
            <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">⚠️ {tips.warning}</div>
          )}

          {tips.suggestedBudget && (
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              {["savings", "required", "discretionary"].map((k) => (
                <div key={k} className="rounded-xl bg-slate-50 p-2">
                  <div className="text-xs uppercase text-slate-400">{k}</div>
                  <div className="font-semibold text-slate-700">
                    {currency} {Number(tips.suggestedBudget[k] || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400">Suggestions are advisory — your call whether to follow them.</p>
        </div>
      )}
    </Card>
  );
}
