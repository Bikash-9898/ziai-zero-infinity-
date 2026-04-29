import { Routes, Route } from 'react-router-dom';
import Home from './pages/home';
// import SignIn from './pages/signin';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';


const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<AdminDashboard />} />
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
    </Routes>
  );
};

export default App;