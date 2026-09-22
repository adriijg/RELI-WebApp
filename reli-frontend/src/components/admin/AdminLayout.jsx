import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import logo from '../../assets/reli-badge.png';
import ThemeToggle from '../ThemeToggle';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: 'grid', end: true },
  { to: '/admin/partidos', label: 'Partidos', icon: 'ball' },
  { to: '/admin/noticias', label: 'Noticias', icon: 'news' },
  { to: '/admin/jugadores', label: 'Jugadores', icon: 'users' },
  { to: '/admin/temporadas', label: 'Temporadas', icon: 'calendar' },
  { to: '/admin/competiciones', label: 'Competiciones', icon: 'trophy' },
  { to: '/admin/estadisticas', label: 'Estadísticas', icon: 'chart' },
  { to: '/admin/usuarios', label: 'Usuarios', icon: 'shield' },
  { to: '/admin/sincronizacion', label: 'Sincronización', icon: 'sync' },
];

function Icon({ name, className = 'w-5 h-5' }) {
  const paths = {
    grid: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
    ball: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM9 8l-2 4h4l-1 4 4-6h-3l2-4-4 2z',
    news: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 4a2 2 0 012 2v6a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4a2 2 0 012-2h4zM7 8h6M7 12h6M7 16h4',
    users: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a3 3 0 11-3-3',
    calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    trophy: 'M12 15l-3-3h6l-3 3zm0 0v4m-5-4h10a1 1 0 001-1V6a4 4 0 00-4-4h-4a4 4 0 00-4 4v8a1 1 0 001 1zM7 21h10',
    chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    sync: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[name]} />
    </svg>
  );
}

export default function AdminLayout() {
  const { user, theme, toggleTheme, handleLogout, isAdmin } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card-depth rounded-3xl p-10 max-w-md text-center">
          <h1 className="text-3xl font-black italic text-re-rojo mb-3">403</h1>
          <p className="font-bold text-muted-foreground mb-6">No tienes permisos de administrador.</p>
          <Link to="/" className="inline-block bg-re-rojo text-white font-black px-6 py-3 rounded-xl text-xs tracking-widest uppercase hover:bg-re-rojo/90 transition-all">
            Volver a la web
          </Link>
        </div>
      </div>
    );
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <Link to="/" className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <img src={logo} alt="RELI" className="h-10 w-auto" />
        <div className="leading-none">
          <p className="font-black text-sm tracking-tighter text-white">PANEL ADMIN</p>
          <p className="text-[10px] font-bold text-re-dorado tracking-widest uppercase mt-1">Real Lisiados F.C.</p>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-black tracking-tight transition-all group ${
                isActive
                  ? 'bg-re-rojo text-white shadow-lg shadow-re-rojo/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon name={item.icon} className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="uppercase tracking-wider text-[11px]">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 text-[11px] font-black uppercase tracking-widest transition-all"
        >
          ← Ver la web
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-re-rojo hover:bg-re-rojo/10 text-[11px] font-black uppercase tracking-widest transition-all"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-re-azul-oscuro border-r border-white/5 fixed inset-y-0 left-0 z-30">
        {sidebar}
      </aside>

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-re-azul-oscuro shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className="flex-1 lg:pl-64 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-card-bg/90 backdrop-blur border-b border-card-border">
          <div className="flex items-center justify-between gap-4 px-4 md:px-8 py-4">
            <button
              className="lg:hidden p-2 rounded-lg border border-card-border hover:bg-muted/10 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="hidden lg:block">
              <p className="text-[10px] font-black uppercase tracking-widest text-re-rojo">Gestión del club</p>
              <p className="font-black text-sm tracking-tight text-muted-foreground">Central de administración</p>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle
                theme={theme}
                onToggle={toggleTheme}
                className="text-foreground border-card-border hover:bg-muted/10"
              />
              <div className="flex items-center gap-2 bg-re-rojo/10 border border-re-rojo/20 rounded-full pl-1.5 pr-4 py-1.5">
                <span className="w-7 h-7 rounded-full bg-re-rojo text-white font-black text-xs flex items-center justify-center">
                  {(user?.username || 'A').charAt(0).toUpperCase()}
                </span>
                <div className="leading-none hidden sm:block">
                  <p className="font-black text-[11px] tracking-tight">{user?.username}</p>
                  <p className="text-[9px] font-bold text-re-rojo uppercase tracking-widest mt-0.5">Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
