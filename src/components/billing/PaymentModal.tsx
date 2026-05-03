import React, { useEffect, useRef } from "react";
import EsewaButton from "@/payment/EsewaButton";
// import KhaltiButton from "@/payment/KhaltiButton";
import type { Plan } from "@/api/billing";

interface PaymentModalProps {
  plan: Plan | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  plan,
  onClose,
  onSuccess,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!plan) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <div>
            <h2 className="text-white font-bold text-lg">
              Upgrade to{" "}
              <span className="capitalize text-violet-400">{plan.name}</span>
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Rs {plan.price}/month — billed monthly
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Plan summary */}
        <div className="px-6 py-4 bg-slate-800/50">
          <div className="flex gap-3">
            <div className="flex-1 text-center bg-slate-700/40 rounded-lg py-2.5">
              <p className="text-white font-bold">
                {plan.tokens >= 1_000_000
                  ? `${plan.tokens / 1_000_000}M`
                  : `${plan.tokens / 1_000}K`}
              </p>
              <p className="text-slate-400 text-xs">Tokens / mo</p>
            </div>
            <div className="flex-1 text-center bg-slate-700/40 rounded-lg py-2.5">
              <p className="text-white font-bold">
                {plan.requests >= 1_000
                  ? `${plan.requests / 1_000}K`
                  : plan.requests}
              </p>
              <p className="text-slate-400 text-xs">Requests / mo</p>
            </div>
          </div>
        </div>

        {/* Payment methods */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-4">
            Choose payment method
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-2">
              {error}
            </div>
          )}

          <EsewaButton
            planId={plan.id}
            onSuccess={onSuccess}
            onError={setError}
          />

          {/* <KhaltiButton
            planId={plan.id}
            amount={plan.price}
            onSuccess={onSuccess}
            onError={setError}
          /> */}

          <p className="text-slate-500 text-xs text-center pt-2">
            Payments are secure. You'll be redirected to complete payment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
