import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Calendar, CreditCard, User, History, Receipt,
  LogOut, Clock, CheckCircle2,
  XCircle, AlertCircle, Menu, X, Zap, Star, DollarSign, ArrowLeft
} from "lucide-react";
import { useUser, useAuth, useClerk } from "@clerk/react";
import { useClientContext } from "@/contexts/clientContext";
import { API_BASE } from "@/lib/api";
import { BookingModal } from "@/components/BookingModal";
import { ProfileCompletion } from "@/components/ProfileCompletion";

const NAV_ITEMS = [
  { id: "reservas", icon: Calendar, label: "Mis Reservas" },
  { id: "membresia", icon: CreditCard, label: "Membresía" },
  { id: "pagos", icon: Receipt, label: "Pagos" },
  { id: "perfil", icon: User, label: "Perfil" },
  { id: "historial", icon: History, label: "Historial" },
];

interface Payment {
  id: number;
  concept: string;
  amount: number;
  paymentMethod: string;
  cardBrand?: string;
  cardLast4?: string;
  status: string;
  createdAt: string;
}

interface Reservation {
  id: number;
  className: string;
  date: string;
  time: string;
  status: string;
  instructor: string;
  attended: boolean;
}

interface Membership {
  id: number;
  membershipName: string;
  startDate: string;
  endDate: string;
  classesUsed: number;
  classesTotal: number;
  status: string;
}

const STATUS_STYLE: Record<string, string> = {
  "Confirmada": "bg-emerald-100 text-emerald-700",
  "Cancelada": "bg-red-100 text-red-600",
  "Pendiente": "bg-amber-100 text-amber-700",
};

export default function ClientDashboard() {
  const { isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const { client, refetch: refetchClient } = useClientContext();
  const [, navigate] = useLocation();
  const [section, setSection] = useState("reservas");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loadingRes, setLoadingRes] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/");
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;
    setLoadingRes(true);
    getToken().then(token => {
      const h = token ? { Authorization: `Bearer ${token}` } : {};
      Promise.all([
        fetch(`${API_BASE}/client/reservations`, { headers: h })
          .then(r => r.json()).then(data => setReservations(Array.isArray(data) ? data : [])).catch(() => setReservations([])),
        fetch(`${API_BASE}/client/membership`, { headers: h })
          .then(r => r.json()).then(data => setMembership(data && typeof data === "object" && data.id ? data : null)).catch(() => setMembership(null)),
      ]).finally(() => setLoadingRes(false));
    });
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (!isSignedIn || section !== "pagos") return;
    setLoadingPayments(true);
    getToken().then(token => {
      const h = token ? { Authorization: `Bearer ${token}` } : {};
      fetch(`${API_BASE}/client/payments`, { headers: h })
        .then(r => r.json()).then(data => setPayments(Array.isArray(data) ? data : [])).catch(() => setPayments([]))
        .finally(() => setLoadingPayments(false));
    });
  }, [isSignedIn, section, getToken]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCancel = async (id: number) => {
    setCancellingId(id);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/client/reservations/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Error al cancelar");
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: "Cancelada" } : r));
      showToast("Reserva cancelada correctamente");
    } catch {
      showToast("No se pudo cancelar la reserva", "error");
    } finally {
      setCancellingId(null);
    }
  };

  const handleLogout = () => {
    signOut(() => navigate("/"));
  };

  const upcoming = reservations.filter(r => r.status === "Confirmada" && r.date >= new Date().toISOString().slice(0, 10));
  const past = reservations.filter(r => r.status === "Cancelada" || r.date < new Date().toISOString().slice(0, 10));

  const membershipProgress = membership
    ? membership.classesTotal === -1 ? 100 : Math.round((membership.classesUsed / membership.classesTotal) * 100)
    : 0;

  if (!isLoaded || !client) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="h-8 w-8 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin" />
    </div>
  );

  if (!client.phone) return <ProfileCompletion onComplete={refetchClient} />;

  return (
    <div className="min-h-screen bg-gray-50 font-inter flex">
      {/* Sidebar overlay (mobile) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed lg:static top-0 left-0 h-full z-50 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#C49A1E] flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">Moon Pilates</div>
              <div className="text-xs text-gray-400">Mi cuenta</div>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setSection(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${section === item.id ? "bg-amber-50 text-[#C49A1E]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
              <item.icon className={`h-4 w-4 ${section === item.id ? "text-[#C49A1E]" : "text-gray-400"}`} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-4 py-4 border-t border-gray-100 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-[#C49A1E] font-bold text-sm">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{client.name}</div>
              <div className="text-xs text-gray-400 truncate">{client.email}</div>
            </div>
          </div>
          <button onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Página principal
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-bold text-gray-900">{NAV_ITEMS.find(n => n.id === section)?.label}</h1>
              <p className="text-xs text-gray-400">Moon Pilates Studio</p>
            </div>
          </div>
          <button onClick={() => setBookingOpen(true)}
            className="h-9 px-4 bg-[#C49A1E] text-white text-sm font-semibold rounded-xl hover:bg-[#b08a18] transition-colors">
            Reservar clase
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Mis Reservas */}
          {section === "reservas" && (
            <div className="space-y-6 max-w-3xl">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Próximas clases", value: upcoming.length, color: "amber" },
                  { label: "Clases asistidas", value: reservations.filter(r => r.attended).length, color: "emerald" },
                  { label: "Canceladas", value: reservations.filter(r => r.status === "Cancelada").length, color: "rose" },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                  <span className="font-semibold text-gray-900 text-sm">Próximas reservas</span>
                  <span className="text-xs text-gray-400">{upcoming.length} clases</span>
                </div>
                {loadingRes ? (
                  <div className="space-y-3 p-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}</div>
                ) : upcoming.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 mb-4">No tienes clases próximas</p>
                    <button onClick={() => setBookingOpen(true)}
                      className="px-5 h-9 bg-[#C49A1E] text-white text-sm font-semibold rounded-xl hover:bg-[#b08a18] transition-colors">
                      Reservar ahora
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {upcoming.map(r => (
                      <div key={r.id} className="flex items-center gap-4 px-5 py-4">
                        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                          <Calendar className="h-4.5 w-4.5 text-[#C49A1E]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm">{r.className}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                            <Clock className="h-3 w-3" />{r.date} · {r.time} · {r.instructor}
                          </div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[r.status] ?? "bg-gray-100 text-gray-500"}`}>{r.status}</span>
                        <button onClick={() => handleCancel(r.id)} disabled={cancellingId === r.id}
                          className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                          {cancellingId === r.id ? "..." : "Cancelar"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Membresía */}
          {section === "membresia" && (
            <div className="max-w-2xl space-y-5">
              {membership ? (
                <>
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="h-4 w-4 text-[#C49A1E]" />
                          <span className="text-gray-300 text-sm font-medium">Plan activo</span>
                        </div>
                        <h2 className="text-2xl font-bold">{membership.membershipName}</h2>
                      </div>
                      <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">{membership.status}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Clases usadas</span>
                        <span className="font-semibold">
                          {membership.classesTotal === -1 ? `${membership.classesUsed} (ilimitadas)` : `${membership.classesUsed} / ${membership.classesTotal}`}
                        </span>
                      </div>
                      {membership.classesTotal !== -1 && (
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-[#C49A1E] rounded-full transition-all" style={{ width: `${membershipProgress}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-4 mt-6 pt-4 border-t border-white/20 text-sm">
                      <div><div className="text-gray-300 text-xs mb-0.5">Desde</div><div className="font-semibold">{membership.startDate}</div></div>
                      <div><div className="text-gray-300 text-xs mb-0.5">Hasta</div><div className="font-semibold">{membership.endDate}</div></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">Planes disponibles</h3>
                    {[
                      { name: "Moon Start", price: "B/.120", classes: "8 clases/mes", desc: "Ideal para 2 clases por semana" },
                      { name: "Moon Flow", price: "B/.160", classes: "12 clases/mes", desc: "Ideal para progreso constante", popular: true },
                      { name: "Moon Unlimited", price: "B/.220", classes: "Ilimitadas", desc: "Incluye prioridad de reserva" },
                    ].map(plan => (
                      <div key={plan.name} className={`flex items-center justify-between p-3 rounded-xl mb-2 ${plan.popular ? "bg-amber-50 border border-amber-100" : "hover:bg-gray-50"} transition-colors`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm">{plan.name}</span>
                            {plan.popular && <span className="text-xs bg-amber-100 text-[#C49A1E] px-2 py-0.5 rounded-full font-medium">Popular</span>}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">{plan.classes} · {plan.desc}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">{plan.price}</div>
                          <button className="text-xs text-[#C49A1E] font-semibold hover:underline mt-0.5">Cambiar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="h-8 w-8 text-[#C49A1E]" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Sin membresía activa</h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">Adquiere un plan Moon para empezar a reservar tus clases de Pilates Reformer.</p>
                  <div className="grid gap-3">
                    {[
                      { name: "Moon Start", price: "B/.120", classes: "8 clases al mes" },
                      { name: "Moon Flow", price: "B/.160", classes: "12 clases al mes", popular: true },
                      { name: "Moon Unlimited", price: "B/.220", classes: "Ilimitadas" },
                    ].map(plan => (
                      <div key={plan.name} className={`flex items-center justify-between p-4 rounded-2xl border text-left ${plan.popular ? "border-amber-200 bg-amber-50" : "border-gray-100"}`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm">{plan.name}</span>
                            {plan.popular && <span className="text-xs bg-amber-100 text-[#C49A1E] px-2 py-0.5 rounded-full font-medium">Más popular</span>}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">{plan.classes}</div>
                        </div>
                        <button className="h-9 px-4 bg-[#C49A1E] text-white text-xs font-bold rounded-xl hover:bg-[#b08a18] transition-colors">
                          {plan.price}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Perfil */}
          {section === "perfil" && (
            <div className="max-w-lg space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-amber-100 flex items-center justify-center text-[#C49A1E] font-bold text-2xl">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900">{client.name}</div>
                    <div className="text-sm text-gray-400">{client.email}</div>
                    {membership && <div className="text-xs bg-amber-100 text-[#C49A1E] font-semibold px-2.5 py-0.5 rounded-full mt-1 inline-block">{membership.membershipName}</div>}
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Nombre", value: client.name },
                    { label: "Correo", value: client.email },
                    { label: "Teléfono", value: client.phone || "No registrado" },
                    { label: "Plan", value: membership?.membershipName ?? "Sin membresía" },
                  ].map(field => (
                    <div key={field.label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-400">{field.label}</span>
                      <span className="text-sm font-semibold text-gray-900">{field.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleLogout}
                className="w-full h-11 rounded-xl border border-red-100 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </button>
            </div>
          )}

          {/* Pagos */}
          {section === "pagos" && (
            <div className="max-w-3xl space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-[#C49A1E]" />
                  <span className="font-semibold text-gray-900 text-sm">Historial de pagos</span>
                </div>
                {loadingPayments ? (
                  <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}</div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-16">
                    <DollarSign className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No tienes pagos registrados todavía</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {payments.map(p => (
                      <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${p.status === "paid" ? "bg-emerald-100" : "bg-amber-100"}`}>
                          {p.status === "paid"
                            ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            : <Clock className="h-5 w-5 text-amber-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900">{p.concept}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {p.cardBrand && p.cardLast4
                              ? `${p.cardBrand.charAt(0).toUpperCase() + p.cardBrand.slice(1)} •••• ${p.cardLast4}`
                              : p.paymentMethod}
                            {" · "}
                            {new Date(p.createdAt).toLocaleDateString("es-PA", { day: "2-digit", month: "short", year: "numeric" })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">B/. {p.amount.toFixed(2)}</div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {p.status === "paid" ? "Pagado" : "Pendiente"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 text-center px-4">
                Los pagos en línea son procesados de forma segura. Para comprobantes o recibos, escríbenos a moonpilatesstudiopty@gmail.com.
              </p>
            </div>
          )}

          {/* Historial */}
          {section === "historial" && (
            <div className="max-w-3xl">
              <div className="bg-white rounded-2xl border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-50">
                  <span className="font-semibold text-gray-900 text-sm">Historial de clases</span>
                </div>
                {loadingRes ? (
                  <div className="space-y-3 p-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}</div>
                ) : reservations.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Sin historial de clases todavía</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {reservations.map(r => (
                      <div key={r.id} className="flex items-center gap-4 px-5 py-3.5">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${r.attended ? "bg-emerald-100" : r.status === "Cancelada" ? "bg-red-100" : "bg-gray-100"}`}>
                          {r.attended ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> :
                            r.status === "Cancelada" ? <XCircle className="h-4 w-4 text-red-500" /> :
                            <Clock className="h-4 w-4 text-gray-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900">{r.className}</div>
                          <div className="text-xs text-gray-400">{r.date} · {r.time} · {r.instructor}</div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLE[r.status] ?? "bg-gray-100 text-gray-500"}`}>{r.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white text-sm font-semibold
              ${toast.type === "success" ? "bg-gray-900" : "bg-red-600"}`}
          >
            {toast.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertCircle className="h-4 w-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        onNeedAuth={() => setBookingOpen(false)}
        onSuccess={() => {
          setBookingOpen(false);
          showToast("Reserva confirmada correctamente");
          getToken().then(token => {
            const h = token ? { Authorization: `Bearer ${token}` } : {};
            fetch(`${API_BASE}/client/reservations`, { headers: h }).then(r => r.json()).then(setReservations);
          });
        }}
      />
    </div>
  );
}
