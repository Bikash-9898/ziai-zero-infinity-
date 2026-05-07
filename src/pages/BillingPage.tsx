// src/pages/BillingPage.tsx

import { useState } from "react";
import { CreditCard, Zap, Clock, ChevronRight, RotateCcw } from "lucide-react";
import {
  useBillingStatus,
  usePaymentHistory,
  // useComparePlans,   ← kept for future use / admin side
} from "@/hooks/useUsage";
import { useAuth } from "@/context/useAuth";
import UpgradeModal from "@/components/billing/UpgradeModal";
import UsageBar from "@/components/billing/UsageBar";
import { useUsage } from "@/hooks/useUsage";
import { cancelSubscription } from "@/api/billing";

// ── Plan display metadata ────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  free:       "#64748b",
  basic:      "#06b6d4",
  pro:        "#6366f1",
  enterprise: "#f59e0b",
};

const PLAN_ICONS: Record<string, string> = {
  free: "◇", basic: "◈", pro: "⬡", enterprise: "✦",
};

// ── Component ────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { user }                             = useAuth();
  const userId                               = user?.id ?? "";
  const { status, refetch: refetchStatus }   = useBillingStatus(userId);
  const { usage, loading: usageLoading }     = useUsage(userId);
  const { payments, loading: payLoading }    = usePaymentHistory(userId);
  const [showUpgrade, setShowUpgrade]        = useState(false);
  const [canceling, setCanceling]            = useState(false);
  const [cancelMsg, setCancelMsg]            = useState<string | null>(null);

  const planColor = PLAN_COLORS[status?.current_plan ?? "free"] ?? "#6366f1";
  const planIcon  = PLAN_ICONS[status?.current_plan  ?? "free"] ?? "◇";

  // ── Cancel subscription ──────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!confirm("Cancel your subscription? You'll keep access until the period ends.")) return;
    setCanceling(true);
    setCancelMsg(null);
    try {
      const res = await cancelSubscription(userId);
      setCancelMsg(
        `Subscription canceled. Access until ${new Date(res.period_end).toLocaleDateString("en-NP")}`
      );
      refetchStatus();
    } catch (err) {
      // FIX: Previously swallowed the real error — now shows actual message.
      // OLD CODE: setCancelMsg("Failed to cancel. Please try again.");
      // ↑ That catch block had no (err) parameter, losing the error detail.
      setCancelMsg(
        err instanceof Error ? err.message : "Failed to cancel. Please try again."
      );
    } finally {
      setCanceling(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:  "100vh",
      background: "#060c18",
      color:      "#f1f5f9",
      fontFamily: "'Syne', sans-serif",
      padding:    "48px 24px 80px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <div style={{
        maxWidth:      900,
        margin:        "0 auto",
        display:       "flex",
        flexDirection: "column",
        gap:           32,
      }}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div style={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "flex-start",
          flexWrap:       "wrap",
          gap:            16,
        }}>
          <div>
            <h1 style={{
              fontSize:      30,
              fontWeight:    900,
              letterSpacing: "-0.04em",
              margin:        "0 0 6px",
            }}>
              Billing &amp; Plans
            </h1>
            <p style={{ fontSize: 14, color: "#475569", margin: 0 }}>
              Manage your subscription, payment history, and usage
            </p>
          </div>
          <button
            onClick={() => setShowUpgrade(true)}
            style={{
              padding:       "11px 22px",
              background:    "linear-gradient(135deg, #6366f1, #4f46e5)",
              border:        "none",
              borderRadius:  12,
              color:         "#fff",
              fontSize:      13,
              fontWeight:    700,
              cursor:        "pointer",
              letterSpacing: "0.04em",
              boxShadow:     "0 4px 16px #6366f133",
              display:       "flex",
              alignItems:    "center",
              gap:           8,
            }}
          >
            <Zap size={15} />
            Upgrade Plan
          </button>
        </div>

        {/* ── Current plan card ─────────────────────────────────────────── */}
        <div style={{
          background:     `linear-gradient(135deg, ${planColor}11, #0f172a)`,
          border:         `1px solid ${planColor}44`,
          borderRadius:   16,
          padding:        "24px 28px",
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "center",
          flexWrap:       "wrap",
          gap:            20,
          boxShadow:      `0 0 40px ${planColor}11`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Plan icon */}
            <div style={{
              width:          56,
              height:         56,
              borderRadius:   14,
              background:     `${planColor}22`,
              border:         `1px solid ${planColor}44`,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       26,
              color:          planColor,
            }}>
              {planIcon}
            </div>
            <div>
              <p style={{
                fontSize:      11,
                color:         "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                margin:        "0 0 4px",
              }}>
                Active Plan
              </p>
              <p style={{
                fontSize:      22,
                fontWeight:    900,
                color:         "#f1f5f9",
                margin:        "0 0 2px",
                letterSpacing: "-0.02em",
              }}>
                {cap(status?.current_plan ?? "free")}
              </p>
              <p style={{ fontSize: 12, color: "#475569", margin: 0, fontFamily: "monospace" }}>
                {status?.subscription.status === "active" && status.subscription.period_end
                  ? `Renews ${new Date(status.subscription.period_end).toLocaleDateString("en-NP")}`
                  : status?.subscription.status === "canceled"
                    ? `Access until ${new Date(status.subscription.period_end!).toLocaleDateString("en-NP")}`
                    : "No active subscription"
                }
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            {status?.subscription.status === "active" && status.current_plan !== "free" && (
              <button
                onClick={handleCancel}
                disabled={canceling}
                style={{
                  padding:      "9px 16px",
                  background:   "transparent",
                  border:       "1px solid #ef444444",
                  borderRadius: 10,
                  color:        "#ef4444",
                  fontSize:     12,
                  fontWeight:   600,
                  cursor:       canceling ? "not-allowed" : "pointer",
                  display:      "flex",
                  alignItems:   "center",
                  gap:          6,
                  opacity:      canceling ? 0.6 : 1,
                  transition:   "opacity 0.2s",
                }}
              >
                <RotateCcw size={13} />
                {canceling ? "Canceling…" : "Cancel Plan"}
              </button>
            )}
            <button
              onClick={() => setShowUpgrade(true)}
              style={{
                padding:      "9px 16px",
                background:   "#1e293b",
                border:       "1px solid #334155",
                borderRadius: 10,
                color:        "#94a3b8",
                fontSize:     12,
                fontWeight:   600,
                cursor:       "pointer",
                display:      "flex",
                alignItems:   "center",
                gap:          6,
              }}
            >
              Change Plan <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Cancel message */}
        {cancelMsg && (
          <p style={{
            fontSize:     13,
            color:        "#f59e0b",
            background:   "#f59e0b11",
            border:       "1px solid #f59e0b33",
            borderRadius: 8,
            padding:      "10px 14px",
          }}>
            {cancelMsg}
          </p>
        )}

        {/* ── Usage this period ─────────────────────────────────────────── */}
        <Section title="This Period's Usage" icon={<Zap size={14} />}>
          {usageLoading ? (
            <Skeleton />
          ) : usage ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <UsageBar
                label="Tokens"
                used={usage.tokens_used}
                limit={usage.tokens_limit}
                isUnlimited={usage.tokens_limit === -1}
                percent={usage.percent_tokens_used}
                icon="⬡"
              />
              <UsageBar
                label="Requests"
                used={usage.requests_used}
                limit={usage.requests_limit}
                isUnlimited={usage.requests_limit === -1}
                percent={usage.percent_requests_used}
                icon="↗"
              />
              <UsageBar
                label="Images"
                used={usage.images_used}
                limit={usage.images_limit}
                isUnlimited={usage.images_limit === -1}
                // FIX: Previously computed inline as a ternary that could produce
                // wrong values. Now UsageBar handles the null case internally.
                // OLD CODE: percent={usage.images_limit === -1 ? null : (usage.images_used / usage.images_limit) * 100}
                percent={
                  usage.images_limit === -1
                    ? null
                    : usage.images_limit > 0
                      ? (usage.images_used / usage.images_limit) * 100
                      : 0
                }
                icon="◈"
              />
            </div>
          ) : (
            <p style={{ color: "#334155", fontSize: 13 }}>No usage data</p>
          )}
        </Section>

        {/* ── Payment history ───────────────────────────────────────────── */}
        <Section title="Payment History" icon={<CreditCard size={14} />}>
          {payLoading ? (
            <Skeleton />
          ) : !payments || payments.length === 0 ? (
            <p style={{ fontSize: 13, color: "#334155", padding: "16px 0" }}>
              No payment records yet.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Date", "Plan", "Amount", "Provider", "Status"].map(h => (
                    <th
                      key={h}
                      style={{
                        textAlign:     "left",
                        fontSize:      10,
                        fontWeight:    700,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color:         "#334155",
                        paddingBottom: 10,
                        borderBottom:  "1px solid #1e293b",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td style={{
                      padding:     "11px 0",
                      borderBottom: "1px solid #0f172a",
                      color:        "#64748b",
                      fontFamily:   "monospace",
                      fontSize:     11,
                    }}>
                      {new Date(p.created_at).toLocaleDateString("en-NP")}
                    </td>
                    <td style={{
                      padding:      "11px 0",
                      borderBottom: "1px solid #0f172a",
                      color:        "#f1f5f9",
                      fontWeight:   600,
                    }}>
                      {cap(p.plan)}
                    </td>
                    <td style={{
                      padding:      "11px 0",
                      borderBottom: "1px solid #0f172a",
                      color:        "#94a3b8",
                      fontFamily:   "monospace",
                    }}>
                      NPR {Number(p.amount).toLocaleString()}
                    </td>
                    <td style={{
                      padding:       "11px 0",
                      borderBottom:  "1px solid #0f172a",
                      color:         "#64748b",
                      textTransform: "capitalize",
                    }}>
                      {p.provider}
                    </td>
                    <td style={{ padding: "11px 0", borderBottom: "1px solid #0f172a" }}>
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* ── Last payment detail ───────────────────────────────────────── */}
        {status?.last_payment.amount && (
          <Section title="Last Successful Payment" icon={<Clock size={14} />}>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <InfoItem
                label="Amount"
                value={`NPR ${Number(status.last_payment.amount).toLocaleString()}`}
              />
              <InfoItem
                label="Provider"
                value={status.last_payment.provider ?? "—"}
              />
              <InfoItem
                label="Date"
                value={
                  status.last_payment.date
                    ? new Date(status.last_payment.date).toLocaleDateString("en-NP")
                    : "—"
                }
              />
            </div>
          </Section>
        )}

      </div>

      {/* ── Upgrade Modal ────────────────────────────────────────────────── */}
      {showUpgrade && (
        <UpgradeModal
          userId={userId}
          currentPlan={status?.current_plan ?? "free"}
          onClose={() => setShowUpgrade(false)}
          onPlanChanged={() => {
            setShowUpgrade(false);
            refetchStatus();
          }}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background:   "#0f172a",
      border:       "1px solid #1e293b",
      borderRadius: 14,
      padding:      "22px 26px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <span style={{ color: "#475569" }}>{icon}</span>
        <p style={{
          fontSize:      11,
          fontWeight:    700,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color:         "#475569",
          margin:        0,
        }}>
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{
        fontSize:      10,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color:         "#475569",
      }}>
        {label}
      </span>
      <span style={{ fontSize: 14, color: "#94a3b8", fontFamily: "monospace" }}>
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, [string, string]> = {
    success:  ["#22c55e22", "#22c55e"],
    pending:  ["#f59e0b22", "#f59e0b"],
    failed:   ["#ef444422", "#ef4444"],
    refunded: ["#6366f122", "#6366f1"],
  };
  const [bg, fg] = colors[status] ?? ["#33415522", "#64748b"];
  return (
    <span style={{
      fontSize:      10,
      fontWeight:    700,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      padding:       "3px 8px",
      borderRadius:  999,
      background:    bg,
      color:         fg,
    }}>
      {status}
    </span>
  );
}

function Skeleton() {
  return (
    <>
      <div style={{
        height:          80,
        background:      "linear-gradient(90deg,#0f172a,#1e293b,#0f172a)",
        backgroundSize:  "200% 100%",
        borderRadius:    10,
        animation:       "billing-shimmer 1.5s infinite",
      }} />
      <style>{`
        @keyframes billing-shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }