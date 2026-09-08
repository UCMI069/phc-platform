import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Header from './components/Header';
import Footer from './components/Footer';
import DashboardLayout from './components/DashboardLayout';
import TawkChat from './components/TawkChat';

// Public Pages
import Home from './pages/Home';
import Premier from './pages/Premier';
import Personal from './pages/Personal';
import Private from './pages/Private';
import Business from './pages/Business';
import Corporates from './pages/Corporates';
import Group from './pages/Group';
import Products from './pages/Products';
import Help from './pages/Help';
import Money from './pages/Money';
import Banking from './pages/Banking';
import Security from './pages/Security';
import Climate from './pages/Climate';
import Insights from './pages/Insights';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Dashboard Pages
import Overview from './pages/Dashboard/Overview';
import Transactions from './pages/Dashboard/Transactions';
import Transfer from './pages/Dashboard/Transfer';
import Deposit from './pages/Dashboard/Deposit';
import Settings from './pages/Dashboard/Settings';
import Loan from './pages/Dashboard/Loan';
import Support from './pages/Dashboard/Support';
import Notifications from './pages/Dashboard/Notifications';
import Upgrade from './pages/Dashboard/Upgrade';

// Admin Pages
import Admin from './pages/Admin/Admin';

const DashboardRoutes = () => (
  <DashboardLayout>
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
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Dashboard Routes */}
            <Route path="/dashboard/*" element={<DashboardRoutes />} />
            
            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={<Admin />} />
                </Routes>
              </DashboardLayout>
            } />
          </Routes>
          {!isDashboard && <Footer />}
          <TawkChat />
        </div>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
