export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Helper to get auth headers for API requests
export function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}

// Helper for authenticated fetch calls
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = getAuthHeaders();
    const response = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...(options.headers || {}),
        },
    });

    // If we get a 401, the token is expired/invalid — redirect to login
    if (response.status === 401) {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/login";
    }

    return response;
}
