import { Routes, Route, Outlet } from 'react-router-dom';
import Home from './pages/home';
// import SignIn from './pages/signin';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

import Dashboard from './pages/BillingDashboard';
import BillingPage from './pages/BillingPage';
import UsageStats from './pages/UsageStats';
import PlansPage from './pages/PlansPage';

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
      <Route path="/admin" element={<AdminDashboard />} />
  
      <Route element={<ProtectedLayout />}>
        <Route path="/client" element={<ClientDashboard />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/billingDashboard" element={<Dashboard />} />
        <Route path="/usage" element={<UsageStats />} />
        <Route path="/plans" element={<PlansPage />} />
      </Route>

      {/* <Route 
          path="/client" 
          element={
            <ProtectedRoute>
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
      <Route path="/billing" element={
            <ProtectedRoute>
              <BillingPage />
            </ProtectedRoute>
          }
        />
        <Route path="/billingDashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/usage" element={
            <ProtectedRoute>
              <UsageStats />
            </ProtectedRoute>
          }
        />
        <Route path="/plans" element={
            <ProtectedRoute>
              <PlansPage />
            </ProtectedRoute>
          }
        />*/}
    </Routes> 
  );
};

export default App;