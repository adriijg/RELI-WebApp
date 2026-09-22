import { useState } from 'react';

export default function ConfirmDeleteModal({ open, title = '¿Eliminar registro?', message, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar');
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background border border-card-border rounded-3xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-re-rojo/10 border border-re-rojo/30 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-re-rojo" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-xl font-black italic tracking-tighter uppercase mb-2">{title}</h3>
        <p className="text-sm font-bold text-muted-foreground mb-6">{message || 'Esta acción no se puede deshacer.'}</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/40 text-red-500 text-xs font-bold p-3 rounded-xl text-center mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 border border-card-border font-black py-3 rounded-xl text-xs tracking-widest uppercase hover:bg-muted/10 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-re-rojo text-white font-black py-3 rounded-xl text-xs tracking-widest uppercase hover:bg-re-rojo/90 transition-all disabled:opacity-50"
          >
            {loading ? 'Eliminando...' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
