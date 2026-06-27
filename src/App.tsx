import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './screens/LandingPage';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import AdminLoginScreen from './screens/admin/AdminLoginScreen';
import HospitalDashboard from './screens/hospital/HospitalDashboard';
import SubAdminDashboard from './screens/admin/sub_dist/SubAdminDashboard';
import DistAdminDashboard from './screens/admin/dist_state/DistAdminDashboard';
import SuperAdminDashboard from './screens/admin/super/SuperAdminDashboard';
import CertificateView from './screens/CertificateView';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" />; // Redirect if role mismatch
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/admin/login" element={<AdminLoginScreen />} />
          <Route path="/certificate/:applicationId" element={<CertificateView />} />
          
          {/* Hospital Routes */}
          <Route path="/hospital/*" element={
            <ProtectedRoute allowedRoles={['hospital']}>
              <HospitalDashboard />
            </ProtectedRoute>
          } />

          {/* Sub-District Admin Routes */}
          <Route path="/admin/sub/*" element={
            <ProtectedRoute allowedRoles={['sub_admin']}>
              <SubAdminDashboard />
            </ProtectedRoute>
          } />

          {/* District/State Admin Routes */}
          <Route path="/admin/dist/*" element={
            <ProtectedRoute allowedRoles={['dist_admin']}>
              <DistAdminDashboard />
            </ProtectedRoute>
          } />

          {/* Super Admin Routes */}
          <Route path="/admin/super/*" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
