// src/App.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import HeroMatch from './components/HeroMatch';
import NewsSection from './components/NewsSection';
import MatchesCarousel from './components/MatchesCarousel';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';

function App() {
  // Estado local para el tema, persistido en localStorage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('re-theme') || 'light';
  });

  // Estado para el Usuario (Null si no está logueado)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('re-user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Estado para el Modal de Autenticación
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState('login'); 

  // Referencia para el temporizador de inactividad
  const inactivityTimerRef = useRef(null);

  // Función para cerrar sesión
  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('re-user');
    localStorage.removeItem('re-token'); // Limpia también el token si existe
    console.log("Sesión cerrada por inactividad o cierre manual.");
  }, []);

  // Función para reiniciar el temporizador de inactividad (10 minutos)
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    
    // Si el usuario está logueado, activamos el timer
    if (user) {
      inactivityTimerRef.current = setTimeout(() => {
        handleLogout();
        alert("Tu sesión ha expirado por inactividad (10 minutos).");
      }, 10 * 60 * 1000); // 10 minutos en ms
    }
  }, [user, handleLogout]);

  // Manejo del tema y listeners de actividad
  useEffect(() => {
    localStorage.setItem('re-theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Si hay usuario, escuchamos eventos para resetear el timer de inactividad
    if (user) {
      const events = ['mousemove', 'keydown', 'scroll', 'click'];
      events.forEach(event => window.addEventListener(event, resetInactivityTimer));
      resetInactivityTimer(); // Inicio inicial del timer

      return () => {
        events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      };
    }
  }, [theme, user, resetInactivityTimer]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const openAuthModal = (view) => {
    setAuthModalView(view);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('re-user', JSON.stringify(userData));
    setIsAuthModalOpen(false);
  };

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} min-h-screen bg-background text-foreground font-sans transition-colors duration-300`}>
      <Navbar 
        theme={theme} 
        user={user}
        onToggleTheme={toggleTheme} 
        onOpenAuth={(view) => openAuthModal(view)} 
        onLogout={handleLogout}
      />
      
      <main className="max-w-7xl mx-auto p-6 space-y-20">        
        <HeroMatch />
        <NewsSection /> 
        <MatchesCarousel/>
      </main>

      <Footer />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialView={authModalView}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default App;