import { useState } from "react";
import { Search, BookOpen, Clock, CheckCircle, TrendingUp, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import UserMenu from "@/components/UserMenu";
import BackButton from "@/components/BackButton";
import {
  currentUser,
  mockCourses,
  mockEnrollments,
  getCourseStats,
  getEnrollmentByCourseAndUser,
  getCertificateByUserAndCourse
} from "@/lib/trainingData";

/**
 * Design Philosophy: Glassmorphism Futurista
 * - Dashboard de treinamentos com KPIs e cards de cursos
 * - Filtros e busca por cursos
 * - Indicador de progresso visual
 */

type FilterStatus = "all" | "available" | "in_progress" | "completed";

export default function TrainingDashboard() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const stats = getCourseStats(currentUser.id);

  const filteredCourses = mockCourses.filter((course) => {
    // Filtro de busca
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.shortDesc.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Filtro de status
    if (filterStatus === "all") return true;

    const enrollment = getEnrollmentByCourseAndUser(course.id, currentUser.id);

    if (filterStatus === "available") {
      return !enrollment;
    } else if (filterStatus === "in_progress") {
      return enrollment?.status === "in_progress";
    } else if (filterStatus === "completed") {
      return enrollment?.status === "completed";
    }

    return true;
  });

  const handleLogout = () => {
    setLocation("/");
  };

  const handleCourseClick = (courseId: string) => {
    setLocation(`/training/${courseId}`);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-black"
      style={{
        backgroundImage: "url('https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/KoIkonwMtIdIHrjnda2AbH-img-1_1770239808000_na1fn_YmctcGFnZXMtZ2VuZXJhbA.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94L0tvSWtvbndNdElkSUhyam5kYTJBYkgtaW1nLTFfMTc3MDIzOTgwODAwMF9uYTFmbl9ZbWN0Y0dGblpYTXRaMlZ1WlhKaGJBLmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=G-4sam25r3pn-X1QcnliL6aRvhIeTzyayYtXnPHYnJmFJBa7YxlwfCxXZmRdTqb0WuQNAPbaInMrWlNU9Qwu4-MOoxGokBbR~g5S7~K8SJiVWEeilwBhReWUwy8Xv-0mJjOJUVzQ-kKG5wf87sTt60z68n39mMMx36gvnf-X6qNkWt4PfgQziT6L5vreP5betjsfIDH9HvQ6~TTWwAN~8qFR1A8x5tVX2lrJt8F22C~NRVAHfU2XdoqawdV~0zGZVA5gqCO9H88uWz3YeFT6Jq8hJAWE48b373pP2~oSFD8dg6me9Lk1OjZnWYeN6trzN8NYrWMoa~MJHXmDXvNwvw__')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(15,23,42,0.3) 0%, rgba(0,0,0,0.7) 100%)' }} />

      <div className="relative z-10">
        {/* Header */}
        <header className="glassmorphic border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="/images/logo-jkings-dashboard.png" 
                  alt="JKINGS" 
                  className="h-8 transition-all duration-300 hover:scale-110"
                  style={{
                    filter: 'drop-shadow(0 0 15px rgba(34, 211, 238, 0.5)) drop-shadow(0 0 30px rgba(34, 211, 238, 0.2))'
                  }}
                />
                <div>
                  <h1 className="text-white font-bold">Meus Treinamentos</h1>
                  <p className="text-gray-300 text-xs">Área do Aluno</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <BackButton onClick={() => setLocation("/dashboard")} />
                <div className="pl-4 border-l border-white/20">
                  <UserMenu showHome={true} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <p className="text-gray-300">
              Bem-vindo à sua área de treinamentos. Continue aprendendo!
            </p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Disponíveis */}
            <div className="glassmorphic rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm mb-1">Disponíveis</p>
                  <p className="text-3xl font-bold text-white">{stats.available}</p>
                </div>
                <BookOpen className="w-10 h-10 text-cyan-400 opacity-50" />
              </div>
            </div>

            {/* Em Curso */}
            <div className="glassmorphic rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm mb-1">Em Curso</p>
                  <p className="text-3xl font-bold text-white">{stats.inProgress}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-400 opacity-50" />
              </div>
            </div>

            {/* Concluídos */}
            <div className="glassmorphic rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm mb-1">Concluídos</p>
                  <p className="text-3xl font-bold text-white">{stats.completed}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-400 opacity-50" />
              </div>
            </div>

            {/* Progresso Geral */}
            <div className="glassmorphic rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm mb-1">Progresso Geral</p>
                  <p className="text-3xl font-bold text-white">{stats.avgProgress}%</p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-400 opacity-50" />
              </div>
            </div>
          </div>

          {/* Busca e Filtros */}
          <div className="glassmorphic rounded-xl p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar treinamentos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>

              {/* Filtros */}
              <div className="flex gap-2 flex-wrap">
                {(["all", "available", "in_progress", "completed"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filterStatus === status
                        ? "bg-cyan-400 text-gray-900"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {status === "all" && "Todos"}
                    {status === "available" && "Disponíveis"}
                    {status === "in_progress" && "Em Curso"}
                    {status === "completed" && "Concluídos"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid de Cursos */}
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const enrollment = getEnrollmentByCourseAndUser(course.id, currentUser.id);
                const certificate = getCertificateByUserAndCourse(currentUser.id, course.id);
                const status = enrollment?.status || "available";

                return (
                  <div
                    key={course.id}
                    onClick={() => handleCourseClick(course.id)}
                    className="glassmorphic rounded-xl overflow-hidden hover:bg-white/15 transition-all cursor-pointer group"
                  >
                    {/* Thumbnail */}
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {/* Badge Status */}
                      <div className="absolute top-3 right-3">
                        {status === "completed" && (
                          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            Concluído
                          </span>
                        )}
                        {status === "in_progress" && (
                          <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            Em Curso
                          </span>
                        )}
                        {status === "available" && (
                          <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                            Disponível
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-white font-bold text-lg mb-1 line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-3">
                        Por {course.instructorName}
                      </p>
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                        {course.shortDesc}
                      </p>

                      {/* Progress Bar */}
                      {enrollment && (
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-400">Progresso</span>
                            <span className="text-xs font-bold text-cyan-400">
                              {enrollment.progressPercent}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all"
                              style={{ width: `${enrollment.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                        <span>{Math.floor(course.durationMinutes / 60)}h {course.durationMinutes % 60}min</span>
                        <span className="capitalize">
                          {course.level === "beginner" && "Iniciante"}
                          {course.level === "intermediate" && "Intermediário"}
                          {course.level === "advanced" && "Avançado"}
                        </span>
                      </div>

                      {/* CTA Button */}
                      <button className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 text-gray-900 font-bold hover:from-cyan-300 hover:to-cyan-400 transition-all">
                        {status === "completed" && certificate ? "Ver Certificado" : "Ver Detalhes"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glassmorphic rounded-xl p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
              <p className="text-gray-300 text-lg">Nenhum treinamento encontrado</p>
              <p className="text-gray-400 text-sm mt-2">Tente ajustar seus filtros ou busca</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
