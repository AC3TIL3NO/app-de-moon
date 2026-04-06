import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface ClientUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  plan?: string;
  classesRemaining?: number;
}

interface ClientAuthContextValue {
  client: ClientUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
}

const ClientAuthContext = createContext<ClientAuthContextValue | null>(null);

const TOKEN_KEY = "moon_client_token";
const USER_KEY = "moon_client_user";
const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "").replace("/landing", "") + "/api";

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [client, setClient] = useState<ClientUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/client/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Credenciales incorrectas");
      }
      const data = await res.json() as { token: string; client: ClientUser };
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.client));
      setToken(data.token);
      setClient(data.client);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, phone: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/client/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Error al registrarse");
      }
      const data = await res.json() as { token: string; client: ClientUser };
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.client));
      setToken(data.token);
      setClient(data.client);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setClient(null);
  }, []);

  return (
    <ClientAuthContext.Provider value={{ client, token, isLoading, login, register, logout }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const ctx = useContext(ClientAuthContext);
  if (!ctx) throw new Error("useClientAuth must be used inside ClientAuthProvider");
  return ctx;
}

export function getClientAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export { API_BASE };
