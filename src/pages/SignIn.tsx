// import React from 'react';

const SignIn = () => {
  const handleGoogleSignIn = () => {
    console.log("Google Sign In Triggered");
    // Add logic here
  };

  const handleMicrosoftSignIn = () => {
    console.log("Microsoft Sign In Triggered");
    // Add logic here
  };

  return (
    <div className="min-h-screen bg-[#06060c] flex flex-col items-center justify-center px-4 font-sans selection:bg-purple-500/30">
      
      {/* Background Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-100 flex flex-col items-center">
        
        {/* Logo / Branding */}
        <div className="mb-10 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-linear-to-tr from-purple-600 to-blue-500 p-0.5 shadow-2xl shadow-purple-500/20 mb-4">
            <div className="w-full h-full bg-[#06060c] rounded-[14px] flex items-center justify-center">
               <img 
                src="https://zeroinfinitytechnologies.com/images/logo-1771865164119.webp?t=1777117488383" 
                alt="Logo" 
                className="h-10 w-10 rounded-full"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-gray-500 mt-2">Log in to your Zero Infinity account</p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-4">
          <button 
            onClick={handleGoogleSignIn}
            className="group w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-200 text-sm font-semibold text-white shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Continue with Google
          </button>

          <button 
            onClick={handleMicrosoftSignIn}
            className="group w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-200 text-sm font-semibold text-white shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 21 21" className="group-hover:scale-110 transition-transform">
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7fbb00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
              <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
            Continue with Microsoft
          </button>
        </div>

        {/* Footer Text */}
        <p className="mt-10 text-sm text-gray-500">
          Don't have an account? 
          <a href="/signup" className="ml-1 text-purple-400 font-semibold hover:text-purple-300 transition-colors">Sign up</a>
        </p>
      </div>

      {/* Bottom Links */}
      <div className="mt-auto pb-8 flex gap-6 text-[11px] uppercase tracking-widest text-gray-600 font-bold">
        <a href="#" className="hover:text-purple-400 transition-colors">Terms of use</a>
        <span className="text-white/5">|</span>
        <a href="#" className="hover:text-purple-400 transition-colors">Privacy policy</a>
      </div>
    </div>
  );
};

export default SignIn;