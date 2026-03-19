import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Eye, Loader2, AlertCircle, Building2, Layers, Users, FolderOpen, Ticket } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useLocation } from "wouter";

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

export default function Companies() {
  const [location, setLocation] = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    maxLicenses: 10,
    status: "ativa" as "ativa" | "inativa" | "suspensa",
  });

  // Mock current user (same as AdminServer.tsx)
  const [currentUser] = useState({ role: 'admin', name: 'Admin' });



  // Load companies from API on component mount
  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      setError("");
      console.log('[Companies] Iniciando carregamento de empresas...');
      const response = await fetch("/api/companies");
      console.log('[Companies] Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('[Companies] Dados carregados:', data);
        setCompanies(data);
      } else if (response.status === 503) {
        const errorData = await response.json();
        console.error('[Companies] Database connection error:', errorData);
        setError("Banco de dados indisponivel. Tente novamente em alguns momentos.");
      } else {
        const errorData = await response.json();
        console.error('[Companies] Response nao OK:', response.status, errorData);
        setError(errorData?.error || "Falha ao carregar empresas");
      }
    } catch (err) {
      console.error("Erro ao carregar empresas:", err);
      setError("Falha ao carregar empresas. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name,
        cnpj: company.cnpj,
        email: company.email || "",
        phone: company.phone || "",
        address: company.address || "",
        city: company.city || "",
        state: company.state || "",
        zipCode: company.zipCode || "",
        maxLicenses: company.maxLicenses,
        status: company.status,
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: "",
        cnpj: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        maxLicenses: 10,
        status: "ativa",
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveCompany = async () => {
    if (!formData.name || !formData.cnpj) {
      setError("Nome e CNPJ são obrigatórios");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      const method = editingCompany ? "PUT" : "POST";
      const url = editingCompany
        ? `/api/companies/${editingCompany.id}`
        : "/api/companies";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || `Erro ${response.status}: ${response.statusText}`);
      }

      setSuccessMessage(
        editingCompany
          ? "Empresa atualizada com sucesso!"
          : "Empresa criada com sucesso!"
      );
      setTimeout(() => setSuccessMessage(""), 3000);
      setIsModalOpen(false);
      await loadCompanies();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(`Falha ao salvar empresa: ${errorMessage}`);
      console.error("Erro ao salvar empresa:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCompany = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar esta empresa?")) return;

    try {
      setError("");
      const response = await fetch(`/api/companies/${id}`, { method: "DELETE" });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || `Erro ${response.status}: ${response.statusText}`);
      }

      setSuccessMessage("Empresa deletada com sucesso!");
      setTimeout(() => setSuccessMessage(""), 3000);
      await loadCompanies();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(`Falha ao deletar empresa: ${errorMessage}`);
      console.error("Erro ao deletar empresa:", err);
    }
  };

  const handleBack = () => {
    setLocation('/management');
  };

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.cnpj.includes(searchTerm);
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BackButton to="/management" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl md:text-4xl font-bold text-white">
              Gerenciamento de Empresas
            </h1>
          </div>
          <p className="text-slate-400">
            Gerencie as empresas cadastradas no sistema
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-300">Erro</p>
              <p className="text-sm text-red-200">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <p className="text-green-300">{successMessage}</p>
          </div>
        )}

        {/* Search and Add */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
            />
          </div>
          <Button
            onClick={() => handleOpenModal()}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Empresa
          </Button>
        </div>

        {/* Companies List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : filteredCompanies.length === 0 ? (
          <Card className="bg-slate-700/50 border-slate-600 p-8 text-center">
            <p className="text-slate-400">Nenhuma empresa encontrada</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredCompanies.map((company) => (
              <Card
                key={company.id}
                className="bg-slate-700/50 border-slate-600 p-4 hover:bg-slate-700/70 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {company.name}
                    </h3>
                    <p className="text-sm text-slate-400 mb-2">CNPJ: {company.cnpj}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                      {company.email && <span>📧 {company.email}</span>}
                      {company.phone && <span>📱 {company.phone}</span>}
                      {company.city && <span>📍 {company.city}, {company.state}</span>}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        company.status === "ativa"
                          ? "bg-green-500/20 text-green-300"
                          : company.status === "inativa"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-red-500/20 text-red-300"
                      }`}>
                        {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setLocation(`/admin/departments?company=${company.id}`);
                      }}
                      className="border-cyan-600/50 text-cyan-400 hover:bg-cyan-600/20"
                      title="Ver departamentos desta empresa"
                    >
                      <Layers className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setLocation(`/company-details?id=${company.id}`);
                      }}
                      className="border-slate-600 text-slate-300 hover:bg-slate-600"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenModal(company)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCompany(company.id)}
                      className="border-red-600/50 text-red-400 hover:bg-red-600/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCompany ? "Editar Empresa" : "Nova Empresa"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Nome *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Nome da empresa"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">CNPJ *</Label>
                  <Input
                    value={formData.cnpj}
                    onChange={(e) =>
                      setFormData({ ...formData, cnpj: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="XX.XXX.XXX/0001-XX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="(11) 98765-4321"
                  />
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Endereço</Label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="Rua, número"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-slate-300">Cidade</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="São Paulo"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Estado</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label className="text-slate-300">CEP</Label>
                  <Input
                    value={formData.zipCode}
                    onChange={(e) =>
                      setFormData({ ...formData, zipCode: e.target.value })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="12345-678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Máx. Licenças</Label>
                  <Input
                    type="number"
                    value={formData.maxLicenses}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxLicenses: parseInt(e.target.value) || 10,
                      })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                    min="1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Status</Label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as "ativa" | "inativa" | "suspensa",
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded"
                  >
                    <option value="ativa">Ativa</option>
                    <option value="inativa">Inativa</option>
                    <option value="suspensa">Suspensa</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveCompany}
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


      </div>
    </div>
  );
}
