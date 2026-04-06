import { useState, useEffect } from "react";
import { DollarSign, CreditCard, Banknote, Smartphone, ArrowUpRight, Filter, RefreshCw } from "lucide-react";

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

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [methodFilter, setMethodFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (methodFilter !== "Todos") params.set("method", methodFilter);
      if (statusFilter !== "Todos") params.set("status", statusFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const [payRes, sumRes] = await Promise.all([
        fetch(`/api/payments?${params.toString()}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("pilates_token") ?? ""}` },
        }),
        fetch("/api/payments/summary", {
          headers: { Authorization: `Bearer ${localStorage.getItem("pilates_token") ?? ""}` },
        }),
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Caja y Pagos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registro de todos los pagos del estudio</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 h-9 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {SUMMARY_CARDS.map(c => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className={`h-9 w-9 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <div className="text-xl font-bold text-gray-900">${c.value.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Filtros</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Método de pago</label>
            <select
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            >
              {METHOD_OPTS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Estado</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
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
              className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={fetchData}
            className="h-9 px-5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
          >
            Aplicar filtros
          </button>
          <button
            onClick={() => { setMethodFilter("Todos"); setStatusFilter("Todos"); setDateFrom(""); setDateTo(""); }}
            className="h-9 px-4 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Payments table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Fecha</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Cliente</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Concepto</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Método</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Cajera</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground">Monto</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground text-sm">
                    No hay pagos registrados con estos filtros
                  </td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString("es-PA", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{p.clientName ?? `Cliente #${p.clientId}`}</div>
                      {p.clientEmail && <div className="text-xs text-gray-400">{p.clientEmail}</div>}
                    </td>
                    <td className="py-3 px-4 text-gray-700">{p.concept}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {methodIcon(p.paymentMethod)}
                        <span className="text-gray-700">
                          {methodLabel(p.paymentMethod)}
                          {p.cardBrand && p.cardLast4 && (
                            <span className="text-gray-400 ml-1">
                              · {p.cardBrand.charAt(0).toUpperCase() + p.cardBrand.slice(1)} •••• {p.cardLast4}
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{p.chargedBy}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">${p.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        p.status === "paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {p.status === "paid" ? "Pagado" : "Pendiente"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {payments.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{payments.length} registros</span>
            <span className="text-sm font-bold text-gray-900">
              Total: $
              {payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0).toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
