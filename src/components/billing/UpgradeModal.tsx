// src/components/billing/UpgradeModal.tsx
import { useState, useEffect, useRef } from "react";
import { X, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { comparePlans, initiateEsewa, type PlanComparison } from "@/api/billing";
import PlanCard from "./PlanCard";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface UpgradeModalProps {
  userId: string;
  currentPlan: string;
  onClose: () => void;
  onPlanChanged?: (newPlan: string) => void;
}

type Step = "plans" | "confirm-free" | "confirm-downgrade" | "payment" | "processing";

export default function UpgradeModal({ userId, onClose, onPlanChanged }: UpgradeModalProps) {
  const [plans, setPlans]         = useState<PlanComparison[]>([]);
  const [loading, setLoading]     = useState(true);
  const [step, setStep]           = useState<Step>("plans");
  const [selected, setSelected]   = useState<PlanComparison | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const esewaFormRef              = useRef<HTMLFormElement>(null);

  useEffect(() => {
    comparePlans(userId)
      .then(setPlans)
      .catch(() => setError("Failed to load plans"))
      .finally(() => setLoading(false));
  }, [userId]);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSelectPlan = (plan: PlanComparison) => {
    setSelected(plan);
    setError(null);

    if (plan.plan === "free") {
      setStep("confirm-free");
    } else if (plan.action === "downgrade") {
      setStep("confirm-downgrade");
    } else {
      // Paid upgrade
      setStep("payment");
    }
  };

  // ── Free plan switch ─────────────────────────────────────────────────────
  const handleSwitchFree = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/billing/switch-free/${userId}`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Switch failed");
      onPlanChanged?.("free");
      onClose();
    } catch (err: unknown) {
      setError(err as string ?? "Failed to switch to free plan");
    } finally {
      setActionLoading(false);
    }
  };

  // ── eSewa payment ────────────────────────────────────────────────────────
  const [esewaPayload, setEsewaPayload] = useState<{ form_url: string; payload: Record<string, string> } | null>(null);

  const handleInitiateEsewa = async () => {
    if (!selected) return;
    setActionLoading(true);
    setError(null);
    try {
      const data = await initiateEsewa(selected.plan, userId);
      setEsewaPayload({ form_url: data.form_url, payload: data.payload });
      setStep("processing");
      // Auto-submit after a short delay so user sees the "redirecting" screen
      setTimeout(() => esewaFormRef.current?.submit(), 1200);
    } catch (err: unknown) {
      setError(err as string ?? "Failed to initiate payment");
      setActionLoading(false);
    }
  };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position:       "fixed",
        inset:          0,
        zIndex:         1000,
        background:     "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "16px",
        overflowY:      "auto",
      }}
    >
      <div
        style={{
          background:   "#080e1c",
          border:       "1px solid #1e293b",
          borderRadius: 20,
          width:        "100%",
          maxWidth:     step === "plans" ? 960 : 480,
          maxHeight:    "90vh",
          overflowY:    "auto",
          padding:      "32px 28px",
          position:     "relative",
          transition:   "max-width 0.3s ease",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position:   "absolute",
            top:        16,
            right:      16,
            background: "none",
            border:     "none",
            color:      "#475569",
            cursor:     "pointer",
            padding:    4,
          }}
        >
          <X size={20} />
        </button>

        {/* Back button for sub-steps */}
        {step !== "plans" && step !== "processing" && (
          <button
            onClick={() => { setStep("plans"); setError(null); }}
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        6,
              background: "none",
              border:     "none",
              color:      "#64748b",
              cursor:     "pointer",
              fontSize:   13,
              marginBottom: 20,
              padding:    0,
            }}
          >
            <ArrowLeft size={15} /> Back to plans
          </button>
        )}

        {/* ── STEP: Plans grid ─────────────────────────────────────────── */}
        {step === "plans" && (
          <>
            <div style={{ marginBottom: 28, textAlign: "center" }}>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: "#f1f5f9", margin: "0 0 8px", letterSpacing: "-0.03em" }}>
                Choose Your Plan
              </h2>
              <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>
                Prices are in Nepali Rupees (NPR) · Billed monthly
              </p>
            </div>

            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
                <Loader2 size={28} className="text-indigo-400 animate-spin" style={{ color: "#6366f1" }} />
              </div>
            ) : error ? (
              <p style={{ color: "#ef4444", textAlign: "center", padding: "24px 0" }}>{error}</p>
            ) : (
              <div style={{
                display:             "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                gap:                 16,
                paddingTop:          8,
              }}>
                {plans.map(p => (
                  <PlanCard key={p.plan} plan={p} onSelect={handleSelectPlan} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── STEP: Confirm free switch ─────────────────────────────────── */}
        {step === "confirm-free" && selected && (
          <ConfirmBox
            title="Switch to Free Plan?"
            subtitle="You'll lose access to your current plan's limits immediately."
            highlights={[
              "100K tokens / month",
              "500 requests / month",
              "10 image generations",
              "No charges going forward",
            ]}
            confirmLabel="Yes, switch to Free"
            confirmColor="#64748b"
            onConfirm={handleSwitchFree}
            loading={actionLoading}
            error={error}
          />
        )}

        {/* ── STEP: Confirm downgrade ───────────────────────────────────── */}
        {step === "confirm-downgrade" && selected && (
          <ConfirmBox
            title={`Downgrade to ${cap(selected.plan)}?`}
            subtitle="Your current plan stays active until the billing period ends. After that, you'll be moved to the new plan."
            highlights={[
              "Access continues until period end",
              "New limits apply from next cycle",
              "No refunds for unused time",
            ]}
            confirmLabel={`Confirm Downgrade to ${cap(selected.plan)}`}
            confirmColor="#f59e0b"
            onConfirm={handleInitiateEsewa}
            loading={actionLoading}
            error={error}
          />
        )}

        {/* ── STEP: Payment ─────────────────────────────────────────────── */}
        {step === "payment" && selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#f1f5f9", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
                Complete Payment
              </h2>
              <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
                You're upgrading to <strong style={{ color: "#f1f5f9" }}>{cap(selected.plan)}</strong> for{" "}
                <strong style={{ color: "#6366f1" }}>NPR {selected.price_npr.toLocaleString()}/month</strong>
              </p>
            </div>

            {/* Order summary */}
            <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "16px 20px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>
                Order Summary
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#94a3b8", marginBottom: 8 }}>
                <span>{cap(selected.plan)} Plan — 1 month</span>
                <span style={{ fontFamily: "monospace" }}>NPR {selected.price_npr.toLocaleString()}</span>
              </div>
              <div style={{ borderTop: "1px solid #1e293b", paddingTop: 10, display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#f1f5f9" }}>
                <span>Total</span>
                <span style={{ fontFamily: "monospace", color: "#6366f1" }}>NPR {selected.price_npr.toLocaleString()}</span>
              </div>
            </div>

            {/* eSewa button */}
            {error && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}
            <button
              onClick={handleInitiateEsewa}
              disabled={actionLoading}
              style={{
                width:         "100%",
                padding:       "14px 0",
                borderRadius:  12,
                background:    "linear-gradient(135deg, #60BB46, #48a836)",
                border:        "none",
                cursor:        actionLoading ? "not-allowed" : "pointer",
                display:       "flex",
                alignItems:    "center",
                justifyContent: "center",
                gap:           10,
                fontWeight:    700,
                fontSize:      15,
                color:         "#fff",
                letterSpacing: "0.02em",
                boxShadow:     "0 4px 20px #60BB4633",
              }}
            >
              {actionLoading ? (
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <>
                  <img
                    src="https://esewa.com.np/common/images/esewa_logo.png"
                    alt="eSewa"
                    style={{ height: 22, filter: "brightness(0) invert(1)" }}
                    onError={e => (e.currentTarget.style.display = "none")}
                  />
                  Pay with eSewa
                </>
              )}
            </button>

            {/* Trust note */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#334155", fontSize: 12 }}>
              <ShieldCheck size={14} />
              Secured & verified by eSewa Payment Gateway
            </div>
          </div>
        )}

        {/* ── STEP: Processing / Redirecting ───────────────────────────── */}
        {step === "processing" && esewaPayload && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Loader2 size={40} style={{ color: "#6366f1", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", margin: "0 0 8px" }}>
              Redirecting to eSewa…
            </p>
            <p style={{ fontSize: 13, color: "#475569" }}>
              Please do not close this window.
            </p>
            {/* Hidden auto-submit form */}
            <form ref={esewaFormRef} action={esewaPayload.form_url} method="POST" style={{ display: "none" }}>
              {Object.entries(esewaPayload.payload).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
            </form>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Shared confirm box ───────────────────────────────────────────────────────
function ConfirmBox({
  title, subtitle, highlights, confirmLabel, confirmColor, onConfirm, loading, error,
}: {
  title: string; subtitle: string; highlights: string[];
  confirmLabel: string; confirmColor: string;
  onConfirm: () => void; loading?: boolean; error?: string | null;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#f1f5f9", margin: "0 0 8px", letterSpacing: "-0.03em" }}>
          {title}
        </h2>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{subtitle}</p>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
        {highlights.map(h => (
          <li key={h} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#94a3b8" }}>
            <span style={{ color: confirmColor, fontSize: 16 }}>✓</span> {h}
          </li>
        ))}
      </ul>
      {error && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}
      <button
        onClick={onConfirm}
        disabled={loading}
        style={{
          padding:    "13px 0",
          borderRadius: 10,
          background: `linear-gradient(135deg, ${confirmColor}, ${confirmColor}bb)`,
          border:     "none",
          color:      "#fff",
          fontWeight: 700,
          fontSize:   14,
          cursor:     loading ? "not-allowed" : "pointer",
          display:    "flex",
          alignItems: "center",
          justifyContent: "center",
          gap:        8,
        }}
      >
        {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : confirmLabel}
      </button>
    </div>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
