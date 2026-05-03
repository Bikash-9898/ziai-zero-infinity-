// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import './index.css'
import App from './App.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';



createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId="201164829072-ge4gi27vgbb9jaaava23ob0kbu9nc0cb.apps.googleusercontent.com">
        <AuthProvider>
          <App />
        </AuthProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  // </StrictMode>
)
