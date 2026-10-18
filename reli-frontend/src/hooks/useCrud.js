import { useCallback, useEffect, useState } from 'react';
import { toPage } from '../services/api';

/**
 * CRUD genérico para las tablas del panel.
 * - Paginación en servidor (page/size/sortBy/direction).
 * - Búsqueda en servidor opcional (`serverSearch`): se aplica `search` con debounce.
 * - `initialSearch` permite arrancar con un término ya aplicado.
 */
export function useCrud({
  fetchPage,
  createItem,
  updateItem,
  deleteItem,
  deleteMany,
  pageSize = 10,
  sortBy,
  direction = 'desc',
  autoLoad = true,
  serverSearch = false,
  initialSearch = '',
  searchDelay = 300,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [meta, setMeta] = useState({ totalPages: 1, totalElements: 0 });

  useEffect(() => {
    if (!serverSearch) return undefined;
    const timer = setTimeout(() => setDebouncedSearch(search), searchDelay);
    return () => clearTimeout(timer);
  }, [search, serverSearch, searchDelay]);

  const load = useCallback(
    async (targetPage = 0) => {
      setLoading(true);
      setError('');
      try {
        const params = { page: targetPage, size: pageSize, sortBy, direction };
        if (serverSearch && debouncedSearch.trim()) params.search = debouncedSearch.trim();
        const data = await fetchPage(params);
        const paged = toPage(data);
        setRows(paged.content);
        setMeta({ totalPages: Math.max(paged.totalPages, 1), totalElements: paged.totalElements });
        setPage(targetPage);
        return paged;
      } catch (err) {
        setError(err?.message || 'Error al cargar los datos');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fetchPage, pageSize, sortBy, direction, serverSearch, debouncedSearch],
  );

  useEffect(() => {
    if (autoLoad) load(0);
  }, [autoLoad, load]);

  const save = useCallback(
    async (values, id) => {
      if (id) await updateItem(id, values);
      else await createItem(values);
      await load(page);
    },
    [createItem, updateItem, load, page],
  );

  const remove = useCallback(
    async (id) => {
      await deleteItem(id);
      const nextPage = rows.length === 1 && page > 0 ? page - 1 : page;
      await load(nextPage);
    },
    [deleteItem, load, page, rows.length],
  );

  const bulkRemove = useCallback(
    async (ids) => {
      const list = Array.from(ids);
      if (list.length === 0) return;
      if (deleteMany) await deleteMany(list);
      else await Promise.all(list.map((id) => deleteItem(id)));
      await load(page);
    },
    [deleteMany, deleteItem, load, page],
  );

  return {
    rows,
    loading,
    error,
    page,
    search,
    setSearch,
    totalPages: meta.totalPages,
    totalElements: meta.totalElements,
    reload: () => load(page),
    load,
    save,
    remove,
    bulkRemove,
    setError,
  };
}
