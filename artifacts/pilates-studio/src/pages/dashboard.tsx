import { useGetDashboardSummary, useGetTodayClasses, useGetRecentClients } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Users, CalendarClock, TicketCheck, UserPlus, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: todayClasses, isLoading: loadingClasses } = useGetTodayClasses();
  const { data: recentClients, isLoading: loadingClients } = useGetRecentClients();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Resumen de tu estudio hoy.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Clases de Hoy" 
          value={summary?.todayClassesCount} 
          icon={CalendarClock} 
          loading={loadingSummary} 
        />
        <StatCard 
          title="Clientes Activos" 
          value={summary?.activeClientsCount} 
          icon={Users} 
          loading={loadingSummary} 
        />
        <StatCard 
          title="Reservas Pendientes" 
          value={summary?.pendingReservationsCount} 
          icon={TicketCheck} 
          loading={loadingSummary} 
        />
        <StatCard 
          title="Cupos Disponibles" 
          value={summary?.availableSpotsCount} 
          icon={UserPlus} 
          loading={loadingSummary} 
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-5 shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Clases de Hoy</CardTitle>
              <CardDescription>Próximas clases programadas para el día de hoy.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link href="/classes">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loadingClasses ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : todayClasses?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                No hay clases programadas para hoy.
              </div>
            ) : (
              <div className="space-y-4">
                {todayClasses?.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-center">
                        <div className="text-sm font-medium">{cls.time}</div>
                        <div className="text-xs text-muted-foreground">{cls.duration} min</div>
                      </div>
                      <div className="h-10 w-[1px] bg-border/50 hidden sm:block" />
                      <div>
                        <div className="font-medium">{cls.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <span>{cls.instructor}</span>
                          <span>•</span>
                          <span>{cls.type}</span>
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
                        cls.status === 'Completa' ? 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20' : 
                        'bg-muted text-muted-foreground'
                      }>
                        {cls.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle>Calendario</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar 
                mode="single"
                selected={new Date()}
                className="rounded-md border-0 w-full"
                classNames={{
                  months: "w-full",
                  month: "w-full space-y-4",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex w-full justify-between",
                  row: "flex w-full mt-2 justify-between",
                }}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle>Nuevos Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingClients ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentClients?.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No hay clientes recientes.
                </div>
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
    </div>
  );
}

function StatCard({ title, value, icon: Icon, loading }: { title: string, value?: number, icon: any, loading: boolean }) {
  return (
    <Card className="shadow-sm border-border/50 transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-bold tracking-tight text-foreground">{value ?? 0}</div>
        )}
      </CardContent>
    </Card>
  );
}
