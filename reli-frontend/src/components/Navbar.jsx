// src/components/Navbar.jsx
/* eslint-disable react/prop-types */
import { useState } from 'react';
import logo from '../assets/reli-badge.png';

export default function Navbar({ theme, user, onToggleTheme, onOpenAuth, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navLinks = ["INICIO", "JUGADORES", "COMPETICIÓN", "HISTORIA", "NOTICIAS"];

  return (
    <nav className="sticky top-0 z-50 bg-re-rojo shadow-[0_10px_30px_rgba(226,29,44,0.4)] border-b border-white/10 py-3 px-4 md:px-6 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between relative">
        
        {/* BOTÓN HAMBURGUESA (Móvil - Izquierda) */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors z-50"
          aria-label="Abrir menú"
        >
          {isMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Logo y Nombre - Centrado en móvil si es necesario, o al lado de la hamburguesa */}
        <div className="flex items-center gap-3 group cursor-pointer transition-transform hover:scale-[1.02] flex-1 lg:flex-none">
          <img 
            src={logo} 
            alt="Real Lisiados F.C." 
            className="h-10 md:h-14 w-auto drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)] transition-all group-hover:rotate-6" 
          />
          <div className="hidden sm:flex flex-col text-white font-sans uppercase text-left">
            <span className="text-lg md:text-xl font-black tracking-tighter leading-none">REAL LISIADOS</span>
            <span className="text-[10px] md:text-xs font-black text-white/70 leading-none tracking-widest mt-1">F.C.</span>
          </div>
        </div>

        {/* Enlaces Centrales (Escritorio) */}
        <div className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link, index) => (
            <a 
              key={link} 
              href="#" 
              className={`font-black text-[11px] tracking-[0.2em] transition-all duration-300 relative group py-2 
                ${index === 0 ? 'text-white' : 'text-white/70 hover:text-white'}`}
            >
              {link}
              <span className={`absolute -bottom-1 left-0 h-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-300 
                ${index === 0 ? 'w-full' : 'w-0 group-hover:w-full'}`} 
              />
            </a>
          ))}
        </div>

        {/* Acciones de Usuario (Escritorio y Móvil) */}
        <div className="flex items-center gap-2 md:gap-4">
          
          <div className="hidden lg:flex items-center">
            {user ? (
                <div className="flex items-center gap-4 bg-black/10 rounded-full px-4 py-1.5 border border-white/5 shadow-inner">
                    <span className="text-[11px] font-black text-white uppercase tracking-tighter">{user.username || user.email}</span>
                    <button onClick={onLogout} className="bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] tracking-widest px-3 py-1.5 rounded-lg border border-white/10">CERRAR SESIÓN</button>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <button onClick={() => onOpenAuth('login')} className="text-white hover:text-slate-200 font-bold text-[11px] tracking-widest px-2 py-2 uppercase transition-all">INICIAR SESIÓN</button>
                    <button onClick={() => onOpenAuth('register')} className="bg-white text-re-rojo font-black px-5 py-2 rounded-lg text-[11px] tracking-widest shadow-xl hover:scale-105 transition-transform uppercase">REGISTRARSE</button>
                </div>
            )}
          </div>

          {/* Cambio de Tema */}
          <button 
            onClick={onToggleTheme}
            className="p-2 rounded-full hover:bg-white/10 transition-colors border border-white/20"
            aria-label="Cambiar tema"
          >
            {theme === 'light' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
        </div>

        {/* MENÚ MÓVIL (Overlay) */}
        {isMenuOpen && (
          <div className="absolute top-[100%] left-0 w-full bg-re-rojo border-t border-white/10 lg:hidden py-10 px-6 shadow-2xl flex flex-col gap-6 items-center slide-down h-screen z-40 bg-gradient-to-b from-re-rojo to-black/90">
             {navLinks.map((link) => (
                <a key={link} href="#" onClick={() => setIsMenuOpen(false)} className="text-3xl font-black italic tracking-tighter text-white hover:text-white/70 transition-colors uppercase">{link}</a>
             ))}
             
             <hr className="w-full border-white/10 my-4" />
             
             {user ? (
                 <div className="flex flex-col items-center gap-4">
                    <p className="text-white/60 font-bold uppercase tracking-widest text-xs">Hola, {user.username}</p>
                    <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="w-full bg-white text-re-rojo font-black py-4 px-12 rounded-2xl tracking-widest text-sm uppercase">CERRAR SESIÓN</button>
                 </div>
             ) : (
                 <div className="flex flex-col w-full gap-4">
                    <button onClick={() => { onOpenAuth('login'); setIsMenuOpen(false); }} className="w-full border-2 border-white text-white font-black py-4 rounded-2xl tracking-widest text-sm uppercase">INICIAR SESIÓN</button>
                    <button onClick={() => { onOpenAuth('register'); setIsMenuOpen(false); }} className="w-full bg-white text-re-rojo font-black py-4 rounded-2xl tracking-widest text-sm shadow-xl uppercase uppercase">REGISTRARSE</button>
                 </div>
             )}
          </div>
        )}
      </div>
    </nav>
  );
}