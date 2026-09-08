import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  History, 
  CreditCard, 
  Gavel, 
  Send, 
  ArrowDownCircle, 
  Wallet, 
  Settings, 
  LifeBuoy, 
  ShieldCheck,
  Crown,
  Menu,
  X,
  LogOut,
  User,
  Home as HomeIcon,
  Bell
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/gcu-logo.png';
import './DashboardLayout.css';

const SIDEBAR_LINKS = [
  { 
    group: 'MAIN', 
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Home Page', href: '/', icon: HomeIcon },
      { name: 'Transactions', href: '/dashboard/transactions', icon: History },
    ]
  },
  { 
    group: 'TRANSFERS', 
    items: [
      { name: 'Transfer', href: '/dashboard/withdraw', icon: Send },
      { name: 'Deposit', href: '/dashboard/deposit', icon: ArrowDownCircle },
    ]
  },
  { 
    group: 'SERVICES', 
    items: [
      { name: 'Loans', href: '/dashboard/loans', icon: Wallet },
      { name: 'Account Upgrade', href: '/dashboard/upgrade', icon: Crown },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      { name: 'Support', href: '/dashboard/support', icon: LifeBuoy },
    ]
  }
];

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchProfile();
    fetchUnreadCount();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications_changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      if (!user) return;

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      if (!user) return;

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profileData?.blocked) {
        await signOut();
        navigate('/login');
        return;
      }

      if (profileData) setProfile(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src={logo} alt="PHC Logo" className="sidebar-logo" />
          <button className="close-sidebar" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {SIDEBAR_LINKS.map((group) => (
            <div key={group.group} className="nav-group">
              <h3>{group.group}</h3>
              <ul>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link 
                        to={item.href} 
                        className={isActive ? 'active' : ''}
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        <Icon size={20} />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
                {/* Admin Link - Only for Admins */}
                {group.group === 'MAIN' && profile?.is_admin && (
                  <li>
                    <Link 
                      to="/admin" 
                      className={location.pathname === '/admin' ? 'active admin-link' : 'admin-link'}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <ShieldCheck size={20} />
                      <span>Admin Panel</span>
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Mobile Header - Inside main for correct alignment */}
        <header className="mobile-dashboard-header">
          <div className="header-left">
            <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <img src={logo} alt="PHC Logo" className="mobile-logo" />
          </div>
          <div className="header-actions">
            <Link to="/dashboard/notifications" className="notification-bell">
              <Bell size={22} />
              {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
            </Link>
          </div>
        </header>

        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
