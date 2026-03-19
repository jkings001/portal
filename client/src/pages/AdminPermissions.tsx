/**
 * AdminPermissions.tsx
 * Gestão centralizada de Usuários, Grupos e Permissões
 * Similar ao conceito de permissões do SharePoint
 */
import { useState, useEffect, useCallback } from "react";
import {
  Shield, Users, Building2, ChevronRight, ChevronLeft, Search,
  Plus, Trash2, Edit2, Check, X, UserPlus, Settings, ClipboardCheck,
  Eye, PenLine, Trash, CheckSquare, Download, Wrench, LayoutDashboard,
  Loader2, AlertCircle, MoreVertical, UserMinus, RefreshCw, Home,
  ChevronDown, ChevronUp, Filter, Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLocation } from "wouter";
import BackButton from "@/components/BackButton";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Company {
  id: number; name: string; cnpj: string; status: string;
  user_count: number; group_count: number;
  active_users?: { id: number; name: string; email: string; role: string; profileImage?: string }[];
}

interface PortalUser {
  id: number; name: string; email: string; role: string;
  department?: string; position?: string; profileImage?: string;
  company_role?: string; isActive?: number;
  groups?: string; createdAt?: string; lastSignedIn?: string;
}

interface Group {
  id: number; name: string; description?: string; color: string;
  company_id: number; is_active: number; member_count: number;
}

interface PortalModule {
  id: number; key_name: string; label: string; category: string;
  icon: string; description?: string;
}

interface GroupPermission extends PortalModule {
  can_view?: number; can_create?: number; can_edit?: number;
  can_delete?: number; can_approve?: number; can_export?: number; can_manage?: number;
}

interface AuditLog {
  id: number; action_type: string; description: string;
  performed_by_name?: string; target_user_name?: string;
  target_group_name?: string; target_module_label?: string;
  company_name?: string; created_at: string;
}

interface Stats {
  total_users: number; total_companies: number; total_groups: number;
  total_permissions: number; recent_changes: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getToken() { return localStorage.getItem("authToken") || ""; }

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = getToken();
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

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  user_created:       { label: "Usuário criado",         color: "bg-green-500/20 text-green-300 border-green-500/30" },
  user_edited:        { label: "Usuário editado",         color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  user_deleted:       { label: "Usuário removido",        color: "bg-red-500/20 text-red-300 border-red-500/30" },
  user_status_changed:{ label: "Status alterado",         color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  group_created:      { label: "Grupo criado",            color: "bg-green-500/20 text-green-300 border-green-500/30" },
  group_edited:       { label: "Grupo editado",           color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  group_deleted:      { label: "Grupo excluído",          color: "bg-red-500/20 text-red-300 border-red-500/30" },
  member_added:       { label: "Membro adicionado",       color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  member_removed:     { label: "Membro removido",         color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  permission_granted: { label: "Permissão concedida",     color: "bg-green-500/20 text-green-300 border-green-500/30" },
  permission_revoked: { label: "Permissão revogada",      color: "bg-red-500/20 text-red-300 border-red-500/30" },
  permission_updated: { label: "Permissão atualizada",    color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
};

const PERM_FIELDS = [
  { key: "can_view",    label: "Ver",      icon: Eye },
  { key: "can_create",  label: "Criar",    icon: Plus },
  { key: "can_edit",    label: "Editar",   icon: PenLine },
  { key: "can_delete",  label: "Excluir",  icon: Trash },
  { key: "can_approve", label: "Aprovar",  icon: CheckSquare },
  { key: "can_export",  label: "Exportar", icon: Download },
  { key: "can_manage",  label: "Gerenciar",icon: Wrench },
] as const;

type Tab = "users" | "groups" | "permissions" | "audit";

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function AdminPermissions() {
  const [, setLocation] = useLocation();

  // Estado global
  const [stats, setStats] = useState<Stats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [loading, setLoading] = useState(true);

  // Usuários
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<"" | "active" | "inactive">("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Grupos
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<PortalUser[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupForm, setGroupForm] = useState({ name: "", description: "", color: "#3b82f6" });
  // Seleção de usuários no modal de grupo
  const [groupUserSearch, setGroupUserSearch] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [savingGroup, setSavingGroup] = useState(false);

  // Permissões
  const [modules, setModules] = useState<PortalModule[]>([]);
  const [groupPerms, setGroupPerms] = useState<GroupPermission[]>([]);
  const [permGroup, setPermGroup] = useState<Group | null>(null);
  const [savingPerm, setSavingPerm] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Auditoria
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiFetch("/api/permissions/stats");
      setStats(data);
    } catch { /* silencioso */ }
  }, []);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/api/permissions/companies");
      setCompanies(data.companies || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!selectedCompany) return;
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (userSearch) params.set("search", userSearch);
      if (userStatusFilter) params.set("status", userStatusFilter);
      const data = await apiFetch(`/api/permissions/companies/${selectedCompany.id}/users?${params}`);
      setUsers(data.users || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingUsers(false);
    }
  }, [selectedCompany, userSearch, userStatusFilter]);

  const fetchGroups = useCallback(async () => {
    if (!selectedCompany) return;
    setLoadingGroups(true);
    try {
      const data = await apiFetch(`/api/permissions/companies/${selectedCompany.id}/groups`);
      setGroups(data.groups || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingGroups(false);
    }
  }, [selectedCompany]);

  const fetchGroupMembers = useCallback(async (groupId: number) => {
    try {
      const data = await apiFetch(`/api/permissions/groups/${groupId}/members`);
      setGroupMembers(data.members || []);
    } catch { /* silencioso */ }
  }, []);

  const fetchGroupPerms = useCallback(async (groupId: number) => {
    try {
      const data = await apiFetch(`/api/permissions/groups/${groupId}/permissions`);
      setGroupPerms(data.permissions || []);
      // Expandir todas as categorias por padrão
      const cats: Record<string, boolean> = {};
      (data.permissions || []).forEach((p: GroupPermission) => {
        if (p.category) cats[p.category] = true;
      });
      setExpandedCategories(cats);
    } catch { /* silencioso */ }
  }, []);

  const fetchModules = useCallback(async () => {
    try {
      const data = await apiFetch("/api/permissions/modules");
      setModules(data.modules || []);
    } catch { /* silencioso */ }
  }, []);

  const fetchAudit = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const params = new URLSearchParams({ page: String(auditPage), limit: "20" });
      if (selectedCompany) params.set("company_id", String(selectedCompany.id));
      const data = await apiFetch(`/api/permissions/audit?${params}`);
      setAuditLogs(data.logs || []);
      setAuditTotal(data.total || 0);
    } catch { /* silencioso */ }
    finally { setLoadingAudit(false); }
  }, [selectedCompany, auditPage]);

  useEffect(() => { fetchStats(); fetchCompanies(); fetchModules(); }, []);
  useEffect(() => { if (selectedCompany) { fetchUsers(); fetchGroups(); } }, [selectedCompany]);
  useEffect(() => { if (activeTab === "audit") fetchAudit(); }, [activeTab, auditPage, selectedCompany]);

  // ─── Ações ───────────────────────────────────────────────────────────────────

  async function handleToggleUserStatus(user: PortalUser) {
    if (!selectedCompany) return;
    try {
      await apiFetch(`/api/permissions/users/${user.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ company_id: selectedCompany.id, is_active: !user.isActive }),
      });
      toast.success(`Usuário ${user.isActive ? "desativado" : "ativado"}`);
      fetchUsers();
      fetchStats();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleSaveGroup() {
    if (!selectedCompany || !groupForm.name.trim()) {
      toast.error("Nome do grupo é obrigatório");
      return;
    }
    setSavingGroup(true);
    try {
      if (editingGroup) {
        await apiFetch(`/api/permissions/groups/${editingGroup.id}`, {
          method: "PUT",
          body: JSON.stringify(groupForm),
        });
        // Adicionar novos membros selecionados
        if (selectedUserIds.length > 0) {
          await Promise.all(selectedUserIds.map(userId =>
            apiFetch(`/api/permissions/groups/${editingGroup.id}/members`, {
              method: "POST",
              body: JSON.stringify({ user_id: userId }),
            }).catch(() => null) // ignorar duplicatas
          ));
        }
        toast.success("Grupo atualizado");
      } else {
        const newGroup = await apiFetch("/api/permissions/groups", {
          method: "POST",
          body: JSON.stringify({ ...groupForm, company_id: selectedCompany.id }),
        });
        // Adicionar membros selecionados ao grupo recém criado
        if (selectedUserIds.length > 0 && newGroup?.id) {
          await Promise.all(selectedUserIds.map(userId =>
            apiFetch(`/api/permissions/groups/${newGroup.id}/members`, {
              method: "POST",
              body: JSON.stringify({ user_id: userId }),
            }).catch(() => null)
          ));
        }
        toast.success(`Grupo "${groupForm.name}" criado${selectedUserIds.length > 0 ? ` com ${selectedUserIds.length} membro(s)` : ""}`);
      }
      setShowGroupModal(false);
      setEditingGroup(null);
      setGroupForm({ name: "", description: "", color: "#3b82f6" });
      setSelectedUserIds([]);
      setGroupUserSearch("");
      fetchGroups();
      fetchStats();
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingGroup(false); }
  }

  async function handleDeleteGroup(group: Group) {
    if (!confirm(`Excluir o grupo "${group.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await apiFetch(`/api/permissions/groups/${group.id}`, { method: "DELETE" });
      toast.success("Grupo excluído");
      if (selectedGroup?.id === group.id) { setSelectedGroup(null); setGroupMembers([]); }
      fetchGroups();
      fetchStats();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleRemoveMember(userId: number) {
    if (!selectedGroup) return;
    try {
      await apiFetch(`/api/permissions/groups/${selectedGroup.id}/members/${userId}`, { method: "DELETE" });
      toast.success("Membro removido");
      fetchGroupMembers(selectedGroup.id);
      fetchGroups();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleTogglePerm(moduleId: number, field: string, currentVal: number | undefined) {
    if (!permGroup) return;
    setSavingPerm(moduleId);
    try {
      const current = groupPerms.find(p => p.id === moduleId);
      const payload: Record<string, number> = {
        can_view:    current?.can_view    ?? 0,
        can_create:  current?.can_create  ?? 0,
        can_edit:    current?.can_edit    ?? 0,
        can_delete:  current?.can_delete  ?? 0,
        can_approve: current?.can_approve ?? 0,
        can_export:  current?.can_export  ?? 0,
        can_manage:  current?.can_manage  ?? 0,
      };
      payload[field] = currentVal ? 0 : 1;

      await apiFetch(`/api/permissions/groups/${permGroup.id}/permissions/${moduleId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      // Atualizar localmente
      setGroupPerms(prev => prev.map(p =>
        p.id === moduleId ? { ...p, [field]: payload[field] } : p
      ));
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingPerm(null); }
  }

  // ─── Render helpers ───────────────────────────────────────────────────────────

  function selectGroup(group: Group) {
    setSelectedGroup(group);
    fetchGroupMembers(group.id);
  }

  function openPermissions(group: Group) {
    setPermGroup(group);
    fetchGroupPerms(group.id);
    setActiveTab("permissions");
  }

  const groupedModules = groupPerms.reduce<Record<string, GroupPermission[]>>((acc, m) => {
    const cat = m.category || "Outros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {});

  // ─── JSX ─────────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #0a0e27 0%, #1a2744 50%, #0a0e27 100%)" }}
    >
      {/* ─── Header ─── */}
      <div className="border-b border-white/8 bg-black/20 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <BackButton to="/management" variant="ghost" />
          <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-base sm:text-lg leading-tight truncate">
              Gestão de Usuários e Permissões
            </h1>
            <p className="text-white/40 text-xs hidden sm:block">
              Controle centralizado de acesso ao portal
            </p>
          </div>
          <Button
            size="sm" variant="ghost"
            onClick={() => setLocation("/")}
            className="text-white/40 hover:text-white h-8 px-2 gap-1.5 text-xs shrink-0"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Início</span>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">

        {/* ─── KPIs ─── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {[
              { label: "Usuários",      value: stats.total_users,       color: "text-cyan-400",   bg: "bg-cyan-500/10",    icon: Users,      href: "/admin/server" },
              { label: "Empresas",      value: stats.total_companies,   color: "text-blue-400",   bg: "bg-blue-500/10",    icon: Building2 },
              { label: "Grupos",        value: stats.total_groups,      color: "text-violet-400", bg: "bg-violet-500/10",  icon: Users },
              { label: "Permissões",    value: stats.total_permissions, color: "text-green-400",  bg: "bg-green-500/10",   icon: Shield },
              { label: "Criar Usuário", value: "+",                       color: "text-green-400",  bg: "bg-green-500/10",   icon: UserPlus, href: "/admin/server?action=create" },
            ].map(k => {
              const inner = (
                <div className={`rounded-xl border border-white/10 ${k.bg} p-3 flex items-center gap-2.5 ${k.href ? 'cursor-pointer hover:border-white/30 hover:bg-opacity-20 transition-all' : ''}`}>
                  <k.icon className={`w-5 h-5 ${k.color} shrink-0`} />
                  <div className="min-w-0">
                    <p className={`text-lg sm:text-xl font-bold ${k.color}`}>{k.value}</p>
                    <p className="text-white/40 text-xs truncate">{k.label}</p>
                  </div>
                </div>
              );
              if (k.href) return <a key={k.label} href={k.href}>{inner}</a>;
              return <div key={k.label}>{inner}</div>;
            })}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

          {/* ─── Painel lateral: Empresas ─── */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-white/10 bg-white/4 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span className="text-white/70 text-sm font-semibold">Empresas</span>
                </div>
                <span className="text-white/30 text-xs">{companies.length}</span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                </div>
              ) : companies.length === 0 ? (
                <div className="text-center py-8 text-white/30 text-sm">Nenhuma empresa</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {companies.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCompany(c); setActiveTab("users"); setSelectedGroup(null); }}
                      className={`w-full text-left px-4 py-3 transition-colors hover:bg-white/5 ${
                        selectedCompany?.id === c.id ? "bg-violet-500/15 border-l-2 border-violet-400" : ""
                      }`}
                    >
                      {/* Cabeçalho da empresa */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{c.name}</p>
                          <p className="text-white/30 text-xs mt-0.5">
                            {c.user_count} usuário{c.user_count !== 1 ? 's' : ''} · {c.group_count} grupo{c.group_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full border ${
                            c.status === "ativa"
                              ? "bg-green-500/20 text-green-300 border-green-500/30"
                              : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                          }`}>
                            {c.status}
                          </span>
                          {selectedCompany?.id === c.id && (
                            <ChevronRight className="w-3.5 h-3.5 text-violet-400" />
                          )}
                        </div>
                      </div>

                      {/* Avatares dos usuários ativos */}
                      {c.active_users && c.active_users.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="flex -space-x-1.5">
                            {c.active_users.slice(0, 5).map(u => (
                              <div
                                key={u.id}
                                title={`${u.name} (${u.role})`}
                                className="w-6 h-6 rounded-full border-2 border-[#0a0e27] bg-violet-500/30 flex items-center justify-center overflow-hidden shrink-0"
                              >
                                {u.profileImage ? (
                                  <img src={u.profileImage} alt={u.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-white text-[9px] font-bold">
                                    {u.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                          {c.active_users.length > 5 && (
                            <span className="text-white/30 text-xs">+{c.active_users.length - 5}</span>
                          )}
                          <span className="text-white/20 text-xs ml-1 truncate">
                            {c.active_users.slice(0, 2).map(u => u.name.split(' ')[0]).join(', ')}
                            {c.active_users.length > 2 ? '...' : ''}
                          </span>
                        </div>
                      )}
                      {c.active_users && c.active_users.length === 0 && (
                        <p className="text-white/20 text-xs mt-1 italic">Nenhum usuário vinculado</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── Painel principal ─── */}
          <div className="lg:col-span-3">
            {!selectedCompany ? (
              <div className="rounded-2xl border border-white/10 bg-white/4 flex flex-col items-center justify-center py-20 text-center px-6">
                <Building2 className="w-12 h-12 text-white/15 mb-3" />
                <p className="text-white/40 text-sm">Selecione uma empresa para gerenciar usuários, grupos e permissões</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/4 overflow-hidden">

                {/* Cabeçalho da empresa selecionada */}
                <div className="px-5 py-4 border-b border-white/8 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-white font-bold text-base">{selectedCompany.name}</h2>
                    <p className="text-white/40 text-xs">{selectedCompany.cnpj}</p>
                  </div>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => { fetchUsers(); fetchGroups(); fetchStats(); }}
                    className="text-white/40 hover:text-white h-8 w-8 p-0"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>

                {/* Abas */}
                <div className="flex border-b border-white/8 overflow-x-auto">
                  {(["users", "groups", "permissions", "audit"] as Tab[]).map(tab => {
                    const labels: Record<Tab, string> = {
                      users: "Usuários", groups: "Grupos",
                      permissions: "Permissões", audit: "Auditoria",
                    };
                    const icons: Record<Tab, any> = {
                      users: Users, groups: Users,
                      permissions: Shield, audit: ClipboardCheck,
                    };
                    const Icon = icons[tab];
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                          activeTab === tab
                            ? "border-violet-400 text-violet-300"
                            : "border-transparent text-white/40 hover:text-white/70"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {labels[tab]}
                      </button>
                    );
                  })}
                </div>

                {/* ─── ABA: Usuários ─── */}
                {activeTab === "users" && (
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <div className="relative flex-1 min-w-[180px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <Input
                          value={userSearch}
                          onChange={e => setUserSearch(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && fetchUsers()}
                          placeholder="Buscar por nome ou e-mail..."
                          className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9"
                        />
                      </div>
                      <select
                        value={userStatusFilter}
                        onChange={e => setUserStatusFilter(e.target.value as any)}
                        className="bg-white/5 border border-white/10 text-white/70 text-sm rounded-md px-3 h-9"
                      >
                        <option value="">Todos</option>
                        <option value="active">Ativos</option>
                        <option value="inactive">Inativos</option>
                      </select>
                      <Button size="sm" onClick={fetchUsers} className="bg-violet-600 hover:bg-violet-700 text-white h-9">
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>

                    {loadingUsers ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                      </div>
                    ) : users.length === 0 ? (
                      <div className="text-center py-12 text-white/30 text-sm">Nenhum usuário encontrado</div>
                    ) : (
                      <>
                        {/* Mobile: cards */}
                        <div className="flex flex-col gap-2 sm:hidden">
                          {users.map(u => (
                            <div key={u.id} className="rounded-xl border border-white/10 bg-white/3 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-white font-medium text-sm truncate">{u.name}</p>
                                  <p className="text-white/40 text-xs truncate">{u.email}</p>
                                  <p className="text-white/30 text-xs mt-1">{u.department || "—"}</p>
                                  {u.groups && <p className="text-violet-400/70 text-xs mt-0.5 truncate">{u.groups}</p>}
                                </div>
                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full border ${
                                    u.isActive ? "bg-green-500/20 text-green-300 border-green-500/30"
                                               : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                                  }`}>
                                    {u.isActive ? "Ativo" : "Inativo"}
                                  </span>
                                  <Button
                                    size="sm" variant="ghost"
                                    onClick={() => handleToggleUserStatus(u)}
                                    className="h-7 px-2 text-xs text-white/40 hover:text-white"
                                  >
                                    {u.isActive ? <UserMinus className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Desktop: tabela */}
                        <div className="hidden sm:block rounded-xl overflow-hidden border border-white/10">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-white/8">
                                {["Usuário", "Cargo/Depto", "Grupos", "Perfil", "Último Acesso", "Status", ""].map(h => (
                                  <th key={h} className="text-left px-3 py-2.5 text-white/40 font-medium text-xs uppercase tracking-wider">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {users.map(u => (
                                <tr key={u.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                  <td className="px-3 py-2.5">
                                    <p className="text-white font-medium text-sm">{u.name}</p>
                                    <p className="text-white/40 text-xs">{u.email}</p>
                                  </td>
                                  <td className="px-3 py-2.5 text-white/60 text-xs">
                                    {u.position || u.department || "—"}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <span className="text-violet-400/70 text-xs">{u.groups || "—"}</span>
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <span className="text-white/50 text-xs capitalize">{u.company_role || u.role}</span>
                                  </td>
                                  <td className="px-3 py-2.5 text-white/30 text-xs">{fmtDate(u.lastSignedIn || null)}</td>
                                  <td className="px-3 py-2.5">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${
                                      u.isActive ? "bg-green-500/20 text-green-300 border-green-500/30"
                                                 : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                                    }`}>
                                      {u.isActive ? "Ativo" : "Inativo"}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <Button
                                      size="sm" variant="ghost"
                                      onClick={() => handleToggleUserStatus(u)}
                                      className="h-7 w-7 p-0 text-white/30 hover:text-white"
                                      title={u.isActive ? "Desativar" : "Ativar"}
                                    >
                                      {u.isActive ? <UserMinus className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ─── ABA: Grupos ─── */}
                {activeTab === "groups" && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-white/50 text-sm">{groups.length} grupo(s)</p>
                      <Button
                        size="sm"
                        onClick={() => { setEditingGroup(null); setGroupForm({ name: "", description: "", color: "#3b82f6" }); setShowGroupModal(true); }}
                        className="bg-violet-600 hover:bg-violet-700 text-white h-8 gap-1.5"
                      >
                        <Plus className="w-4 h-4" /> Novo Grupo
                      </Button>
                    </div>

                    {loadingGroups ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                      </div>
                    ) : groups.length === 0 ? (
                      <div className="text-center py-12 text-white/30 text-sm">Nenhum grupo criado</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {groups.map(g => (
                          <div
                            key={g.id}
                            className={`rounded-xl border p-4 cursor-pointer transition-all ${
                              selectedGroup?.id === g.id
                                ? "border-violet-400/50 bg-violet-500/10"
                                : "border-white/10 bg-white/3 hover:border-white/20"
                            }`}
                            onClick={() => selectGroup(g)}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{ background: g.color }}
                                />
                                <p className="text-white font-semibold text-sm truncate">{g.name}</p>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button
                                  size="sm" variant="ghost"
                                  onClick={e => { e.stopPropagation(); openPermissions(g); }}
                                  className="h-6 w-6 p-0 text-white/30 hover:text-violet-400"
                                  title="Gerenciar permissões"
                                >
                                  <Shield className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="sm" variant="ghost"
                                  onClick={e => { e.stopPropagation(); setEditingGroup(g); setGroupForm({ name: g.name, description: g.description || "", color: g.color }); setShowGroupModal(true); }}
                                  className="h-6 w-6 p-0 text-white/30 hover:text-blue-400"
                                  title="Editar grupo"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="sm" variant="ghost"
                                  onClick={e => { e.stopPropagation(); handleDeleteGroup(g); }}
                                  className="h-6 w-6 p-0 text-white/30 hover:text-red-400"
                                  title="Excluir grupo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                            {g.description && <p className="text-white/40 text-xs mb-2 line-clamp-1">{g.description}</p>}
                            <div className="flex items-center justify-between">
                              <span className="text-white/30 text-xs">{g.member_count} membro(s)</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full border ${
                                g.is_active ? "bg-green-500/20 text-green-300 border-green-500/30"
                                            : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                              }`}>
                                {g.is_active ? "Ativo" : "Inativo"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Membros do grupo selecionado */}
                    {selectedGroup && (
                      <div className="mt-5 rounded-xl border border-white/10 bg-white/3 overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: selectedGroup.color }} />
                            <span className="text-white/70 text-sm font-semibold">{selectedGroup.name} — Membros</span>
                          </div>
                          <span className="text-white/30 text-xs">{groupMembers.length}</span>
                        </div>
                        {groupMembers.length === 0 ? (
                          <div className="text-center py-6 text-white/30 text-sm">Nenhum membro neste grupo</div>
                        ) : (
                          <div className="divide-y divide-white/5">
                            {groupMembers.map(m => (
                              <div key={m.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-white text-sm truncate">{m.name}</p>
                                  <p className="text-white/30 text-xs truncate">{m.email}</p>
                                </div>
                                <Button
                                  size="sm" variant="ghost"
                                  onClick={() => handleRemoveMember(m.id)}
                                  className="h-7 w-7 p-0 text-white/30 hover:text-red-400 shrink-0"
                                  title="Remover do grupo"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ─── ABA: Permissões ─── */}
                {activeTab === "permissions" && (
                  <div className="p-4">
                    {/* Seletor de grupo */}
                    <div className="mb-4">
                      <label className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-2">
                        Grupo para configurar permissões
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {groups.map(g => (
                          <button
                            key={g.id}
                            onClick={() => { setPermGroup(g); fetchGroupPerms(g.id); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                              permGroup?.id === g.id
                                ? "border-violet-400/50 bg-violet-500/15 text-violet-300"
                                : "border-white/10 bg-white/5 text-white/60 hover:border-white/25"
                            }`}
                          >
                            <div className="w-2 h-2 rounded-full" style={{ background: g.color }} />
                            {g.name}
                          </button>
                        ))}
                        {groups.length === 0 && (
                          <p className="text-white/30 text-sm">Crie grupos na aba "Grupos" primeiro</p>
                        )}
                      </div>
                    </div>

                    {!permGroup ? (
                      <div className="text-center py-12 text-white/30 text-sm">
                        <Shield className="w-10 h-10 mx-auto mb-2 text-white/10" />
                        Selecione um grupo para configurar permissões
                      </div>
                    ) : groupPerms.length === 0 ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(groupedModules).map(([category, mods]) => (
                          <div key={category} className="rounded-xl border border-white/10 overflow-hidden">
                            <button
                              onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                              className="w-full flex items-center justify-between px-4 py-2.5 bg-white/5 hover:bg-white/8 transition-colors"
                            >
                              <span className="text-white/70 text-sm font-semibold">{category}</span>
                              {expandedCategories[category]
                                ? <ChevronUp className="w-4 h-4 text-white/40" />
                                : <ChevronDown className="w-4 h-4 text-white/40" />
                              }
                            </button>

                            {expandedCategories[category] && (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-white/8">
                                      <th className="text-left px-4 py-2 text-white/40 font-medium w-40">Módulo</th>
                                      {PERM_FIELDS.map(f => (
                                        <th key={f.key} className="px-2 py-2 text-white/40 font-medium text-center whitespace-nowrap">
                                          {f.label}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {mods.map(mod => (
                                      <tr key={mod.id} className="border-b border-white/5 hover:bg-white/3">
                                        <td className="px-4 py-2.5">
                                          <p className="text-white/80 font-medium">{mod.label}</p>
                                          {mod.description && (
                                            <p className="text-white/30 text-xs mt-0.5 line-clamp-1">{mod.description}</p>
                                          )}
                                        </td>
                                        {PERM_FIELDS.map(f => {
                                          const val = (mod as any)[f.key] as number | undefined;
                                          const isOn = !!val;
                                          return (
                                            <td key={f.key} className="px-2 py-2.5 text-center">
                                              <button
                                                onClick={() => handleTogglePerm(mod.id, f.key, val)}
                                                disabled={savingPerm === mod.id}
                                                className={`w-6 h-6 rounded-md border flex items-center justify-center mx-auto transition-all ${
                                                  isOn
                                                    ? "bg-violet-500/30 border-violet-500/50 text-violet-300"
                                                    : "bg-white/5 border-white/15 text-white/20 hover:border-white/30"
                                                }`}
                                              >
                                                {savingPerm === mod.id ? (
                                                  <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : isOn ? (
                                                  <Check className="w-3 h-3" />
                                                ) : (
                                                  <X className="w-3 h-3" />
                                                )}
                                              </button>
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ─── ABA: Auditoria ─── */}
                {activeTab === "audit" && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-white/50 text-sm">{auditTotal} registro(s)</p>
                      <Button size="sm" variant="ghost" onClick={fetchAudit} className="text-white/40 hover:text-white h-8 w-8 p-0">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>

                    {loadingAudit ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                      </div>
                    ) : auditLogs.length === 0 ? (
                      <div className="text-center py-12 text-white/30 text-sm">
                        <ClipboardCheck className="w-10 h-10 mx-auto mb-2 text-white/10" />
                        Nenhum registro de auditoria
                      </div>
                    ) : (
                      <>
                        {/* Mobile: cards */}
                        <div className="flex flex-col gap-2 sm:hidden">
                          {auditLogs.map(log => {
                            const meta = ACTION_LABELS[log.action_type] || { label: log.action_type, color: "bg-white/10 text-white/60 border-white/20" };
                            return (
                              <div key={log.id} className="rounded-xl border border-white/10 bg-white/3 p-3">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full border ${meta.color}`}>{meta.label}</span>
                                  <span className="text-white/30 text-xs shrink-0">{fmtDate(log.created_at)}</span>
                                </div>
                                <p className="text-white/70 text-sm">{log.description}</p>
                                {log.performed_by_name && (
                                  <p className="text-white/30 text-xs mt-1">Por: {log.performed_by_name}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Desktop: tabela */}
                        <div className="hidden sm:block rounded-xl overflow-hidden border border-white/10">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-white/8">
                                {["Ação", "Descrição", "Realizado por", "Data/Hora"].map(h => (
                                  <th key={h} className="text-left px-3 py-2.5 text-white/40 font-medium text-xs uppercase tracking-wider">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {auditLogs.map(log => {
                                const meta = ACTION_LABELS[log.action_type] || { label: log.action_type, color: "bg-white/10 text-white/60 border-white/20" };
                                return (
                                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/3">
                                    <td className="px-3 py-2.5">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border whitespace-nowrap ${meta.color}`}>
                                        {meta.label}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-white/70 text-xs max-w-xs">{log.description}</td>
                                    <td className="px-3 py-2.5 text-white/50 text-xs">{log.performed_by_name || "—"}</td>
                                    <td className="px-3 py-2.5 text-white/30 text-xs whitespace-nowrap">{fmtDate(log.created_at)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Paginação */}
                        {auditTotal > 20 && (
                          <div className="flex items-center justify-between mt-4">
                            <Button
                              size="sm" variant="ghost"
                              disabled={auditPage <= 1}
                              onClick={() => setAuditPage(p => p - 1)}
                              className="text-white/40 hover:text-white h-8 gap-1.5"
                            >
                              <ChevronLeft className="w-4 h-4" /> Anterior
                            </Button>
                            <span className="text-white/30 text-xs">
                              Página {auditPage} de {Math.ceil(auditTotal / 20)}
                            </span>
                            <Button
                              size="sm" variant="ghost"
                              disabled={auditPage >= Math.ceil(auditTotal / 20)}
                              onClick={() => setAuditPage(p => p + 1)}
                              className="text-white/40 hover:text-white h-8 gap-1.5"
                            >
                              Próxima <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Modal: Criar/Editar Grupo ─── */}
      <Dialog open={showGroupModal} onOpenChange={v => { if (!v) { setShowGroupModal(false); setEditingGroup(null); setSelectedUserIds([]); setGroupUserSearch(""); } }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg bg-[#0d1b2a] border border-white/10 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingGroup ? "Editar Grupo" : "Novo Grupo"}
            </DialogTitle>
            <DialogDescription className="text-white/40 text-sm">
              {selectedCompany?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Nome */}
            <div>
              <label className="text-white/60 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                Nome do grupo *
              </label>
              <Input
                value={groupForm.name}
                onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Financeiro, TI, Gestores..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="text-white/60 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                Descrição
              </label>
              <Input
                value={groupForm.description}
                onChange={e => setGroupForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descrição opcional do grupo..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>

            {/* Cor */}
            <div>
              <label className="text-white/60 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                Cor de identificação
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={groupForm.color}
                  onChange={e => setGroupForm(f => ({ ...f, color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                />
                <div className="flex gap-2">
                  {["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#ec4899","#06b6d4"].map(c => (
                    <button
                      key={c}
                      onClick={() => setGroupForm(f => ({ ...f, color: c }))}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${groupForm.color === c ? "border-white scale-110" : "border-transparent"}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Seleção de Usuários */}
            <div>
              <label className="text-white/60 text-xs font-semibold uppercase tracking-wider block mb-1.5">
                Adicionar Usuários ao Grupo
                {selectedUserIds.length > 0 && (
                  <span className="ml-2 text-violet-400 normal-case">{selectedUserIds.length} selecionado{selectedUserIds.length !== 1 ? 's' : ''}</span>
                )}
              </label>

              {/* Busca de usuários */}
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <Input
                  value={groupUserSearch}
                  onChange={e => setGroupUserSearch(e.target.value)}
                  placeholder="Buscar usuário por nome ou e-mail..."
                  className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-8 text-sm"
                />
              </div>

              {/* Lista de usuários da empresa */}
              <div className="rounded-lg border border-white/10 bg-white/3 max-h-48 overflow-y-auto">
                {users.length === 0 ? (
                  <p className="text-white/30 text-xs text-center py-4">Nenhum usuário disponível</p>
                ) : (
                  users
                    .filter(u =>
                      !groupUserSearch ||
                      u.name.toLowerCase().includes(groupUserSearch.toLowerCase()) ||
                      u.email.toLowerCase().includes(groupUserSearch.toLowerCase())
                    )
                    .map(u => {
                      const isSelected = selectedUserIds.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setSelectedUserIds(prev =>
                            isSelected ? prev.filter(id => id !== u.id) : [...prev, u.id]
                          )}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-white/5 border-b border-white/5 last:border-0 ${
                            isSelected ? "bg-violet-500/15" : ""
                          }`}
                        >
                          {/* Avatar */}
                          <div className="w-7 h-7 rounded-full bg-violet-500/30 flex items-center justify-center overflow-hidden shrink-0">
                            {u.profileImage ? (
                              <img src={u.profileImage} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-xs font-bold">{u.name.charAt(0)}</span>
                            )}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium truncate">{u.name}</p>
                            <p className="text-white/30 text-xs truncate">{u.email}</p>
                          </div>
                          {/* Check */}
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? "bg-violet-500 border-violet-500"
                              : "border-white/20 bg-transparent"
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                        </button>
                      );
                    })
                )}
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => { setShowGroupModal(false); setEditingGroup(null); setSelectedUserIds([]); setGroupUserSearch(""); }}
                className="flex-1 text-white/60 hover:text-white border border-white/10"
                disabled={savingGroup}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveGroup}
                disabled={savingGroup}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
              >
                {savingGroup ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-1.5" />
                )}
                {editingGroup ? "Salvar" : "Criar Grupo"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
