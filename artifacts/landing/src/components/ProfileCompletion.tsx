import { useState } from "react";
import { useUser, useAuth } from "@clerk/react";
import { motion } from "framer-motion";
import { User, Phone, Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { API_BASE } from "@/lib/api";
import logoBlack from "@assets/Moon_Pilates_Studio_Logo_TEXTO_NEGRO_1775503679484.png";

interface Props {
  onComplete: () => void;
}

export function ProfileCompletion({ onComplete }: Props) {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) { setError("El nombre es obligatorio"); return; }
    if (!phone.trim()) { setError("El número de celular es obligatorio"); return; }

    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/client/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ firstName, lastName, phone }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al guardar");
      }
      onComplete();
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar el perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logoBlack} alt="Moon Pilates Studio" className="h-10 w-auto object-contain" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-[#C49A1E]" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Completa tu perfil</h1>
            <p className="text-sm text-gray-500 mt-1">
              Necesitamos algunos datos para preparar tu cuenta en Moon Pilates.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Nombre *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Ana"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C49A1E]/30 focus:border-[#C49A1E] transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Apellido</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="García"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C49A1E]/30 focus:border-[#C49A1E] transition-all"
                />
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                Número de celular *
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <span className="text-sm text-gray-500">🇵🇦</span>
                  <span className="text-sm text-gray-400 font-medium">+507</span>
                  <div className="w-px h-4 bg-gray-200 ml-1" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="6000-0000"
                  className="w-full h-11 pl-24 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C49A1E]/30 focus:border-[#C49A1E] transition-all"
                  required
                />
              </div>
            </div>

            {/* Correo — read only from Clerk */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-100 bg-gray-50/50 text-sm text-gray-400 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Vinculado a tu cuenta de Google</p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#C49A1E] text-white font-semibold rounded-xl hover:bg-[#b08a18] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
              ) : (
                <><span>Guardar y continuar</span><ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>
        </div>

        {/* Bottom note */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Moon Pilates Studio · Atrio Mall Costa del Este, Panamá
        </p>
      </motion.div>
    </div>
  );
}
