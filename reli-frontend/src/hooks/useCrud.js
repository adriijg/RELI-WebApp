import { useCallback, useEffect, useState } from 'react';
import { toPage } from '../services/api';

export function useCrud({
  fetchPage,
  createItem,
  updateItem,
  deleteItem,
  pageSize = 10,
  sortBy,
  direction = 'desc',
  autoLoad = true,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [meta, setMeta] = useState({ totalPages: 1, totalElements: 0 });

  const load = useCallback(
    async (targetPage = 0) => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchPage({
          page: targetPage,
          size: pageSize,
          sortBy,
          direction,
        });
        const paged = toPage(data);
        setRows(paged.content);
        setMeta({ totalPages: Math.max(paged.totalPages, 1), totalElements: paged.totalElements });
        setPage(targetPage);
      } catch (err) {
        setError(err.message || 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    },
    [fetchPage, pageSize, sortBy, direction]
  );

  useEffect(() => {
    if (autoLoad) load(0);
  }, [autoLoad, load]);

  const save = async (values, id) => {
    if (id) await updateItem(id, values);
    else await createItem(values);
    await load(page);
  };

  const remove = async (id) => {
    await deleteItem(id);
    const nextPage = rows.length === 1 && page > 0 ? page - 1 : page;
    await load(nextPage);
  };

  return {
    rows,
    loading,
    error,
    page,
    totalPages: meta.totalPages,
    totalElements: meta.totalElements,
    reload: () => load(page),
    load,
    save,
    remove,
    setError,
  };
}
