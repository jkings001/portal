import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { NavigationProgress } from "./components/PageTransition";

// ─── Lazy imports: cada página é carregada apenas quando necessária ───────────
// Páginas de acesso imediato (carregadas com prioridade)
import Home from "./pages/Home";
const NotFound = lazy(() => import("@/pages/NotFound"));

// Autenticação
const SignUp = lazy(() => import("./pages/SignUp"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Usuário comum
const Dashboard = lazy(() => import("./pages/Dashboard"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Settings = lazy(() => import("./pages/Settings"));
const TermsOfResponsibility = lazy(() => import("./pages/TermsOfResponsibility"));
const Support = lazy(() => import("./pages/Support"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const ITAM = lazy(() => import("./pages/ITAM"));
const GerenciadorDocumentos = lazy(() => import("./pages/GerenciadorDocumentos"));
const Permissoes = lazy(() => import("./pages/Permissoes"));
const EstacionamentoPage = lazy(() => import("./pages/EstacionamentoPage"));
const EstacionamentoSolicitar = lazy(() => import("./pages/EstacionamentoSolicitar"));
const JLX = lazy(() => import("./pages/JLX"));

// Admin / Manager
const Management = lazy(() => import("./pages/Management"));
const Users = lazy(() => import("./pages/Users"));
const AdminServer = lazy(() => import("./pages/AdminServer"));
const AdminPermissions = lazy(() => import("./pages/AdminPermissions"));
const Departments = lazy(() => import("./pages/Departments"));
const Companies = lazy(() => import("./pages/Companies"));
const CompanyDetails = lazy(() => import("./pages/CompanyDetails"));
const RHTicketsEstacionamento = lazy(() => import("./pages/RHTicketsEstacionamento"));
const RHDashboardEstacionamento = lazy(() => import("./pages/RHDashboardEstacionamento"));
const TrainingAdmin = lazy(() => import("./pages/TrainingAdmin"));
const HostingerDashboard = lazy(() => import("./pages/HostingerDashboard"));

// Páginas públicas
const Training = lazy(() => import("./pages/Training"));
const TrainingDetail = lazy(() => import("./pages/TrainingDetail"));
const TrainingDashboard = lazy(() => import("./pages/TrainingDashboard"));
const TrainingDetails = lazy(() => import("./pages/TrainingDetails"));
const SupportTickets = lazy(() => import("./pages/SupportTickets"));
const TicketHistory = lazy(() => import("./pages/TicketHistory"));
const AllTickets = lazy(() => import("./pages/AllTickets"));
const AllTicketsList = lazy(() => import("./pages/AllTicketsList"));
const TicketDetail = lazy(() => import("./pages/TicketDetail"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const FAQ = lazy(() => import("./pages/FAQ"));
const ITPolicy = lazy(() => import("./pages/ITPolicy"));
const TeamsWeb = lazy(() => import("./pages/TeamsWeb"));
const Reports = lazy(() => import("./pages/Reports"));
const Solution = lazy(() => import("./pages/Solution"));
const Presentation = lazy(() => import("./pages/Presentation"));
const Vigix = lazy(() => import("./pages/Vigix"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
// ─── Skeleton de carregamento leve ────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div
      className="page-loading-skeleton"
      aria-label="Carregando página..."
    />
  );
}

// ─── Validação de JWT ─────────────────────────────────────────────────────────
function isValidJWT(token: string | null): boolean {
  if (!token || typeof token !== "string") return false;
  if (!token.startsWith("eyJ")) return false;
  if (token.split(".").length !== 3) return false;
  return true;
}

// ─── Rotas protegidas ─────────────────────────────────────────────────────────
function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: any;
}) {
  return (
    <Route
      path={path}
      component={(props) => {
        const token = localStorage.getItem("authToken");
        if (!isValidJWT(token)) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          localStorage.removeItem("currentUser");
          localStorage.removeItem("isAuthenticated");
          window.location.href = "/";
          return null;
        }
        return <Component {...props} />;
      }}
    />
  );
}

function AdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: any;
}) {
  return (
    <Route
      path={path}
      component={(props) => {
        const token = localStorage.getItem("authToken");
        if (!isValidJWT(token)) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          localStorage.removeItem("currentUser");
          localStorage.removeItem("isAuthenticated");
          window.location.href = "/";
          return null;
        }
        const userStr =
          localStorage.getItem("currentUser") || localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;
        const role = user?.role || "";
        if (role !== "admin" && role !== "manager") {
          window.location.href = "/dashboard";
          return null;
        }
        return <Component {...props} />;
      }}
    />
  );
}

// ─── Router com transição CSS pura (sem blur, sem scale) ──────────────────────
function Router() {
  const [location] = useLocation();

  return (
    <div key={location} className="page-transition-enter">
      <Suspense fallback={<PageSkeleton />}>
        <Switch location={location}>
          {/* Públicas */}
          <Route path={"/"} component={Home} />
          <Route path={"/signup"} component={SignUp} />
          <Route path={"/forgot-password"} component={ForgotPassword} />
          <Route path={"/reset-password"} component={ResetPassword} />
          <Route path={"/terms"} component={TermsOfResponsibility} />
          <Route path={"/training"} component={TrainingDashboard} />
          <Route path={"/training/:id"} component={TrainingDetails} />
          <Route path={"/support-legacy"} component={SupportTickets} />
          <Route path={"/tickets"} component={TicketHistory} />
          <Route path={"/chamados/lista"} component={AllTicketsList} />
          <Route path={"/chamados"} component={AllTickets} />
          <Route path={"/tickets/:id"} component={TicketDetail} />
          <Route path={"/help"} component={HelpCenter} />
          <Route path={"/faq"} component={FAQ} />
          <Route path={"/policy"} component={ITPolicy} />
          <Route path={"/teamsweb"} component={TeamsWeb} />
          <Route path={"/reports"} component={Reports} />
          <Route path="/company-details" component={CompanyDetails} />
          <Route path="/solution" component={Solution} />
          <Route path="/presentation" component={Presentation} />
          <Route path="/vigix" component={Vigix} />
          <Route path="/admin-panel" component={AdminPanel} />
          <Route path="/user-dashboard" component={UserDashboard} />
          <Route path="/treinamentos" component={Training} />
          <Route path="/treinamentos/:id" component={TrainingDetail} />

          {/* Usuário autenticado */}
          <ProtectedRoute path={"/dashboard"} component={Dashboard} />
          <ProtectedRoute path={"/profile"} component={UserProfile} />
          <ProtectedRoute path={"/settings"} component={Settings} />
          <ProtectedRoute path={"/support"} component={Support} />
          <ProtectedRoute path="/itam" component={ITAM} />
          <ProtectedRoute path="/documentos" component={GerenciadorDocumentos} />
          <ProtectedRoute path="/permissoes" component={Permissoes} />
          <ProtectedRoute path="/estacionamento" component={EstacionamentoPage} />
          <ProtectedRoute path="/estacionamento/solicitar" component={EstacionamentoSolicitar} />
          <ProtectedRoute path="/jlx" component={JLX} />

          {/* Admin / Manager */}
          <Route
            path={"/admin"}
            component={() => {
              window.location.replace("/management");
              return null;
            }}
          />
          <AdminRoute path={"/admin/users"} component={Users} />
          <AdminRoute path={"/admin/server"} component={AdminServer} />
          <AdminRoute path="/management" component={Management} />
          <AdminRoute path="/admin/permissions" component={AdminPermissions} />
          <AdminRoute path="/admin/departments" component={Departments} />
          <AdminRoute path="/companies" component={Companies} />
          <AdminRoute path="/admin/hostinger" component={HostingerDashboard} />
          <AdminRoute path="/rh/tickets-estacionamento" component={RHTicketsEstacionamento} />
          <AdminRoute path="/rh/dashboard-estacionamento" component={RHDashboardEstacionamento} />
          <AdminRoute path="/admin/treinamentos" component={TrainingAdmin} />
          <AdminRoute path="/admin/documentos" component={GerenciadorDocumentos} />

          {/* 404 */}
          <Route path={"/404"} component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <NavigationProgress />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
