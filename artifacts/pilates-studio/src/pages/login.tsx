import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useStudio } from "@/contexts/studio";
import loginBg from "@/assets/login-bg.avif";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isLoading } = useAuth();
  const { settings } = useStudio();
  const studioName = settings?.name ?? "Moon Pilates Studio";
  const logoInitial = studioName.charAt(0).toUpperCase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      setLocation("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-[400px] space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-3">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt={studioName} className="h-12 w-12 rounded-2xl object-cover shadow-sm" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <span className="font-semibold text-xl">{logoInitial}</span>
              </div>
            )}
            <span className="text-2xl font-semibold tracking-tight text-foreground">{studioName}</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight">Bienvenido</h1>
            <p className="text-muted-foreground text-lg">Inicia sesión para gestionar tu estudio.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 mt-10">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                  className="h-12 rounded-xl bg-card border-border/50 shadow-sm focus-visible:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-12 rounded-xl bg-card border-border/50 shadow-sm focus-visible:ring-primary/20 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-medium shadow-sm hover:shadow group transition-all"
              disabled={isLoading}
            >
              {isLoading ? "Iniciando sesión..." : (
                <>
                  Iniciar sesión
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

          </form>
        </div>
      </div>

      <div className="hidden lg:block lg:flex-1 relative overflow-hidden">
        <img
          src={loginBg}
          alt="Pilates studio interior"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-16 left-14 right-14 text-white">
          <p className="text-3xl font-semibold leading-snug">
            "La plataforma que tu estudio necesita para crecer."
          </p>
          <p className="mt-4 text-white/70 text-lg">
            Gestiona clases, clientes, membresías y pagos en un solo lugar.
          </p>
        </div>
      </div>
    </div>
  );
}
