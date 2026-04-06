import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, User, Users, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import { useClientAuth, getClientAuthHeaders, API_BASE } from "@/contexts/clientAuth";
import heroBg from "@assets/40b756_86a22044bf6b4d728b69b627f57b50ec~mv2_1775503320084.avif";
import studioBg from "@assets/40b756_4f1dc1bd9ca941efa4af8c07e580dd1b~mv2_1775503621543.avif";

const CLASS_PHOTOS = [heroBg, studioBg];

interface ClassItem {
  id: number;
  name: string;
  instructor: string;
  time: string;
  date: string;
  dayOfWeek: string;
  capacity: number;
  enrolled: number;
  level: string;
  type: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedClass?: { name: string; type?: string } | null;
  onNeedAuth: () => void;
  onSuccess?: () => void;
}

const LEVELS: Record<string, string> = {
  "Principiante": "bg-emerald-100 text-emerald-700",
  "Intermedio": "bg-amber-100 text-amber-700",
  "Avanzado": "bg-rose-100 text-rose-700",
};

export function BookingModal({ isOpen, onClose, preselectedClass, onNeedAuth, onSuccess }: BookingModalProps) {
  const { client } = useClientAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selected, setSelected] = useState<ClassItem | null>(null);
  const [date, setDate] = useState("");
  const [step, setStep] = useState<"select" | "confirm" | "success">("select");
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [error, setError] = useState("");
  const [noMembership, setNoMembership] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingClasses(true);
    setStep("select");
    setSelected(null);
    setDate("");
    setError("");
    setNoMembership(false);

    fetch(`${API_BASE}/client/classes`, { headers: getClientAuthHeaders() })
      .then(r => r.json())
      .then((data: ClassItem[]) => setClasses(data))
      .catch(() => setClasses([]))
      .finally(() => setLoadingClasses(false));
  }, [isOpen]);

  const handleSelectClass = (cls: ClassItem) => {
    setSelected(cls);
    setDate(cls.date ?? new Date().toISOString().slice(0, 10));
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!selected || !date || !client) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/client/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getClientAuthHeaders() },
        body: JSON.stringify({ classId: selected.id, date }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 402) { setNoMembership(true); return; }
        throw new Error(err.error ?? "Error al reservar");
      }
      setStep("success");
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al confirmar reserva");
    } finally {
      setLoading(false);
    }
  };

  const spots = selected ? selected.capacity - selected.enrolled : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {step === "select" ? "Elige una clase" : step === "confirm" ? "Confirmar reserva" : "Reserva confirmada"}
                </h2>
                {client && <p className="text-sm text-gray-400 mt-0.5">Hola, {client.name.split(" ")[0]}</p>}
              </div>
              <button onClick={onClose} className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-5">
              {/* Step: Select class */}
              {step === "select" && (
                <div className="space-y-3">
                  {loadingClasses ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
                    ))
                  ) : classes.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>No hay clases disponibles por el momento.</p>
                    </div>
                  ) : (
                    classes.map((cls, i) => (
                      <motion.button
                        key={cls.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSelectClass(cls)}
                        className="w-full flex items-start gap-4 p-3 rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-md transition-all text-left group overflow-hidden"
                      >
                        <div className="h-16 w-20 rounded-xl overflow-hidden shrink-0 relative">
                          <img
                            src={CLASS_PHOTOS[i % CLASS_PHOTOS.length]}
                            alt={cls.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-semibold text-gray-900 text-sm">{cls.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVELS[cls.level] ?? "bg-gray-100 text-gray-600"}`}>{cls.level}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{cls.time}</span>
                            <span className="flex items-center gap-1"><User className="h-3 w-3" />{cls.instructor}</span>
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{cls.capacity - cls.enrolled} cupos</span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-violet-500 transition-colors shrink-0 mt-4" />
                      </motion.button>
                    ))
                  )}
                </div>
              )}

              {/* Step: Confirm */}
              {step === "confirm" && selected && (
                <div className="space-y-5">
                  <div className="rounded-2xl overflow-hidden border border-violet-100">
                    <div className="relative h-32">
                      <img
                        src={CLASS_PHOTOS[selected.id % CLASS_PHOTOS.length]}
                        alt={selected.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/30 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                        <div>
                          <div className="font-bold text-white text-base leading-tight">{selected.name}</div>
                          <div className="text-violet-300 text-xs font-medium mt-0.5">{selected.type} · {selected.level}</div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${LEVELS[selected.level] ?? "bg-gray-100 text-gray-700"}`}>{selected.level}</span>
                      </div>
                    </div>
                    <div className="bg-violet-50 p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {[
                        { icon: Clock, label: "Hora", value: selected.time },
                        { icon: User, label: "Instructor", value: selected.instructor },
                        { icon: Users, label: "Cupos", value: `${spots} disponibles` },
                        { icon: Calendar, label: "Nivel", value: selected.level },
                      ].map(item => (
                        <div key={item.label} className="bg-white rounded-xl p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <item.icon className="h-3.5 w-3.5 text-violet-500" />
                            <span className="text-xs text-gray-400 font-medium">{item.label}</span>
                          </div>
                          <div className="text-sm font-semibold text-gray-900">{item.value}</div>
                        </div>
                      ))}
                    </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Fecha de la clase</label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                    />
                  </div>

                  {noMembership && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-amber-800 text-sm mb-1">Sin clases disponibles</div>
                        <p className="text-xs text-amber-700">Necesitas un plan activo para reservar. Elige una membresía Moon.</p>
                        <button
                          onClick={() => { onClose(); document.getElementById("memberships")?.scrollIntoView({ behavior: "smooth" }); }}
                          className="mt-2 text-xs font-semibold text-amber-800 underline hover:no-underline"
                        >
                          Ver planes →
                        </button>
                      </div>
                    </div>
                  )}

                  {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</div>}

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => { setStep("select"); setNoMembership(false); setError(""); }}
                      className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                      Cambiar clase
                    </button>
                    <button onClick={handleConfirm} disabled={loading || !date || spots <= 0}
                      className="flex-1 h-11 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                      {loading ? "Reservando..." : <><span>Confirmar</span><CheckCircle2 className="h-4 w-4" /></>}
                    </button>
                  </div>
                </div>
              )}

              {/* Step: Success */}
              {step === "success" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Reserva confirmada</h3>
                  <p className="text-gray-500 text-sm mb-1">
                    <span className="font-semibold text-gray-700">{selected?.name}</span>
                  </p>
                  <p className="text-gray-400 text-sm mb-8">{date} · {selected?.time} · {selected?.instructor}</p>
                  <div className="flex gap-3">
                    <button onClick={onClose}
                      className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                      Cerrar
                    </button>
                    <button
                      onClick={() => { onClose(); window.location.href = (import.meta.env.BASE_URL ?? "/landing/") + "dashboard"; }}
                      className="flex-1 h-11 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors">
                      Ver mis reservas
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
