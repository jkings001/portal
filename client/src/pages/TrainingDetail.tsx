import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useTrainingToken } from "@/hooks/useTrainingToken";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Play,
  CheckCircle,
  Clock,
  Star,
  ThumbsUp,
  MessageSquare,
  Award,
  BookOpen,
  Lock,
  Send,
  Trash2,
  AlertCircle,
  GraduationCap,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Lesson {
  id: number;
  training_id: number;
  title: string;
  description: string;
  video_url: string;
  duration: number;
  order_index: number;
  materials: string | null;
  watched: number;
}

interface Training {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  level: string;
  instructor: string;
  total_duration: number;
  is_mandatory: number;
  lesson_count: number;
}

interface Stats {
  avgRating: string;
  totalRatings: number;
  totalLikes: number;
  totalComments: number;
  userRating: number | null;
  userLiked: boolean;
}

interface Comment {
  id: number;
  content: string;
  userName: string;
  userAvatar: string;
  created_at: string;
  user_id: number;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  order_index: number;
}

interface QuizResult {
  score: number;
  passed: boolean;
  minScore: number;
  correct: number;
  total: number;
  results: { questionId: number; selected: number; correct: number; isCorrect: boolean }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(minutes: number) {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h${m > 0 ? ` ${m}min` : ""}`;
  return `${m}min`;
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    const origin = typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : '';
    return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1&enablejsapi=1&origin=${origin}`;
  }
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  // Direct video URL
  if (url.match(/\.(mp4|webm|ogg)$/i)) return url;
  return url;
}

function isDirectVideo(url: string) {
  return url?.match(/\.(mp4|webm|ogg)$/i);
}

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`transition-transform ${!readonly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              star <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "text-white/20"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Quiz Component ───────────────────────────────────────────────────────────

function QuizSection({
  trainingId,
  token,
  onPassed,
}: {
  trainingId: number;
  token: string;
  onPassed: () => void;
}) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [minScore, setMinScore] = useState(70);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/trainings/${trainingId}/quiz`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data.questions || []);
        setMinScore(data.quiz?.min_score || 70);
      })
      .finally(() => setLoading(false));
  }, [trainingId, token]);

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error("Responda todas as perguntas antes de enviar");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/trainings/${trainingId}/quiz/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      setResult(data);
      if (data.passed) {
        toast.success(`Parabéns! Você foi aprovado com ${data.score}%!`);
        onPassed();
      } else {
        toast.error(`Você não atingiu a pontuação mínima (${data.minScore}%). Tente novamente.`);
      }
    } catch {
      toast.error("Erro ao enviar respostas");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-8 text-white/50">Carregando quiz...</div>
    );

  if (questions.length === 0)
    return (
      <div className="text-center py-8">
        <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/50">Nenhum quiz disponível para este treinamento</p>
      </div>
    );

  if (result) {
    return (
      <div className="space-y-6">
        {/* Result Banner */}
        <div
          className={`rounded-xl p-6 text-center border ${
            result.passed
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}
        >
          {result.passed ? (
            <Award className="w-16 h-16 text-emerald-400 mx-auto mb-3" />
          ) : (
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-3" />
          )}
          <h3 className="text-2xl font-bold text-white mb-1">
            {result.passed ? "Aprovado!" : "Não aprovado"}
          </h3>
          <p className="text-white/60 mb-4">
            Você acertou {result.correct} de {result.total} questões
          </p>
          <div className="text-4xl font-bold text-white mb-2">{result.score}%</div>
          <p className="text-sm text-white/40">
            Pontuação mínima: {result.minScore}%
          </p>
        </div>

        {/* Question review */}
        <div className="space-y-4">
          {questions.map((q, qi) => {
            const r = result.results.find((r) => r.questionId === q.id);
            return (
              <div
                key={q.id}
                className={`rounded-lg p-4 border ${
                  r?.isCorrect
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-red-500/5 border-red-500/20"
                }`}
              >
                <p className="text-white font-medium mb-3">
                  {qi + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <div
                      key={oi}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        oi === r?.correct
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : oi === r?.selected && !r?.isCorrect
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : "text-white/50"
                      }`}
                    >
                      {opt}
                      {oi === r?.correct && (
                        <span className="ml-2 text-xs text-emerald-400">✓ Correta</span>
                      )}
                      {oi === r?.selected && !r?.isCorrect && (
                        <span className="ml-2 text-xs text-red-400">✗ Sua resposta</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {!result.passed && (
          <Button
            onClick={() => {
              setResult(null);
              setAnswers({});
            }}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-white/60 text-sm">
          {questions.length} questões · Mínimo para aprovação: {minScore}%
        </p>
        <span className="text-sm text-white/40">
          {Object.keys(answers).length}/{questions.length} respondidas
        </span>
      </div>

      {questions.map((q, qi) => (
        <div key={q.id} className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-white font-medium mb-4">
            {qi + 1}. {q.question}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                type="button"
                onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all border ${
                  answers[q.id] === oi
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                    : "border-white/10 text-white/70 hover:bg-white/5 hover:border-white/20"
                }`}
              >
                <span className="font-medium mr-2 text-white/40">
                  {String.fromCharCode(65 + oi)}.
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}

      <Button
        onClick={handleSubmit}
        disabled={submitting || Object.keys(answers).length < questions.length}
        className="w-full bg-cyan-500 hover:bg-cyan-600 text-white h-12 text-base font-semibold"
      >
        {submitting ? "Enviando..." : "Enviar respostas"}
      </Button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TrainingDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const trainingId = parseInt(params.id);

  const { token, userId: tokenUserId, isAuthenticated } = useTrainingToken();

  const [data, setData] = useState<{
    training: Training;
    lessons: Lesson[];
    stats: Stats;
    completion: any;
    progress: number;
    watchedCount: number;
    totalLessons: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<"aulas" | "quiz" | "comentarios">("aulas");
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load user ID — sincroniza com o token unificado
  useEffect(() => {
    if (tokenUserId) {
      setCurrentUserId(tokenUserId);
      return;
    }
    const user = localStorage.getItem("currentUser");
    if (user) {
      try {
        setCurrentUserId(JSON.parse(user).id);
      } catch {}
    }
  }, [tokenUserId]);

  // Helpers para montar headers com token opcional
  const authHeaders = (extra?: Record<string, string>) => {
    const h: Record<string, string> = { ...(extra || {}) };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  };

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trainings/${trainingId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Treinamento não encontrado");
      const d = await res.json();
      setData(d);
      setUserRating(d.stats?.userRating || 0);
      setUserLiked(d.stats?.userLiked || false);
      // Set first unwatched lesson as active
      const firstUnwatched = d.lessons.find((l: Lesson) => !l.watched);
      setActiveLesson(firstUnwatched || d.lessons[0] || null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingId, token]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/trainings/${trainingId}/comments`, {
        headers: authHeaders(),
      });
      if (res.ok) setComments(await res.json());
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingId, token]);

  useEffect(() => {
    fetchDetail();
    fetchComments();
  }, [fetchDetail, fetchComments]);

  const handleMarkWatched = async (lesson: Lesson) => {
    if (lesson.watched || !token) return; // só registra progresso se autenticado
    try {
      await fetch(`/api/trainings/${trainingId}/lessons/${lesson.id}/watch`, {
        method: "POST",
        headers: authHeaders(),
      });
      fetchDetail();
    } catch {}
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    handleMarkWatched(lesson);
  };

  const handleRate = async (stars: number) => {
    if (!token) { toast.error("Faça login para avaliar"); return; }
    setUserRating(stars);
    try {
      await fetch(`/api/trainings/${trainingId}/rate`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ stars }),
      });
      toast.success("Avaliação registrada!");
      fetchDetail();
    } catch {
      toast.error("Erro ao avaliar");
    }
  };

  const handleLike = async () => {
    if (!token) { toast.error("Faça login para curtir"); return; }
    const newLiked = !userLiked;
    setUserLiked(newLiked);
    try {
      await fetch(`/api/trainings/${trainingId}/rate`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ liked: newLiked }),
      });
      fetchDetail();
    } catch {}
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    if (!token) { toast.error("Faça login para comentar"); return; }
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/trainings/${trainingId}/comments`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (!res.ok) throw new Error("Erro ao comentar");
      const comment = await res.json();
      setComments((prev) => [comment, ...prev]);
      setNewComment("");
      toast.success("Comentário adicionado!");
    } catch {
      toast.error("Erro ao adicionar comentário");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!token) return;
    try {
      await fetch(`/api/trainings/${trainingId}/comments/${commentId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      toast.error("Erro ao excluir comentário");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/50">Carregando treinamento...</p>
          </div>
        </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <p className="text-white text-lg">Treinamento não encontrado</p>
            <Button
              onClick={() => navigate("/dashboard")}
              className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
    );
  }

  const { training, lessons, stats, completion, progress, watchedCount, totalLessons } = data;
  const embedUrl = activeLesson ? getEmbedUrl(activeLesson.video_url) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-semibold truncate">{training.title}</h1>
            {training.instructor && (
              <p className="text-xs text-white/40">{training.instructor}</p>
            )}
          </div>
          {completion?.quiz_passed && (
            <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Concluído</span>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(100vh-57px)]">
          {/* ── Main content ── */}
          <div className="flex-1 overflow-y-auto">
            {/* Video Player */}
            <div className="bg-black aspect-video w-full relative">
              {activeLesson ? (
                embedUrl ? (
                  isDirectVideo(activeLesson.video_url) ? (
                    <video
                      ref={videoRef}
                      src={embedUrl}
                      controls
                      className="w-full h-full"
                      onEnded={() => handleMarkWatched(activeLesson)}
                    />
                  ) : (
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      title={activeLesson.title}
                      referrerPolicy="strict-origin-when-cross-origin"
                      sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-forms"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/30">
                    <Play className="w-20 h-20 mb-4 opacity-30" />
                    <p className="text-lg">Nenhum vídeo disponível</p>
                    <p className="text-sm mt-1">Esta aula não possui vídeo cadastrado</p>
                  </div>
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/30">
                  <GraduationCap className="w-20 h-20 mb-4 opacity-30" />
                  <p className="text-lg">Selecione uma aula</p>
                </div>
              )}
            </div>

            {/* Lesson info */}
            {activeLesson && (
              <div className="p-5 border-b border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">
                      {activeLesson.title}
                    </h2>
                    {activeLesson.description && (
                      <p className="text-white/50 text-sm">{activeLesson.description}</p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleMarkWatched(activeLesson)}
                    disabled={!!activeLesson.watched}
                    size="sm"
                    className={
                      activeLesson.watched
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                        : "bg-cyan-500 hover:bg-cyan-600 text-white"
                    }
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    {activeLesson.watched ? "Assistida" : "Marcar como assistida"}
                  </Button>
                </div>

                {/* Materials */}
                {activeLesson.materials && (
                  <div className="mt-4">
                    <p className="text-xs text-white/40 uppercase tracking-wide mb-2">
                      Materiais
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {JSON.parse(activeLesson.materials).map(
                        (m: { label: string; url: string }, i: number) => (
                          <a
                            key={i}
                            href={m.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-full transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {m.label || m.url}
                          </a>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Progress bar */}
            <div className="px-5 py-4 border-b border-white/10">
              <div className="flex items-center justify-between text-sm text-white/50 mb-2">
                <span>
                  {watchedCount} de {totalLessons} aulas assistidas
                </span>
                <span className="font-medium text-white">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-white/10" />
            </div>

            {/* Tabs */}
            <div className="p-5">
              <div className="flex gap-1 mb-6 border-b border-white/10">
                {(["aulas", "quiz", "comentarios"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      activeTab === tab
                        ? "border-cyan-500 text-cyan-400"
                        : "border-transparent text-white/50 hover:text-white/80"
                    }`}
                  >
                    {tab === "aulas" && "Sobre o curso"}
                    {tab === "quiz" && "Quiz"}
                    {tab === "comentarios" && `Comentários (${stats.totalComments})`}
                  </button>
                ))}
              </div>

              {/* About */}
              {activeTab === "aulas" && (
                <div className="space-y-6">
                  {training.description && (
                    <div>
                      <h3 className="text-white font-semibold mb-2">Sobre o treinamento</h3>
                      <p className="text-white/60 leading-relaxed">{training.description}</p>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                      <p className="text-2xl font-bold text-white">{totalLessons}</p>
                      <p className="text-xs text-white/40 mt-0.5">Aulas</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                      <p className="text-2xl font-bold text-white">
                        {formatDuration(training.total_duration)}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5">Duração</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                      <p className="text-2xl font-bold text-amber-400">{stats.avgRating}</p>
                      <p className="text-xs text-white/40 mt-0.5">Avaliação</p>
                    </div>
                    <div className="rounded-lg bg-white/5 border border-white/10 p-3 text-center">
                      <p className="text-2xl font-bold text-pink-400">{stats.totalLikes}</p>
                      <p className="text-xs text-white/40 mt-0.5">Curtidas</p>
                    </div>
                  </div>

                  {/* Rating & Like */}
                  <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                    <h3 className="text-white font-semibold mb-4">Avalie este treinamento</h3>
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div>
                        <p className="text-xs text-white/40 mb-2">Sua nota</p>
                        <StarRating value={userRating} onChange={handleRate} />
                      </div>
                      <div>
                        <p className="text-xs text-white/40 mb-2">Curtir</p>
                        <button
                          onClick={handleLike}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                            userLiked
                              ? "bg-pink-500/20 border-pink-500/30 text-pink-400"
                              : "border-white/10 text-white/50 hover:bg-white/5"
                          }`}
                        >
                          <ThumbsUp className={`w-4 h-4 ${userLiked ? "fill-pink-400" : ""}`} />
                          {userLiked ? "Curtido!" : "Curtir"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quiz */}
              {activeTab === "quiz" && (
                <div>
                  {completion?.quiz_passed ? (
                    <div className="text-center py-10">
                      <Award className="w-20 h-20 text-amber-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Treinamento Concluído!
                      </h3>
                      <p className="text-white/50 mb-1">
                        Pontuação: {Number(completion.quiz_score) || 0}%
                      </p>
                      <p className="text-white/30 text-sm">
                        Concluído em{" "}
                        {new Date(completion.completed_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  ) : progress < 100 ? (
                    <div className="text-center py-10">
                      <Lock className="w-16 h-16 text-white/20 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Quiz bloqueado
                      </h3>
                      <p className="text-white/50 text-sm">
                        Assista todas as aulas para liberar o quiz
                      </p>
                      <p className="text-white/30 text-xs mt-1">
                        {watchedCount}/{totalLessons} aulas assistidas
                      </p>
                    </div>
                  ) : (
                    <QuizSection
                      trainingId={trainingId}
                      token={token}
                      onPassed={fetchDetail}
                    />
                  )}
                </div>
              )}

              {/* Comments */}
              {activeTab === "comentarios" && (
                <div className="space-y-5">
                  {/* New comment */}
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <Textarea
                      placeholder="Deixe seu comentário ou dúvida..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="bg-transparent border-white/10 text-white placeholder:text-white/30 resize-none mb-3"
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleComment}
                        disabled={submittingComment || !newComment.trim()}
                        size="sm"
                        className="bg-cyan-500 hover:bg-cyan-600 text-white"
                      >
                        <Send className="w-4 h-4 mr-1.5" />
                        {submittingComment ? "Enviando..." : "Comentar"}
                      </Button>
                    </div>
                  </div>

                  {/* Comments list */}
                  {comments.length === 0 ? (
                    <div className="text-center py-10">
                      <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-3" />
                      <p className="text-white/40">Nenhum comentário ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((c) => (
                        <div
                          key={c.id}
                          className="flex gap-3 group"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                            {c.userName?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="flex-1 rounded-xl bg-white/5 border border-white/10 p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-white">
                                {c.userName || "Usuário"}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-white/30">
                                  {timeAgo(c.created_at)}
                                </span>
                                {c.user_id === currentUserId && (
                                  <button
                                    onClick={() => handleDeleteComment(c.id)}
                                    className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-white/70 text-sm leading-relaxed">
                              {c.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar: Lesson list ── */}
          <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-white/10 bg-slate-900/50 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-semibold text-sm">
                Conteúdo do curso
              </h3>
              <p className="text-xs text-white/40 mt-0.5">
                {watchedCount}/{totalLessons} aulas · {progress}% concluído
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {lessons.map((lesson, idx) => (
                <button
                  key={lesson.id}
                  onClick={() => handleSelectLesson(lesson)}
                  className={`w-full text-left p-4 border-b border-white/5 transition-colors flex items-start gap-3 ${
                    activeLesson?.id === lesson.id
                      ? "bg-cyan-500/10 border-l-2 border-l-cyan-500"
                      : "hover:bg-white/5"
                  }`}
                >
                  {/* Status icon */}
                  <div className="mt-0.5 flex-shrink-0">
                    {lesson.watched ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : activeLesson?.id === lesson.id ? (
                      <Play className="w-5 h-5 text-cyan-400 fill-cyan-400" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-white/20 flex items-center justify-center">
                        <span className="text-[10px] text-white/40">{idx + 1}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium line-clamp-2 ${
                        activeLesson?.id === lesson.id
                          ? "text-cyan-300"
                          : lesson.watched
                          ? "text-white/60"
                          : "text-white"
                      }`}
                    >
                      {lesson.title}
                    </p>
                    {lesson.duration > 0 && (
                      <p className="text-xs text-white/30 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(lesson.duration)}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Completion CTA */}
            {progress === 100 && !completion?.quiz_passed && (
              <div className="p-4 border-t border-white/10 bg-cyan-500/5">
                <p className="text-sm text-cyan-300 font-medium mb-2">
                  Todas as aulas concluídas!
                </p>
                <p className="text-xs text-white/40 mb-3">
                  Faça o quiz para obter seu certificado
                </p>
                <Button
                  onClick={() => setActiveTab("quiz")}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                  size="sm"
                >
                  <Award className="w-4 h-4 mr-1.5" />
                  Fazer quiz
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
