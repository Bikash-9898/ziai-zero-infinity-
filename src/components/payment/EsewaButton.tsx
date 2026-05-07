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
      // FIX: Previously was `(e as Error).message ?? "..."` which would lose
      // the actual error message if e was not an Error instance.
      // Now properly handles both Error objects and unknown throws.
      setError(e instanceof Error ? e.message : "Failed to initiate eSewa payment");
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={loading}
        className="esewa-btn"
      >
        {loading ? (
          <span className="esewa-spinner" />
        ) : (
          <>
            <span className="esewa-logo-mark">e</span>
            Pay with eSewa
          </>
        )}
      </button>
      {error && <p className="esewa-error">{error}</p>}

      <style>{`
        .esewa-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 13px 20px;
          background: linear-gradient(135deg, #60bb46, #4da038);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: filter 0.2s, transform 0.15s;
          box-shadow: 0 4px 20px #60bb4644;
          letter-spacing: 0.01em;
        }
        .esewa-btn:hover:not(:disabled) {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        .esewa-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .esewa-logo-mark {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background: rgba(255,255,255,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 900;
          flex-shrink: 0;
        }
        .esewa-spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: esewa-spin 0.7s linear infinite;
        }
        .esewa-error {
          font-size: 12px;
          color: #ef4444;
          text-align: center;
          margin: 8px 0 0;
        }
        @keyframes esewa-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}