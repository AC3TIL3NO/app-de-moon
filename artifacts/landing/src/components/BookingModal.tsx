import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, User, Users, CheckCircle2, ArrowRight, AlertCircle, ScrollText } from "lucide-react";
import { useAuth, useUser } from "@clerk/react";
import { API_BASE } from "@/lib/api";
import { useClientContext } from "@/contexts/clientContext";
import { PoliciesModal } from "@/components/PoliciesModal";

interface ClassItem {
  id: number;
  name: string;
  instructor: string;
  time: string;
  date: string | null;
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

const DAY_ORDER = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function sortAndGroupClasses(classes: ClassItem[]): { day: string; items: ClassItem[] }[] {
  const sorted = [...classes].sort((a, b) => {
    const da = DAY_ORDER.indexOf(a.dayOfWeek);
    const db_ = DAY_ORDER.indexOf(b.dayOfWeek);
    if (da !== db_) return da - db_;
    return a.time.localeCompare(b.time);
  });
  const groups: { day: string; items: ClassItem[] }[] = [];
  for (const cls of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.day === cls.dayOfWeek) {
      last.items.push(cls);
    } else {
      groups.push({ day: cls.dayOfWeek, items: [cls] });
    }
  }
  return groups;
}

export function BookingModal({ isOpen, onClose, preselectedClass, onNeedAuth, onSuccess }: BookingModalProps) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { client, refetch } = useClientContext();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selected, setSelected] = useState<ClassItem | null>(null);
  const [date, setDate] = useState("");
  const [step, setStep] = useState<"select" | "confirm" | "success">("select");
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [error, setError] = useState("");
  const [noMembership, setNoMembership] = useState(false);
  const [policiesAccepted, setPoliciesAccepted] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);

  const alreadyAccepted = !!client?.policiesAcceptedAt;

  useEffect(() => {
    setPoliciesAccepted(alreadyAccepted);
  }, [alreadyAccepted]);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingClasses(true);
    setStep("select");
    setSelected(null);
    setDate("");
    setError("");
    setNoMembership(false);

    getToken().then(token => {
      const h = token ? { Authorization: `Bearer ${token}` } : {};
      fetch(`${API_BASE}/client/classes`, { headers: h })
        .then(r => r.json())
        .then((data: ClassItem[]) => setClasses(data))
        .catch(() => setClasses([]))
        .finally(() => setLoadingClasses(false));
    });
  }, [isOpen]);

  const handleSelectClass = (cls: ClassItem) => {
    setSelected(cls);
    setDate(cls.date ?? new Date().toISOString().slice(0, 10));
    setStep("confirm");
  };

  const handleConfirm = async () => {
    if (!selected || !date) return;
    if (!policiesAccepted) { setError("Debes aceptar las políticas para continuar."); return; }
    setLoading(true);
    setError("");
    try {
      const token = await getToken();

      if (!alreadyAccepted) {
        await fetch(`${API_BASE}/client/accept-policies`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        });
        refetch();
      }

      const res = await fetch(`${API_BASE}/client/reserve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
    <>
    <PoliciesModal isOpen={showPolicies} onClose={() => setShowPolicies(false)} />
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
                {user && <p className="text-sm text-gray-400 mt-0.5">Hola, {user.firstName || user.fullName?.split(" ")[0] || ""}!</p>}
              </div>
              <button onClick={onClose} className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-5">
              {/* Step: Select class */}
              {step === "select" && (
                <div className="space-y-5">
                  {loadingClasses ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
                    ))
                  ) : classes.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>No hay clases disponibles por el momento.</p>
                    </div>
                  ) : (
                    sortAndGroupClasses(classes).map(group => (
                      <div key={group.day}>
                        {/* Day header */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{group.day}</span>
                          <div className="flex-1 h-px bg-gray-100" />
                          <span className="text-xs text-gray-400">{group.items.length} clase{group.items.length !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="space-y-2">
                          {group.items.map(cls => {
                            const spots = cls.capacity - cls.enrolled;
                            const isFull = spots <= 0;
                            return (
                              <motion.button
                                key={cls.id}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => !isFull && handleSelectClass(cls)}
                                disabled={isFull}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all text-left group
                                  ${isFull
                                    ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                                    : "border-gray-100 hover:border-amber-200 hover:shadow-md cursor-pointer"}`}
                              >
                                {/* Time block */}
                                <div className="shrink-0 w-14 h-12 rounded-xl bg-gray-900 flex flex-col items-center justify-center">
                                  <span className="text-white text-sm font-bold leading-tight">{cls.time.slice(0, 5)}</span>
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-semibold text-gray-900 text-sm">Clase</span>
                                    {isFull && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Llena</span>}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-gray-400">
                                    <span className="flex items-center gap-1"><User className="h-3 w-3" />{cls.instructor ?? "Sin instructor"}</span>
                                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{spots > 0 ? `${spots} cupos` : "Sin cupos"}</span>
                                  </div>
                                </div>
                                {!isFull && <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#C49A1E] transition-colors shrink-0" />}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Step: Confirm */}
              {step === "confirm" && selected && (
                <div className="space-y-5">
                  <div className="rounded-2xl overflow-hidden border border-amber-100 bg-amber-50">
                    <div className="flex items-center gap-4 p-4 border-b border-amber-100">
                      <div className="shrink-0 w-14 h-14 rounded-xl bg-gray-900 flex flex-col items-center justify-center">
                        <span className="text-white text-sm font-bold">{selected.time.slice(0, 5)}</span>
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-base">Clase</div>
                        <div className="text-xs text-gray-500 mt-0.5">{selected.dayOfWeek}</div>
                      </div>
                    </div>
                    <div className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: Clock, label: "Hora", value: selected.time },
                        { icon: User, label: "Instructor", value: selected.instructor ?? "Sin instructor" },
                        { icon: Users, label: "Cupos", value: `${spots} disponibles` },
                        { icon: Calendar, label: "Día", value: selected.dayOfWeek },
                      ].map(item => (
                        <div key={item.label} className="bg-white rounded-xl p-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <item.icon className="h-3.5 w-3.5 text-[#C49A1E]" />
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
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
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

                  {!alreadyAccepted && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative mt-0.5 shrink-0">
                          <input
                            type="checkbox"
                            checked={policiesAccepted}
                            onChange={e => { setPoliciesAccepted(e.target.checked); if (e.target.checked) setError(""); }}
                            className="sr-only peer"
                          />
                          <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            policiesAccepted ? "bg-[#C49A1E] border-[#C49A1E]" : "border-amber-300 bg-white group-hover:border-[#C49A1E]"
                          }`}>
                            {policiesAccepted && <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={3} />}
                          </div>
                        </div>
                        <span className="text-sm text-gray-700 leading-snug">
                          He leído y acepto las{" "}
                          <button
                            type="button"
                            onClick={e => { e.preventDefault(); setShowPolicies(true); }}
                            className="text-[#C49A1E] font-semibold underline underline-offset-2 hover:text-[#b08a18] transition-colors inline-flex items-center gap-1"
                          >
                            <ScrollText className="h-3 w-3" />
                            políticas de Moon Pilates Studio
                          </button>
                        </span>
                      </label>
                    </div>
                  )}

                  {alreadyAccepted && (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm text-emerald-700 font-medium">Políticas aceptadas</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPolicies(true)}
                        className="text-xs text-emerald-600 underline hover:text-emerald-700 flex items-center gap-1"
                      >
                        <ScrollText className="h-3 w-3" />
                        Ver políticas
                      </button>
                    </div>
                  )}

                  {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</div>}

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => { setStep("select"); setNoMembership(false); setError(""); }}
                      className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                      Cambiar clase
                    </button>
                    <button onClick={handleConfirm} disabled={loading || !date || spots <= 0 || !policiesAccepted}
                      className="flex-1 h-11 rounded-xl bg-[#C49A1E] text-white text-sm font-semibold hover:bg-[#b08a18] transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
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
                    <span className="font-semibold text-gray-700">Clase · {selected?.dayOfWeek}</span>
                  </p>
                  <p className="text-gray-400 text-sm mb-8">{date} · {selected?.time} · {selected?.instructor}</p>
                  <div className="flex gap-3">
                    <button onClick={onClose}
                      className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                      Cerrar
                    </button>
                    <button
                      onClick={() => { onClose(); window.location.href = (import.meta.env.BASE_URL ?? "/landing/") + "dashboard"; }}
                      className="flex-1 h-11 rounded-xl bg-[#C49A1E] text-white text-sm font-semibold hover:bg-[#b08a18] transition-colors">
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
    </>
  );
}
