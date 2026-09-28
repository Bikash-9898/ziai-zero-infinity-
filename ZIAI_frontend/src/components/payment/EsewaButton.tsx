// src/components/payment/EsewaButton.tsx
import { useState } from 'react';
import { initiateEsewa } from '../../api/billing';
import { ShinyButton } from '@/components/ui/shiny-button';
import { getPlanAccent } from '@/components/billing/planAccents';

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
      <ShinyButton
        onClick={handlePay}
        disabled={loading}
        aria-busy={loading}
        highlightColor={getPlanAccent(plan)}
        className="w-full rounded-[10px] text-[13px] font-bold [--shiny-cta-padding:11px_0] [--shiny-cta-font-size:13px] [--shiny-cta-bg:#0f172a]"
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <span className="inline-flex items-center justify-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-white/25 flex items-center justify-center text-sm font-black shrink-0">
              e
            </span>
            Pay with eSewa
          </span>
        )}
      </ShinyButton>

      {error && (
        <p className="text-xs text-red-500 text-center mt-2 mb-0">{error}</p>
      )}
    </div>
  );
}
