import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../Components/Toast/Toast';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      message,
      type,
      duration,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration + 300); // Add extra time for fade-out animation

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccessToast = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
  const showErrorToast = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
  const showWarningToast = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);
  const showInfoToast = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);

  const value = {
    addToast,
    removeToast,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
