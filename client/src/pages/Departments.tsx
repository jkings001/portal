import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Eye, Loader2, AlertCircle, Building2, RefreshCw, Users, ShieldCheck } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

interface Department {
  id: number;
  companyId: number;
  name: string;
  description?: string | null;
  manager?: string | null;
  responsibleUserId?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Company {
  id: number;
  name: string;
  cnpj: string;
}

export default function Departments() {
  const [location, setLocation] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1] || '');
  const companyIdFromQuery = queryParams.get('company');
  const isFromCompanyPage = !!companyIdFromQuery;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>(companyIdFromQuery || "all");
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>("");
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    companyId: "",
    name: "",
    description: "",
    responsibleUserId: "",
  });

  const handleBack = () => {
    if (isFromCompanyPage) {
      setLocation('/companies');
    } else {
      setLocation('/management');
    }
  };

  // Load departments, companies and users on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Update filter when company query parameter changes
  useEffect(() => {
    if (companyIdFromQuery) {
      setSelectedCompanyFilter(companyIdFromQuery);
    }
  }, [companyIdFromQuery]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError("");
      await Promise.all([loadDepartments(), loadCompanies(), loadUsers()]);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError("Falha ao carregar dados. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await fetch("/api/departments");
      if (response.ok) {
        const response_data = await response.json();
        let data = response_data;
        if (response_data.data && Array.isArray(response_data.data)) {
          data = response_data.data;
        }
        if (Array.isArray(data)) {
          setDepartments(data);
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          throw new Error("Formato de resposta inválido");
        }
      } else if (response.status === 503) {
        throw new Error("Banco de dados indisponível. Tentando novamente...");
      } else {
        throw new Error("Falha ao carregar departamentos");
      }
    } catch (err: any) {
      console.error("Erro ao carregar departamentos:", err);
      const errMsg = err?.message || (typeof err === 'string' ? err : 'Erro desconhecido');
      setError(`Aviso: ${errMsg}`);
    }
  };

  const loadCompanies = async () => {
    try {
      const response = await fetch("/api/companies");
      if (response.ok) {
        const response_data = await response.json();
        let data = response_data;
        if (response_data.data && Array.isArray(response_data.data)) {
          data = response_data.data;
        }
        if (Array.isArray(data)) {
          setCompanies(data);
          if (isFromCompanyPage && companyIdFromQuery) {
            const company = data.find((c: Company) => c.id === parseInt(companyIdFromQuery));
            if (company) {
              setSelectedCompanyName(company.name);
            }
          }
        }
      }
    } catch (err) {
      console.error("Erro ao carregar empresas:", err);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch("/api/users", { headers });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setUsers(data);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    }
  };

  const handleOpenModal = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        companyId: department.companyId.toString(),
        name: department.name,
        description: department.description || "",
        responsibleUserId: department.responsibleUserId?.toString() || "",
      });
    } else {
      setEditingDepartment(null);
      setFormData({
        companyId: companyIdFromQuery || "",
        name: "",
        description: "",
        responsibleUserId: "",
      });
    }
    setError("");
    setIsModalOpen(true);
  };

  const handleSaveDepartment = async () => {
    if (!formData.companyId || !formData.name) {
      setError("Empresa e Nome são obrigatórios");
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const url = editingDepartment
        ? `/api/departments/${editingDepartment.id}`
        : "/api/departments";
      const method = editingDepartment ? "PUT" : "POST";

      const body: Record<string, any> = {
        companyId: parseInt(formData.companyId),
        name: formData.name,
        description: formData.description || null,
        responsibleUserId: formData.responsibleUserId ? parseInt(formData.responsibleUserId) : null,
      };

      // Incluir nome do responsável para compatibilidade com campo manager
      if (formData.responsibleUserId) {
        const responsible = users.find(u => u.id === parseInt(formData.responsibleUserId));
        if (responsible) {
          body.manager = responsible.name;
        }
      } else {
        body.manager = null;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || response.statusText;
        throw new Error(`Erro ${response.status}: ${errorMsg}`);
      }

      setSuccessMessage(
        editingDepartment
          ? "Departamento atualizado com sucesso!"
          : "Departamento criado com sucesso!"
      );
      setTimeout(() => setSuccessMessage(""), 3000);

      await loadDepartments();
      setIsModalOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(`Falha ao salvar departamento: ${errorMessage}`);
      console.error("Erro ao salvar departamento:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDepartment = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este departamento?")) return;

    try {
      setError("");
      const response = await fetch(`/api/departments/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || response.statusText;
        throw new Error(`Erro ${response.status}: ${errorMsg}`);
      }

      setSuccessMessage("Departamento deletado com sucesso!");
      setTimeout(() => setSuccessMessage(""), 3000);
      await loadDepartments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(`Falha ao deletar departamento: ${errorMessage}`);
      console.error("Erro ao deletar departamento:", err);
    }
  };

  const handleSeedDepartments = async () => {
    if (!confirm("Isso irá criar departamentos padrão para todas as empresas que ainda não possuem departamentos. Continuar?")) return;

    try {
      setIsSeeding(true);
      setError("");
      const response = await fetch("/api/departments/seed", { method: "POST" });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Falha ao criar departamentos padrão");
      }

      const result = await response.json();
      setSuccessMessage(
        `Departamentos padrão criados! ${result.processed} empresa(s) processada(s), ${result.created} departamento(s) criado(s), ${result.skipped} empresa(s) ignorada(s) (já tinham departamentos).`
      );
      setTimeout(() => setSuccessMessage(""), 6000);
      await loadDepartments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(`Falha ao criar departamentos padrão: ${errorMessage}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSyncDepartments = async () => {
    if (!confirm(
      "Isso irá remover departamentos duplicados e criar os 19 departamentos padrão faltantes em TODAS as empresas.\n\nDepartamentos personalizados (não duplicados) serão mantidos. Continuar?"
    )) return;
    try {
      setIsSyncing(true);
      setError("");
      const response = await fetch("/api/departments/sync", { method: "POST" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Falha ao sincronizar departamentos");
      }
      const result = await response.json();
      setSuccessMessage(
        `Sincronização concluída! ${result.companies} empresa(s) processada(s). ` +
        `${result.totalRemoved} duplicata(s) removida(s), ${result.totalCreated} departamento(s) criado(s).`
      );
      setTimeout(() => setSuccessMessage(""), 8000);
      await loadDepartments();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(`Falha ao sincronizar: ${errorMessage}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const getCompanyName = (companyId: number) => {
    return companies.find(c => c.id === companyId)?.name || "Empresa desconhecida";
  };

  const getResponsibleName = (dept: Department) => {
    if (dept.responsibleUserId) {
      const user = users.find(u => u.id === dept.responsibleUserId);
      if (user) return user.name;
    }
    return dept.manager || null;
  };

  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dept.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesCompany = selectedCompanyFilter === "all" || dept.companyId === parseInt(selectedCompanyFilter);
    return matchesSearch && matchesCompany;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BackButton to={isFromCompanyPage ? "/companies" : "/management"} />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {isFromCompanyPage ? `Departamentos - ${selectedCompanyName}` : "Gerenciamento de Departamentos"}
            </h1>
          </div>
          <p className="text-slate-400">
            {isFromCompanyPage ? "Departamentos desta empresa" : "Gerencie os departamentos de suas empresas"}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <p className="text-green-300 text-sm">{successMessage}</p>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
            />
          </div>
          {!isFromCompanyPage && (
            <select
              value={selectedCompanyFilter}
              onChange={(e) => setSelectedCompanyFilter(e.target.value)}
              className="bg-slate-700/50 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">Todas as Empresas</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          )}
          {!isFromCompanyPage && (
            <>
              <Button
                onClick={handleSyncDepartments}
                disabled={isSyncing || isSeeding}
                variant="outline"
                className="border-green-600/50 text-green-400 hover:bg-green-600/20"
                title="Remover duplicatas e criar os 19 departamentos padrão faltantes em todas as empresas"
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4 mr-2" />
                )}
                Sincronizar Padrões
              </Button>
              <Button
                onClick={handleSeedDepartments}
                disabled={isSeeding || isSyncing}
                variant="outline"
                className="border-amber-600/50 text-amber-400 hover:bg-amber-600/20"
                title="Criar departamentos padrão para empresas sem departamentos"
              >
                {isSeeding ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Criar Padrões
              </Button>
            </>
          )}
          <Button
            onClick={() => handleOpenModal()}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Departamento
          </Button>
        </div>

        {/* Departments List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : filteredDepartments.length === 0 ? (
          <Card className="bg-slate-700/50 border-slate-600 p-8 text-center">
            <p className="text-slate-400 mb-4">Nenhum departamento encontrado</p>
            {!isFromCompanyPage && (
              <Button
                onClick={handleSeedDepartments}
                disabled={isSeeding}
                variant="outline"
                className="border-amber-600/50 text-amber-400 hover:bg-amber-600/20"
              >
                {isSeeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Criar Departamentos Padrão
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredDepartments.map((department) => {
              const responsibleName = getResponsibleName(department);
              return (
                <Card
                  key={department.id}
                  className="bg-slate-700/50 border-slate-600 p-4 hover:bg-slate-700/70 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {department.name}
                      </h3>
                      <p className="text-sm text-slate-400 mb-2">
                        Empresa: <span className="text-slate-300">{getCompanyName(department.companyId)}</span>
                      </p>
                      {department.description && (
                        <p className="text-sm text-slate-300 mb-2">
                          {department.description}
                        </p>
                      )}
                      {responsibleName && (
                        <p className="text-sm text-slate-400 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Responsável: <span className="text-cyan-300 ml-1">{responsibleName}</span>
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-2">
                        Criado em: {new Date(department.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedDepartment(department);
                          setIsViewOpen(true);
                        }}
                        className="border-slate-600 text-slate-300 hover:bg-slate-600"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenModal(department)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteDepartment(department.id)}
                        className="border-red-600/50 text-red-400 hover:bg-red-600/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? "Editar Departamento" : "Novo Departamento"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div>
              <Label className="text-slate-300">Empresa *</Label>
              <select
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                disabled={!!editingDepartment}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Selecione uma empresa</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-slate-300">Nome do Departamento *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Ex: Recursos Humanos"
              />
            </div>

            <div>
              <Label className="text-slate-300">Descrição</Label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:border-cyan-500"
                placeholder="Descrição do departamento"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-slate-300">Responsável</Label>
              <select
                value={formData.responsibleUserId}
                onChange={(e) => setFormData({ ...formData, responsibleUserId: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:border-cyan-500"
              >
                <option value="">Nenhum responsável selecionado</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Selecione o usuário responsável por este departamento</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSaveDepartment}
                disabled={isSaving}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
              <Button
                onClick={() => setIsModalOpen(false)}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Detalhes do Departamento</DialogTitle>
          </DialogHeader>

          {selectedDepartment && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">Nome</p>
                <p className="text-white font-semibold">{selectedDepartment.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Empresa</p>
                <p className="text-white">{getCompanyName(selectedDepartment.companyId)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Descrição</p>
                <p className="text-white">{selectedDepartment.description || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Responsável</p>
                <p className="text-white">{getResponsibleName(selectedDepartment) || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Criado em</p>
                <p className="text-white">
                  {new Date(selectedDepartment.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Atualizado em</p>
                <p className="text-white">
                  {new Date(selectedDepartment.updatedAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => {
                    setIsViewOpen(false);
                    handleOpenModal(selectedDepartment);
                  }}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  onClick={() => setIsViewOpen(false)}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
