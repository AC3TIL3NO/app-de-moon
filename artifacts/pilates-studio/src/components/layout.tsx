import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  CreditCard,
  LogOut,
  BarChart3,
  Settings,
  ChevronRight,
  Receipt,
  BadgeDollarSign,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useStudio } from "@/contexts/studio";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListClients, useListMemberships } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "").replace(/\/pilates-studio$/, "") + "/api";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  RECEPTIONIST: "Recepcionista",
  INSTRUCTOR: "Instructor",
};

const ALL_NAV = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "RECEPTIONIST", "INSTRUCTOR"] },
  { name: "Clases", href: "/classes", icon: CalendarClock, roles: ["ADMIN", "RECEPTIONIST", "INSTRUCTOR"] },
  { name: "Clientes", href: "/clients", icon: Users, roles: ["ADMIN", "RECEPTIONIST"] },
  { name: "Membresías", href: "/memberships", icon: CreditCard, roles: ["ADMIN", "RECEPTIONIST"] },
  { name: "Caja / Pagos", href: "/payments", icon: Receipt, roles: ["ADMIN", "RECEPTIONIST"] },
  { name: "Reportes", href: "/reports", icon: BarChart3, roles: ["ADMIN"] },
  { name: "Configuración", href: "/settings", icon: Settings, roles: ["ADMIN"] },
];

const BREADCRUMB_MAP: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/classes": "Clases",
  "/clients": "Clientes",
  "/memberships": "Membresías",
  "/payments": "Caja / Pagos",
  "/reports": "Reportes",
  "/settings": "Configuración",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map(p => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function CobrosModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { settings } = useStudio();
  const { toast } = useToast();
  const { data: clients } = useListClients();
  const { data: plans } = useListMemberships();

  const paymentMethods = settings?.paymentMethods ?? [
    "Efectivo", "Yappy", "Visa", "Mastercard", "PayPal", "PagueloFacil", "Transferencia",
  ];

  const [clientId, setClientId] = useState("");
  const [planId, setPlanId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(() => paymentMethods[0] ?? "Efectivo");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const selectedPlan = plans?.find(p => String(p.id) === planId);
  const selectedClient = clients?.find(c => String(c.id) === clientId);

  async function handleCobrar() {
    if (!clientId || !planId) {
      toast({ title: "Selecciona cliente y plan.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("pilates_token");
      const res = await fetch(`${API_BASE}/payments/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          clientId: Number(clientId),
          membershipId: Number(planId),
          concept: `Membresía ${selectedPlan?.name} — ${selectedClient?.name}`,
          amount: selectedPlan ? (selectedPlan.promoPrice ?? selectedPlan.price) : 0,
          paymentMethod,
          chargedBy: user?.name ?? "Recepción",
          activateMembership: true,
        }),
      });
      if (!res.ok) throw new Error("Error al registrar cobro");
      setDone(true);
      toast({ title: "Cobro registrado correctamente." });
    } catch {
      toast({ title: "Error al registrar el cobro.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setClientId("");
    setPlanId("");
    setPaymentMethod(paymentMethods[0] ?? "Efectivo");
    setDone(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5 text-primary" />
            Registrar Cobro
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="py-8 flex flex-col items-center gap-3 text-center">
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <p className="font-semibold text-foreground">Cobro registrado</p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{selectedClient?.name}</span> — {selectedPlan?.name}<br />
              <span className="text-primary font-bold">B/. {selectedPlan?.price?.toFixed(2)}</span> · {paymentMethod}
            </p>
            <Button className="mt-2 w-full" onClick={handleClose}>Cerrar</Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/40">
              <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                {getInitials(user?.name ?? "?")}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cajero/a</p>
                <p className="text-sm font-semibold">{user?.name}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente…" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Plan de membresía</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plan…" />
                </SelectTrigger>
                <SelectContent>
                  {plans?.filter(p => p.active).map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} — B/. {p.promoPrice ?? p.price}
                      {p.promoPrice != null ? ` (promo, orig. B/. ${p.price})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Método de pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPlan && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-center">
                <p className="text-xs text-muted-foreground mb-0.5">Total a cobrar</p>
                <p className="text-2xl font-black text-primary">B/. {selectedPlan.price?.toFixed(2)}</p>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleCobrar}
              disabled={saving || !clientId || !planId}
            >
              {saving ? "Registrando…" : "Registrar cobro"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { settings } = useStudio();
  const [cobrosOpen, setCobrosOpen] = useState(false);

  const role = user?.role ?? "INSTRUCTOR";
  const navigation = ALL_NAV.filter(item => item.roles.includes(role));
  const currentLabel = BREADCRUMB_MAP[location] ?? "";

  const studioName = settings?.name ?? user?.studioName ?? "Pilates Studio";
  const logoUrl = settings?.logoUrl;
  const primaryColor = settings?.primaryColor ?? "#7C3AED";

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-[100dvh] w-full bg-muted/30">
        <Sidebar className="border-r border-border/50 bg-card">
          <SidebarHeader className="p-5">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm shrink-0 overflow-hidden"
                style={{ backgroundColor: logoUrl ? "transparent" : primaryColor }}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={studioName}
                    className="h-full w-full object-cover rounded-xl"
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = "none";
                      const parent = (e.target as HTMLElement).parentElement;
                      if (parent) {
                        parent.style.backgroundColor = primaryColor;
                        parent.innerHTML = `<span style="color:white;font-weight:600;font-size:1.125rem">${studioName.charAt(0).toUpperCase()}</span>`;
                      }
                    }}
                  />
                ) : (
                  <span className="font-semibold text-lg text-white">
                    {studioName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="overflow-hidden">
                <div className="text-base font-semibold tracking-tight truncate">
                  {studioName}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {ROLE_LABELS[role]}
                </div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.href}
                        className="my-0.5 rounded-xl transition-all duration-200 hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium py-5 px-4"
                      >
                        <Link href={item.href} className="flex items-center gap-3.5">
                          <item.icon className="h-[18px] w-[18px] shrink-0" />
                          <span className="text-[15px]">{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <div className="mt-auto p-4 border-t border-border/50">
            <SidebarMenuButton
              onClick={handleLogout}
              className="w-full justify-start rounded-xl text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive py-5 px-4 cursor-pointer transition-colors"
            >
              <LogOut className="h-[18px] w-[18px] mr-3.5 shrink-0" />
              <span className="text-[15px]">Cerrar sesión</span>
            </SidebarMenuButton>
          </div>
        </Sidebar>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <header className="h-16 flex items-center px-6 border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10 shrink-0 gap-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-1">
              <span>Inicio</span>
              {currentLabel && (
                <>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="text-foreground font-medium">{currentLabel}</span>
                </>
              )}
            </nav>

            {(role === "ADMIN" || role === "RECEPTIONIST") && (
              <Button
                size="sm"
                className="gap-2 font-semibold"
                onClick={() => setCobrosOpen(true)}
              >
                <BadgeDollarSign className="h-4 w-4" />
                Cobros
              </Button>
            )}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 hover:bg-accent transition-colors outline-none">
                    <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                      {getInitials(user.name)}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-foreground leading-none">{user.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{ROLE_LABELS[user.role]}</div>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                  <DropdownMenuLabel>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground font-normal mt-0.5">{user.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setLocation("/settings")}
                    className="gap-2 cursor-pointer rounded-lg"
                  >
                    <Settings className="h-4 w-4" />
                    Configuración
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="gap-2 text-destructive focus:text-destructive cursor-pointer rounded-lg"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </header>

          <main className="flex-1 overflow-auto p-7">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </main>
        </div>
      </div>

      <CobrosModal open={cobrosOpen} onClose={() => setCobrosOpen(false)} />
    </SidebarProvider>
  );
}
