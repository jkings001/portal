import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import BackButton from "@/components/BackButton";
import {
  TicketIcon, Plus, Filter, Search, Clock, CheckCircle2,
  AlertTriangle, XCircle, ChevronDown, ChevronRight, BarChart3,
  Inbox, ListChecks, ThumbsUp, Headphones, Flame, TrendingUp,
  ArrowUpRight, Eye, Edit2, Trash2, MessageSquare, Paperclip,
  SlidersHorizontal, X, Bell, Building2, User, Calendar,
  AlertCircle, CircleDot, CircleCheck, CircleX, Loader2,
  Upload, Image, FileText, File, Trash, Star, Send, Lock,
  ShieldCheck, Reply, ExternalLink, Download, ZoomIn,
  UserCheck, ClipboardList, Timer, ChevronUp,
  ThumbsDown, UserCog, CheckSquare, XSquare, ChevronLeft,
  BellRing, Info, Layers, Settings2, Home,
} from "lucide-react";
import { useHomeRoute } from "@/hooks/useHomeRoute";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ───────────────────────────────────────────────────────────────────

type ItemType = "ticket" | "request" | "occurrence";
type ItemStatus = "aberto" | "em_analise" | "aguardando_aprovacao" | "aprovado" | "rejeitado" | "em_andamento" | "resolvido" | "fechado" | "cancelado";
type ItemPriority = "baixa" | "media" | "alta" | "critica";

interface SupportItem {
  id: number;
  requestId: string;
  type: ItemType;
  title: string;
  description: string;
  status: ItemStatus;
  priority: ItemPriority;
  category: string;
  userId: number;
  userName: string;
  userEmail: string;
  companyId: number;
  companyName: string;
  departmentId: number;
  departmentName: string;
  assignedToId: number;
  assignedToName: string;
  slaDeadline: string;
  slaBreached: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  byStatus: Array<{ status: string; type: string; count: number }>;
  tickets: Array<{ status: string; count: number }>;
  pendingApprovals: number;
  slaBreached: number;
  trend: Array<{ day: string; count: number }>;
}

interface Company { id: number; name: string; }
interface Department { id: number; name: string; }
interface AgentUser { id: number; name: string; role: string; }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAuthToken(): string | null {
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
  aguardando_aprovacao: "Aguardando Aprovação",
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

function statusColor(status: string) {
  switch (status) {
    case "aberto": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "em_analise": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    case "aguardando_aprovacao": return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    case "aprovado": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    case "rejeitado": return "bg-red-500/20 text-red-300 border-red-500/30";
    case "em_andamento": return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    case "resolvido": return "bg-green-500/20 text-green-300 border-green-500/30";
    case "fechado": return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    case "cancelado": return "bg-red-900/20 text-red-400 border-red-900/30";
    default: return "bg-white/10 text-white/70 border-white/20";
  }
}

function priorityColor(priority: string) {
  switch (priority) {
    case "critica": return "bg-red-600/30 text-red-300 border-red-600/40";
    case "alta": return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    case "media": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    case "baixa": return "bg-green-500/20 text-green-300 border-green-500/30";
    default: return "bg-white/10 text-white/70 border-white/20";
  }
}

function typeIcon(type: string) {
  switch (type) {
    case "ticket": return <TicketIcon className="w-3.5 h-3.5" />;
    case "request": return <ListChecks className="w-3.5 h-3.5" />;
    case "occurrence": return <AlertTriangle className="w-3.5 h-3.5" />;
    default: return <CircleDot className="w-3.5 h-3.5" />;
  }
}

function typeColor(type: string) {
  switch (type) {
    case "ticket": return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
    case "request": return "bg-violet-500/20 text-violet-300 border-violet-500/30";
    case "occurrence": return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    default: return "bg-white/10 text-white/70 border-white/20";
  }
}

function formatDate(d: string) {
  if (!d) return "-";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function slaStatus(item: SupportItem) {
  if (!item.slaDeadline) return null;
  const now = Date.now();
  const deadline = new Date(item.slaDeadline).getTime();
  const diff = deadline - now;
  if (diff < 0) return { label: "SLA Vencido", color: "text-red-400" };
  if (diff < 2 * 3600 * 1000) return { label: "SLA Crítico", color: "text-orange-400" };
  if (diff < 8 * 3600 * 1000) return { label: "SLA Atenção", color: "text-yellow-400" };
  return null;
}

// ─── Create Item Dialog ───────────────────────────────────────────────────────

// Categorias pré-definidas de TI
const TI_CATEGORIES = [
  "Hardware - Desktop/Notebook",
  "Hardware - Impressora",
  "Hardware - Rede/Conectividade",
  "Hardware - Servidor",
  "Software - Instalação/Atualização",
  "Software - Licença",
  "Software - Erro/Bug",
  "Email - Configuração",
  "Email - Acesso",
  "VPN - Conexão",
  "Acesso - Permissões",
  "Acesso - Senha",
  "Backup - Recuperação",
  "Segurança - Antivírus",
  "Segurança - Firewall",
  "Outro",
];

function CreateItemDialog({
  open,
  onClose,
  defaultType,
  onCreated,
}: {
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ name: string; data: string; mimeType: string; size: number }>>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setType(defaultType);
  }, [defaultType, open]);

  useEffect(() => {
    if (!open) return;
    apiFetch("/api/companies")
      .then(res => setCompanies(Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []))
      .catch(() => setCompanies([]));
    apiFetch("/api/departments")
      .then(res => setDepartments(Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []))
      .catch(() => setDepartments([]));
  }, [open]);

  // Suportar paste de print (Ctrl+V) na descrição
  const handleDescriptionPaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleFileAdd(file);
      }
    }
  }, []);

  // Adicionar arquivo ao array de anexos
  const handleFileAdd = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string)?.split(',')[1] || '';
      setAttachments(prev => [...prev, {
        name: file.name,
        data: base64,
        mimeType: file.type,
        size: file.size,
      }]);
      toast.success(`Arquivo "${file.name}" adicionado`);
    };
    reader.onerror = () => toast.error(`Erro ao ler arquivo "${file.name}"`);
    reader.readAsDataURL(file);
  }, []);

  // Drag and drop para upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      handleFileAdd(files[i]);
    }
  };

  // Remover anexo
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  async function handleSubmit() {
    if (!title.trim()) { toast.error("Título é obrigatório"); return; }
    setLoading(true);
    try {
      const res = await apiFetch("/api/support/items", {
        method: "POST",
        body: JSON.stringify({ type, title, description, priority, category, companyId: companyId ? parseInt(companyId) : undefined, departmentId: departmentId ? parseInt(departmentId) : undefined }),
      });
      
      // Upload de anexos se houver
      if (attachments.length > 0 && res?.id) {
        setUploadingFiles(true);
        try {
          await apiFetch(`/api/support/items/${res.id}/attachments`, {
            method: "POST",
            body: JSON.stringify({ files: attachments }),
          });
        } catch (e: any) {
          console.error('Erro ao upload de anexos:', e);
          toast.warning('Chamado criado, mas houve erro ao salvar anexos');
        } finally {
          setUploadingFiles(false);
        }
      }
      
      toast.success(`${TYPE_LABELS[type]} criado(a) com sucesso!`);
      setTitle(""); setDescription(""); setPriority("media"); setCategory(""); setCompanyId(""); setDepartmentId(""); setAttachments([]);
      onCreated();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg bg-[#0d1b2a] border border-white/10 text-white flex flex-col max-h-[95vh] sm:max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 flex-shrink-0 border-b border-white/10">
          <DialogTitle className="flex items-center gap-2 text-white">
            <Plus className="w-5 h-5 text-cyan-400" />
            Novo {TYPE_LABELS[type]}
          </DialogTitle>
          <DialogDescription className="sr-only">Preencha os campos para criar um novo {TYPE_LABELS[type]}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {(["ticket", "request", "occurrence"] as ItemType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-all ${type === t ? typeColor(t) + " border-2" : "border-white/10 text-white/50 hover:border-white/30"}`}
              >
                {typeIcon(t)}
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <div>
            <Label className="text-white/70 text-xs mb-1">Título *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={`Descreva o ${TYPE_LABELS[type].toLowerCase()}...`} className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </div>
          <div>
            <Label className="text-white/70 text-xs mb-1">Descrição (Cole print com Ctrl+V)</Label>
            <Textarea 
              ref={descriptionRef}
              value={description} 
              onChange={e => setDescription(e.target.value)}
              onPaste={handleDescriptionPaste}
              rows={3} 
              placeholder="Detalhes adicionais... (Pode colar imagem com Ctrl+V)" 
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
                  {TI_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat} className="text-white">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white/70 text-xs mb-1">Empresa</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1b2a] border-white/10">
                  {(Array.isArray(companies) ? companies : []).map(c => <SelectItem key={c.id} value={String(c.id)} className="text-white">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/70 text-xs mb-1">Departamento</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1b2a] border-white/10">
                  {(Array.isArray(departments) ? departments : []).map(d => <SelectItem key={d.id} value={String(d.id)} className="text-white">{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Upload de Arquivos */}
          <div>
            <Label className="text-white/70 text-xs mb-2">Anexos (Drag & Drop ou Clique)</Label>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center cursor-pointer hover:border-cyan-400/50 transition-colors bg-white/5"
            >
              <Upload className="w-5 h-5 mx-auto mb-2 text-white/50" />
              <p className="text-xs text-white/60">Arraste arquivos aqui ou clique para selecionar</p>
              <p className="text-xs text-white/40 mt-1">Máx 10 MB por arquivo, 10 arquivos no total</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
              onChange={(e) => {
                if (e.target.files) {
                  for (let i = 0; i < e.target.files.length; i++) {
                    handleFileAdd(e.target.files[i]);
                  }
                }
              }}
              className="hidden"
            />
            
            {/* Lista de Anexos */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-white/70 font-medium">Arquivos adicionados ({attachments.length}):</p>
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white/5 p-2 rounded border border-white/10">
                    <div className="flex items-center gap-2 min-w-0">
                      {att.mimeType.startsWith('image/') ? (
                        <Image className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      )}
                      <span className="text-xs text-white/70 truncate">{att.name}</span>
                      <span className="text-xs text-white/40 flex-shrink-0">({(att.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="text-white/40 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
        <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-white/10 bg-[#0d1b2a]">
          <Button variant="ghost" onClick={onClose} className="text-white/60 hover:text-white">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Criar {TYPE_LABELS[type]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Quick Reply Templates ─────────────────────────────────────────────────────
const QUICK_REPLIES = [
  { label: "Recebido", text: "Olá! Recebemos seu chamado e já estamos analisando. Em breve retornaremos com mais informações." },
  { label: "Em Andamento", text: "Estamos trabalhando na resolução do seu chamado. Assim que tivermos uma atualização, entraremos em contato." },
  { label: "Aguardando Info", text: "Para darmos continuidade ao atendimento, precisamos de mais informações. Poderia nos detalhar melhor o problema?" },
  { label: "Resolvido", text: "Seu chamado foi resolvido! Caso o problema persista ou tenha dúvidas, não hesite em abrir um novo chamado." },
  { label: "Agendado", text: "Agendamos a resolução para o próximo horário disponível. Você será notificado assim que a intervenção for realizada." },
];

// ─── SLA Bar Component ────────────────────────────────────────────────────────
function SLABar({ item }: { item: any }) {
  if (!item?.slaDeadline) return null;
  const now = Date.now();
  const created = new Date(item.createdAt).getTime();
  const deadline = new Date(item.slaDeadline).getTime();
  const total = deadline - created;
  const elapsed = now - created;
  const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const minutesLeft = Math.round((deadline - now) / 60000);
  const isBreached = now > deadline;
  const isWarning = !isBreached && pct > 75;
  const color = isBreached ? "bg-red-500" : isWarning ? "bg-orange-400" : "bg-green-500";
  const textColor = isBreached ? "text-red-400" : isWarning ? "text-orange-400" : "text-green-400";
  const label = isBreached
    ? `SLA vencido há ${Math.abs(minutesLeft)} min`
    : minutesLeft < 60
    ? `SLA: ${minutesLeft} min restantes`
    : `SLA: ${Math.round(minutesLeft / 60)}h restantes`;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/40 flex items-center gap-1"><Timer className="w-3 h-3" /> SLA</span>
        <span className={`font-medium ${textColor}`}>{label}</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ h, currentUserId, isAgentOrAdmin }: { h: any; currentUserId: number; isAgentOrAdmin: boolean }) {
  const isInternal = h.action === "nota_interna";
  const isComment = h.action === "comentario" || isInternal;
  const isSystem = !isComment;
  const isOwn = h.userId === currentUserId;
  const isAgent = isAgentOrAdmin && h.userId !== currentUserId ? false : isOwn;

  if (isSystem) {
    return (
      <div className="flex items-center gap-2 py-1">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-white/30 text-xs px-2 flex items-center gap-1">
          {h.action === "status" && <CircleDot className="w-3 h-3" />}
          {h.action === "criado" && <Plus className="w-3 h-3" />}
          {h.action === "atribuido" && <UserCheck className="w-3 h-3" />}
          {h.action === "anexo" && <Paperclip className="w-3 h-3" />}
          {h.description}
          <span className="text-white/20 ml-1">{formatDate(h.createdAt)}</span>
        </span>
        <div className="flex-1 h-px bg-white/10" />
      </div>
    );
  }

  const bubbleBase = isOwn
    ? "ml-auto bg-cyan-600/30 border-cyan-500/30 text-cyan-50"
    : "mr-auto bg-white/5 border-white/10 text-white/90";
  const internalStyle = isInternal ? "border-dashed border-yellow-500/40 bg-yellow-500/10" : "";

  return (
    <div className={`flex flex-col gap-1 max-w-[85%] ${isOwn ? "items-end ml-auto" : "items-start"}`}>
      <div className="flex items-center gap-1.5 text-xs text-white/40">
        {!isOwn && <span className="font-medium text-white/60">{h.userName}</span>}
        {isInternal && (
          <span className="flex items-center gap-0.5 text-yellow-400/70">
            <Lock className="w-2.5 h-2.5" /> Nota Interna
          </span>
        )}
        {isOwn && <span className="font-medium text-white/60">{h.userName}</span>}
      </div>
      <div className={`rounded-2xl border px-3.5 py-2.5 text-sm leading-relaxed ${bubbleBase} ${internalStyle} ${isOwn ? "rounded-tr-sm" : "rounded-tl-sm"}`}>
        {h.description.replace(/^\[INTERNO\] /, "")}
      </div>
      <span className="text-white/25 text-xs">{formatDate(h.createdAt)}</span>
    </div>
  );
}

// ─── Item Detail Dialog ───────────────────────────────────────────────────────

function ItemDetailDialog({
  itemId,
  onClose,
  onUpdated,
  userRole,
  currentUser,
}: {
  itemId: number | null;
  onClose: () => void;
  onUpdated: () => void;
  userRole: string;
  currentUser: any;
}) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");
  const [agents, setAgents] = useState<AgentUser[]>([]);
  const [assignedId, setAssignedId] = useState("");
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [attachFiles, setAttachFiles] = useState<Array<{ name: string; data: string; mimeType: string; size: number }>>([]);
  const [uploadingAttach, setUploadingAttach] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"chat" | "actions">("chat");
  const [showApprovalPanel, setShowApprovalPanel] = useState(false);
  const [approvalManagerId, setApprovalManagerId] = useState("");
  const [approvalJustification, setApprovalJustification] = useState("");
  const [approvalDecisionNote, setApprovalDecisionNote] = useState("");
  const [managers, setManagers] = useState<AgentUser[]>([]);
  const [slaEditMode, setSlaEditMode] = useState(false);
  const [slaEditValue, setSlaEditValue] = useState("");
  const [slaSubmitting, setSlaSubmitting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  const isAgentOrAdmin = ["admin", "agent", "support"].includes(userRole);
  const isManagerOrAbove = ["admin", "manager"].includes(userRole);
  const isClosed = item && ["fechado", "cancelado"].includes(item.status);
  const isResolved = item?.status === "resolvido";

  useEffect(() => {
    if (!itemId) return;
    setLoading(true);
    apiFetch(`/api/support/items/${itemId}`)
      .then(d => { setItem(d); setAssignedId(d.assignedToId ? String(d.assignedToId) : ""); })
      .catch(() => toast.error("Erro ao carregar item"))
      .finally(() => setLoading(false));
  }, [itemId]);

  useEffect(() => {
    if (!isAgentOrAdmin) return;
    apiFetch("/api/support/agents")
      .then(res => setAgents(Array.isArray(res) ? res : []))
      .catch(() => {
        apiFetch("/api/users")
          .then(res => {
            const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
            setAgents(list.filter((u: any) => ["admin", "agent", "support", "manager"].includes(u.role)));
          })
          .catch(() => {});
      });
  }, [isAgentOrAdmin]);

  // Carregar gestores da empresa do solicitante
  useEffect(() => {
    if (!item?.companyId) return;
    apiFetch(`/api/support/items/${itemId}/managers`)
      .then(res => setManagers(Array.isArray(res) ? res : []))
      .catch(() => {
        // Fallback: buscar usuários com role manager/admin da empresa
        apiFetch("/api/users")
          .then(res => {
            const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
            setManagers(list.filter((u: any) => ["admin", "manager"].includes(u.role)));
          })
          .catch(() => {});
      });
  }, [item?.companyId, itemId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [item?.history]);

  async function reload() {
    const updated = await apiFetch(`/api/support/items/${itemId}`);
    setItem(updated);
    setAssignedId(updated.assignedToId ? String(updated.assignedToId) : "");
    onUpdated();
  }

  async function handleComment() {
    if (!comment.trim() && attachFiles.length === 0) return;
    setSubmitting(true);
    try {
      if (comment.trim()) {
        await apiFetch(`/api/support/items/${itemId}/comment`, {
          method: "POST",
          body: JSON.stringify({ content: comment, isInternal }),
        });
      }
      // Upload attachments if any
      if (attachFiles.length > 0) {
        setUploadingAttach(true);
        try {
          await apiFetch(`/api/support/items/${itemId}/attachments`, {
            method: "POST",
            body: JSON.stringify({ files: attachFiles }),
          });
        } catch (e: any) {
          toast.warning("Mensagem enviada, mas erro ao salvar anexos");
        } finally {
          setUploadingAttach(false);
        }
      }
      setComment("");
      setAttachFiles([]);
      setIsInternal(false);
      setShowQuickReplies(false);
      await reload();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApproval(decision: "aprovado" | "rejeitado") {
    setSubmitting(true);
    try {
      await apiFetch(`/api/support/items/${itemId}/approve`, { method: "POST", body: JSON.stringify({ decision, comment: approvalComment }) });
      toast.success(decision === "aprovado" ? "Item aprovado!" : "Item rejeitado");
      setApprovalComment("");
      await reload();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(status: string) {
    try {
      await apiFetch(`/api/support/items/${itemId}/status`, { method: "POST", body: JSON.stringify({ status }) });
      await reload();
      toast.success(`Status alterado para: ${STATUS_LABELS[status] || status}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleAssign(agentIdStr: string) {
    const agentId = agentIdStr ? parseInt(agentIdStr) : null;
    const agent = agents.find(a => a.id === agentId);
    try {
      await apiFetch(`/api/support/items/${itemId}/assign`, {
        method: "POST",
        body: JSON.stringify({ agentId, agentName: agent?.name || "" }),
      });
      setAssignedId(agentIdStr);
      await reload();
      toast.success(agentId ? `Atribuído a ${agent?.name}` : "Atribuição removida");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleAtender() {
    if (!currentUser) return;
    try {
      await apiFetch(`/api/support/items/${itemId}/assign`, {
        method: "POST",
        body: JSON.stringify({ agentId: currentUser.id, agentName: currentUser.name }),
      });
      await handleStatusChange("em_andamento");
      toast.success("Você está atendendo este chamado");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleEncerrar() {
    try {
      await apiFetch(`/api/support/items/${itemId}/status`, { method: "POST", body: JSON.stringify({ status: "fechado" }) });
      setShowCloseConfirm(false);
      await reload();
      toast.success("Chamado encerrado");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleRequestApproval() {
    if (!approvalManagerId) { toast.error("Selecione um gestor para aprovação"); return; }
    const manager = managers.find(m => String(m.id) === approvalManagerId);
    setSubmitting(true);
    try {
      await apiFetch(`/api/support/items/${itemId}/request-approval`, {
        method: "POST",
        body: JSON.stringify({
          managerId: parseInt(approvalManagerId),
          managerName: manager?.name || "",
          justification: approvalJustification,
        }),
      });
      toast.success(`Aprovação solicitada para ${manager?.name}`);
      setShowApprovalPanel(false);
      setApprovalManagerId("");
      setApprovalJustification("");
      await reload();
    } catch (e: any) {
      toast.error(e.message || "Erro ao solicitar aprovação");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecideApproval(decision: "aprovada" | "rejeitada") {
    setSubmitting(true);
    try {
      await apiFetch(`/api/support/items/${itemId}/decide-approval`, {
        method: "POST",
        body: JSON.stringify({ decision, note: approvalDecisionNote }),
      });
      toast.success(decision === "aprovada" ? "Chamado aprovado!" : "Chamado rejeitado");
      setApprovalDecisionNote("");
      await reload();
    } catch (e: any) {
      toast.error(e.message || "Erro ao processar aprovação");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSlaUpdate() {
    if (!slaEditValue) return;
    setSlaSubmitting(true);
    try {
      await apiFetch(`/api/support/items/${itemId}/sla-update`, {
        method: "POST",
        body: JSON.stringify({ slaDeadline: new Date(slaEditValue).toISOString() }),
      });
      toast.success("SLA atualizado com sucesso");
      setSlaEditMode(false);
      await reload();
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar SLA");
    } finally {
      setSlaSubmitting(false);
    }
  }

  function handleFileAdd(file: File) {
    const MAX = 10 * 1024 * 1024;
    if (file.size > MAX) { toast.error(`Arquivo muito grande: ${file.name}`); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const base64 = dataUrl.split(",")[1];
      setAttachFiles(prev => [...prev, { name: file.name, data: base64, mimeType: file.type, size: file.size }]);
    };
    reader.readAsDataURL(file);
  }

  if (!itemId) return null;

  // Separate chat messages from system events
  const chatMessages = item?.history || [];
  const attachments = item?.attachments || [];

  return (
    <>
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <img src={lightboxUrl} alt="Preview" className="max-w-full max-h-full rounded-lg shadow-2xl" />
          <button className="absolute top-4 right-4 text-white/60 hover:text-white" onClick={() => setLightboxUrl(null)}>
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      <Dialog open={!!itemId} onOpenChange={onClose}>
        <DialogContent showCloseButton={false} className="max-w-[98vw] sm:max-w-[90vw] xl:max-w-7xl w-[98vw] max-h-[98vh] sm:max-h-[94vh] bg-[#0a0e1a] border border-white/10 text-white flex flex-col p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">Detalhes do Chamado</DialogTitle>
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-b border-white/10 bg-[#0d1220] shrink-0">
            {loading ? (
              <Skeleton className="h-5 w-48 bg-white/10" />
            ) : item ? (
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border shrink-0 ${typeColor(item.type)}`}>
                  {typeIcon(item.type)} <span className="hidden sm:inline">{TYPE_LABELS[item.type]}</span>
                </span>
                <span className="text-white/40 text-xs font-mono shrink-0 hidden sm:inline">{item.requestId}</span>
                <span className="text-white font-semibold text-sm truncate">{item.title}</span>
              </div>
            ) : <span />}
            <div className="flex items-center gap-2 shrink-0">
              {item && (
                <span className={`px-2 py-0.5 rounded-full text-xs border ${statusColor(item.status)}`}>
                  {STATUS_LABELS[item.status]}
                </span>
              )}
              {/* Mobile tab switcher */}
              {item && (
                <div className="flex sm:hidden items-center gap-1 bg-white/5 rounded-lg p-0.5">
                  <button
                    onClick={() => setMobileTab("chat")}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      mobileTab === "chat" ? "bg-cyan-500/20 text-cyan-300" : "text-white/40"
                    }`}
                  >
                    <MessageSquare className="w-3 h-3" /> Chat
                  </button>
                  <button
                    onClick={() => setMobileTab("actions")}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      mobileTab === "actions" ? "bg-violet-500/20 text-violet-300" : "text-white/40"
                    }`}
                  >
                    <Settings2 className="w-3 h-3" /> Ações
                  </button>
                </div>
              )}
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            </div>
          ) : item ? (
            <div className="flex flex-1 min-h-0 overflow-hidden">

              {/* ── Left: Chat Panel (mensagens) ── */}
              <div className={`flex flex-col flex-1 min-w-0 border-r border-white/10 ${
                mobileTab === "chat" ? "flex" : "hidden sm:flex"
              }`}>

                {/* Ticket Info Banner — Solicitação em Destaque */}
                <div className="px-4 pt-4 pb-3 bg-gradient-to-b from-[#0d1b2a] to-[#0a0e1a] border-b border-white/10 shrink-0">
                  {/* Cabeçalho da solicitação */}
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-1 self-stretch rounded-full shrink-0 mt-0.5" style={{ background: item.priority === 'critica' ? '#ef4444' : item.priority === 'alta' ? '#f97316' : item.priority === 'media' ? '#eab308' : '#22c55e' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white/40 text-xs font-mono">{item.requestId}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${priorityColor(item.priority)}`}>
                          <Flame className="w-3 h-3" /> {PRIORITY_LABELS[item.priority]}
                        </span>
                        {item.category && <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/50 border border-white/10">{item.category}</span>}
                      </div>
                      {/* Descrição em destaque */}
                      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2.5 mb-2">
                        <p className="text-xs font-semibold text-cyan-400/80 mb-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Solicitação do usuário
                        </p>
                        <p className="text-white/85 text-sm leading-relaxed whitespace-pre-wrap">
                          {item.description || <span className="text-white/30 italic">Sem descrição</span>}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        <span className="text-white/40 text-xs flex items-center gap-1"><User className="w-3 h-3" />{item.userName}</span>
                        <span className="text-white/40 text-xs flex items-center gap-1"><Building2 className="w-3 h-3" />{item.companyName || "—"}</span>
                        <span className="text-white/40 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  {/* SLA Bar */}
                  {!isClosed && <div className="mt-1"><SLABar item={item} /></div>}
                </div>

                {/* Attachments from ticket */}
                {attachments.length > 0 && (
                  <div className="px-4 py-2 border-b border-white/5 bg-white/2 shrink-0">
                    <p className="text-white/40 text-xs mb-1.5 flex items-center gap-1"><Paperclip className="w-3 h-3" /> {attachments.length} anexo(s)</p>
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((att: any) => (
                        att.mimeType?.startsWith("image/") ? (
                          <button
                            key={att.id}
                            onClick={() => setLightboxUrl(att.fileUrl)}
                            className="relative group w-14 h-14 rounded-lg overflow-hidden border border-white/10 hover:border-cyan-400/50 transition-colors"
                          >
                            <img src={att.fileUrl} alt={att.fileName} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <ZoomIn className="w-4 h-4 text-white" />
                            </div>
                          </button>
                        ) : (
                          <a
                            key={att.id}
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-400/50 text-white/60 hover:text-white text-xs transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="max-w-[120px] truncate">{att.fileName}</span>
                            <Download className="w-3 h-3 opacity-50" />
                          </a>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Approval Banner */}
                {isManagerOrAbove && item.status === "aguardando_aprovacao" && item.approvals?.some((a: any) => a.status === "pendente") && (
                  <div className="mx-4 mt-3 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 space-y-2 shrink-0">
                    <p className="text-orange-300 text-xs font-medium flex items-center gap-1">
                      <Bell className="w-3.5 h-3.5" /> Aguardando sua aprovação
                    </p>
                    <Textarea value={approvalComment} onChange={e => setApprovalComment(e.target.value)} placeholder="Comentário (opcional)..." rows={2} className="bg-white/5 border-white/10 text-white text-xs resize-none" />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApproval("aprovado")} disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white text-xs flex-1">
                        <CircleCheck className="w-3.5 h-3.5 mr-1" /> Aprovar
                      </Button>
                      <Button size="sm" onClick={() => handleApproval("rejeitado")} disabled={submitting} variant="destructive" className="text-xs flex-1">
                        <CircleX className="w-3.5 h-3.5 mr-1" /> Rejeitar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Rating (for resolved tickets by requester) */}
                {isResolved && !isAgentOrAdmin && !ratingSubmitted && (
                  <div className="mx-4 mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 shrink-0">
                    <p className="text-cyan-300 text-xs font-medium mb-2">Como você avalia o atendimento?</p>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setRating(n)} className="transition-transform hover:scale-110">
                          <Star className={`w-5 h-5 ${n <= rating ? "fill-yellow-400 text-yellow-400" : "text-white/20"}`} />
                        </button>
                      ))}
                      {rating > 0 && (
                        <Button size="sm" onClick={() => { setRatingSubmitted(true); toast.success("Avaliação enviada! Obrigado."); }} className="ml-2 bg-cyan-500 hover:bg-cyan-600 text-black text-xs h-7">
                          Enviar
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Chat Messages */}
                <ScrollArea className="flex-1 px-4 py-3">
                  <div className="space-y-3">
                    {chatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-white/20">
                        <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
                        <p className="text-sm">Nenhuma mensagem ainda</p>
                      </div>
                    ) : (
                      chatMessages.map((h: any) => (
                        <MessageBubble key={h.id} h={h} currentUserId={currentUser?.id} isAgentOrAdmin={isAgentOrAdmin} />
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                {!isClosed && (
                  <div className="px-4 py-3 border-t border-white/10 bg-[#0d1220] shrink-0 space-y-2">
                    {/* Quick Replies */}
                    {isAgentOrAdmin && showQuickReplies && (
                      <div className="flex flex-wrap gap-1.5 pb-1">
                        {QUICK_REPLIES.map(qr => (
                          <button
                            key={qr.label}
                            onClick={() => { setComment(qr.text); setShowQuickReplies(false); }}
                            className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs hover:bg-cyan-500/20 transition-colors"
                          >
                            {qr.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Attach preview */}
                    {attachFiles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {attachFiles.map((f, i) => (
                          <div key={i} className="flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-white/60">
                            {f.mimeType.startsWith("image/") ? <Image className="w-3 h-3 text-cyan-400" /> : <FileText className="w-3 h-3 text-cyan-400" />}
                            <span className="max-w-[80px] truncate">{f.name}</span>
                            <button onClick={() => setAttachFiles(p => p.filter((_, j) => j !== i))} className="text-white/30 hover:text-red-400">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-end gap-2">
                      <div className="flex-1 relative">
                        <Textarea
                          value={comment}
                          onChange={e => setComment(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleComment(); }}
                          placeholder={isInternal ? "Nota interna (visível apenas para agentes)..." : "Escreva uma mensagem..."}
                          rows={2}
                          className={`resize-none text-sm pr-2 ${isInternal ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-50 placeholder:text-yellow-400/40" : "bg-white/5 border-white/10 text-white placeholder:text-white/30"}`}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {/* Attach button */}
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-cyan-400 hover:border-cyan-400/50 transition-colors"
                          title="Anexar arquivo"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                        {/* Quick replies (agent only) */}
                        {isAgentOrAdmin && (
                          <button
                            onClick={() => setShowQuickReplies(v => !v)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${
                              showQuickReplies ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" : "bg-white/5 border-white/10 text-white/40 hover:text-cyan-400"
                            }`}
                            title="Respostas rápidas"
                          >
                            <Reply className="w-4 h-4" />
                          </button>
                        )}
                        {/* Send */}
                        <button
                          type="button"
                          onClick={handleComment}
                          disabled={submitting || (!comment.trim() && attachFiles.length === 0)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 text-black"
                          style={{
                            background: (submitting || (!comment.trim() && attachFiles.length === 0)) ? 'rgba(6,182,212,0.25)' : '#06b6d4',
                            cursor: (submitting || (!comment.trim() && attachFiles.length === 0)) ? 'not-allowed' : 'pointer',
                            boxShadow: (!comment.trim() && attachFiles.length === 0) ? 'none' : '0 0 8px rgba(6,182,212,0.5)',
                          }}
                          title="Enviar (Ctrl+Enter)"
                        >
                          {submitting ? <Loader2 className="w-4 h-4 animate-spin text-cyan-200" /> : <Send className="w-4 h-4" style={{color: (!comment.trim() && attachFiles.length === 0) ? 'rgba(6,182,212,0.5)' : '#000'}} />}
                        </button>
                      </div>
                    </div>

                    {/* Internal note toggle (agent only) */}
                    {isAgentOrAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsInternal(v => !v)}
                          className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border transition-colors ${
                            isInternal ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" : "bg-white/5 border-white/10 text-white/30 hover:text-white/60"
                          }`}
                        >
                          <Lock className="w-3 h-3" />
                          {isInternal ? "Nota interna ativa" : "Nota interna"}
                        </button>
                        <span className="text-white/20 text-xs">Ctrl+Enter para enviar</span>
                      </div>
                    )}
                    <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip" className="hidden"
                      onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(handleFileAdd); e.target.value = ""; }}
                    />
                  </div>
                )}

                {isClosed && (
                  <div className="px-4 py-3 border-t border-white/10 bg-[#0d1220] shrink-0 text-center">
                    <p className="text-white/30 text-xs flex items-center justify-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" /> Este chamado está encerrado
                    </p>
                  </div>
                )}
              </div>

              {/* ── Right: Actions Panel (detalhes/ações) ── */}
              <div className={`w-full sm:w-72 md:w-80 lg:w-96 shrink-0 flex-col overflow-y-auto bg-[#0d1220] ${
                mobileTab === "actions" ? "flex" : "hidden sm:flex"
              }`}>
                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">

                  {/* ─ Notificações / Alertas ─ */}
                  {(item.slaBreached || item.status === "aguardando_aprovacao" || (item.approvals?.length > 0)) && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                        <BellRing className="w-3.5 h-3.5 text-orange-400" /> Notificações
                      </h3>
                      {item.slaBreached && (
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-red-300 text-xs font-medium">SLA Vencido</p>
                            <p className="text-red-400/60 text-xs">Este chamado ultrapassou o prazo de atendimento</p>
                          </div>
                        </div>
                      )}
                      {item.status === "aguardando_aprovacao" && (
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/30">
                          <Clock className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-orange-300 text-xs font-medium">Aguardando Aprovação</p>
                            <p className="text-orange-400/60 text-xs">
                              {item.approvals?.find((a: any) => a.status === "pendente")?.managerName
                                ? `Gestor: ${item.approvals.find((a: any) => a.status === "pendente").managerName}`
                                : "Solicitação enviada ao gestor"}
                            </p>
                          </div>
                        </div>
                      )}
                      {item.approvals?.filter((a: any) => a.status === "aprovada").map((a: any) => (
                        <div key={a.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-green-500/10 border border-green-500/30">
                          <CircleCheck className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-green-300 text-xs font-medium">Aprovado por {a.managerName}</p>
                            {a.note && <p className="text-green-400/60 text-xs">{a.note}</p>}
                          </div>
                        </div>
                      ))}
                      {item.approvals?.filter((a: any) => a.status === "rejeitada").map((a: any) => (
                        <div key={a.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
                          <CircleX className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-red-300 text-xs font-medium">Rejeitado por {a.managerName}</p>
                            {a.note && <p className="text-red-400/60 text-xs">{a.note}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ─ Aprovação do Gestor ─ */}
                  {/* Solicitar aprovação (agente/admin) */}
                  {isAgentOrAdmin && !isClosed && item.status !== "aguardando_aprovacao" && (
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowApprovalPanel(v => !v)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs hover:bg-violet-500/15 transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5" /> Solicitar Aprovação do Gestor
                        </span>
                        {showApprovalPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      {showApprovalPanel && (
                        <div className="space-y-2 p-3 rounded-lg bg-white/3 border border-white/10">
                          <div className="space-y-1">
                            <Label className="text-white/40 text-xs">Gestor da empresa ({item.companyName})</Label>
                            <Select value={approvalManagerId} onValueChange={setApprovalManagerId}>
                              <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-xs">
                                <SelectValue placeholder="Selecionar gestor..." />
                              </SelectTrigger>
                              <SelectContent className="bg-[#0d1b2a] border-white/10">
                                {managers.length === 0 ? (
                                  <SelectItem value="__no_manager__" disabled className="text-white/30 text-xs">Nenhum gestor encontrado</SelectItem>
                                ) : managers.map(m => (
                                  <SelectItem key={m.id} value={String(m.id)} className="text-white text-xs">{m.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-white/40 text-xs">Justificativa</Label>
                            <Textarea
                              value={approvalJustification}
                              onChange={e => setApprovalJustification(e.target.value)}
                              placeholder="Descreva o motivo da solicitação..."
                              rows={3}
                              className="bg-white/5 border-white/10 text-white text-xs resize-none"
                            />
                          </div>
                          <Button
                            size="sm"
                            onClick={handleRequestApproval}
                            disabled={submitting || !approvalManagerId || approvalManagerId === "__no_manager__"}
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs"
                          >
                            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <UserCheck className="w-3.5 h-3.5 mr-1" />}
                            Enviar para Aprovação
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Decidir aprovação (gestor/admin) */}
                  {isManagerOrAbove && item.status === "aguardando_aprovacao" && item.approvals?.some((a: any) => a.status === "pendente") && (
                    <div className="space-y-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                      <p className="text-orange-300 text-xs font-semibold flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5" /> Decisão Necessária
                      </p>
                      <p className="text-orange-400/70 text-xs">
                        Solicitante: <span className="text-white/70">{item.userName}</span> — {item.companyName}
                      </p>
                      <Textarea
                        value={approvalDecisionNote}
                        onChange={e => setApprovalDecisionNote(e.target.value)}
                        placeholder="Observação (opcional)..."
                        rows={2}
                        className="bg-white/5 border-white/10 text-white text-xs resize-none"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleDecideApproval("aprovada")} disabled={submitting}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs">
                          <CircleCheck className="w-3.5 h-3.5 mr-1" /> Aprovar
                        </Button>
                        <Button size="sm" onClick={() => handleDecideApproval("rejeitada")} disabled={submitting}
                          variant="destructive" className="flex-1 text-xs">
                          <CircleX className="w-3.5 h-3.5 mr-1" /> Rejeitar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ─ Ações do Atendente ─ */}
                  {isAgentOrAdmin && !isClosed && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                        <Headphones className="w-3.5 h-3.5 text-cyan-400" /> Atendimento
                      </h3>
                      <div className="grid grid-cols-1 gap-1.5">
                        {item.status !== "em_andamento" && (
                          <Button size="sm" onClick={handleAtender} disabled={submitting} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs justify-start">
                            <Headphones className="w-3.5 h-3.5 mr-2" /> Atender agora
                          </Button>
                        )}
                        {!["resolvido", "fechado"].includes(item.status) && (
                          <Button size="sm" onClick={() => handleStatusChange("resolvido")} disabled={submitting} className="w-full bg-green-700 hover:bg-green-800 text-white text-xs justify-start">
                            <CircleCheck className="w-3.5 h-3.5 mr-2" /> Marcar Resolvido
                          </Button>
                        )}
                        {item.status !== "fechado" && (
                          <Button size="sm" variant="destructive" onClick={() => setShowCloseConfirm(true)} disabled={submitting} className="w-full text-xs justify-start">
                            <XCircle className="w-3.5 h-3.5 mr-2" /> Encerrar Chamado
                          </Button>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/40 text-xs">Alterar Status</Label>
                        <Select value={item.status} onValueChange={handleStatusChange}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1b2a] border-white/10">
                            {Object.entries(STATUS_LABELS).map(([v, l]) => (
                              <SelectItem key={v} value={v} className="text-white text-xs">{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/40 text-xs">Atribuir a</Label>
                        <Select value={assignedId} onValueChange={v => { setAssignedId(v); handleAssign(v); }}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-xs">
                            <SelectValue placeholder="Selecionar agente..." />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1b2a] border-white/10">
                            <SelectItem value="__none__" className="text-white/40 text-xs">Sem atribuição</SelectItem>
                            {agents.map(a => (
                              <SelectItem key={a.id} value={String(a.id)} className="text-white text-xs">{a.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* ─ SLA ─ */}
                  {isAgentOrAdmin && (
                    <>
                      <Separator className="bg-white/10" />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                            <Timer className="w-3.5 h-3.5 text-cyan-400" /> SLA / Prazo
                          </h3>
                          {!slaEditMode && (
                            <button
                              onClick={() => { setSlaEditMode(true); setSlaEditValue(item.slaDeadline ? new Date(item.slaDeadline).toISOString().slice(0,16) : ""); }}
                              className="text-xs text-cyan-400/60 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" /> Alterar
                            </button>
                          )}
                        </div>
                        {!slaEditMode ? (
                          <div className="space-y-1.5">
                            {item.slaDeadline ? (
                              <>
                                <div className="flex justify-between text-xs">
                                  <span className="text-white/40">Prazo</span>
                                  <span className={item.slaBreached ? "text-red-400 font-medium" : "text-white/70"}>{formatDate(item.slaDeadline)}</span>
                                </div>
                                <SLABar item={item} />
                              </>
                            ) : (
                              <p className="text-white/30 text-xs italic">Nenhum SLA definido</p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <Label className="text-white/40 text-xs">Novo prazo (data/hora)</Label>
                              <input
                                type="datetime-local"
                                value={slaEditValue}
                                onChange={e => setSlaEditValue(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500/50"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSlaUpdate} disabled={slaSubmitting || !slaEditValue}
                                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs">
                                {slaSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CircleCheck className="w-3.5 h-3.5 mr-1" />}
                                Salvar
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setSlaEditMode(false)}
                                className="flex-1 text-white/50 hover:text-white text-xs">
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <Separator className="bg-white/10" />

                  {/* ─ Detalhes ─ */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5 text-white/40" /> Detalhes
                    </h3>
                    <div className="space-y-2 text-xs">
                      {[
                        { label: "Solicitante", value: item.userName, cls: "text-white/80 font-medium" },
                        { label: "Empresa", value: item.companyName, cls: "text-white/80" },
                        { label: "Departamento", value: item.departmentName, cls: "text-white/80" },
                        { label: "Atribuído a", value: item.assignedToName || "Não atribuído", cls: item.assignedToName ? "text-cyan-300" : "text-white/30" },
                        { label: "Criado em", value: formatDate(item.createdAt), cls: "text-white/60" },
                        item.updatedAt && { label: "Atualizado", value: formatDate(item.updatedAt), cls: "text-white/60" },
                        item.resolvedAt && { label: "Resolvido", value: formatDate(item.resolvedAt), cls: "text-green-400" },
                      ].filter(Boolean).map((row: any) => (
                        <div key={row.label} className="flex justify-between gap-2">
                          <span className="text-white/40 shrink-0">{row.label}</span>
                          <span className={`${row.cls} text-right truncate max-w-[140px]`}>{row.value || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ─ Boas Práticas ─ */}
                  {isAgentOrAdmin && (
                    <>
                      <Separator className="bg-white/10" />
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-green-400" /> Boas Práticas
                        </h3>
                        <ul className="space-y-1.5 text-xs text-white/40">
                          {[
                            "Responda em até 1h para chamados críticos",
                            "Atualize o status ao iniciar o atendimento",
                            "Use notas internas para comunicação da equipe",
                            "Confirme resolução com o solicitante antes de fechar",
                            "Documente a solução nos comentários",
                            "Solicite aprovação do gestor para aquisições",
                          ].map(tip => (
                            <li key={tip} className="flex items-start gap-1.5">
                              <CircleCheck className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white/40 text-sm">Item não encontrado</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação de Encerramento */}
      <Dialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <DialogContent className="max-w-sm bg-[#0d1b2a] border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" /> Encerrar Chamado
            </DialogTitle>
            <DialogDescription className="text-white/50 text-sm">
              Tem certeza que deseja encerrar este chamado? O solicitante será notificado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCloseConfirm(false)} className="text-white/60 hover:text-white">
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleEncerrar} disabled={submitting}>
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <XCircle className="w-3.5 h-3.5 mr-1" />}
              Encerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Stats Dashboard ──────────────────────────────────────────────────────────

function StatsDashboard({ stats, loading }: { stats: Stats | null; loading: boolean }) {
  const totalOpen = stats?.byStatus.filter(s => ["aberto", "em_analise", "em_andamento"].includes(s.status)).reduce((a, b) => a + Number(b.count), 0) || 0;
  const totalResolved = stats?.byStatus.filter(s => ["resolvido", "fechado"].includes(s.status)).reduce((a, b) => a + Number(b.count), 0) || 0;
  const totalPending = stats?.byStatus.filter(s => s.status === "aguardando_aprovacao").reduce((a, b) => a + Number(b.count), 0) || 0;
  const totalTickets = stats?.tickets.reduce((a, b) => a + Number(b.count), 0) || 0;

  const cards = [
    { label: "Abertos", value: totalOpen, icon: <Inbox className="w-5 h-5" />, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Resolvidos", value: totalResolved, icon: <CheckCircle2 className="w-5 h-5" />, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
    { label: "Aguard. Aprovação", value: totalPending + (stats?.pendingApprovals || 0), icon: <ThumbsUp className="w-5 h-5" />, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
    { label: "SLA Vencido", value: stats?.slaBreached || 0, icon: <AlertTriangle className="w-5 h-5" />, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
    { label: "Chamados", value: totalTickets, icon: <TicketIcon className="w-5 h-5" />, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-3 sm:mb-4">
      {cards.map((c) => (
        <Card key={c.label} className={`border ${c.bg} bg-transparent`}>
          <CardContent className="p-2.5 sm:p-4">
            {loading ? (
              <Skeleton className="h-10 w-full bg-white/10" />
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/50 text-xs">{c.label}</p>
                  <p className={`text-xl sm:text-2xl font-bold ${c.color}`}>{c.value}</p>
                </div>
                <div className={`${c.color} opacity-70`}>{c.icon}</div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Items Table ──────────────────────────────────────────────────────────────

function ItemsTable({
  items,
  loading,
  onSelect,
  total,
  page,
  pages,
  onPageChange,
}: {
  items: SupportItem[];
  loading: boolean;
  onSelect: (id: number) => void;
  total: number;
  page: number;
  pages: number;
  onPageChange: (p: number) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3,4,5].map(i => (
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
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/30">
        <Inbox className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">Nenhum item encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const sla = slaStatus(item);
        const isCritical = item.priority === "critica";
        const isSlaBreached = sla?.label === "SLA Vencido";
        return (
          <div
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`
              relative rounded-xl cursor-pointer transition-all duration-200 group overflow-hidden
              border hover:shadow-lg hover:shadow-black/20
              ${isCritical
                ? "bg-red-950/30 border-red-500/30 hover:border-red-400/50 hover:bg-red-950/40"
                : isSlaBreached
                ? "bg-orange-950/20 border-orange-500/20 hover:border-orange-400/40 hover:bg-orange-950/30"
                : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/8"
              }
            `}
          >
            {/* Barra lateral colorida por prioridade */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
              item.priority === "critica" ? "bg-red-500" :
              item.priority === "alta" ? "bg-orange-500" :
              item.priority === "media" ? "bg-yellow-500" :
              "bg-green-500"
            }`} />

            <div className="pl-4 pr-4 pt-3 pb-3">
              {/* Linha superior: tipo + ID + badges de status/prioridade */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {/* Tipo */}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${typeColor(item.type)}`}>
                  {typeIcon(item.type)}
                  <span className="hidden xs:inline">{TYPE_LABELS[item.type]}</span>
                </span>

                {/* ID */}
                <span className="text-white/30 text-xs font-mono bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                  #{item.requestId}
                </span>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Status */}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(item.status)}`}>
                  {STATUS_LABELS[item.status]}
                </span>

                {/* Prioridade */}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${priorityColor(item.priority)}`}>
                  {isCritical && <Flame className="w-3 h-3 inline mr-0.5" />}
                  {PRIORITY_LABELS[item.priority]}
                </span>
              </div>

              {/* Título */}
              <p className={`text-sm font-semibold mb-2 leading-snug group-hover:text-cyan-300 transition-colors ${
                isCritical ? "text-red-100" : "text-white"
              }`}>
                {item.title}
              </p>

              {/* Linha inferior: meta info + data */}
              <div className="flex items-center gap-x-3 gap-y-1 flex-wrap">
                {item.category && (
                  <span className="flex items-center gap-1 text-xs text-white/40">
                    <Layers className="w-3 h-3" />
                    {item.category}
                  </span>
                )}
                {item.userName && (
                  <span className="flex items-center gap-1 text-xs text-white/40">
                    <User className="w-3 h-3" />
                    {item.userName}
                  </span>
                )}
                {item.companyName && (
                  <span className="flex items-center gap-1 text-xs text-white/40">
                    <Building2 className="w-3 h-3" />
                    {item.companyName}
                  </span>
                )}
                {item.assignedToName && (
                  <span className="flex items-center gap-1 text-xs text-cyan-400/60">
                    <UserCheck className="w-3 h-3" />
                    {item.assignedToName}
                  </span>
                )}

                {/* Data — sempre visível */}
                <span className="flex items-center gap-1 text-xs text-white/30 ml-auto">
                  <Calendar className="w-3 h-3" />
                  {formatDate(item.createdAt)}
                </span>
              </div>

              {/* SLA warning — linha separada */}
              {sla && (
                <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${sla.color}`}>
                  <Timer className="w-3.5 h-3.5" />
                  {sla.label}
                </div>
              )}
            </div>

            {/* Seta de ação */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
            </div>
          </div>
        );
      })}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between pt-3">
          <span className="text-white/40 text-xs">{total} itens • Página {page} de {pages}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="text-white/50 hover:text-white h-7 px-2">Anterior</Button>
            <Button size="sm" variant="ghost" disabled={page >= pages} onClick={() => onPageChange(page + 1)} className="text-white/50 hover:text-white h-7 px-2">Próxima</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Filters Panel ────────────────────────────────────────────────────────────

function FiltersPanel({
  filters,
  onChange,
  onClose,
  isAgentOrAdmin,
  companies,
}: {
  filters: Record<string, string>;
  onChange: (f: Record<string, string>) => void;
  onClose: () => void;
  isAgentOrAdmin: boolean;
  companies: Company[];
}) {
  const [local, setLocal] = useState(filters);
  const set = (k: string, v: string) => setLocal(p => ({ ...p, [k]: v }));

  return (
    <div className="bg-[#0d1b2a] border border-white/10 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-medium text-sm flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-cyan-400" /> Filtros Avançados</h3>
        <Button size="sm" variant="ghost" onClick={onClose} className="text-white/40 hover:text-white h-7 w-7 p-0"><X className="w-4 h-4" /></Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div>
          <Label className="text-white/50 text-xs mb-1">Tipo</Label>
          <Select value={local.type || ""} onValueChange={v => set("type", v)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent className="bg-[#0d1b2a] border-white/10">
              <SelectItem value="__all__" className="text-white text-xs">Todos</SelectItem>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v} className="text-white text-xs">{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-white/50 text-xs mb-1">Status</Label>
          <Select value={local.status || ""} onValueChange={v => set("status", v)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent className="bg-[#0d1b2a] border-white/10">
              <SelectItem value="__all__" className="text-white text-xs">Todos</SelectItem>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v} className="text-white text-xs">{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-white/50 text-xs mb-1">Prioridade</Label>
          <Select value={local.priority || ""} onValueChange={v => set("priority", v)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent className="bg-[#0d1b2a] border-white/10">
              <SelectItem value="__all__" className="text-white text-xs">Todas</SelectItem>
              {Object.entries(PRIORITY_LABELS).map(([v, l]) => <SelectItem key={v} value={v} className="text-white text-xs">{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {isAgentOrAdmin && (
          <div>
            <Label className="text-white/50 text-xs mb-1">Empresa</Label>
            <Select value={local.companyId || ""} onValueChange={v => set("companyId", v)}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent className="bg-[#0d1b2a] border-white/10">
                <SelectItem value="__all__" className="text-white text-xs">Todas</SelectItem>
                {(Array.isArray(companies) ? companies : []).map(c => <SelectItem key={c.id} value={String(c.id)} className="text-white text-xs">{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label className="text-white/50 text-xs mb-1">Data Inicial</Label>
          <Input type="date" value={local.dateFrom || ""} onChange={e => set("dateFrom", e.target.value)} className="bg-white/5 border-white/10 text-white h-8 text-xs" />
        </div>
        <div>
          <Label className="text-white/50 text-xs mb-1">Data Final</Label>
          <Input type="date" value={local.dateTo || ""} onChange={e => set("dateTo", e.target.value)} className="bg-white/5 border-white/10 text-white h-8 text-xs" />
        </div>
        <div>
          <Label className="text-white/50 text-xs mb-1">SLA</Label>
          <Select value={local.slaBreached || ""} onValueChange={v => set("slaBreached", v)}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent className="bg-[#0d1b2a] border-white/10">
              <SelectItem value="__all__" className="text-white text-xs">Todos</SelectItem>
              <SelectItem value="true" className="text-white text-xs">SLA Vencido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" onClick={() => { setLocal({}); onChange({}); }} className="text-white/50 hover:text-white text-xs">Limpar</Button>
        <Button size="sm" onClick={() => { onChange(local); onClose(); }} className="bg-cyan-500 hover:bg-cyan-600 text-black text-xs">Aplicar Filtros</Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Support() {
  const { currentUser } = useAuth();
  const userRole = (currentUser as any)?.role || "user";
  const isAgentOrAdmin = ["admin", "agent", "support"].includes(userRole);
  const isManagerOrAbove = ["admin", "manager"].includes(userRole);
  const homeRoute = useHomeRoute();
  const [location, navigate] = useLocation();

  // Ler parâmetros de URL para aplicar filtros ao navegar do Management
  const getUrlParams = () => {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  };

  const getInitialTab = () => {
    const p = getUrlParams();
    const tab = p.get('tab');
    const type = p.get('type');
    if (tab) return tab;
    if (type) return 'all';
    return 'mine';
  };

  const getInitialFilters = () => {
    const p = getUrlParams();
    const f: Record<string, string> = {};
    const type = p.get('type');
    const status = p.get('status');
    const priority = p.get('priority');
    if (type) f.type = type;
    if (status) f.status = status;
    if (priority) f.priority = priority;
    return f;
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>(getInitialFilters);
  const [showFilters, setShowFilters] = useState(() => Object.keys(getInitialFilters()).length > 0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("DESC");

  // Atualizar filtros quando a URL mudar (navegando do Management)
  useEffect(() => {
    const p = getUrlParams();
    const tab = p.get('tab');
    const type = p.get('type');
    const status = p.get('status');
    const priority = p.get('priority');
    const newTab = tab || (type ? 'all' : 'mine');
    const newFilters: Record<string, string> = {};
    if (type) newFilters.type = type;
    if (status) newFilters.status = status;
    if (priority) newFilters.priority = priority;
    setActiveTab(newTab);
    setFilters(newFilters);
    setPage(1);
    if (Object.keys(newFilters).length > 0) setShowFilters(true);
  }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

  const [items, setItems] = useState<SupportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [itemsLoading, setItemsLoading] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<ItemType>("ticket");

  // Load companies for filters
  useEffect(() => {
    if (isAgentOrAdmin) {
      apiFetch("/api/companies")
        .then(res => setCompanies(Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : []))
        .catch(() => setCompanies([]));
    }
  }, [isAgentOrAdmin]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await apiFetch("/api/support/stats");
      setStats(data);
    } catch {
      // silently fail
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadItems = useCallback(async () => {
    setItemsLoading(true);
    try {
      const params = new URLSearchParams({
        tab: activeTab,
        page: String(page),
        limit: "20",
        sortBy,
        sortDir,
        ...(search ? { search } : {}),
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      });
      const data = await apiFetch(`/api/support/items?${params}`);
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch {
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  }, [activeTab, page, search, filters, sortBy, sortDir]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadItems(); }, [loadItems]);

  // Reset page when tab/filters change
  useEffect(() => { setPage(1); }, [activeTab, filters, search]);

  function openCreate(type: ItemType) {
    setCreateType(type);
    setCreateOpen(true);
  }

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0e27 0%, #1e3a5f 50%, #0a0e27 100%)" }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-3">
            <BackButton variant="ghost" />
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
                <Headphones className="w-6 h-6 text-cyan-400" />
                Central de Atendimento
              </h1>
              <p className="text-white/40 text-sm mt-0.5">Chamados, Requisições, Ocorrências e Aprovações</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate(homeRoute)}
              className="text-white/50 hover:text-cyan-400 transition-colors"
              title="Página Inicial"
            >
              <Home className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mb-3 sm:mb-4">
          <Button onClick={() => openCreate("ticket")} className="flex-1 sm:flex-none bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs sm:text-sm px-3">
            <TicketIcon className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Novo Chamado</span>
            <span className="sm:hidden ml-1">Chamado</span>
          </Button>
          <Button onClick={() => openCreate("request")} className="flex-1 sm:flex-none bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30 text-xs sm:text-sm px-3">
            <ListChecks className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Nova Requisição</span>
            <span className="sm:hidden ml-1">Requisição</span>
          </Button>
          <Button onClick={() => openCreate("occurrence")} className="flex-1 sm:flex-none bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs sm:text-sm px-3">
            <AlertTriangle className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Nova Ocorrência</span>
            <span className="sm:hidden ml-1">Ocorrência</span>
          </Button>
        </div>

        {/* Stats Dashboard */}
        <StatsDashboard stats={stats} loading={statsLoading} />

        {/* Main Content */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-3 sm:p-4">
          {/* Search + Filters bar */}
          <div className="flex flex-col gap-2 mb-3">
            {/* Linha 1: busca + filtros */}
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
                className={`shrink-0 text-white/60 hover:text-white border ${showFilters || activeFiltersCount > 0 ? "border-cyan-500/50 text-cyan-300 bg-cyan-500/10" : "border-white/10"} h-9 px-3`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Filtros</span>
                {activeFiltersCount > 0 && <span className="ml-1 bg-cyan-500 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center">{activeFiltersCount}</span>}
              </Button>
            </div>
            {/* Linha 2: ordenação (compacta, sempre visível) */}
            <div className="flex items-center gap-1.5">
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
              <Button size="sm" variant="ghost" onClick={() => setSortDir(d => d === "DESC" ? "ASC" : "DESC")} className="shrink-0 text-white/50 hover:text-white h-8 w-8 p-0 border border-white/10">
                {sortDir === "DESC" ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
              <span className="text-white/20 text-xs">{total} item{total !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mb-4">
              <FiltersPanel filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} isAgentOrAdmin={isAgentOrAdmin} companies={companies} />
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="overflow-x-auto -mx-1 px-1 mb-4">
              <TabsList className="bg-white/5 border border-white/10 gap-1 p-1 w-max min-w-full">
                <TabsTrigger value="mine" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 whitespace-nowrap">
                  <User className="w-3.5 h-3.5 mr-1" /> Meus Itens
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-300 whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5 mr-1" /> Pendências
                </TabsTrigger>
                {isManagerOrAbove && (
                  <TabsTrigger value="approvals" className="text-xs data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-300 whitespace-nowrap">
                    <ThumbsUp className="w-3.5 h-3.5 mr-1" /> Aprovações
                    {stats?.pendingApprovals ? <span className="ml-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{stats.pendingApprovals}</span> : null}
                  </TabsTrigger>
                )}
                {isAgentOrAdmin && (
                  <TabsTrigger value="queue" className="text-xs data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 whitespace-nowrap">
                    <Headphones className="w-3.5 h-3.5 mr-1" /> Fila
                  </TabsTrigger>
                )}
                {isAgentOrAdmin && (
                  <TabsTrigger value="all" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white whitespace-nowrap">
                    <BarChart3 className="w-3.5 h-3.5 mr-1" /> Todos
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {["mine", "pending", "approvals", "queue", "all"].map(tab => (
              <TabsContent key={tab} value={tab}>
                <ItemsTable
                  items={items}
                  loading={itemsLoading}
                  onSelect={setSelectedItemId}
                  total={total}
                  page={page}
                  pages={pages}
                  onPageChange={setPage}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      <CreateItemDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultType={createType}
        onCreated={() => { loadItems(); loadStats(); }}
      />
      <ItemDetailDialog
        itemId={selectedItemId}
        onClose={() => setSelectedItemId(null)}
        onUpdated={() => { loadItems(); loadStats(); }}
        userRole={userRole}
        currentUser={currentUser}
      />
    </div>
  );
}
