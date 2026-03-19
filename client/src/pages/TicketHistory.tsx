import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Search, Filter, Plus, Eye, Clock, CheckCircle, AlertCircle,
  AlertTriangle, XCircle, RefreshCw, FileText, Zap, Layers,
  ChevronLeft, ChevronRight, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import BackButton from "@/components/BackButton";
import UserMenu from "@/components/UserMenu";
import CircuitBackground from "@/components/CircuitBackground";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── Status / Priority helpers ────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  aberto:               { label: "Aberto",              color: "bg-blue-500/20 text-blue-300 border-blue-500/30",    icon: <Clock className="w-3 h-3" /> },
  em_analise:           { label: "Em Análise",          color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", icon: <RefreshCw className="w-3 h-3" /> },
  aguardando_aprovacao: { label: "Ag. Aprovação",       color: "bg-orange-500/20 text-orange-300 border-orange-500/30", icon: <AlertCircle className="w-3 h-3" /> },
  aprovado:             { label: "Aprovado",            color: "bg-teal-500/20 text-teal-300 border-teal-500/30",    icon: <CheckCircle className="w-3 h-3" /> },
  rejeitado:            { label: "Rejeitado",           color: "bg-red-500/20 text-red-300 border-red-500/30",       icon: <XCircle className="w-3 h-3" /> },
  em_andamento:         { label: "Em Andamento",        color: "bg-purple-500/20 text-purple-300 border-purple-500/30", icon: <Zap className="w-3 h-3" /> },
  resolvido:            { label: "Resolvido",           color: "bg-green-500/20 text-green-300 border-green-500/30", icon: <CheckCircle className="w-3 h-3" /> },
  fechado:              { label: "Fechado",             color: "bg-gray-500/20 text-gray-400 border-gray-500/30",    icon: <XCircle className="w-3 h-3" /> },
  cancelado:            { label: "Cancelado",           color: "bg-red-900/20 text-red-400 border-red-900/30",       icon: <XCircle className="w-3 h-3" /> },
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
  description: string;
  status: string;
  priority: string;
  category: string | null;
  userName: string;
  userEmail: string;
  assignedToName: string | null;
  companyName: string | null;
  departmentName: string | null;
  slaDeadline: string | null;
  slaBreachedNow: number;
  slaMinutesLeft: number | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

interface StatsData {
  total: number;
  aberto: number;
  em_andamento: number;
  resolvido: number;
  fechado: number;
  slaBreached: number;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <Card className="glassmorphic border-white/10">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-white/60">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Action Card ─────────────────────────────────────────────────────────────
interface ActionCardProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  borderColor: string;
  onClick: () => void;
}

function ActionCard({ icon, label, description, color, borderColor, onClick }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${borderColor}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = borderColor.replace("0.2", "0.5");
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.4), 0 0 16px ${borderColor.replace("0.2", "0.1")}`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = borderColor;
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.3)";
      }}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${color} transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        <div>
          <p className="text-white font-semibold text-sm">{label}</p>
          <p className="text-white/50 text-xs mt-0.5">{description}</p>
        </div>
        <Plus className="w-4 h-4 text-white/30 group-hover:text-white/70 ml-auto transition-colors" />
      </div>
    </button>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────
interface CreateModalProps {
  open: boolean;
  type: "ticket" | "request" | "occurrence";
  onClose: () => void;
  onSuccess: () => void;
}

const TYPE_LABELS = {
  ticket:     { title: "Novo Chamado",    placeholder: "Descreva o problema ou solicitação..." },
  request:    { title: "Nova Requisição", placeholder: "Descreva a requisição em detalhes..." },
  occurrence: { title: "Nova Ocorrência", placeholder: "Descreva a ocorrência em detalhes..." },
};

function CreateModal({ open, type, onClose, onSuccess }: CreateModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("media");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setPriority("media");
      setCategory("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Título obrigatório: informe um título para continuar.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/support/items", {
        method: "POST",
        body: JSON.stringify({ type, title: title.trim(), description: description.trim(), priority, category: category.trim() || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || "Erro ao criar");
      }
      toast.success(`${TYPE_LABELS[type].title} aberto com sucesso!`);
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar");
    } finally {
      setSubmitting(false);
    }
  };

  const info = TYPE_LABELS[type];

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="glassmorphic border-white/10 text-white max-w-[95vw] sm:max-w-lg max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            {type === "ticket" && <FileText className="w-5 h-5 text-cyan-400" />}
            {type === "request" && <Layers className="w-5 h-5 text-purple-400" />}
            {type === "occurrence" && <AlertTriangle className="w-5 h-5 text-orange-400" />}
            {info.title}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-white/80 text-sm">Título <span className="text-red-400">*</span></Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Resumo do problema ou solicitação"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/80 text-sm">Descrição</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={info.placeholder}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[100px] resize-none"
              maxLength={2000}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-white/80 text-sm">Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/80 text-sm">Categoria</Label>
              <Input
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="Ex: Hardware, Acesso..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                maxLength={100}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-white/10 text-white/60 hover:text-white"
              onClick={onClose}
              disabled={submitting}
            >
              <X className="w-4 h-4 mr-1" /> Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30"
              disabled={submitting}
            >
              {submitting ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              {submitting ? "Criando..." : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TicketHistory() {
  const [, setLocation] = useLocation();
  const [items, setItems] = useState<TicketItem[]>([]);
  const [stats, setStats] = useState<StatsData>({ total: 0, aberto: 0, em_andamento: 0, resolvido: 0, fechado: 0, slaBreached: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState("__all__");
  const [filterStatus, setFilterStatus] = useState("__all__");
  const [filterPriority, setFilterPriority] = useState("__all__");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"ticket" | "request" | "occurrence">("ticket");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, filterType, filterStatus, filterPriority]);

  // Fetch items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        tab: "mine",
        page: String(page),
        limit: String(LIMIT),
        sortBy: "createdAt",
        sortDir: "DESC",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filterType !== "__all__") params.set("type", filterType);
      if (filterStatus !== "__all__") params.set("status", filterStatus);
      if (filterPriority !== "__all__") params.set("priority", filterPriority);

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
  }, [page, debouncedSearch, filterType, filterStatus, filterPriority]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch("/api/support/stats?tab=mine");
      if (!res.ok) return;
      const data = await res.json();
      setStats(data);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const openModal = (type: "ticket" | "request" | "occurrence") => {
    setModalType(type);
    setModalOpen(true);
  };

  const handleCreateSuccess = () => {
    fetchItems();
    fetchStats();
  };

  return (
    <div
      className="min-h-screen relative"
      style={{ background: '#020810' }}
    >
      {/* Background animado de circuito eletrônico — igual ao dashboard */}
      <CircuitBackground />
      {/* Overlay suave sobre o canvas */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1, background: 'linear-gradient(to bottom, rgba(2,8,16,0.12) 0%, rgba(2,8,16,0.04) 50%, rgba(2,8,16,0.18) 100%)' }} />
      {/* Header */}
      <header className="sticky top-0 z-40 glassmorphic border-b border-white/10 px-4 py-3 flex items-center justify-between" style={{ position: 'relative', zIndex: 10 }}>
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-lg font-bold text-white">Meus Chamados</h1>
            <p className="text-xs text-white/50">Chamados, requisições e ocorrências</p>
          </div>
        </div>
        <UserMenu />
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-4" style={{ position: 'relative', zIndex: 2 }}>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ActionCard
            icon={<FileText className="w-5 h-5 text-cyan-300" />}
            label="Novo Chamado"
            description="Abra um chamado de suporte"
            color="bg-cyan-500/20"
            borderColor="rgba(34,211,238,0.2)"
            onClick={() => openModal("ticket")}
          />
          <ActionCard
            icon={<Layers className="w-5 h-5 text-purple-300" />}
            label="Nova Requisição"
            description="Solicite um recurso ou serviço"
            color="bg-purple-500/20"
            borderColor="rgba(168,85,247,0.2)"
            onClick={() => openModal("request")}
          />
          <ActionCard
            icon={<AlertTriangle className="w-5 h-5 text-orange-300" />}
            label="Nova Ocorrência"
            description="Registre um incidente ou evento"
            color="bg-orange-500/20"
            borderColor="rgba(251,146,60,0.2)"
            onClick={() => openModal("occurrence")}
          />
        </div>

        {/* Stats — apenas Abertos, Em Andamento, Resolvidos */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Abertos" value={stats.aberto} color="bg-blue-500/20" icon={<Clock className="w-4 h-4 text-blue-300" />} />
          <StatCard label="Em Andamento" value={stats.em_andamento} color="bg-purple-500/20" icon={<Zap className="w-4 h-4 text-purple-300" />} />
          <StatCard label="Resolvidos" value={stats.resolvido} color="bg-green-500/20" icon={<CheckCircle className="w-4 h-4 text-green-300" />} />
        </div>

        {/* Filters */}
        <Card className="glassmorphic border-white/10">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Buscar por título, ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos os tipos</SelectItem>
                  <SelectItem value="ticket">Chamado</SelectItem>
                  <SelectItem value="request">Requisição</SelectItem>
                  <SelectItem value="occurrence">Ocorrência</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-44 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos os status</SelectItem>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="aguardando_aprovacao">Ag. Aprovação</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-full sm:w-36 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="border-white/10 text-white/60 hover:text-white"
                onClick={() => { fetchItems(); fetchStats(); }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="glassmorphic border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-white/80 text-sm font-medium flex items-center gap-2">
              <Filter className="w-4 h-4" />
              {total} {total === 1 ? "resultado" : "resultados"}
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
                <p className="text-white/40 text-sm">Nenhum chamado encontrado</p>
                <Button size="sm" className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" onClick={() => openModal("ticket")}>
                  <Plus className="w-4 h-4 mr-1" /> Abrir novo chamado
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {items.map(item => {
                  const st = STATUS_MAP[item.status] || { label: item.status, color: "bg-gray-500/20 text-gray-300 border-gray-500/30", icon: null };
                  const pr = PRIORITY_MAP[item.priority] || { label: item.priority, color: "bg-gray-500/20 text-gray-300" };
                  const tp = TYPE_MAP[item.type] || { label: item.type, icon: null };
                  return (
                    <div
                      key={item.id}
                      className="px-4 py-4 hover:bg-white/5 cursor-pointer transition-colors group"
                      onClick={() => setLocation(`/tickets/${item.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Type icon */}
                        <div className="mt-0.5 p-1.5 rounded bg-white/5 text-white/40 flex-shrink-0">
                          {tp.icon}
                        </div>
                        {/* Main content */}
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
                            {item.slaBreachedNow ? (
                              <Badge className="text-xs border bg-red-500/20 text-red-300 border-red-500/30 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> SLA Vencido
                              </Badge>
                            ) : item.slaMinutesLeft !== null && item.slaMinutesLeft < 120 ? (
                              <Badge className="text-xs border bg-orange-500/20 text-orange-300 border-orange-500/30">
                                SLA: {item.slaMinutesLeft}min
                              </Badge>
                            ) : null}
                            {item.assignedToName && (
                              <span className="text-white/30 text-xs">→ {item.assignedToName}</span>
                            )}
                            {item.companyName && (
                              <span className="text-white/30 text-xs">{item.companyName}</span>
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

        {/* Pagination */}
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
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-white/10 text-white/60 hover:text-white"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateModal
        open={modalOpen}
        type={modalType}
        onClose={() => setModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
