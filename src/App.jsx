import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Header from './components/Header';
import Footer from './components/Footer';
import DashboardLayout from './components/DashboardLayout';
import TawkChat from './components/TawkChat';

const Loading = () => <div style={{ padding: '4rem', textAlign: 'center', color: '#4a5568' }}>Loading...</div>;

// Public Pages — lazy loaded
const Home = lazy(() => import('./pages/Home'));
const Premier = lazy(() => import('./pages/Premier'));
const Personal = lazy(() => import('./pages/Personal'));
const Private = lazy(() => import('./pages/Private'));
const Business = lazy(() => import('./pages/Business'));
const Corporates = lazy(() => import('./pages/Corporates'));
const Group = lazy(() => import('./pages/Group'));
const Products = lazy(() => import('./pages/Products'));
const Help = lazy(() => import('./pages/Help'));
const Money = lazy(() => import('./pages/Money'));
const Banking = lazy(() => import('./pages/Banking'));
const Security = lazy(() => import('./pages/Security'));
const Climate = lazy(() => import('./pages/Climate'));
const Insights = lazy(() => import('./pages/Insights'));
const About = lazy(() => import('./pages/About'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Accessibility = lazy(() => import('./pages/Accessibility'));
const SiteMap = lazy(() => import('./pages/SiteMap'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Dashboard Pages — lazy loaded
const Overview = lazy(() => import('./pages/Dashboard/Overview'));
const Transactions = lazy(() => import('./pages/Dashboard/Transactions'));
const Transfer = lazy(() => import('./pages/Dashboard/Transfer'));
const Deposit = lazy(() => import('./pages/Dashboard/Deposit'));
const Settings = lazy(() => import('./pages/Dashboard/Settings'));
const Loan = lazy(() => import('./pages/Dashboard/Loan'));
const Support = lazy(() => import('./pages/Dashboard/Support'));
const Notifications = lazy(() => import('./pages/Dashboard/Notifications'));
const Upgrade = lazy(() => import('./pages/Dashboard/Upgrade'));

// Admin Pages — lazy loaded
const Admin = lazy(() => import('./pages/Admin/Admin'));

const DashboardRoutes = () => (
  <DashboardLayout>
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/cards" element={<div>Cards Page (Coming Soon)</div>} />
        <Route path="/withdraw" element={<Transfer />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/loans" element={<Loan />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/support" element={<Support />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </Suspense>
  </DashboardLayout>
);

function App() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');

  return (
    <AuthProvider>
      <NotificationProvider>
        <div className="app-wrapper">
          {!isDashboard && <Header />}
          <Suspense fallback={<Loading />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/premier" element={<Premier />} />
              <Route path="/personal" element={<Personal />} />
              <Route path="/private" element={<Private />} />
              <Route path="/business" element={<Business />} />
              <Route path="/corporates" element={<Corporates />} />
              <Route path="/group" element={<Group />} />
              <Route path="/products" element={<Products />} />
              <Route path="/help" element={<Help />} />
              <Route path="/money" element={<Money />} />
              <Route path="/banking" element={<Banking />} />
              <Route path="/security" element={<Security />} />
              <Route path="/climate" element={<Climate />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/accessibility" element={<Accessibility />} />
              <Route path="/site-map" element={<SiteMap />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Dashboard Routes */}
              <Route path="/dashboard/*" element={<DashboardRoutes />} />
              
              {/* Admin Routes */}
              <Route path="/admin/*" element={
                <DashboardLayout>
                  <Suspense fallback={<Loading />}>
                    <Routes>
                      <Route path="/" element={<Admin />} />
                    </Routes>
                  </Suspense>
                </DashboardLayout>
              } />
            </Routes>
          </Suspense>
          {!isDashboard && <Footer />}
          <TawkChat />
        </div>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
