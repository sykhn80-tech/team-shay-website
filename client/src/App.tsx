import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as SonnerToaster } from "sonner";
import { Route, Switch } from "wouter";
import AccessibilityButton from "./components/AccessibilityButton";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AddProperty from "./pages/AddProperty";
import AdminPanel from "./pages/AdminPanel";
import AgentDashboard from "./pages/AgentDashboard";
import AgentLogin from "./pages/AgentLogin";
import CmaAgent from "./pages/CmaAgent";
import Home from "./pages/Home";
import MarketingAgent from "./pages/MarketingAgent";
import NotFound from "./pages/NotFound";
import PropertyDetails from "./pages/PropertyDetails";
import Properties from "./pages/Properties";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/properties/:propertyId" component={PropertyDetails} />
      <Route path="/properties" component={Properties} />
      <Route path="/agent-login" component={AgentLogin} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/agent-dashboard" component={AgentDashboard} />
      <Route path="/agent-dashboard/cma" component={CmaAgent} />
      <Route path="/agent-dashboard/marketing" component={MarketingAgent} />
      <Route path="/agent-dashboard/new-property" component={AddProperty} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <SonnerToaster richColors position="top-center" />
          <Router />
          <AccessibilityButton />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
