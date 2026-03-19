import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, AlertCircle, Building2, Users, FolderOpen, Ticket, Edit2, Trash2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

interface Company {
  id: number;
  name: string;
  cnpj: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  maxLicenses: number;
  status: "ativa" | "inativa" | "suspensa";
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function CompanyDetails() {
  const [location, setLocation] = useLocation();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'info' | 'users' | 'departments' | 'licenses'>('info');
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [companyDepartments, setCompanyDepartments] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [userFormData, setUserFormData] = useState({ email: '', name: '', role: 'user' });
  const [deptFormData, setDeptFormData] = useState({ name: '', description: '', responsibleUserId: '' });
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [savingUser, setSavingUser] = useState(false);
  const [savingDept, setSavingDept] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [deletingDeptId, setDeletingDeptId] = useState<number | null>(null);

  // Extract company ID from URL
  const getCompanyId = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('id');
    }
    return null;
  };

  const companyId = getCompanyId();

  useEffect(() => {
    if (companyId) {
      loadCompanyData();
    }
  }, [companyId]);

  const loadCompanyData = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await fetch(`/api/companies/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data);
        await loadCompanyDetails(parseInt(companyId!));
      } else {
        throw new Error("Falha ao carregar empresa");
      }
    } catch (err) {
      console.error("Erro ao carregar empresa:", err);
      setError("Falha ao carregar dados da empresa. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCompanyDetails = async (id: number) => {
    try {
      setLoadingDetails(true);
      const [usersRes, deptsRes, allUsersRes] = await Promise.all([
        fetch(`/api/users?company=${id}`),
        fetch(`/api/departments/company/${id}`),
        fetch('/api/users')
      ]);
      
      if (usersRes.ok) {
        const users = await usersRes.json();
        setCompanyUsers(Array.isArray(users) ? users : []);
      }
      if (deptsRes.ok) {
        const depts = await deptsRes.json();
        setCompanyDepartments(Array.isArray(depts) ? depts : []);
      }
      if (allUsersRes.ok) {
        const users = await allUsersRes.json();
        setAllUsers(users.filter((u: User) => u.role !== 'admin'));
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes da empresa:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBack = () => {
    setLocation('/companies');
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setUserFormData({
      email: user.email,
      name: user.name,
      role: user.role
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser || !companyId) return;
    try {
      setSavingUser(true);
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userFormData)
      });
      if (response.ok) {
        await loadCompanyDetails(parseInt(companyId));
        setShowUserModal(false);
        setEditingUser(null);
      }
    } catch (err) {
      console.error('Erro ao salvar usuário:', err);
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;
    try {
      setDeletingUserId(userId);
      const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (response.ok) {
        await loadCompanyDetails(parseInt(companyId!));
      }
    } catch (err) {
      console.error('Erro ao deletar usuário:', err);
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleEditDept = (dept: any) => {
    setEditingDept(dept);
    setDeptFormData({
      name: dept.name,
      description: dept.description || '',
      responsibleUserId: dept.responsibleUserId || ''
    });
    setShowDeptModal(true);
  };

  const handleSaveDept = async () => {
    if (!editingDept || !companyId) return;
    try {
      setSavingDept(true);
      const response = await fetch(`/api/departments/${editingDept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deptFormData)
      });
      if (response.ok) {
        await loadCompanyDetails(parseInt(companyId));
        setShowDeptModal(false);
        setEditingDept(null);
      }
    } catch (err) {
      console.error('Erro ao salvar departamento:', err);
    } finally {
      setSavingDept(false);
    }
  };

  const handleDeleteDept = async (deptId: number) => {
    if (!confirm('Tem certeza que deseja deletar este departamento?')) return;
    try {
      setDeletingDeptId(deptId);
      const response = await fetch(`/api/departments/${deptId}`, { method: 'DELETE' });
      if (response.ok) {
        await loadCompanyDetails(parseInt(companyId!));
      }
    } catch (err) {
      console.error('Erro ao deletar departamento:', err);
    } finally {
      setDeletingDeptId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <BackButton to="/companies" />
          <div className="p-6 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-3 mt-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-300">Erro</p>
              <p className="text-sm text-red-200">{error || "Empresa não encontrada"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <BackButton to="/companies" label="Voltar para Empresas" />
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {company.name}
            </h1>
          </div>
          <p className="text-slate-400">
            CNPJ: {company.cnpj}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'info'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Informações
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'users'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Usuários ({companyUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'departments'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Departamentos ({companyDepartments.length})
          </button>
          <button
            onClick={() => setActiveTab('licenses')}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'licenses'
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Ticket className="w-4 h-4" />
            Licenças
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-700/50 border-slate-600 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Informações Gerais</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-400">Nome</p>
                    <p className="text-white font-semibold">{company.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">CNPJ</p>
                    <p className="text-white font-semibold">{company.cnpj}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Email</p>
                    <p className="text-white">{company.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Telefone</p>
                    <p className="text-white">{company.phone || "-"}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-700/50 border-slate-600 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Localização</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-400">Endereço</p>
                    <p className="text-white">{company.address || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Cidade</p>
                    <p className="text-white">{company.city || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Estado</p>
                    <p className="text-white">{company.state || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">CEP</p>
                    <p className="text-white">{company.zipCode || "-"}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-slate-700/50 border-slate-600 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Status</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-400">Status da Empresa</p>
                    <span className={`inline-block px-3 py-1 rounded text-sm font-semibold mt-2 ${
                      company.status === "ativa"
                        ? "bg-green-500/20 text-green-300"
                        : company.status === "inativa"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-red-500/20 text-red-300"
                    }`}>
                      {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Máx. Licenças</p>
                    <p className="text-white font-semibold text-2xl mt-2">{company.maxLicenses}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Modal de Edição de Usuário */}
          {showUserModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="bg-slate-800 border-slate-700 w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-white mb-4">Editar Usuário</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-300">Nome</label>
                    <input
                      type="text"
                      value={userFormData.name}
                      onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">Email</label>
                    <input
                      type="email"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">Função</label>
                    <select
                      value={userFormData.role}
                      onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white mt-1"
                    >
                      <option value="user">Usuário</option>
                      <option value="manager">Gerente</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSaveUser}
                      disabled={savingUser}
                      className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
                    >
                      {savingUser ? 'Salvando...' : 'Salvar'}
                    </Button>
                    <Button
                      onClick={() => setShowUserModal(false)}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Modal de Edição de Departamento */}
          {showDeptModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <Card className="bg-slate-800 border-slate-700 w-full max-w-md p-6">
                <h2 className="text-xl font-bold text-white mb-4">Editar Departamento</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-300">Nome</label>
                    <input
                      type="text"
                      value={deptFormData.name}
                      onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">Descrição</label>
                    <input
                      type="text"
                      value={deptFormData.description}
                      onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300">Responsável</label>
                    <select
                      value={deptFormData.responsibleUserId}
                      onChange={(e) => setDeptFormData({ ...deptFormData, responsibleUserId: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white mt-1"
                    >
                      <option value="">Selecione um responsável</option>
                      {allUsers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleSaveDept}
                      disabled={savingDept}
                      className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
                    >
                      {savingDept ? 'Salvando...' : 'Salvar'}
                    </Button>
                    <Button
                      onClick={() => setShowDeptModal(false)}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
              ) : companyUsers.length === 0 ? (
                <Card className="bg-slate-700/50 border-slate-600 p-8 text-center">
                  <p className="text-slate-400">Nenhum usuário cadastrado</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {companyUsers.map((user: any) => (
                    <Card key={user.id} className="bg-slate-700/50 border-slate-600 p-4">
                      <p className="font-semibold text-white mb-2">{user.name}</p>
                      <p className="text-sm text-slate-400 mb-2">{user.email}</p>
                      <div className="flex gap-2 mb-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.role === 'admin'
                            ? 'bg-red-500/20 text-red-300'
                            : user.role === 'manager'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {user.role || 'usuário'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditUser(user)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded text-sm transition-colors" disabled={savingUser}>
                          <Edit2 className="w-3 h-3" />
                          Editar
                        </button>
                        <button onClick={() => handleDeleteUser(user.id)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm transition-colors" disabled={deletingUserId === user.id}>
                          <Trash2 className="w-3 h-3" />
                          Deletar
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'departments' && (
            <div>
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
              ) : companyDepartments.length === 0 ? (
                <Card className="bg-slate-700/50 border-slate-600 p-8 text-center">
                  <p className="text-slate-400">Nenhum departamento cadastrado</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {companyDepartments.map((dept: any) => (
                    <Card key={dept.id} className="bg-slate-700/50 border-slate-600 p-4">
                      <p className="font-semibold text-white mb-2">{dept.name}</p>
                      {dept.description && (
                        <p className="text-sm text-slate-400 mb-3">{dept.description}</p>
                      )}
                      {dept.responsibleUserId && (
                        <p className="text-xs text-slate-500 mb-3">Responsável: {allUsers.find(u => u.id === dept.responsibleUserId)?.name || 'N/A'}</p>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => handleEditDept(dept)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded text-sm transition-colors" disabled={savingDept}>
                          <Edit2 className="w-3 h-3" />
                          Editar
                        </button>
                        <button onClick={() => handleDeleteDept(dept.id)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm transition-colors" disabled={deletingDeptId === dept.id}>
                          <Trash2 className="w-3 h-3" />
                          Deletar
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'licenses' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-cyan-500/20 border-cyan-500/30 p-6">
                  <p className="text-sm text-cyan-300 mb-2">Licenças Disponíveis</p>
                  <p className="text-4xl font-bold text-cyan-400">{company.maxLicenses - companyUsers.length}</p>
                  <p className="text-xs text-slate-400 mt-2">de {company.maxLicenses} total</p>
                </Card>
                <Card className="bg-green-500/20 border-green-500/30 p-6">
                  <p className="text-sm text-green-300 mb-2">Licenças Ativas</p>
                  <p className="text-4xl font-bold text-green-400">{companyUsers.length}</p>
                  <p className="text-xs text-slate-400 mt-2">usuários cadastrados</p>
                </Card>
                <Card className="bg-purple-500/20 border-purple-500/30 p-6">
                  <p className="text-sm text-purple-300 mb-2">Utilização</p>
                  <p className="text-4xl font-bold text-purple-400">
                    {Math.round((companyUsers.length / company.maxLicenses) * 100)}%
                  </p>
                  <p className="text-xs text-slate-400 mt-2">do total</p>
                </Card>
              </div>

              <Card className="bg-slate-700/50 border-slate-600 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Barra de Utilização</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-300">Progresso</p>
                    <p className="text-sm font-semibold text-cyan-400">
                      {companyUsers.length} / {company.maxLicenses}
                    </p>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${Math.round((companyUsers.length / company.maxLicenses) * 100)}%` }}
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
