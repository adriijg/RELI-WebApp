const API_URL = import.meta.env.VITE_API_URL || '/api';

const getToken = () => localStorage.getItem('re-token');

const handleResponse = async (response) => {
    if (response.status === 204) return null;

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        let message = data?.message || data?.error || `Error del servidor (${response.status})`;
        if (data?.fieldErrors && typeof data.fieldErrors === 'object') {
            message = Object.values(data.fieldErrors).join('. ');
        }
        if (response.status === 401) {
            message = 'Sesión no válida o caducada. Cierra sesión y vuelve a iniciarla.';
            localStorage.removeItem('re-token');
        } else if (response.status === 403) {
            message = data?.message || 'No tienes permisos para esta acción (se requiere rol ADMIN).';
        }
        const error = new Error(message);
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
};

async function apiFetch(path, { method = 'GET', body, params, auth = true } = {}) {
    const url = new URL(`${API_URL}${path}`, window.location.origin);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                url.searchParams.set(key, value);
            }
        });
    }

    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth) {
        const token = getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    return handleResponse(response);
}

export const toPage = (data) => {
    if (Array.isArray(data)) {
        return { content: data, page: 0, size: data.length, totalElements: data.length, totalPages: 1, last: true };
    }
    return {
        content: data?.content ?? [],
        page: data?.page ?? 0,
        size: data?.size ?? 10,
        totalElements: data?.totalElements ?? data?.content?.length ?? 0,
        totalPages: data?.totalPages ?? 1,
        last: data?.last ?? true,
    };
};

/* ---------- Auth ---------- */
export const loginUser = (credentials) =>
    apiFetch('/users/login', { method: 'POST', body: credentials, auth: false });

export const registerUser = (userData) =>
    apiFetch('/users/register', { method: 'POST', body: userData, auth: false });

/* ---------- Partidos ---------- */
export const getMatches = (params) => apiFetch('/matches', { params });
export const getMatch = (id) => apiFetch(`/matches/${id}`);
export const getMatchDetail = (id) => apiFetch(`/matches/${id}/detail`);
export const getMatchesByCompetition = (competitionId) => apiFetch(`/matches/competition/${competitionId}`);
export const addMatchGoal = (matchId, body) => apiFetch(`/matches/${matchId}/goals`, { method: 'POST', body });
export const deleteMatchGoal = (matchId, goalId) => apiFetch(`/matches/${matchId}/goals/${goalId}`, { method: 'DELETE' });
export const addMatchCallup = (matchId, body) => apiFetch(`/matches/${matchId}/callups`, { method: 'POST', body });
export const deleteMatchCallup = (matchId, callupId) => apiFetch(`/matches/${matchId}/callups/${callupId}`, { method: 'DELETE' });
export const createMatch = (body) => apiFetch('/matches', { method: 'POST', body });
export const updateMatch = (id, body) => apiFetch(`/matches/${id}`, { method: 'PUT', body });
export const deleteMatch = (id) => apiFetch(`/matches/${id}`, { method: 'DELETE' });

/* ---------- Noticias / Eventos ---------- */
export const getEvents = (params) => apiFetch('/events', { params });
export const getEvent = (id) => apiFetch(`/events/${id}`);
export const createEvent = (body) => apiFetch('/events', { method: 'POST', body });
export const updateEvent = (id, body) => apiFetch(`/events/${id}`, { method: 'PUT', body });
export const deleteEvent = (id) => apiFetch(`/events/${id}`, { method: 'DELETE' });

/* ---------- Jugadores ---------- */
export const getPlayers = (params) => apiFetch('/players', { params });
export const getAllPlayers = () => apiFetch('/players/all');
export const getPlayerSeasonStats = (params) => apiFetch('/players/season-stats', { params });
export const createPlayer = (body) => apiFetch('/players', { method: 'POST', body });
export const updatePlayer = (id, body) => apiFetch(`/players/${id}`, { method: 'PUT', body });
export const deletePlayer = (id) => apiFetch(`/players/${id}`, { method: 'DELETE' });

/* ---------- Temporadas ---------- */
export const getSeasons = (params) => apiFetch('/seasons', { params });
export const createSeason = (body) => apiFetch('/seasons', { method: 'POST', body });
export const updateSeason = (id, body) => apiFetch(`/seasons/${id}`, { method: 'PUT', body });
export const deleteSeason = (id) => apiFetch(`/seasons/${id}`, { method: 'DELETE' });

/* ---------- Competiciones ---------- */
export const getCompetitions = (params) => apiFetch('/competitions', { params });
export const createCompetition = (body) => apiFetch('/competitions', { method: 'POST', body });
export const updateCompetition = (id, body) => apiFetch(`/competitions/${id}`, { method: 'PUT', body });
export const deleteCompetition = (id) => apiFetch(`/competitions/${id}`, { method: 'DELETE' });
export const getFfmSyncRuns = () => apiFetch('/admin/sync/ffm/runs');
export const previewFfmSync = (competitionId) =>
  apiFetch('/admin/sync/ffm/preview', { method: 'POST', params: { competitionId } });
export const applyFfmSync = (competitionId) =>
  apiFetch('/admin/sync/ffm/apply', { method: 'POST', params: { competitionId } });
export const getStandings = (competitionId, jornada) => {
  const params = {};
  if (jornada != null) params.jornada = jornada;
  return apiFetch(`/competitions/${competitionId}/standings`, { params });
};

/* ---------- Estadísticas ---------- */
export const getStats = (params) => apiFetch('/stats', { params });
export const createStat = (body) => apiFetch('/stats', { method: 'POST', body });
export const updateStat = (id, body) => apiFetch(`/stats/${id}`, { method: 'PUT', body });
export const deleteStat = (id) => apiFetch(`/stats/${id}`, { method: 'DELETE' });

/* ---------- Usuarios ---------- */
export const getUsers = () => apiFetch('/users');
export const updateUser = (id, body) => apiFetch(`/users/${id}`, { method: 'PUT', body });
export const deleteUser = (id) => apiFetch(`/users/${id}`, { method: 'DELETE' });
