import { useState } from 'react';
import { createStripeCheckoutSession } from '@/api/billing';

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
      <button
        onClick={handlePay}
        disabled={loading}
        aria-busy={loading}
        className="w-full flex items-center justify-center gap-2.5 px-5 py-3 bg-[#635bff] hover:brightness-110 text-white text-[15px] font-bold border-none rounded-xl cursor-pointer transition-[filter] duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span
            role="status"
            aria-label="Loading"
            className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
          />
        ) : (
          <>
            <span className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center text-sm font-black shrink-0">
              S
            </span>
            Pay with Stripe
          </>
        )}
      </button>

      {error && <p className="text-xs text-red-500 text-center mt-2 mb-0">{error}</p>}
    </div>
  );
}