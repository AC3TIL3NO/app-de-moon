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
  CalendarDays,
  CalendarClock,
  UserSquare2,
  CreditCard,
  LogOut,
  BarChart3,
  Settings,
  ChevronRight,
  Receipt,
} from "lucide-react";
import { useAuth } from "@/contexts/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  RECEPTIONIST: "Recepcionista",
  INSTRUCTOR: "Instructor",
};

const ALL_NAV = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "RECEPTIONIST", "INSTRUCTOR"] },
  { name: "Clases", href: "/classes", icon: CalendarClock, roles: ["ADMIN", "RECEPTIONIST", "INSTRUCTOR"] },
  { name: "Clientes", href: "/clients", icon: Users, roles: ["ADMIN", "RECEPTIONIST"] },
  { name: "Calendario", href: "/calendar", icon: CalendarDays, roles: ["ADMIN", "RECEPTIONIST", "INSTRUCTOR"] },
  { name: "Instructores", href: "/instructors", icon: UserSquare2, roles: ["ADMIN"] },
  { name: "Membresías", href: "/memberships", icon: CreditCard, roles: ["ADMIN", "RECEPTIONIST"] },
  { name: "Caja / Pagos", href: "/payments", icon: Receipt, roles: ["ADMIN", "RECEPTIONIST"] },
  { name: "Reportes", href: "/reports", icon: BarChart3, roles: ["ADMIN"] },
  { name: "Configuración", href: "/settings", icon: Settings, roles: ["ADMIN"] },
];

const BREADCRUMB_MAP: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/classes": "Clases",
  "/clients": "Clientes",
  "/calendar": "Calendario",
  "/instructors": "Instructores",
  "/memberships": "Membresías",
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

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const role = user?.role ?? "INSTRUCTOR";
  const navigation = ALL_NAV.filter(item => item.roles.includes(role));
  const currentLabel = BREADCRUMB_MAP[location] ?? "";

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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shrink-0">
                <span className="font-semibold text-lg">P</span>
              </div>
              <div className="overflow-hidden">
                <div className="text-base font-semibold tracking-tight truncate">
                  {user?.studioName ?? "Pilates Studio"}
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
    </SidebarProvider>
  );
}
