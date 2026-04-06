import React from "react";
import { Link, useLocation } from "wouter";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LayoutDashboard, Users, CalendarDays, CalendarClock, UserSquare2, LogOut } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Clases", href: "/classes", icon: CalendarClock },
    { name: "Clientes", href: "/clients", icon: Users },
    { name: "Calendario", href: "/calendar", icon: CalendarDays },
    { name: "Instructores", href: "/instructors", icon: UserSquare2 },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-[100dvh] w-full bg-muted/30">
        <Sidebar className="border-r border-border/50 bg-card">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <span className="font-semibold text-lg">P</span>
              </div>
              <span className="text-xl font-semibold tracking-tight">Pilates Studio</span>
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
                        className="my-1 rounded-xl transition-all duration-200 hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=true]:font-medium py-6 px-4"
                      >
                        <Link href={item.href} className="flex items-center gap-4">
                          <item.icon className="h-5 w-5" />
                          <span className="text-base">{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <div className="mt-auto p-4 border-t border-border/50">
            <SidebarMenuButton asChild className="w-full justify-start rounded-xl text-muted-foreground hover:text-foreground py-6 px-4">
              <Link href="/login" className="flex items-center gap-4">
                <LogOut className="h-5 w-5" />
                <span className="text-base">Cerrar sesión</span>
              </Link>
            </SidebarMenuButton>
          </div>
        </Sidebar>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <header className="h-20 flex items-center px-8 border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10 shrink-0">
            <SidebarTrigger className="mr-4 lg:hidden" />
            <div className="ml-auto flex items-center gap-6">
              <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-medium text-sm">
                AD
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-8">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
