import { Routes, Route } from 'react-router-dom';
import Home from './pages/home';
// import SignIn from './pages/signin';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
// import UsageStats from './pages/UsageStats';
// import Dashboard from './pages/Dashboard';
import BillingPage from './pages/BillingPage';


const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<AdminDashboard />} />
      {/* <Route path="/admin/Billing_dashboard" element={<Dashboard />} />
      <Route path="/admin/usage" element={<UsageStats />} /> */}
      {/* <Route path="/signin" element={<SignIn />} /> */}
      {/* Ensure the path matches the "to" prop in your Link */}
      {/* <Route path="/client" element={<ClientDashboard />} /> */}
      <Route 
          path="/client" 
          element={
            <ProtectedRoute>
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
      <Route 
          path="/billing" 
          element={
            <ProtectedRoute>
              <BillingPage />
            </ProtectedRoute>
          }
        />
    </Routes>
  );
};

export default App;