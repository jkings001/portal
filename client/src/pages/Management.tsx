import React, { useState, useEffect, useCallback } from 'react';
// Build: 2026-03-18 teams-card-v2
import { Link, useLocation } from 'wouter';
import {
  Users, Monitor, Plus, ClipboardList, FileCheck, Bell,
  LayoutDashboard, ChevronRight, Menu, X, LogOut,
  TrendingUp, Clock, CheckCircle, AlertCircle, XCircle,
  AlertTriangle, BarChart2, Activity, RefreshCw, Shield,
  ChevronDown, Settings, Search, Filter, Eye, Building2,
  FolderOpen, Server, Car, ParkingCircle,
  GraduationCap, FileText, Headphones, Globe,
  HardDrive, Network, BookOpen, TicketCheck,
  ChevronUp, Lock, UserCog, Layers, PieChart as PieChartIcon
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import UserMenu from '../components/UserMenu';
import CircuitBackground from '../components/CircuitBackground';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface TicketStats {
  total: number; abertos: number; em_andamento: number;
  resolvidos: number; fechados: number;
}
interface RequestStats {
  total: number; pendentes: number; aprovadas: number;
  rejeitadas: number; em_andamento: number; fechadas: number; canceladas: number;
}
interface ApprovalStats { total: number; pendentes: number; aprovadas: number; rejeitadas: number; }
interface PendingApproval {
  id: number; requestId: number; status: string; level: number;
  createdAt: string; requestTitle: string; requestType: string;
  priority: string; requesterName: string;
}
interface ApprovalHistory {
  id: number; requestId: number; status: string; comment: string;
  decidedAt: string; createdAt: string; requestTitle: string;
  requestType: string; priority: string; requesterName: string; approverName: string;
}
interface RecentTicket {
  id: number; requestId: string; title: string; status: string;
  priority: string; userName: string; category: string;
  assignedToName: string; createdAt: string;
}
interface RecentRequest {
  id: number; requestId: string; title: string; type: string;
  status: string; priority: string; userName: string; category: string; createdAt: string;
}

// ─── Paleta de cores ──────────────────────────────────────────────────────────
const COLORS = {
  cyan:    '#00d4ff',
  blue:    '#3b82f6',
  green:   '#22c55e',
  yellow:  '#f59e0b',
  red:     '#ef4444',
  purple:  '#a855f7',
  slate:   '#64748b',
  orange:  '#f97316',
};

const STATUS_COLORS: Record<string, string> = {
  pendente:            COLORS.yellow,
  em_andamento:        COLORS.blue,
  resolvido:           COLORS.green,
  fechado:             COLORS.slate,
  aberto:              COLORS.cyan,
  em_analise:          COLORS.purple,
  aguardando_aprovacao:COLORS.orange,
  aprovado:            COLORS.green,
  rejeitado:           COLORS.red,
  cancelado:           COLORS.slate,
};

const PRIORITY_COLORS: Record<string, string> = {
  baixa:   COLORS.green,
  media:   COLORS.yellow,
  alta:    COLORS.orange,
  critica: COLORS.red,
};

// ─── Helpers de formatação ────────────────────────────────────────────────────
const fmtStatus = (s: string) =>
  ({ pendente: 'Pendente', em_andamento: 'Em Andamento', resolvido: 'Resolvido',
     fechado: 'Fechado', aberto: 'Aberto', em_analise: 'Em Análise',
     aguardando_aprovacao: 'Aguard. Aprovação', aprovado: 'Aprovado',
     rejeitado: 'Rejeitado', cancelado: 'Cancelado' }[s] ?? s);

const fmtPriority = (p: string) =>
  ({ baixa: 'Baixa', media: 'Média', alta: 'Alta', critica: 'Crítica' }[p] ?? p);

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR', {
  day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
}) : '-';

const fmtType = (t: string) =>
  ({ request: 'Requisição', occurrence: 'Ocorrência', ticket: 'Chamado' }[t] ?? t);

// ─── Badge de status ──────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const color = STATUS_COLORS[status] || COLORS.slate;
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {fmtStatus(status)}
    </span>
  );
};

// ─── Badge de prioridade ──────────────────────────────────────────────────────
const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const color = PRIORITY_COLORS[priority] || COLORS.slate;
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {fmtPriority(priority)}
    </span>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string; value: number | string; subtitle?: string;
  icon: React.ReactNode; color: string; trend?: string;
  href?: string;
}
const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, icon, color, trend, href }) => {
  const inner = (
    <div
      className={`rounded-xl p-3 sm:p-5 flex flex-col gap-2 sm:gap-3 transition-all duration-300 hover:scale-[1.02]${href ? ' cursor-pointer hover:ring-2 hover:ring-white/20' : ''}`}
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: `1px solid ${color}33`,
        backdropFilter: 'blur(12px)',
        boxShadow: `0 4px 24px ${color}18`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm text-white/60 font-medium leading-tight">{title}</span>
        <span
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${color}22`, color }}
        >
          {icon}
        </span>
      </div>
      <div>
        <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{value}</span>
        {subtitle && <p className="text-xs text-white/50 mt-1">{subtitle}</p>}
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs" style={{ color }}>
          <TrendingUp size={12} />
          <span>{trend}</span>
        </div>
      )}
      {href && (
        <div className="flex items-center gap-1 text-xs mt-auto pt-1" style={{ color, opacity: 0.65 }}>
          <span>Ver detalhes →</span>
        </div>
      )}
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
};

// ─── Grupos de menu com RBAC ─────────────────────────────────────────────────
interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string;
  badgeColor?: string;
}
interface MenuGroup {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  roles: string[];
  items: MenuItem[];
}

const getMenuGroups = (role: string): MenuGroup[] => {
  const groups: MenuGroup[] = [
    {
      key: 'overview',
      label: 'Visão Geral',
      icon: <LayoutDashboard size={14} />,
      color: '#00d4ff',
      roles: ['admin', 'manager', 'user'],
      items: [
        { icon: <LayoutDashboard size={16} />, label: 'Painel de Controle', href: '/management' },
        { icon: <BarChart2 size={16} />,       label: 'Relatórios',         href: '/reports' },
        { icon: <Globe size={16} />,           label: 'TeamsWeb',           href: '/teamsweb' },
      ],
    },
    {
      key: 'support',
      label: 'Suporte & Chamados',
      icon: <Headphones size={14} />,
      color: '#3b82f6',
      roles: ['admin', 'manager', 'user'],
      items: [
        { icon: <Plus size={16} />,          label: 'Abrir Chamado',         href: '/support' },
        { icon: <ClipboardList size={16} />, label: 'Histórico de Chamados',  href: '/tickets' },
        { icon: <TicketCheck size={16} />,   label: 'Gestão de Chamados',    href: '/tickets',      roles: ['admin', 'manager'] } as any,
        { icon: <Users size={16} />,         label: 'Todos os Chamados',     href: '/chamados',     roles: ['admin', 'manager'] } as any,
      ].filter((item: any) => !item.roles || item.roles.includes(role)),
    },
    {
      key: 'users',
      label: 'Usuários & Acesso',
      icon: <Users size={14} />,
      color: '#a855f7',
      roles: ['admin'],
      items: [
        { icon: <Users size={16} />,    label: 'Gestão de Usuários',  href: '/admin/users' },
        { icon: <UserCog size={16} />,  label: 'Permissões (RBAC)',   href: '/permissoes' },
        { icon: <Shield size={16} />,   label: 'Perfis de Acesso',    href: '/admin/permissions' },
        { icon: <Lock size={16} />,     label: 'Departamentos',       href: '/admin/departments' },
      ],
    },
    {
      key: 'assets',
      label: 'Ativos & TI',
      icon: <HardDrive size={14} />,
      color: '#22c55e',
      roles: ['admin', 'manager'],
      items: [
        { icon: <Monitor size={16} />,    label: 'Equipamentos (ITAM)', href: '/itam' },
        { icon: <Server size={16} />,     label: 'Servidor & Infra',    href: '/admin/server' },
        { icon: <Network size={16} />,    label: 'Hostinger',           href: '/admin/hostinger' },
      ],
    },
    {
      key: 'documents',
      label: 'Documentos',
      icon: <FileText size={14} />,
      color: '#f59e0b',
      roles: ['admin', 'manager', 'user'],
      items: [
        { icon: <FolderOpen size={16} />, label: 'Gerenciar Documentos', href: '/documentos', roles: ['admin'] } as any,
        { icon: <FileCheck size={16} />,  label: 'Meus Documentos',      href: '/terms' },
        { icon: <BookOpen size={16} />,   label: 'Política de TI',       href: '/policy' },
      ].filter((item: any) => !item.roles || item.roles.includes(role)),
    },
    {
      key: 'training',
      label: 'Treinamentos',
      icon: <GraduationCap size={14} />,
      color: '#06b6d4',
      roles: ['admin', 'manager', 'user'],
      items: [
        { icon: <GraduationCap size={16} />, label: 'Catálogo de Cursos',    href: '/training' },
        { icon: <Layers size={16} />,        label: 'Gerenciar Treinamentos', href: '/admin/treinamentos', roles: ['admin'] } as any,
      ].filter((item: any) => !item.roles || item.roles.includes(role)),
    },
    {
      key: 'parking',
      label: 'Estacionamento',
      icon: <Car size={14} />,
      color: '#f97316',
      roles: ['admin', 'manager', 'user'],
      items: [
        { icon: <Car size={16} />,          label: 'Solicitar Vaga',          href: '/estacionamento/solicitar' },
        { icon: <ParkingCircle size={16} />, label: 'Minha Vaga',              href: '/estacionamento' },
        { icon: <TicketCheck size={16} />,   label: 'Tickets RH',              href: '/rh/tickets-estacionamento', roles: ['admin', 'manager'] } as any,
        { icon: <BarChart2 size={16} />,     label: 'Dashboard RH',            href: '/rh/dashboard-estacionamento', roles: ['admin', 'manager'] } as any,
      ].filter((item: any) => !item.roles || item.roles.includes(role)),
    },
    {
      key: 'company',
      label: 'Organização',
      icon: <Building2 size={14} />,
      color: '#ec4899',
      roles: ['admin'],
      items: [
        { icon: <Building2 size={16} />, label: 'Empresas',     href: '/companies' },
      ],
    },
    {
      key: 'config',
      label: 'Configurações',
      icon: <Settings size={14} />,
      color: '#64748b',
      roles: ['admin', 'manager', 'user'],
      items: [
        { icon: <Settings size={16} />, label: 'Configurações do Sistema', href: '/settings', roles: ['admin'] } as any,
        { icon: <Bell size={16} />,     label: 'Dashboard Pessoal',        href: '/dashboard' },
      ].filter((item: any) => !item.roles || item.roles.includes(role)),
    },
  ];
  return groups.filter(g => g.roles.includes(role));
};

// ─── Sidebar com grupos colapsáveis ──────────────────────────────────────────
interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  isMobile: boolean;
  currentUser: any;
  location: string;
  role: string;
}

const ManagementSidebar: React.FC<SidebarProps> = ({
  sidebarOpen, setSidebarOpen, isMobile, currentUser, location, role
}) => {
  const groups = getMenuGroups(role);
  // Inicializa todos os grupos abertos exceto os de menor prioridade
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map(g => [g.key, true]))
  );

  const toggleGroup = (key: string) =>
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  // Fecha a sidebar ao navegar no mobile
  const handleNavClick = () => {
    if (isMobile) setSidebarOpen(false);
  };

  const roleLabel = role === 'admin' ? 'Administrador' : role === 'manager' ? 'Gerente' : 'Usuário';
  const roleColor = role === 'admin' ? '#a855f7' : role === 'manager' ? '#3b82f6' : '#22c55e';

  return (
    <aside
      className={`fixed left-0 top-0 h-full flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
      } md:relative md:flex md:flex-col`}
      style={{
        background: 'linear-gradient(180deg, rgba(2,12,27,0.97) 0%, rgba(4,15,31,0.97) 60%, rgba(5,11,24,0.97) 100%)',
        borderRight: '1px solid rgba(0,212,255,0.12)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        minWidth: sidebarOpen ? '288px' : '0',
        boxShadow: sidebarOpen ? '4px 0 32px rgba(0,0,0,0.5)' : 'none',
        zIndex: 50,
      }}
    >
      {/* ── Logo / Header ── */}
      <div
        className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(59,130,246,0.15))',
              border: '1px solid rgba(0,212,255,0.2)',
              boxShadow: '0 0 16px rgba(0,212,255,0.08)',
            }}
          >
            <LayoutDashboard size={16} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>Portal Admin</p>
            <p className="text-xs leading-none mt-0.5" style={{ color: 'rgba(0,212,255,0.5)', fontFamily: 'Inter, sans-serif' }}>Management</p>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Perfil do usuário ── */}
      {currentUser && (
        <div
          className="mx-4 mt-3 mb-1 px-3 py-2.5 rounded-xl flex items-center gap-3"
          style={{
            background: `${roleColor}0d`,
            border: `1px solid ${roleColor}22`,
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
            style={{ background: `${roleColor}22`, color: roleColor }}
          >
            {(currentUser.name || currentUser.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
              {currentUser.name || currentUser.email}
            </p>
            <span
              className="text-xs font-medium"
              style={{ color: roleColor, fontFamily: 'Inter, sans-serif' }}
            >
              {roleLabel}
            </span>
          </div>
        </div>
      )}

      {/* ── Navegação com grupos ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,212,255,0.15) transparent' }}
      >
        {groups.map((group) => {
          const isOpen = openGroups[group.key] !== false;
          const hasActive = group.items.some(item => location === item.href);

          return (
            <div key={group.key} className="mb-1">
              {/* Cabeçalho do grupo */}
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group"
                style={{
                  background: hasActive ? `${group.color}0a` : 'transparent',
                }}
              >
                <div className="flex items-center gap-2">
                  <span style={{ color: hasActive ? group.color : 'rgba(255,255,255,0.3)' }}>
                    {group.icon}
                  </span>
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{
                      color: hasActive ? group.color : 'rgba(255,255,255,0.28)',
                      fontFamily: 'Inter, sans-serif',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {group.label}
                  </span>
                </div>
                <span style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', color: 'rgba(255,255,255,0.2)', transition: 'transform 0.2s' }}>
                  <ChevronDown size={12} />
                </span>
              </button>

              {/* Itens do grupo */}
              {isOpen && (
                <div className="mt-0.5 space-y-0.5 pl-2">
                  {group.items.map((item) => {
                    const active = location === item.href;
                    return (
                      <Link key={`${item.href}-${item.label}`} href={item.href} onClick={handleNavClick}>
                        <div
                          className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 group relative"
                          style={{
                            background: active
                              ? `${group.color}14`
                              : 'transparent',
                            border: active
                              ? `1px solid ${group.color}28`
                              : '1px solid transparent',
                          }}
                        >
                          {/* Indicador lateral ativo */}
                          {active && (
                            <div
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
                              style={{
                                background: group.color,
                                boxShadow: `0 0 8px ${group.color}`,
                              }}
                            />
                          )}
                          <span
                            style={{
                              color: active ? group.color : 'rgba(255,255,255,0.35)',
                              transition: 'color 0.15s',
                            }}
                            className="group-hover:!text-white"
                          >
                            {item.icon}
                          </span>
                          <span
                            className="text-sm font-medium flex-1 truncate"
                            style={{
                              color: active ? 'white' : 'rgba(255,255,255,0.55)',
                              fontFamily: 'Inter, sans-serif',
                              transition: 'color 0.15s',
                            }}
                          >
                            {item.label}
                          </span>
                          {item.badge && (
                            <span
                              className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                              style={{
                                background: `${item.badgeColor || group.color}22`,
                                color: item.badgeColor || group.color,
                                border: `1px solid ${item.badgeColor || group.color}33`,
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Rodapé ── */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => { localStorage.clear(); window.location.href = '/'; }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group"
          style={{
            background: 'rgba(239,68,68,0.04)',
            border: '1px solid rgba(239,68,68,0.1)',
          }}
        >
          <LogOut size={16} className="text-red-400/60 group-hover:text-red-400 transition-colors" />
          <span className="text-sm font-medium text-red-400/60 group-hover:text-red-400 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>Sair da Sessão</span>
        </button>
      </div>
    </aside>
  );
};

export default function Management() {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Stats
  const [ticketStats, setTicketStats] = useState<TicketStats>({ total: 0, abertos: 0, em_andamento: 0, resolvidos: 0, fechados: 0 });
  const [requestStats, setRequestStats] = useState<RequestStats>({ total: 0, pendentes: 0, aprovadas: 0, rejeitadas: 0, em_andamento: 0, fechadas: 0, canceladas: 0 });
  const [approvalStats, setApprovalStats] = useState<ApprovalStats>({ total: 0, pendentes: 0, aprovadas: 0, rejeitadas: 0 });
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userStr = localStorage.getItem('currentUser') || localStorage.getItem('user');
      if (userStr) setCurrentUser(JSON.parse(userStr));

      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Sessão expirada. Faça login novamente para acessar o painel.');
        setLoading(false);
        return;
      }
      const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` };

      // Usar o endpoint unificado /api/management/stats que retorna tudo de uma vez
      const [statsData, recentTicketsData, recentRequestsData] = await Promise.all([
        fetch('/api/management/stats', { headers }).then(async r => {
          if (r.status === 401) throw new Error('AUTH_EXPIRED');
          if (r.status === 503) throw new Error('SERVICE_UNAVAILABLE');
          if (!r.ok) throw new Error(`Stats error: ${r.status}`);
          return r.json();
        }),
        fetch('/api/management/tickets/recent', { headers }).then(async r => {
          if (!r.ok) return [];
          return r.json();
        }),
        fetch('/api/management/requests/recent', { headers }).then(async r => {
          if (!r.ok) return [];
          return r.json();
        }),
      ]);

      // Extrair dados do objeto unificado retornado pelo backend
      if (statsData.tickets?.stats) setTicketStats(statsData.tickets.stats);
      if (statsData.requests?.stats) setRequestStats(statsData.requests.stats);
      if (statsData.approvals?.stats) setApprovalStats(statsData.approvals.stats);
      if (Array.isArray(statsData.approvals?.pending)) setPendingApprovals(statsData.approvals.pending);
      if (Array.isArray(recentTicketsData)) setRecentTickets(recentTicketsData);
      if (Array.isArray(recentRequestsData)) setRecentRequests(recentRequestsData);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch management data:', err);
      if (err.message === 'AUTH_EXPIRED') {
        setError('Sessão expirada. Faça login novamente para acessar o painel.');
      } else if (err.message === 'SERVICE_UNAVAILABLE') {
        setError('O serviço está temporariamente indisponível. O banco de dados pode estar em manutenção. Tente novamente em alguns instantes.');
      } else if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setError('Erro de conexão com o servidor. Verifique sua internet e tente novamente.');
      } else {
        setError('Ocorreu um erro ao carregar os dados do painel. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const userRole = currentUser?.role || 'user';

  return (
    <div className="flex h-screen text-white overflow-hidden" style={{ background: '#020810' }}>
      {/* Background animado de circuito eletrônico */}
      <CircuitBackground />
      {/* Overlay suave sobre o canvas */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1, background: 'linear-gradient(to bottom, rgba(2,8,16,0.12) 0%, rgba(2,8,16,0.04) 50%, rgba(2,8,16,0.18) 100%)' }} />
      {/* Overlay para fechar sidebar no mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 md:hidden"
          style={{ background: 'rgba(0,0,0,0.65)', zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <ManagementSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        currentUser={currentUser}
        role={userRole}
        location={location}
      />

        <main className="flex-1 overflow-y-auto relative" style={{ zIndex: 3 }}>
        {/* Header mobile */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 backdrop-blur-xl z-20" style={{ background: 'rgba(2,8,16,0.88)' }}>
          <button onClick={() => setSidebarOpen(true)} className="text-white/60 hover:text-white p-1">
            <Menu size={22} />
          </button>
          <div className="text-cyan-400 font-bold text-sm tracking-wider">PORTAL</div>
          <UserMenu />
        </header>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
          <div className="hidden md:flex items-center justify-end mb-6 sm:mb-8">
            <UserMenu />
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-white tracking-tight">Painel de Gestão</h1>
              <p className="text-white/40 mt-1 text-sm">Visão geral do sistema e indicadores de performance</p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 sm:mb-8 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', backdropFilter: 'blur(12px)' }}>
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}>
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-300">{error}</p>
                  {retryCount > 0 && <p className="text-xs text-white/30 mt-1">Tentativas: {retryCount}</p>}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => { setRetryCount(prev => prev + 1); fetchData(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors"
                >
                  <RefreshCw size={14} />
                  Tentar novamente
                </button>
                {error.includes('Sessão expirada') && (
                  <button
                    onClick={() => { localStorage.clear(); window.location.href = '/'; }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 transition-colors"
                  >
                    <LogOut size={14} />
                    Fazer login
                  </button>
                )}
              </div>
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <KpiCard
              title="Chamados Abertos"
              value={ticketStats.abertos}
              subtitle="Aguardando atendimento"
              icon={<ClipboardList size={20} />}
              color={COLORS.cyan}
              href="/tickets"
            />
            <KpiCard
              title="Requisições Pendentes"
              value={requestStats.pendentes}
              subtitle="Em fase de análise"
              icon={<FileCheck size={20} />}
              color={COLORS.yellow}
              href="/support"
            />
            <KpiCard
              title="Aprovações Pendentes"
              value={approvalStats.pendentes}
              subtitle="Sua ação é necessária"
              icon={<CheckCircle size={20} />}
              color={COLORS.orange}
              href="/support"
            />
            <KpiCard
              title="Taxa de Resolução"
              value={`${ticketStats.total > 0 ? Math.round((ticketStats.resolvidos / ticketStats.total) * 100) : 0}%`}
              subtitle="Chamados finalizados"
              icon={<Activity size={20} />}
              color={COLORS.green}
              trend="+2.4% este mês"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            {/* Recent Tickets */}
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-white/10 flex items-center justify-between">
                  <h2 className="font-bold flex items-center gap-2 text-sm sm:text-base">
                    <Clock size={18} className="text-cyan-400 shrink-0" />
                    Chamados Recentes
                  </h2>
                  <Link href="/tickets">
                    <span className="text-xs text-cyan-400 hover:underline cursor-pointer">Ver todos</span>
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead>
                      <tr className="text-left border-b border-white/5">
                        <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-white/40">Chamado</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-white/40 hidden sm:table-cell">Usuário</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-white/40">Status</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-white/40 hidden sm:table-cell">Prioridade</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-white/40">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {recentTickets.map((t) => (
                        <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="font-medium group-hover:text-cyan-400 transition-colors text-xs sm:text-sm truncate max-w-[140px] sm:max-w-none">{t.title}</div>
                            <div className="text-xs text-white/30">{t.requestId}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                            <div>{t.userName}</div>
                            <div className="text-xs text-white/30">{t.category || t.assignedToName || '—'}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4"><StatusBadge status={t.status} /></td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell"><PriorityBadge priority={t.priority} /></td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-white/40 text-xs">{fmtDate(t.createdAt)}</td>
                        </tr>
                      ))}
                      {recentTickets.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-white/20 italic">
                            Nenhum chamado recente encontrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Recent Requests */}
              <section className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-white/10 flex items-center justify-between">
                  <h2 className="font-bold flex items-center gap-2 text-sm sm:text-base">
                    <FileCheck size={18} className="text-purple-400 shrink-0" />
                    Requisições de Serviço
                  </h2>
                  <Link href="/support">
                    <span className="text-xs text-purple-400 hover:underline cursor-pointer">Ver todas</span>
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="text-left border-b border-white/5">
                        <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-white/40">Requisição</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-white/40 hidden sm:table-cell">Tipo</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-white/40 hidden sm:table-cell">Usuário</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-white/40">Status</th>
                        <th className="px-3 sm:px-6 py-3 sm:py-4 font-medium text-white/40">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {recentRequests.map((r) => (
                        <tr key={r.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="font-medium group-hover:text-purple-400 transition-colors text-xs sm:text-sm truncate max-w-[140px] sm:max-w-none">{r.title}</div>
                            <div className="text-xs text-white/30">{r.requestId}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                            <span className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10">{r.type}</span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">{r.userName}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4"><StatusBadge status={r.status} /></td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-white/40 text-xs">{fmtDate(r.createdAt)}</td>
                        </tr>
                      ))}
                      {recentRequests.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-white/20 italic">
                            Nenhuma requisição recente encontrada.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-8">
              {/* Approval Queue */}
              <section className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-white/10">
                  <h2 className="font-bold flex items-center gap-2 text-sm sm:text-base">
                    <CheckCircle size={18} className="text-orange-400 shrink-0" />
                    Fila de Aprovação
                  </h2>
                </div>
                <div className="p-4 sm:p-6 space-y-4">
                  {pendingApprovals.map((pa) => (
                    <div key={pa.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-orange-400/30 transition-colors cursor-pointer group">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">{pa.requestType}</span>
                        <span className="text-[10px] text-white/30">{fmtDate(pa.createdAt)}</span>
                      </div>
                      <h3 className="text-sm font-medium mb-1 group-hover:text-orange-400 transition-colors">{pa.requestTitle}</h3>
                      <p className="text-xs text-white/40 mb-3">Solicitante: {pa.requesterName}</p>
                      <div className="flex items-center justify-between">
                        <PriorityBadge priority={pa.priority} />
                        <Link href="/support">
                          <button className="text-[10px] font-bold text-white bg-orange-500 px-2 py-1 rounded hover:bg-orange-600 transition-colors uppercase">Analisar</button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  {pendingApprovals.length === 0 && (
                    <div className="py-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle size={24} className="text-green-500" />
                      </div>
                      <p className="text-sm text-white/40 italic">Tudo em dia! Nenhuma aprovação pendente.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Quick Charts */}
              <section className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <h2 className="font-bold mb-6 flex items-center gap-2">
                  <BarChart2 size={18} className="text-blue-400" />
                  Status dos Chamados
                </h2>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Abertos', value: ticketStats.abertos, color: COLORS.cyan },
                          { name: 'Em Andamento', value: ticketStats.em_andamento, color: COLORS.blue },
                          { name: 'Resolvidos', value: ticketStats.resolvidos, color: COLORS.green },
                          { name: 'Fechados', value: ticketStats.fechados, color: COLORS.slate },
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { name: 'Abertos', value: ticketStats.abertos, color: COLORS.cyan },
                          { name: 'Em Andamento', value: ticketStats.em_andamento, color: COLORS.blue },
                          { name: 'Resolvidos', value: ticketStats.resolvidos, color: COLORS.green },
                          { name: 'Fechados', value: ticketStats.fechados, color: COLORS.slate },
                        ].filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#0a192f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {[
                    { label: 'Abertos', color: COLORS.cyan },
                    { label: 'Em Andamento', color: COLORS.blue },
                    { label: 'Resolvidos', color: COLORS.green },
                    { label: 'Fechados', color: COLORS.slate },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] text-white/60">{item.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
