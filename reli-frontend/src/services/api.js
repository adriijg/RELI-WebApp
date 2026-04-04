const API_URL = import.meta.env.VITE_API_URL;
const AUTH_HEADER = import.meta.env.VITE_AUTH_TOKEN;

const handleResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(errorData.message || 'Error al conectar con el servidor');
    }
    return await response.json();
};

export const getPlayers = async () => {
    try {
        const response = await fetch(`${API_URL}/players`, {
            headers: { 'Authorization': AUTH_HEADER }
        });
        return await handleResponse(response);
    } catch (error) {
        console.error("Error en la petición:", error);
        return [];
    }
};

export const getMatches = async () => {
    try {
        const response = await fetch(`${API_URL}/matches`, { 
            headers: { 'Authorization': AUTH_HEADER } 
        });
        return await handleResponse(response);
    } catch (error) {
        console.error("Error en la petición:", error);
        return [];
    }
};

export const loginUser = async (credentials) => {
    try {
        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        return await handleResponse(response);
    } catch (error) {
        console.error("Error en login:", error);
        throw error;
    }
};

export const registerUser = async (userData) => {
    try {
        const response = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return await handleResponse(response);
    } catch (error) {
        console.error("Error en registro:", error);
        throw error;
    }
};