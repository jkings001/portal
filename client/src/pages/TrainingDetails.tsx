import { useState } from "react";
import { ArrowLeft, Play, FileText, BookOpen, Clock, BarChart3, Download, CheckCircle } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import UserMenu from "@/components/UserMenu";
import BackButton from "@/components/BackButton";
import {
  currentUser,
  getCourseById,
  getEnrollmentByCourseAndUser,
  getCertificateByUserAndCourse,
  mockEnrollments
} from "@/lib/trainingData";

/**
 * Design Philosophy: Glassmorphism Futurista
 * - Página de detalhes com prévia do conteúdo
 * - Inscrição e acompanhamento de progresso
 * - Geração de certificado
 */

export default function TrainingDetails() {
  const [, params] = useRoute("/training/:id");
  const [, setLocation] = useLocation();
  const [isEnrolled, setIsEnrolled] = useState(false);

  const courseId = params?.id;
  const course = courseId ? getCourseById(courseId) : null;
  const enrollment = courseId ? getEnrollmentByCourseAndUser(courseId, currentUser.id) : null;
  const certificate = courseId ? getCertificateByUserAndCourse(currentUser.id, courseId) : null;

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Treinamento não encontrado</p>
          <button
            onClick={() => setLocation("/training")}
            className="text-cyan-400 hover:text-cyan-300 font-medium"
          >
            Voltar aos Treinamentos
          </button>
        </div>
      </div>
    );
  }

  const handleEnroll = () => {
    // Simular inscrição
    setIsEnrolled(true);
    console.log("Usuário inscrito no curso:", course.title);
  };

  const handleDownloadCertificate = () => {
    console.log("Baixando certificado:", certificate?.certificateCode);
  };

  const handleBack = () => {
    setLocation("/training");
  };

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
        {/* Header com Thumbnail */}
        <div className="relative h-96 overflow-hidden">
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

          {/* Botão Voltar */}
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>

          {/* Título sobre a imagem */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <h1 className="text-4xl font-bold text-white mb-2">{course.title}</h1>
            <p className="text-gray-200 text-lg">Por {course.instructorName}</p>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Conteúdo Principal */}
            <div className="lg:col-span-2 space-y-8">
              {/* Info Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="glassmorphic rounded-lg p-4 text-center">
                  <Clock className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <p className="text-gray-300 text-sm">Duração</p>
                  <p className="text-white font-bold">
                    {Math.floor(course.durationMinutes / 60)}h {course.durationMinutes % 60}min
                  </p>
                </div>
                <div className="glassmorphic rounded-lg p-4 text-center">
                  <BarChart3 className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <p className="text-gray-300 text-sm">Nível</p>
                  <p className="text-white font-bold capitalize">
                    {course.level === "beginner" && "Iniciante"}
                    {course.level === "intermediate" && "Intermediário"}
                    {course.level === "advanced" && "Avançado"}
                  </p>
                </div>
                <div className="glassmorphic rounded-lg p-4 text-center">
                  <BookOpen className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <p className="text-gray-300 text-sm">Categoria</p>
                  <p className="text-white font-bold">{course.category}</p>
                </div>
              </div>

              {/* Descrição */}
              <div className="glassmorphic rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Sobre este Treinamento</h2>
                <p className="text-gray-300 leading-relaxed">{course.fullDesc}</p>
              </div>

              {/* Prévia do Conteúdo */}
              <div className="glassmorphic rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  {course.contentType === "video" && <Play className="w-5 h-5 text-cyan-400" />}
                  {course.contentType === "pdf" && <FileText className="w-5 h-5 text-cyan-400" />}
                  {course.contentType === "written" && <BookOpen className="w-5 h-5 text-cyan-400" />}
                  <h3 className="text-xl font-bold text-white">
                    Prévia Gratuita
                  </h3>
                </div>

                {course.contentType === "video" && (
                  <div className="relative bg-black/50 rounded-lg overflow-hidden mb-4 h-64">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="w-16 h-16 text-cyan-400 opacity-50" />
                    </div>
                    <p className="absolute bottom-4 left-4 text-gray-300 text-sm">
                      Prévia: {course.previewRules.value}
                    </p>
                  </div>
                )}

                {course.contentType === "pdf" && (
                  <div className="bg-white/5 rounded-lg p-6 mb-4">
                    <FileText className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
                    <p className="text-gray-300 text-center">
                      Primeiras {course.previewRules.value} páginas disponíveis como prévia
                    </p>
                  </div>
                )}

                {course.contentType === "written" && (
                  <div className="bg-white/5 rounded-lg p-6 mb-4 max-h-64 overflow-y-auto">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300 text-sm whitespace-pre-wrap">
                        {course.contentData?.substring(0, 300)}...
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-gray-400 text-sm text-center">
                  Inscreva-se para acessar o conteúdo completo
                </p>
              </div>

              {/* Progresso */}
              {enrollment && enrollment.status !== "enrolled" && (
                <div className="glassmorphic rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Seu Progresso</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300">Conclusão</span>
                        <span className="text-cyan-400 font-bold">{enrollment.progressPercent}%</span>
                      </div>
                      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all"
                          style={{ width: `${enrollment.progressPercent}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Iniciado em: {new Date(enrollment.startedAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - CTA e Info */}
            <div className="lg:col-span-1">
              <div className="glassmorphic rounded-xl p-6 sticky top-8 space-y-4">
                {/* Status */}
                {enrollment && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-bold text-sm">
                        {enrollment.status === "completed" && "Treinamento Concluído"}
                        {enrollment.status === "in_progress" && "Você está inscrito"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Botão Principal */}
                {!enrollment && !isEnrolled ? (
                  <button
                    onClick={handleEnroll}
                    className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 text-gray-900 font-bold text-lg hover:from-cyan-300 hover:to-cyan-400 transition-all shadow-lg hover:shadow-cyan-500/50"
                  >
                    Inscrever-se Agora
                  </button>
                ) : enrollment?.status === "completed" ? (
                  <button
                    onClick={handleDownloadCertificate}
                    className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-green-400 to-green-500 text-white font-bold flex items-center justify-center gap-2 hover:from-green-300 hover:to-green-400 transition-all"
                  >
                    <Download className="w-5 h-5" />
                    Baixar Certificado
                  </button>
                ) : (
                  <button
                    onClick={() => setLocation("/training")}
                    className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 text-gray-900 font-bold hover:from-cyan-300 hover:to-cyan-400 transition-all"
                  >
                    Continuar Treinamento
                  </button>
                )}

                {/* Info do Instrutor */}
                <div className="border-t border-white/10 pt-6">
                  <h4 className="text-white font-bold mb-2">Sobre o Instrutor</h4>
                  <p className="text-gray-300 text-sm mb-3">{course.instructorName}</p>
                  <p className="text-gray-400 text-xs">{course.instructorBio}</p>
                </div>

                {/* Certificado Info */}
                {enrollment?.status === "completed" && (
                  <div className="border-t border-white/10 pt-6 bg-green-500/10 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <p className="text-green-400 font-bold text-sm">Certificado Disponível</p>
                    </div>
                    <p className="text-gray-300 text-xs">
                      Código: {certificate?.certificateCode}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
