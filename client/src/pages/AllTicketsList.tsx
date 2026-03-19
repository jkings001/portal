import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  FileText, Layers, AlertTriangle, Clock, RefreshCw, AlertCircle,
  CheckCircle, XCircle, Zap, Eye, Search, Filter, Users,
  ChevronLeft, ChevronRight, Activity, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BackButton from "@/components/BackButton";
import UserMenu from "@/components/UserMenu";
import CircuitBackground from "@/components/CircuitBackground";

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function apiFetch(url: string, opts: RequestInit = {}) {
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...(opts.headers || {}) },
  });
}

// ─── Status / Priority / Type maps ───────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  aberto:               { label: "Aberto",        color: "bg-blue-500/20 text-blue-300 border-blue-500/30",       icon: <Clock className="w-3 h-3" /> },
  em_analise:           { label: "Em Análise",    color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", icon: <RefreshCw className="w-3 h-3" /> },
  aguardando_aprovacao: { label: "Ag. Aprovação", color: "bg-orange-500/20 text-orange-300 border-orange-500/30", icon: <AlertCircle className="w-3 h-3" /> },
  aprovado:             { label: "Aprovado",      color: "bg-teal-500/20 text-teal-300 border-teal-500/30",       icon: <CheckCircle className="w-3 h-3" /> },
  rejeitado:            { label: "Rejeitado",     color: "bg-red-500/20 text-red-300 border-red-500/30",          icon: <XCircle className="w-3 h-3" /> },
  em_andamento:         { label: "Em Andamento",  color: "bg-purple-500/20 text-purple-300 border-purple-500/30", icon: <Zap className="w-3 h-3" /> },
  resolvido:            { label: "Resolvido",     color: "bg-green-500/20 text-green-300 border-green-500/30",    icon: <CheckCircle className="w-3 h-3" /> },
  fechado:              { label: "Fechado",       color: "bg-gray-500/20 text-gray-400 border-gray-500/30",       icon: <XCircle className="w-3 h-3" /> },
  cancelado:            { label: "Cancelado",     color: "bg-red-900/20 text-red-400 border-red-900/30",          icon: <XCircle className="w-3 h-3" /> },
};
const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  critica: { label: "Crítica", color: "bg-red-500/20 text-red-300 border-red-500/30" },
  alta:    { label: "Alta",    color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  media:   { label: "Média",   color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  baixa:   { label: "Baixa",   color: "bg-green-500/20 text-green-300 border-green-500/30" },
};
const TYPE_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  ticket:     { label: "Chamado",    icon: <FileText className="w-3 h-3" /> },
  request:    { label: "Requisição", icon: <Layers className="w-3 h-3" /> },
  occurrence: { label: "Ocorrência", icon: <AlertTriangle className="w-3 h-3" /> },
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface TicketItem {
  id: number;
  requestId: string;
  type: string;
  title: string;
  status: string;
  priority: string;
  category: string | null;
  userName: string;
  userEmail: string;
  assignedToName: string | null;
  companyName: string | null;
  slaDeadline: string | null;
  slaBreachedNow: number;
  slaMinutesLeft: number | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

// ─── Título da página baseado no filtro ───────────────────────────────────────
function getPageTitle(status: string, priority: string, type: string): string {
  if (status && status !== "__all__") {
    const s = STATUS_MAP[status];
    return s ? `Chamados — ${s.label}` : `Chamados — ${status}`;
  }
  if (priority && priority !== "__all__") {
    const p = PRIORITY_MAP[priority];
    return p ? `Chamados — Prioridade ${p.label}` : `Chamados — ${priority}`;
  }
  if (type && type !== "__all__") {
    const t = TYPE_MAP[type];
    return t ? `${t.label}s` : `Chamados — ${type}`;
  }
  return "Todos os Chamados";
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AllTicketsList() {
   const [, setLocation] = useLocation();
  // Lê filtro do localStorage (passado pela página de dashboard via navTo)
  const savedFilter = (() => {
    try { return JSON.parse(localStorage.getItem('allTicketsFilter') || '{}'); }
    catch { return {}; }
  })();
  // Limpa o filtro do localStorage após ler (evita persistência indesejada)
  useEffect(() => { localStorage.removeItem('allTicketsFilter'); }, []);
  const initialStatus   = savedFilter.status   || "__all__";
  const initialPriority = savedFilter.priority || "__all__";
  const initialType     = savedFilter.type     || "__all__";
  const initialSource   = savedFilter.source   || "__all__";

  const [items, setItems]           = useState<TicketItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType]         = useState(initialType);
  const [filterStatus, setFilterStatus]     = useState(initialStatus);
  const [filterPriority, setFilterPriority] = useState(initialPriority);
  const [filterSource, setFilterSource]     = useState(initialSource);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const LIMIT = 20;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, filterType, filterStatus, filterPriority, filterSource]);

  // Fetch items (tab=all — sem filtro de usuário)
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        tab: "all",
        page: String(page),
        limit: String(LIMIT),
        sortBy: "createdAt",
        sortDir: "DESC",
      });
      if (debouncedSearch)                   params.set("search",   debouncedSearch);
      if (filterType     !== "__all__")      params.set("type",     filterType);
      if (filterStatus   !== "__all__")      params.set("status",   filterStatus);
      if (filterPriority !== "__all__")      params.set("priority", filterPriority);
      if (filterSource   !== "__all__")      params.set("source",   filterSource);

      const res = await apiFetch(`/api/support/items?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.pages || 1);
    } catch (e: any) {
      setError(e.message || "Erro ao carregar chamados");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filterType, filterStatus, filterPriority, filterSource]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const pageTitle = filterSource === 'teams' ? 'Chamados via Microsoft Teams' : getPageTitle(filterStatus, filterPriority, filterType);

  return (
    <div className="min-h-screen relative" style={{ background: "#020810" }}>
      <CircuitBackground />
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1, background: "linear-gradient(to bottom, rgba(2,8,16,0.12) 0%, rgba(2,8,16,0.04) 50%, rgba(2,8,16,0.18) 100%)" }} />

      {/* Header */}
      <header className="sticky top-0 z-40 glassmorphic border-b border-white/10 px-4 py-3 flex items-center justify-between" style={{ position: "relative", zIndex: 10 }}>
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h1 className="text-lg font-bold text-white">{pageTitle}</h1>
            </div>
            <p className="text-xs text-white/50">
              {total > 0 ? `${total} registro${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}` : "Visão geral de todos os chamados"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-white/10 text-white/60 hover:text-white hover:border-cyan-500/40"
            onClick={() => setLocation("/chamados")}
          >
            <Activity className="w-4 h-4 mr-1" />
            Dashboard
          </Button>
          <UserMenu />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4" style={{ position: "relative", zIndex: 2 }}>

        {/* Filtros */}
        <Card className="glassmorphic border-white/10">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Busca */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  placeholder="Buscar por título, ID ou usuário..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50"
                />
              </div>

              {/* Filtro Tipo */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                  <Filter className="w-3 h-3 mr-1 text-white/40" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1117] border-white/10">
                  <SelectItem value="__all__">Todos os tipos</SelectItem>
                  <SelectItem value="ticket">Chamado</SelectItem>
                  <SelectItem value="request">Requisição</SelectItem>
                  <SelectItem value="occurrence">Ocorrência</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro Status */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1117] border-white/10">
                  <SelectItem value="__all__">Todos os status</SelectItem>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="aguardando_aprovacao">Ag. Aprovação</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtro Prioridade */}
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1117] border-white/10">
                  <SelectItem value="__all__">Todas as prioridades</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>

              {/* Badge filtro Teams ativo */}
              {filterSource === 'teams' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Filtro: Microsoft Teams</span>
                  <button
                    className="ml-1 text-blue-400 hover:text-white transition-colors"
                    onClick={() => setFilterSource("__all__")}
                    title="Remover filtro Teams"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Limpar filtros */}
              {(filterType !== "__all__" || filterStatus !== "__all__" || filterPriority !== "__all__" || filterSource !== "__all__" || search) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/40 hover:text-white"
                  onClick={() => { setFilterType("__all__"); setFilterStatus("__all__"); setFilterPriority("__all__"); setFilterSource("__all__"); setSearch(""); }}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de chamados */}
        <Card className="glassmorphic border-white/10">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-white/80 text-sm font-medium flex items-center gap-2">
              {filterSource === 'teams' ? <MessageSquare className="w-4 h-4 text-blue-400" /> : <Users className="w-4 h-4 text-cyan-400" />}
              {filterSource === 'teams' ? 'Chamados via Microsoft Teams' : getPageTitle(filterStatus, filterPriority, filterType)}
              {!loading && (
                <span className="ml-auto text-white/40 text-xs font-normal">
                  {total} item{total !== 1 ? "s" : ""}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                <span className="ml-2 text-white/60">Carregando chamados...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-red-300 text-sm">{error}</p>
                <Button size="sm" variant="outline" className="border-white/10 text-white/60" onClick={fetchItems}>
                  Tentar novamente
                </Button>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <FileText className="w-10 h-10 text-white/20" />
                <p className="text-white/40 text-sm">Nenhum chamado encontrado com os filtros selecionados</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-cyan-400 hover:text-cyan-300"
                  onClick={() => { setFilterType("__all__"); setFilterStatus("__all__"); setFilterPriority("__all__"); setSearch(""); }}
                >
                  Limpar filtros
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {items.map(item => {
                  const st = STATUS_MAP[item.status]   || { label: item.status,   color: "bg-gray-500/20 text-gray-300 border-gray-500/30", icon: null };
                  const pr = PRIORITY_MAP[item.priority] || { label: item.priority, color: "bg-gray-500/20 text-gray-300" };
                  const tp = TYPE_MAP[item.type]        || { label: item.type,     icon: null };
                  return (
                    <div
                      key={item.id}
                      className="px-4 py-4 hover:bg-white/5 cursor-pointer transition-colors group"
                      onClick={() => setLocation(`/tickets/${item.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Ícone do tipo */}
                        <div className="mt-0.5 p-1.5 rounded bg-white/5 text-white/40 flex-shrink-0">
                          {tp.icon}
                        </div>
                        {/* Conteúdo principal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-white font-medium truncate group-hover:text-cyan-300 transition-colors">
                                {item.title}
                              </p>
                              <p className="text-white/40 text-xs mt-0.5">
                                {item.requestId} · {tp.label} · {formatDate(item.createdAt)}
                              </p>
                            </div>
                            <Eye className="w-4 h-4 text-white/20 group-hover:text-cyan-400 flex-shrink-0 mt-0.5 transition-colors" />
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <Badge className={`text-xs border ${st.color} flex items-center gap-1`}>
                              {st.icon} {st.label}
                            </Badge>
                            <Badge className={`text-xs border ${pr.color}`}>
                              {pr.label}
                            </Badge>
                            {/* Usuário solicitante */}
                            <span className="text-white/30 text-xs flex items-center gap-1">
                              <Users className="w-3 h-3" /> {item.userName}
                            </span>
                            {item.slaBreachedNow ? (
                              <Badge className="text-xs border bg-red-500/20 text-red-300 border-red-500/30 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> SLA Vencido
                              </Badge>
                            ) : item.slaMinutesLeft !== null && item.slaMinutesLeft < 120 ? (
                              <Badge className="text-xs border bg-orange-500/20 text-orange-300 border-orange-500/30">
                                SLA: {item.slaMinutesLeft}min
                              </Badge>
                            ) : null}
                            {/* Badge Teams para chamados originados pelo Teams */}
                            {filterSource === 'teams' && (
                              <Badge className="text-xs border bg-blue-500/15 text-blue-300 border-blue-500/30 flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> Teams
                              </Badge>
                            )}
                            {item.assignedToName && (
                              <span className="text-white/30 text-xs">→ {item.assignedToName}</span>
                            )}
                            {item.companyName && (
                              <span className="text-white/20 text-xs">{item.companyName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-white/40 text-sm">
              Página {page} de {totalPages} · {total} itens
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-white/10 text-white/60 hover:text-white"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white/10 text-white/60 hover:text-white"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
