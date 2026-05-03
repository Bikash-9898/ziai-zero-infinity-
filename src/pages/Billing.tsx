import React, { useEffect, useState } from "react";
import PlanCard from "../components/billing/PlanCard";
import PaymentModal from "../components/billing/PaymentModal";
import { fetchPlans, fetchBillingHistory, type Plan } from "../api/billing";
import { useUsage } from "../hooks/useUsage";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NP", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_STYLE: Record<string, string> = {
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  failed: "bg-red-500/15 text-red-400 border-red-500/20",
};

const Billing: React.FC = () => {
  const { subscription, refetch: refetchUsage } = useUsage();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [history, setHistory] = useState<
    {
      id: string;
      plan: string;
      amount: number;
      method: string;
      status: string;
      created_at: string;
    }[]
  >([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchPlans(), fetchBillingHistory()])
      .then(([p, h]) => {
        setPlans(p);
        setHistory(h);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingPlans(false));
  }, []);

  const handlePaymentSuccess = () => {
    setSelectedPlan(null);
    refetchUsage();
  };

  const currentPlan = subscription?.plan ?? "free";

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black tracking-tight">Billing & Plans</h1>
          <p className="text-slate-400 mt-1.5 text-sm">
            Manage your subscription and payment history
          </p>
        </div>

        {/* Current Plan Banner */}
        {subscription && (
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-lg">
                ◈
              </div>
              <div>
                <p className="text-white font-bold capitalize">
                  {subscription.plan} Plan
                </p>
                <p className="text-slate-400 text-sm">
                  Renews{" "}
                  {subscription.current_period_end
                    ? formatDate(subscription.current_period_end)
                    : "—"}
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                subscription.status === "active"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                  : "bg-slate-600/30 text-slate-400 border-slate-600/30"
              }`}
            >
              {subscription.status}
            </span>
          </div>
        )}

        {/* Plans */}
        {error ? (
          <p className="text-red-400 text-sm">{error}</p>
        ) : loadingPlans ? (
          <div className="text-slate-400 text-sm flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading plans…
          </div>
        ) : (
          <div>
            <h2 className="text-slate-300 font-semibold text-sm uppercase tracking-widest mb-6">
              Available Plans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  currentPlan={currentPlan}
                  onSelect={setSelectedPlan}
                />
              ))}
            </div>
          </div>
        )}

        {/* Billing History */}
        {history.length > 0 && (
          <div>
            <h2 className="text-slate-300 font-semibold text-sm uppercase tracking-widest mb-4">
              Payment History
            </h2>
            <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/40">
                    <th className="text-left text-slate-500 font-medium px-5 py-3">
                      Date
                    </th>
                    <th className="text-left text-slate-500 font-medium px-5 py-3">
                      Plan
                    </th>
                    <th className="text-left text-slate-500 font-medium px-5 py-3">
                      Method
                    </th>
                    <th className="text-right text-slate-500 font-medium px-5 py-3">
                      Amount
                    </th>
                    <th className="text-right text-slate-500 font-medium px-5 py-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr
                      key={h.id}
                      className="border-b border-slate-700/20 last:border-0 hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-5 py-3 text-slate-300">
                        {formatDate(h.created_at)}
                      </td>
                      <td className="px-5 py-3 text-slate-300 capitalize">
                        {h.plan}
                      </td>
                      <td className="px-5 py-3 text-slate-400 capitalize">
                        {h.method}
                      </td>
                      <td className="px-5 py-3 text-white text-right font-mono">
                        Rs {h.amount}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            STATUS_STYLE[h.status] ?? STATUS_STYLE.pending
                          }`}
                        >
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default Billing;
