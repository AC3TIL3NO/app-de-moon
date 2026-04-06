import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, EyeOff, ArrowRight, User, Mail, Phone, Lock } from "lucide-react";
import { useClientAuth } from "@/contexts/clientAuth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, onSuccess, defaultTab = "login" }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const { login, register, isLoading } = useClientAuth();

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ name: "", email: "", phone: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(loginForm.email, loginForm.password);
      onClose();
      setTimeout(() => onSuccess?.(), 350);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (regForm.password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    try {
      await register(regForm.name, regForm.email, regForm.phone, regForm.password);
      onClose();
      setTimeout(() => onSuccess?.(), 350);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    }
  };

  const inputClass = "w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 pt-7 pb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {tab === "login" ? "Bienvenido de nuevo" : "Crea tu cuenta"}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {tab === "login" ? "Inicia sesión para reservar" : "Regístrate para empezar"}
                </p>
              </div>
              <button onClick={onClose} className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mx-7 mb-6 p-1 bg-gray-100 rounded-xl">
              {(["login", "register"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {t === "login" ? "Iniciar sesión" : "Registrarse"}
                </button>
              ))}
            </div>

            <div className="px-7 pb-7">
              {tab === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="email" value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="correo@ejemplo.com" required className={`${inputClass} pl-10`} />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type={showPw ? "text" : "password"} value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Tu contraseña" required className={`${inputClass} pl-10 pr-11`} />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</div>}
                  <button type="submit" disabled={isLoading}
                    className="w-full h-12 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                    {isLoading ? "Iniciando sesión..." : <><span>Iniciar sesión</span><ArrowRight className="h-4 w-4" /></>}
                  </button>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                    <div className="relative text-center text-xs text-gray-400 bg-white px-3 mx-auto w-fit">o continúa con</div>
                  </div>
                  <button type="button"
                    onClick={() => setError("Google login próximamente disponible")}
                    className="w-full h-12 border border-gray-200 rounded-xl flex items-center justify-center gap-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continuar con Google
                  </button>
                  <p className="text-center text-sm text-gray-500">
                    ¿Sin cuenta?{" "}
                    <button type="button" onClick={() => { setTab("register"); setError(""); }} className="text-violet-600 font-semibold hover:underline">
                      Regístrate gratis
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" value={regForm.name} onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Tu nombre completo" required className={`${inputClass} pl-10`} />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="email" value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="correo@ejemplo.com" required className={`${inputClass} pl-10`} />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="tel" value={regForm.phone} onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+507 6000-0000" required className={`${inputClass} pl-10`} />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type={showPw ? "text" : "password"} value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Mínimo 6 caracteres" required className={`${inputClass} pl-10 pr-11`} />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</div>}
                  <button type="submit" disabled={isLoading}
                    className="w-full h-12 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                    {isLoading ? "Creando cuenta..." : <><span>Crear cuenta gratis</span><ArrowRight className="h-4 w-4" /></>}
                  </button>
                  <p className="text-center text-sm text-gray-500">
                    ¿Ya tienes cuenta?{" "}
                    <button type="button" onClick={() => { setTab("login"); setError(""); }} className="text-violet-600 font-semibold hover:underline">
                      Iniciar sesión
                    </button>
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
