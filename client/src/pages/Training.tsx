import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import BackButton from "@/components/BackButton";
import { useTrainingToken } from "@/hooks/useTrainingToken";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Search,
  Clock,
  Star,
  Play,
  CheckCircle,
  Award,
  TrendingUp,
  Filter,
  Users,
  Zap,
  GraduationCap,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Training {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  level: "basico" | "intermediario" | "avancado";
  instructor: string;
  total_duration: number;
  is_mandatory: number;
  lesson_count: number;
  avg_rating: number;
  rating_count: number;
  is_completed: number;
  watched_lessons: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<string, string> = {
  basico: "Básico",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

const LEVEL_COLORS: Record<string, string> = {
  basico: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  intermediario: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  avancado: "bg-red-500/20 text-red-400 border-red-500/30",
};

const CATEGORIES = [
  "Todos",
  "Tecnologia",
  "Gestão",
  "Compliance",
  "Segurança",
  "RH",
  "Vendas",
  "Marketing",
  "Financeiro",
  "Qualidade",
];

const PLACEHOLDER_THUMBNAILS = [
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=225&fit=crop",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=225&fit=crop",
  "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=225&fit=crop",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop",
  "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&h=225&fit=crop",
];

function getThumb(training: Training, idx: number) {
  if (training.thumbnail) return training.thumbnail;
  return PLACEHOLDER_THUMBNAILS[idx % PLACEHOLDER_THUMBNAILS.length];
}

function formatDuration(minutes: number) {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h${m > 0 ? ` ${m}min` : ""}`;
  return `${m}min`;
}

// ─── Training Card ────────────────────────────────────────────────────────────

function TrainingCard({
  training,
  index,
  onClick,
}: {
  training: Training;
  index: number;
  onClick: () => void;
}) {
  const progress =
    (Number(training.lesson_count) || 0) > 0
      ? Math.round(((Number(training.watched_lessons) || 0) / Number(training.lesson_count)) * 100)
      : 0;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30"
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden aspect-video">
        <img
          src={getThumb(training, index)}
          alt={training.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              PLACEHOLDER_THUMBNAILS[index % PLACEHOLDER_THUMBNAILS.length];
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-cyan-500/90 flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {training.is_mandatory ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-medium">
              Obrigatório
            </span>
          ) : null}
          <span
            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${LEVEL_COLORS[training.level] || LEVEL_COLORS.basico}`}
          >
            {LEVEL_LABELS[training.level] || training.level}
          </span>
        </div>

        {/* Completed badge */}
        {training.is_completed > 0 && (
          <div className="absolute top-2 right-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          </div>
        )}

        {/* Duration */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-white/80 text-xs bg-black/50 px-2 py-0.5 rounded-full">
          <Clock className="w-3 h-3" />
          {formatDuration(training.total_duration)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {training.category && (
          <p className="text-xs text-cyan-400 font-medium mb-1 uppercase tracking-wide">
            {training.category}
          </p>
        )}
        <h3 className="font-semibold text-white line-clamp-2 mb-1 group-hover:text-cyan-300 transition-colors">
          {training.title}
        </h3>
        {training.instructor && (
          <p className="text-xs text-white/50 mb-3">{training.instructor}</p>
        )}

        {/* Progress bar */}
        {training.watched_lessons > 0 && training.is_completed === 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-white/50 mb-1">
              <span>Em andamento</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5 bg-white/10" />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {training.lesson_count} aulas
            </span>
            {training.avg_rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {(Number(training.avg_rating) || 0).toFixed(1)}
              </span>
            )}
          </div>
          {training.is_completed > 0 ? (
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Concluído
            </span>
          ) : (
            <span className="text-xs text-cyan-400 flex items-center gap-1 group-hover:gap-2 transition-all">
              {training.watched_lessons > 0 ? "Continuar" : "Iniciar"}
              <ChevronRight className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stats Card ───────────────────────────────────────────────────────────────

function StatsCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-white/50">{label}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Training() {
  const [, navigate] = useLocation();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [myProgress, setMyProgress] = useState<{
    inProgress: Training[];
    completed: Training[];
    mandatory: Training[];
  }>({ inProgress: [], completed: [], mandatory: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [level, setLevel] = useState("all");
  const [activeTab, setActiveTab] = useState("todos");
  const [total, setTotal] = useState(0);

  const { token, isAuthenticated: tokenReady } = useTrainingToken();

  const fetchTrainings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category !== "Todos") params.set("category", category);
      if (level !== "all") params.set("level", level);
      params.set("limit", "24");

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/trainings?${params}`, { headers });
      if (!res.ok) throw new Error("Erro ao carregar treinamentos");
      const data = await res.json();
      setTrainings(data.trainings || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar treinamentos");
    } finally {
      setLoading(false);
    }
  }, [search, category, level, token]);

  const fetchMyProgress = useCallback(async () => {
    if (!token || !tokenReady) return; // só busca progresso se autenticado
    try {
      const res = await fetch("/api/trainings/my/progress", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setMyProgress(data);
    } catch {
      // silent
    }
  }, [token]);

  useEffect(() => {
    fetchTrainings();
    fetchMyProgress();
  }, [fetchTrainings, fetchMyProgress]);

  const handleCardClick = (id: number) => {
    navigate(`/treinamentos/${id}`);
  };

  // Stats
  const totalCompleted = myProgress.completed.length;
  const totalInProgress = myProgress.inProgress.length;
  const mandatoryPending = myProgress.mandatory.filter(
    (t: any) => !t.is_completed
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-5">
            <BackButton label="Voltar" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Treinamentos Corporativos
              </h1>
              <p className="text-sm text-white/50">
                Desenvolva suas habilidades e avance na carreira
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={BookOpen}
            label="Disponíveis"
            value={total}
            color="bg-blue-500/20 text-blue-400"
          />
          <StatsCard
            icon={TrendingUp}
            label="Em andamento"
            value={totalInProgress}
            color="bg-amber-500/20 text-amber-400"
          />
          <StatsCard
            icon={Award}
            label="Concluídos"
            value={totalCompleted}
            color="bg-emerald-500/20 text-emerald-400"
          />
          <StatsCard
            icon={Zap}
            label="Obrigatórios pendentes"
            value={mandatoryPending}
            color="bg-red-500/20 text-red-400"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <TabsList className="bg-white/5 border border-white/10 h-auto p-1">
              <TabsTrigger
                value="todos"
                className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-white/60"
              >
                Todos os cursos
              </TabsTrigger>
              <TabsTrigger
                value="andamento"
                className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-white/60"
              >
                Em andamento
                {totalInProgress > 0 && (
                  <span className="ml-1.5 text-xs bg-amber-500 text-white rounded-full px-1.5">
                    {totalInProgress}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="concluidos"
                className="data-[state=active]:bg-cyan-500 data-[state=active]:text-white text-white/60"
              >
                Concluídos
              </TabsTrigger>
              {mandatoryPending > 0 && (
                <TabsTrigger
                  value="obrigatorios"
                  className="data-[state=active]:bg-red-500 data-[state=active]:text-white text-white/60"
                >
                  Obrigatórios
                  <span className="ml-1.5 text-xs bg-red-500 text-white rounded-full px-1.5">
                    {mandatoryPending}
                  </span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Filters (only for "todos" tab) */}
          {activeTab === "todos" && (
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Buscar treinamentos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-cyan-500/50"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-44 bg-white/5 border-white/10 text-white">
                  <Filter className="w-4 h-4 mr-2 text-white/40" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-white hover:bg-white/10">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="w-full sm:w-44 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Nível" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="all" className="text-white hover:bg-white/10">Todos os níveis</SelectItem>
                  <SelectItem value="basico" className="text-white hover:bg-white/10">Básico</SelectItem>
                  <SelectItem value="intermediario" className="text-white hover:bg-white/10">Intermediário</SelectItem>
                  <SelectItem value="avancado" className="text-white hover:bg-white/10">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tab: Todos */}
          <TabsContent value="todos">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden animate-pulse">
                    <div className="aspect-video bg-white/10" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-white/10 rounded w-1/3" />
                      <div className="h-4 bg-white/10 rounded w-full" />
                      <div className="h-3 bg-white/10 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : trainings.length === 0 ? (
              <div className="text-center py-20">
                <GraduationCap className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/50 text-lg">Nenhum treinamento encontrado</p>
                <p className="text-white/30 text-sm mt-1">
                  Tente ajustar os filtros ou aguarde novos cursos
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {trainings.map((t, i) => (
                  <TrainingCard
                    key={t.id}
                    training={t}
                    index={i}
                    onClick={() => handleCardClick(t.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Em andamento */}
          <TabsContent value="andamento">
            {myProgress.inProgress.length === 0 ? (
              <div className="text-center py-20">
                <TrendingUp className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/50 text-lg">Nenhum treinamento em andamento</p>
                <Button
                  onClick={() => setActiveTab("todos")}
                  className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  Explorar cursos
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {myProgress.inProgress.map((t, i) => (
                  <TrainingCard
                    key={t.id}
                    training={t}
                    index={i}
                    onClick={() => handleCardClick(t.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Concluídos */}
          <TabsContent value="concluidos">
            {myProgress.completed.length === 0 ? (
              <div className="text-center py-20">
                <Award className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/50 text-lg">Nenhum treinamento concluído ainda</p>
                <p className="text-white/30 text-sm mt-1">
                  Complete seus primeiros cursos para ganhar certificados
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {myProgress.completed.map((t, i) => (
                  <TrainingCard
                    key={t.id}
                    training={t}
                    index={i}
                    onClick={() => handleCardClick(t.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Obrigatórios */}
          <TabsContent value="obrigatorios">
            {myProgress.mandatory.length === 0 ? (
              <div className="text-center py-20">
                <CheckCircle className="w-16 h-16 text-emerald-400/50 mx-auto mb-4" />
                <p className="text-white/50 text-lg">Todos os obrigatórios concluídos!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {myProgress.mandatory.map((t, i) => (
                  <TrainingCard
                    key={t.id}
                    training={t}
                    index={i}
                    onClick={() => handleCardClick(t.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
}
