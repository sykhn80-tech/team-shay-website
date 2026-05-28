import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as SonnerToaster } from "sonner";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AddProperty from "./pages/AddProperty";
import AdminPanel from "./pages/AdminPanel";
import AgentDashboard from "./pages/AgentDashboard";
import AgentLogin from "./pages/AgentLogin";
import CmaAgent from "./pages/CmaAgent";
import CrmDashboard from "./pages/CrmDashboard";
import CrmDocuments from "./pages/CrmDocuments";
import CrmFinance from "./pages/CrmFinance";
import CrmFollowup from "./pages/CrmFollowup";
import CrmMarketing from "./pages/CrmMarketing";
import CrmMatches from "./pages/CrmMatches";
import CrmPage from "./pages/CrmPage";
import CrmTasks from "./pages/CrmTasks";
import CrmTemplates from "./pages/CrmTemplates";
import CrmImport from "./pages/CrmImport";
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
      <Route path="/agent-dashboard/crm" component={CrmPage} />
      <Route path="/agent-dashboard/crm/dashboard" component={CrmDashboard} />
      <Route path="/agent-dashboard/crm/matches" component={CrmMatches} />
      <Route path="/agent-dashboard/crm/followup" component={CrmFollowup} />
      <Route path="/agent-dashboard/crm/tasks" component={CrmTasks} />
      <Route path="/agent-dashboard/crm/marketing" component={CrmMarketing} />
      <Route path="/agent-dashboard/crm/finance" component={CrmFinance} />
      <Route path="/agent-dashboard/crm/templates" component={CrmTemplates} />
      <Route path="/agent-dashboard/crm/documents" component={CrmDocuments} />
      <Route path="/crm-import" component={CrmImport} />
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
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
