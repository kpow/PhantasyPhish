import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { SetlistProvider } from "./contexts/SetlistContext";
import { ScrollProvider } from "./contexts/ScrollContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SetlistProvider>
        <ScrollProvider>
          <Router />
          <Toaster />
        </ScrollProvider>
      </SetlistProvider>
    </QueryClientProvider>
  );
}

export default App;
