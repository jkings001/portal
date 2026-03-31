import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { trainingData } from "@/lib/mockData";
import { ArrowLeft, Play, Users, Clock } from "lucide-react";
import AuroraBackground from "@/components/AuroraBackground";

export default function Training() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AuroraBackground />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-md bg-white/5">
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => setLocation("/")}
              >
                <ArrowLeft size={24} />
              </Button>
              <h1 className="text-2xl font-bold text-white">Gestão de Treinamentos</h1>
            </div>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
              Novo Curso
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="glass p-6 rounded-xl">
              <p className="text-3xl font-bold text-cyan-400">{trainingData.courses.length}</p>
              <p className="text-gray-300 text-sm mt-2">Cursos Disponíveis</p>
            </div>
            <div className="glass p-6 rounded-xl">
              <p className="text-3xl font-bold text-green-400">
                {trainingData.courses.reduce((acc, c) => acc + c.students, 0)}
              </p>
              <p className="text-gray-300 text-sm mt-2">Alunos Inscritos</p>
            </div>
            <div className="glass p-6 rounded-xl">
              <p className="text-3xl font-bold text-blue-400">
                {Math.round(trainingData.courses.reduce((acc, c) => acc + c.progress, 0) / trainingData.courses.length)}%
              </p>
              <p className="text-gray-300 text-sm mt-2">Progresso Médio</p>
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trainingData.courses.map((course) => (
              <div
                key={course.id}
                className="glass p-6 rounded-xl hover:bg-white/20 transition-all duration-300 group overflow-hidden"
              >
                {/* Course Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition mb-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-400 text-sm">Instrutor: {course.instructor}</p>
                  </div>
                  <div className="bg-cyan-500/20 p-3 rounded-lg group-hover:bg-cyan-500/30 transition">
                    <Play size={24} className="text-cyan-400" />
                  </div>
                </div>

                {/* Course Info */}
                <div className="flex gap-4 mb-6 py-4 border-y border-white/10">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Clock size={16} className="text-cyan-400" />
                    <span className="text-sm">{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users size={16} className="text-cyan-400" />
                    <span className="text-sm">{course.students} alunos</span>
                  </div>
                  <div className="ml-auto">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400">
                      {course.status}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300 text-sm">Seu Progresso</span>
                    <span className="text-cyan-400 font-semibold text-sm">{course.progress}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
                    {course.progress === 100 ? "Revisar" : "Continuar"}
                  </Button>
                  <Button variant="outline" className="flex-1 border-white/30 text-white hover:bg-white/10">
                    Detalhes
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Course Categories */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Categorias de Treinamento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "Segurança", count: 5 },
                { name: "Produtividade", count: 8 },
                { name: "Compliance", count: 3 },
                { name: "Técnico", count: 12 },
              ].map((category) => (
                <div key={category.name} className="glass p-4 rounded-xl text-center hover:bg-white/20 transition cursor-pointer">
                  <p className="text-cyan-400 font-semibold text-lg">{category.count}</p>
                  <p className="text-gray-300 text-sm mt-2">{category.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-12 glass p-8 rounded-xl">
            <h2 className="text-2xl font-bold text-white mb-6">Cursos Recomendados para Você</h2>
            <div className="space-y-4">
              {[
                {
                  title: "Segurança da Informação Avançada",
                  description: "Aprenda as melhores práticas de segurança corporativa",
                  level: "Intermediário",
                },
                {
                  title: "Ferramentas de Produtividade",
                  description: "Maximize sua produtividade com ferramentas modernas",
                  level: "Iniciante",
                },
              ].map((course, index) => (
                <div key={index} className="flex items-start justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition">
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1">{course.title}</h3>
                    <p className="text-gray-400 text-sm">{course.description}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">
                      {course.level}
                    </span>
                    <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
                      Inscrever
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 backdrop-blur-md bg-white/5 mt-20">
          <div className="container mx-auto px-4 py-12 text-center text-gray-400 text-sm">
            <p>© 2026 JKINGS. Todos os direitos reservados. Portal de Demonstração - Dados Fictícios</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
