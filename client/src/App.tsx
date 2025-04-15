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
import VerifyEmail from "@/pages/VerifyEmail";
import ResendVerification from "@/pages/ResendVerification";
import Profile from "@/pages/Profile";
import MyPredictions from "@/pages/MyPredictions";
import AdminDashboard from "@/pages/AdminDashboard";
import Scoring from "@/pages/Scoring";
import TestTourShows from "@/pages/TestTourShows";
import { SetlistProvider } from "./contexts/SetlistContextRefactored";
import { ScrollProvider } from "./contexts/ScrollContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ConfigProvider } from "./contexts/ConfigContext";
import Layout from "@/components/layout/Layout";

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

// Admin-only route component
function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Check authentication and admin status
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        setLocation("/login");
      } else if (!user?.is_admin) {
        // Redirect to home if authenticated but not admin
        setLocation("/");
      }
    }
  }, [isAuthenticated, isLoading, user, setLocation]);

  // Show the component only if authenticated and is admin
  return isAuthenticated && user?.is_admin ? <Component /> : null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/reset-password/:token" component={ResetPassword} />
      <Route path="/verify-email/:token" component={VerifyEmail} />
      <Route path="/resend-verification" component={ResendVerification} />
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/my-predictions">
        <ProtectedRoute component={MyPredictions} />
      </Route>
      {/* Admin routes */}
      <Route path="/admin">
        <AdminRoute component={AdminDashboard} />
      </Route>
      <Route path="/admin/scoring">
        <AdminRoute component={Scoring} />
      </Route>
      {/* New routes for prediction editing and scoring */}
      <Route path="/prediction/:showId">
        <ProtectedRoute component={Home} />
      </Route>
      <Route path="/prediction/:showId/score">
        <ProtectedRoute component={Home} />
      </Route>
      <Route path="/test-tours">
        <AdminRoute component={TestTourShows} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConfigProvider>
          <SetlistProvider>
            <ScrollProvider>
              <Layout>
                <Router />
              </Layout>
              <Toaster />
            </ScrollProvider>
          </SetlistProvider>
        </ConfigProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
