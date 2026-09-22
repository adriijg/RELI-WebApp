/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('re-theme') || 'light');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('re-user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState('login');
  const inactivityTimerRef = useRef(null);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('re-user');
    localStorage.removeItem('re-token');
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (user) {
      inactivityTimerRef.current = setTimeout(() => {
        handleLogout();
        alert('Tu sesión ha expirado por inactividad (10 minutos).');
      }, 10 * 60 * 1000);
    }
  }, [user, handleLogout]);

  useEffect(() => {
    localStorage.setItem('re-theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');

    if (user) {
      const events = ['mousemove', 'keydown', 'scroll', 'click'];
      events.forEach((event) => window.addEventListener(event, resetInactivityTimer));
      resetInactivityTimer();
      return () => {
        events.forEach((event) => window.removeEventListener(event, resetInactivityTimer));
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      };
    }
  }, [theme, user, resetInactivityTimer]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const openAuth = (view = 'login') => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  };

  const closeAuth = () => setIsAuthModalOpen(false);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('re-user', JSON.stringify(userData));
    setIsAuthModalOpen(false);
  };

  const isAdmin = user?.role === 'ROLE_ADMIN';

  const value = {
    theme,
    toggleTheme,
    user,
    isAdmin,
    isAuthModalOpen,
    authModalView,
    openAuth,
    closeAuth,
    handleAuthSuccess,
    handleLogout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider');
  return ctx;
}
