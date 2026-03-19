import { useState, useEffect, useCallback } from "react";
import BackButton from "@/components/BackButton";
import {
  Car, TrendingUp, DollarSign, Clock, Users, BarChart3,
  ChevronDown, RefreshCw, Download, AlertTriangle, Loader2,
  CheckCircle2, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { toast } from "sonner";
import Papa from "papaparse";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KPIs {
  total_solicitacoes: number;
  receita_total: string;
  valor_medio: string;
  duracao_media: string;
}

interface TicketKPIs {
  total: number;
  disponiveis: number;
  alocados: number;
  usados: number;
  expirados: number;
}

interface UsoDia {
  dia: string;
  total: number;
  receita: string;
}

interface TopUsuario {
  nome: string;
  email: string;
  total_solicitacoes: number;
  total_gasto: string;
  media_horas: string;
}

interface UsoDepartamento {
  departamento: string;
  total_usos: number;
  receita_total: string;
}

interface HistoricoItem {
  id: number;
  duracao_solicitada: number;
  valor_pago: string;
  data_solicitacao: string;
  status: string;
  usuario_nome: string;
  departamento: string;
  ticket_codigo: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAuthToken() { return localStorage.getItem("authToken"); }

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = getAuthToken();
  const res = await fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function fmtCurrency(v: string | number | null) {
  if (v === null || v === undefined || v === "") return "R$ 0,00";
  return `R$ ${parseFloat(String(v)).toFixed(2).replace(".", ",")}`;
}

function fmtDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function statusColor(status: string) {
  switch (status) {
    case "solicitado": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "aprovado": return "bg-green-500/20 text-green-300 border-green-500/30";
    case "usado": return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    case "cancelado": return "bg-red-500/20 text-red-300 border-red-500/30";
    default: return "bg-white/10 text-white/60 border-white/20";
  }
}

const CHART_COLORS = ["#00d4ff", "#3b82f6", "#a855f7", "#22c55e", "#f59e0b", "#ef4444"];

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function RHDashboardEstacionamento() {
  const [periodo, setPeriodo] = useState("mes");
  const [kpis, setKpis] = useState<KPIs>({ total_solicitacoes: 0, receita_total: "0", valor_medio: "0", duracao_media: "0" });
  const [ticketKpis, setTicketKpis] = useState<TicketKPIs>({ total: 0, disponiveis: 0, alocados: 0, usados: 0, expirados: 0 });
  const [usoPorDia, setUsoPorDia] = useState<UsoDia[]>([]);
  const [topUsuarios, setTopUsuarios] = useState<TopUsuario[]>([]);
  const [usoPorDepartamento, setUsoPorDepartamento] = useState<UsoDepartamento[]>([]);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/rh/dashboard-estacionamento?periodo=${periodo}`);
      setKpis(data.kpis || {});
      setTicketKpis(data.ticketKpis || {});
      setUsoPorDia(data.usoPorDia || []);
      setTopUsuarios(data.topUsuarios || []);
      setUsoPorDepartamento(data.usoPorDepartamento || []);
      setHistorico(data.historico || []);
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  function exportCSV() {
    const rows = historico.map(h => ({
      ID: h.id,
      Ticket: h.ticket_codigo,
      Usuário: h.usuario_nome,
      Departamento: h.departamento || "-",
      "Duração (h)": h.duracao_solicitada,
      "Valor Pago": h.valor_pago ? parseFloat(h.valor_pago).toFixed(2) : "0",
      Data: fmtDate(h.data_solicitacao),
      Status: h.status,
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-estacionamento-${periodo}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  }

  const chartDia = usoPorDia.map(d => ({
    dia: new Date(d.dia).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    Usos: d.total,
    Receita: parseFloat(d.receita || "0"),
  }));

  const chartDepto = usoPorDepartamento.slice(0, 8).map(d => ({
    name: d.departamento.length > 15 ? d.departamento.slice(0, 15) + "…" : d.departamento,
    Usos: d.total_usos,
    Receita: parseFloat(d.receita_total || "0"),
  }));

  const pieTickets = [
    { name: "Disponíveis", value: ticketKpis.disponiveis, color: "#22c55e" },
    { name: "Alocados", value: ticketKpis.alocados, color: "#3b82f6" },
    { name: "Usados", value: ticketKpis.usados, color: "#64748b" },
    { name: "Expirados", value: ticketKpis.expirados, color: "#ef4444" },
  ].filter(d => d.value > 0);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0e27 0%, #1e3a5f 50%, #0a0e27 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <BackButton to="/estacionamento" variant="ghost" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 shrink-0" />
                <span className="truncate">Dashboard — Estacionamento RH</span>
              </h1>
              <p className="text-white/50 text-xs sm:text-sm hidden sm:block">KPIs e relatórios do módulo de tickets</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a2744] border-white/10">
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="semana">Esta semana</SelectItem>
                <SelectItem value="mes">Este mês</SelectItem>
                <SelectItem value="todos">Todo período</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" onClick={fetchDashboard} className="text-white/50 hover:text-white">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={exportCSV} className="border-white/20 text-white/70 hover:text-white hover:bg-white/10">
              <Download className="w-4 h-4 mr-1" /> Exportar CSV
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total de Usos", value: kpis.total_solicitacoes || 0, sub: "solicitações", icon: <Car className="w-5 h-5" />, color: "text-cyan-400" },
                { label: "Receita Total", value: fmtCurrency(kpis.receita_total), sub: "no período", icon: <DollarSign className="w-5 h-5" />, color: "text-green-400" },
                { label: "Valor Médio", value: fmtCurrency(kpis.valor_medio), sub: "por ticket", icon: <TrendingUp className="w-5 h-5" />, color: "text-purple-400" },
                { label: "Duração Média", value: kpis.duracao_media ? `${parseFloat(kpis.duracao_media).toFixed(1)}h` : "0h", sub: "por solicitação", icon: <Clock className="w-5 h-5" />, color: "text-yellow-400" },
              ].map(kpi => (
                <Card key={kpi.label} className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/50 text-xs">{kpi.label}</span>
                      <span className={kpi.color}>{kpi.icon}</span>
                    </div>
                    <p className={`text-base sm:text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-white/30 text-xs mt-0.5">{kpi.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Histórico completo */}
            <Card className="bg-white/5 border-white/10 mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" /> Histórico de Solicitações
                  <span className="ml-auto text-white/30 text-xs font-normal">{historico.length} registros</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        {["Ticket", "Usuário", "Departamento", "Duração", "Valor", "Data", "Status"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {historico.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-8 text-white/30">Nenhum registro encontrado</td></tr>
                      ) : historico.map((h, idx) => (
                        <tr key={`hist-${h.id ?? idx}`} className="hover:bg-white/5 transition-colors" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <td className="px-4 py-3 text-cyan-400 font-mono text-xs">{h.ticket_codigo || "-"}</td>
                          <td className="px-4 py-3 text-white/80 max-w-[140px] truncate">{h.usuario_nome || "-"}</td>
                          <td className="px-4 py-3 text-white/60 max-w-[120px] truncate">{h.departamento || "-"}</td>
                          <td className="px-4 py-3 text-white/70">{h.duracao_solicitada}h</td>
                          <td className="px-4 py-3 text-white/80">{fmtCurrency(h.valor_pago)}</td>
                          <td className="px-4 py-3 text-white/40 text-xs">{fmtDate(h.data_solicitacao)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${statusColor(h.status)}`}>
                              {h.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Status tickets + Gráfico uso por dia */}
            <div className="grid lg:grid-cols-3 gap-4 mb-6">
              {/* Status tickets */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Car className="w-4 h-4 text-cyan-400" /> Status dos Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pieTickets.length === 0 ? (
                    <div className="text-center py-6 text-white/30 text-sm">Sem dados</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={pieTickets} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={2}>
                            {pieTickets.map((entry, i) => (
                              <Cell key={`cell-${i}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: "#1a2744", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 gap-1 mt-2">
                        {pieTickets.map(d => (
                          <div key={d.name} className="flex items-center gap-1.5 text-xs">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                            <span className="text-white/60">{d.name}: <span className="text-white font-medium">{d.value}</span></span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Uso por dia */}
              <Card className="lg:col-span-2 bg-white/5 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" /> Uso por Dia (últimos 30 dias)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {chartDia.length === 0 ? (
                    <div className="text-center py-8 text-white/30 text-sm">Sem dados no período</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={chartDia}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="dia" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                        <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#1a2744", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
                        <Line type="monotone" dataKey="Usos" stroke="#00d4ff" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Uso por departamento + Top usuários */}
            <div className="grid lg:grid-cols-2 gap-4 mb-6">
              {/* Por departamento */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-purple-400" /> Uso por Departamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {chartDepto.length === 0 ? (
                    <div className="text-center py-8 text-white/30 text-sm">Sem dados</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartDepto} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} width={90} />
                        <Tooltip contentStyle={{ background: "#1a2744", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
                        <Bar dataKey="Usos" fill="#a855f7" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Top usuários */}
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-yellow-400" /> Top 10 Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topUsuarios.length === 0 ? (
                    <div className="text-center py-8 text-white/30 text-sm">Sem dados</div>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {topUsuarios.map((u, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                          <span className="text-white/30 text-xs font-mono w-5 text-center">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white/80 text-xs truncate">{u.nome || u.email}</p>
                            <p className="text-white/40 text-xs">{u.total_solicitacoes} uso{u.total_solicitacoes !== 1 ? "s" : ""} · {fmtCurrency(u.total_gasto)}</p>
                          </div>
                          <span className="text-yellow-400 text-xs font-medium">{u.total_solicitacoes}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>


          </>
        )}
      </div>
    </div>
  );
}
