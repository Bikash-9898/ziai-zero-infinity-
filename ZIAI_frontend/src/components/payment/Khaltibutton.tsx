import { useState } from 'react';
import { initiateKhalti } from '@/api/billing';
import { ShinyButton } from '@/components/ui/shiny-button';
import { getPlanAccent } from '@/components/billing/planAccents';

interface KhaltiButtonProps {
  plan: string;
  userId: string;
}

export default function KhaltiButton({ plan, userId }: KhaltiButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setLoading(true);
    setError(null);

    try {
      const init = await initiateKhalti(plan, userId);
      window.location.href = init.payment_url;
    } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to initiate Khalti payment');
    } finally {
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
            <span className="w-6 h-6 rounded-md bg-white/12 flex items-center justify-center text-sm font-black shrink-0">
              K
            </span>
            Pay with Khalti
          </span>
        )}
      </ShinyButton>

      {error && (
        <p className="text-xs text-red-500 text-center mt-2 mb-0">{error}</p>
      )}
    </div>
  );
}