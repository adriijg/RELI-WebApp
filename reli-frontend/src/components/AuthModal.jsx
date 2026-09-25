// src/components/AuthModal.jsx
import { useState, useEffect, useRef } from 'react';
import { loginUser, registerUser, requestPasswordReset, resendVerification, googleLogin } from '../services/api';

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
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleScriptRef = useRef(false);
  const googleBtnRef = useRef(null);

  // Sincronizar el estado interno de la vista con la prop initialView cada vez que se abra el modal
  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setError('');
      setSuccess('');
      setShowPassword(false);
    }
  }, [isOpen, initialView]);

  useEffect(() => {
    if (!isOpen || googleScriptRef.current) return;
    googleScriptRef.current = true;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || view !== 'login') return;
    const initGoogle = () => {
      try {
        if (window.google && googleBtnRef.current) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: handleGoogleCredential,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          window.google.accounts.id.renderButton(
            googleBtnRef.current,
            { theme: 'outline', size: 'large', text: 'signin_with', shape: 'rectangular' }
          );
        }
      } catch (e) {
        console.error('Error inicializando Google Sign-In:', e);
      }
    };
    if (window.google) {
      initGoogle();
    } else {
      const handler = setInterval(() => {
        if (window.google) {
          clearInterval(handler);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(handler);
    }
  }, [isOpen, view]);

  const handleGoogleCredential = async (response) => {
    if (!response.credential) return;
    setGoogleLoading(true);
    setError('');
    try {
      const data = await googleLogin(response.credential);
      if (data.token) {
        localStorage.setItem('re-token', data.token);
        onAuthSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || 'Error en el inicio de sesión con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

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
      if (view === 'forgot') {
        await requestPasswordReset(formData.email);
        setSuccess('Si el correo existe, recibirás instrucciones para recuperar la contraseña.');
      } else if (view === 'login') {
        const credentials = {
          identifier: formData.identifier,
          password: formData.password
        };
        const response = await loginUser(credentials);
        if (response.token) localStorage.setItem('re-token', response.token);
        onAuthSuccess(response.user || { username: formData.identifier });
      } else {
        // FLUJO DE REGISTRO
        const userData = {
          username: formData.username,
          email: formData.email,
          password: formData.password
        };
        
        // 1. Registramos al usuario
        const registeredUser = await registerUser(userData);
        if (registeredUser?.emailVerified === false) {
          setSuccess('Registro completado. Revisa tu correo y confirma la cuenta antes de iniciar sesión.');
          return;
        }
        setSuccess('¡Registro completado! Iniciando sesión automáticamente...');
        
        // 2. Realizamos LOGIN automático con los mismos datos
        const loginCredentials = {
          identifier: formData.username, // Usamos el username recién registrado
          password: formData.password
        };
        
        const loginResponse = await loginUser(loginCredentials);
        
        if (loginResponse.token) localStorage.setItem('re-token', loginResponse.token);
        onAuthSuccess(loginResponse.user || { username: formData.username });
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
                {view === 'login' ? 'INICIAR SESIÓN' : view === 'forgot' ? 'RECUPERAR CONTRASEÑA' : 'ÚNETE AL CLUB'}
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

            {view !== 'forgot' && <div key="auth-password">
              <label htmlFor="auth-password-input" className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                Contraseña {view === 'register' && '(mín. 8 carac.)'}
              </label>
              <div className="relative">
                <input 
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                  minLength={view === 'register' ? 8 : 1}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-muted/50 border border-white/5 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-re-rojo/50 transition-all font-bold text-foreground"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-11 text-muted-foreground hover:text-re-rojo transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  tabIndex={0}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>}

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

            {view === 'register' && success && formData.email && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await resendVerification(formData.email);
                    setSuccess('Si la cuenta necesita confirmación, hemos reenviado el correo.');
                  } catch (err) {
                    setError(err.message || 'No se pudo reenviar el correo.');
                  }
                }}
                className="w-full text-[10px] font-black uppercase tracking-widest text-re-dorado hover:underline"
              >
                Reenviar correo de confirmación
              </button>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-re-rojo hover:bg-re-rojo/90 text-white font-black py-4 rounded-xl shadow-lg shadow-re-rojo/20 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'PROCESANDO...' : (view === 'login' ? 'ENTRAR' : view === 'forgot' ? 'ENVIAR ENLACE' : 'REGISTRARME')}
            </button>
          </form>

          {view === 'login' && (
            <div className="mt-6 space-y-4">
              <div ref={googleBtnRef} className="flex justify-center" />
              {googleLoading && (
                <div className="text-center text-xs font-bold text-re-dorado animate-pulse">Iniciando sesión con Google...</div>
              )}
            </div>
          )}

          <div className="mt-8 text-center" key="auth-toggle-container">
            <p className="text-xs text-muted-foreground font-bold">
              {view === 'forgot' ? '¿Recuerdas tu contraseña?' : view === 'login' ? '¿Aún no eres del club?' : '¿Ya tienes cuenta?'}
              <button 
                type="button"
                onClick={() => {
                  setView(view === 'forgot' ? 'login' : view === 'login' ? 'register' : 'login');
                  setError('');
                }}
                className="ml-2 text-re-rojo hover:underline font-black uppercase tracking-tighter"
              >
                {view === 'forgot' ? 'INICIAR SESIÓN' : view === 'login' ? 'REGÍSTRATE AQUÍ' : 'INICIAR SESIÓN'}
              </button>
            </p>
            {view === 'login' && (
              <button type="button" onClick={() => { setView('forgot'); setError(''); setSuccess(''); }} className="mt-3 text-xs font-black uppercase tracking-widest text-re-dorado hover:underline">
                He olvidado mi contraseña
              </button>
            )}
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
