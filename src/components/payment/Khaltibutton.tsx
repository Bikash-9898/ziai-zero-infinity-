// import React, { useState } from "react";
// import { initiateKhaltiPayment } from "@/api/billing";

// interface KhaltiButtonProps {
//   planId: string;
//   amount: number; // in NPR
//   onSuccess?: () => void;
//   onError?: (err: string) => void;
//   disabled?: boolean;
// }

// const KhaltiButton: React.FC<KhaltiButtonProps> = ({
//   planId,
//   amount,
//   onSuccess,
//   onError,
//   disabled,
// }) => {
//   const [loading, setLoading] = useState(false);

//   const handlePay = async () => {
//     setLoading(true);
//     try {
//       const data = await initiateKhaltiPayment(planId);

//       // Khalti v2 (payment initiation URL)
//       if (data.payment_url) {
//         window.location.href = data.payment_url;
//         onSuccess?.();
//         return;
//       }

//       throw new Error("No payment URL returned from Khalti");
//     } catch (e: unknown) {
//       const msg = e instanceof Error ? e.message : "Khalti payment failed";
//       onError?.(msg);
//       setLoading(false);
//     }
//   };

//   return (
//     <button
//       onClick={handlePay}
//       disabled={disabled || loading}
//       className="w-full flex items-center justify-center gap-3 py-3 px-5 rounded-xl font-semibold text-white transition-all duration-200 bg-[#5C2D91] hover:bg-[#4a2475] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
//     >
//       {/* Khalti purple diamond logo */}
//       <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
//         <path
//           d="M12 2L22 12L12 22L2 12L12 2Z"
//           fill="white"
//           fillOpacity="0.9"
//         />
//         <path d="M12 6L18 12L12 18L6 12L12 6Z" fill="#5C2D91" />
//       </svg>

//       {loading ? (
//         <span className="flex items-center gap-2">
//           <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
//             <circle
//               className="opacity-25"
//               cx="12"
//               cy="12"
//               r="10"
//               stroke="currentColor"
//               strokeWidth="4"
//             />
//             <path
//               className="opacity-75"
//               fill="currentColor"
//               d="M4 12a8 8 0 018-8v8H4z"
//             />
//           </svg>
//           Redirecting…
//         </span>
//       ) : (
//         `Pay Rs ${amount} with Khalti`
//       )}
//     </button>
//   );
// };

// export default KhaltiButton;
