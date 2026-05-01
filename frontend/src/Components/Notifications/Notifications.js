import React, { useState, useEffect } from 'react';
import { getUserNotifications, markNotificationAsRead } from '../../services/apiClient';
import './Notifications.css';

const Notifications = ({ userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const fetchNotifications = async () => {
      try {
        const data = await getUserNotifications(userId);
        setNotifications(Array.isArray(data) ? data : []);
        const unread = Array.isArray(data) ? data.filter(n => !n.read).length : 0;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const requestBrowserNotificationPermission = async () => {
    if ('Notification' in window && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const showBrowserNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  return (
    <div className="notifications-container">
      <button 
        className="notifications-toggle" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="notification-icon">🔔</span>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={() => {
                  notifications.filter(n => !n.read).forEach(n => {
                    handleMarkAsRead(n._id);
                  });
                }}
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <p className="no-notifications">No notifications yet</p>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification._id} 
                  className={`notification-item ${!notification.read ? 'unread' : 'read'}`}
                  onClick={() => handleMarkAsRead(notification._id)}
                >
                  <div className="notification-content">
                    <div className="notification-type">
                      {notification.type === 'order_success' && '📦'}
                      {notification.type === 'order_cancelled' && '❌'}
                      {notification.type === 'order_delivered' && '✅'}
                      {notification.type === 'general' && '📢'}
                    </div>
                    <div className="notification-text">
                      <p>{notification.message}</p>
                      <small className="notification-time">
                        {new Date(notification.createdAt).toLocaleString()}
                      </small>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
