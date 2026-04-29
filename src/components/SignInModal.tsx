// import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/useAuth';


// export default function SignInModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
//   const { login } = useAuth();
//   const navigate = useNavigate(); // Hook for navigation

//   if (!isOpen) return null;

//   const handleSuccess = async (credentialResponse: CredentialResponse) => {
//     try {
//       // credentialResponse.credential is the ID Token (JWT)
//       const response = await fetch('http://localhost:8000/api/auth/google', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ token: credentialResponse.credential }),
//       });

//       const data = await response.json();
//       if (data.verified) {
//         // console.log("Verified User:", data.user);
//         login(data.user);
//         onClose();
//         navigate('/client'); // Redirect to client dashboard after successful login
//       } else {
//         console.error("Backend verification failed");
//       }
//     } catch (error) {
//       console.error("Login error:", error);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 animate-in fade-in duration-300">
//       <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

//       <div className="relative z-10 w-full max-w-100 bg-[#0b0b1a] border border-white/10 p-10 rounded-4xl shadow-2xl">
//         <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white p-2">
//           <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
//             <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
//           </svg>
//         </button>

//         <div className="flex flex-col items-center mb-8">
//           <div className="h-12 w-12 rounded-2xl bg-linear-to-tr from-purple-600 to-blue-500 flex items-center justify-center mb-4">
//              <img src="https://zeroinfinitytechnologies.com/images/logo-1771865164119.webp" className="h-8 w-8 rounded-full" alt="ZI" />
//           </div>
//           <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
//           <p className="text-gray-500 text-sm mt-1">Sign in to continue to Zero Infinity</p>
//         </div>
        
//         <div className="flex justify-center">
//           {/* This component handles the UI and the "ID Token" generation */}
//           <GoogleLogin
//             onSuccess={handleSuccess}
//             onError={() => console.log('Login Failed')}
//             theme="filled_black"
//             shape="pill"
//             width="320px"
//           />
//         </div>

//         <p className="mt-8 text-center text-xs text-gray-500">
//           New here? <button className="text-purple-400 font-bold hover:underline">Create an account</button>
//         </p>
//       </div>
//     </div>
//   );
// }


import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function SignInModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      console.error('No credential received from Google');
      return;
    }
    try {
      await login(credentialResponse.credential); // pass raw token — AuthContext handles the API call
      onClose();
      navigate('/client');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-100 bg-[#0b0b1a] border border-white/10 p-10 rounded-4xl shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white p-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-linear-to-tr from-purple-600 to-blue-500 flex items-center justify-center mb-4">
            <img src="https://zeroinfinitytechnologies.com/images/logo-1771865164119.webp" className="h-8 w-8 rounded-full" alt="ZI" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to continue to Zero Infinity</p>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.log('Login Failed')}
            theme="filled_black"
            shape="pill"
            width="320px"
          />
        </div>

        <p className="mt-8 text-center text-xs text-gray-500">
          New here? <button className="text-purple-400 font-bold hover:underline">Create an account</button>
        </p>
      </div>
    </div>
  );
}