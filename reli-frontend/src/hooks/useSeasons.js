import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSeasons, toPage } from '../services/api';

/** Carga las temporadas y expone la temporada actual (flag `current`). */
export function useSeasons() {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSeasons({ page: 0, size: 100, sortBy: 'name', direction: 'desc' });
      setSeasons(toPage(data).content);
    } catch (err) {
      setError(err?.message || 'Error al cargar las temporadas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const currentSeason = useMemo(
    () => seasons.find((season) => season.current) ?? seasons[0] ?? null,
    [seasons],
  );

  return { seasons, loading, error, currentSeason, reload };
}
