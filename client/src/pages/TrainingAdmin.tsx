import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useTrainingToken } from "@/hooks/useTrainingToken";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Video,
  HelpCircle,
  ChevronLeft,
  Save,
  Eye,
  BarChart2,
  Users,
  Award,
  Star,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

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
  is_active: number;
  lesson_count: number;
  avg_rating: number;
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  video_url: string;
  duration: number;
  order_index: number;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
}

// ─── Training Form ────────────────────────────────────────────────────────────

function TrainingForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Training>;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    thumbnail: initial?.thumbnail ?? "",
    category: initial?.category ?? "",
    level: initial?.level ?? "basico",
    instructor: initial?.instructor ?? "",
    total_duration: Number(initial?.total_duration) || 0,
    is_mandatory: initial?.is_mandatory ? true : false,
    is_active: initial?.is_active !== undefined ? Boolean(initial.is_active) : true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Título obrigatório"); return; }
    setSaving(true);
    try {
      // Map snake_case to camelCase expected by backend
      const payload = {
        title: form.title,
        description: form.description,
        thumbnail: form.thumbnail,
        category: form.category,
        level: form.level,
        instructor: form.instructor,
        totalDuration: form.total_duration,
        isMandatory: form.is_mandatory,
        isActive: form.is_active,
      };
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-white/50 mb-1 block">Título *</label>
        <Input
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="Ex: Introdução à LGPD"
          className="bg-white/5 border-white/10 text-white"
        />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Descrição</label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Descreva o conteúdo do treinamento..."
          className="bg-white/5 border-white/10 text-white resize-none"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-white/50 mb-1 block">Categoria</label>
          <Input
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            placeholder="Ex: Compliance"
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1 block">Nível</label>
          <Select value={form.level} onValueChange={(v) => setForm((p) => ({ ...p, level: v }))}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/10">
              <SelectItem value="basico" className="text-white">Básico</SelectItem>
              <SelectItem value="intermediario" className="text-white">Intermediário</SelectItem>
              <SelectItem value="avancado" className="text-white">Avançado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-white/50 mb-1 block">Instrutor</label>
          <Input
            value={form.instructor}
            onChange={(e) => setForm((p) => ({ ...p, instructor: e.target.value }))}
            placeholder="Nome do instrutor"
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1 block">Duração total (min)</label>
          <Input
            type="number"
            value={form.total_duration}
            onChange={(e) => setForm((p) => ({ ...p, total_duration: parseInt(e.target.value) || 0 }))}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">URL da thumbnail</label>
        <Input
          value={form.thumbnail}
          onChange={(e) => setForm((p) => ({ ...p, thumbnail: e.target.value }))}
          placeholder="https://..."
          className="bg-white/5 border-white/10 text-white"
        />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="mandatory"
            checked={form.is_mandatory}
            onChange={(e) => setForm((p) => ({ ...p, is_mandatory: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="mandatory" className="text-sm text-white/70">
            Treinamento obrigatório
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active"
            checked={form.is_active}
            onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
            className="rounded"
          />
          <label htmlFor="active" className="text-sm text-white/70">
            Treinamento ativo
          </label>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel} className="text-white/60">
          Cancelar
        </Button>
        <Button type="submit" disabled={saving} className="bg-cyan-500 hover:bg-cyan-600 text-white">
          <Save className="w-4 h-4 mr-1.5" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Lesson Form ──────────────────────────────────────────────────────────────

function LessonForm({
  initial,
  orderIndex,
  onSave,
  onCancel,
}: {
  initial?: Partial<Lesson>;
  orderIndex: number;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    video_url: initial?.video_url ?? "",
    duration: Number(initial?.duration) || 0,
    order_index: Number(initial?.order_index ?? orderIndex) || 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Título da aula obrigatório"); return; }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-white/50 mb-1 block">Título da aula *</label>
        <Input
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="Ex: Introdução ao tema"
          className="bg-white/5 border-white/10 text-white"
        />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">Descrição</label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="O que será abordado nesta aula..."
          className="bg-white/5 border-white/10 text-white resize-none"
          rows={2}
        />
      </div>
      <div>
        <label className="text-xs text-white/50 mb-1 block">URL do vídeo</label>
        <Input
          value={form.video_url}
          onChange={(e) => setForm((p) => ({ ...p, video_url: e.target.value }))}
          placeholder="YouTube, Vimeo ou link direto (.mp4)"
          className="bg-white/5 border-white/10 text-white"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-white/50 mb-1 block">Duração (min)</label>
          <Input
            type="number"
            value={form.duration}
            onChange={(e) => setForm((p) => ({ ...p, duration: parseInt(e.target.value) || 0 }))}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1 block">Ordem</label>
          <Input
            type="number"
            value={form.order_index}
            onChange={(e) => setForm((p) => ({ ...p, order_index: parseInt(e.target.value) || 0 }))}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel} className="text-white/60">
          Cancelar
        </Button>
        <Button type="submit" disabled={saving} className="bg-cyan-500 hover:bg-cyan-600 text-white">
          <Save className="w-4 h-4 mr-1.5" />
          {saving ? "Salvando..." : "Salvar aula"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Quiz Builder ─────────────────────────────────────────────────────────────

function QuizBuilder({
  trainingId,
  token,
  onClose,
}: {
  trainingId: number;
  token: string;
  onClose: () => void;
}) {
  const [minScore, setMinScore] = useState(70);
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    { question: "", options: ["", "", "", ""], correct_index: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/trainings/${trainingId}/quiz`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.quiz) setMinScore(data.quiz.min_score);
        if (data.questions?.length > 0) {
          setQuestions(
            data.questions.map((q: any) => ({
              question: q.question,
              options: q.options,
              correct_index: q.correct_index,
            }))
          );
        }
      });
  }, [trainingId, token]);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { question: "", options: ["", "", "", ""], correct_index: 0 },
    ]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.map((o, j) => (j === oIdx ? value : o)) }
          : q
      )
    );
  };

  const handleSave = async () => {
    const invalid = questions.find(
      (q) => !q.question.trim() || q.options.some((o) => !o.trim())
    );
    if (invalid) {
      toast.error("Preencha todas as perguntas e opções");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/trainings/${trainingId}/quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ min_score: minScore, questions }),
      });
      if (!res.ok) throw new Error("Erro ao salvar quiz");
      toast.success("Quiz salvo com sucesso!");
      onClose();
    } catch {
      toast.error("Erro ao salvar quiz");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
      <div className="flex items-center gap-4">
        <div>
          <label className="text-xs text-white/50 mb-1 block">Pontuação mínima (%)</label>
          <Input
            type="number"
            value={minScore}
            onChange={(e) => setMinScore(parseInt(e.target.value) || 70)}
            className="bg-white/5 border-white/10 text-white w-32"
            min={0}
            max={100}
          />
        </div>
        <div className="text-xs text-white/40 mt-4">
          Alunos precisam atingir {minScore}% para serem aprovados
        </div>
      </div>

      {questions.map((q, qi) => (
        <div key={qi} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/60">Questão {qi + 1}</span>
            {questions.length > 1 && (
              <button
                onClick={() => removeQuestion(qi)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <Input
            value={q.question}
            onChange={(e) => updateQuestion(qi, "question", e.target.value)}
            placeholder="Digite a pergunta..."
            className="bg-white/5 border-white/10 text-white"
          />
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${qi}`}
                  checked={q.correct_index === oi}
                  onChange={() => updateQuestion(qi, "correct_index", oi)}
                  className="accent-cyan-500"
                />
                <Input
                  value={opt}
                  onChange={(e) => updateOption(qi, oi, e.target.value)}
                  placeholder={`Opção ${String.fromCharCode(65 + oi)}`}
                  className="bg-white/5 border-white/10 text-white text-sm"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-white/30">
            Selecione o botão de rádio ao lado da opção correta
          </p>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addQuestion}
        className="w-full border-dashed border-white/20 text-white/50 hover:text-white hover:border-white/40"
      >
        <Plus className="w-4 h-4 mr-1.5" />
        Adicionar questão
      </Button>

      <div className="flex gap-3 pt-2">
        <Button variant="ghost" onClick={onClose} className="text-white/60 flex-1">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-cyan-500 hover:bg-cyan-600 text-white flex-1"
        >
          <Save className="w-4 h-4 mr-1.5" />
          {saving ? "Salvando..." : "Salvar quiz"}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TrainingAdmin() {
  const [, navigate] = useLocation();

  const { token, loading: tokenLoading, isAuthenticated } = useTrainingToken();

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [view, setView] = useState<"list" | "lessons" | "quiz" | "reports">("list");

  // Dialogs
  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);

  // Reports
  const [reports, setReports] = useState<any>(null);

  const fetchTrainings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/trainings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTrainings(data.trainings || []);
    } catch {
      toast.error("Erro ao carregar treinamentos");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchLessons = useCallback(async (trainingId: number) => {
    try {
      const res = await fetch(`/api/trainings/${trainingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLessons(data.lessons || []);
    } catch {}
  }, [token]);

  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/trainings/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReports(data);
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  useEffect(() => {
    if (view === "reports") fetchReports();
  }, [view, fetchReports]);

  // ── Training CRUD ──

  const handleCreateTraining = async (formData: any) => {
    const res = await fetch("/api/admin/trainings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });
    if (!res.ok) throw new Error("Erro ao criar treinamento");
    toast.success("Treinamento criado!");
    setShowTrainingForm(false);
    fetchTrainings();
  };

  const handleUpdateTraining = async (formData: any) => {
    if (!editingTraining) return;
    const res = await fetch(`/api/admin/trainings/${editingTraining.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });
    if (!res.ok) throw new Error("Erro ao atualizar");
    toast.success("Treinamento atualizado!");
    setEditingTraining(null);
    fetchTrainings();
  };

  const handleDeleteTraining = async (id: number) => {
    if (!confirm("Desativar este treinamento?")) return;
    await fetch(`/api/admin/trainings/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Treinamento desativado");
    fetchTrainings();
  };

  // ── Lesson CRUD ──

  const handleCreateLesson = async (formData: any) => {
    if (!selectedTraining) return;
    // Map snake_case to camelCase expected by backend
    const payload = { ...formData, videoUrl: formData.video_url, orderIndex: formData.order_index };
    delete payload.video_url;
    delete payload.order_index;
    const res = await fetch(`/api/admin/trainings/${selectedTraining.id}/lessons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Erro ao criar aula");
    toast.success("Aula criada!");
    setShowLessonForm(false);
    fetchLessons(selectedTraining.id);
  };

  const handleUpdateLesson = async (formData: any) => {
    if (!selectedTraining || !editingLesson) return;
    // Map snake_case to camelCase expected by backend
    const payload = { ...formData, videoUrl: formData.video_url, orderIndex: formData.order_index };
    delete payload.video_url;
    delete payload.order_index;
    const res = await fetch(`/api/admin/trainings/${selectedTraining.id}/lessons/${editingLesson.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Erro ao atualizar aula");
    toast.success("Aula atualizada!");
    setEditingLesson(null);
    fetchLessons(selectedTraining.id);
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!selectedTraining) return;
    if (!confirm("Excluir esta aula?")) return;
    await fetch(`/api/admin/trainings/${selectedTraining.id}/lessons/${lessonId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Aula excluída");
    fetchLessons(selectedTraining.id);
  };

  const openLessons = (training: Training) => {
    setSelectedTraining(training);
    setView("lessons");
    fetchLessons(training.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {view !== "list" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setView("list"); setSelectedTraining(null); }}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Dashboard
              </Button>
            )}
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {view === "list" && "Administração de Treinamentos"}
                {view === "lessons" && `Aulas: ${selectedTraining?.title}`}
                {view === "quiz" && `Quiz: ${selectedTraining?.title}`}
                {view === "reports" && "Relatórios de Treinamentos"}
              </h1>
              <p className="text-xs text-white/40">
                {view === "list" && "Gerencie cursos, aulas e quizzes"}
                {view === "lessons" && `${lessons.length} aulas cadastradas`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {view === "list" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setView("reports")}
                  className="border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                >
                  <BarChart2 className="w-4 h-4 mr-1.5" />
                  Relatórios
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowTrainingForm(true)}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Novo treinamento
                </Button>
              </>
            )}
            {view === "lessons" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowQuizBuilder(true); }}
                  className="border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                >
                  <HelpCircle className="w-4 h-4 mr-1.5" />
                  Editar quiz
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowLessonForm(true)}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Nova aula
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ── List View ── */}
        {view === "list" && (
          <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-white/40">Carregando...</div>
            ) : trainings.length === 0 ? (
              <div className="p-12 text-center">
                <GraduationCap className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/50 text-lg">Nenhum treinamento cadastrado</p>
                <Button
                  onClick={() => setShowTrainingForm(true)}
                  className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Criar primeiro treinamento
                </Button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Treinamento</th>
                    <th className="text-left text-xs text-white/40 font-medium px-4 py-3 hidden sm:table-cell">Categoria</th>
                    <th className="text-left text-xs text-white/40 font-medium px-4 py-3 hidden md:table-cell">Nível</th>
                    <th className="text-center text-xs text-white/40 font-medium px-4 py-3">Aulas</th>
                    <th className="text-center text-xs text-white/40 font-medium px-4 py-3 hidden lg:table-cell">Avaliação</th>
                    <th className="text-center text-xs text-white/40 font-medium px-4 py-3">Status</th>
                    <th className="text-right text-xs text-white/40 font-medium px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {trainings.map((t) => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium text-sm">{t.title}</p>
                          {t.instructor && (
                            <p className="text-xs text-white/40">{t.instructor}</p>
                          )}
                          {t.is_mandatory ? (
                            <span className="text-xs text-red-400">Obrigatório</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-white/60">{t.category || "—"}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          t.level === "basico" ? "bg-emerald-500/20 text-emerald-400" :
                          t.level === "intermediario" ? "bg-amber-500/20 text-amber-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {t.level === "basico" ? "Básico" : t.level === "intermediario" ? "Intermediário" : "Avançado"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-white/60">{Number(t.lesson_count) || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        <span className="text-sm text-amber-400 flex items-center justify-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {(Number(t.avg_rating) || 0).toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {t.is_active ? (
                          <span className="flex items-center justify-center gap-1 text-xs text-emerald-400">
                            <CheckCircle className="w-3.5 h-3.5" /> Ativo
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1 text-xs text-red-400">
                            <XCircle className="w-3.5 h-3.5" /> Inativo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/treinamentos/${t.id}`)}
                            className="p-1.5 rounded text-white/40 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openLessons(t)}
                            className="p-1.5 rounded text-white/40 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            title="Gerenciar aulas"
                          >
                            <Video className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingTraining(t)}
                            className="p-1.5 rounded text-white/40 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTraining(t.id)}
                            className="p-1.5 rounded text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Desativar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Lessons View ── */}
        {view === "lessons" && (
          <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            {lessons.length === 0 ? (
              <div className="p-12 text-center">
                <BookOpen className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/50 text-lg">Nenhuma aula cadastrada</p>
                <Button
                  onClick={() => setShowLessonForm(true)}
                  className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Criar primeira aula
                </Button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Ordem</th>
                    <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Título</th>
                    <th className="text-left text-xs text-white/40 font-medium px-4 py-3 hidden sm:table-cell">Vídeo</th>
                    <th className="text-center text-xs text-white/40 font-medium px-4 py-3">Duração</th>
                    <th className="text-right text-xs text-white/40 font-medium px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((l) => (
                    <tr key={l.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3">
                        <span className="text-white/40 text-sm">{(Number(l.order_index) || 0) + 1}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white text-sm font-medium">{l.title}</p>
                        {l.description && (
                          <p className="text-xs text-white/40 line-clamp-1">{l.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {l.video_url ? (
                          <span className="text-xs text-cyan-400 truncate max-w-[200px] block">
                            {l.video_url}
                          </span>
                        ) : (
                          <span className="text-xs text-white/30">Sem vídeo</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-white/60">
                          {l.duration ? `${Number(l.duration)}min` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingLesson(l)}
                            className="p-1.5 rounded text-white/40 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(l.id)}
                            className="p-1.5 rounded text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Reports View ── */}
        {view === "reports" && (
          <div className="space-y-6">
            {!reports ? (
              <div className="text-center py-12 text-white/40">Carregando relatórios...</div>
            ) : (
              <>
                {/* Stats table */}
                <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="text-white font-semibold">Desempenho por treinamento</h3>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Treinamento</th>
                        <th className="text-center text-xs text-white/40 font-medium px-4 py-3">Iniciados</th>
                        <th className="text-center text-xs text-white/40 font-medium px-4 py-3">Concluídos</th>
                        <th className="text-center text-xs text-white/40 font-medium px-4 py-3">Avaliação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.stats?.map((s: any) => (
                        <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-4 py-3 text-white text-sm">{s.title}</td>
                          <td className="px-4 py-3 text-center text-white/60 text-sm">{Number(s.started) || 0}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-emerald-400 text-sm font-medium">{Number(s.completions) || 0}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-amber-400 text-sm flex items-center justify-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400" />
                              {(Number(s.avg_rating) || 0).toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Recent completions */}
                <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="text-white font-semibold">Conclusões recentes</h3>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Usuário</th>
                        <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Treinamento</th>
                        <th className="text-center text-xs text-white/40 font-medium px-4 py-3">Pontuação</th>
                        <th className="text-center text-xs text-white/40 font-medium px-4 py-3">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.completions?.slice(0, 20).map((c: any) => (
                        <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-4 py-3">
                            <p className="text-white text-sm">{c.userName}</p>
                            <p className="text-xs text-white/40">{c.userEmail}</p>
                          </td>
                          <td className="px-4 py-3 text-white/60 text-sm">{c.trainingTitle}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-sm font-medium ${c.quiz_passed ? "text-emerald-400" : "text-red-400"}`}>
                              {Number(c.quiz_score) || 0}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-white/40 text-xs">
                            {new Date(c.completed_at).toLocaleDateString("pt-BR")}
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

        {/* ── Dialogs ── */}

        {/* Create Training */}
        <Dialog open={showTrainingForm} onOpenChange={setShowTrainingForm}>
          <DialogContent className="bg-slate-800 border-white/10 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Novo Treinamento</DialogTitle>
            </DialogHeader>
            <TrainingForm
              onSave={handleCreateTraining}
              onCancel={() => setShowTrainingForm(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Training */}
        <Dialog open={!!editingTraining} onOpenChange={() => setEditingTraining(null)}>
          <DialogContent className="bg-slate-800 border-white/10 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Editar Treinamento</DialogTitle>
            </DialogHeader>
            {editingTraining && (
              <TrainingForm
                initial={editingTraining}
                onSave={handleUpdateTraining}
                onCancel={() => setEditingTraining(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Create Lesson */}
        <Dialog open={showLessonForm} onOpenChange={setShowLessonForm}>
          <DialogContent className="bg-slate-800 border-white/10 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Nova Aula</DialogTitle>
            </DialogHeader>
            <LessonForm
              orderIndex={lessons.length}
              onSave={handleCreateLesson}
              onCancel={() => setShowLessonForm(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Lesson */}
        <Dialog open={!!editingLesson} onOpenChange={() => setEditingLesson(null)}>
          <DialogContent className="bg-slate-800 border-white/10 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Editar Aula</DialogTitle>
            </DialogHeader>
            {editingLesson && (
              <LessonForm
                initial={editingLesson}
                orderIndex={editingLesson.order_index}
                onSave={handleUpdateLesson}
                onCancel={() => setEditingLesson(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Quiz Builder */}
        <Dialog open={showQuizBuilder} onOpenChange={setShowQuizBuilder}>
          <DialogContent className="bg-slate-800 border-white/10 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                Quiz: {selectedTraining?.title}
              </DialogTitle>
            </DialogHeader>
            {selectedTraining && (
              <QuizBuilder
                trainingId={selectedTraining.id}
                token={token}
                onClose={() => setShowQuizBuilder(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
}
