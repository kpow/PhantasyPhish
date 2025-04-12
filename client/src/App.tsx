import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Profile from "@/pages/Profile";
import { SetlistProvider } from "./contexts/SetlistContext";
import { ScrollProvider } from "./contexts/ScrollContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Protected route component
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Check authentication status
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Show the component only if authenticated
  return isAuthenticated ? <Component /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SetlistProvider>
          <ScrollProvider>
            <Router />
            <Toaster />
          </ScrollProvider>
        </SetlistProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
