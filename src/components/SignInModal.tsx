// src/components/SignInModal.tsx
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';

export default function SignInModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // tokenResponse.access_token is what you get with useGoogleLogin
        // We need the ID token — use the credential flow instead
        await login(tokenResponse.access_token);
        onClose();
        navigate('/client/chat');
      } catch (error) {
        console.error('Login error:', error);
      }
    },
    onError: () => console.error('Google Login Failed'),
    flow: 'implicit',  // gives access_token directly
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-[#0b0b1a] border border-white/10 p-10 rounded-3xl shadow-2xl">
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

        {/* Custom Google button — no initialize() issue */}
        <button
          onClick={() => handleGoogleLogin()}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-gray-800 font-semibold rounded-full hover:bg-gray-100 transition-all shadow-lg"
        >
          {/* Google SVG icon */}
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.9 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.7 35.1 16.3 40 24 40v4z"/>
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.2 5.2C40.8 35.7 44 30.2 44 24c0-1.3-.1-2.7-.4-3.9z"/>
          </svg>
          Continue with Google
        </button>

        <button
          onClick={() => {
            onClose();
            navigate('/guest');
          }}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 mt-4 bg-transparent border border-white/10 text-white font-semibold rounded-full hover:bg-white/5 transition-all shadow-lg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Continue as Guest
        </button>

        <p className="mt-8 text-center text-xs text-gray-500">
          New here? <button className="text-purple-400 font-bold hover:underline">Create an account</button>
        </p>
      </div>
    </div>
  );
}


// import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '@/context/useAuth';

// export default function SignInModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   if (!isOpen) return null;

//   const handleSuccess = async (credentialResponse: CredentialResponse) => {
//     if (!credentialResponse.credential) {
//       console.error('No credential received from Google');
//       return;
//     }
//     try {
//       await login(credentialResponse.credential); // pass raw token — AuthContext handles the API call
//       onClose();
//       navigate('/client');
//     } catch (error) {
//       console.error('Login error:', error);
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
//             <img src="https://zeroinfinitytechnologies.com/images/logo-1771865164119.webp" className="h-8 w-8 rounded-full" alt="ZI" />
//           </div>
//           <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
//           <p className="text-gray-500 text-sm mt-1">Sign in to continue to Zero Infinity</p>
//         </div>

//         <div className="flex justify-center">
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