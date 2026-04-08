import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/react";
import { API_BASE } from "@/lib/api";

interface ClientRecord {
  id: number;
  name: string;
  email: string;
  phone: string;
  plan: string;
  classesRemaining: number;
}

interface ClientContextValue {
  client: ClientRecord | null;
  isLoading: boolean;
  refetch: () => void;
}

const ClientContext = createContext<ClientContextValue | null>(null);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [client, setClient] = useState<ClientRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rev, setRev] = useState(0);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setClient(null);
      return;
    }
    setIsLoading(true);
    getToken()
      .then((token) =>
        fetch(`${API_BASE}/client/me`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
      )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setClient(data ?? null))
      .catch(() => setClient(null))
      .finally(() => setIsLoading(false));
  }, [isSignedIn, isLoaded, rev, getToken]);

  const refetch = () => setRev((v) => v + 1);

  return (
    <ClientContext.Provider value={{ client, isLoading, refetch }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClientContext() {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error("useClientContext must be used inside ClientProvider");
  return ctx;
}
