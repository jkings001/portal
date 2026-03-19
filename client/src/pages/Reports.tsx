import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend,
} from 'recharts';
import {
  TrendingUp, TicketCheck, Clock, AlertTriangle,
  CheckCircle, RefreshCw, ChevronDown, Award,
  Users, Zap, Target, Activity, Eye,
  FileText, Layers, AlertCircle, XCircle,
  Star, Medal, Trophy, Timer,
} from 'lucide-react';
import { useLocation } from 'wouter';
import BackButton from '@/components/BackButton';
import UserMenu from '@/components/UserMenu';
import CircuitBackground from '@/components/CircuitBackground';
import { toast } from 'sonner';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(url: string) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// ─── Paleta ───────────────────────────────────────────────────────────────────
const C = {
  cyan:    '#00d4ff',
  blue:    '#3b82f6',
  green:   '#22c55e',
  yellow:  '#f59e0b',
  red:     '#ef4444',
  purple:  '#a855f7',
  orange:  '#f97316',
  slate:   '#64748b',
  teal:    '#14b8a6',
};

const STATUS_COLORS: Record<string, string> = {
  aberto: C.cyan, em_analise: C.yellow, em_andamento: C.blue,
  aguardando_aprovacao: C.orange, aprovado: C.teal,
  resolvido: C.green, fechado: C.slate, cancelado: '#9ca3af', rejeitado: C.red,
};
const STATUS_LABELS: Record<string, string> = {
  aberto: 'Aberto', em_analise: 'Em Análise', em_andamento: 'Em Andamento',
  aguardando_aprovacao: 'Ag. Aprovação', aprovado: 'Aprovado',
  resolvido: 'Resolvido', fechado: 'Fechado', cancelado: 'Cancelado', rejeitado: 'Rejeitado',
};
const PRIORITY_COLORS: Record<string, string> = {
  critica: C.red, alta: C.orange, media: C.yellow, baixa: C.green,
};
const PRIORITY_LABELS: Record<string, string> = {
  critica: 'Crítica', alta: 'Alta', media: 'Média', baixa: 'Baixa',
};
const TYPE_ICONS: Record<string, React.ReactNode> = {
  ticket: <FileText className="w-3.5 h-3.5" />,
  request: <Layers className="w-3.5 h-3.5" />,
  occurrence: <AlertTriangle className="w-3.5 h-3.5" />,
};
const TYPE_LABELS: Record<string, string> = {
  ticket: 'Chamado', request: 'Requisição', occurrence: 'Ocorrência',
};

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function fmtDateShort(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface KpiData {
  total: number; abertos: number; resolvidos: number;
  em_andamento: number; aguardando: number; sla_vencido: number;
  taxaResolucao: number; avgResolutionFormatted: string;
}
interface RecentTicket {
  id: number; requestId: string; type: string; title: string;
  status: string; priority: string; createdAt: string;
  userName: string; assignedToName: string | null; companyName: string | null;
}
interface TopAgent {
  id: number; name: string; email: string; avatar: string | null;
  totalAtendidos: number; totalResolvidos: number;
  taxaResolucao: number; avgMinutes: number; avgFormatted: string;
}
interface DashData {
  period: number;
  kpi: KpiData;
  byStatus: { status: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  byType: { type: string; count: number }[];
  volumeByDay: { day: string; count: number }[];
  recentTickets: RecentTicket[];
  topSupport: TopAgent[];
}

type DateRange = '7' | '14' | '30' | '60' | '90' | '365';

// ─── KPI Card (estilo Management) ────────────────────────────────────────────
interface KpiCardProps {
  title: string; value: string | number; subtitle?: string;
  icon: React.ReactNode; color: string; trend?: string; large?: boolean;
}
function KpiCard({ title, value, subtitle, icon, color, trend, large }: KpiCardProps) {
  return (
    <div
      className="rounded-xl p-4 sm:p-5 flex flex-col gap-2 transition-all duration-300 hover:scale-[1.02]"
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
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}22`, color }}
        >
          {icon}
        </span>
      </div>
      <div>
        <span className={`font-bold text-white ${large ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'}`}>{value}</span>
        {subtitle && <p className="text-xs text-white/50 mt-1">{subtitle}</p>}
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs" style={{ color }}>
          <TrendingUp size={12} />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || C.slate;
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// ─── Priority Badge ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: string }) {
  const color = PRIORITY_COLORS[priority] || C.slate;
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {PRIORITY_LABELS[priority] || priority}
    </span>
  );
}

// ─── Tooltip customizado ──────────────────────────────────────────────────────
const tooltipStyle = {
  background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#fff', fontSize: 12,
};
const axisStyle = { fill: 'rgba(255,255,255,0.45)', fontSize: 11 };
const gridStyle = { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.06)' };

// ─── Componente Principal ─────────────────────────────────────────────────────
const Reports: React.FC = () => {
  const [, setLocation] = useLocation();
  const [dateRange, setDateRange] = useState<DateRange>('30');
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const d = await apiFetch(`/api/support/dashboard-reports?days=${dateRange}`);
      setData(d);
    } catch (e: any) {
      setError(e.message);
      toast.error('Erro ao carregar dashboard: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Dados derivados
  const statusChartData = (data?.byStatus || []).map(r => ({
    name: STATUS_LABELS[r.status] || r.status,
    value: Number(r.count),
    fill: STATUS_COLORS[r.status] || C.slate,
  }));

  const priorityChartData = (data?.byPriority || []).map(r => ({
    name: PRIORITY_LABELS[r.priority] || r.priority,
    value: Number(r.count),
    fill: PRIORITY_COLORS[r.priority] || C.slate,
  }));

  const volumeData = (data?.volumeByDay || []).map(r => ({
    day: fmtDateShort(r.day),
    total: Number(r.count),
  }));

  const typeData = (data?.byType || []).map(r => ({
    name: TYPE_LABELS[r.type] || r.type,
    value: Number(r.count),
    fill: r.type === 'ticket' ? C.blue : r.type === 'request' ? C.purple : C.orange,
  }));

  const kpi = data?.kpi;

  // Medalhas para Top Suporte
  const medalIcons = [
    <Trophy className="w-4 h-4 text-yellow-400" />,
    <Medal className="w-4 h-4 text-gray-300" />,
    <Award className="w-4 h-4 text-amber-600" />,
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: '#020810' }}>
      <CircuitBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/10 to-black/30 pointer-events-none" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-md"
        style={{ background: 'rgba(2,8,16,0.85)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <BackButton variant="ghost" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 truncate">
                <TrendingUp className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                Dashboard de Relatórios
              </h1>
              <p className="text-white/40 text-xs hidden sm:block">Métricas em tempo real · Railway MySQL</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value as DateRange)}
                className="appearance-none bg-white/5 border border-white/10 text-white text-xs px-3 py-1.5 pr-7 rounded-lg cursor-pointer"
              >
                <option value="7">7 dias</option>
                <option value="14">14 dias</option>
                <option value="30">30 dias</option>
                <option value="60">60 dias</option>
                <option value="90">90 dias</option>
                <option value="365">1 ano</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 bg-cyan-600/80 hover:bg-cyan-600 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* ── Conteúdo ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 space-y-6">

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
            <p className="text-white/50 text-sm">Carregando métricas...</p>
          </div>
        )}

        {data && (
          <>
            {/* ── KPIs principais ── */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Indicadores — Últimos {dateRange} dias</h2>
              </div>

              {/* Taxa de resolução em destaque */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                {/* Card grande — Taxa de Resolução */}
                <div
                  className="lg:col-span-1 rounded-xl p-5 flex flex-col items-center justify-center gap-3 relative overflow-hidden"
                  style={{
                    background: 'rgba(34,197,94,0.08)',
                    border: `1px solid ${C.green}44`,
                    backdropFilter: 'blur(12px)',
                    boxShadow: `0 8px 32px ${C.green}18`,
                  }}
                >
                  {/* Anel de progresso */}
                  <div className="relative w-28 h-28">
                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                      <circle
                        cx="60" cy="60" r="50" fill="none"
                        stroke={kpi!.taxaResolucao >= 80 ? C.green : kpi!.taxaResolucao >= 50 ? C.yellow : C.red}
                        strokeWidth="10"
                        strokeDasharray={`${(kpi!.taxaResolucao / 100) * 314} 314`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 1s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span
                        className="text-3xl font-bold"
                        style={{ color: kpi!.taxaResolucao >= 80 ? C.green : kpi!.taxaResolucao >= 50 ? C.yellow : C.red }}
                      >
                        {kpi!.taxaResolucao}%
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold text-sm">Taxa de Resolução</p>
                    <p className="text-white/50 text-xs mt-0.5">{kpi!.resolvidos} de {kpi!.total} resolvidos</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: C.green }}>
                    <Target size={12} />
                    <span>Meta: 80%</span>
                  </div>
                </div>

                {/* KPIs secundários */}
                <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <KpiCard
                    title="Total de Chamados"
                    value={kpi!.total}
                    subtitle={`Últimos ${dateRange} dias`}
                    icon={<TicketCheck size={18} />}
                    color={C.blue}
                  />
                  <KpiCard
                    title="Em Aberto"
                    value={kpi!.abertos}
                    subtitle="Aguardando atendimento"
                    icon={<AlertTriangle size={18} />}
                    color={C.yellow}
                  />
                  <KpiCard
                    title="Em Andamento"
                    value={kpi!.em_andamento}
                    subtitle="Sendo atendidos agora"
                    icon={<Zap size={18} />}
                    color={C.purple}
                  />
                  <KpiCard
                    title="Resolvidos"
                    value={kpi!.resolvidos}
                    subtitle="Concluídos no período"
                    icon={<CheckCircle size={18} />}
                    color={C.green}
                  />
                  <KpiCard
                    title="Tempo Médio"
                    value={kpi!.avgResolutionFormatted}
                    subtitle="Para resolução"
                    icon={<Clock size={18} />}
                    color={C.teal}
                  />
                  <KpiCard
                    title="SLA Vencido"
                    value={kpi!.sla_vencido}
                    subtitle="Fora do prazo"
                    icon={<AlertCircle size={18} />}
                    color={kpi!.sla_vencido > 0 ? C.red : C.green}
                  />
                </div>
              </div>
            </section>

            {/* ── Gráficos de distribuição ── */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status dos chamados */}
              <div
                className="md:col-span-2 rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white/80">Status dos Chamados</h3>
                </div>
                {statusChartData.length > 0 ? (
                  <>
                    {/* Barras de progresso visuais */}
                    <div className="space-y-2.5 mb-4">
                      {statusChartData.map((s, i) => {
                        const total = statusChartData.reduce((a, b) => a + b.value, 0);
                        const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-xs text-white/60 w-28 flex-shrink-0 truncate">{s.name}</span>
                            <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-2 rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, background: s.fill }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-white w-8 text-right flex-shrink-0">{s.value}</span>
                            <span className="text-xs text-white/40 w-8 text-right flex-shrink-0">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Gráfico de pizza */}
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                          innerRadius={40} outerRadius={70}>
                          {statusChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-40 text-white/30 text-sm">Sem dados</div>
                )}
              </div>

              {/* Prioridade + Tipo */}
              <div className="flex flex-col gap-4">
                <div
                  className="flex-1 rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-semibold text-white/80">Por Prioridade</h3>
                  </div>
                  <div className="space-y-2">
                    {priorityChartData.map((p, i) => {
                      const total = priorityChartData.reduce((a, b) => a + b.value, 0);
                      const pct = total > 0 ? Math.round((p.value / total) * 100) : 0;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.fill }} />
                          <span className="text-xs text-white/60 flex-1">{p.name}</span>
                          <div className="w-16 bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: p.fill }} />
                          </div>
                          <span className="text-xs font-bold text-white w-6 text-right">{p.value}</span>
                        </div>
                      );
                    })}
                    {priorityChartData.length === 0 && (
                      <p className="text-white/30 text-xs text-center py-4">Sem dados</p>
                    )}
                  </div>
                </div>

                <div
                  className="flex-1 rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-semibold text-white/80">Por Tipo</h3>
                  </div>
                  <div className="space-y-2">
                    {typeData.map((t, i) => {
                      const total = typeData.reduce((a, b) => a + b.value, 0);
                      const pct = total > 0 ? Math.round((t.value / total) * 100) : 0;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: t.fill }} />
                          <span className="text-xs text-white/60 flex-1">{t.name}</span>
                          <div className="w-16 bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: t.fill }} />
                          </div>
                          <span className="text-xs font-bold text-white w-6 text-right">{t.value}</span>
                        </div>
                      );
                    })}
                    {typeData.length === 0 && (
                      <p className="text-white/30 text-xs text-center py-4">Sem dados</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* ── Volume por dia ── */}
            <section
              className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white/80">Volume de Chamados — Últimos 14 dias</h3>
              </div>
              {volumeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={volumeData}>
                    <defs>
                      <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.cyan} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={C.cyan} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...gridStyle} />
                    <XAxis dataKey="day" tick={axisStyle} />
                    <YAxis tick={axisStyle} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="total" name="Chamados" stroke={C.cyan}
                      fill="url(#volGrad)" strokeWidth={2} dot={{ fill: C.cyan, r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[180px] text-white/30 text-sm">Sem dados para o período</div>
              )}
            </section>

            {/* ── Chamados Recentes + Top Suporte ── */}
            <section className="grid grid-cols-1 xl:grid-cols-5 gap-4">

              {/* Chamados Recentes — 3/5 */}
              <div
                className="xl:col-span-3 rounded-xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TicketCheck className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-white/80">Chamados Recentes</h3>
                  </div>
                  <button
                    onClick={() => setLocation('/support')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                  >
                    Ver todos <Eye className="w-3 h-3" />
                  </button>
                </div>

                {data.recentTickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <TicketCheck className="w-10 h-10 text-white/15" />
                    <p className="text-white/30 text-sm">Nenhum chamado encontrado</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {data.recentTickets.map(t => (
                      <div
                        key={t.id}
                        className="px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors group"
                        onClick={() => setLocation(`/tickets/${t.id}`)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 p-1.5 rounded bg-white/5 text-white/40 flex-shrink-0">
                            {TYPE_ICONS[t.type] || <FileText className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-white text-sm font-medium truncate group-hover:text-cyan-300 transition-colors">
                                {t.title}
                              </p>
                              <Eye className="w-3.5 h-3.5 text-white/20 group-hover:text-cyan-400 flex-shrink-0 transition-colors" />
                            </div>
                            <p className="text-white/40 text-xs mt-0.5">
                              {t.requestId} · {t.userName} · {fmtDate(t.createdAt)}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <StatusBadge status={t.status} />
                              <PriorityBadge priority={t.priority} />
                              {t.assignedToName && (
                                <span className="text-white/30 text-xs">→ {t.assignedToName}</span>
                              )}
                              {t.companyName && (
                                <span className="text-white/25 text-xs">{t.companyName}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Suporte — 2/5 */}
              <div
                className="xl:col-span-2 rounded-xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <h3 className="text-sm font-semibold text-white/80">Top Suporte</h3>
                  <span className="ml-auto text-xs text-white/30">{dateRange} dias</span>
                </div>

                {data.topSupport.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Users className="w-10 h-10 text-white/15" />
                    <p className="text-white/30 text-sm text-center px-4">Nenhum agente com chamados atribuídos no período</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {data.topSupport.map((agent, idx) => (
                      <div key={agent.id} className="px-4 py-3 hover:bg-white/5 transition-colors">
                        <div className="flex items-start gap-3">
                          {/* Posição / medalha */}
                          <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                            style={{
                              background: idx === 0 ? 'rgba(234,179,8,0.15)' : idx === 1 ? 'rgba(156,163,175,0.15)' : idx === 2 ? 'rgba(180,83,9,0.15)' : 'rgba(255,255,255,0.05)',
                            }}
                          >
                            {idx < 3 ? medalIcons[idx] : <span className="text-xs font-bold text-white/40">{idx + 1}</span>}
                          </div>

                          {/* Avatar / Iniciais */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: `${C.cyan}22`, border: `1px solid ${C.cyan}33` }}
                          >
                            {agent.avatar
                              ? <img src={agent.avatar} alt={agent.name} className="w-full h-full rounded-full object-cover" />
                              : agent.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                            }
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{agent.name}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                              <span className="text-white/50 text-xs flex items-center gap-1">
                                <TicketCheck className="w-3 h-3" /> {agent.totalAtendidos} atendidos
                              </span>
                              <span className="text-green-400 text-xs flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> {agent.totalResolvidos} resolvidos
                              </span>
                            </div>
                            {/* Barra de taxa de resolução */}
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-1.5 rounded-full transition-all duration-700"
                                  style={{
                                    width: `${agent.taxaResolucao}%`,
                                    background: agent.taxaResolucao >= 80 ? C.green : agent.taxaResolucao >= 50 ? C.yellow : C.red,
                                  }}
                                />
                              </div>
                              <span className="text-xs font-bold flex-shrink-0"
                                style={{ color: agent.taxaResolucao >= 80 ? C.green : agent.taxaResolucao >= 50 ? C.yellow : C.red }}>
                                {agent.taxaResolucao}%
                              </span>
                            </div>
                            {/* Tempo médio */}
                            <div className="flex items-center gap-1 mt-1">
                              <Timer className="w-3 h-3 text-white/30" />
                              <span className="text-white/40 text-xs">Tempo médio: </span>
                              <span className="text-cyan-300 text-xs font-medium">
                                {agent.avgMinutes > 0 ? agent.avgFormatted : '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rodapé com gráfico de barras comparativo */}
                {data.topSupport.length > 0 && (
                  <div className="px-4 pt-3 pb-4 border-t border-white/10">
                    <p className="text-xs text-white/40 mb-2">Comparativo de atendimentos</p>
                    <ResponsiveContainer width="100%" height={80}>
                      <BarChart data={data.topSupport.slice(0, 5).map(a => ({
                        name: a.name.split(' ')[0],
                        atendidos: a.totalAtendidos,
                        resolvidos: a.totalResolvidos,
                      }))}>
                        <CartesianGrid {...gridStyle} />
                        <XAxis dataKey="name" tick={{ ...axisStyle, fontSize: 10 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="atendidos" name="Atendidos" fill={C.blue} radius={[2, 2, 0, 0]} />
                        <Bar dataKey="resolvidos" name="Resolvidos" fill={C.green} radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </section>

            {/* ── Gráfico de barras por status ── */}
            {statusChartData.length > 0 && (
              <section
                className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <BarChart className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-white/80">Distribuição Completa por Status</h3>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={statusChartData} layout="vertical">
                    <CartesianGrid {...gridStyle} />
                    <XAxis type="number" tick={axisStyle} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={120} tick={axisStyle} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" name="Chamados" radius={[0, 4, 4, 0]}>
                      {statusChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
