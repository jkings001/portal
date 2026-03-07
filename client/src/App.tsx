import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import SignUp from "./pages/SignUp";
import TrainingDashboard from "./pages/TrainingDashboard";
import TrainingDetails from "./pages/TrainingDetails";
import AdminPanel from "./pages/AdminPanel";
import UserProfile from "./pages/UserProfile";
import TermsOfResponsibility from "./pages/TermsOfResponsibility";
import SupportTickets from "./pages/SupportTickets";
import TicketHistory from "./pages/TicketHistory";
import HelpCenter from "./pages/HelpCenter";
import FAQ from "./pages/FAQ";
import ITPolicy from "./pages/ITPolicy";
import AdminDashboard from "./pages/AdminDashboard";
import UsersManagement from "./pages/UsersManagement";
import UserDashboard from "./pages/UserDashboard";
import { AuthProvider } from "./contexts/AuthContext";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/signup"} component={SignUp} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/training"} component={TrainingDashboard} />
      <Route path={"/training/:id"} component={TrainingDetails} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/users"} component={UsersManagement} />
      <Route path={"/user-dashboard"} component={UserDashboard} />
      <Route path={"/admin-panel"} component={AdminPanel} />
      <Route path={"/profile"} component={UserProfile} />
      <Route path={"/terms"} component={TermsOfResponsibility} />
      <Route path={"/support"} component={SupportTickets} />
      <Route path={"/tickets"} component={TicketHistory} />
      <Route path={"/help"} component={HelpCenter} />
      <Route path={"/faq"} component={FAQ} />
      <Route path={"/policy"} component={ITPolicy} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider
          defaultTheme="dark"
          // switchable
        >
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
