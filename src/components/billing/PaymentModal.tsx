// src/components/billing/PaymentModal.tsx
//
// NOTE: This component is NOT used in the current client billing flow.
// UpgradeModal handles plan selection + eSewa payment inline.
// PaymentModal was an earlier design that separated plan selection from payment.
//
// Kept here in case it is needed for:
//   - Admin-side manual payment triggering
//   - Future Khalti integration (the KhaltiButton slot is already wired)
//   - A/B testing an alternate payment UX
//
// Do NOT delete — may be needed for admin side.

import { useState } from "react";
import EsewaButton from "../payment/EsewaButton";
// import KhaltiButton from "../payment/KhaltiButton";

interface PaymentModalProps {
  plan:     string;
  priceNPR: number;
  userId:   string;
  onClose:  () => void;
}

export default function PaymentModal({
  plan,
  priceNPR,
  userId,
  onClose,
}: PaymentModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<"esewa" | "khalti" | null>(null);

  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <div
      className="modal-backdrop"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">

        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Complete Payment</h2>
            <p className="modal-sub">
              Upgrading to <strong>{planLabel}</strong> plan
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Amount */}
        <div className="amount-row">
          <span className="amount-label">Amount due</span>
          <span className="amount-value">NPR {priceNPR.toLocaleString()}</span>
        </div>

        <div className="divider" />

        {/* Provider selection */}
        <p className="section-label">Choose payment method</p>
        <div className="provider-grid">
          <button
            className={`provider-btn ${selectedProvider === "esewa" ? "selected" : ""}`}
            onClick={() => setSelectedProvider("esewa")}
          >
            <span className="provider-logo esewa-logo">e</span>
            <span className="provider-name">eSewa</span>
            <span className="provider-tag">NPR · Wallet</span>
          </button>
          <button
            className={`provider-btn ${selectedProvider === "khalti" ? "selected" : ""}`}
            onClick={() => setSelectedProvider("khalti")}
          >
            <span className="provider-logo khalti-logo">K</span>
            <span className="provider-name">Khalti</span>
            <span className="provider-tag">NPR · Digital</span>
          </button>
        </div>

        <div className="divider" />

        {/* Payment button */}
        <div className="pay-action">
          {!selectedProvider && (
            <p className="select-hint">Select a payment method above to continue</p>
          )}
          {selectedProvider === "esewa" && (
            <EsewaButton plan={plan} userId={userId} />
          )}
          {/* Uncomment when Khalti is integrated:
          {selectedProvider === "khalti" && (
            <KhaltiButton plan={plan} userId={userId} />
          )} */}
        </div>

        {/* Footer */}
        <p className="modal-footer-note">
          🔒 Payments are processed securely. Your subscription activates
          immediately after verification.
        </p>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .modal-box {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 20px;
          width: 100%;
          max-width: 420px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: slideUp 0.2s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px #ffffff08;
        }
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0 }
          to   { transform: none; opacity: 1 }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .modal-title {
          font-size: 20px;
          font-weight: 700;
          color: #f1f5f9;
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }
        .modal-sub { font-size: 13px; color: #64748b; margin: 0; }
        .modal-sub strong { color: #94a3b8; }
        .modal-close {
          background: #1e293b;
          border: none;
          color: #64748b;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .modal-close:hover { background: #273344; color: #f1f5f9; }
        .amount-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #1e293b;
          border-radius: 12px;
          padding: 14px 18px;
        }
        .amount-label { font-size: 13px; color: #64748b; }
        .amount-value {
          font-size: 22px;
          font-weight: 800;
          color: #f1f5f9;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.03em;
        }
        .divider { height: 1px; background: #1e293b; }
        .section-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #475569;
          margin: 0;
        }
        .provider-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .provider-btn {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .provider-btn:hover { border-color: #475569; background: #273344; }
        .provider-btn.selected {
          border-color: #6366f1;
          background: #6366f111;
          box-shadow: 0 0 16px #6366f122;
        }
        .provider-logo {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 900;
          color: #fff;
        }
        .esewa-logo  { background: #60bb46; }
        .khalti-logo { background: #5c2d91; }
        .provider-name { font-size: 14px; font-weight: 600; color: #e2e8f0; }
        .provider-tag {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .pay-action {
          min-height: 44px;
          display: flex;
          flex-direction: column;
          align-items: stretch;
        }
        .select-hint {
          font-size: 13px;
          color: #475569;
          text-align: center;
          margin: 4px 0;
        }
        .modal-footer-note {
          font-size: 11px;
          color: #334155;
          text-align: center;
          margin: 0;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}