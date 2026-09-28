import { useState } from 'react';
import { createStripeCheckoutSession } from '@/api/billing';
import { ShinyButton } from '@/components/ui/shiny-button';
import { getPlanAccent } from '@/components/billing/planAccents';

interface StripeButtonProps {
  plan: string;
  userId: string;
}

export default function StripeButton({ plan, userId }: StripeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await createStripeCheckoutSession(plan, userId);
      if (session.url) {
        window.location.assign(session.url);
      } else {
        setError('Stripe checkout URL was not returned.');
      }
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Failed to start Stripe checkout';
      setError(
        message.includes('404')
          ? 'Stripe checkout is not available yet because the backend endpoint is missing. Please add /api/billing/stripe/create-checkout-session on the server.'
          : message,
      );
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
          <span
            role="status"
            aria-label="Loading"
            className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
          />
        ) : (
          <span className="inline-flex items-center justify-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-sm font-black shrink-0">
              S
            </span>
            Pay with Stripe
          </span>
        )}
      </ShinyButton>

      {error && <p className="text-xs text-red-500 text-center mt-2 mb-0">{error}</p>}
    </div>
  );
}