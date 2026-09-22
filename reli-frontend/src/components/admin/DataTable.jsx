import { useMemo, useState } from 'react';

export default function DataTable({
  columns,
  rows,
  loading,
  error,
  page,
  totalPages,
  totalElements,
  onPageChange,
  onEdit,
  onDelete,
  emptyMessage = 'No hay registros todavía.',
  searchKeys,
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) => {
      const keys = searchKeys && searchKeys.length ? searchKeys : columns.map((c) => c.key);
      return keys.some((key) => String(row[key] ?? '').toLowerCase().includes(q));
    });
  }, [rows, query, columns, searchKeys]);

  return (
    <div className="card-depth rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 md:px-6 py-4 border-b border-card-border">
        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          {totalElements} registro{totalElements === 1 ? '' : 's'}
        </p>
        <div className="relative w-full sm:w-72">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full bg-muted/30 border border-card-border rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-re-rojo/40 transition-all"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center animate-pulse">
          <span className="text-re-rojo font-black uppercase tracking-[0.2em] text-sm">Cargando registros...</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center border-re-rojo/40">
          <p className="text-re-rojo font-black text-sm">{error}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
          <thead>
            <tr className="bg-muted/20">
              {columns.map((col) => (
                <th key={col.key} className={`px-2 md:px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap ${col.className || ''}`}>
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-2 md:px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground text-right">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-16 text-center text-muted-foreground font-bold text-sm">
                  {query ? 'Sin resultados para la búsqueda.' : emptyMessage}
                </td>
              </tr>
            ) : (
              filtered.map((row, idx) => (
                <tr
                  key={row.id ?? idx}
                  className="border-t border-card-border hover:bg-muted/10 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-2 md:px-3 py-2.5 text-[11px] sm:text-xs font-bold align-middle truncate ${col.className || ''}`}>
                      {col.render ? col.render(row[col.key], row) : formatCell(row[col.key])}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="px-2 md:px-3 py-2.5 text-right whitespace-nowrap">
                      <div className="inline-flex gap-1">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest bg-re-dorado/15 text-re-dorado border border-re-dorado/30 hover:bg-re-dorado/25 transition-all"
                          >
                            Editar
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest bg-re-rojo/10 text-re-rojo border border-re-rojo/30 hover:bg-re-rojo/20 transition-all"
                          >
                            Borrar
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 md:px-6 py-4 border-t border-card-border">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 0}
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-card-border hover:bg-muted/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ← Anterior
          </button>
          <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-card-border hover:bg-muted/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Siguiente →
          </button>
        </div>
      )}
        </>
      )}
    </div>
  );
}

function formatCell(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return String(value);
}
