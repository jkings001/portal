import { useState } from "react";
import { Plus, Edit2, Trash2, Eye, LogOut, Search, Filter } from "lucide-react";
import { useLocation } from "wouter";
import UserMenu from "@/components/UserMenu";
import BackButton from "@/components/BackButton";
import { mockCourses } from "@/lib/trainingData";

/**
 * Design Philosophy: Glassmorphism Futurista
 * - Painel de administração com CRUD de treinamentos
 * - Listagem, edição e exclusão de cursos
 * - Formulário de cadastro/edição
 */

interface FormData {
  title: string;
  instructorName: string;
  instructorBio: string;
  shortDesc: string;
  fullDesc: string;
  durationMinutes: number;
  contentType: "video" | "pdf" | "written";
  status: "published" | "draft";
  category: string;
  level: "beginner" | "intermediate" | "advanced";
}

type ViewMode = "list" | "form";

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [courses, setCourses] = useState(mockCourses);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    instructorName: "",
    instructorBio: "",
    shortDesc: "",
    fullDesc: "",
    durationMinutes: 0,
    contentType: "video",
    status: "draft",
    category: "",
    level: "beginner"
  });

  const handleLogout = () => {
    setLocation("/");
  };

  const handleAddCourse = () => {
    setEditingId(null);
    setFormData({
      title: "",
      instructorName: "",
      instructorBio: "",
      shortDesc: "",
      fullDesc: "",
      durationMinutes: 0,
      contentType: "video",
      status: "draft",
      category: "",
      level: "beginner"
    });
    setViewMode("form");
  };

  const handleEditCourse = (course: typeof mockCourses[0]) => {
    setEditingId(course.id);
    setFormData({
      title: course.title,
      instructorName: course.instructorName,
      instructorBio: course.instructorBio,
      shortDesc: course.shortDesc,
      fullDesc: course.fullDesc,
      durationMinutes: course.durationMinutes,
      contentType: course.contentType,
      status: course.status,
      category: course.category || "",
      level: course.level || "beginner"
    });
    setViewMode("form");
  };

  const handleDeleteCourse = (courseId: string) => {
    if (confirm("Tem certeza que deseja deletar este treinamento?")) {
      setCourses(courses.filter(c => c.id !== courseId));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // Editar
      setCourses(courses.map(c => 
        c.id === editingId 
          ? { ...c, ...formData }
          : c
      ));
    } else {
      // Adicionar novo
      const newCourse = {
        ...formData,
        id: `course-${Date.now()}`,
        thumbnailUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop",
        contentUrl: "",
        contentData: "",
        previewRules: {
          type: formData.contentType as "video" | "pdf" | "written",
          value: "00:00:00 - 00:05:00"
        },
        createdAt: new Date().toISOString().split("T")[0]
      };
      setCourses([...courses, newCourse]);
    }

    setViewMode("list");
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-black"
      style={{
        backgroundImage: "url('/images/bg-gradient-hero.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/30 to-black/50 pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <header className="glassmorphic border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="/images/logo-jkings.png" 
                  alt="JKINGS" 
                  className="h-8"
                />
                <div>
                  <h1 className="text-white font-bold">Gestão de Treinamentos</h1>
                  <p className="text-gray-300 text-xs">Painel do Administrador</p>
                </div>
              </div>

              <BackButton />
              <div className="pl-4 border-l border-white/20">
                <UserMenu showHome={true} />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {viewMode === "list" ? (
            <>
              {/* Toolbar */}
              <div className="glassmorphic rounded-xl p-6 mb-8">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar treinamentos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <button
                    onClick={handleAddCourse}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 text-gray-900 font-bold hover:from-cyan-300 hover:to-cyan-400 transition-all whitespace-nowrap"
                  >
                    <Plus className="w-5 h-5" />
                    Novo Treinamento
                  </button>
                </div>
              </div>

              {/* Tabela de Cursos */}
              <div className="glassmorphic rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="px-6 py-4 text-left text-white font-bold text-sm">Título</th>
                        <th className="px-6 py-4 text-left text-white font-bold text-sm">Instrutor</th>
                        <th className="px-6 py-4 text-left text-white font-bold text-sm">Tipo</th>
                        <th className="px-6 py-4 text-left text-white font-bold text-sm">Status</th>
                        <th className="px-6 py-4 text-left text-white font-bold text-sm">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCourses.map((course) => (
                        <tr key={course.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-gray-300 text-sm">{course.title}</td>
                          <td className="px-6 py-4 text-gray-300 text-sm">{course.instructorName}</td>
                          <td className="px-6 py-4 text-gray-300 text-sm capitalize">
                            {course.contentType === "video" && "🎥 Vídeo"}
                            {course.contentType === "pdf" && "📄 PDF"}
                            {course.contentType === "written" && "📝 Escrito"}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              course.status === "published"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}>
                              {course.status === "published" ? "Publicado" : "Rascunho"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditCourse(course)}
                                className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCourse(course.id)}
                                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                title="Deletar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {filteredCourses.length === 0 && (
                <div className="glassmorphic rounded-xl p-12 text-center">
                  <p className="text-gray-300 text-lg">Nenhum treinamento encontrado</p>
                </div>
              )}
            </>
          ) : (
            /* Formulário */
            <div className="max-w-2xl mx-auto">
              <div className="glassmorphic rounded-xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  {editingId ? "Editar Treinamento" : "Novo Treinamento"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Título do Curso
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      required
                    />
                  </div>

                  {/* Instrutor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Nome do Instrutor
                      </label>
                      <input
                        type="text"
                        value={formData.instructorName}
                        onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Bio do Instrutor
                      </label>
                      <input
                        type="text"
                        value={formData.instructorBio}
                        onChange={(e) => setFormData({ ...formData, instructorBio: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                    </div>
                  </div>

                  {/* Descrições */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Descrição Curta
                    </label>
                    <textarea
                      value={formData.shortDesc}
                      onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Descrição Completa
                    </label>
                    <textarea
                      value={formData.fullDesc}
                      onChange={(e) => setFormData({ ...formData, fullDesc: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      required
                    />
                  </div>

                  {/* Detalhes */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Duração (min)
                      </label>
                      <input
                        type="number"
                        value={formData.durationMinutes}
                        onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Tipo
                      </label>
                      <select
                        value={formData.contentType}
                        onChange={(e) => setFormData({ ...formData, contentType: e.target.value as any })}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      >
                        <option value="video" className="bg-gray-900">Vídeo</option>
                        <option value="pdf" className="bg-gray-900">PDF</option>
                        <option value="written" className="bg-gray-900">Escrito</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Nível
                      </label>
                      <select
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      >
                        <option value="beginner" className="bg-gray-900">Iniciante</option>
                        <option value="intermediate" className="bg-gray-900">Intermediário</option>
                        <option value="advanced" className="bg-gray-900">Avançado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      >
                        <option value="draft" className="bg-gray-900">Rascunho</option>
                        <option value="published" className="bg-gray-900">Publicado</option>
                      </select>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-4 pt-6 border-t border-white/10">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 text-gray-900 font-bold hover:from-cyan-300 hover:to-cyan-400 transition-all"
                    >
                      {editingId ? "Atualizar" : "Criar"} Treinamento
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className="flex-1 px-6 py-3 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
