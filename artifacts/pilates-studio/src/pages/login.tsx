import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import loginBg from "@/assets/login-bg.jpg";

export default function Login() {
  const [, setLocation] = useLocation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-[400px] space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <span className="font-semibold text-xl">P</span>
            </div>
            <span className="text-2xl font-semibold tracking-tight text-foreground">Pilates Studio</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight">Bienvenido</h1>
            <p className="text-muted-foreground text-lg">Inicia sesión para gestionar tu estudio.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 mt-12">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Correo electrónico</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@estudio.com" 
                  required 
                  className="h-12 rounded-xl bg-card border-border/50 shadow-sm focus-visible:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
                  <a href="#" className="text-sm text-primary hover:underline font-medium">
                    ¿Olvidé mi contraseña?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required
                  className="h-12 rounded-xl bg-card border-border/50 shadow-sm focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl text-base font-medium shadow-sm hover:shadow group transition-all">
              Iniciar sesión
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>
        </div>
      </div>

      <div className="hidden lg:block lg:flex-1 relative overflow-hidden bg-muted">
        <div className="absolute inset-0 bg-primary/10 mix-blend-multiply z-10" />
        <img 
          src={loginBg} 
          alt="Pilates studio interior" 
          className="absolute inset-0 w-full h-full object-cover object-center animate-in fade-in duration-1000"
        />
      </div>
    </div>
  );
}
