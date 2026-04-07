import { useState, useEffect, useCallback } from "react";
import {
  DollarSign, CreditCard, Banknote, Smartphone, ArrowUpRight,
  Filter, RefreshCw, Pencil, Trash2, X, Save, PlusCircle,
  Receipt, User, ChevronDown,
} from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useStudio } from "@/contexts/studio";
import { useToast } from "@/hooks/use-toast";
import { MembershipStatusCard, ClientMembership, computeMembershipStatus } from "@/components/membership-status-card";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "").replace(/\/pilates-studio$/, "") + "/api";

interface Payment {
  id: number;
  clientId: number;
  membershipId?: number | null;
  clientName?: string;
  clientEmail?: string;
  concept: string;
  amount: number;
  paymentMethod: string;
  cardBrand?: string;
  cardLast4?: string;
  chargedBy: string;
  status: string;
  createdAt: string;
}

interface Summary {
  totalHoy: number;
  efectivo: number;
  tarjeta: number;
  yappy: number;
  transferencia: number;
  pendiente: number;
  byMethod: Record<string, number>;
}

interface MembershipPlan {
  id: number;
  name: string;
  totalClasses: number;
  price: number;
  promoPrice?: number | null;
  durationDays: number;
  active: boolean;
  isPublic: boolean;
}

interface Client {
  id: number;
  name: string;
  email: string;
}

const PAYMENT_METHODS = [
  "Efectivo",
  "Yappy",
  "Visa",
  "Mastercard",
  "PayPal",
  "PagueloFacil",
  "Transferencia",
];

const METHOD_OPTS = ["Todos", ...PAYMENT_METHODS];
const STATUS_OPTS = ["Todos", "paid", "pending"];

function methodIcon(m: string) {
  if (m === "Efectivo") return <Banknote className="h-4 w-4 text-emerald-500" />;
  if (m === "Yappy") return <Smartphone className="h-4 w-4 text-green-600" />;
  if (m === "PayPal" || m === "PagueloFacil") return <CreditCard className="h-4 w-4 text-blue-500" />;
  if (m === "Visa" || m === "Mastercard" || m === "Tarjeta") return <CreditCard className="h-4 w-4 text-indigo-500" />;
  if (m === "Transferencia") return <ArrowUpRight className="h-4 w-4 text-orange-500" />;
  return <DollarSign className="h-4 w-4 text-gray-400" />;
}

function methodColor(m: string) {
  if (m === "Efectivo") return "text-emerald-600 bg-emerald-50";
  if (m === "Yappy") return "text-green-700 bg-green-50";
  if (m === "PayPal") return "text-blue-600 bg-blue-50";
  if (m === "PagueloFacil") return "text-sky-600 bg-sky-50";
  if (m === "Visa" || m === "Mastercard") return "text-indigo-600 bg-indigo-50";
  if (m === "Transferencia") return "text-orange-600 bg-orange-50";
  return "text-gray-600 bg-gray-50";
}

// ─── Register Payment Modal ────────────────────────────────────────────────────

interface RegisterPaymentModalProps {
  onClose: () => void;
  onSaved: () => void;
  currentUser: { name: string; email: string };
}

function RegisterPaymentModal({ onClose, onSaved, currentUser }: RegisterPaymentModalProps) {
  const { toast } = useToast();
  const { settings } = useStudio();
  const studioPaymentMethods = settings?.paymentMethods?.length
    ? settings.paymentMethods
    : PAYMENT_METHODS;
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientList, setShowClientList] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(() => studioPaymentMethods[0] ?? "Efectivo");
  const [customAmount, setCustomAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [clientMembership, setClientMembership] = useState<ClientMembership | null>(null);
  const [membershipLoading, setMembershipLoading] = useState(false);

  const fetchClientMembership = useCallback(async (clientId: number) => {
    setMembershipLoading(true);
    setClientMembership(null);
    try {
      const res = await fetch(`${API_BASE}/clients/${clientId}/membership`);
      if (res.ok) setClientMembership(await res.json() as ClientMembership);
    } catch {}
    finally { setMembershipLoading(false); }
  }, []);

  useEffect(() => {
    if (selectedClient) fetchClientMembership(selectedClient.id);
    else setClientMembership(null);
  }, [selectedClient, fetchClientMembership]);

  useEffect(() => {
    const token = localStorage.getItem("pilates_token") ?? "";
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API_BASE}/memberships`, { headers: h }).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/clients`, { headers: h }).then(r => r.ok ? r.json() : []),
    ]).then(([m, c]) => {
      setPlans((m as MembershipPlan[]).filter(p => p.active));
      setClients(c as Client[]);
    });
  }, []);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(clientSearch.toLowerCase())
  ).slice(0, 8);

  const effectivePlanPrice = selectedPlan ? (selectedPlan.promoPrice ?? selectedPlan.price) : 0;
  const amount = customAmount ? parseFloat(customAmount) : effectivePlanPrice;

  const handleSave = async () => {
    if (!selectedClient) { toast({ title: "Selecciona un cliente.", variant: "destructive" }); return; }
    if (amount <= 0) { toast({ title: "Ingresa un monto válido.", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/payments/manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("pilates_token") ?? ""}`,
        },
        body: JSON.stringify({
          clientId: selectedClient.id,
          membershipId: selectedPlan?.id ?? null,
          concept: selectedPlan ? `${selectedPlan.name} · ${selectedPlan.totalClasses} clases` : "Pago manual",
          amount,
          paymentMethod,
          chargedBy: currentUser.name,
          activateMembership: !!selectedPlan,
          status: "paid",
        }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Pago registrado correctamente." });
      onSaved();
      onClose();
    } catch {
      toast({ title: "Error al registrar el pago.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-gray-900">Registrar Cobro</span>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Membership plan selector */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Plan de Membresía</label>
            <div className="grid grid-cols-1 gap-2">
              {plans.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => { setSelectedPlan(selectedPlan?.id === plan.id ? null : plan); setCustomAmount(""); }}
                  className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${
                    selectedPlan?.id === plan.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{plan.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{plan.totalClasses} clases · {plan.durationDays} días · Sin ITBMS</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-black ${selectedPlan?.id === plan.id ? "text-primary" : "text-gray-800"}`}>
                      B/. {plan.promoPrice ?? plan.price}
                    </div>
                    {plan.promoPrice != null && (
                      <div className="text-xs line-through text-gray-400">B/. {plan.price}</div>
                    )}
                  </div>
                </button>
              ))}
              <button
                onClick={() => { setSelectedPlan(null); }}
                className={`flex items-center gap-2 p-3.5 rounded-xl border-2 transition-all text-left ${
                  !selectedPlan ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <span className="text-sm text-gray-600 font-medium">Otro concepto (monto libre)</span>
              </button>
            </div>
          </div>

          {/* Client selector */}
          <div className="relative">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Cliente</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={selectedClient ? selectedClient.name : clientSearch}
                onChange={e => { setClientSearch(e.target.value); setSelectedClient(null); setShowClientList(true); }}
                onFocus={() => setShowClientList(true)}
                placeholder="Buscar cliente..."
                className="w-full h-10 pl-9 pr-9 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            {showClientList && !selectedClient && filteredClients.length > 0 && (
              <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                {filteredClients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedClient(c); setClientSearch(""); setShowClientList(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.email}</div>
                  </button>
                ))}
              </div>
            )}
            {selectedClient && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2 p-2.5 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="h-6 w-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold shrink-0">
                    {selectedClient.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-900 flex-1">{selectedClient.name}</span>
                  <button onClick={() => setSelectedClient(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {membershipLoading && (
                  <div className="h-16 rounded-xl bg-gray-50 border border-gray-100 animate-pulse" />
                )}
                {!membershipLoading && clientMembership && (
                  <MembershipStatusCard membership={clientMembership} compact />
                )}
                {!membershipLoading && !clientMembership && (
                  <div className="text-xs text-gray-400 px-1 flex items-center gap-1.5">
                    <CreditCard className="h-3 w-3" />
                    Sin membresía registrada — se activará al registrar este cobro.
                  </div>
                )}
                {!membershipLoading && clientMembership && computeMembershipStatus(clientMembership) === "active" && (
                  <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Este cliente ya tiene una membresía activa. Registrar un nuevo plan la reemplazará.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Monto {selectedPlan ? `(Plan: B/. ${selectedPlan.promoPrice ?? selectedPlan.price})` : "(Libre)"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">B/.</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder={selectedPlan ? String(selectedPlan.promoPrice ?? selectedPlan.price) : "0.00"}
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                className="w-full h-10 pl-10 pr-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {selectedPlan && !customAmount && (
              <p className="text-xs text-gray-500 mt-1">
                Se cobrará B/. {selectedPlan.promoPrice ?? selectedPlan.price} por {selectedPlan.totalClasses} {selectedPlan.totalClasses === 1 ? "clase" : "clases"}
                {selectedPlan.promoPrice != null && ` (precio original B/. ${selectedPlan.price})`}
              </p>
            )}
          </div>

          {/* Payment method */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Método de Pago</label>
            <div className="grid grid-cols-3 gap-2">
              {studioPaymentMethods.map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-semibold ${
                    paymentMethod === m
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-100 text-gray-600 hover:border-gray-200"
                  }`}
                >
                  {methodIcon(m)}
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Cashier info */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="text-xs text-gray-500">Cajero/a</div>
                <div className="text-sm font-semibold text-gray-900">{currentUser.name}</div>
              </div>
            </div>
          </div>

          {/* Summary preview */}
          {(selectedClient || selectedPlan || amount > 0) && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1.5">
              <div className="text-xs font-bold text-primary uppercase tracking-wide mb-2">Resumen del cobro</div>
              {selectedClient && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cliente</span>
                  <span className="font-medium text-gray-900">{selectedClient.name}</span>
                </div>
              )}
              {selectedPlan && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-medium text-gray-900">{selectedPlan.name}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Método</span>
                <span className="font-medium text-gray-900">{paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-primary/20 pt-1.5 mt-1.5">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-black text-primary text-base">B/. {amount.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedClient || amount <= 0}
            className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            <Receipt className="h-4 w-4" />
            {saving ? "Registrando..." : "Confirmar Cobro"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  payment: Payment;
  onClose: () => void;
  onSaved: () => void;
}

function EditPaymentModal({ payment, onClose, onSaved }: EditModalProps) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    concept: payment.concept,
    amount: payment.amount.toString(),
    paymentMethod: payment.paymentMethod,
    status: payment.status,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/payments/${payment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("pilates_token") ?? ""}`,
        },
        body: JSON.stringify({
          concept: form.concept,
          amount: parseFloat(form.amount),
          paymentMethod: form.paymentMethod,
          status: form.status,
        }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Pago actualizado correctamente." });
      onSaved();
      onClose();
    } catch {
      toast({ title: "Error al guardar el pago.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" />
            <span className="font-semibold text-gray-900">Editar pago #{payment.id}</span>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Concepto</label>
            <input
              value={form.concept}
              onChange={e => setForm(f => ({ ...f, concept: e.target.value }))}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Monto (B/.)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Estado</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="paid">Pagado</option>
                <option value="pending">Pendiente</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Método de pago</label>
            <select
              value={form.paymentMethod}
              onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 text-sm text-gray-500">
            <span className="font-medium text-gray-700">Cliente:</span> {payment.clientName ?? `#${payment.clientId}`}
          </div>
        </div>

        <div className="flex gap-2 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-10 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────

interface DeleteDialogProps {
  payment: Payment;
  onClose: () => void;
  onDeleted: () => void;
}

function DeletePaymentDialog({ payment, onClose, onDeleted }: DeleteDialogProps) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/payments/${payment.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("pilates_token") ?? ""}` },
      });
      if (!res.ok) throw new Error();
      toast({ title: "Pago eliminado." });
      onDeleted();
      onClose();
    } catch {
      toast({ title: "Error al eliminar el pago.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Eliminar pago</p>
            <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-gray-50 text-sm space-y-1">
          <div><span className="text-gray-500">Concepto:</span> <span className="font-medium">{payment.concept}</span></div>
          <div><span className="text-gray-500">Monto:</span> <span className="font-bold text-gray-900">B/. {payment.amount.toFixed(2)}</span></div>
          <div><span className="text-gray-500">Cliente:</span> <span className="font-medium">{payment.clientName ?? `#${payment.clientId}`}</span></div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 h-10 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const canRegister = user?.role === "ADMIN" || user?.role === "RECEPTIONIST";

  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [methodFilter, setMethodFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (methodFilter !== "Todos") params.set("method", methodFilter);
      if (statusFilter !== "Todos") params.set("status", statusFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const token = localStorage.getItem("pilates_token") ?? "";
      const headers = { Authorization: `Bearer ${token}` };

      const [payRes, sumRes] = await Promise.all([
        fetch(`${API_BASE}/payments?${params.toString()}`, { headers }),
        fetch(`${API_BASE}/payments/summary`, { headers }),
      ]);
      if (payRes.ok) setPayments(await payRes.json());
      if (sumRes.ok) setSummary(await sumRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Build summary cards from byMethod (dynamic) + fixed totals
  const summaryCards = summary
    ? [
        { label: "Total hoy", value: summary.totalHoy, icon: DollarSign, cls: "text-violet-600 bg-violet-50" },
        { label: "Efectivo", value: summary.byMethod?.["Efectivo"] ?? 0, icon: Banknote, cls: "text-emerald-600 bg-emerald-50" },
        { label: "Yappy", value: summary.byMethod?.["Yappy"] ?? 0, icon: Smartphone, cls: "text-green-600 bg-green-50" },
        { label: "Visa / Mastercard", value: (summary.byMethod?.["Visa"] ?? 0) + (summary.byMethod?.["Mastercard"] ?? 0), icon: CreditCard, cls: "text-indigo-600 bg-indigo-50" },
        { label: "PayPal / PagueloFacil", value: (summary.byMethod?.["PayPal"] ?? 0) + (summary.byMethod?.["PagueloFacil"] ?? 0), icon: CreditCard, cls: "text-blue-600 bg-blue-50" },
        { label: "Transferencia", value: summary.byMethod?.["Transferencia"] ?? 0, icon: ArrowUpRight, cls: "text-orange-600 bg-orange-50" },
        { label: "Pendiente", value: summary.pendiente, icon: DollarSign, cls: "text-amber-600 bg-amber-50" },
      ]
    : [];

  const colSpan = isAdmin ? 8 : 7;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Caja y Pagos</h1>
          <p className="text-sm text-muted-foreground mt-1">Registro de cobros · {new Date().toLocaleDateString("es-PA", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 h-9 px-4 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
          {canRegister && (
            <button
              onClick={() => setShowRegister(true)}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Registrar Cobro
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {summaryCards.map(c => (
          <div key={c.label} className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
            <div className={`h-8 w-8 rounded-xl ${c.cls.split(" ")[1]} flex items-center justify-center mb-2.5`}>
              <c.icon className={`h-4 w-4 ${c.cls.split(" ")[0]}`} />
            </div>
            <div className="text-lg font-bold text-foreground">B/. {c.value.toFixed(2)}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Filtros</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Método</label>
            <select
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {METHOD_OPTS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Estado</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={fetchData}
            className="h-9 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Aplicar
          </button>
          <button
            onClick={() => { setMethodFilter("Todos"); setStatusFilter("Todos"); setDateFrom(""); setDateTo(""); }}
            className="h-9 px-4 rounded-xl border border-border text-sm text-muted-foreground hover:bg-accent transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Payments table */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Fecha</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Cliente</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Concepto / Plan</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Método</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Cajero/a</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Monto</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground">Estado</th>
                {isAdmin && <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: colSpan }).map((_, j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="py-16 text-center text-muted-foreground text-sm">
                    No hay pagos registrados con estos filtros
                  </td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap text-xs">
                      {new Date(p.createdAt).toLocaleDateString("es-PA", { day: "2-digit", month: "short", year: "numeric" })}
                      <div className="text-[10px] text-muted-foreground/60">
                        {new Date(p.createdAt).toLocaleTimeString("es-PA", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground text-sm">{p.clientName ?? `Cliente #${p.clientId}`}</div>
                      {p.clientEmail && <div className="text-xs text-muted-foreground">{p.clientEmail}</div>}
                    </td>
                    <td className="py-3 px-4 text-foreground/80 text-sm max-w-[180px]">
                      <div className="truncate">{p.concept}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${methodColor(p.paymentMethod)}`}>
                        {methodIcon(p.paymentMethod)}
                        {p.paymentMethod}
                        {p.cardBrand && p.cardLast4 && (
                          <span className="opacity-70">•••• {p.cardLast4}</span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{p.chargedBy}</td>
                    <td className="py-3 px-4 text-right font-bold text-foreground">B/. {p.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        p.status === "paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {p.status === "paid" ? "Pagado" : "Pendiente"}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingPayment(p)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Editar pago"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingPayment(p)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar pago"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {payments.length > 0 && (
          <div className="px-4 py-3 border-t border-border/30 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{payments.length} registros</span>
            <span className="text-sm font-bold text-foreground">
              Total pagado: B/. {payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Modals */}
      {showRegister && user && (
        <RegisterPaymentModal
          currentUser={{ name: user.name ?? user.email, email: user.email }}
          onClose={() => setShowRegister(false)}
          onSaved={fetchData}
        />
      )}
      {editingPayment && (
        <EditPaymentModal
          payment={editingPayment}
          onClose={() => setEditingPayment(null)}
          onSaved={fetchData}
        />
      )}
      {deletingPayment && (
        <DeletePaymentDialog
          payment={deletingPayment}
          onClose={() => setDeletingPayment(null)}
          onDeleted={fetchData}
        />
      )}
    </div>
  );
}
