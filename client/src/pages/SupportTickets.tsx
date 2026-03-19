/**
 * SupportTickets.tsx — Meus Chamados
 * Usa os mesmos endpoints REST da Central de Atendimento (Support.tsx):
 *   GET  /api/support/items?tab=mine&...
 *   GET  /api/support/stats
 *   POST /api/support/items
 *   POST /api/support/items/:id/comment
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  TicketIcon, Plus, Filter, Search, RefreshCw, Clock, CheckCircle2,
  AlertTriangle, ChevronRight, BarChart3,
  Inbox, ListChecks, Flame, Loader2,
  Upload, Image, FileText, X, Send,
  Building2, Calendar, Layers, UserCheck, Timer,
  SlidersHorizontal, ChevronUp, ChevronDown, MessageSquare, Star,
  CircleDot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────
type ItemType = "ticket" | "request" | "occurrence";

interface SupportItem {
  id: number;
  requestId: string;
  type: ItemType;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  userId: number;
  userName: string;
  userEmail: string;
  companyId: number;
  companyName: string;
  assignedToId: number;
  assignedToName: string;
  slaDeadline: string;
  slaBreached: boolean;
  createdAt: string;
  updatedAt: string;
  history?: HistoryEntry[];
  attachments?: Attachment[];
}

interface HistoryEntry {
  id: number;
  type: string;
  content: string;
  authorId: number;
  authorName: string;
  isInternal: boolean;
  createdAt: string;
  attachments?: Attachment[];
}

interface Attachment {
  id: number;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

interface Stats {
  byStatus: Array<{ status: string; type: string; count: number }>;
  slaBreached: number;
  pendingApprovals: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getAuthToken() {
  return localStorage.getItem("authToken");
}

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

const STATUS_LABELS: Record<string, string> = {
  aberto: "Aberto",
  em_analise: "Em Análise",
  aguardando_aprovacao: "Ag. Aprovação",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  em_andamento: "Em Andamento",
  resolvido: "Resolvido",
  fechado: "Fechado",
  cancelado: "Cancelado",
};

const PRIORITY_LABELS: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

const TYPE_LABELS: Record<string, string> = {
  ticket: "Chamado",
  request: "Requisição",
  occurrence: "Ocorrência",
};

const TI_CATEGORIES = [
  "Hardware - Desktop/Notebook", "Hardware - Impressora", "Hardware - Rede/Conectividade",
  "Hardware - Servidor", "Software - Instalação/Atualização", "Software - Licença",
  "Software - Erro/Bug", "Email - Configuração", "Email - Acesso", "VPN - Conexão",
  "Acesso - Permissões", "Acesso - Senha", "Backup - Recuperação",
  "Segurança - Antivírus", "Segurança - Firewall", "Outro",
];

function statusColor(s: string) {
  const m: Record<string, string> = {
    aberto: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    em_analise: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    aguardando_aprovacao: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    aprovado: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    rejeitado: "bg-red-500/20 text-red-300 border-red-500/30",
    em_andamento: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    resolvido: "bg-green-500/20 text-green-300 border-green-500/30",
    fechado: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    cancelado: "bg-red-900/20 text-red-400 border-red-900/30",
  };
  return m[s] ?? "bg-white/10 text-white/70 border-white/20";
}

function priorityColor(p: string) {
  const m: Record<string, string> = {
    critica: "bg-red-600/30 text-red-300 border-red-600/40",
    alta: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    media: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    baixa: "bg-green-500/20 text-green-300 border-green-500/30",
  };
  return m[p] ?? "bg-white/10 text-white/70 border-white/20";
}

function typeColor(t: string) {
  const m: Record<string, string> = {
    ticket: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    request: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    occurrence: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  };
  return m[t] ?? "bg-white/10 text-white/70 border-white/20";
}

function typeIcon(t: string) {
  if (t === "ticket") return <TicketIcon className="w-3.5 h-3.5" />;
  if (t === "request") return <ListChecks className="w-3.5 h-3.5" />;
  if (t === "occurrence") return <AlertTriangle className="w-3.5 h-3.5" />;
  return <CircleDot className="w-3.5 h-3.5" />;
}

function formatDate(d: string) {
  if (!d) return "-";
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function slaStatus(item: SupportItem) {
  if (!item.slaDeadline) return null;
  const diff = new Date(item.slaDeadline).getTime() - Date.now();
  if (diff < 0) return { label: "SLA Vencido", color: "text-red-400" };
  if (diff < 2 * 3600 * 1000) return { label: "SLA Crítico", color: "text-orange-400" };
  if (diff < 8 * 3600 * 1000) return { label: "SLA Atenção", color: "text-yellow-400" };
  return null;
}

// ─── Stats Dashboard ──────────────────────────────────────────────────────────
function StatsDashboard({ stats, loading }: { stats: Stats | null; loading: boolean }) {
  const byStatus = stats?.byStatus || [];
  const count = (s: string) =>
    byStatus.filter(x => x.status === s).reduce((a, b) => a + Number(b.count), 0);
  const total = byStatus.reduce((a, b) => a + Number(b.count), 0);

  const cards = [
    { label: "Total", value: total, icon: <BarChart3 className="w-5 h-5" />, color: "text-white/70", bg: "bg-white/5" },
    { label: "Abertos", value: count("aberto") + count("em_analise"), icon: <CircleDot className="w-5 h-5" />, color: "text-blue-300", bg: "bg-blue-500/10" },
    { label: "Em Andamento", value: count("em_andamento") + count("aguardando_aprovacao"), icon: <Clock className="w-5 h-5" />, color: "text-purple-300", bg: "bg-purple-500/10" },
    { label: "Resolvidos", value: count("resolvido") + count("fechado"), icon: <CheckCircle2 className="w-5 h-5" />, color: "text-green-300", bg: "bg-green-500/10" },
    { label: "SLA Vencido", value: stats?.slaBreached || 0, icon: <AlertTriangle className="w-5 h-5" />, color: "text-red-300", bg: "bg-red-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {cards.map(c => (
        <div key={c.label} className={`rounded-xl border border-white/10 p-4 ${c.bg}`}>
          {loading
            ? <Skeleton className="h-8 w-12 bg-white/10 mb-1" />
            : <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
          }
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`${c.color} opacity-60`}>{c.icon}</span>
            <span className="text-white/40 text-xs">{c.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Create Item Dialog ───────────────────────────────────────────────────────
function CreateItemDialog({ open, onClose, defaultType, onCreated }: {
  open: boolean;
  onClose: () => void;
  defaultType: ItemType;
  onCreated: () => void;
}) {
  const [type, setType] = useState<ItemType>(defaultType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("media");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<Array<{
    name: string; data: string; mimeType: string; size: number;
  }>>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setType(defaultType); }, [defaultType, open]);

  const addFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const base64 = (e.target?.result as string)?.split(",")[1] || "";
      setAttachments(p => [...p, { name: file.name, data: base64, mimeType: file.type, size: file.size }]);
      toast.success(`"${file.name}" adicionado`);
    };
    reader.readAsDataURL(file);
  }, []);

  async function submit() {
    if (!title.trim()) { toast.error("Título é obrigatório"); return; }
    setLoading(true);
    try {
      const res = await apiFetch("/api/support/items", {
        method: "POST",
        body: JSON.stringify({ type, title, description, priority, category }),
      });
      if (attachments.length > 0 && res?.id) {
        try {
          await apiFetch(`/api/support/items/${res.id}/attachments`, {
            method: "POST",
            body: JSON.stringify({ files: attachments }),
          });
        } catch {
          toast.warning("Item criado, mas erro ao salvar anexos");
        }
      }
      toast.success(`${TYPE_LABELS[type]} criado(a) com sucesso!`);
      setTitle(""); setDescription(""); setPriority("media"); setCategory(""); setAttachments([]);
      onCreated();
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao criar item";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#0d1b2a] border border-white/10 text-white flex flex-col max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-3 flex-shrink-0 border-b border-white/10">
          <DialogTitle className="flex items-center gap-2 text-white">
            <Plus className="w-5 h-5 text-cyan-400" /> Novo {TYPE_LABELS[type]}
          </DialogTitle>
          <DialogDescription className="sr-only">Criar {TYPE_LABELS[type]}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Tipo */}
          <div className="grid grid-cols-3 gap-2">
            {(["ticket", "request", "occurrence"] as ItemType[]).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-all ${
                  type === t
                    ? typeColor(t) + " border-2"
                    : "border-white/10 text-white/50 hover:border-white/30"
                }`}
              >
                {typeIcon(t)}
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          <div>
            <Label className="text-white/70 text-xs mb-1">Título *</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={`Descreva o ${TYPE_LABELS[type].toLowerCase()}...`}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>

          <div>
            <Label className="text-white/70 text-xs mb-1">Descrição</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Detalhes adicionais..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white/70 text-xs mb-1">Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1b2a] border-white/10">
                  {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v} className="text-white">{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/70 text-xs mb-1">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1b2a] border-white/10 max-h-64">
                  {TI_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Anexos */}
          <div>
            <Label className="text-white/70 text-xs mb-2">Anexos</Label>
            <div
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={e => { e.preventDefault(); Array.from(e.dataTransfer.files).forEach(addFile); }}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center cursor-pointer hover:border-cyan-400/50 transition-colors bg-white/5"
            >
              <Upload className="w-5 h-5 mx-auto mb-2 text-white/50" />
              <p className="text-xs text-white/60">Arraste arquivos ou clique para selecionar</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
              onChange={e => Array.from(e.target.files || []).forEach(addFile)}
              className="hidden"
            />
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 p-2 rounded border border-white/10">
                    <div className="flex items-center gap-2 min-w-0">
                      {att.mimeType.startsWith("image/")
                        ? <Image className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        : <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      }
                      <span className="text-xs text-white/70 truncate">{att.name}</span>
                    </div>
                    <button
                      onClick={() => setAttachments(p => p.filter((_, j) => j !== i))}
                      className="text-white/40 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-white/10 bg-[#0d1b2a]">
          <Button variant="ghost" onClick={onClose} className="text-white/60 hover:text-white">
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={loading}
            className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
              : <Plus className="w-4 h-4 mr-2" />
            }
            Criar {TYPE_LABELS[type]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Item Detail Dialog ───────────────────────────────────────────────────────
function ItemDetailDialog({ itemId, onClose, onUpdated, currentUser }: {
  itemId: number | null;
  onClose: () => void;
  onUpdated: () => void;
  currentUser: { id?: number } | null;
}) {
  const [item, setItem] = useState<SupportItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [ratingDone, setRatingDone] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!itemId) return;
    setLoading(true);
    apiFetch(`/api/support/items/${itemId}`)
      .then(d => setItem(d))
      .catch(() => toast.error("Erro ao carregar chamado"))
      .finally(() => setLoading(false));
  }, [itemId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [item?.history]);

  async function reload() {
    if (!itemId) return;
    const d = await apiFetch(`/api/support/items/${itemId}`);
    setItem(d);
    onUpdated();
  }

  async function sendComment() {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/support/items/${itemId}/comment`, {
        method: "POST",
        body: JSON.stringify({ content: comment, isInternal: false }),
      });
      setComment("");
      await reload();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao enviar comentário";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function sendRating(stars: number) {
    setRating(stars);
    try {
      await apiFetch(`/api/support/items/${itemId}/rate`, {
        method: "POST",
        body: JSON.stringify({ rating: stars }),
      });
      setRatingDone(true);
      toast.success("Avaliação enviada!");
    } catch {
      /* silently fail */
    }
  }

  if (!itemId) return null;

  const msgs = item?.history || [];
  const atts = item?.attachments || [];
  const isClosed = item && ["fechado", "cancelado"].includes(item.status);
  const isResolved = item?.status === "resolvido";

  return (
    <>
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <img src={lightboxUrl} alt="Preview" className="max-w-full max-h-full rounded-lg shadow-2xl" />
          <button
            className="absolute top-4 right-4 text-white/60 hover:text-white"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      <Dialog open={!!itemId} onOpenChange={onClose}>
        <DialogContent
          className="max-w-[98vw] sm:max-w-3xl w-full max-h-[95vh] bg-[#0a0e1a] border border-white/10 text-white flex flex-col p-0 gap-0 overflow-hidden"
        >
          <DialogTitle className="sr-only">Detalhes do chamado</DialogTitle>
          <DialogDescription className="sr-only">Histórico e comentários</DialogDescription>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0d1220] shrink-0">
            {loading
              ? <Skeleton className="h-5 w-48 bg-white/10" />
              : item
                ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border shrink-0 ${typeColor(item.type)}`}>
                      {typeIcon(item.type)} {TYPE_LABELS[item.type]}
                    </span>
                    <span className="text-white/40 text-xs font-mono shrink-0">#{item.requestId}</span>
                    <span className="text-white font-semibold text-sm truncate">{item.title}</span>
                  </div>
                )
                : <span />
            }
            <div className="flex items-center gap-2 shrink-0">
              {item && (
                <span className={`px-2 py-0.5 rounded-full text-xs border ${statusColor(item.status)}`}>
                  {STATUS_LABELS[item.status]}
                </span>
              )}
              <button onClick={onClose} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loading
            ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            )
            : item
              ? (
                <div className="flex-1 overflow-hidden flex flex-col">
                  {/* Info */}
                  <div className="px-4 py-3 border-b border-white/10 bg-white/3 shrink-0">
                    <p className="text-white/60 text-sm leading-relaxed mb-3">
                      {item.description || "Sem descrição"}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/40">
                      <span className={`px-1.5 py-0.5 rounded border text-xs ${priorityColor(item.priority)}`}>
                        {item.priority === "critica" && <Flame className="w-3 h-3 inline mr-0.5" />}
                        {PRIORITY_LABELS[item.priority]}
                      </span>
                      {item.category && (
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3" />{item.category}
                        </span>
                      )}
                      {item.companyName && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />{item.companyName}
                        </span>
                      )}
                      {item.assignedToName && (
                        <span className="flex items-center gap-1 text-cyan-400/70">
                          <UserCheck className="w-3 h-3" />{item.assignedToName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{formatDate(item.createdAt)}
                      </span>
                    </div>
                    {atts.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {atts.map(a => (
                          <a
                            key={a.id}
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/60 hover:text-white hover:border-white/30 transition-colors"
                          >
                            {a.mimeType?.startsWith("image/")
                              ? <Image className="w-3.5 h-3.5" />
                              : <FileText className="w-3.5 h-3.5" />
                            }
                            {a.filename}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Chat */}
                  <ScrollArea className="flex-1 px-4 py-3">
                    {msgs.length === 0
                      ? (
                        <div className="flex flex-col items-center justify-center py-12 text-white/20">
                          <MessageSquare className="w-10 h-10 mb-2" />
                          <p className="text-sm">Nenhuma mensagem ainda</p>
                        </div>
                      )
                      : (
                        <div className="space-y-3">
                          {msgs.map(h => {
                            const isMe = h.authorId === currentUser?.id;
                            const isSystem = ["system", "status_change", "assignment"].includes(h.type);
                            if (isSystem) return (
                              <div key={h.id} className="flex items-center gap-2 py-1">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="text-white/30 text-xs px-2">{h.content}</span>
                                <div className="flex-1 h-px bg-white/10" />
                              </div>
                            );
                            return (
                              <div key={h.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                                  isMe
                                    ? "bg-cyan-500/20 border border-cyan-500/30 rounded-br-sm"
                                    : "bg-white/8 border border-white/10 rounded-bl-sm"
                                }`}>
                                  {!isMe && (
                                    <p className="text-xs font-medium text-cyan-400/80 mb-1">{h.authorName}</p>
                                  )}
                                  <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                                    {h.content}
                                  </p>
                                  {h.attachments && h.attachments.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                      {h.attachments.map(a =>
                                        a.mimeType?.startsWith("image/")
                                          ? (
                                            <img
                                              key={a.id}
                                              src={a.url}
                                              alt={a.filename}
                                              className="max-w-[200px] max-h-[150px] rounded-lg cursor-pointer object-cover border border-white/10"
                                              onClick={() => setLightboxUrl(a.url)}
                                            />
                                          )
                                          : (
                                            <a
                                              key={a.id}
                                              href={a.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1 bg-white/10 rounded px-2 py-1 text-xs text-white/60 hover:text-white"
                                            >
                                              <FileText className="w-3 h-3" />{a.filename}
                                            </a>
                                          )
                                      )}
                                    </div>
                                  )}
                                  <p className="text-xs text-white/30 mt-1 text-right">
                                    {formatDate(h.createdAt)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={chatEndRef} />
                        </div>
                      )
                    }
                  </ScrollArea>

                  {/* Rating */}
                  {isResolved && !ratingDone && (
                    <div className="px-4 py-3 border-t border-white/10 bg-green-500/5 shrink-0">
                      <p className="text-white/60 text-xs mb-2 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-400" />
                        Avalie o atendimento:
                      </p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button
                            key={s}
                            onClick={() => sendRating(s)}
                            className={`text-xl transition-colors ${
                              s <= rating ? "text-yellow-400" : "text-white/20 hover:text-yellow-300"
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input */}
                  {!isClosed
                    ? (
                      <div className="px-4 py-3 border-t border-white/10 shrink-0">
                        <div className="flex gap-2">
                          <Textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendComment();
                              }
                            }}
                            placeholder="Digite uma mensagem... (Enter para enviar)"
                            rows={2}
                            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none text-sm"
                          />
                          <Button
                            onClick={sendComment}
                            disabled={submitting || !comment.trim()}
                            className="bg-cyan-500 hover:bg-cyan-600 text-black self-end h-10 w-10 p-0 shrink-0"
                          >
                            {submitting
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Send className="w-4 h-4" />
                            }
                          </Button>
                        </div>
                      </div>
                    )
                    : (
                      <div className="px-4 py-3 border-t border-white/10 shrink-0">
                        <p className="text-white/30 text-xs text-center">Este chamado está encerrado</p>
                      </div>
                    )
                  }
                </div>
              )
              : (
                <div className="flex-1 flex items-center justify-center text-white/30">
                  <p>Chamado não encontrado</p>
                </div>
              )
          }
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Items Table ──────────────────────────────────────────────────────────────
function ItemsTable({ items, loading, onSelect, total, page, pages, onPageChange }: {
  items: SupportItem[];
  loading: boolean;
  onSelect: (id: number) => void;
  total: number;
  page: number;
  pages: number;
  onPageChange: (p: number) => void;
}) {
  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-5 w-20 bg-white/10 rounded-full" />
            <Skeleton className="h-5 w-16 bg-white/10 rounded-full" />
            <Skeleton className="h-5 w-16 bg-white/10 rounded-full ml-auto" />
          </div>
          <Skeleton className="h-4 w-3/4 bg-white/10 mb-2" />
          <div className="flex gap-3">
            <Skeleton className="h-3 w-24 bg-white/10" />
            <Skeleton className="h-3 w-20 bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );

  if (!items.length) return (
    <div className="flex flex-col items-center justify-center py-16 text-white/30">
      <Inbox className="w-12 h-12 mb-3 opacity-30" />
      <p className="text-sm">Nenhum item encontrado</p>
      <p className="text-xs mt-1 text-white/20">Abra um novo chamado usando os botões acima</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {items.map(item => {
        const sla = slaStatus(item);
        const isCritical = item.priority === "critica";
        return (
          <div
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`relative rounded-xl cursor-pointer transition-all duration-200 group overflow-hidden border hover:shadow-lg hover:shadow-black/20 ${
              isCritical
                ? "bg-red-950/30 border-red-500/30 hover:border-red-400/50"
                : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/8"
            }`}
          >
            {/* Barra de prioridade */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
              item.priority === "critica" ? "bg-red-500"
              : item.priority === "alta" ? "bg-orange-500"
              : item.priority === "media" ? "bg-yellow-500"
              : "bg-green-500"
            }`} />

            <div className="pl-4 pr-10 pt-3 pb-3">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${typeColor(item.type)}`}>
                  {typeIcon(item.type)} {TYPE_LABELS[item.type]}
                </span>
                <span className="text-white/30 text-xs font-mono bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                  #{item.requestId}
                </span>
                <div className="flex-1" />
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(item.status)}`}>
                  {STATUS_LABELS[item.status] || item.status}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${priorityColor(item.priority)}`}>
                  {isCritical && <Flame className="w-3 h-3 inline mr-0.5" />}
                  {PRIORITY_LABELS[item.priority]}
                </span>
              </div>

              <p className={`text-sm font-semibold mb-2 leading-snug group-hover:text-cyan-300 transition-colors ${
                isCritical ? "text-red-100" : "text-white"
              }`}>
                {item.title}
              </p>

              <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
                {item.category && (
                  <span className="flex items-center gap-1 text-xs text-white/40">
                    <Layers className="w-3 h-3" />{item.category}
                  </span>
                )}
                {item.companyName && (
                  <span className="flex items-center gap-1 text-xs text-white/40">
                    <Building2 className="w-3 h-3" />{item.companyName}
                  </span>
                )}
                {item.assignedToName && (
                  <span className="flex items-center gap-1 text-xs text-cyan-400/60">
                    <UserCheck className="w-3 h-3" />{item.assignedToName}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-white/30 ml-auto">
                  <Calendar className="w-3 h-3" />{formatDate(item.createdAt)}
                </span>
              </div>

              {sla && (
                <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${sla.color}`}>
                  <Timer className="w-3.5 h-3.5" />{sla.label}
                </div>
              )}
            </div>

            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
            </div>
          </div>
        );
      })}

      {pages > 1 && (
        <div className="flex items-center justify-between pt-3">
          <span className="text-white/40 text-xs">{total} itens • Página {page} de {pages}</span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="text-white/50 hover:text-white h-7 px-2"
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={page >= pages}
              onClick={() => onPageChange(page + 1)}
              className="text-white/50 hover:text-white h-7 px-2"
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SupportTickets() {
  const { currentUser: user } = useAuth();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState("__all__");
  const [filterStatus, setFilterStatus] = useState("__all__");
  const [filterPriority, setFilterPriority] = useState("__all__");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("DESC");

  const [items, setItems] = useState<SupportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [itemsLoading, setItemsLoading] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<ItemType>("ticket");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, filterType, filterStatus, filterPriority]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      setStats(await apiFetch("/api/support/stats"));
    } catch {
      /* silently fail */
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadItems = useCallback(async () => {
    setItemsLoading(true);
    try {
      const p = new URLSearchParams({
        tab: "mine",
        page: String(page),
        limit: "20",
        sortBy,
        sortDir,
      });
      if (debouncedSearch) p.set("search", debouncedSearch);
      if (filterType !== "__all__") p.set("type", filterType);
      if (filterStatus !== "__all__") p.set("status", filterStatus);
      if (filterPriority !== "__all__") p.set("priority", filterPriority);

      const data = await apiFetch(`/api/support/items?${p}`);
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  }, [page, debouncedSearch, filterType, filterStatus, filterPriority, sortBy, sortDir]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadItems(); }, [loadItems]);

  const activeFilters = [filterType, filterStatus, filterPriority].filter(v => v !== "__all__").length;
  const userRole = (user as { role?: string } | null)?.role;
  const isAdmin = userRole === "admin" || userRole === "manager";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0e27 0%, #1e3a5f 50%, #0a0e27 100%)" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <TicketIcon className="w-6 h-6 text-cyan-400" />
              {isAdmin ? "Todos os Chamados" : "Meus Chamados"}
            </h1>
            <p className="text-white/40 text-sm mt-0.5">
              Chamados, requisições e ocorrências
              {isAdmin && <span className="ml-2 text-cyan-400/60 text-xs">(visão administrativa)</span>}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { loadStats(); loadItems(); }}
            className="text-white/50 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats */}
        <StatsDashboard stats={stats} loading={statsLoading} />

        {/* Quick Actions */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => { setCreateType("ticket"); setCreateOpen(true); }}
            className="flex-1 sm:flex-none bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs sm:text-sm px-3"
          >
            <TicketIcon className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Novo Chamado</span>
            <span className="sm:hidden ml-1">Chamado</span>
          </Button>
          <Button
            onClick={() => { setCreateType("request"); setCreateOpen(true); }}
            className="flex-1 sm:flex-none bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30 text-xs sm:text-sm px-3"
          >
            <ListChecks className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Nova Requisição</span>
            <span className="sm:hidden ml-1">Requisição</span>
          </Button>
          <Button
            onClick={() => { setCreateType("occurrence"); setCreateOpen(true); }}
            className="flex-1 sm:flex-none bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs sm:text-sm px-3"
          >
            <AlertTriangle className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Nova Ocorrência</span>
            <span className="sm:hidden ml-1">Ocorrência</span>
          </Button>
        </div>

        {/* Lista */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          {/* Barra de busca e filtros */}
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por título, ID..."
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9"
                />
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowFilters(v => !v)}
                className={`shrink-0 text-white/60 hover:text-white border h-9 px-3 ${
                  showFilters || activeFilters > 0
                    ? "border-cyan-500/50 text-cyan-300 bg-cyan-500/10"
                    : "border-white/10"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Filtros</span>
                {activeFilters > 0 && (
                  <span className="ml-1 bg-cyan-500 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {activeFilters}
                  </span>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white/30 text-xs shrink-0">Ordenar:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 flex-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1b2a] border-white/10">
                  <SelectItem value="createdAt" className="text-white text-xs">Data Criação</SelectItem>
                  <SelectItem value="updatedAt" className="text-white text-xs">Última Atualização</SelectItem>
                  <SelectItem value="priority" className="text-white text-xs">Prioridade</SelectItem>
                  <SelectItem value="status" className="text-white text-xs">Status</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSortDir(d => d === "DESC" ? "ASC" : "DESC")}
                className="shrink-0 text-white/50 hover:text-white h-8 w-8 p-0 border border-white/10"
              >
                {sortDir === "DESC" ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
              <span className="text-white/20 text-xs">{total} item{total !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Painel de filtros */}
          {showFilters && (
            <div className="mb-4 bg-[#0d1b2a] border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium text-sm flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                  Filtros
                </h3>
                <div className="flex gap-2">
                  {activeFilters > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setFilterType("__all__");
                        setFilterStatus("__all__");
                        setFilterPriority("__all__");
                      }}
                      className="text-white/40 hover:text-white h-7 text-xs"
                    >
                      Limpar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowFilters(false)}
                    className="text-white/40 hover:text-white h-7 w-7 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-white/50 text-xs mb-1">Tipo</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1b2a] border-white/10">
                      <SelectItem value="__all__" className="text-white text-xs">Todos</SelectItem>
                      {Object.entries(TYPE_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v} className="text-white text-xs">{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/50 text-xs mb-1">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1b2a] border-white/10">
                      <SelectItem value="__all__" className="text-white text-xs">Todos</SelectItem>
                      {Object.entries(STATUS_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v} className="text-white text-xs">{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/50 text-xs mb-1">Prioridade</Label>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-xs">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1b2a] border-white/10">
                      <SelectItem value="__all__" className="text-white text-xs">Todas</SelectItem>
                      {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v} className="text-white text-xs">{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <ItemsTable
            items={items}
            loading={itemsLoading}
            onSelect={setSelectedId}
            total={total}
            page={page}
            pages={pages}
            onPageChange={setPage}
          />
        </div>
      </div>

      <CreateItemDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultType={createType}
        onCreated={() => { loadItems(); loadStats(); }}
      />
      <ItemDetailDialog
        itemId={selectedId}
        onClose={() => setSelectedId(null)}
        onUpdated={() => { loadItems(); loadStats(); }}
        currentUser={user}
      />
    </div>
  );
}
