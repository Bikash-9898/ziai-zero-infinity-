// import React, { useState } from "react";
// import { initiateKhalti } from "../../api/billing";

// interface KhaltiButtonProps {
//   plan: string;
//   userId: string;
// }

// export default function KhaltiButton({ plan, userId }: KhaltiButtonProps) {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const handlePay = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const data = await initiateKhalti(plan, userId);
//       // Khalti uses a simple redirect to their hosted payment page
//       window.location.href = data.payment_url;
//     } catch (e: any) {
//       setError(e.message ?? "Failed to initiate Khalti payment");
//       setLoading(false);
//     }
//   };

//   return (
//     <div>
//       <button
//         onClick={handlePay}
//         disabled={loading}
//         className="khalti-btn"
//       >
//         {loading ? (
//           <span className="khalti-spinner" />
//         ) : (
//           <>
//             <span className="khalti-logo-mark">K</span>
//             Pay with Khalti
//           </>
//         )}
//       </button>
//       {error && <p className="khalti-error">{error}</p>}

//       <style>{`
//         .khalti-btn {
//           width: 100%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           gap: 10px;
//           padding: 13px 20px;
//           background: linear-gradient(135deg, #5c2d91, #7b3fc4);
//           color: #fff;
//           font-size: 15px;
//           font-weight: 700;
//           border: none;
//           border-radius: 12px;
//           cursor: pointer;
//           transition: filter 0.2s, transform 0.15s;
//           box-shadow: 0 4px 20px #5c2d9144;
//           letter-spacing: 0.01em;
//         }
//         .khalti-btn:hover:not(:disabled) {
//           filter: brightness(1.12);
//           transform: translateY(-1px);
//         }
//         .khalti-btn:disabled { opacity: 0.6; cursor: not-allowed; }
//         .khalti-logo-mark {
//           width: 24px;
//           height: 24px;
//           border-radius: 6px;
//           background: rgba(255,255,255,0.2);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-size: 13px;
//           font-weight: 900;
//           flex-shrink: 0;
//         }
//         .khalti-spinner {
//           display: inline-block;
//           width: 18px;
//           height: 18px;
//           border: 2px solid rgba(255,255,255,0.3);
//           border-top-color: #fff;
//           border-radius: 50%;
//           animation: spin 0.7s linear infinite;
//         }
//         .khalti-error {
//           font-size: 12px;
//           color: #ef4444;
//           text-align: center;
//           margin: 8px 0 0;
//         }
//         @keyframes spin { to { transform: rotate(360deg); } }
//       `}</style>
//     </div>
//   );
// }
