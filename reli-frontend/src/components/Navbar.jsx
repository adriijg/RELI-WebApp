// src/components/Navbar.jsx
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/reli-badge.png';
import ThemeToggle from './ThemeToggle';

export default function Navbar({ theme, user, isAdmin, onToggleTheme, onOpenAuth, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const menuOpenRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const navLinks = [
    { label: 'INICIO', path: '/' },
    { label: 'JUGADORES', path: '/jugadores' },
    { label: 'COMPETICIÓN', path: '/competicion' },
    { label: 'HISTORIA', path: '/historia' },
    { label: 'NOTICIAS', path: '/noticias' },
    { label: 'CALENDARIO', path: '/calendario' },
  ];

  useEffect(() => {
    menuOpenRef.current = isMenuOpen;
    if (isMenuOpen) setVisible(true);
  }, [isMenuOpen]);

  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const isMobile = window.innerWidth < 1280;
      if (!isMobile || menuOpenRef.current) {
        setVisible(true);
        lastY.current = y;
        return;
      }
      if (y < 80) {
        setVisible(true);
      } else if (y > lastY.current + 4) {
        setVisible(false);
      } else if (y < lastY.current - 4) {
        setVisible(true);
      }
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    setVisible(true);
    lastY.current = window.scrollY;
  }, [location.pathname]);

  return (
    <nav className={`sticky top-0 z-50 bg-re-rojo shadow-[0_10px_30px_rgba(226,29,44,0.4)] border-b border-white/10 py-3 px-4 md:px-6 transition-transform duration-300 ${visible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* IZQUIERDA: Hamburguesa y Logo */}
        <div className="flex items-center gap-2 md:gap-4 lg:flex-1">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="xl:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors z-50"
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

          <Link to="/" className="flex items-center gap-3 group cursor-pointer transition-transform hover:scale-[1.02]">
            <img
              src={logo}
              alt="Real Lisiados F.C."
              className="h-10 md:h-14 w-auto drop-shadow-[0_2px_10px_rgba(255,255,255,0.3)] transition-all group-hover:rotate-6"
            />
            <div className="hidden sm:flex flex-col text-white font-sans uppercase text-left">
              <span className="text-lg md:text-xl font-black tracking-tighter leading-none">REAL LISIADOS</span>
              <span className="text-[10px] md:text-xs font-black text-white/70 leading-none tracking-widest mt-1">F.C.</span>
            </div>
          </Link>
        </div>

        {/* CENTRO: Enlaces (Escritorio XL+) */}
        <div className="hidden xl:flex items-center gap-6 2xl:gap-8 justify-center flex-1">
          {navLinks.map((link) => {
            const isActive = link.path === '/' ? location.pathname === '/' : location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.label}
                to={link.path}
                className={`font-black text-[11px] tracking-[0.2em] transition-all duration-300 relative group py-2
                  ${isActive ? 'text-white' : 'text-white/70 hover:text-white'}`}
              >
                {link.label}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-300
                  ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}
                />
              </Link>
            );
          })}
        </div>

        {/* DERECHA: Acciones de Usuario */}
        <div className="flex items-center gap-2 md:gap-4 lg:flex-1 justify-end">

          <div className="hidden xl:flex items-center">
            {user ? (
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-2 py-1.5 shadow-inner backdrop-blur-sm">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/80">{user.username || user.email}</span>
                    {isAdmin && (
                      <button
                        onClick={() => navigate('/admin')}
                        className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-white/10"
                      >
                        Admin
                      </button>
                    )}
                    <button onClick={onLogout} className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-white/10">Cerrar</button>
                </div>
            ) : (
                <button onClick={() => onOpenAuth('login')} className="bg-white text-re-rojo font-black px-5 py-2 rounded-lg text-[11px] tracking-widest shadow-xl hover:scale-105 transition-transform uppercase whitespace-nowrap">ENTRAR</button>
            )}
          </div>

          <ThemeToggle
            theme={theme}
            onToggle={onToggleTheme}
            className="text-white border-white/20 hover:bg-white/10"
          />
        </div>

        {/* MENÚ MÓVIL (Overlay) */}
        {isMenuOpen && (
          <div className="fixed top-[64px] md:top-[80px] left-0 w-full bg-re-rojo border-t border-white/10 xl:hidden py-10 px-6 shadow-2xl flex flex-col gap-6 items-center slide-down h-screen z-40 bg-gradient-to-b from-re-rojo to-black/90 overflow-y-auto">
            {navLinks.map((link) => {
              const isActive = link.path === '/' ? location.pathname === '/' : location.pathname.startsWith(link.path);
              return (
                <Link key={link.label} to={link.path} onClick={() => setIsMenuOpen(false)} className={`text-3xl font-black italic tracking-tighter transition-colors uppercase ${isActive ? 'text-white' : 'text-white/60 hover:text-white'}`}>{link.label}</Link>
              );
            })}

             <hr className="w-full border-white/10 my-4" />

             {user ? (
                 <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                    <p className="text-white/60 font-bold uppercase tracking-widest text-xs">Hola, {user.username}</p>
                    {isAdmin && (
                      <button
                        onClick={() => { setIsMenuOpen(false); navigate('/admin'); }}
                        className="w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-white/10"
                      >
                        Admin
                      </button>
                    )}
                    <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="w-full rounded-2xl border border-white/15 bg-white/5 py-3 text-sm font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-white/10">Cerrar sesión</button>
                 </div>
              ) : (
                  <div className="flex flex-col w-full gap-4 max-w-sm">
                     <button onClick={() => { onOpenAuth('login'); setIsMenuOpen(false); }} className="w-full bg-white text-re-rojo font-black py-4 rounded-2xl tracking-widest text-sm shadow-xl uppercase">ENTRAR</button>
                  </div>
              )}
          </div>
        )}
      </div>
    </nav>
  );
}
