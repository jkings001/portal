import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  FileSignature,
  FolderOpen,
  Download,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Search,
  ChevronRight,
  FileBadge,
  FileCheck,
  Layers,
  PenLine,
  Stamp,
  Info,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import UserMenu from "@/components/UserMenu";

/* ─── Tipos ─────────────────────────────────────────────────────────────── */
interface SignatureData {
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  department?: string;
  signedAt: string;
  ip: string;
  userAgent?: string;
}

interface Document {
  id: number;
  title: string;
  description?: string;
  category?: string;
  fileUrl?: string;
  fileKey?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  status?: "pending" | "read" | "acknowledged" | "signed";
  assignedAt?: string;
  readAt?: string;
  signedAt?: string;
  signatureIp?: string;
  signatureData?: string; // JSON string
  createdAt?: string;
}

type CategoryKey = "contratos" | "termos" | "outros" | "todos";

interface CategoryConfig {
  key: CategoryKey;
  label: string;
  icon: React.ReactNode;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  keywords: string[];
}

/* ─── Configuração de categorias ─────────────────────────────────────────── */
const CATEGORIES: CategoryConfig[] = [
  {
    key: "todos",
    label: "Todos",
    icon: <Layers className="w-4 h-4" />,
    accentColor: "#2BDEFD",
    borderColor: "rgba(43,222,253,0.35)",
    bgColor: "rgba(43,222,253,0.08)",
    keywords: [],
  },
  {
    key: "contratos",
    label: "Contratos",
    icon: <FileSignature className="w-4 h-4" />,
    accentColor: "#A78BFA",
    borderColor: "rgba(167,139,250,0.35)",
    bgColor: "rgba(167,139,250,0.08)",
    keywords: ["contrato", "contract", "acordo", "agreement", "aditivo", "distrato"],
  },
  {
    key: "termos",
    label: "Termos",
    icon: <FileBadge className="w-4 h-4" />,
    accentColor: "#34D399",
    borderColor: "rgba(52,211,153,0.35)",
    bgColor: "rgba(52,211,153,0.08)",
    keywords: ["termo", "term", "política", "policy", "responsabilidade", "uso", "privacidade", "lgpd", "procedimento"],
  },
  {
    key: "outros",
    label: "Outros",
    icon: <FolderOpen className="w-4 h-4" />,
    accentColor: "#FBB724",
    borderColor: "rgba(251,183,36,0.35)",
    bgColor: "rgba(251,183,36,0.08)",
    keywords: [],
  },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function classifyDocument(doc: Document): CategoryKey {
  const text = `${doc.category || ""} ${doc.title || ""}`.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.key === "todos" || cat.key === "outros") continue;
    if (cat.keywords.some((kw) => text.includes(kw))) return cat.key;
  }
  return "outros";
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getMimeEmoji(mimeType?: string, fileName?: string): string {
  const mime = mimeType || "";
  const ext = (fileName || "").split(".").pop()?.toLowerCase() || "";
  if (mime.includes("pdf") || ext === "pdf") return "📄";
  if (mime.includes("word") || ext === "docx" || ext === "doc") return "📝";
  if (mime.includes("sheet") || ext === "xlsx" || ext === "xls") return "📊";
  if (mime.startsWith("image/")) return "🖼️";
  return "📎";
}

function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function parseSignatureData(raw?: string): SignatureData | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SignatureData;
  } catch {
    return null;
  }
}

/* ─── Componente principal ───────────────────────────────────────────────── */
export default function TermsOfResponsibility() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [acknowledging, setAcknowledging] = useState<number | null>(null);
  const [signing, setSigning] = useState<number | null>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signSuccess, setSignSuccess] = useState<SignatureData | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userDepartment, setUserDepartment] = useState<string>("");

  /* ── Busca documentos via JWT ────────────────────────────────────────── */
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) {
        setError("Sessão expirada. Faça login novamente.");
        setLoading(false);
        return;
      }

      try {
        const stored = localStorage.getItem("user") || localStorage.getItem("currentUser");
        if (stored) {
          const u = JSON.parse(stored);
          setUserName(u.name || u.email || "");
          setUserDepartment(u.department || "");
        }
      } catch (_) {}

      const res = await fetch("/api/documents/my", {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (res.status === 401) {
        setError("Sessão expirada. Faça login novamente.");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Erro ${res.status}`);
      }

      const data = await res.json();
      setDocuments(Array.isArray(data.documents) ? data.documents : []);
    } catch (err) {
      console.error("[Terms] Erro ao buscar documentos:", err);
      setError(err instanceof Error ? err.message : "Erro ao carregar documentos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  /* ── Confirmar leitura (acknowledge) ─────────────────────────────────── */
  const handleAcknowledge = async (docId: number) => {
    setAcknowledging(docId);
    try {
      const res = await fetch(`/api/documents/${docId}/acknowledge`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, status: "acknowledged" as const } : d))
        );
        if (previewDoc?.id === docId) {
          setPreviewDoc((prev) => (prev ? { ...prev, status: "acknowledged" } : null));
        }
      }
    } catch (err) {
      console.error("[Terms] Erro ao confirmar:", err);
    } finally {
      setAcknowledging(null);
    }
  };

  /* ── Assinatura digital ──────────────────────────────────────────────── */
  const handleSign = async (docId: number) => {
    setSigning(docId);
    try {
      const res = await fetch(`/api/documents/${docId}/sign`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const sigData: SignatureData = data.signatureData;
        // Atualizar documento na lista
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === docId
              ? {
                  ...d,
                  status: "signed" as const,
                  signedAt: data.signedAt,
                  signatureData: JSON.stringify(sigData),
                }
              : d
          )
        );
        if (previewDoc?.id === docId) {
          setPreviewDoc((prev) =>
            prev
              ? {
                  ...prev,
                  status: "signed",
                  signedAt: data.signedAt,
                  signatureData: JSON.stringify(sigData),
                }
              : null
          );
        }
        setSignSuccess(sigData);
        setShowSignModal(false);
      } else if (res.status === 409) {
        // Já assinado
        alert("Este documento já foi assinado digitalmente.");
      } else {
        alert(data.error || "Erro ao assinar documento.");
      }
    } catch (err) {
      console.error("[Terms] Erro ao assinar:", err);
      alert("Erro ao processar assinatura. Tente novamente.");
    } finally {
      setSigning(null);
    }
  };

  /* ── Download seguro ─────────────────────────────────────────────────── */
  const handleDownload = async (doc: Document) => {
    if (!doc.fileUrl) return;
    try {
      const res = await fetch(`/api/documents/${doc.id}/download`, {
        headers: getAuthHeaders(),
        credentials: "include",
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

  /* ── Abrir preview com URL segura ────────────────────────────────────── */
  const openPreview = async (doc: Document) => {
    setPreviewDoc(doc);
    setPreviewUrl(null);
    setSignSuccess(null);
    setShowSignModal(false);

    if (!doc.fileUrl) return;

    if (doc.status === "pending") {
      fetch(`/api/documents/${doc.id}/read`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
      }).then(() => {
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id && d.status === "pending" ? { ...d, status: "read" as const } : d))
        );
      }).catch(() => {});
    }

    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/view`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewUrl(data.url || doc.fileUrl);
      } else {
        setPreviewUrl(doc.fileUrl);
      }
    } catch {
      setPreviewUrl(doc.fileUrl);
    } finally {
      setLoadingPreview(false);
    }
  };

  /* ── Filtros ─────────────────────────────────────────────────────────── */
  const filteredDocs = documents.filter((doc) => {
    const matchCat = activeCategory === "todos" || classifyDocument(doc) === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      doc.title.toLowerCase().includes(q) ||
      (doc.description || "").toLowerCase().includes(q) ||
      (doc.category || "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const countBy = (key: CategoryKey) =>
    key === "todos" ? documents.length : documents.filter((d) => classifyDocument(d) === key).length;

  const pendingCount = documents.filter((d) => d.status === "pending").length;
  const signedCount = documents.filter((d) => d.status === "signed").length;

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: "#020810", position: "relative" }}>

      {/* Background particles */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(43,222,253,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(167,139,250,0.03) 0%, transparent 50%)",
        }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
        style={{
          background: "rgba(2,8,16,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex items-center gap-4">
          <BackButton variant="ghost" />
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(43,222,253,0.08)",
                border: "1px solid rgba(43,222,253,0.18)",
              }}
            >
              <FileCheck className="w-4 h-4" style={{ color: "#2BDEFD" }} />
            </div>
            <div>
              <h1
                className="text-white font-bold leading-none"
                style={{ fontFamily: "Poppins, sans-serif", fontSize: "0.95rem" }}
              >
                Meus Documentos
              </h1>
              {userDepartment && (
                <p className="text-xs" style={{ color: "rgba(43,222,253,0.55)", fontFamily: "Inter, sans-serif" }}>
                  {userDepartment}
                </p>
              )}
            </div>
          </div>
        </div>
        <UserMenu />
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative z-10">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total", value: documents.length, color: "#2BDEFD", bg: "rgba(43,222,253,0.06)", border: "rgba(43,222,253,0.14)" },
            { label: "Pendentes", value: pendingCount, color: "#FBB724", bg: "rgba(251,183,36,0.06)", border: "rgba(251,183,36,0.14)" },
            { label: "Assinados", value: signedCount, color: "#34D399", bg: "rgba(52,211,153,0.06)", border: "rgba(52,211,153,0.14)" },
            { label: "Confirmados", value: documents.filter(d => d.status === "acknowledged").length, color: "#A78BFA", bg: "rgba(167,139,250,0.06)", border: "rgba(167,139,250,0.14)" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-4 flex flex-col gap-1"
              style={{ background: stat.bg, border: `1px solid ${stat.border}` }}
            >
              <span className="text-2xl font-bold" style={{ color: stat.color, fontFamily: "Poppins, sans-serif" }}>
                {stat.value}
              </span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)", fontFamily: "Inter, sans-serif" }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-6"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.28)" }} />
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/25"
            style={{ fontFamily: "Inter, sans-serif" }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
              <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.28)" }} />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {CATEGORIES.map((cat) => {
            const count = countBy(cat.key);
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: isActive ? cat.bgColor : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isActive ? cat.borderColor : "rgba(255,255,255,0.07)"}`,
                  color: isActive ? cat.accentColor : "rgba(255,255,255,0.45)",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {cat.icon}
                {cat.label}
                <span
                  className="px-1.5 py-0.5 rounded-full text-xs"
                  style={{
                    background: isActive ? `${cat.accentColor}22` : "rgba(255,255,255,0.06)",
                    color: isActive ? cat.accentColor : "rgba(255,255,255,0.35)",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl animate-pulse"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  height: "172px",
                }}
              />
            ))}
          </div>
        )}

        {/* Erro */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}
            >
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-red-400 text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
              {error}
            </p>
            <button
              onClick={fetchDocuments}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: "rgba(43,222,253,0.08)",
                border: "1px solid rgba(43,222,253,0.22)",
                color: "#2BDEFD",
                fontFamily: "Inter, sans-serif",
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
          </div>
        )}

        {/* Lista vazia */}
        {!loading && !error && filteredDocs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(43,222,253,0.05)", border: "1px solid rgba(43,222,253,0.12)" }}
            >
              <FileText className="w-8 h-8" style={{ color: "rgba(43,222,253,0.35)" }} />
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "Inter, sans-serif" }}>
              {searchQuery
                ? "Nenhum documento encontrado para esta busca."
                : documents.length === 0
                ? "Nenhum documento foi atribuído a você ainda."
                : "Nenhum documento nesta categoria."}
            </p>
          </div>
        )}

        {/* Grid de documentos */}
        {!loading && !error && filteredDocs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => {
              const catKey = classifyDocument(doc);
              const cat = CATEGORIES.find((c) => c.key === catKey) || CATEGORIES[3];
              const isPending = doc.status === "pending";
              const isAcknowledged = doc.status === "acknowledged";
              const isSigned = doc.status === "signed";
              const isRead = doc.status === "read";

              return (
                <div
                  key={doc.id}
                  className="group relative rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 cursor-pointer"
                  style={{
                    background: "rgba(6,15,24,0.85)",
                    border: `1px solid ${
                      isPending
                        ? "rgba(251,183,36,0.22)"
                        : isSigned
                        ? "rgba(52,211,153,0.22)"
                        : isAcknowledged
                        ? "rgba(167,139,250,0.18)"
                        : "rgba(255,255,255,0.07)"
                    }`,
                    backdropFilter: "blur(12px)",
                  }}
                  onClick={() => openPreview(doc)}
                >
                  {/* Glow no hover */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse at top left, ${cat.bgColor}, transparent 70%)`,
                    }}
                  />

                  {/* Topo */}
                  <div className="flex items-start justify-between relative z-10">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{
                        background: cat.bgColor,
                        border: `1px solid ${cat.borderColor}`,
                      }}
                    >
                      {getMimeEmoji(doc.mimeType, doc.fileName)}
                    </div>

                    {/* Badge de status */}
                    {isPending && (
                      <span
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: "rgba(251,183,36,0.1)",
                          border: "1px solid rgba(251,183,36,0.28)",
                          color: "#FBB724",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        <Clock className="w-3 h-3" />
                        Pendente
                      </span>
                    )}
                    {isSigned && (
                      <span
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: "rgba(52,211,153,0.1)",
                          border: "1px solid rgba(52,211,153,0.28)",
                          color: "#34D399",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        <Stamp className="w-3 h-3" />
                        Assinado
                      </span>
                    )}
                    {isAcknowledged && !isSigned && (
                      <span
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: "rgba(167,139,250,0.08)",
                          border: "1px solid rgba(167,139,250,0.22)",
                          color: "#A78BFA",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Confirmado
                      </span>
                    )}
                    {isRead && (
                      <span
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: "rgba(43,222,253,0.07)",
                          border: "1px solid rgba(43,222,253,0.18)",
                          color: "#2BDEFD",
                          fontFamily: "Inter, sans-serif",
                        }}
                      >
                        <Eye className="w-3 h-3" />
                        Lido
                      </span>
                    )}
                  </div>

                  {/* Título e descrição */}
                  <div className="relative z-10 flex-1">
                    <h3
                      className="font-semibold text-white leading-snug mb-1 line-clamp-2"
                      style={{ fontFamily: "Poppins, sans-serif", fontSize: "0.88rem" }}
                    >
                      {doc.title}
                    </h3>
                    {doc.description && (
                      <p
                        className="text-xs line-clamp-2"
                        style={{ color: "rgba(255,255,255,0.38)", fontFamily: "Inter, sans-serif" }}
                      >
                        {doc.description}
                      </p>
                    )}
                    {/* Timestamp de assinatura no card */}
                    {isSigned && doc.signedAt && (
                      <p
                        className="text-xs mt-1.5 flex items-center gap-1"
                        style={{ color: "rgba(52,211,153,0.65)", fontFamily: "Inter, sans-serif" }}
                      >
                        <Stamp className="w-3 h-3" />
                        Assinado em {formatDateTime(doc.signedAt)}
                      </p>
                    )}
                  </div>

                  {/* Rodapé */}
                  <div
                    className="relative z-10 flex items-center justify-between pt-2"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="flex items-center gap-1 text-xs font-medium"
                        style={{ color: cat.accentColor, fontFamily: "Inter, sans-serif" }}
                      >
                        {cat.icon}
                        {doc.category || cat.label}
                      </span>
                      {doc.fileSize ? (
                        <span
                          className="text-xs"
                          style={{ color: "rgba(255,255,255,0.22)", fontFamily: "Inter, sans-serif" }}
                        >
                          · {formatFileSize(doc.fileSize)}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1">
                      {doc.fileUrl && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}
                          className="p-1.5 rounded-lg transition-all hover:bg-white/10"
                          title="Baixar arquivo"
                        >
                          <Download className="w-3.5 h-3.5" style={{ color: "rgba(43,222,253,0.55)" }} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); openPreview(doc); }}
                        className="p-1.5 rounded-lg transition-all hover:bg-white/10"
                        title="Visualizar documento"
                      >
                        <ChevronRight className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.35)" }} />
                      </button>
                    </div>
                  </div>

                  {/* Data */}
                  {doc.assignedAt && (
                    <p
                      className="relative z-10 text-xs"
                      style={{
                        color: "rgba(255,255,255,0.18)",
                        fontFamily: "Inter, sans-serif",
                        marginTop: "-6px",
                      }}
                    >
                      Atribuído em {formatDate(doc.assignedAt)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal de preview ──────────────────────────────────────────────── */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)" }}
            onClick={() => { setPreviewDoc(null); setShowSignModal(false); setSignSuccess(null); }}
          />

          <div
            className="relative z-10 w-full max-w-4xl flex flex-col"
            style={{
              maxHeight: "92vh",
              background: "#060F18",
              border: "1px solid rgba(43,222,253,0.14)",
              borderRadius: "20px",
              boxShadow: "0 0 60px rgba(43,222,253,0.07), 0 25px 50px rgba(0,0,0,0.55)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-5 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{
                    background: "rgba(43,222,253,0.07)",
                    border: "1px solid rgba(43,222,253,0.14)",
                  }}
                >
                  {getMimeEmoji(previewDoc.mimeType, previewDoc.fileName)}
                </div>
                <div className="min-w-0">
                  <h3
                    className="text-white font-bold truncate"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {previewDoc.title}
                  </h3>
                  {previewDoc.fileName && (
                    <p
                      className="text-xs truncate"
                      style={{ color: "rgba(255,255,255,0.32)", fontFamily: "Inter, sans-serif" }}
                    >
                      {previewDoc.fileName}
                      {previewDoc.fileSize ? ` · ${formatFileSize(previewDoc.fileSize)}` : ""}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                {previewDoc.fileUrl && (
                  <>
                    <button
                      onClick={() => window.open(previewUrl || previewDoc.fileUrl!, "_blank")}
                      className="p-2 rounded-xl transition-all hover:bg-white/10"
                      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                      title="Abrir em nova aba"
                    >
                      <ExternalLink className="w-4 h-4 text-cyan-400" />
                    </button>
                    <button
                      onClick={() => handleDownload(previewDoc)}
                      className="p-2 rounded-xl transition-all hover:bg-white/10"
                      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                      title="Baixar arquivo"
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => { setPreviewDoc(null); setShowSignModal(false); setSignSuccess(null); }}
                  className="p-2 rounded-xl transition-all hover:bg-white/10"
                  style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.45)" }} />
                </button>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-hidden" style={{ minHeight: "280px" }}>
              {loadingPreview ? (
                <div className="flex items-center justify-center h-full py-16">
                  <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              ) : !previewDoc.fileUrl ? (
                <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
                  <FileText className="w-12 h-12" style={{ color: "rgba(43,222,253,0.28)" }} />
                  <p
                    className="text-sm"
                    style={{ color: "rgba(255,255,255,0.35)", fontFamily: "Inter, sans-serif" }}
                  >
                    Este documento não possui arquivo para visualização.
                  </p>
                  {previewDoc.description && (
                    <p
                      className="text-sm text-center max-w-md px-6"
                      style={{ color: "rgba(255,255,255,0.55)", fontFamily: "Inter, sans-serif" }}
                    >
                      {previewDoc.description}
                    </p>
                  )}
                </div>
              ) : previewDoc.mimeType?.startsWith("image/") ? (
                <div className="flex items-center justify-center h-full p-6">
                  <img
                    src={previewUrl || previewDoc.fileUrl}
                    alt={previewDoc.title}
                    className="max-w-full max-h-[55vh] object-contain rounded-xl"
                  />
                </div>
              ) : previewUrl ? (
                <iframe
                  src={`${previewUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                  className="w-full"
                  style={{
                    height: "calc(92vh - 200px)",
                    minHeight: "500px",
                    border: "none",
                    background: "#ffffff",
                  }}
                  title={previewDoc.title}
                />
              ) : (
                <div className="flex items-center justify-center h-full py-16">
                  <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Footer do modal */}
            <div
              className="flex-shrink-0"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              {/* Painel de sucesso de assinatura */}
              {signSuccess && (
                <div
                  className="px-5 py-4 flex flex-col gap-2"
                  style={{
                    background: "rgba(52,211,153,0.06)",
                    borderBottom: "1px solid rgba(52,211,153,0.12)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Stamp className="w-5 h-5" style={{ color: "#34D399" }} />
                    <span
                      className="font-bold text-sm"
                      style={{ color: "#34D399", fontFamily: "Poppins, sans-serif" }}
                    >
                      Documento assinado digitalmente com sucesso!
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.35)" }}>Assinante: </span>
                      <span style={{ color: "rgba(255,255,255,0.75)" }}>{signSuccess.userName}</span>
                    </div>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.35)" }}>Data/Hora: </span>
                      <span style={{ color: "rgba(255,255,255,0.75)" }}>{formatDateTime(signSuccess.signedAt)}</span>
                    </div>
                    <div>
                      <span style={{ color: "rgba(255,255,255,0.35)" }}>IP: </span>
                      <span style={{ color: "rgba(255,255,255,0.75)" }}>{signSuccess.ip}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Detalhes da assinatura existente */}
              {previewDoc.status === "signed" && previewDoc.signedAt && !signSuccess && (() => {
                const sig = parseSignatureData(previewDoc.signatureData);
                return (
                  <div
                    className="px-5 py-3 flex flex-col gap-1.5"
                    style={{
                      background: "rgba(52,211,153,0.04)",
                      borderBottom: "1px solid rgba(52,211,153,0.10)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Stamp className="w-4 h-4" style={{ color: "#34D399" }} />
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "#34D399", fontFamily: "Inter, sans-serif" }}
                      >
                        Assinado digitalmente
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ fontFamily: "Inter, sans-serif" }}>
                      <span>
                        <span style={{ color: "rgba(255,255,255,0.35)" }}>Data/Hora: </span>
                        <span style={{ color: "rgba(255,255,255,0.7)" }}>{formatDateTime(previewDoc.signedAt)}</span>
                      </span>
                      {sig?.ip && (
                        <span>
                          <span style={{ color: "rgba(255,255,255,0.35)" }}>IP: </span>
                          <span style={{ color: "rgba(255,255,255,0.7)" }}>{sig.ip}</span>
                        </span>
                      )}
                      {sig?.department && (
                        <span>
                          <span style={{ color: "rgba(255,255,255,0.35)" }}>Depto: </span>
                          <span style={{ color: "rgba(255,255,255,0.7)" }}>{sig.department}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Modal de confirmação de assinatura */}
              {showSignModal && (
                <div
                  className="px-5 py-4 flex flex-col gap-3"
                  style={{
                    background: "rgba(43,222,253,0.04)",
                    borderBottom: "1px solid rgba(43,222,253,0.10)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "rgba(43,222,253,0.1)", border: "1px solid rgba(43,222,253,0.2)" }}
                    >
                      <Info className="w-4 h-4" style={{ color: "#2BDEFD" }} />
                    </div>
                    <div>
                      <p
                        className="text-sm font-semibold text-white mb-1"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      >
                        Confirmar Assinatura Digital
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Inter, sans-serif" }}
                      >
                        Ao assinar, você confirma que leu e compreendeu o conteúdo deste documento.
                        Sua assinatura ficará registrada com seu nome, data, hora e endereço IP.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setShowSignModal(false)}
                      className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.55)",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSign(previewDoc.id)}
                      disabled={signing === previewDoc.id}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-60"
                      style={{
                        background: "linear-gradient(135deg, #34D399, #2BDEFD)",
                        color: "#020810",
                        fontFamily: "Inter, sans-serif",
                        boxShadow: "0 0 20px rgba(52,211,153,0.25)",
                      }}
                    >
                      {signing === previewDoc.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-900/40 border-t-gray-900 rounded-full animate-spin" />
                          Assinando...
                        </>
                      ) : (
                        <>
                          <Stamp className="w-4 h-4" />
                          Confirmar e Assinar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Barra de ações */}
              <div className="flex items-center justify-between p-5">
                <div>
                  {previewDoc.status === "signed" ? (
                    <span
                      className="flex items-center gap-2 text-sm font-semibold"
                      style={{ color: "#34D399", fontFamily: "Inter, sans-serif" }}
                    >
                      <Stamp className="w-4 h-4" />
                      Assinado em {formatDateTime(previewDoc.signedAt)}
                    </span>
                  ) : previewDoc.status === "acknowledged" ? (
                    <span
                      className="flex items-center gap-2 text-sm font-semibold"
                      style={{ color: "#A78BFA", fontFamily: "Inter, sans-serif" }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmado em {formatDate(previewDoc.readAt)}
                    </span>
                  ) : (
                    <span
                      className="text-sm"
                      style={{
                        color: previewDoc.status === "pending" ? "rgba(251,183,36,0.75)" : "rgba(43,222,253,0.65)",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      Leia o documento e assine digitalmente.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Botão Confirmar Leitura (acknowledge) - para documentos não assinados */}
                  {previewDoc.status !== "acknowledged" && previewDoc.status !== "signed" && (
                    <button
                      onClick={() => handleAcknowledge(previewDoc.id)}
                      disabled={acknowledging === previewDoc.id}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-60"
                      style={{
                        background: "rgba(167,139,250,0.08)",
                        border: "1px solid rgba(167,139,250,0.22)",
                        color: "#A78BFA",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {acknowledging === previewDoc.id ? (
                        <div className="w-4 h-4 border-2 border-purple-400/40 border-t-purple-400 rounded-full animate-spin" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                      Confirmar Leitura
                    </button>
                  )}

                  {/* Botão Assinar Digitalmente */}
                  {previewDoc.status !== "signed" && !showSignModal && !signSuccess && (
                    <button
                      onClick={() => setShowSignModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                      style={{
                        background: "linear-gradient(135deg, #2BDEFD, #2BFDBE)",
                        color: "#020810",
                        fontFamily: "Inter, sans-serif",
                        boxShadow: "0 0 20px rgba(43,222,253,0.28)",
                      }}
                    >
                      <PenLine className="w-4 h-4" />
                      Assinar Digitalmente
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
