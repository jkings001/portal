import { useState, useEffect, useCallback, useRef } from "react";
import {
  Car, Plus, Upload, Download, Filter, Search, RefreshCw,
  Trash2, CheckCircle2, Clock, XCircle, AlertTriangle,
  FileText, ChevronDown, X, BarChart3, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Papa from "papaparse";

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketStatus = "disponivel" | "alocado" | "usado" | "expirado";

interface Ticket {
  id: number;
  codigo: string;
  valor: string;
  duracao_horas: number;
  data_validade: string | null;
  status: TicketStatus;
  criado_em: string;
  criado_por_nome: string;
}

interface TicketStats {
  total: number;
  disponiveis: number;
  alocados: number;
  usados: number;
  expirados: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAuthToken() { return localStorage.getItem("authToken"); }

async function apiFetch(path: string, opts: RequestInit = {}, timeoutMs = 30000) {
  const token = getAuthToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(path, {
      ...opts,
      signal: controller.signal,
      headers: {
        ...(opts.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers || {}),
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error('Tempo limite excedido. Tente novamente.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function statusColor(status: TicketStatus) {
  switch (status) {
    case "disponivel": return "bg-green-500/20 text-green-300 border-green-500/30";
    case "alocado": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "usado": return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    case "expirado": return "bg-red-500/20 text-red-300 border-red-500/30";
    default: return "bg-white/10 text-white/60 border-white/20";
  }
}

function statusLabel(status: TicketStatus) {
  const map: Record<TicketStatus, string> = {
    disponivel: "Disponível", alocado: "Alocado", usado: "Usado", expirado: "Expirado",
  };
  return map[status] || status;
}

function fmtDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function fmtCurrency(v: string | number | null) {
  if (v === null || v === undefined) return "-";
  return `R$ ${parseFloat(String(v)).toFixed(2).replace(".", ",")}`;
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function RHTicketsEstacionamento() {
  const { currentUser: user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats>({ total: 0, disponiveis: 0, alocados: 0, usados: 0, expirados: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "todos") params.set("status", filterStatus);
      const data = await apiFetch(`/api/estacionamento/tickets?${params}`);
      setTickets(data.tickets || []);
      setStats(data.stats || { total: 0, disponiveis: 0, alocados: 0, usados: 0, expirados: 0 });
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar tickets");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // ─── Ações ──────────────────────────────────────────────────────────────────

  async function handleDelete(id: number, codigo: string) {
    if (!confirm(`Remover ticket ${codigo}?`)) return;
    try {
      await apiFetch(`/api/estacionamento/tickets/${id}`, { method: "DELETE" });
      toast.success("Ticket removido");
      fetchTickets();
    } catch (e: any) {
      toast.error(e.message || "Erro ao remover ticket");
    }
  }

  function exportCSV() {
    const rows = tickets.map(t => ({
      Código: t.codigo,
      Valor: t.valor ? parseFloat(t.valor).toFixed(2) : "",
      "Duração (h)": t.duracao_horas || "",
      "Data Validade": t.data_validade ? fmtDate(t.data_validade) : "",
      Status: statusLabel(t.status),
      "Criado por": t.criado_por_nome || "",
      "Criado em": fmtDate(t.criado_em),
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tickets-estacionamento-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  }

  // ─── Filtro local ────────────────────────────────────────────────────────────

  const filtered = tickets.filter(t =>
    t.codigo.toLowerCase().includes(search.toLowerCase()) ||
    (t.criado_por_nome || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0e27 0%, #1e3a5f 50%, #0a0e27 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => window.history.back()} className="text-white/50 hover:text-white shrink-0">
              <ChevronDown className="w-5 h-5 rotate-90" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                <Car className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 shrink-0" />
                <span className="truncate">Tickets de Estacionamento</span>
              </h1>
              <p className="text-white/50 text-xs sm:text-sm hidden sm:block">Gerenciamento RH — Departamento de Recursos Humanos</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="ghost" onClick={fetchTickets} className="text-white/50 hover:text-white">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={exportCSV} className="border-white/20 text-white/70 hover:text-white hover:bg-white/10">
              <Download className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline"> Exportar</span>
            </Button>
            <Button size="sm" onClick={() => setShowUploadModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Upload className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline"> Importar CSV</span>
            </Button>
            <Button size="sm" onClick={() => setShowCreateModal(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              <Plus className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline"> Novo Ticket</span>
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, color: "text-white", icon: <BarChart3 className="w-4 h-4" /> },
            { label: "Disponíveis", value: stats.disponiveis, color: "text-green-400", icon: <CheckCircle2 className="w-4 h-4" /> },
            { label: "Alocados", value: stats.alocados, color: "text-blue-400", icon: <Clock className="w-4 h-4" /> },
            { label: "Usados", value: stats.usados, color: "text-gray-400", icon: <Car className="w-4 h-4" /> },
            { label: "Expirados", value: stats.expirados, color: "text-red-400", icon: <XCircle className="w-4 h-4" /> },
          ].map(kpi => (
            <Card key={kpi.label} className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/50 text-xs">{kpi.label}</span>
                  <span className={kpi.color}>{kpi.icon}</span>
                </div>
                <p className={`text-xl sm:text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por código ou gerente..."
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a2744] border-white/10">
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="alocado">Alocado</SelectItem>
              <SelectItem value="usado">Usado</SelectItem>
              <SelectItem value="expirado">Expirado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {["Código", "Valor", "Duração", "Validade", "Status", "Criado por", "Criado em", "Ações"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-white/10 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-white/30">Nenhum ticket encontrado</td></tr>
                ) : filtered.map((t, idx) => (
                  <tr key={`te-${t.id ?? idx}`} className="hover:bg-white/5 transition-colors" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td className="px-4 py-3 text-cyan-400 font-mono text-xs font-bold">{t.codigo}</td>
                    <td className="px-4 py-3 text-white/80">{fmtCurrency(t.valor)}</td>
                    <td className="px-4 py-3 text-white/70">{t.duracao_horas ? `${t.duracao_horas}h` : "-"}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{fmtDate(t.data_validade)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${statusColor(t.status)}`}>
                        {statusLabel(t.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/60">{t.criado_por_nome || "-"}</td>
                    <td className="px-4 py-3 text-white/40 text-xs">{fmtDate(t.criado_em)}</td>
                    <td className="px-4 py-3">
                      {t.status === "disponivel" && (
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(t.id, t.codigo)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 p-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && (
            <div className="px-4 py-3 border-t border-white/5 text-white/30 text-xs">
              {filtered.length} de {tickets.length} tickets
            </div>
          )}
        </div>
      </div>

      {/* Modal: Criar Ticket */}
      <CreateTicketModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchTickets}
      />

      {/* Modal: Upload CSV */}
      <UploadCSVModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploaded={fetchTickets}
      />
    </div>
  );
}

// ─── Modal Criar Ticket ───────────────────────────────────────────────────────

// Tabela fixa de preços: 2h = R$18, 12h = R$44
const PARKING_OPTIONS = [
  { horas: 2, valor: 18 },
  { horas: 12, valor: 44 },
] as const;

function CreateTicketModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [codigo, setCodigo] = useState("");
  const [duracao, setDuracao] = useState("2");
  const [validade, setValidade] = useState("");
  const [loading, setLoading] = useState(false);

  // Valor calculado automaticamente com base na duração selecionada
  const valorFixo = PARKING_OPTIONS.find(o => o.horas === parseInt(duracao))?.valor ?? 18;

  useEffect(() => {
    if (open) {
      setCodigo(""); setDuracao("2"); setValidade("");
    }
  }, [open]);

  async function handleSubmit() {
    if (!duracao || parseInt(duracao) <= 0) {
      toast.error("Selecione uma duração válida");
      return;
    }
    setLoading(true);
    try {
      const result = await apiFetch("/api/estacionamento/tickets", {
        method: "POST",
        body: JSON.stringify({
          codigo: codigo.trim() || undefined,
          valor: valorFixo,
          duracao_horas: parseInt(duracao),
          data_validade: validade || undefined,
        }),
      }, 30000);
      toast.success(`Ticket ${result.codigo} criado com sucesso!`);
      onCreated();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) onClose(); }}>
      <DialogContent className="max-w-md bg-[#0d1b2a] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Plus className="w-5 h-5 text-cyan-400" /> Novo Ticket de Estacionamento
          </DialogTitle>
          <DialogDescription className="sr-only">Preencha os dados para criar um novo ticket</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-white/70 text-xs mb-1">Código (deixe em branco para gerar automaticamente)</Label>
            <Input value={codigo} onChange={e => setCodigo(e.target.value.toUpperCase())} placeholder="EST-XXXXXXXX" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 font-mono" />
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-white/70 text-xs mb-1">Duração</Label>
              <Select value={duracao} onValueChange={setDuracao}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2744] border-white/10">
                  {PARKING_OPTIONS.map(o => (
                    <SelectItem key={o.horas} value={String(o.horas)}>{o.horas}h</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/70 text-xs mb-1">Valor (automático)</Label>
              <div className="flex items-center h-10 px-3 rounded-md bg-white/5 border border-white/10 text-cyan-300 font-bold text-sm">
                R$ {valorFixo.toFixed(2).replace(".", ",")}
              </div>
            </div>
          </div>
          <div>
            <Label className="text-white/70 text-xs mb-1">Data de Validade (opcional)</Label>
            <Input type="datetime-local" value={validade} onChange={e => setValidade(e.target.value)} className="bg-white/5 border-white/10 text-white" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-white/50">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-cyan-600 hover:bg-cyan-700 text-white min-w-[120px]">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </span>
            ) : "Criar Ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal Upload CSV ─────────────────────────────────────────────────────────

function UploadCSVModal({ open, onClose, onUploaded }: { open: boolean; onClose: () => void; onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ inseridos: number; total: number; erros: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setFile(null); setPreview([]); setResult(null); }
  }, [open]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    // Preview CSV
    if (f.name.endsWith(".csv")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        setPreview((parsed.data as any[]).slice(0, 5));
      };
      reader.readAsText(f);
    } else {
      setPreview([]);
    }
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = getAuthToken();
      const res = await fetch("/api/rh/tickets/upload-csv", {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro no upload");
      setResult(data);
      toast.success(`${data.inseridos} tickets importados!`);
      onUploaded();
    } catch (e: any) {
      toast.error(e.message || "Erro ao importar CSV");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#0d1b2a] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Upload className="w-5 h-5 text-purple-400" /> Importar Tickets via CSV/Excel
          </DialogTitle>
          <DialogDescription className="text-white/50 text-xs">
            O arquivo deve ter colunas: <code className="bg-white/10 px-1 rounded">codigo, valor, duracao_horas, data_validade</code>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Área de upload */}
          <div
            className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-purple-400/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-white/30 mx-auto mb-2" />
            {file ? (
              <p className="text-white/70 text-sm">{file.name} <span className="text-white/40">({(file.size / 1024).toFixed(1)} KB)</span></p>
            ) : (
              <p className="text-white/40 text-sm">Clique ou arraste um arquivo CSV ou Excel</p>
            )}
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <p className="text-white/50 text-xs mb-2">Prévia (primeiras 5 linhas):</p>
              <div className="overflow-x-auto rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      {Object.keys(preview[0]).map(k => (
                        <th key={k} className="px-3 py-2 text-left text-white/40 uppercase">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        {Object.values(row).map((v: any, j) => (
                          <td key={j} className="px-3 py-2 text-white/70">{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Resultado */}
          {result && (
            <div className={`p-3 rounded-lg text-sm ${result.erros.length === 0 ? "bg-green-500/10 border border-green-500/20 text-green-300" : "bg-yellow-500/10 border border-yellow-500/20 text-yellow-300"}`}>
              <p className="font-medium">{result.inseridos} de {result.total} tickets importados</p>
              {result.erros.length > 0 && (
                <ul className="mt-1 text-xs opacity-80 list-disc list-inside">
                  {result.erros.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-white/50">Fechar</Button>
          <Button onClick={handleUpload} disabled={!file || loading} className="bg-purple-600 hover:bg-purple-700 text-white">
            {loading ? "Importando..." : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
