import { ClerkProvider, SignIn, SignUp, useAuth } from "@clerk/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Switch, Route, Redirect, Router as WouterRouter, useLocation } from "wouter";
import LandingPage from "@/pages/landing";
import ClientDashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import { ClientProvider } from "@/contexts/clientContext";
import logoBlack from "@assets/Moon_Pilates_Studio_Logo_TEXTO_NEGRO_1775503679484.png";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  // Handle absolute URLs (e.g. https://domain.com/landing/dashboard → /dashboard)
  let p = path;
  try {
    const url = new URL(path);
    p = url.pathname + url.search + url.hash;
  } catch {
    // Not an absolute URL, use as-is
  }
  return basePath && p.startsWith(basePath)
    ? p.slice(basePath.length) || "/"
    : p;
}

function HomeRedirect() {
  return <LandingPage />;
}

function AuthPageShell({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="mb-6">
        <img src={logoBlack} alt="Moon Pilates Studio" className="h-10 w-auto object-contain" />
      </div>
      {children}
      <button
        onClick={() => navigate("/")}
        className="mt-5 text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
      >
        ← Volver a la página principal
      </button>
    </div>
  );
}

function SignInPage() {
  return (
    <AuthPageShell>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/dashboard`}
      />
    </AuthPageShell>
  );
}

function SignUpPage() {
  return (
    <AuthPageShell>
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/dashboard`}
      />
    </AuthPageShell>
  );
}

function DashboardWithAuth() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) return <Redirect to="/" />;

  return <ClientDashboard />;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey ?? ""}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClientProvider>
            <Switch>
              <Route path="/" component={HomeRedirect} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route path="/dashboard" component={DashboardWithAuth} />
              <Route component={NotFound} />
            </Switch>
          </ClientProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
