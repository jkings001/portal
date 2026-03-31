import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Help from "./pages/Help";
import Dashboard from "./pages/Dashboard";
import HelpDesk from "./pages/HelpDesk";
import Training from "./pages/Training";
import Teams from "./pages/Teams";
import Reports from "./pages/Reports";
import Companies from "./pages/Companies";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/help"} component={Help} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/helpdesk"} component={HelpDesk} />
      <Route path={"/training"} component={Training} />
      <Route path={"/teams"} component={Teams} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/companies"} component={Companies} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
