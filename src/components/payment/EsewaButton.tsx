// src/components/payment/EsewaButton.tsx
import { useState } from 'react';
import { initiateEsewa } from '../../api/billing';

interface EsewaButtonProps {
  plan:   string;
  userId: string;
}

export default function EsewaButton({ plan, userId }: EsewaButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await initiateEsewa(plan, userId);

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.form_url;

      Object.entries(data.payload).forEach(([key, value]) => {
        const input   = document.createElement('input');
        input.type    = 'hidden';
        input.name    = key;
        input.value   = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      try {
        form.submit();
        // Spinner intentionally stays — page navigates away
      } finally {
        // Clean up in case submit throws (sandboxed environments)
        if (document.body.contains(form)) document.body.removeChild(form);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to initiate eSewa payment');
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={loading}
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

      {error && (
        <p className="text-xs text-red-500 text-center mt-2 mb-0">{error}</p>
      )}
    </div>
  );
}
