// Build: 2026-03-18 teams-card-v2
import React, { useState, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Activity, AlertCircle, AlertTriangle, CheckCircle,
  Clock, FileText, RefreshCw, TicketCheck,
  Target, Zap, Users,
} from 'lucide-react';
import { useLocation } from 'wouter';
// Navega para listagem passando filtro via localStorage (SPA — query string não é preservada pelo Vite)
const navTo = (path: string) => {
  const url = new URL(path, window.location.origin);
  const status   = url.searchParams.get('status');
  const priority = url.searchParams.get('priority');
  const type     = url.searchParams.get('type');
  const sla      = url.searchParams.get('sla');
  const source   = url.searchParams.get('source');
  const filter: Record<string, string> = {};
  if (status)   filter.status   = status;
  if (priority) filter.priority = priority;
  if (type)     filter.type     = type;
  if (sla)      filter.sla      = sla;
  if (source)   filter.source   = source;
  localStorage.setItem('allTicketsFilter', JSON.stringify(filter));
  window.location.href = url.pathname;
};
import BackButton from '@/components/BackButton';
import UserMenu from '@/components/UserMenu';
import CircuitBackground from '@/components/CircuitBackground';
import { toast } from 'sonner';

const C = {
  blue:   '#3b82f6', green:  '#22c55e', yellow: '#f59e0b',
  red:    '#ef4444', purple: '#a855f7', teal:   '#14b8a6',
  slate:  '#64748b', orange: '#f97316', cyan:   '#06b6d4',
};

const STATUS_COLORS: Record<string, string> = {
  aberto: C.blue, em_andamento: C.purple, aguardando: C.yellow,
  resolvido: C.green, encerrado: C.slate, em_analise: C.orange,
  ag_aprovacao: C.orange, aguardando_aprovacao: C.orange, fechado: C.slate,
};
const STATUS_LABELS: Record<string, string> = {
  aberto: 'Aberto', em_andamento: 'Em Andamento', aguardando: 'Aguardando',
  resolvido: 'Resolvido', encerrado: 'Encerrado', em_analise: 'Em Análise',
  ag_aprovacao: 'Ag. Aprovação', aguardando_aprovacao: 'Ag. Aprovação', fechado: 'Fechado',
};
const PRIORITY_COLORS: Record<string, string> = {
  critica: C.red, alta: C.orange, media: C.yellow, baixa: C.green,
};
const PRIORITY_LABELS: Record<string, string> = {
  critica: 'Crítica', alta: 'Alta', media: 'Média', baixa: 'Baixa',
};
const TYPE_COLORS: Record<string, string> = {
  ticket: C.blue, request: C.purple, occurrence: C.orange,
};
const TYPE_LABELS: Record<string, string> = {
  ticket: 'Chamado', request: 'Requisição', occurrence: 'Ocorrência',
};

interface KpiData {
  total: number; abertos: number; resolvidos: number;
  em_andamento: number; aguardando: number; sla_vencido: number;
  taxaResolucao: number; avgResolutionFormatted: string;
  teamsCount?: number;
}
interface DashData {
  period: number;
  kpi: KpiData;
  byStatus: { status: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  byType: { type: string; count: number }[];
}

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
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

interface KpiCardProps {
  title: string; value: string | number; subtitle?: string;
  icon: React.ReactNode; color: string; onClick?: () => void;
}
function KpiCard({ title, value, subtitle, icon, color, onClick }: KpiCardProps) {
  return (
    <div
      className={`rounded-xl p-4 sm:p-5 flex flex-col gap-2 transition-all duration-300 hover:scale-[1.03] ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        background: 'rgba(255,255,255,0.06)', border: `1px solid ${color}33`,
        backdropFilter: 'blur(12px)', boxShadow: `0 4px 24px ${color}18`,
      }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm text-white/60 font-medium leading-tight">{title}</span>
        <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}22`, color }}>
          {icon}
        </span>
      </div>
      <div>
        <span className="font-bold text-white text-2xl sm:text-3xl">{value}</span>
        {subtitle && <p className="text-xs text-white/50 mt-1">{subtitle}</p>}
      </div>
      {onClick && (
        <div className="flex items-center gap-1 text-xs mt-1" style={{ color }}>
          <span>Ver chamados →</span>
        </div>
      )}
    </div>
  );
}

const tooltipStyle = {
  background: '#0d1b2a', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#fff', fontSize: 12,
};
const axisStyle = { fill: 'rgba(255,255,255,0.45)', fontSize: 11 };
const gridStyle = { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.06)' };

const AllTickets: React.FC = () => {
  useLocation(); // mantido para compatibilidade de contexto
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const d = await apiFetch('/api/support/dashboard-reports?days=30');
      setData(d);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar dados');
      toast.error('Erro ao carregar dados');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const kpi = data?.kpi;
  const statusChartData = (data?.byStatus || []).map(s => ({
    name: STATUS_LABELS[s.status] || s.status, value: s.count,
    color: STATUS_COLORS[s.status] || C.slate, raw: s.status,
  }));
  const priorityChartData = (data?.byPriority || []).map(p => ({
    name: PRIORITY_LABELS[p.priority] || p.priority, value: p.count,
    color: PRIORITY_COLORS[p.priority] || C.slate, raw: p.priority,
  }));
  const typeChartData = (data?.byType || []).map(t => ({
    name: TYPE_LABELS[t.type] || t.type, value: t.count,
    color: TYPE_COLORS[t.type] || C.slate, raw: t.type,
  }));

  return (
    <div className="min-h-screen relative" style={{ background: '#020810' }}>
      <CircuitBackground />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(2,8,16,0.12) 0%, rgba(2,8,16,0.04) 50%, rgba(2,8,16,0.18) 100%)' }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-40 glassmorphic border-b border-white/10 px-4 py-3 flex items-center justify-between"
        style={{ position: 'relative', zIndex: 10 }}
      >
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h1 className="text-base sm:text-lg font-bold text-white">Painel de Chamados</h1>
            </div>
            <p className="text-xs text-white/50">Visão geral de todos os chamados, requisições e ocorrências</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <UserMenu />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6" style={{ position: 'relative', zIndex: 2 }}>

        {/* Loading */}
        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-white/50 text-sm">Carregando dados...</p>
            </div>
          </div>
        )}

        {/* Erro */}
        {error && !data && (
          <div className="rounded-xl p-6 text-center" style={{ background: `${C.red}11`, border: `1px solid ${C.red}33` }}>
            <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: C.red }} />
            <p className="text-white/70 text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="mt-3 px-4 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: `${C.red}22`, color: C.red }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {kpi && (
          <>
            {/* ── Indicadores ── */}
            <section
              className="rounded-2xl p-4 sm:p-6"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                  Indicadores — Últimos 30 dias
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Card grande — Taxa de Resolução */}
                <div
                  className="lg:col-span-1 rounded-xl p-5 flex flex-col items-center justify-center gap-3 relative overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
                  style={{
                    background: 'rgba(34,197,94,0.08)',
                    border: `1px solid ${C.green}44`,
                    backdropFilter: 'blur(12px)',
                    boxShadow: `0 8px 32px ${C.green}18`,
                  }}
                  onClick={() => navTo('/chamados/lista')}
                >
                  <div className="relative w-28 h-28">
                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                      <circle
                        cx="60" cy="60" r="50" fill="none"
                        stroke={kpi.taxaResolucao >= 80 ? C.green : kpi.taxaResolucao >= 50 ? C.yellow : C.red}
                        strokeWidth="10"
                        strokeDasharray={`${(kpi.taxaResolucao / 100) * 314} 314`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 1s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span
                        className="text-3xl font-bold"
                        style={{ color: kpi.taxaResolucao >= 80 ? C.green : kpi.taxaResolucao >= 50 ? C.yellow : C.red }}
                      >
                        {kpi.taxaResolucao}%
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold text-sm">Taxa de Resolução</p>
                    <p className="text-white/50 text-xs mt-0.5">{kpi.resolvidos} de {kpi.total} resolvidos</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: C.green }}>
                    <Target size={12} />
                    <span>Meta: 80%</span>
                  </div>
                </div>

                {/* KPIs secundários */}
                <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <KpiCard
                    title="Todos os Chamados"
                    value={kpi.total}
                    subtitle="Últimos 30 dias"
                    icon={<Users size={18} />}
                    color={C.blue}
                    onClick={() => navTo('/chamados/lista')}
                  />
                  <KpiCard
                    title="Em Aberto"
                    value={kpi.abertos}
                    subtitle="Aguardando atendimento"
                    icon={<AlertTriangle size={18} />}
                    color={C.yellow}
                    onClick={() => navTo('/chamados/lista?status=aberto')}
                  />
                  <KpiCard
                    title="Em Andamento"
                    value={kpi.em_andamento}
                    subtitle="Sendo atendidos agora"
                    icon={<Zap size={18} />}
                    color={C.purple}
                    onClick={() => navTo('/chamados/lista?status=em_andamento')}
                  />
                  <KpiCard
                    title="Resolvidos"
                    value={kpi.resolvidos}
                    subtitle="Concluídos no período"
                    icon={<CheckCircle size={18} />}
                    color={C.green}
                    onClick={() => navTo('/chamados/lista?status=resolvido')}
                  />
                  <KpiCard
                    title="Tempo Médio"
                    value={kpi.avgResolutionFormatted}
                    subtitle="Para resolução"
                    icon={<Clock size={18} />}
                    color={C.teal}
                  />
                  <KpiCard
                    title="SLA Vencido"
                    value={kpi.sla_vencido}
                    subtitle="Fora do prazo"
                    icon={<AlertCircle size={18} />}
                    color={kpi.sla_vencido > 0 ? C.red : C.green}
                    onClick={kpi.sla_vencido > 0 ? () => navTo('/chamados/lista?sla=vencido') : undefined}
                  />
                  <KpiCard
                    title="Chamados via Teams"
                    value={kpi.teamsCount ?? 0}
                    subtitle="Recebidos pelo Microsoft Teams"
                    icon={
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M20.625 5.625a2.625 2.625 0 1 0 0-5.25 2.625 2.625 0 0 0 0 5.25zm0 0" />
                        <path d="M16.5 6.75h-1.875A4.125 4.125 0 0 1 10.5 10.5v4.875a2.625 2.625 0 0 0 5.25 0V9.375h.75a3.375 3.375 0 0 0 3.375-3.375v-.375A2.25 2.25 0 0 0 17.625 3.375H16.5V6.75zm0 0" />
                        <path d="M9 3.75a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 0" />
                        <path d="M13.5 7.5H4.5A4.5 4.5 0 0 0 0 12v5.25a2.25 2.25 0 0 0 4.5 0V12a.75.75 0 0 1 .75-.75h8.25a.75.75 0 0 1 .75.75v5.25a2.25 2.25 0 0 0 4.5 0V12a4.5 4.5 0 0 0-4.5-4.5zm0 0" />
                      </svg>
                    }
                    color="#6264A7"
                    onClick={() => navTo('/chamados/lista?source=teams')}
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
                  <h3 className="text-sm font-semibold text-white/70">Status dos Chamados</h3>
                </div>
                <div className="space-y-2 mb-5">
                  {statusChartData.map(s => {
                    const tot = statusChartData.reduce((a, b) => a + b.value, 0) || 1;
                    const pct = Math.round((s.value / tot) * 100);
                    return (
                      <div
                        key={s.name}
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => navTo(`/chamados/lista?status=${s.raw}`)}
                      >
                        <span className="text-xs text-white/60 w-24 shrink-0 group-hover:text-white transition-colors">{s.name}</span>
                        <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: s.color }} />
                        </div>
                        <span className="text-xs text-white/50 w-6 text-right">{s.value}</span>
                        <span className="text-xs w-8 text-right" style={{ color: s.color }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={75}
                        paddingAngle={3} dataKey="value"
                      >
                        {statusChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend
                        iconType="circle" iconSize={8}
                        formatter={(v) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{v}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Coluna direita: Prioridade + Tipo */}
              <div className="flex flex-col gap-4">
                <div
                  className="rounded-xl p-4 flex-1"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-sm font-semibold text-white/70">Por Prioridade</h3>
                  </div>
                  <div className="space-y-2">
                    {priorityChartData.map(p => {
                      const tot = priorityChartData.reduce((a, b) => a + b.value, 0) || 1;
                      const pct = Math.round((p.value / tot) * 100);
                      return (
                        <div key={p.name} className="flex items-center gap-2 cursor-pointer group" onClick={() => navTo(`/chamados/lista?priority=${p.raw}`)}>
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                          <span className="text-xs text-white/60 flex-1 group-hover:text-white transition-colors">{p.name}</span>
                          <div className="w-20 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: p.color }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: p.color }}>{p.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div
                  className="rounded-xl p-4 flex-1"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-semibold text-white/70">Por Tipo</h3>
                  </div>
                  <div className="space-y-2">
                    {typeChartData.map(t => {
                      const tot = typeChartData.reduce((a, b) => a + b.value, 0) || 1;
                      const pct = Math.round((t.value / tot) * 100);
                      return (
                        <div key={t.name} className="flex items-center gap-2 cursor-pointer group" onClick={() => navTo(`/chamados/lista?type=${t.raw}`)}>
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color }} />
                          <span className="text-xs text-white/60 flex-1 group-hover:text-white transition-colors">{t.name}</span>
                          <div className="w-20 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: t.color }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: t.color }}>{t.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* ── Gráfico de barras horizontal por status ── */}
            <section
              className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <TicketCheck className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white/70">Distribuição por Status</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusChartData} layout="vertical" margin={{ left: 60, right: 20, top: 0, bottom: 0 }}>
                  <CartesianGrid {...gridStyle} horizontal={false} />
                  <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={20}>
                    {statusChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AllTickets;
