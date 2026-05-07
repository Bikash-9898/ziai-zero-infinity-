// src/components/payment/EsewaButton.tsx

import { useState } from "react";
import { initiateEsewa } from "../../api/billing";

interface EsewaButtonProps {
  plan: string;
  userId: string;
}

export default function EsewaButton({ plan, userId }: EsewaButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await initiateEsewa(plan, userId);

      // eSewa requires a hidden form POST — cannot use fetch redirect
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.form_url;

      Object.entries(data.payload).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();

      // NOTE: setLoading(false) is intentionally NOT called here.
      // The page will navigate away via form.submit(), so the spinner
      // should remain visible. If submit fails silently, the catch block handles it.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to initiate eSewa payment");
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 px-5 py-3.25 bg-linear-to-br from-[#60bb46] to-[#4da038] text-white text-[15px] font-bold border-none rounded-xl cursor-pointer transition-[filter,transform] duration-200 shadow-[0_4px_20px_#60bb4644] tracking-[0.01em] hover:not-disabled:brightness-110 hover:not-disabled:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="inline-block w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-[esewa-spin_0.7s_linear_infinite]" />
        ) : (
          <>
            <span className="w-6 h-6 rounded-md bg-white/25 flex items-center justify-center text-sm font-black shrink-0">
              e
            </span>
            Pay with eSewa
          </>
        )}
      </button>

      {error && (
        <p className="text-xs text-red-500 text-center mt-2 mb-0">
          {error}
        </p>
      )}

      <style>{`@keyframes esewa-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}