/**
 * JLX – Classificados Internos
 * Layout baseado no padrão visual de EstacionamentoSolicitar
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import BackButton from "@/components/BackButton";
import {
  Search, Plus, Heart, MessageCircle, Tag, Package,
  ChevronLeft, ChevronRight, Eye, Trash2, X,
  ShoppingBag, RefreshCw, Gift, User, Calendar,
  Upload, Home, Loader2, Pencil, CheckCircle2, Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ─── Constantes ───────────────────────────────────────────────────────────────

const JLX_LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663168635381/2ppvVQqQXicPrS84JQM2bL/jlx-logo2_ed0dbf4f.png";

const CATEGORIES = [
  { value: "todos", label: "Todos", icon: "🏷️" },
  { value: "eletronicos", label: "Eletrônicos", icon: "📱" },
  { value: "livros", label: "Livros", icon: "📚" },
  { value: "informatica", label: "Informática", icon: "💻" },
  { value: "moveis", label: "Móveis", icon: "🪑" },
  { value: "eletrodomesticos", label: "Eletrodomésticos", icon: "🏠" },
  { value: "vestuario", label: "Vestuário", icon: "👕" },
  { value: "infantil", label: "Infantil", icon: "🧸" },
  { value: "imoveis", label: "Imóveis", icon: "🏘️" },
  { value: "esportes", label: "Esportes", icon: "⚽" },
  { value: "outros", label: "Outros", icon: "📦" },
];

const NEGOTIATION_TYPES = [
  { value: "todos", label: "Todos", icon: "🏷️", color: "bg-white/10 text-white/70 border-white/20" },
  { value: "venda", label: "Venda", icon: "🛍️", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  { value: "troca", label: "Troca", icon: "🔄", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { value: "doacao", label: "Doação", icon: "🎁", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  disponivel: { label: "Disponível", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  reservado: { label: "Reservado", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  finalizado: { label: "Finalizado", color: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
};

const CONDITION_LABELS: Record<string, string> = {
  novo: "Novo",
  seminovo: "Seminovo",
  usado: "Usado",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAuthToken() {
  return localStorage.getItem("authToken") || sessionStorage.getItem("authToken") || "";
}

function formatCurrency(value: number | null | undefined) {
  if (!value) return null;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
  return date.toLocaleDateString("pt-BR");
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = getAuthToken();
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

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Listing {
  id: number;
  userId: number;
  title: string;
  description: string;
  category: string;
  negotiationType: "venda" | "troca" | "doacao";
  price: number | null;
  condition_item: "novo" | "seminovo" | "usado";
  status: "disponivel" | "reservado" | "finalizado";
  imageUrl: string | null;
  imageUrl2: string | null;
  imageUrl3: string | null;
  views: number;
  interestCount: number;
  favoriteCount: number;
  userName: string;
  userAvatar: string | null;
  userEmail: string;
  createdAt: string;
}

// ─── Card de Anúncio ──────────────────────────────────────────────────────────

function ListingCard({
  listing,
  onOpen,
}: {
  listing: Listing;
  onOpen: (l: Listing) => void;
}) {
  const typeInfo = NEGOTIATION_TYPES.find((t) => t.value === listing.negotiationType) || NEGOTIATION_TYPES[0];
  const catInfo = CATEGORIES.find((c) => c.value === listing.category) || CATEGORIES[CATEGORIES.length - 1];
  const statusInfo = STATUS_CONFIG[listing.status] || STATUS_CONFIG.disponivel;

  return (
    <button
      type="button"
      className="w-full text-left rounded-2xl border border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/8 transition-all duration-200 overflow-hidden"
      onClick={() => onOpen(listing)}
    >
      {/* Imagem */}
      <div className="relative h-36 bg-white/5 overflow-hidden">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">{catInfo.icon}</span>
          </div>
        )}
        <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${typeInfo.color}`}>
          <span>{typeInfo.icon}</span>
        </div>
        {listing.status !== "disponivel" && (
          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}>
            {statusInfo.label}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-3">
        <h3 className="font-semibold text-white text-xs line-clamp-2 mb-1">
          {listing.title}
        </h3>

        {listing.negotiationType === "venda" && listing.price ? (
          <p className="text-cyan-300 font-bold text-sm mb-1">{formatCurrency(listing.price)}</p>
        ) : listing.negotiationType === "doacao" ? (
          <p className="text-purple-300 font-semibold text-xs mb-1">Gratuito</p>
        ) : (
          <p className="text-blue-300 font-semibold text-xs mb-1">Troca</p>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-white/8">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {listing.userAvatar ? (
              <img src={listing.userAvatar} alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-cyan-700/60 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold" style={{ fontSize: 8 }}>
                  {(listing.userName || "?")[0].toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-xs text-white/40 truncate">{listing.userName || "Anônimo"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/30 text-xs flex-shrink-0">
            <span className="flex items-center gap-0.5"><Eye size={10} />{listing.views}</span>
          </div>
        </div>
        <p className="text-xs text-white/25 mt-1">{timeAgo(listing.createdAt)}</p>
      </div>
    </button>
  );
}

// ─── Modal de Detalhes ────────────────────────────────────────────────────────

function ListingDetailModal({
  listing,
  open,
  onClose,
  currentUserId,
  onDelete,
  onStatusChange,
  onEdit,
}: {
  listing: Listing | null;
  open: boolean;
  onClose: () => void;
  currentUserId: number | null;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  onEdit: (listing: Listing) => void;
}) {
  const [interested, setInterested] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (!listing) return;
    setActiveImg(0);
    const token = getAuthToken();
    if (!token) return;
    fetch(`/api/jlx/listings/${listing.id}/my-status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setInterested(d.interested);
        setFavorited(d.favorited);
      })
      .catch(() => {});
  }, [listing?.id]);

  if (!listing) return null;

  const isOwner = currentUserId === listing.userId;
  const images = [listing.imageUrl, listing.imageUrl2, listing.imageUrl3].filter(Boolean) as string[];
  const typeInfo = NEGOTIATION_TYPES.find((t) => t.value === listing.negotiationType) || NEGOTIATION_TYPES[0];
  const catInfo = CATEGORIES.find((c) => c.value === listing.category) || CATEGORIES[CATEGORIES.length - 1];

  const toggleInterest = async (type: "interesse" | "favorito") => {
    const token = getAuthToken();
    if (!token) { toast.error("Faça login para interagir"); return; }
    try {
      const data = await apiFetch(`/api/jlx/listings/${listing.id}/interest`, {
        method: "POST",
        body: JSON.stringify({ type }),
      });
      if (type === "interesse") setInterested(data.active);
      else setFavorited(data.active);
      toast.success(data.active ? (type === "interesse" ? "Interesse registrado!" : "Favoritado!") : "Removido");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="w-[calc(100vw-1rem)] max-w-lg bg-[#0d1b2a] border border-white/10 text-white p-0 overflow-hidden max-h-[90vh] flex flex-col"
        style={{ borderRadius: 16 }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{listing.title}</DialogTitle>
          <DialogDescription>Detalhes do anúncio</DialogDescription>
        </DialogHeader>

        {/* Header fixo */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-2">
            <img src={JLX_LOGO} alt="JLX" className="h-7 object-contain" />
            <span className="text-white/40 text-xs">Classificados</span>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo com scroll */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Galeria */}
          {images.length > 0 ? (
            <div>
              <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden bg-white/5 mb-2">
                <img src={images[activeImg]} alt="" className="w-full h-full object-contain" />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImg((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-1.5 text-white"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setActiveImg((i) => (i + 1) % images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-1.5 text-white"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 justify-center">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === activeImg ? "border-cyan-400" : "border-white/10"}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-36 bg-white/5 rounded-xl flex items-center justify-center">
              <span className="text-5xl">{catInfo.icon}</span>
            </div>
          )}

          {/* Título + badges */}
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base sm:text-lg font-bold text-white leading-snug flex-1">
              {listing.title}
            </h2>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${typeInfo.color}`}>
                {typeInfo.icon} {typeInfo.label}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-center border ${STATUS_CONFIG[listing.status]?.color}`}>
                {STATUS_CONFIG[listing.status]?.label}
              </span>
            </div>
          </div>

          {/* Preço */}
          {listing.negotiationType === "venda" && listing.price && (
            <p className="text-xl font-bold text-cyan-300">{formatCurrency(listing.price)}</p>
          )}

          {/* Infos em grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Categoria", value: `${catInfo.icon} ${catInfo.label}` },
              { label: "Condição", value: CONDITION_LABELS[listing.condition_item] },
              { label: "Visualizações", value: String(listing.views) },
              { label: "Interesses", value: String(listing.interestCount) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-white/8 bg-white/4 p-2.5">
                <p className="text-white/40 text-xs mb-0.5">{label}</p>
                <p className="text-white/80 text-sm">{value}</p>
              </div>
            ))}
          </div>

          {/* Descrição */}
          {listing.description && (
            <div className="rounded-xl border border-white/8 bg-white/4 p-3">
              <p className="text-white/40 text-xs mb-1.5 font-semibold uppercase tracking-wider">Descrição</p>
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>
          )}

          {/* Anunciante */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-white/4">
            {listing.userAvatar ? (
              <img src={listing.userAvatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-cyan-700/50 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{(listing.userName || "?")[0].toUpperCase()}</span>
              </div>
            )}
            <div>
              <p className="text-white/80 text-sm font-semibold">{listing.userName || "Anônimo"}</p>
              <p className="text-white/40 text-xs flex items-center gap-1">
                <Calendar size={10} /> {new Date(listing.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          {/* Ações */}
          {!isOwner ? (
            <div className="flex gap-2">
              <Button
                onClick={() => toggleInterest("interesse")}
                className={`flex-1 h-10 text-sm ${interested ? "bg-cyan-600 hover:bg-cyan-700" : "bg-white/10 hover:bg-white/15"} text-white border border-white/10`}
              >
                <MessageCircle size={15} className="mr-1.5" />
                {interested ? "Interesse registrado" : "Tenho interesse"}
              </Button>
              <Button
                onClick={() => toggleInterest("favorito")}
                variant="outline"
                size="icon"
                className={`h-10 w-10 border-white/10 flex-shrink-0 ${favorited ? "text-red-400 border-red-500/30" : "text-white/50"}`}
              >
                <Heart size={16} className={favorited ? "fill-red-400" : ""} />
              </Button>
              {listing.userEmail && (
                <Button
                  onClick={() => window.open(`mailto:${listing.userEmail}?subject=Interesse: ${listing.title}`, "_blank")}
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 border-white/10 text-white/50 flex-shrink-0"
                  title="Contatar anunciante"
                >
                  <User size={16} />
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-white/30 text-xs text-center">Seu anúncio — gerencie o status:</p>
              <div className="flex gap-1.5">
                {["disponivel", "reservado", "finalizado"].map((s) => (
                  <button
                    key={s}
                    onClick={() => onStatusChange(listing.id, s)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all border ${
                      listing.status === s
                        ? STATUS_CONFIG[s]?.color
                        : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                    }`}
                  >
                    {STATUS_CONFIG[s]?.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => { onEdit(listing); onClose(); }}
                  className="flex-1 h-9 text-sm bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30"
                >
                  <Pencil size={14} className="mr-1.5" /> Editar
                </Button>
                <Button
                  onClick={() => { onDelete(listing.id); onClose(); }}
                  className="flex-1 h-9 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30"
                >
                  <Trash2 size={14} className="mr-1.5" /> Excluir
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal de Formulário (Novo / Editar) ──────────────────────────────────────

function ListingFormModal({
  open,
  onClose,
  onSaved,
  editingListing,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingListing?: Listing | null;
}) {
  const isEditing = !!editingListing;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "outros",
    negotiationType: "venda",
    price: "",
    condition_item: "usado",
    status: "disponivel",
  });
  const [images, setImages] = useState<string[]>([]);
  const [isNewImage, setIsNewImage] = useState<boolean[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Preencher formulário ao abrir para edição
  useEffect(() => {
    if (open) {
      if (editingListing) {
        setForm({
          title: editingListing.title || "",
          description: editingListing.description || "",
          category: editingListing.category || "outros",
          negotiationType: editingListing.negotiationType || "venda",
          price: editingListing.price ? String(editingListing.price) : "",
          condition_item: editingListing.condition_item || "usado",
          status: editingListing.status || "disponivel",
        });
        const existingImgs = [editingListing.imageUrl, editingListing.imageUrl2, editingListing.imageUrl3].filter(Boolean) as string[];
        setImages(existingImgs);
        setIsNewImage(existingImgs.map(() => false));
      } else {
        setForm({ title: "", description: "", category: "outros", negotiationType: "venda", price: "", condition_item: "usado", status: "disponivel" });
        setImages([]);
        setIsNewImage([]);
      }
    }
  }, [open, editingListing?.id]);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 3 - images.length;
    files.slice(0, remaining).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setImages((prev) => [...prev, result].slice(0, 3));
        setIsNewImage((prev) => [...prev, true].slice(0, 3));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setIsNewImage((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) {
      toast.error("O título é obrigatório");
      return;
    }
    if (!form.category) {
      toast.error("Selecione uma categoria");
      return;
    }
    if (!form.negotiationType) {
      toast.error("Selecione o tipo de negociação");
      return;
    }

    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Você precisa estar logado");

      // Separar imagens novas (base64) das existentes (URLs)
      const newImgs = images.filter((_, i) => isNewImage[i]);

      const body: Record<string, any> = {
        title,
        description: form.description || null,
        category: form.category,
        negotiationType: form.negotiationType,
        price: form.price ? parseFloat(form.price) : null,
        condition_item: form.condition_item,
        status: form.status,
      };

      // Enviar novas imagens como imageData, imageData2, imageData3
      if (newImgs[0]) body.imageData = newImgs[0];
      if (newImgs[1]) body.imageData2 = newImgs[1];
      if (newImgs[2]) body.imageData3 = newImgs[2];

      const url = isEditing ? `/api/jlx/listings/${editingListing!.id}` : "/api/jlx/listings";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${res.status}`);
      }

      toast.success(isEditing ? "Anúncio atualizado!" : "Anúncio publicado com sucesso!");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar anúncio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="w-[calc(100vw-1rem)] max-w-lg bg-[#0d1b2a] border border-white/10 text-white p-0 overflow-hidden max-h-[90vh] flex flex-col"
        style={{ borderRadius: 16 }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{isEditing ? "Editar Anúncio" : "Novo Anúncio"}</DialogTitle>
          <DialogDescription>{isEditing ? "Editar anúncio existente" : "Publicar novo anúncio"}</DialogDescription>
        </DialogHeader>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0">
          <h2 className="text-white font-bold flex items-center gap-2 text-sm">
            {isEditing ? <Pencil size={15} className="text-cyan-400" /> : <Plus size={15} className="text-cyan-400" />}
            {isEditing ? "Editar Anúncio" : "Novo Anúncio"}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Formulário com scroll */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Título */}
          <div>
            <label className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5 block">
              Título *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex: iPhone 12 Pro Max 128GB"
              maxLength={120}
              required
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm placeholder:text-white/25 focus:outline-none focus:border-cyan-500/50 focus:bg-white/8 transition-all"
            />
          </div>

          {/* Tipo de negociação */}
          <div>
            <label className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5 block">
              Tipo de negociação *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {NEGOTIATION_TYPES.filter((t) => t.value !== "todos").map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, negotiationType: t.value }))}
                  className={`relative py-2.5 rounded-xl text-xs font-medium border transition-all flex flex-col items-center gap-1 ${
                    form.negotiationType === t.value
                      ? t.color
                      : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                  }`}
                >
                  {form.negotiationType === t.value && (
                    <CheckCircle2 size={12} className="absolute top-1.5 right-1.5 text-current opacity-70" />
                  )}
                  <span className="text-base">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Categoria + Condição */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5 block">
                Categoria *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 transition-all"
              >
                {CATEGORIES.filter((c) => c.value !== "todos").map((c) => (
                  <option key={c.value} value={c.value} className="bg-[#0d1b2a]">
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5 block">
                Condição *
              </label>
              <select
                value={form.condition_item}
                onChange={(e) => setForm((f) => ({ ...f, condition_item: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 transition-all"
              >
                <option value="novo" className="bg-[#0d1b2a]">Novo</option>
                <option value="seminovo" className="bg-[#0d1b2a]">Seminovo</option>
                <option value="usado" className="bg-[#0d1b2a]">Usado</option>
              </select>
            </div>
          </div>

          {/* Preço (apenas venda) */}
          {form.negotiationType === "venda" && (
            <div>
              <label className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5 block">
                Valor (R$)
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0,00"
                min="0"
                step="0.01"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm placeholder:text-white/25 focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>
          )}

          {/* Status (apenas edição) */}
          {isEditing && (
            <div>
              <label className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5 block">
                Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["disponivel", "reservado", "finalizado"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, status: s }))}
                    className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                      form.status === s
                        ? STATUS_CONFIG[s]?.color
                        : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                    }`}
                  >
                    {STATUS_CONFIG[s]?.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Descrição */}
          <div>
            <label className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5 block">
              Descrição
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descreva o item, estado de conservação, motivo da venda..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm placeholder:text-white/25 focus:outline-none focus:border-cyan-500/50 transition-all resize-none"
            />
          </div>

          {/* Fotos */}
          <div>
            <label className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1.5 block">
              Fotos (até 3)
            </label>
            <div className="flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  {isNewImage[i] && (
                    <div className="absolute bottom-0 left-0 right-0 bg-cyan-500/80 text-white text-xs text-center py-0.5" style={{ fontSize: 9 }}>
                      Nova
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-black/80 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center text-white/30 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                >
                  <Upload size={18} />
                  <span className="text-xs mt-1">Foto</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImage} />
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-1 pb-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-cyan-600 hover:bg-cyan-700 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> {isEditing ? "Salvando..." : "Publicando..."}</>
              ) : (
                isEditing ? "Salvar alterações" : "Publicar Anúncio"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Painel Meus Anúncios ─────────────────────────────────────────────────────

function MyListingsPanel({
  open,
  onClose,
  listings,
  onView,
  onEdit,
  onDelete,
  onNew,
}: {
  open: boolean;
  onClose: () => void;
  listings: Listing[];
  onView: (l: Listing) => void;
  onEdit: (l: Listing) => void;
  onDelete: (id: number) => void;
  onNew: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="w-[calc(100vw-1rem)] max-w-lg bg-[#0d1b2a] border border-white/10 text-white p-0 overflow-hidden max-h-[85vh] flex flex-col"
        style={{ borderRadius: 16 }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Meus Anúncios</DialogTitle>
          <DialogDescription>Gerenciar seus anúncios</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0">
          <h2 className="text-white font-bold flex items-center gap-2 text-sm">
            <Package size={15} className="text-cyan-400" /> Meus Anúncios
            {listings.length > 0 && (
              <span className="bg-cyan-500/20 text-cyan-300 text-xs font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                {listings.length}
              </span>
            )}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {listings.length === 0 ? (
            <div className="text-center py-12">
              <Package size={40} className="text-white/15 mx-auto mb-3" />
              <p className="text-white/40 text-sm">Você ainda não tem anúncios</p>
              <button
                onClick={() => { onClose(); onNew(); }}
                className="mt-4 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus size={14} /> Criar primeiro anúncio
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {listings.map((l) => {
                const typeInfo = NEGOTIATION_TYPES.find((t) => t.value === l.negotiationType) || NEGOTIATION_TYPES[0];
                const catInfo = CATEGORIES.find((c) => c.value === l.category) || CATEGORIES[CATEGORIES.length - 1];
                return (
                  <div
                    key={l.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-white/4"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                      {l.imageUrl ? (
                        <img src={l.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">
                          {catInfo.icon}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/80 text-sm font-medium truncate">{l.title}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${STATUS_CONFIG[l.status]?.color}`}>
                          {STATUS_CONFIG[l.status]?.label}
                        </span>
                      </div>
                      <p className="text-white/25 text-xs mt-0.5">
                        <Eye size={9} className="inline mr-0.5" />{l.views} views
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        onClick={() => { onView(l); onClose(); }}
                        className="p-1.5 text-white/30 hover:text-cyan-400 transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => { onEdit(l); onClose(); }}
                        className="p-1.5 text-white/30 hover:text-cyan-400 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(l.id)}
                        className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Página Principal JLX ─────────────────────────────────────────────────────

export default function JLX() {
  const [, setLocation] = useLocation();
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("todos");
  const [negotiationType, setNegotiationType] = useState("todos");
  const [page, setPage] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Modais
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [showMyListings, setShowMyListings] = useState(false);
  const [myListings, setMyListings] = useState<Listing[]>([]);

  const LIMIT = 12;

  // Carregar usuário logado
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setCurrentUserId(d.id || null))
      .catch(() => {});
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        ...(search && { search }),
        ...(category !== "todos" && { category }),
        ...(negotiationType !== "todos" && { negotiationType }),
      });
      const token = getAuthToken();
      const res = await fetch(`/api/jlx/listings?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setListings(data.listings || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      toast.error(`Erro ao carregar anúncios: ${err?.message || "Tente novamente"}`);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, negotiationType]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const fetchMyListings = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch("/api/jlx/listings/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMyListings(Array.isArray(data) ? data : []);
    } catch {}
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Deseja excluir este anúncio? Esta ação não pode ser desfeita.")) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/jlx/listings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao excluir");
      toast.success("Anúncio excluído");
      fetchListings();
      fetchMyListings();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    const token = getAuthToken();
    try {
      await apiFetch(`/api/jlx/listings/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      toast.success(`Status: ${STATUS_CONFIG[status]?.label}`);
      fetchListings();
      fetchMyListings();
      setSelectedListing((prev) => prev && prev.id === id ? { ...prev, status: status as any } : prev);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openListing = (l: Listing) => {
    setSelectedListing(l);
    setShowDetail(true);
  };

  const openEdit = (l: Listing) => {
    setEditingListing(l);
    setShowDetail(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #0a0e27 0%, #1e3a5f 50%, #0a0e27 100%)" }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 pb-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <BackButton variant="ghost" />

          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center overflow-hidden">
              <img src={JLX_LOGO} alt="JLX" className="w-8 sm:w-10 object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-2xl font-bold text-white leading-tight truncate">
                Classificados Internos
              </h1>
              <p className="text-white/40 text-xs hidden sm:block">Venda, troque ou doe para seus colegas</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowMyListings(true); fetchMyListings(); }}
              className="text-white/40 hover:text-white h-9 px-2 gap-1.5 text-xs"
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Meus Anúncios</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setShowNewForm(true)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white h-9 px-3 gap-1.5 text-xs"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Anunciar</span>
            </Button>
          </div>
        </div>

        {/* ── Busca ───────────────────────────────────────────────────────── */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar anúncios..."
              className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm placeholder:text-white/25 focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors shrink-0"
          >
            Buscar
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
              className="px-3 py-2.5 bg-white/5 border border-white/10 text-white/50 hover:text-white rounded-xl transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          )}
        </form>

        {/* ── Filtros tipo de negociação ───────────────────────────────────── */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {NEGOTIATION_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => { setNegotiationType(t.value); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                negotiationType === t.value
                  ? t.color
                  : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Filtros categoria (scroll horizontal) ───────────────────────── */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => { setCategory(c.value); setPage(1); }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all whitespace-nowrap ${
                category === c.value
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                  : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
              }`}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* ── Contador ────────────────────────────────────────────────────── */}
        <div className="mb-4">
          <p className="text-white/30 text-xs">
            {loading ? "Carregando..." : `${total} anúncio${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* ── Grid de anúncios ────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/8 bg-white/4 h-52 animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-white/8 bg-white/3">
            <Package size={44} className="text-white/15 mx-auto mb-4" />
            <p className="text-white/40 text-base font-medium">Nenhum anúncio encontrado</p>
            <p className="text-white/25 text-sm mb-6">Seja o primeiro a anunciar!</p>
            <button
              onClick={() => setShowNewForm(true)}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus size={15} /> Criar anúncio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} onOpen={openListing} />
            ))}
          </div>
        )}

        {/* ── Paginação ───────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-white/50 hover:text-white h-9 w-9 p-0"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-white/40 text-sm">{page} / {totalPages}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-white/50 hover:text-white h-9 w-9 p-0"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
      </div>

      {/* ── Modal de detalhes ─────────────────────────────────────────────── */}
      <ListingDetailModal
        listing={selectedListing}
        open={showDetail}
        onClose={() => setShowDetail(false)}
        currentUserId={currentUserId}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onEdit={openEdit}
      />

      {/* ── Modal novo anúncio ────────────────────────────────────────────── */}
      <ListingFormModal
        open={showNewForm}
        onClose={() => setShowNewForm(false)}
        onSaved={fetchListings}
      />

      {/* ── Modal editar anúncio ──────────────────────────────────────────── */}
      <ListingFormModal
        open={!!editingListing}
        onClose={() => setEditingListing(null)}
        onSaved={() => { fetchListings(); fetchMyListings(); }}
        editingListing={editingListing}
      />

      {/* ── Painel Meus Anúncios ──────────────────────────────────────────── */}
      <MyListingsPanel
        open={showMyListings}
        onClose={() => setShowMyListings(false)}
        listings={myListings}
        onView={openListing}
        onEdit={openEdit}
        onDelete={handleDelete}
        onNew={() => setShowNewForm(true)}
      />
    </div>
  );
}
