import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout";
import { AuthProvider, useAuth } from "@/contexts/auth";
import { StudioProvider } from "@/contexts/studio";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Classes from "@/pages/classes";
import Clients from "@/pages/clients";
import Memberships from "@/pages/memberships";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Payments from "@/pages/payments";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();
  if (!user) {
    return <Redirect to="/login" />;
  }
  return <>{children}</>;
}

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to="/dashboard" /> : <Login />}
      </Route>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route>
        <ProtectedRoute>
          <AppLayout>
            <Switch>
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/classes" component={Classes} />
              <Route path="/clients" component={Clients} />
              <Route path="/memberships" component={Memberships} />
              <Route path="/payments" component={Payments} />
              <Route path="/reports" component={Reports} />
              <Route path="/settings" component={Settings} />
              <Route>
                <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center">
                  <div className="h-16 w-16 bg-muted rounded-2xl mb-4 flex items-center justify-center text-2xl font-bold text-muted-foreground/50">
                    404
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Página no encontrada</h2>
                  <p>La sección que buscas no existe o ha sido movida.</p>
                </div>
              </Route>
            </Switch>
          </AppLayout>
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <StudioProvider>
              <Router />
            </StudioProvider>
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
