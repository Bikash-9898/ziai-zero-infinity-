// src/components/billing/WalletTopUpModal.tsx
//
// Lets a user add an arbitrary NPR amount to their pay-as-you-go wallet
// (credit_balance), separate from subscription plan payments. Backed by
// POST /api/billing/esewa/topup/initiate — see app/controllers/esewa_controller.py.
//
// NOTE: eSewa is the only top-up-capable provider right now. Khalti/Stripe
// support plan payments but their controllers don't have a wallet-topup
// branch yet, so those buttons are shown disabled with a short explanation
// rather than silently failing.

import { useState } from "react";
import { initiateEsewaTopup } from "../../api/billing";

const PRESET_AMOUNTS = [100, 500, 1000, 2500, 5000];
const MIN_TOPUP = 100;
const MAX_TOPUP = 50_000;

interface WalletTopUpModalProps {
  userId: string;
  onClose: () => void;
}

export default function WalletTopUpModal({ userId, onClose }: WalletTopUpModalProps) {
  const [amount, setAmount]   = useState<number>(500);
  const [customInput, setCustomInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const effectiveAmount = customInput ? Number(customInput) : amount;
  const isValid = Number.isFinite(effectiveAmount) && effectiveAmount >= MIN_TOPUP && effectiveAmount <= MAX_TOPUP;

  const handlePickPreset = (value: number) => {
    setAmount(value);
    setCustomInput("");
  };

  const handlePay = async () => {
    if (!isValid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await initiateEsewaTopup(effectiveAmount, userId);

      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.form_url;

      Object.entries(data.payload).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type  = "hidden";
        input.name  = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      try {
        form.submit();
        // Spinner intentionally stays — page navigates away to eSewa
      } finally {
        if (document.body.contains(form)) document.body.removeChild(form);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start top-up");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-1000 p-4 animate-[fadeIn_0.15s_ease]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-[20px] w-full max-w-105 p-7 flex flex-col gap-5 shadow-[0_32px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.03)] animate-[slideUp_0.2s_cubic-bezier(0.4,0,0.2,1)]">

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-[20px] font-bold text-slate-100 m-0 mb-1 tracking-tight">
              Add Funds
            </h2>
            <p className="text-[13px] text-slate-500 m-0">
              Top up your wallet — used for pay-as-you-go AI requests
            </p>
          </div>
          <button
            className="bg-[#1e293b] border-none text-slate-500 w-8 h-8 rounded-lg cursor-pointer text-sm flex items-center justify-center transition-[background,color] duration-150 shrink-0 hover:bg-[#273344] hover:text-slate-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Preset amounts */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600 m-0 mb-3">
            Choose an amount
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {PRESET_AMOUNTS.map((value) => (
              <button
                key={value}
                onClick={() => handlePickPreset(value)}
                className={`py-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                  !customInput && amount === value
                    ? "border-indigo-500 bg-indigo-500/[0.1] text-indigo-300 shadow-[0_0_16px_rgba(99,102,241,0.13)]"
                    : "border-[#334155] bg-[#1e293b] text-slate-300 hover:border-slate-500"
                }`}
              >
                NPR {value.toLocaleString()}
              </button>
            ))}
            <div
              className={`py-1 px-1 rounded-xl border flex items-center transition-all ${
                customInput ? "border-indigo-500 bg-indigo-500/[0.1]" : "border-[#334155] bg-[#1e293b]"
              }`}
            >
              <span className="text-xs text-slate-500 pl-2.5 pr-1 shrink-0">NPR</span>
              <input
                type="number"
                min={MIN_TOPUP}
                max={MAX_TOPUP}
                placeholder="Custom"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-slate-100 text-sm font-bold py-2 pr-2.5 min-w-0"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-700 mt-2.5 mb-0">
            Min NPR {MIN_TOPUP.toLocaleString()} · Max NPR {MAX_TOPUP.toLocaleString()} per top-up
          </p>
        </div>

        <div className="h-px bg-[#1e293b]" />

        {/* Amount due */}
        <div className="flex justify-between items-center bg-[#1e293b] rounded-xl px-4.5 py-3.5">
          <span className="text-[13px] text-slate-500">You'll add</span>
          <span className="text-[22px] font-extrabold text-slate-100 tabular-nums tracking-[-0.03em]">
            NPR {Number.isFinite(effectiveAmount) ? effectiveAmount.toLocaleString() : "0"}
          </span>
        </div>

        {/* Payment method */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600 m-0 mb-3">
            Payment method
          </p>
          <button
            onClick={handlePay}
            disabled={!isValid || loading}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3 bg-[#60bb46] hover:brightness-110 text-white text-[15px] font-bold border-none rounded-xl cursor-pointer transition-[filter] duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="w-6 h-6 rounded-md bg-white/25 flex items-center justify-center text-sm font-black shrink-0">
                  e
                </span>
                Pay with eSewa
              </>
            )}
          </button>

          {/* Khalti/Stripe wallet top-up isn't wired on the backend yet —
              shown disabled rather than hidden so it's clear it's coming,
              not missing by accident. */}
          <div className="grid grid-cols-2 gap-2.5 mt-2.5">
            <button
              disabled
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-slate-600 text-[13px] font-semibold cursor-not-allowed opacity-50"
            >
              Khalti (soon)
            </button>
            <button
              disabled
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#1e293b] border border-[#334155] rounded-xl text-slate-600 text-[13px] font-semibold cursor-not-allowed opacity-50"
            >
              Stripe (soon)
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 text-center m-0">{error}</p>
        )}

        <p className="text-[11px] text-slate-700 text-center m-0 leading-relaxed">
          🔒 Payments are processed securely. Your balance updates immediately after verification.
        </p>
      </div>
    </div>
  );
}
