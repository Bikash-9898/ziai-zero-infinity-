import React, { useState } from "react";
import { initiateEsewaPayment } from "@/api/billing";

interface EsewaButtonProps {
  planId: string;
  onSuccess?: () => void;
  onError?: (err: string) => void;
  disabled?: boolean;
}

const EsewaButton: React.FC<EsewaButtonProps> = ({
  planId,
  onSuccess,
  onError,
  disabled,
}) => {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const data = await initiateEsewaPayment(planId);

      // eSewa uses a form POST redirect
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "https://uat.esewa.com.np/epay/main"; // use live URL in prod

      const fields: Record<string, string> = {
        amt: String(data.amount),
        pdc: "0",
        psc: "0",
        txAmt: "0",
        tAmt: String(data.amount),
        pid: data.transaction_id,
        scd: data.product_code ?? "EPAYTEST",
        su: `${window.location.origin}/billing/esewa/success`,
        fu: `${window.location.origin}/billing/esewa/failure`,
      };

      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();

      onSuccess?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "eSewa payment failed";
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={disabled || loading}
      className="w-full flex items-center justify-center gap-3 py-3 px-5 rounded-xl font-semibold text-white transition-all duration-200 bg-[#60BB47] hover:bg-[#4da33a] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {/* eSewa Logo SVG */}
      <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="white" />
        <text
          x="50%"
          y="56%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize="16"
          fontWeight="bold"
          fill="#60BB47"
        >
          e
        </text>
      </svg>
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          Redirecting…
        </span>
      ) : (
        "Pay with eSewa"
      )}
    </button>
  );
};

export default EsewaButton;
