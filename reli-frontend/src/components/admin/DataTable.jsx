import { Fragment, useEffect, useMemo, useState } from 'react';

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
  serverSearch = false,
  searchValue,
  onSearchChange,
  onRowClick,
  groupBy,
  groupLabel,
  onBulkDelete,
}) {
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const effectiveQuery = serverSearch ? (searchValue ?? '') : query;
  const setEffectiveQuery = serverSearch ? (onSearchChange ?? (() => {})) : setQuery;

  const filtered = useMemo(() => {
    if (serverSearch) return rows;
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) => {
      const keys = searchKeys && searchKeys.length ? searchKeys : columns.map((c) => c.key);
      return keys.some((key) => String(row[key] ?? '').toLowerCase().includes(q));
    });
  }, [rows, query, columns, searchKeys, serverSearch]);

  const groupedRows = useMemo(() => {
    if (!groupBy) return null;
    const groups = new Map();
    filtered.forEach((row) => {
      const value = row[groupBy];
      const key = value == null || value === '' ? '__none__' : String(value);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => {
      if (a === '__none__') return 1;
      if (b === '__none__') return -1;
      return Number(a) - Number(b);
    });
  }, [filtered, groupBy]);

  useEffect(() => {
    const visibleIds = new Set(rows.map((row) => String(row.id)));
    setSelectedIds((current) => new Set([...current].filter((id) => visibleIds.has(id))));
  }, [rows]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((row) => selectedIds.has(String(row.id)));
  const toggleAll = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allFilteredSelected) filtered.forEach((row) => next.delete(String(row.id)));
      else filtered.forEach((row) => next.add(String(row.id)));
      return next;
    });
  };
  const toggleRow = (row) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      const id = String(row.id);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectedRows = filtered.filter((row) => selectedIds.has(String(row.id)));

  return (
    <div className="card-depth rounded-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 md:px-6 py-4 border-b border-card-border">
        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
          {totalElements} registro{totalElements === 1 ? '' : 's'}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {onBulkDelete && (
            <button
              type="button"
              onClick={() => { setBulkMode((current) => !current); setSelectedIds(new Set()); }}
              className={`rounded-xl border px-3 py-2.5 text-[10px] font-black uppercase tracking-widest ${bulkMode ? 'border-re-rojo bg-re-rojo/10 text-re-rojo' : 'border-card-border text-muted-foreground'}`}
            >
              {bulkMode ? 'Salir de selección' : 'Seleccionar'}
            </button>
          )}
          {onBulkDelete && bulkMode && selectedRows.length > 0 && (
            <button
              type="button"
              onClick={() => onBulkDelete(selectedRows)}
              className="rounded-xl bg-re-rojo px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-white"
            >
              Borrar seleccionados ({selectedRows.length})
            </button>
          )}
          <div className="relative w-full sm:w-72">
          <input
            type="search"
            value={effectiveQuery}
            onChange={(e) => setEffectiveQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full bg-muted/30 border border-card-border rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-re-rojo/40 transition-all"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          </div>
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
              {onBulkDelete && bulkMode && (
                <th className="w-10 px-2 py-2.5 text-center">
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} aria-label="Seleccionar todos" />
                </th>
              )}
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
                <td colSpan={columns.length + 1 + (onBulkDelete && bulkMode ? 1 : 0)} className="px-6 py-16 text-center text-muted-foreground font-bold text-sm">
                  {effectiveQuery ? 'Sin resultados para la búsqueda.' : emptyMessage}
                </td>
              </tr>
            ) : (
              (groupedRows || [['__all__', filtered]]).map(([group, groupRows]) => (
                <Fragment key={group}>
                  {groupBy && (
                    <tr className="bg-muted/10 border-t border-card-border">
                      <td colSpan={columns.length + 1 + (onBulkDelete && bulkMode ? 1 : 0)} className="px-3 md:px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-re-rojo">
                        {groupLabel ? groupLabel(group === '__none__' ? null : group) : group}
                      </td>
                    </tr>
                  )}
                  {groupRows.map((row, idx) => (
                    <tr
                      key={row.id ?? `${group}-${idx}`}
                      onClick={() => bulkMode ? toggleRow(row) : onRowClick?.(row)}
                      className={`border-t border-card-border transition-colors ${bulkMode || onRowClick ? 'cursor-pointer hover:bg-re-rojo/5 active:bg-re-rojo/10' : 'hover:bg-muted/10'}`}
                    >
                      {onBulkDelete && bulkMode && (
                        <td className="w-10 px-2 py-3.5 text-center" onClick={(event) => event.stopPropagation()}>
                          <input type="checkbox" checked={selectedIds.has(String(row.id))} onChange={() => toggleRow(row)} aria-label={`Seleccionar ${row.id}`} />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.key} className={`px-3 md:px-3 py-3.5 text-sm font-bold align-middle truncate ${col.className || ''}`}>
                          {col.render ? col.render(row[col.key], row) : formatCell(row[col.key])}
                        </td>
                      ))}
                      {(onEdit || onDelete) && (
                        <td className="px-2 md:px-3 py-3.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="inline-flex gap-1">
                            {onEdit && (
                              <button
                                onClick={() => onEdit(row)}
                                className="hidden sm:inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-re-dorado/15 text-re-dorado border border-re-dorado/30 hover:bg-re-dorado/25 transition-all"
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
                  ))}
                </Fragment>
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
