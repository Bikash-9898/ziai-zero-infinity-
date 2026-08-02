import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Home from './pages/home';
// import SignIn from './pages/signin';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import ChatPage from './pages/ChatPage';
import ImagePage from './pages/ImagePage';
import LibraryPage from './pages/LibraryPage';
import GuestPage from './pages/GuestPage';

import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import GuestGate from './components/GuestGate';

import Dashboard from './pages/BillingDashboard';
import BillingPage from './pages/BillingPage';
import UsageStats from './pages/UsageStats';
import PlansPage from './pages/PlansPage';
import ClientSettings from './components/ClientSettings/ClientSettings';


function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  );
}


const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* Standalone guest chat landing — minimal sidebar promoting sign-up.
          /client/chat (via GuestGate) remains the full-app guest experience;
          this is a lighter-weight entry point (e.g. from a "Continue as
          Guest" CTA) that shares the exact same guest session/token. */}
      <Route path="/guest" element={<GuestPage />} />
      {/* <Route path="/admin" element={<AdminDashboard />} /> */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

      {/* ClientDashboard is the shell — nested routes render via <Outlet /> */}
      <Route path="/client" element={<ClientDashboard />}>
        {/* Default redirect: /client → /client/chat */}
        <Route index element={<Navigate to="chat" replace />} />

        {/* Chat works without sign-in — GuestGate auto-provisions a guest
            session (small trial, admin-restricted model) if nobody's logged in. */}
        <Route path="chat" element={<GuestGate><ChatPage /></GuestGate>} />

        {/* Everything else under /client still requires a real account */}
        <Route element={<ProtectedLayout />}>
          <Route path="image"    element={<ImagePage />} />
          <Route path="library"  element={<LibraryPage />} />
          <Route path="settings" element={<ClientSettings />} />
        </Route>
      </Route>

      <Route element={<ProtectedLayout />}>
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/billingDashboard" element={<Dashboard />} />
        <Route path="/usage" element={<UsageStats />} />
        <Route path="/plans" element={<PlansPage />} />
      </Route>
    </Routes> 
  );
};

export default App;