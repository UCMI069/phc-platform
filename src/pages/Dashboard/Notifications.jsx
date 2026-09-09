import React, { useEffect, useState } from 'react';
import { neon as supabase } from '../../lib/neon';
import { useNotification } from '../../context/NotificationContext';
import { 
  Bell, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import './Notifications.css';

const Notifications = () => {
  const { addNotification } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNotifications(notifications.filter(n => n.id !== id));
      addNotification("Notification deleted", "success");
    } catch (error) {
      addNotification('Error deleting notification: ' + error.message, 'error');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft className="text-success" />;
      case 'debit': return <ArrowUpRight className="text-danger" />;
      case 'alert': return <AlertCircle className="text-warning" />;
      case 'ping': return <Bell className="text-warning" />;
      case 'upgrade': return <CheckCircle2 className="text-success" />;
      default: return <Bell className="text-primary" />;
    }
  };

  if (loading) return <div className="loading-spinner">Loading messages...</div>;

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <div className="header-title">
          <Bell size={24} />
          <h2>Your Notifications</h2>
        </div>
        <p>Stay updated with your account activity and bank alerts.</p>
      </div>

      <div className="notifications-list">
        {notifications.map((n) => (
          <div 
            key={n.id} 
            className={`notification-item ${n.is_read ? 'read' : 'unread'}`}
            onClick={() => !n.is_read && markAsRead(n.id)}
          >
            <div className="notification-icon">
              {getIcon(n.type)}
            </div>
            <div className="notification-content">
              <div className="notification-top">
                <h3>{n.title} {!n.is_read && <span className="unread-dot"></span>}</h3>
                <span className="notification-time">
                  <Clock size={12} />
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
              </div>
              <p>{n.message}</p>
              {!n.is_read && (
                <button className="mark-read-btn" onClick={(e) => {
                  e.stopPropagation();
                  markAsRead(n.id);
                }}>Mark as Read</button>
              )}
            </div>
            <button 
              className="delete-notification-btn"
              onClick={(e) => {
                e.stopPropagation();
                deleteNotification(n.id);
              }}
              title="Delete message"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="empty-notifications">
            <div className="empty-icon-circle">
              <Bell size={40} />
            </div>
            <h3>No notifications yet</h3>
            <p>We'll let you know when something important happens with your account.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
