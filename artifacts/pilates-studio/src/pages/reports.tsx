import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  useGetRevenueReport,
  useGetNewClientsReport,
  useGetCancellationsReport,
  useGetOccupancyReport,
  useGetMembershipsReport,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";
import { FileSpreadsheet, Printer } from "lucide-react";

const TABS = ["Mes Actual", "Últimos 3 Meses", "Este Año"];

const MONTH_SHORT: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseMonthStr(m: string): Date | null {
  const parts = m.trim().split(" ");
  if (parts.length < 2) return null;
  const mon = MONTH_SHORT[parts[0]];
  const year = parseInt(parts[1], 10);
  if (mon === undefined || isNaN(year)) return null;
  return new Date(year, mon, 1);
}

function filterByTab<T extends { month: string }>(data: T[], tab: number): T[] {
  // Si 'data' no es array, devolvemos array vacío de una vez
  if (!Array.isArray(data)) return [];
  
  if (!data.length) return data;
  const now = new Date();
  return data.filter(row => {
    const d = parseMonthStr(row.month);
    if (!d) return true;
    if (tab === 0) {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (tab === 1) {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return d >= threeMonthsAgo && d <= now;
    }
    return d.getFullYear() === now.getFullYear();
  });
}

function formatCurrency(v: number) {
  return `B/. ${v.toFixed(2)}`;
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map(r =>
      headers.map(h => {
        const val = r[h];
        const str = val === null || val === undefined ? "" : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState(2);

  const { data: revenueRaw, isLoading: loadingRevenue } = useGetRevenueReport();
  const { data: newClientsRaw, isLoading: loadingClients } = useGetNewClientsReport();
  const { data: cancellationsRaw, isLoading: loadingCancellations } = useGetCancellationsReport();
  const { data: occupancy, isLoading: loadingOccupancy } = useGetOccupancyReport();
  const { data: membershipsRaw, isLoading: loadingMemberships } = useGetMembershipsReport();

  const revenue = useMemo(() => filterByTab(revenueRaw ?? [], activeTab), [revenueRaw, activeTab]);
  const newClients = useMemo(() => filterByTab(newClientsRaw ?? [], activeTab), [newClientsRaw, activeTab]);
  const cancellations = useMemo(() => filterByTab(cancellationsRaw ?? [], activeTab), [cancellationsRaw, activeTab]);
  const memberships = useMemo(() => filterByTab(membershipsRaw ?? [], activeTab), [membershipsRaw, activeTab]);

  const totalRevenue = revenue.reduce((s, r) => s + r.total, 0);
  const totalClients = newClients.reduce((s, r) => s + r.count, 0);
  const totalCancellations = cancellations.reduce((s, r) => s + r.cancelled, 0);
  const totalMemberships = memberships.reduce((s, r) => s + r.count, 0);

  const handleExportCsv = () => {
    if (revenue.length) {
      downloadCsv("ingresos.csv", revenue.map(r => ({
        Mes: r.month,
        "Ingresos (B/.)": r.total.toFixed(2),
        "Pagos": r.count,
      })));
    }
    if (newClients.length) {
      downloadCsv("nuevos-clientes.csv", newClients.map(r => ({
        Mes: r.month,
        "Nuevos Clientes": r.count,
      })));
    }
    if (cancellations.length) {
      downloadCsv("cancelaciones.csv", cancellations.map(r => ({
        Mes: r.month,
        "Reservas Totales": r.total,
        "Cancelaciones": r.cancelled,
      })));
    }
    if (memberships.length) {
      downloadCsv("membresias.csv", memberships.map(r => ({
        Mes: r.month,
        "Membresías": r.count,
        "Ingresos (B/.)": r.revenue.toFixed(2),
      })));
    }
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Reportes</h1>
          <p className="text-muted-foreground mt-2">Análisis completo del desempeño de tu estudio.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === i
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl"
              onClick={handleExportCsv}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel / CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl"
              onClick={handleExportPdf}
            >
              <Printer className="h-4 w-4" />
              Imprimir / PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Ingresos Totales" value={formatCurrency(totalRevenue)} loading={loadingRevenue} color="text-primary" />
        <SummaryCard title="Nuevos Clientes" value={totalClients.toString()} loading={loadingClients} color="text-emerald-600" />
        <SummaryCard title="Cancelaciones" value={totalCancellations.toString()} loading={loadingCancellations} color="text-orange-600" />
        <SummaryCard title="Membresías" value={totalMemberships.toString()} loading={loadingMemberships} color="text-amber-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Ingresos por Mes</CardTitle>
            <CardDescription>Ingresos totales de membresías pagadas — {TABS[activeTab]}.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRevenue ? <Skeleton className="h-52 w-full rounded-xl" /> :
              !revenue.length ? <EmptyState /> : (
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={revenue} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `B/.${v}`} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(v: number) => [formatCurrency(v), "Ingresos"]} />
                    <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#revenueGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )
            }
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Nuevos Clientes</CardTitle>
            <CardDescription>Clientes registrados por mes — {TABS[activeTab]}.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingClients ? <Skeleton className="h-52 w-full rounded-xl" /> :
              !newClients.length ? <EmptyState /> : (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={newClients} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(v: number) => [v, "Clientes"]} />
                    <Bar dataKey="count" fill="#34d399" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Cancelaciones</CardTitle>
            <CardDescription>Reservas confirmadas vs canceladas — {TABS[activeTab]}.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCancellations ? <Skeleton className="h-52 w-full rounded-xl" /> :
              !cancellations.length ? <EmptyState /> : (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={cancellations} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" name="Reservas" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="cancelled" fill="#f87171" name="Canceladas" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Ocupación por Horario</CardTitle>
            <CardDescription>Porcentaje de ocupación agrupado por hora del día.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOccupancy ? <Skeleton className="h-52 w-full rounded-xl" /> :
              !occupancy?.length ? <EmptyState /> : (
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={occupancy} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(v: number) => [`${v}%`, "Ocupación"]} />
                    <Line type="monotone" dataKey="occupancyPct" stroke="#fbbf24" strokeWidth={2.5} dot={{ fill: "#fbbf24", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )
            }
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Membresías Vendidas</CardTitle>
              <CardDescription>Ingresos y cantidad de membresías por mes — {TABS[activeTab]}.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingMemberships ? <Skeleton className="h-52 w-full rounded-xl" /> :
            !memberships.length ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={memberships} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="membGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} formatter={(v: number, k: string) => [k === "revenue" ? formatCurrency(v) : v, k === "revenue" ? "Ingresos" : "Ventas"]} />
                  <Area type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2.5} fill="url(#membGrad)" name="Membresías" />
                </AreaChart>
              </ResponsiveContainer>
            )
          }
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SummaryCard({ title, value, loading, color }: { title: string; value: string; loading: boolean; color: string }) {
  return (
    <Card className="shadow-sm border-border/50">
      <CardContent className="pt-6">
        {loading ? <Skeleton className="h-8 w-20" /> : (
          <div className={`text-3xl font-bold tracking-tight ${color}`}>{value}</div>
        )}
        <div className="text-sm text-muted-foreground mt-1">{title}</div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="h-52 flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-xl bg-muted/20">
      Sin datos para este período.
    </div>
  );
}
