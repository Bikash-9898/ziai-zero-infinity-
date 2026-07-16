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
import KhaltiButton from "../payment/Khaltibutton";

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
      className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-1000 p-4 animate-[fadeIn_0.15s_ease]"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-[20px] w-full max-w-105 p-7 flex flex-col gap-5 shadow-[0_32px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.03)] animate-[slideUp_0.2s_cubic-bezier(0.4,0,0.2,1)]">

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-[20px] font-bold text-slate-100 m-0 mb-1 tracking-tight">
              Complete Payment
            </h2>
            <p className="text-[13px] text-slate-500 m-0">
              Upgrading to <strong className="text-slate-400">{planLabel}</strong> plan
            </p>
          </div>
          <button
            className="bg-[#1e293b] border-none text-slate-500 w-8 h-8 rounded-lg cursor-pointer text-sm flex items-center justify-center transition-[background,color] duration-150 shrink-0 hover:bg-[#273344] hover:text-slate-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Amount */}
        <div className="flex justify-between items-center bg-[#1e293b] rounded-xl px-4.5 py-3.5">
          <span className="text-[13px] text-slate-500">Amount due</span>
          <span className="text-[22px] font-extrabold text-slate-100 tabular-nums tracking-[-0.03em]">
            NPR {priceNPR.toLocaleString()}
          </span>
        </div>

        <div className="h-px bg-[#1e293b]" />

        {/* Provider selection */}
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600 m-0">
          Choose payment method
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            className={`bg-[#1e293b] border rounded-xl px-3 py-4 flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-150 hover:border-slate-500 hover:bg-[#273344] ${
              selectedProvider === "esewa"
                ? "border-indigo-500 bg-indigo-500/[0.07] shadow-[0_0_16px_rgba(99,102,241,0.13)]"
                : "border-[#334155]"
            }`}
            onClick={() => setSelectedProvider("esewa")}
          >
            <span className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[18px] font-black text-white bg-[#60bb46]">
              e
            </span>
            <span className="text-sm font-semibold text-slate-200">eSewa</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-[0.06em]">NPR · Wallet</span>
          </button>

          <button
            className={`bg-[#1e293b] border rounded-xl px-3 py-4 flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-150 hover:border-slate-500 hover:bg-[#273344] ${
              selectedProvider === "khalti"
                ? "border-indigo-500 bg-indigo-500/[0.07] shadow-[0_0_16px_rgba(99,102,241,0.13)]"
                : "border-[#334155]"
            }`}
            onClick={() => setSelectedProvider("khalti")}
          >
            <span className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[18px] font-black text-white bg-[#5c2d91]">
              K
            </span>
            <span className="text-sm font-semibold text-slate-200">Khalti</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-[0.06em]">NPR · Digital</span>
          </button>
        </div>

        <div className="h-px bg-[#1e293b]" />

        {/* Payment button */}
        <div className="min-h-11 flex flex-col items-stretch">
          {!selectedProvider && (
            <p className="text-[13px] text-slate-600 text-center my-1">
              Select a payment method above to continue
            </p>
          )}
          {selectedProvider === "esewa" && (
            <EsewaButton plan={plan} userId={userId} />
          )}
          {selectedProvider === "khalti" && (
            <KhaltiButton plan={plan} userId={userId} />
          )}
        </div>

        {/* Footer */}
        <p className="text-[11px] text-slate-700 text-center m-0 leading-relaxed">
          🔒 Payments are processed securely. Your subscription activates
          immediately after verification.
        </p>
      </div>
    </div>
  );
}