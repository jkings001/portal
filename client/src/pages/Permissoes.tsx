import React, { useState, useEffect } from "react";
import {
  Shield, Plus, Trash2, RefreshCw, AlertCircle, Search, X,
  User, Building2, Lock, CheckCircle, ChevronDown, Eye,
  Edit2, Server, FileText, FolderOpen
} from "lucide-react";
import BackButton from "@/components/BackButton";
import UserMenu from "@/components/UserMenu";

interface Permissao {
  id: number;
  usuarioId: number;
  recursoId: number;
  recursoTipo: "departamento" | "chamado" | "ativo" | "arquivo";
  permissao: "ler" | "escrever" | "gerenciar" | "admin";
  concedidoPor: number | null;
  usuarioNome?: string;
  usuarioEmail?: string;
  concedidoPorNome?: string;
  createdAt: string;
}

const RECURSO_ICONS: Record<string, React.ReactElement> = {
  departamento: <Building2 className="w-4 h-4" />,
  chamado: <FileText className="w-4 h-4" />,
  ativo: <Server className="w-4 h-4" />,
  arquivo: <FolderOpen className="w-4 h-4" />,
};

const PERMISSAO_CONFIG: Record<string, { label: string; color: string; nivel: number }> = {
  ler: { label: "Leitura", color: "text-blue-400 bg-blue-400/20", nivel: 1 },
  escrever: { label: "Escrita", color: "text-green-400 bg-green-400/20", nivel: 2 },
  gerenciar: { label: "Gerenciar", color: "text-yellow-400 bg-yellow-400/20", nivel: 3 },
  admin: { label: "Admin", color: "text-red-400 bg-red-400/20", nivel: 4 },
};

interface FormData {
  usuarioId: string;
  recursoId: string;
  recursoTipo: string;
  permissao: string;
}

export default function Permissoes() {
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterPermissao, setFilterPermissao] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormData>({
    usuarioId: "", recursoId: "", recursoTipo: "departamento", permissao: "ler",
  });
  const [userRole, setUserRole] = useState("user");

  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
    setUserRole(user.role || "user");

    if (!["admin", "manager"].includes(user.role || "")) {
      setError("Acesso restrito. Apenas administradores e gerentes podem gerenciar permissões.");
      setLoading(false);
      return;
    }

    fetchPermissoes();
    fetchUsers();
    fetchDepartments();
  }, [filterTipo, filterPermissao]);

  async function fetchPermissoes() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterTipo) params.append("recursoTipo", filterTipo);

      const res = await fetch(`/api/permissoes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao carregar permissões");
      }
      const data = await res.json();

      // Filtrar por permissão e busca no cliente
      let filtradas = data as Permissao[];
      if (filterPermissao) filtradas = filtradas.filter(p => p.permissao === filterPermissao);
      if (search) {
        filtradas = filtradas.filter(p =>
          (p.usuarioNome || "").toLowerCase().includes(search.toLowerCase()) ||
          (p.usuarioEmail || "").toLowerCase().includes(search.toLowerCase())
        );
      }

      setPermissoes(filtradas);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || data || []);
      }
    } catch {}
  }

  async function fetchDepartments() {
    try {
      const res = await fetch("/api/departments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // API retorna { success, data: [...], attempts, totalTimeMs }
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/permissoes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          usuarioId: Number(formData.usuarioId),
          recursoId: Number(formData.recursoId),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao salvar permissão");
      }

      setShowModal(false);
      setFormData({ usuarioId: "", recursoId: "", recursoTipo: "departamento", permissao: "ler" });
      fetchPermissoes();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Deseja revogar esta permissão?")) return;
    try {
      const res = await fetch(`/api/permissoes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao revogar permissão");
      fetchPermissoes();
    } catch (e: any) {
      alert(e.message);
    }
  }

  // Estatísticas
  const stats = {
    total: permissoes.length,
    leitura: permissoes.filter(p => p.permissao === "ler").length,
    escrita: permissoes.filter(p => p.permissao === "escrever").length,
    gerenciar: permissoes.filter(p => p.permissao === "gerenciar").length,
    admin: permissoes.filter(p => p.permissao === "admin").length,
  };

  // Recursos disponíveis baseado no tipo selecionado
  const recursosDisponiveis = formData.recursoTipo === "departamento" ? departments : [];

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(135deg, #0a1929 0%, #0d2137 50%, #0a0e27 100%)" }}
    >
      {/* Header */}
      <header className="glassmorphic border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Controle de Permissões (RBAC)</h1>
                <p className="text-xs text-white/60">Gerenciamento de acesso por recurso</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {["admin", "manager"].includes(userRole) && (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
              >
                <Plus className="w-4 h-4" />
                Nova Permissão
              </button>
            )}
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Acesso Negado */}
        {!["admin", "manager"].includes(userRole) ? (
          <div className="glassmorphic rounded-xl border border-red-500/30 p-12 text-center">
            <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Acesso Restrito</h2>
            <p className="text-white/60">
              Esta área é exclusiva para administradores e gerentes.
            </p>
          </div>
        ) : (
          <>
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[
                { label: "Total", value: stats.total, color: "text-cyan-400" },
                { label: "Leitura", value: stats.leitura, color: "text-blue-400" },
                { label: "Escrita", value: stats.escrita, color: "text-green-400" },
                { label: "Gerenciar", value: stats.gerenciar, color: "text-yellow-400" },
                { label: "Admin", value: stats.admin, color: "text-red-400" },
              ].map((stat) => (
                <div key={stat.label} className="glassmorphic p-4 rounded-xl border border-white/10">
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-white/60 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Filtros */}
            <div className="glassmorphic rounded-xl border border-white/10 p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Buscar por usuário ou email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchPermissoes()}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="">Todos os recursos</option>
                  <option value="departamento">Departamento</option>
                  <option value="chamado">Chamado</option>
                  <option value="ativo">Ativo</option>
                  <option value="arquivo">Arquivo</option>
                </select>
                <select
                  value={filterPermissao}
                  onChange={(e) => setFilterPermissao(e.target.value)}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="">Todos os níveis</option>
                  <option value="ler">Leitura</option>
                  <option value="escrever">Escrita</option>
                  <option value="gerenciar">Gerenciar</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={fetchPermissoes}
                  className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm hover:bg-cyan-500/30 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Atualizar
                </button>
              </div>
            </div>

            {/* Tabela de Permissões */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            ) : error ? (
              <div className="glassmorphic rounded-xl border border-red-500/30 p-6 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-400">{error}</p>
              </div>
            ) : permissoes.length === 0 ? (
              <div className="glassmorphic rounded-xl border border-white/10 p-12 text-center">
                <Shield className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 text-lg">Nenhuma permissão configurada</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 btn-primary flex items-center gap-2 mx-auto text-sm px-4 py-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar primeira permissão
                </button>
              </div>
            ) : (
              <div className="glassmorphic rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-4 py-3 text-xs text-white/50 font-medium">Usuário</th>
                      <th className="text-left px-4 py-3 text-xs text-white/50 font-medium">Recurso</th>
                      <th className="text-left px-4 py-3 text-xs text-white/50 font-medium">Tipo</th>
                      <th className="text-left px-4 py-3 text-xs text-white/50 font-medium">Permissão</th>
                      <th className="text-left px-4 py-3 text-xs text-white/50 font-medium">Concedido por</th>
                      <th className="text-left px-4 py-3 text-xs text-white/50 font-medium">Data</th>
                      <th className="text-right px-4 py-3 text-xs text-white/50 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissoes.map((p) => {
                      const permCfg = PERMISSAO_CONFIG[p.permissao];
                      return (
                        <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">
                                {(p.usuarioNome || "?")[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm text-white font-medium">{p.usuarioNome || `Usuário #${p.usuarioId}`}</div>
                                <div className="text-xs text-white/40">{p.usuarioEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-white/70">#{p.recursoId}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-sm text-white/70">
                              <span className="text-cyan-400">{RECURSO_ICONS[p.recursoTipo]}</span>
                              <span className="capitalize">{p.recursoTipo}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`flex items-center gap-1 w-fit px-2 py-1 rounded-full text-xs font-medium ${permCfg.color}`}>
                              <Lock className="w-3 h-3" />
                              {permCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-white/50">{p.concedidoPorNome || "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-white/40">
                              {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {userRole === "admin" && (
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                                title="Revogar permissão"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal de Nova Permissão */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glassmorphic rounded-2xl border border-white/20 w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">Nova Permissão</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Usuário */}
              <div>
                <label className="block text-xs text-white/60 mb-1">Usuário *</label>
                <select
                  required
                  value={formData.usuarioId}
                  onChange={e => setFormData(f => ({ ...f, usuarioId: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="">Selecione um usuário</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              {/* Tipo de Recurso */}
              <div>
                <label className="block text-xs text-white/60 mb-1">Tipo de Recurso *</label>
                <select
                  required
                  value={formData.recursoTipo}
                  onChange={e => setFormData(f => ({ ...f, recursoTipo: e.target.value, recursoId: "" }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="departamento">Departamento</option>
                  <option value="chamado">Chamado</option>
                  <option value="ativo">Ativo</option>
                  <option value="arquivo">Arquivo</option>
                </select>
              </div>

              {/* Recurso */}
              <div>
                <label className="block text-xs text-white/60 mb-1">
                  {formData.recursoTipo === "departamento" ? "Departamento" : "ID do Recurso"} *
                </label>
                {formData.recursoTipo === "departamento" ? (
                  <select
                    required
                    value={formData.recursoId}
                    onChange={e => setFormData(f => ({ ...f, recursoId: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="">Selecione um departamento</option>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.recursoId}
                    onChange={e => setFormData(f => ({ ...f, recursoId: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                    placeholder={`ID do ${formData.recursoTipo}`}
                  />
                )}
              </div>

              {/* Nível de Permissão */}
              <div>
                <label className="block text-xs text-white/60 mb-1">Nível de Permissão *</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PERMISSAO_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData(f => ({ ...f, permissao: key }))}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${
                        formData.permissao === key
                          ? `${cfg.color} border-current`
                          : "border-white/20 text-white/50 hover:border-white/40"
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descrição do nível */}
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-white/50">
                  {formData.permissao === "ler" && "Pode visualizar o recurso, mas não modificar."}
                  {formData.permissao === "escrever" && "Pode criar e editar conteúdo no recurso."}
                  {formData.permissao === "gerenciar" && "Pode gerenciar o recurso e seus membros."}
                  {formData.permissao === "admin" && "Acesso total ao recurso, incluindo deletar e gerenciar permissões."}
                </p>
              </div>

              {/* Botões */}
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
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  Conceder Permissão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
