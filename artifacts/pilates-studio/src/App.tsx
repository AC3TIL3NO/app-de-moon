import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Classes from "@/pages/classes";
import Clients from "@/pages/clients";
import Calendar from "@/pages/calendar";
import Instructors from "@/pages/instructors";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route>
        <AppLayout>
          <Switch>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/classes" component={Classes} />
            <Route path="/clients" component={Clients} />
            <Route path="/calendar" component={Calendar} />
            <Route path="/instructors" component={Instructors} />
            <Route>
              <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center">
                <div className="h-16 w-16 bg-muted rounded-2xl mb-4 flex items-center justify-center text-2xl font-bold text-muted-foreground/50">404</div>
                <h2 className="text-xl font-semibold mb-2">Página no encontrada</h2>
                <p>La sección que buscas no existe o ha sido movida.</p>
              </div>
            </Route>
          </Switch>
        </AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
