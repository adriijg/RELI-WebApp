import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function RequireAdmin({ children }) {
  const { user, isAdmin, openAuth } = useApp();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="card-depth rounded-3xl p-10 max-w-md text-center">
          <p className="text-6xl font-black italic text-re-rojo mb-4">401</p>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Inicia sesión</h1>
          <p className="text-sm font-bold text-muted-foreground mb-6">
            Necesitas una cuenta de administrador para acceder al panel.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => openAuth('login')}
              className="bg-re-rojo text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase hover:bg-re-rojo/90 transition-all"
            >
              Iniciar sesión
            </button>
            <Link to="/" className="border border-card-border font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase hover:bg-muted/10 transition-all">
              Volver a la web
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="card-depth rounded-3xl p-10 max-w-md text-center">
          <p className="text-6xl font-black italic text-re-rojo mb-4">403</p>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Acceso denegado</h1>
          <p className="text-sm font-bold text-muted-foreground mb-6">
            Tu cuenta no tiene permisos de administrador.
          </p>
          <Link to="/" className="inline-block bg-re-rojo text-white font-black px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase hover:bg-re-rojo/90 transition-all">
            Volver a la web
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
