// src/components/AuthModal.jsx
/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { loginUser, registerUser } from '../services/api';

export default function AuthModal({ isOpen, onClose, initialView = 'login', onAuthSuccess }) {
  const [view, setView] = useState(initialView);
  const [formData, setFormData] = useState({
    identifier: '',
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sincronizar el estado interno de la vista con la prop initialView cada vez que se abra el modal
  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setError('');
      setSuccess('');
    }
  }, [isOpen, initialView]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación de longitud mínima para registro (exigida por el backend)
    if (view === 'register' && formData.password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.');
        return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (view === 'login') {
        const credentials = {
          identifier: formData.identifier,
          password: formData.password
        };
        const response = await loginUser(credentials);
        setSuccess('¡Inicio de sesión exitoso!');
        if (response.token) localStorage.setItem('re-token', response.token);
        setTimeout(() => {
          onAuthSuccess(response.user || { username: formData.identifier });
        }, 1000);
      } else {
        // FLUJO DE REGISTRO
        const userData = {
          username: formData.username,
          email: formData.email,
          password: formData.password
        };
        
        // 1. Registramos al usuario
        await registerUser(userData);
        setSuccess('¡Registro completado! Iniciando sesión automáticamente...');
        
        // 2. Realizamos LOGIN automático con los mismos datos
        const loginCredentials = {
          identifier: formData.username, // Usamos el username recién registrado
          password: formData.password
        };
        
        const loginResponse = await loginUser(loginCredentials);
        
        if (loginResponse.token) localStorage.setItem('re-token', loginResponse.token);
        
        setTimeout(() => {
          onAuthSuccess(loginResponse.user || { username: formData.username });
        }, 1000);
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-background border border-white/10 shadow-2xl transition-all scale-100">
        
        <div className="bg-re-rojo p-8 text-center text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="text-8xl font-black italic select-none">RELISIADOS</span>
             </div>
             <h2 className="text-3xl font-black tracking-tighter mb-1 relative z-10">
                {view === 'login' ? 'INICIAR SESIÓN' : 'ÚNETE AL CLUB'}
             </h2>
             <p className="text-xs font-bold text-white/80 tracking-widest uppercase relative z-10">
                Real Lisiados F.C. Official WebApp
             </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {view === 'register' && (
              <div key="reg-username">
                <label htmlFor="reg-username-input" className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Username (mín. 3 carac.)</label>
                <input 
                  id="reg-username-input"
                  type="text" 
                  name="username"
                  autoComplete="username"
                  minLength={3}
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-muted/50 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-re-rojo/50 transition-all font-bold text-foreground"
                  placeholder="Tu nombre de usuario"
                />
              </div>
            )}

            <div key={view === 'login' ? 'login-id' : 'reg-email'}>
              <label htmlFor="auth-identifier" className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                {view === 'login' ? 'Username o Email' : 'Email Oficial'}
              </label>
              <input 
                id="auth-identifier"
                type={view === 'login' ? 'text' : 'email'} 
                name={view === 'login' ? 'identifier' : 'email'}
                autoComplete={view === 'login' ? 'username' : 'email'}
                required
                value={view === 'login' ? formData.identifier : formData.email}
                onChange={handleChange}
                className="w-full bg-muted/50 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-re-rojo/50 transition-all font-bold text-foreground"
                placeholder={view === 'login' ? "usuario o correo" : "tu@ejemplo.com"}
              />
            </div>

            <div key="auth-password">
              <label htmlFor="auth-password-input" className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                Contraseña {view === 'register' && '(mín. 8 carac.)'}
              </label>
              <input 
                id="auth-password-input"
                type="password" 
                name="password"
                autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                minLength={view === 'register' ? 8 : 1}
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-muted/50 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-re-rojo/50 transition-all font-bold text-foreground"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-[11px] font-bold p-3 rounded-lg text-center shadow-inner">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-500 text-[11px] font-bold p-3 rounded-lg text-center shadow-inner">
                {success}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-re-rojo hover:bg-re-rojo/90 text-white font-black py-4 rounded-xl shadow-lg shadow-re-rojo/20 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'PROCESANDO...' : (view === 'login' ? 'ENTRAR' : 'REGISTRARME')}
            </button>
          </form>

          <div className="mt-8 text-center" key="auth-toggle-container">
            <p className="text-xs text-muted-foreground font-bold">
              {view === 'login' ? '¿Aún no eres del club?' : '¿Ya tienes cuenta?'}
              <button 
                type="button"
                onClick={() => {
                  setView(view === 'login' ? 'register' : 'login');
                  setError('');
                }}
                className="ml-2 text-re-rojo hover:underline font-black uppercase tracking-tighter"
              >
                {view === 'login' ? 'REGÍSTRATE AQUÍ' : 'INICIAR SESIÓN'}
              </button>
            </p>
          </div>
        </div>

        <button 
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          aria-label="Cerrar modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
