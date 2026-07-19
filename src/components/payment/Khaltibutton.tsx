import { useState } from 'react';
import { initiateKhalti } from '@/api/billing';

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
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 px-5 py-3 bg-linear-to-br from-purple-600 to-violet-600 text-white text-[15px] font-bold border-none rounded-xl cursor-pointer transition-[filter] duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <span className="w-6 h-6 rounded-md bg-white/12 flex items-center justify-center text-sm font-black shrink-0">
              K
            </span>
            Pay with Khalti
          </>
        )}
      </button>

      {error && (
        <p className="text-xs text-red-500 text-center mt-2 mb-0">{error}</p>
      )}
    </div>
  );
}