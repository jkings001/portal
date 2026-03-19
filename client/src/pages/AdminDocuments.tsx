import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  FileText,
  Eye,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Upload,
  Link2,
  X,
  FileUp,
  Download,
  Building2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Document {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  groupName: string | null;
  fileUrl: string | null;
  fileKey: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string;
  total_assigned: number;
  total_read: number;
  assigned_departments?: string | null;
}

interface Assignment {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userDepartment?: string;
  status: "pending" | "read" | "acknowledged";
  assignedAt: string;
  readAt: string | null;
}

interface DepartmentAssignment {
  departmentId: number;
  departmentName: string;
  assignedAt: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  department?: string;
}

interface Department {
  id: number;
  name: string;
  description?: string;
  companyId?: number;
}

interface Company {
  id: number;
  name: string;
  cnpj?: string;
  status?: string;
}

type UploadMode = "file" | "url";

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminDocuments() {
  const { currentUser } = useAuth();
  const token = localStorage.getItem("authToken");

  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal de criar/editar (SEM abas - formulário único)
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [uploadMode, setUploadMode] = useState<UploadMode>("file");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    groupName: "",
    fileUrl: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Seleção de usuários e departamentos
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [filteredDepts, setFilteredDepts] = useState<Department[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // Modal de atribuições (visualização)
  const [showAssignments, setShowAssignments] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [deptAssignments, setDeptAssignments] = useState<DepartmentAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const apiHeaders: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/documents", { headers: apiHeaders });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", { headers: apiHeaders });
      if (!res.ok) return;
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch {}
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments", { headers: apiHeaders });
      if (!res.ok) return;
      const data = await res.json();
      const depts = Array.isArray(data) ? data : data.departments || [];
      setDepartments(depts);
    } catch {}
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies", { headers: apiHeaders });
      if (!res.ok) return;
      const data = await res.json();
      const comps = Array.isArray(data) ? data : data.companies || [];
      setCompanies(comps);
    } catch {}
  };

  useEffect(() => {
    fetchDocuments();
    fetchUsers();
    fetchDepartments();
    fetchCompanies();
  }, []);

  // Filtrar departamentos quando empresa é selecionada
  useEffect(() => {
    if (selectedCompanyId) {
      const filtered = departments.filter(d => d.companyId === selectedCompanyId);
      setFilteredDepts(filtered);
    } else {
      setFilteredDepts([]);
    }
  }, [selectedCompanyId, departments]);

  const openCreate = () => {
    setEditingDoc(null);
    setFormData({ title: "", description: "", category: "", groupName: "", fileUrl: "" });
    setSelectedFile(null);
    setUploadMode("file");
    setSelectedUserIds([]);
    setSelectedDeptIds([]);
    setUserSearch("");
    setSelectedCompanyId(null);
    setFilteredDepts([]);
    setShowForm(true);
  };

  const openEdit = async (doc: Document) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title,
      description: doc.description || "",
      category: doc.category || "",
      groupName: doc.groupName || "",
      fileUrl: doc.fileUrl || "",
    });
    setSelectedFile(null);
    setUploadMode(doc.fileKey ? "file" : "url");
    setSelectedUserIds([]);
    setSelectedDeptIds([]);
    setUserSearch("");
    setSelectedCompanyId(null);
    setFilteredDepts([]);
    setShowForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      showFeedback("error", "Título é obrigatório");
      return;
    }

    setUploading(true);
    let newDocId: number | null = null;
    try {
      if (uploadMode === "file" && selectedFile) {
        const fd = new FormData();
        fd.append("file", selectedFile);
        fd.append("title", formData.title);
        fd.append("description", formData.description);
        fd.append("category", formData.category);
        if (formData.groupName) fd.append("groupName", formData.groupName);

        const url = editingDoc
          ? `/api/admin/documents/${editingDoc.id}/upload`
          : "/api/admin/documents/upload";
        const method = editingDoc ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `Erro ${res.status}`);
        }
        const uploadResult = await res.json();
        if (!editingDoc) newDocId = uploadResult.id ?? uploadResult.document?.id ?? null;
        showFeedback("success", editingDoc ? "Documento e arquivo atualizados." : "Documento criado com arquivo.");
      } else {
        const url = editingDoc
          ? `/api/admin/documents/${editingDoc.id}`
          : "/api/admin/documents";
        const method = editingDoc ? "PUT" : "POST";
        const res = await fetch(url, {
          method,
          headers: apiHeaders,
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            category: formData.category,
            groupName: formData.groupName || null,
            fileUrl: uploadMode === "url" ? formData.fileUrl : null,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `Erro ${res.status}`);
        }
        const created = await res.json();
        if (!editingDoc) newDocId = created.id ?? created.document?.id ?? null;
        showFeedback("success", editingDoc ? "Documento atualizado com sucesso." : "Documento criado com sucesso.");
      }

      // Aplicar atribuições pendentes (usuários e departamentos) se for criação
      if (!editingDoc && newDocId) {
        if (selectedUserIds.length > 0) {
          try {
            await fetch(`/api/admin/documents/${newDocId}/assign`, {
              method: "POST",
              headers: apiHeaders,
              body: JSON.stringify({ userIds: selectedUserIds }),
            });
          } catch {}
        }
        if (selectedDeptIds.length > 0) {
          try {
            await fetch(`/api/admin/documents/${newDocId}/assign-department`, {
              method: "POST",
              headers: apiHeaders,
              body: JSON.stringify({ departmentIds: selectedDeptIds }),
            });
          } catch {}
        }
        if (selectedUserIds.length > 0 || selectedDeptIds.length > 0) {
          showFeedback("success", `Documento criado e atribuído a ${selectedUserIds.length} usuário(s) e ${selectedDeptIds.length} departamento(s).`);
        }
      }

      setShowForm(false);
      fetchDocuments();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Deseja remover o documento "${doc.title}"? Esta ação não pode ser desfeita.`))
      return;

    try {
      const res = await fetch(`/api/admin/documents/${doc.id}`, {
        method: "DELETE",
        headers: apiHeaders,
      });
      if (!res.ok) throw new Error("Erro ao deletar");
      showFeedback("success", "Documento removido com sucesso");
      fetchDocuments();
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Feedback */}
      {feedback && (
        <div
          className={`p-3 rounded-md flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-green-500/10 border border-green-500/20 text-green-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm">{feedback.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documentos</h1>
          <p className="text-muted-foreground mt-1">Gerencie documentos e atribuições</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Documento
        </Button>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Nenhum documento cadastrado</div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Atribuições</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{doc.title}</div>
                      {doc.description && (
                        <div className="text-xs text-muted-foreground">{doc.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{doc.category || "—"}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium">{doc.total_assigned}</span> usuário(s)
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Visualizar atribuições */}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Ver atribuições"
                        onClick={() => {
                          setSelectedDoc(doc);
                          setShowAssignments(true);
                        }}
                      >
                        <Users className="w-4 h-4" />
                      </Button>
                      {/* Editar */}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Editar documento"
                        onClick={() => openEdit(doc)}
                      >
                        <Pencil className="w-4 h-4 text-cyan-400" />
                      </Button>
                      {/* Excluir */}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Excluir"
                        onClick={() => handleDelete(doc)}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ─── Modal Criar/Editar (SEM ABAS - formulário único) ─────────────────────────────────── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDoc ? `Editar Documento — ${editingDoc.title}` : "Novo Documento"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Título */}
            <div className="space-y-1">
              <Label htmlFor="doc-title">Título *</Label>
              <Input
                id="doc-title"
                value={formData.title}
                onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Política de Segurança da Informação"
              />
            </div>

            {/* Categoria e Grupo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="doc-category">Categoria</Label>
                <Input
                  id="doc-category"
                  value={formData.category}
                  onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value }))}
                  placeholder="Ex: Política, Contrato"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="doc-group">Grupo / Departamento</Label>
                <Input
                  id="doc-group"
                  value={formData.groupName}
                  onChange={(e) => setFormData((f) => ({ ...f, groupName: e.target.value }))}
                  placeholder="Ex: TI, RH, Financeiro"
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-1">
              <Label htmlFor="doc-desc">Descrição</Label>
              <Textarea
                id="doc-desc"
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                placeholder="Descreva brevemente o conteúdo do documento..."
                rows={2}
              />
            </div>

            {/* Upload de arquivo */}
            <div className="space-y-2">
              <Label>Arquivo do Documento</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUploadMode("file")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md border text-sm transition-colors ${
                    uploadMode === "file"
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                      : "border-border text-muted-foreground hover:border-border/80"
                  }`}
                >
                  <FileUp className="w-4 h-4" />
                  Upload de Arquivo
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("url")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md border text-sm transition-colors ${
                    uploadMode === "url"
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                      : "border-border text-muted-foreground hover:border-border/80"
                  }`}
                >
                  <Link2 className="w-4 h-4" />
                  URL Externa
                </button>
              </div>

              {uploadMode === "file" ? (
                <div className="space-y-2">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-colors"
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-5 h-5 text-cyan-400" />
                          <div className="text-left">
                            <div className="font-medium">{selectedFile.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(selectedFile.size)}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="p-1 rounded hover:bg-muted"
                        >
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Clique para selecionar um arquivo</p>
                        <p className="text-xs mt-1">PDF, Word, Excel, imagens — máx. 20MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <Input
                  value={formData.fileUrl}
                  onChange={(e) => setFormData((f) => ({ ...f, fileUrl: e.target.value }))}
                  placeholder="https://... (link para PDF, Word, etc.)"
                />
              )}
            </div>

            {/* ─── SELEÇÃO DE USUÁRIOS (campo simples) ─── */}
            <div className="space-y-2 pt-4 border-t border-border">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Atribuir a Usuários
              </Label>
              <Input
                placeholder="Buscar usuário por nome ou email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              {userSearch && (
                <div className="max-h-48 overflow-y-auto border border-border rounded-md">
                  {filteredUsers.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">Nenhum usuário encontrado</div>
                  ) : (
                    filteredUsers.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserIds([...selectedUserIds, user.id]);
                            } else {
                              setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              )}
              {selectedUserIds.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedUserIds.map((userId) => {
                    const user = users.find(u => u.id === userId);
                    return user ? (
                      <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                        {user.name}
                        <button
                          type="button"
                          onClick={() => setSelectedUserIds(selectedUserIds.filter(id => id !== userId))}
                          className="ml-1 hover:text-red-400"
                        >
                          ×
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* ─── SELEÇÃO DE DEPARTAMENTOS (com cascata empresa) ─── */}
            <div className="space-y-2 pt-4 border-t border-border">
              <Label className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Atribuir a Departamentos
              </Label>

              {/* Seletor de Empresa */}
              <div className="space-y-1">
                <Label htmlFor="company-select" className="text-xs">Selecione a Empresa</Label>
                <select
                  id="company-select"
                  value={selectedCompanyId || ""}
                  onChange={(e) => setSelectedCompanyId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                >
                  <option value="">— Escolha uma empresa —</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seletor de Departamentos (filtrados por empresa) */}
              {selectedCompanyId && (
                <div className="space-y-1">
                  <Label htmlFor="dept-select" className="text-xs">Departamentos da Empresa</Label>
                  <div className="max-h-48 overflow-y-auto border border-border rounded-md">
                    {filteredDepts.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">Nenhum departamento encontrado</div>
                    ) : (
                      filteredDepts.map((dept) => (
                        <label
                          key={dept.id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b border-border last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDeptIds.includes(dept.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDeptIds([...selectedDeptIds, dept.id]);
                              } else {
                                setSelectedDeptIds(selectedDeptIds.filter(id => id !== dept.id));
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{dept.name}</div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              {selectedDeptIds.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedDeptIds.map((deptId) => {
                    const dept = departments.find(d => d.id === deptId);
                    return dept ? (
                      <Badge key={deptId} variant="secondary" className="flex items-center gap-1">
                        {dept.name}
                        <button
                          type="button"
                          onClick={() => setSelectedDeptIds(selectedDeptIds.filter(id => id !== deptId))}
                          className="ml-1 hover:text-red-400"
                        >
                          ×
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              {editingDoc ? "Cancelar" : "Fechar"}
            </Button>
            <Button onClick={handleSave} disabled={uploading}>
              {uploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-bounce" />
                  Enviando...
                </>
              ) : editingDoc ? (
                "Salvar alterações"
              ) : (
                "Criar documento"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal Atribuições (visualização) ──────────────────────────────────── */}
      <Dialog open={showAssignments} onOpenChange={setShowAssignments}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Atribuições — {selectedDoc?.title}</DialogTitle>
          </DialogHeader>

          {loadingAssignments ? (
            <div className="py-8 text-center text-muted-foreground">Carregando...</div>
          ) : (
            <div className="space-y-4">
              {/* Usuários */}
              <div>
                <h3 className="font-medium mb-2">Usuários Atribuídos</h3>
                {assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum usuário atribuído</p>
                ) : (
                  <div className="space-y-2">
                    {assignments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-2 border border-border rounded">
                        <div>
                          <div className="font-medium text-sm">{a.userName}</div>
                          <div className="text-xs text-muted-foreground">{a.userEmail}</div>
                        </div>
                        <Badge variant={a.status === "read" ? "default" : "secondary"}>
                          {a.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Departamentos */}
              <div className="pt-4 border-t border-border">
                <h3 className="font-medium mb-2">Departamentos Atribuídos</h3>
                {deptAssignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum departamento atribuído</p>
                ) : (
                  <div className="space-y-2">
                    {deptAssignments.map((d) => (
                      <div key={d.departmentId} className="flex items-center justify-between p-2 border border-border rounded">
                        <div className="font-medium text-sm">{d.departmentName}</div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(d.assignedAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
