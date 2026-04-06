import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  useGetDashboardSummary,
  useGetTodayClasses,
  useGetRecentClients,
  useGetDashboardOccupancy,
  useGetDashboardTopClients,
  useGetDashboardWeeklyAttendance,
  useGetDashboardPopularClasses,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Users, CalendarClock, TicketCheck, UserPlus, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

const PIE_COLORS = ["hsl(var(--primary))", "#a78bfa", "#34d399", "#fbbf24", "#f87171", "#60a5fa"];

function useCountUp(target: number | undefined, duration = 800) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (target === undefined) return;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(progress * target));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return value;
}

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: todayClasses, isLoading: loadingClasses } = useGetTodayClasses();
  const { data: recentClients, isLoading: loadingClients } = useGetRecentClients();
  const { data: occupancy, isLoading: loadingOccupancy } = useGetDashboardOccupancy();
  const { data: topClients, isLoading: loadingTopClients } = useGetDashboardTopClients();
  const { data: weeklyAttendance, isLoading: loadingWeekly } = useGetDashboardWeeklyAttendance();
  const { data: popularClasses, isLoading: loadingPopular } = useGetDashboardPopularClasses();

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Resumen de tu estudio hoy.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Clases de Hoy" value={summary?.todayClassesCount} icon={CalendarClock} loading={loadingSummary} />
        <StatCard title="Clientes Activos" value={summary?.activeClientsCount} icon={Users} loading={loadingSummary} />
        <StatCard title="Reservas Pendientes" value={summary?.pendingReservationsCount} icon={TicketCheck} loading={loadingSummary} />
        <StatCard title="Cupos Disponibles" value={summary?.availableSpotsCount} icon={UserPlus} loading={loadingSummary} />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-5 shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Clases de Hoy</CardTitle>
              <CardDescription>Próximas clases programadas para el día de hoy.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link href="/classes">Ver todas <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loadingClasses ? (
              <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : todayClasses?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                No hay clases programadas para hoy.
              </div>
            ) : (
              <div className="space-y-4">
                {todayClasses?.map((cls) => (
                  <motion.div
                    key={cls.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-center">
                        <div className="text-sm font-medium">{cls.time}</div>
                        <div className="text-xs text-muted-foreground">{cls.duration} min</div>
                      </div>
                      <div className="h-10 w-[1px] bg-border/50 hidden sm:block" />
                      <div>
                        <div className="font-medium">{cls.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <span>{cls.instructor}</span><span>•</span><span>{cls.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div className="hidden sm:block">
                        <div className="text-sm font-medium">{cls.enrolled} / {cls.capacity}</div>
                        <div className="text-xs text-muted-foreground">Inscritos</div>
                      </div>
                      <Badge variant="secondary" className={
                        cls.status === 'Activa' ? 'bg-primary/10 text-primary hover:bg-primary/20' :
                        cls.status === 'Completa' ? 'bg-orange-500/10 text-orange-600' :
                        'bg-muted text-muted-foreground'
                      }>{cls.status}</Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader><CardTitle>Calendario</CardTitle></CardHeader>
            <CardContent>
              <Calendar mode="single" selected={new Date()} className="rounded-md border-0 w-full"
                classNames={{
                  months: "w-full", month: "w-full space-y-4",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex w-full justify-between",
                  row: "flex w-full mt-2 justify-between",
                }}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader><CardTitle>Nuevos Clientes</CardTitle></CardHeader>
            <CardContent>
              {loadingClients ? (
                <div className="space-y-4">{[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div>
                  </div>
                ))}</div>
              ) : recentClients?.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">No hay clientes recientes.</div>
              ) : (
                <div className="space-y-6">
                  {recentClients?.map((client) => (
                    <div key={client.id} className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium shrink-0">
                        {client.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{client.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{client.plan}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Asistencia Semanal</CardTitle>
            <CardDescription>Clases marcadas como asistidas por día de la semana.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {loadingWeekly ? <Skeleton className="h-52 w-full rounded-xl" /> :
              !weeklyAttendance || weeklyAttendance.every(d => d.attended === 0) ? (
                <div className="h-52 flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-xl bg-muted/20">
                  Sin datos de asistencia esta semana.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={weeklyAttendance} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                      formatter={(v: number) => [v, "Asistencias"]}
                      cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 4" }}
                    />
                    <Line type="monotone" dataKey="attended" stroke="hsl(var(--primary))" strokeWidth={2.5}
                      dot={{ fill: "hsl(var(--primary))", r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )
            }
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Clases Populares</CardTitle>
            <CardDescription>Reservas por tipo de clase.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {loadingPopular ? <Skeleton className="h-52 w-full rounded-xl" /> :
              !popularClasses || popularClasses.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-xl bg-muted/20">
                  Sin datos de reservas disponibles.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie data={popularClasses} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={75}
                      innerRadius={38} paddingAngle={3} label={false}
                    >
                      {popularClasses.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                      formatter={(v: number, name: string) => [v + " reservas", name]}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }} />
                  </PieChart>
                </ResponsiveContainer>
              )
            }
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Ocupación por Clase</CardTitle>
            <CardDescription>Porcentaje de cupos ocupados por clase.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {loadingOccupancy ? <Skeleton className="h-52 w-full rounded-xl" /> :
              !occupancy || occupancy.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-xl bg-muted/20">
                  Sin datos de ocupación disponibles.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(210, occupancy.length * 36)}>
                  <BarChart data={occupancy} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                    <YAxis type="category" dataKey="className" width={100} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                      formatter={(v: number) => [`${v}%`, "Ocupación"]}
                      cursor={{ fill: "hsl(var(--accent))" }}
                    />
                    <Bar dataKey="fillPct" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Top Clientes</CardTitle>
            <CardDescription>Clientes con más clases asistidas.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {loadingTopClients ? <Skeleton className="h-52 w-full rounded-xl" /> :
              !topClients || topClients.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-muted-foreground text-sm border border-dashed rounded-xl bg-muted/20">
                  Sin datos de asistencia disponibles.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={topClients} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="clientName" width={90} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                      formatter={(v: number) => [v, "Clases"]}
                      cursor={{ fill: "hsl(var(--accent))" }}
                    />
                    <Bar dataKey="classesAttended" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} maxBarSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon: Icon, loading }: { title: string; value?: number; icon: any; loading: boolean }) {
  const count = useCountUp(loading ? undefined : (value ?? 0));
  return (
    <motion.div whileHover={{ y: -2, boxShadow: "0 8px 24px -4px rgba(0,0,0,0.1)" }} transition={{ duration: 0.2 }}>
      <Card className="shadow-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-3xl font-bold tracking-tight text-foreground">{count}</div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
