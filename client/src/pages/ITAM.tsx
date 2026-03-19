import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  Monitor, Server, Package, Plus, Search, Filter, Edit2, Trash2,
  ChevronLeft, AlertCircle, CheckCircle, Clock, XCircle, RefreshCw,
  User, Building2, Calendar, DollarSign, Tag, Wrench, X,
  Upload, FileSpreadsheet, Download, AlertTriangle, CheckSquare,
  FileText, ChevronDown, ChevronUp, Laptop, Smartphone, Tablet, Key
} from "lucide-react";
import BackButton from "@/components/BackButton";
import UserMenu from "@/components/UserMenu";

interface Ativo {
  id: number;
  serial: string;
  nome: string;
  tipo: "notebook" | "smartphone" | "tablet" | "monitor" | "licenca" | "outros";
  status: "disponivel" | "alocado" | "manutencao" | "descartado";
  departamentoId: number | null;
  usuarioId: number | null;
  custo: string | null;
  dataAquisicao: string | null;
  descricao: string | null;
  fabricante: string | null;
  modelo: string | null;
  garantiaAte: string | null;
  usuarioNome?: string;
  departamentoNome?: string;
  createdAt: string;
}

interface FormData {
  serial: string;
  nome: string;
  tipo: string;
  status: string;
  departamentoId: string;
  usuarioId: string;
  custo: string;
  dataAquisicao: string;
  descricao: string;
  fabricante: string;
  modelo: string;
  garantiaAte: string;
}

interface BulkResult {
  total: number;
  sucesso: number;
  erros: number;
  detalhes: Array<{ linha: number; erro: string; dados: { serial: string; nome: string } }>;
}

const TIPO_ICONS: Record<string, React.ReactElement> = {
  notebook:    <Laptop      className="w-4 h-4" />,
  smartphone:  <Smartphone  className="w-4 h-4" />,
  tablet:      <Tablet      className="w-4 h-4" />,
  monitor:     <Monitor     className="w-4 h-4" />,
  licenca:     <Key         className="w-4 h-4" />,
  outros:      <Package     className="w-4 h-4" />,
};

const TIPO_LABELS: Record<string, string> = {
  notebook:   "Notebook",
  smartphone: "Smartphone",
  tablet:     "Tablet",
  monitor:    "Monitor",
  licenca:    "Licença",
  outros:     "Outros",
};

function getTipoIcon(tipo: string | null | undefined): React.ReactElement {
  if (!tipo) return <Server className="w-4 h-4" />;
  return TIPO_ICONS[tipo] ?? <Package className="w-4 h-4" />;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactElement }> = {
  disponivel: { label: "Disponível", color: "text-green-400 bg-green-400/20", icon: <CheckCircle className="w-3 h-3" /> },
  alocado: { label: "Alocado", color: "text-blue-400 bg-blue-400/20", icon: <User className="w-3 h-3" /> },
  manutencao: { label: "Manutenção", color: "text-yellow-400 bg-yellow-400/20", icon: <Wrench className="w-3 h-3" /> },
  descartado: { label: "Descartado", color: "text-red-400 bg-red-400/20", icon: <XCircle className="w-3 h-3" /> },
};
const DEFAULT_STATUS_CFG = { label: "Indefinido", color: "text-white/40 bg-white/10", icon: <AlertTriangle className="w-3 h-3" /> };
function getStatusCfg(status: string | null | undefined) {
  if (!status) return DEFAULT_STATUS_CFG;
  return STATUS_CONFIG[status] ?? DEFAULT_STATUS_CFG;
}

const emptyForm: FormData = {
  serial: "", nome: "", tipo: "notebook", status: "disponivel",
  departamentoId: "", usuarioId: "", custo: "", dataAquisicao: "",
  descricao: "", fabricante: "", modelo: "", garantiaAte: "",
};

// Modelo CSV para download
const CSV_TEMPLATE = `serial,nome,tipo,status,fabricante,modelo,custo,dataAquisicao,garantiaAte,descricao
SN-001,Notebook Dell Latitude 5520,hardware,disponivel,Dell,Latitude 5520,3500.00,2024-01-15,2027-01-15,Notebook para uso administrativo
SN-002,Licença Microsoft Office 365,licenca,alocado,Microsoft,Office 365,89.90,2024-03-01,,Licença anual
SN-003,Switch Cisco 24 portas,hardware,disponivel,Cisco,SG350-28,,2024-06-10,2026-06-10,Switch gerenciável para TI
`;

export default function ITAM() {
  const [, setLocation] = useLocation();
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modal individual
  const [showModal, setShowModal] = useState(false);
  const [editingAtivo, setEditingAtivo] = useState<Ativo | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Modal bulk upload
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const [showBulkErrors, setShowBulkErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dropdown de opções de cadastro
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  const [userRole, setUserRole] = useState<string>("user");
  const canManage = userRole !== "user"; // admin, manager, agent podem gerenciar ativos
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
    setUserRole(user.role || "user");
    fetchAtivos();
    fetchDepartments();
    if (user.role !== "user") fetchUsers();
  }, [page, filterTipo, filterStatus]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchAtivos() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page), limit: "12",
        ...(filterTipo && { tipo: filterTipo }),
        ...(filterStatus && { status: filterStatus }),
        ...(search && { search }),
      });
      const res = await fetch(`/api/ativos?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao carregar ativos");
      const data = await res.json();
      setAtivos(data.data || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDepartments() {
    try {
      const res = await fetch("/api/departments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.departments)
          ? data.departments
          : [];
        setDepartments(arr);
      }
    } catch {}
  }

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const usersArr = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.users)
          ? data.users
          : [];
        setUsers(usersArr);
      }
    } catch {}
  }

  function openCreate() {
    setEditingAtivo(null);
    setFormData(emptyForm);
    setShowModal(true);
    setShowAddMenu(false);
  }

  function openBulk() {
    setBulkFile(null);
    setBulkResult(null);
    setShowBulkErrors(false);
    setShowBulkModal(true);
    setShowAddMenu(false);
  }

  function openEdit(ativo: Ativo) {
    setEditingAtivo(ativo);
    setFormData({
      serial: ativo.serial,
      nome: ativo.nome,
      tipo: ativo.tipo,
      status: ativo.status,
      departamentoId: String(ativo.departamentoId || ""),
      usuarioId: String(ativo.usuarioId || ""),
      custo: ativo.custo || "",
      dataAquisicao: ativo.dataAquisicao?.split("T")[0] || "",
      descricao: ativo.descricao || "",
      fabricante: ativo.fabricante || "",
      modelo: ativo.modelo || "",
      garantiaAte: ativo.garantiaAte?.split("T")[0] || "",
    });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...formData,
        departamentoId: formData.departamentoId ? Number(formData.departamentoId) : null,
        usuarioId: formData.usuarioId ? Number(formData.usuarioId) : null,
        custo: formData.custo ? parseFloat(formData.custo) : null,
        dataAquisicao: formData.dataAquisicao || null,
        garantiaAte: formData.garantiaAte || null,
      };

      const url = editingAtivo ? `/api/ativos/${editingAtivo.id}` : "/api/ativos";
      const method = editingAtivo ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar ativo");
      }

      setShowModal(false);
      fetchAtivos();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Deseja realmente deletar este ativo?")) return;
    try {
      const res = await fetch(`/api/ativos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao deletar ativo");
      fetchAtivos();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function handleBulkUpload() {
    if (!bulkFile) return;
    setBulkUploading(true);
    setBulkResult(null);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("planilha", bulkFile);

      const res = await fetch("/api/ativos/bulk-import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar planilha");
      }

      setBulkResult(data);
      if (data.sucesso > 0) fetchAtivos();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBulkUploading(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_ativos_itam.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / 12);

  const stats = {
    total: total,
    disponiveis: ativos.filter(a => a.status === "disponivel").length,
    alocados: ativos.filter(a => a.status === "alocado").length,
    manutencao: ativos.filter(a => a.status === "manutencao").length,
  };

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: "linear-gradient(135deg, #0a1929 0%, #0d2137 50%, #0a0e27 100%)",
      }}
    >
      {/* Header */}
      <header className="glassmorphic border-b border-white/10 px-3 sm:px-6 py-3 sm:py-4 relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <BackButton onClick={() => window.location.href = '/management'} />
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex-shrink-0">
                <Server className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-xl font-bold text-white truncate">ITAM</h1>
                <p className="text-xs text-white/60 hidden sm:block">Controle de hardware, software e licenças</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canManage && (
              <div className="relative z-50" ref={addMenuRef}>
                <button
                  onClick={() => setShowAddMenu(v => !v)}
                  className="btn-primary flex items-center gap-2 text-sm px-4 py-2 relative z-50"
                >
                  <Plus className="w-4 h-4" />
                  Cadastrar Ativo
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAddMenu ? "rotate-180" : ""}`} />
                </button>
                {showAddMenu && (
                  <div className="absolute right-0 top-full mt-2 w-52 glassmorphic border border-white/20 rounded-xl shadow-2xl z-[100] overflow-hidden">
                    <button
                      onClick={openCreate}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                        <Plus className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div>
                        <div className="font-medium">Cadastro Individual</div>
                        <div className="text-xs text-white/50">Preencher formulário</div>
                      </div>
                    </button>
                    <div className="border-t border-white/10" />
                    <button
                      onClick={openBulk}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-500/30">
                        <Upload className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      <div>
                        <div className="font-medium">Upload em Lote</div>
                        <div className="text-xs text-white/50">CSV ou Excel (.xlsx)</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: "Total de Ativos", value: total, icon: <Server className="w-5 h-5" />, color: "text-cyan-400" },
            { label: "Disponíveis", value: stats.disponiveis, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-400" },
            { label: "Alocados", value: stats.alocados, icon: <User className="w-5 h-5" />, color: "text-blue-400" },
            { label: "Manutenção", value: stats.manutencao, icon: <Wrench className="w-5 h-5" />, color: "text-yellow-400" },
          ].map((stat) => (
            <div key={stat.label} className="glassmorphic p-4 rounded-xl border border-white/10">
              <div className={`${stat.color} mb-2`}>{stat.icon}</div>
              <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-white/60 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filtros e Busca */}
        <div className="glassmorphic rounded-xl border border-white/10 p-4 mb-6">
          <div className="flex flex-col gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Buscar por nome, serial, fabricante..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchAtivos()}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <select
              value={filterTipo}
              onChange={(e) => { setFilterTipo(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
            >
              <option value="">Todos os tipos</option>
              <option value="notebook">Notebook</option>
              <option value="smartphone">Smartphone</option>
              <option value="tablet">Tablet</option>
              <option value="monitor">Monitor</option>
              <option value="licenca">Licença</option>
              <option value="outros">Outros</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
            >
              <option value="">Todos os status</option>
              <option value="disponivel">Disponível</option>
              <option value="alocado">Alocado</option>
              <option value="manutencao">Manutenção</option>
              <option value="descartado">Descartado</option>
            </select>
            <button
              onClick={() => { setPage(1); fetchAtivos(); }}
              className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm hover:bg-cyan-500/30 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Buscar
            </button>
          </div>
        </div>

        {/* Lista de Ativos */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="glassmorphic rounded-xl border border-red-500/30 p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-400">{error}</p>
            <button onClick={fetchAtivos} className="mt-3 text-sm text-cyan-400 hover:underline">
              Tentar novamente
            </button>
          </div>
        ) : ativos.length === 0 ? (
          <div className="glassmorphic rounded-xl border border-white/10 p-12 text-center">
            <Server className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 text-lg">Nenhum ativo cadastrado</p>
            {canManage && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
                  <Plus className="w-4 h-4" />
                  Cadastrar ativo
                </button>
                <button onClick={openBulk} className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-colors">
                  <Upload className="w-4 h-4" />
                  Importar planilha
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {ativos.map((ativo) => {
                const statusCfg = getStatusCfg(ativo.status);
                return (
                  <div key={ativo.id} className="glassmorphic-hover rounded-xl border border-white/10 p-5 transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
                          {getTipoIcon(ativo.tipo)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-sm leading-tight">{ativo.nome}</h3>
                          <p className="text-xs text-white/50 font-mono">{ativo.serial}</p>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="space-y-1.5 mb-4">
                      {ativo.fabricante && (
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <Building2 className="w-3 h-3" />
                          {ativo.fabricante} {ativo.modelo && `· ${ativo.modelo}`}
                        </div>
                      )}
                      {ativo.usuarioNome && (
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <User className="w-3 h-3" />
                          {ativo.usuarioNome}
                        </div>
                      )}
                      {ativo.departamentoNome && (
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <Building2 className="w-3 h-3" />
                          {ativo.departamentoNome}
                        </div>
                      )}
                      {ativo.custo && (
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <DollarSign className="w-3 h-3" />
                          R$ {parseFloat(ativo.custo).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                      )}
                      {ativo.garantiaAte && (
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <Calendar className="w-3 h-3" />
                          Garantia até {new Date(ativo.garantiaAte).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/10 text-white/60">
                        {getTipoIcon(ativo.tipo)}
                        {TIPO_LABELS[ativo.tipo] ?? ativo.tipo}
                      </span>
                      {canManage && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(ativo)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-cyan-400 transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {(userRole === "admin" || userRole === "manager") && (
                            <button
                              onClick={() => handleDelete(ativo.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/60 hover:text-red-400 transition-colors"
                              title="Deletar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-white/60 text-sm disabled:opacity-40 hover:bg-white/20 transition-colors"
                >
                  Anterior
                </button>
                <span className="text-white/60 text-sm">
                  Página {page} de {totalPages} ({total} ativos)
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-white/60 text-sm disabled:opacity-40 hover:bg-white/20 transition-colors"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ─── Modal de Criação/Edição Individual ─────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glassmorphic rounded-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                  <Plus className="w-4 h-4 text-cyan-400" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  {editingAtivo ? "Editar Ativo" : "Cadastrar Ativo"}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/60 mb-1">Serial *</label>
                  <input
                    required
                    value={formData.serial}
                    onChange={e => setFormData(f => ({ ...f, serial: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                    placeholder="SN-001"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Nome *</label>
                  <input
                    required
                    value={formData.nome}
                    onChange={e => setFormData(f => ({ ...f, nome: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                    placeholder="Notebook Dell Latitude"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Tipo *</label>
                  <select
                    value={formData.tipo}
                    onChange={e => setFormData(f => ({ ...f, tipo: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 appearance-none cursor-pointer hover:bg-slate-600 transition-colors"
                  >
                    <option value="notebook" className="bg-slate-700 text-white">Notebook</option>
                    <option value="smartphone" className="bg-slate-700 text-white">Smartphone</option>
                    <option value="tablet" className="bg-slate-700 text-white">Tablet</option>
                    <option value="monitor" className="bg-slate-700 text-white">Monitor</option>
                    <option value="licenca" className="bg-slate-700 text-white">Licença</option>
                    <option value="outros" className="bg-slate-700 text-white">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 appearance-none cursor-pointer hover:bg-slate-600 transition-colors"
                  >
                    <option value="disponivel" className="bg-slate-700 text-white">Disponível</option>
                    <option value="alocado" className="bg-slate-700 text-white">Alocado</option>
                    <option value="manutencao" className="bg-slate-700 text-white">Manutenção</option>
                    <option value="descartado" className="bg-slate-700 text-white">Descartado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Fabricante</label>
                  <input
                    value={formData.fabricante}
                    onChange={e => setFormData(f => ({ ...f, fabricante: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                    placeholder="Dell, HP, Microsoft..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Modelo</label>
                  <input
                    value={formData.modelo}
                    onChange={e => setFormData(f => ({ ...f, modelo: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                    placeholder="Latitude 5520"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Departamento</label>
                  <select
                    value={formData.departamentoId}
                    onChange={e => setFormData(f => ({ ...f, departamentoId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 appearance-none cursor-pointer hover:bg-slate-600 transition-colors"
                  >
                    <option value="" className="bg-slate-700 text-white">Sem departamento</option>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id} className="bg-slate-700 text-white">{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Usuário Responsável</label>
                  <select
                    value={formData.usuarioId}
                    onChange={e => setFormData(f => ({ ...f, usuarioId: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 appearance-none cursor-pointer hover:bg-slate-600 transition-colors"
                  >
                    <option value="" className="bg-slate-700 text-white">Sem usuário</option>
                    {users.map((u: any) => (
                      <option key={u.id} value={u.id} className="bg-slate-700 text-white">{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.custo}
                    onChange={e => setFormData(f => ({ ...f, custo: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Data de Aquisição</label>
                  <input
                    type="date"
                    value={formData.dataAquisicao}
                    onChange={e => setFormData(f => ({ ...f, dataAquisicao: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Garantia até</label>
                  <input
                    type="date"
                    value={formData.garantiaAte}
                    onChange={e => setFormData(f => ({ ...f, garantiaAte: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/60 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={formData.descricao}
                  onChange={e => setFormData(f => ({ ...f, descricao: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50 resize-none"
                  placeholder="Detalhes adicionais sobre o ativo..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-white/20 text-white/70 text-sm hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-2 text-sm px-6 py-2 disabled:opacity-60"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  {editingAtivo ? "Salvar Alterações" : "Criar Ativo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal de Upload em Lote ─────────────────────────────────────────── */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glassmorphic rounded-2xl border border-white/20 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                  <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Upload em Lote</h2>
                  <p className="text-xs text-white/50">Importe múltiplos ativos via planilha</p>
                </div>
              </div>
              <button
                onClick={() => { setShowBulkModal(false); setBulkResult(null); }}
                className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Resultado do upload */}
              {bulkResult ? (
                <div className="space-y-4">
                  {/* Resumo */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="glassmorphic rounded-xl p-3 border border-white/10 text-center">
                      <div className="text-2xl font-bold text-white">{bulkResult.total}</div>
                      <div className="text-xs text-white/50 mt-1">Total</div>
                    </div>
                    <div className="glassmorphic rounded-xl p-3 border border-green-500/30 text-center">
                      <div className="text-2xl font-bold text-green-400">{bulkResult.sucesso}</div>
                      <div className="text-xs text-white/50 mt-1">Importados</div>
                    </div>
                    <div className="glassmorphic rounded-xl p-3 border border-red-500/30 text-center">
                      <div className="text-2xl font-bold text-red-400">{bulkResult.erros}</div>
                      <div className="text-xs text-white/50 mt-1">Com erro</div>
                    </div>
                  </div>

                  {/* Mensagem de sucesso */}
                  {bulkResult.sucesso > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                      <CheckSquare className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <p className="text-sm text-green-300">
                        {bulkResult.sucesso} ativo{bulkResult.sucesso > 1 ? "s" : ""} importado{bulkResult.sucesso > 1 ? "s" : ""} com sucesso!
                      </p>
                    </div>
                  )}

                  {/* Detalhes de erros */}
                  {bulkResult.erros > 0 && (
                    <div>
                      <button
                        onClick={() => setShowBulkErrors(v => !v)}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm hover:bg-red-500/20 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          {bulkResult.erros} erro{bulkResult.erros > 1 ? "s" : ""} encontrado{bulkResult.erros > 1 ? "s" : ""}
                        </div>
                        {showBulkErrors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {showBulkErrors && bulkResult.detalhes.length > 0 && (
                        <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5">
                          {bulkResult.detalhes.map((d, i) => (
                            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/20 text-xs">
                              <span className="text-red-400 font-mono font-bold flex-shrink-0">L{d.linha}</span>
                              <div>
                                <span className="text-red-300">{d.erro}</span>
                                {(d.dados.serial || d.dados.nome) && (
                                  <span className="text-white/40 ml-2">
                                    {d.dados.serial && `serial: ${d.dados.serial}`}
                                    {d.dados.serial && d.dados.nome && " · "}
                                    {d.dados.nome && `nome: ${d.dados.nome}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Botões pós-resultado */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => { setBulkResult(null); setBulkFile(null); }}
                      className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white/70 text-sm hover:bg-white/10 transition-colors"
                    >
                      Importar outro arquivo
                    </button>
                    <button
                      onClick={() => { setShowBulkModal(false); setBulkResult(null); }}
                      className="flex-1 btn-primary text-sm px-4 py-2"
                    >
                      Concluir
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Instruções */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      Colunas aceitas na planilha
                    </h3>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-1 text-xs text-white/60">
                      {[
                        { col: "serial *", desc: "Número de série (único)" },
                        { col: "nome *", desc: "Nome do ativo" },
                        { col: "tipo", desc: "notebook / smartphone / tablet / monitor / licenca / outros" },
                        { col: "status", desc: "disponivel / alocado / manutencao / descartado" },
                        { col: "fabricante", desc: "Ex: Dell, HP" },
                        { col: "modelo", desc: "Ex: Latitude 5520" },
                        { col: "custo", desc: "Valor em R$ (ex: 3500.00)" },
                        { col: "dataAquisicao", desc: "AAAA-MM-DD" },
                        { col: "garantiaAte", desc: "AAAA-MM-DD" },
                        { col: "descricao", desc: "Observações" },
                      ].map(item => (
                        <div key={item.col} className="flex gap-1">
                          <span className="font-mono text-cyan-400">{item.col}</span>
                          <span className="text-white/40">— {item.desc}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-white/40 mt-2">* Campos obrigatórios. Máximo: 1000 ativos por importação.</p>
                  </div>

                  {/* Download do modelo */}
                  <button
                    onClick={downloadTemplate}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Baixar modelo CSV de exemplo
                  </button>

                  {/* Área de drop/seleção */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      const f = e.dataTransfer.files[0];
                      if (f) setBulkFile(f);
                    }}
                    className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200
                      ${bulkFile
                        ? "border-purple-500/60 bg-purple-500/10"
                        : "border-white/20 hover:border-purple-500/40 hover:bg-white/5"
                      }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) setBulkFile(f);
                      }}
                    />
                    {bulkFile ? (
                      <div className="space-y-2">
                        <FileSpreadsheet className="w-10 h-10 text-purple-400 mx-auto" />
                        <p className="text-sm font-medium text-white">{bulkFile.name}</p>
                        <p className="text-xs text-white/50">
                          {(bulkFile.size / 1024).toFixed(1)} KB
                        </p>
                        <button
                          onClick={e => { e.stopPropagation(); setBulkFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Remover arquivo
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-10 h-10 text-white/30 mx-auto" />
                        <p className="text-sm text-white/60">
                          Arraste o arquivo aqui ou <span className="text-purple-400 underline">clique para selecionar</span>
                        </p>
                        <p className="text-xs text-white/40">CSV, XLSX ou XLS · Máx. 10 MB</p>
                      </div>
                    )}
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowBulkModal(false)}
                      className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-white/70 text-sm hover:bg-white/10 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleBulkUpload}
                      disabled={!bulkFile || bulkUploading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {bulkUploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Importar Ativos
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
