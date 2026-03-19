import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import BackButton from "@/components/BackButton";
import {
  Clock, CheckCircle, AlertCircle, XCircle, Zap, RefreshCw,
  FileText, Layers, AlertTriangle, MessageSquare, Paperclip,
  Send, Download, User, ChevronLeft, Shield, Tag, Building2,
  Calendar, Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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

// ─── Maps ─────────────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  aberto:               { label: "Aberto",          color: "bg-blue-500/20 text-blue-300 border-blue-500/30",       icon: <Clock className="w-3 h-3" /> },
  em_analise:           { label: "Em Análise",      color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", icon: <RefreshCw className="w-3 h-3" /> },
  aguardando_aprovacao: { label: "Ag. Aprovação",   color: "bg-orange-500/20 text-orange-300 border-orange-500/30", icon: <AlertCircle className="w-3 h-3" /> },
  aprovado:             { label: "Aprovado",        color: "bg-teal-500/20 text-teal-300 border-teal-500/30",       icon: <CheckCircle className="w-3 h-3" /> },
  rejeitado:            { label: "Rejeitado",       color: "bg-red-500/20 text-red-300 border-red-500/30",          icon: <XCircle className="w-3 h-3" /> },
  em_andamento:         { label: "Em Andamento",    color: "bg-purple-500/20 text-purple-300 border-purple-500/30", icon: <Zap className="w-3 h-3" /> },
  resolvido:            { label: "Resolvido",       color: "bg-green-500/20 text-green-300 border-green-500/30",    icon: <CheckCircle className="w-3 h-3" /> },
  fechado:              { label: "Fechado",         color: "bg-gray-500/20 text-gray-400 border-gray-500/30",       icon: <XCircle className="w-3 h-3" /> },
  cancelado:            { label: "Cancelado",       color: "bg-red-900/20 text-red-400 border-red-900/30",          icon: <XCircle className="w-3 h-3" /> },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  critica: { label: "Crítica", color: "bg-red-500/20 text-red-300 border-red-500/30" },
  alta:    { label: "Alta",    color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  media:   { label: "Média",   color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  baixa:   { label: "Baixa",   color: "bg-green-500/20 text-green-300 border-green-500/30" },
};

const TYPE_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  ticket:     { label: "Chamado",    icon: <FileText className="w-4 h-4" /> },
  request:    { label: "Requisição", icon: <Layers className="w-4 h-4" /> },
  occurrence: { label: "Ocorrência", icon: <AlertTriangle className="w-4 h-4" /> },
};

const ACTION_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  criado:       { label: "Criado",          color: "border-blue-500/40 bg-blue-500/10",   icon: <FileText className="w-3.5 h-3.5 text-blue-400" /> },
  atualizado:   { label: "Atualizado",      color: "border-yellow-500/40 bg-yellow-500/10", icon: <RefreshCw className="w-3.5 h-3.5 text-yellow-400" /> },
  status:       { label: "Status",          color: "border-purple-500/40 bg-purple-500/10", icon: <Zap className="w-3.5 h-3.5 text-purple-400" /> },
  atribuido:    { label: "Atribuído",       color: "border-teal-500/40 bg-teal-500/10",   icon: <User className="w-3.5 h-3.5 text-teal-400" /> },
  comentario:   { label: "Comentário",      color: "border-cyan-500/40 bg-cyan-500/10",   icon: <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> },
  nota_interna: { label: "Nota Interna",    color: "border-orange-500/40 bg-orange-500/10", icon: <Shield className="w-3.5 h-3.5 text-orange-400" /> },
  aprovado:     { label: "Aprovado",        color: "border-green-500/40 bg-green-500/10", icon: <CheckCircle className="w-3.5 h-3.5 text-green-400" /> },
  rejeitado:    { label: "Rejeitado",       color: "border-red-500/40 bg-red-500/10",     icon: <XCircle className="w-3.5 h-3.5 text-red-400" /> },
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface HistoryEntry {
  id: number;
  action: string;
  description: string;
  userId: number | null;
  userName: string | null;
  userAvatar: string | null;
  createdAt: string;
}

interface Attachment {
  id: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  createdAt: string;
}

interface TicketDetail {
  id: number;
  requestId: string;
  type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string | null;
  tags: string | null;
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
  closedAt: string | null;
  history: HistoryEntry[];
  attachments: Attachment[];
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TicketDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [comment, setComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const isAdmin = ["admin", "manager", "agent", "support"].includes(currentUser?.role || "");

  const fetchTicket = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/support/items/${params.id}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setTicket(data);
      setNewStatus(data.status);
    } catch (e: any) {
      setError(e.message || "Erro ao carregar chamado");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);

  const handleComment = async () => {
    if (!comment.trim() || !ticket) return;
    setSendingComment(true);
    try {
      const res = await apiFetch(`/api/support/items/${ticket.id}/comment`, {
        method: "POST",
        body: JSON.stringify({ content: comment.trim() }),
      });
      if (!res.ok) throw new Error("Erro ao enviar comentário");
      setComment("");
      toast.success("Comentário adicionado");
      fetchTicket();
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar comentário");
    } finally {
      setSendingComment(false);
    }
  };

  const handleStatusChange = async () => {
    if (!ticket || newStatus === ticket.status) return;
    setChangingStatus(true);
    try {
      const res = await apiFetch(`/api/support/items/${ticket.id}/status`, {
        method: "POST",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro" }));
        throw new Error(err.error);
      }
      toast.success("Status atualizado");
      fetchTicket();
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar status");
    } finally {
      setChangingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 40%, #0a0f1e 100%)" }}>
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 40%, #0a0f1e 100%)" }}>
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-red-300">{error || "Chamado não encontrado"}</p>
        <Button variant="outline" className="border-white/10 text-white/60" onClick={() => setLocation("/tickets")}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
      </div>
    );
  }

  const st = STATUS_MAP[ticket.status] || { label: ticket.status, color: "bg-gray-500/20 text-gray-300 border-gray-500/30", icon: null };
  const pr = PRIORITY_MAP[ticket.priority] || { label: ticket.priority, color: "bg-gray-500/20 text-gray-300" };
  const tp = TYPE_MAP[ticket.type] || { label: ticket.type, icon: <FileText className="w-4 h-4" /> };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 40%, #0a0f1e 100%)" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 glassmorphic border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <BackButton variant="ghost" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-sm">{ticket.requestId}</span>
            <Badge className={`text-xs border ${st.color} flex items-center gap-1`}>
              {st.icon} {st.label}
            </Badge>
          </div>
          <h1 className="text-white font-semibold truncate">{ticket.title}</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Timeline + Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="glassmorphic border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/80 text-sm flex items-center gap-2">
                {tp.icon} {tp.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">
                {ticket.description || "Sem descrição."}
              </p>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="glassmorphic border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/80 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" /> Linha do Tempo
                <span className="ml-auto text-white/40 font-normal">{ticket.history.length} eventos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.history.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-4">Nenhum evento registrado</p>
              ) : (
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
                  <div className="space-y-4">
                    {ticket.history.map((h, i) => {
                      const act = ACTION_MAP[h.action] || { label: h.action, color: "border-white/20 bg-white/5", icon: <Clock className="w-3.5 h-3.5 text-white/40" /> };
                      return (
                        <div key={h.id} className="flex gap-3 relative">
                          {/* Dot */}
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center z-10 ${act.color}`}>
                            {act.icon}
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0 pb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white/80 text-sm font-medium">{act.label}</span>
                              {h.userName && (
                                <span className="text-white/40 text-xs">por {h.userName}</span>
                              )}
                              <span className="text-white/30 text-xs ml-auto">{formatDate(h.createdAt)}</span>
                            </div>
                            <p className="text-white/60 text-sm mt-0.5 break-words">{h.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Comment */}
          <Card className="glassmorphic border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/80 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Adicionar Comentário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Escreva seu comentário..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none min-h-[80px]"
                onKeyDown={e => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleComment();
                }}
              />
              <div className="flex justify-between items-center">
                <span className="text-white/30 text-xs">Ctrl+Enter para enviar</span>
                <Button
                  size="sm"
                  className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30"
                  disabled={!comment.trim() || sendingComment}
                  onClick={handleComment}
                >
                  {sendingComment ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                  Enviar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {ticket.attachments.length > 0 && (
            <Card className="glassmorphic border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-white/80 text-sm flex items-center gap-2">
                  <Paperclip className="w-4 h-4" /> Anexos ({ticket.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ticket.attachments.map(att => (
                    <div key={att.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <Paperclip className="w-4 h-4 text-white/40 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm truncate">{att.fileName}</p>
                        <p className="text-white/30 text-xs">{formatBytes(att.fileSize)} · {formatDate(att.createdAt)}</p>
                      </div>
                      <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                      >
                        <Button size="icon" variant="ghost" className="w-7 h-7 text-white/40 hover:text-cyan-300">
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Info + Actions */}
        <div className="space-y-4">
          {/* Status / Priority */}
          <Card className="glassmorphic border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/80 text-sm">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-xs">Status</span>
                <Badge className={`text-xs border ${st.color} flex items-center gap-1`}>
                  {st.icon} {st.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-xs">Prioridade</span>
                <Badge className={`text-xs border ${pr.color}`}>{pr.label}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-xs">Tipo</span>
                <span className="text-white/70 text-xs flex items-center gap-1">{tp.icon} {tp.label}</span>
              </div>
              {ticket.category && (
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-xs">Categoria</span>
                  <span className="text-white/70 text-xs flex items-center gap-1"><Tag className="w-3 h-3" /> {ticket.category}</span>
                </div>
              )}
              {ticket.assignedToName && (
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-xs">Atribuído a</span>
                  <span className="text-white/70 text-xs flex items-center gap-1"><User className="w-3 h-3" /> {ticket.assignedToName}</span>
                </div>
              )}
              {ticket.companyName && (
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-xs">Empresa</span>
                  <span className="text-white/70 text-xs flex items-center gap-1"><Building2 className="w-3 h-3" /> {ticket.companyName}</span>
                </div>
              )}
              {ticket.departmentName && (
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-xs">Departamento</span>
                  <span className="text-white/70 text-xs">{ticket.departmentName}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card className="glassmorphic border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/80 text-sm">Datas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-white/40 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" /> Criado</span>
                <span className="text-white/70 text-xs text-right">{formatDate(ticket.createdAt)}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-white/40 text-xs flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Atualizado</span>
                <span className="text-white/70 text-xs text-right">{formatDate(ticket.updatedAt)}</span>
              </div>
              {ticket.slaDeadline && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-white/40 text-xs flex items-center gap-1"><Timer className="w-3 h-3" /> SLA</span>
                  <span className={`text-xs text-right ${ticket.slaBreachedNow ? "text-red-300" : "text-white/70"}`}>
                    {formatDate(ticket.slaDeadline)}
                    {ticket.slaBreachedNow ? " ⚠️ Vencido" : ticket.slaMinutesLeft !== null && ticket.slaMinutesLeft < 120 ? ` (${ticket.slaMinutesLeft}min)` : ""}
                  </span>
                </div>
              )}
              {ticket.resolvedAt && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-white/40 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Resolvido</span>
                  <span className="text-white/70 text-xs text-right">{formatDate(ticket.resolvedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change Status (admin/agent only) */}
          {isAdmin && (
            <Card className="glassmorphic border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-white/80 text-sm">Alterar Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aberto">Aberto</SelectItem>
                    <SelectItem value="em_analise">Em Análise</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="aguardando_aprovacao">Ag. Aprovação</SelectItem>
                    <SelectItem value="resolvido">Resolvido</SelectItem>
                    <SelectItem value="fechado">Fechado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30"
                  disabled={newStatus === ticket.status || changingStatus}
                  onClick={handleStatusChange}
                >
                  {changingStatus ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Zap className="w-4 h-4 mr-1" />}
                  Atualizar
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Cancel (user) */}
          {!isAdmin && ticket.status !== "cancelado" && ticket.status !== "fechado" && ticket.status !== "resolvido" && (
            <Button
              variant="outline"
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={async () => {
                if (!confirm("Deseja cancelar este chamado?")) return;
                try {
                  const res = await apiFetch(`/api/support/items/${ticket.id}/status`, {
                    method: "POST",
                    body: JSON.stringify({ status: "cancelado" }),
                  });
                  if (!res.ok) throw new Error("Erro ao cancelar");
                  toast.success("Chamado cancelado");
                  fetchTicket();
                } catch (e: any) {
                  toast.error(e.message);
                }
              }}
            >
              <XCircle className="w-4 h-4 mr-1" /> Cancelar Chamado
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
