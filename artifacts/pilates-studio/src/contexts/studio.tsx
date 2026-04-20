import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "").replace(/\/pilates-studio$/, "") + "/api";

export interface StudioSettings {
  id: number;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  cancellationPolicy: string | null;
  paymentMethods: string[];
}

interface StudioContextValue {
  settings: StudioSettings | null;
  loading: boolean;
  refresh: () => void;
}

const StudioContext = createContext<StudioContextValue>({
  settings: null,
  loading: true,
  refresh: () => {},
});

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value;
  // Si es un objeto que tiene una propiedad 'data' que es array (común en APIs)
  if (value && typeof value === 'object' && 'data' in value && Array.isArray((value as any).data)) {
    return (value as any).data;
  }
  return [];
}

function normalizeSettings(raw: any): StudioSettings | null {
  if (!raw || typeof raw !== 'object') return null;
  try {
    return {
      id: raw.id ?? 0,
      name: raw.name ?? 'Pilates Studio',
      logoUrl: raw.logoUrl ?? null,
      primaryColor: raw.primaryColor ?? '#7C3AED',
      secondaryColor: raw.secondaryColor ?? '#F3F4F6',
      phone: raw.phone ?? null,
      email: raw.email ?? null,
      address: raw.address ?? null,
      cancellationPolicy: raw.cancellationPolicy ?? null,
      paymentMethods: asArray<string>(raw.paymentMethods),
    };
  } catch {
    return null;
  }
}
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyColor(hex: string) {
  if (!hex || !hex.startsWith("#")) return;
  try {
    const hsl = hexToHsl(hex);
    const [h, s, lRaw] = hsl.split(" ");
    const lNum = parseFloat(lRaw);
    const accentL = Math.min(97, lNum + 54);
    const accentFgL = Math.max(25, lNum - 10);
    const accentHsl = `${h} ${s} ${accentL}%`;
    const accentFgHsl = `${h} ${s} ${accentFgL}%`;
    document.documentElement.style.setProperty("--primary", hsl);
    document.documentElement.style.setProperty("--ring", hsl);
    document.documentElement.style.setProperty("--sidebar-primary", hsl);
    document.documentElement.style.setProperty("--sidebar-ring", hsl);
    document.documentElement.style.setProperty("--accent", accentHsl);
    document.documentElement.style.setProperty("--accent-foreground", accentFgHsl);
    document.documentElement.style.setProperty("--sidebar-accent", accentHsl);
    document.documentElement.style.setProperty("--sidebar-accent-foreground", accentFgHsl);
  } catch {}
}

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/studio/settings`);
      if (res.ok) {
        const rawData = await res.json();
        const data = normalizeSettings(rawData);
        if (data) {
          setSettings(data);
          applyColor(data.primaryColor);
        }
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  return (
    <StudioContext.Provider value={{ settings, loading, refresh: fetchSettings }}>
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  return useContext(StudioContext);
}
