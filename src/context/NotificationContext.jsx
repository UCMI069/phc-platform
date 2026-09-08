import React, { createContext, useContext, useState, useCallback } from 'react';
import './Notification.css';
import { CheckCircle2, AlertCircle, Info, X, HelpCircle } from 'lucide-react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);

    if (duration) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const confirm = useCallback((config) => {
    return new Promise((resolve) => {
      setConfirmConfig({
        ...config,
        resolve: (value) => {
          setConfirmConfig(null);
          resolve(value);
        }
      });
    });
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification, confirm }}>
      {children}
      
      {/* Toast Notifications */}
      <div className="notification-container">
        {notifications.map((notification) => (
          <div key={notification.id} className={`notification-toast ${notification.type}`}>
            <div className="notification-icon">
              {notification.type === 'success' && <CheckCircle2 size={20} />}
              {notification.type === 'error' && <AlertCircle size={20} />}
              {notification.type === 'info' && <Info size={20} />}
            </div>
            <div className="notification-content">{notification.message}</div>
            <button className="notification-close" onClick={() => removeNotification(notification.id)}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmConfig && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <div className="confirm-icon">
                <HelpCircle size={24} />
              </div>
              <h3>{confirmConfig.title || 'Confirm Action'}</h3>
            </div>
            <div className="confirm-modal-body">
              <p>{confirmConfig.message}</p>
            </div>
            <div className="confirm-modal-footer">
              <button 
                className="confirm-btn-cancel" 
                onClick={() => confirmConfig.resolve(false)}
              >
                {confirmConfig.cancelText || 'Cancel'}
              </button>
              <button 
                className={`confirm-btn-action ${confirmConfig.danger ? 'danger' : 'primary'}`}
                onClick={() => confirmConfig.resolve(true)}
              >
                {confirmConfig.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
