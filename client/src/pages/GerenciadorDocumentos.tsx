import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import BackButton from "@/components/BackButton";
import UserMenu from "@/components/UserMenu";
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
  Search,
  RefreshCw,
} from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Document {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  group_name: string | null;
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
}

type UploadMode = "file" | "url";
type EditTab = "info" | "users" | "departments";

// ─── Componente principal ─────────────────────────────────────────────────────

export default function GerenciadorDocumentos() {
  const { currentUser } = useAuth();
  const token = localStorage.getItem("authToken");
  const isAdmin = ["admin", "agente", "manager"].includes(currentUser?.role || "");

  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal de criar/editar (com abas)
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [editTab, setEditTab] = useState<EditTab>("info");
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

  // Atribuição de usuários (dentro do modal de edição)
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [assigningUsers, setAssigningUsers] = useState(false);
  const [assigningAll, setAssigningAll] = useState(false);

  // Atribuição de departamentos (dentro do modal de edição)
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>([]);
  const [assigningDepts, setAssigningDepts] = useState(false);

  // Modal de atribuições (visualização)
  const [showAssignments, setShowAssignments] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [deptAssignments, setDeptAssignments] = useState<DepartmentAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Modal de preview de arquivo
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

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
      showFeedback("error", `Erro ao carregar documentos: ${err.message}`);
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
      setDepartments(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => {
    fetchDocuments();
    if (isAdmin) {
      fetchUsers();
      fetchDepartments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Filtro local ────────────────────────────────────────────────────────────

  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      (doc.description || "").toLowerCase().includes(q) ||
      (doc.category || "").toLowerCase().includes(q) ||
      (doc.group_name || "").toLowerCase().includes(q)
    );
  });

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingDoc(null);
    setFormData({ title: "", description: "", category: "", groupName: "", fileUrl: "" });
    setSelectedFile(null);
    setUploadMode("file");
    setEditTab("info");
    setSelectedUserIds([]);
    setSelectedDeptIds([]);
    setUserSearch("");
    setAssignments([]);
    setDeptAssignments([]);
    setShowForm(true);
  };

  const openEdit = async (doc: Document) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title,
      description: doc.description || "",
      category: doc.category || "",
      groupName: doc.group_name || "",
      fileUrl: doc.fileUrl || "",
    });
    setSelectedFile(null);
    setUploadMode(doc.fileKey ? "file" : "url");
    setEditTab("info");
    setSelectedUserIds([]);
    setSelectedDeptIds([]);
    setUserSearch("");

    // Carregar atribuições existentes
    try {
      const res = await fetch(`/api/admin/documents/${doc.id}/assignments`, {
        headers: apiHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
        setDeptAssignments(data.departmentAssignments || []);
      }
    } catch {}

    setShowForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      showFeedback("error", "Título é obrigatório");
      return;
    }

    setUploading(true);
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
        showFeedback("success", editingDoc ? "Documento atualizado com sucesso." : "Documento criado com sucesso.");
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
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      showFeedback("success", "Documento removido com sucesso.");
      fetchDocuments();
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  // ─── Atribuições de Usuários ─────────────────────────────────────────────────

  const toggleUser = (uid: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleAssignUsers = async () => {
    if (!editingDoc) return;
    if (selectedUserIds.length === 0) {
      showFeedback("error", "Selecione pelo menos um usuário.");
      return;
    }
    setAssigningUsers(true);
    try {
      const res = await fetch(`/api/admin/documents/${editingDoc.id}/assign`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ userIds: selectedUserIds }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      showFeedback("success", data.message);
      setSelectedUserIds([]);
      const res2 = await fetch(`/api/admin/documents/${editingDoc.id}/assignments`, {
        headers: apiHeaders,
      });
      if (res2.ok) {
        const d2 = await res2.json();
        setAssignments(d2.assignments || []);
      }
      fetchDocuments();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setAssigningUsers(false);
    }
  };

  const handleAssignAll = async () => {
    if (!editingDoc) return;
    setAssigningAll(true);
    try {
      const res = await fetch(`/api/admin/documents/${editingDoc.id}/assign-all`, {
        method: "POST",
        headers: apiHeaders,
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      showFeedback("success", data.message);
      const res2 = await fetch(`/api/admin/documents/${editingDoc.id}/assignments`, {
        headers: apiHeaders,
      });
      if (res2.ok) {
        const d2 = await res2.json();
        setAssignments(d2.assignments || []);
      }
      fetchDocuments();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setAssigningAll(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    if (!editingDoc) return;
    try {
      const res = await fetch(
        `/api/admin/documents/${editingDoc.id}/assignments/${assignmentId}`,
        { method: "DELETE", headers: apiHeaders }
      );
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
      showFeedback("success", "Atribuição removida.");
      fetchDocuments();
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  // ─── Atribuições de Departamentos ────────────────────────────────────────────

  const toggleDept = (deptId: number) => {
    setSelectedDeptIds((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const handleAssignDepartments = async () => {
    if (!editingDoc) return;
    if (selectedDeptIds.length === 0) {
      showFeedback("error", "Selecione pelo menos um departamento.");
      return;
    }
    setAssigningDepts(true);
    try {
      const res = await fetch(`/api/admin/documents/${editingDoc.id}/assign-department`, {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ departmentIds: selectedDeptIds }),
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      showFeedback("success", data.message);
      setSelectedDeptIds([]);
      const res2 = await fetch(`/api/admin/documents/${editingDoc.id}/assignments`, {
        headers: apiHeaders,
      });
      if (res2.ok) {
        const d2 = await res2.json();
        setAssignments(d2.assignments || []);
        setDeptAssignments(d2.departmentAssignments || []);
      }
      fetchDocuments();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setAssigningDepts(false);
    }
  };

  const handleRemoveDeptAssignment = async (deptId: number) => {
    if (!editingDoc) return;
    try {
      const res = await fetch(
        `/api/admin/documents/${editingDoc.id}/assign-department/${deptId}`,
        { method: "DELETE", headers: apiHeaders }
      );
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      setDeptAssignments((prev) => prev.filter((d) => d.departmentId !== deptId));
      showFeedback("success", "Atribuição de departamento removida.");
      fetchDocuments();
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  // ─── Modal de Atribuições (visualização) ─────────────────────────────────────

  const openAssignments = async (doc: Document) => {
    setSelectedDoc(doc);
    setShowAssignments(true);
    setLoadingAssignments(true);
    try {
      const res = await fetch(`/api/admin/documents/${doc.id}/assignments`, {
        headers: apiHeaders,
      });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();
      setAssignments(data.assignments || []);
      setDeptAssignments(data.departmentAssignments || []);
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setLoadingAssignments(false);
    }
  };

  // ─── Preview de arquivo ──────────────────────────────────────────────────────

  const openPreview = async (doc: Document) => {
    setPreviewDoc(doc);
    setPreviewUrl(null);
    if (!doc.fileUrl) return;
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/admin/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        redirect: "follow",
      });
      if (res.redirected) {
        setPreviewUrl(res.url);
      } else {
        setPreviewUrl(doc.fileUrl);
      }
    } catch {
      setPreviewUrl(doc.fileUrl);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    if (!doc.fileUrl) return;
    try {
      const res = await fetch(`/api/admin/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = doc.fileName || doc.title;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        return;
      }
    } catch {}
    const a = document.createElement("a");
    a.href = doc.fileUrl;
    a.download = doc.fileName || doc.title;
    a.target = "_blank";
    a.click();
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <FileText className="w-4 h-4" />;
    if (mimeType.includes("pdf")) return <FileText className="w-4 h-4 text-red-400" />;
    if (mimeType.includes("word") || mimeType.includes("document"))
      return <FileText className="w-4 h-4 text-blue-400" />;
    if (mimeType.includes("excel") || mimeType.includes("sheet"))
      return <FileText className="w-4 h-4 text-green-400" />;
    if (mimeType.includes("image")) return <FileText className="w-4 h-4 text-purple-400" />;
    return <FileText className="w-4 h-4" />;
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "acknowledged":
        return <Badge className="bg-green-600 text-white">Confirmado</Badge>;
      case "read":
        return <Badge className="bg-blue-600 text-white">Lido</Badge>;
      default:
        return (
          <Badge variant="outline" className="text-yellow-400 border-yellow-400">
            Pendente
          </Badge>
        );
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.department || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const assignedUserIds = assignments.map((a) => a.userId);
  const assignedDeptIds = deptAssignments.map((d) => d.departmentId);

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(135deg, #0a1929 0%, #0d2137 50%, #0a0e27 100%)" }}
    >
      {/* Header */}
      <header className="glassmorphic border-b border-white/10 px-3 sm:px-6 py-3 sm:py-4 relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <BackButton onClick={() => window.location.href = '/management'} />
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex-shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-white truncate">Documentos e Termos</h1>
                <p className="text-xs text-cyan-400/70 hidden sm:block">Gerencie documentos e atribuições</p>
              </div>
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      {/* Conteúdo */}
      <div className="p-6 space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            feedback.type === "success"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            Documentos e Termos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin
              ? "Gerencie documentos, faça upload de arquivos e atribua-os a usuários e departamentos."
              : "Visualize e baixe os documentos disponíveis."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchDocuments} title="Atualizar">
            <RefreshCw className="w-4 h-4" />
          </Button>
          {isAdmin && (
            <Button onClick={openCreate} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Documento
            </Button>
          )}
        </div>
      </div>

      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por título, descrição, categoria ou grupo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando documentos...</div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">
            {searchQuery
              ? "Nenhum documento encontrado para a busca."
              : "Nenhum documento cadastrado."}
          </p>
          {isAdmin && !searchQuery && (
            <p className="text-sm mt-1">Clique em "Novo Documento" para começar.</p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Categoria / Grupo</TableHead>
                <TableHead>Arquivo</TableHead>
                {isAdmin && (
                  <>
                    <TableHead>Departamentos</TableHead>
                    <TableHead className="text-center">Atribuídos</TableHead>
                    <TableHead className="text-center">Confirmados</TableHead>
                  </>
                )}
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="font-medium">{doc.title}</div>
                    {doc.description && (
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {doc.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {doc.category ? (
                        <Badge variant="secondary">{doc.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                      {doc.group_name && (
                        <div className="flex items-center gap-1 text-xs text-cyan-400">
                          <Building2 className="w-3 h-3" />
                          <span>{doc.group_name}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {doc.fileName ? (
                      <div className="flex items-center gap-1.5">
                        {getFileIcon(doc.mimeType)}
                        <div>
                          <div
                            className="text-xs font-medium line-clamp-1 max-w-[120px]"
                            title={doc.fileName}
                          >
                            {doc.fileName}
                          </div>
                          {doc.fileSize && (
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(doc.fileSize)}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : doc.fileUrl ? (
                      <div className="flex items-center gap-1 text-xs text-cyan-400">
                        <Link2 className="w-3 h-3" />
                        URL externa
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <>
                      <TableCell>
                        {doc.assigned_departments ? (
                          <div className="flex items-center gap-1 text-xs text-purple-400">
                            <Building2 className="w-3 h-3" />
                            <span
                              className="line-clamp-1 max-w-[100px]"
                              title={doc.assigned_departments}
                            >
                              {doc.assigned_departments}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold">{Number(doc.total_assigned) || 0}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-green-400">
                          {Number(doc.total_read) || 0}
                        </span>
                        {Number(doc.total_assigned) > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (
                            {Math.round(
                              (Number(doc.total_read) / Number(doc.total_assigned)) * 100
                            )}
                            %)
                          </span>
                        )}
                      </TableCell>
                    </>
                  )}
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {doc.fileUrl && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Visualizar arquivo"
                            onClick={() => openPreview(doc)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Baixar arquivo"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Ver atribuições"
                            onClick={() => openAssignments(doc)}
                          >
                            <Users className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar documento e atribuições"
                            onClick={() => openEdit(doc)}
                          >
                            <Pencil className="w-4 h-4 text-cyan-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir"
                            onClick={() => handleDelete(doc)}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ─── Modal Criar/Editar (com abas) ─────────────────────────────────── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl w-full bg-[#0d1526] border border-white/10 shadow-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDoc ? `Editar Documento — ${editingDoc.title}` : "Novo Documento"}
            </DialogTitle>
          </DialogHeader>

          {/* Abas */}
          <div className="flex gap-1 border-b border-border pb-0 mb-4">
            {(["info", "users", "departments"] as EditTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setEditTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                  editTab === tab
                    ? "bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-500"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "info" && (
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Informações
                  </span>
                )}
                {tab === "users" && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Usuários
                    {assignments.length > 0 && (
                      <Badge variant="secondary" className="text-xs py-0 px-1.5 ml-1">
                        {assignments.length}
                      </Badge>
                    )}
                  </span>
                )}
                {tab === "departments" && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Departamentos
                    {deptAssignments.length > 0 && (
                      <Badge variant="secondary" className="text-xs py-0 px-1.5 ml-1">
                        {deptAssignments.length}
                      </Badge>
                    )}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Aba: Informações ── */}
          {editTab === "info" && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="doc-title">Título *</Label>
                <Input
                  id="doc-title"
                  value={formData.title}
                  onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Política de Segurança da Informação"
                />
              </div>

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
                  <Label htmlFor="doc-group">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      Grupo / Departamento
                    </span>
                  </Label>
                  <Input
                    id="doc-group"
                    value={formData.groupName}
                    onChange={(e) => setFormData((f) => ({ ...f, groupName: e.target.value }))}
                    placeholder="Ex: TI, RH, Financeiro"
                  />
                </div>
              </div>

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

              {/* Tipo de arquivo */}
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
                    {editingDoc?.fileName && !selectedFile && (
                      <p className="text-xs text-muted-foreground">
                        Arquivo atual:{" "}
                        <span className="text-cyan-400">{editingDoc.fileName}</span>
                        {" "}— selecione um novo arquivo para substituir.
                      </p>
                    )}
                  </div>
                ) : (
                  <Input
                    value={formData.fileUrl}
                    onChange={(e) => setFormData((f) => ({ ...f, fileUrl: e.target.value }))}
                    placeholder="https://... (link para PDF, Word, etc.)"
                  />
                )}
              </div>
            </div>
          )}

          {/* ── Aba: Usuários ── */}
          {editTab === "users" && (
            <div className="space-y-4 py-2">
              {!editingDoc ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Salve o documento primeiro para poder atribuir usuários.
                </p>
              ) : (
                <>
                  {/* Usuários já atribuídos */}
                  {assignments.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-cyan-400" />
                          Usuários atribuídos ({assignments.length})
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {assignments.filter((a) => a.status !== "pending").length} confirmado(s)
                        </span>
                      </div>
                      <div className="max-h-44 overflow-y-auto divide-y divide-border border border-border rounded-md">
                        {assignments.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{a.userName}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {a.userEmail}
                              </div>
                              {a.userDepartment && (
                                <div className="text-xs text-muted-foreground">
                                  {a.userDepartment}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-2 shrink-0">
                              {statusBadge(a.status)}
                              <button
                                type="button"
                                onClick={() => handleRemoveAssignment(a.id)}
                                className="p-1 rounded hover:bg-red-500/10 text-red-400 transition-colors"
                                title="Remover atribuição"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Adicionar novos usuários */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {assignments.length > 0 ? "Adicionar mais usuários" : "Atribuir usuários"}
                    </p>
                    <Input
                      placeholder="Buscar por nome, e-mail ou departamento..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />

                    <div className="max-h-44 overflow-y-auto space-y-1 border border-border rounded-md p-2">
                      {filteredUsers.filter((u) => !assignedUserIds.includes(u.id)).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {assignedUserIds.length === users.length
                            ? "Todos os usuários já foram atribuídos."
                            : "Nenhum usuário encontrado."}
                        </p>
                      ) : (
                        filteredUsers
                          .filter((u) => !assignedUserIds.includes(u.id))
                          .map((u) => (
                            <label
                              key={u.id}
                              className="flex items-center gap-3 p-2 rounded transition-colors cursor-pointer hover:bg-muted"
                            >
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(u.id)}
                                onChange={() => toggleUser(u.id)}
                                className="accent-cyan-500"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{u.name}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {u.email}
                                </div>
                              </div>
                              {u.department && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {u.department}
                                </Badge>
                              )}
                            </label>
                          ))
                      )}
                    </div>

                    {selectedUserIds.length > 0 && (
                      <p className="text-xs text-cyan-400">
                        {selectedUserIds.length} usuário(s) selecionado(s)
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleAssignAll}
                        disabled={assigningAll}
                        className="flex-1"
                      >
                        {assigningAll ? "Atribuindo..." : "Atribuir a todos"}
                      </Button>
                      <Button
                        onClick={handleAssignUsers}
                        disabled={selectedUserIds.length === 0 || assigningUsers}
                        className="flex-1"
                      >
                        {assigningUsers
                          ? "Atribuindo..."
                          : `Atribuir selecionados (${selectedUserIds.length})`}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Aba: Departamentos ── */}
          {editTab === "departments" && (
            <div className="space-y-4 py-2">
              {!editingDoc ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Salve o documento primeiro para poder atribuir departamentos.
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Atribua o documento a um ou mais departamentos. Todos os usuários do departamento
                    receberão o documento automaticamente.
                  </p>

                  <div className="max-h-52 overflow-y-auto space-y-1 border border-border rounded-md p-2">
                    {departments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum departamento cadastrado.
                      </p>
                    ) : (
                      departments.map((dept) => {
                        const alreadyAssigned = assignedDeptIds.includes(dept.id);
                        return (
                          <label
                            key={dept.id}
                            className={`flex items-center gap-3 p-2 rounded transition-colors cursor-pointer ${
                              alreadyAssigned ? "opacity-50 cursor-not-allowed" : "hover:bg-muted"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedDeptIds.includes(dept.id) || alreadyAssigned}
                              disabled={alreadyAssigned}
                              onChange={() => !alreadyAssigned && toggleDept(dept.id)}
                              className="accent-purple-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                                {dept.name}
                              </div>
                              {dept.description && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {dept.description}
                                </div>
                              )}
                            </div>
                            {alreadyAssigned && (
                              <Badge className="bg-purple-600/20 text-purple-400 text-xs shrink-0">
                                Atribuído
                              </Badge>
                            )}
                          </label>
                        );
                      })
                    )}
                  </div>

                  {selectedDeptIds.length > 0 && (
                    <p className="text-xs text-purple-400">
                      {selectedDeptIds.length} departamento(s) selecionado(s)
                    </p>
                  )}

                  <Button
                    onClick={handleAssignDepartments}
                    disabled={selectedDeptIds.length === 0 || assigningDepts}
                    className="w-full"
                  >
                    {assigningDepts
                      ? "Atribuindo..."
                      : `Atribuir a ${selectedDeptIds.length} departamento(s)`}
                  </Button>

                  {/* Departamentos atribuídos */}
                  {deptAssignments.length > 0 && (
                    <div className="border border-border rounded-md overflow-hidden">
                      <div className="px-3 py-2 text-sm font-medium bg-muted/30 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-purple-400" />
                        Departamentos atribuídos ({deptAssignments.length})
                      </div>
                      <div className="divide-y divide-border">
                        {deptAssignments.map((d) => (
                          <div
                            key={d.departmentId}
                            className="flex items-center justify-between px-3 py-2"
                          >
                            <div>
                              <div className="text-sm font-medium">{d.departmentName}</div>
                              <div className="text-xs text-muted-foreground">
                                Atribuído em{" "}
                                {new Date(d.assignedAt).toLocaleDateString("pt-BR")}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDeptAssignment(d.departmentId)}
                              className="p-1 rounded hover:bg-red-500/10 text-red-400 transition-colors"
                              title="Remover atribuição"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={uploading}>
              {editTab === "info" ? "Cancelar" : "Fechar"}
            </Button>
            {editTab === "info" && (
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
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal Atribuições (visualização) ──────────────────────────────── */}
      <Dialog open={showAssignments} onOpenChange={setShowAssignments}>
        <DialogContent className="max-w-3xl w-full bg-[#0d1526] border border-white/10 shadow-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Atribuições — {selectedDoc?.title}</DialogTitle>
          </DialogHeader>

          {loadingAssignments ? (
            <div className="py-8 text-center text-muted-foreground">Carregando...</div>
          ) : (
            <div className="space-y-4">
              {/* Departamentos */}
              {deptAssignments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    Departamentos ({deptAssignments.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {deptAssignments.map((d) => (
                      <Badge
                        key={d.departmentId}
                        className="bg-purple-600/20 text-purple-300 border border-purple-600/30"
                      >
                        {d.departmentName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Usuários */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Usuários ({assignments.length})
                </h3>
                {assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhum usuário atribuído a este documento.
                  </p>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Departamento</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Atribuído em</TableHead>
                          <TableHead>Confirmado em</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignments.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell>
                              <div className="font-medium">{a.userName}</div>
                              <div className="text-xs text-muted-foreground">{a.userEmail}</div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {a.userDepartment || "—"}
                            </TableCell>
                            <TableCell>{statusBadge(a.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(a.assignedAt).toLocaleDateString("pt-BR")}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {a.readAt ? new Date(a.readAt).toLocaleDateString("pt-BR") : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignments(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal de Preview de Arquivo ───────────────────────────────────── */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setPreviewDoc(null)}
          />
          <div
            className="relative z-10 w-full max-w-5xl flex flex-col rounded-2xl overflow-hidden"
            style={{
              maxHeight: "92vh",
              background: "#060F18",
              border: "1px solid rgba(43,222,253,0.14)",
              boxShadow: "0 0 60px rgba(43,222,253,0.07), 0 25px 50px rgba(0,0,0,0.55)",
            }}
          >
            {/* Header do preview */}
            <div
              className="flex items-center justify-between p-4 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(previewDoc.mimeType)}
                <div className="min-w-0">
                  <h3 className="text-white font-bold truncate">{previewDoc.title}</h3>
                  {previewDoc.fileName && (
                    <p className="text-xs text-muted-foreground truncate">
                      {previewDoc.fileName}
                      {previewDoc.fileSize
                        ? ` · ${formatFileSize(previewDoc.fileSize)}`
                        : ""}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                {previewDoc.fileUrl && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Abrir em nova aba"
                      onClick={() => window.open(previewDoc.fileUrl!, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 text-cyan-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Baixar arquivo"
                      onClick={() => handleDownload(previewDoc)}
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" onClick={() => setPreviewDoc(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Conteúdo do preview */}
            <div className="flex-1 overflow-hidden" style={{ minHeight: "300px" }}>
              {loadingPreview ? (
                <div className="flex items-center justify-center h-full py-16">
                  <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              ) : !previewDoc.fileUrl ? (
                <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
                  <FileText className="w-12 h-12 text-muted-foreground opacity-30" />
                  <p className="text-sm text-muted-foreground">
                    Este documento não possui arquivo para visualização.
                  </p>
                  {previewDoc.description && (
                    <p className="text-sm text-center max-w-md px-6 text-muted-foreground">
                      {previewDoc.description}
                    </p>
                  )}
                </div>
              ) : previewDoc.mimeType?.startsWith("image/") ? (
                <div className="flex items-center justify-center h-full p-6">
                  <img
                    src={previewUrl || previewDoc.fileUrl}
                    alt={previewDoc.title}
                    className="max-w-full max-h-[60vh] object-contain rounded-xl"
                  />
                </div>
              ) : (
                <iframe
                  src={`${previewUrl || previewDoc.fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                  className="w-full"
                  style={{ height: "65vh", border: "none" }}
                  title={previewDoc.title}
                />
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
