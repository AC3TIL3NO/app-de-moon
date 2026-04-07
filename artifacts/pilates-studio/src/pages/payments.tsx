import { useState, useEffect } from "react";
import { DollarSign, CreditCard, Banknote, Smartphone, ArrowUpRight, Filter, RefreshCw, Pencil, Trash2, X, Save } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "").replace(/\/pilates-studio$/, "") + "/api";

interface Payment {
  id: number;
  clientId: number;
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
}

const METHOD_OPTS = ["Todos", "PayPal", "Yappy", "Efectivo", "Transferencia", "Otro"];
const STATUS_OPTS = ["Todos", "paid", "pending"];
const PAYMENT_METHODS = ["Efectivo", "Yappy", "PayPal", "Transferencia", "Tarjeta"];

function methodLabel(m: string) {
  return m === "PayPal" ? "Tarjeta / PayPal" : m;
}

function methodIcon(m: string) {
  if (m === "Efectivo") return <Banknote className="h-4 w-4 text-emerald-500" />;
  if (m === "Yappy") return <Smartphone className="h-4 w-4 text-green-600" />;
  if (m === "PayPal" || m === "Tarjeta") return <CreditCard className="h-4 w-4 text-blue-500" />;
  if (m === "Transferencia") return <ArrowUpRight className="h-4 w-4 text-indigo-500" />;
  return <DollarSign className="h-4 w-4 text-gray-400" />;
}

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

export default function PaymentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [methodFilter, setMethodFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);

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

  const SUMMARY_CARDS = summary
    ? [
        { label: "Total hoy", value: summary.totalHoy, icon: DollarSign, color: "text-violet-600", bg: "bg-violet-50" },
        { label: "Tarjeta", value: summary.tarjeta, icon: CreditCard, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Efectivo", value: summary.efectivo, icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Yappy", value: summary.yappy, icon: Smartphone, color: "text-green-600", bg: "bg-green-50" },
        { label: "Transferencia", value: summary.transferencia, icon: ArrowUpRight, color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "Pendiente", value: summary.pendiente, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
      ]
    : [];

  const colSpan = isAdmin ? 8 : 7;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Caja y Pagos</h1>
          <p className="text-sm text-muted-foreground mt-1">Registro de todos los pagos del estudio</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 h-9 px-4 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {SUMMARY_CARDS.map(c => (
          <div key={c.label} className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
            <div className={`h-9 w-9 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <div className="text-xl font-bold text-foreground">B/. {c.value.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{c.label}</div>
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
            <label className="text-xs text-muted-foreground mb-1 block">Método de pago</label>
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
            Aplicar filtros
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
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Concepto</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Método</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Cajera</th>
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
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString("es-PA", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{p.clientName ?? `Cliente #${p.clientId}`}</div>
                      {p.clientEmail && <div className="text-xs text-muted-foreground">{p.clientEmail}</div>}
                    </td>
                    <td className="py-3 px-4 text-foreground/80">{p.concept}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {methodIcon(p.paymentMethod)}
                        <span className="text-foreground/80">
                          {methodLabel(p.paymentMethod)}
                          {p.cardBrand && p.cardLast4 && (
                            <span className="text-muted-foreground ml-1">
                              · {p.cardBrand.charAt(0).toUpperCase() + p.cardBrand.slice(1)} •••• {p.cardLast4}
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{p.chargedBy}</td>
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
              Total: B/. {payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0).toFixed(2)}
            </span>
          </div>
        )}
      </div>

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
