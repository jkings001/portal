import { useState } from "react";
import { FileText, CheckCircle2, Package, AlertTriangle, Wrench, BarChart3, ChevronLeft, Plus, Search, Filter, FileCheck, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import BackButton from "@/components/BackButton";

/**
 * VIGIX - Sistema de Gestão da Qualidade
 * Módulos: GED, Qualidade, Registro de Produto, Gerenciamento de Riscos, Calibração, Indicadores, Contratos, Ocorrências
 */

interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
}

const modules: Module[] = [
  {
    id: "contratos",
    title: "Gestão de Contratos",
    description: "Gestão completa de contratos com lembretes automáticos e indicadores",
    icon: <FileCheck className="w-8 h-8" />,
    color: "from-emerald-500 to-teal-500",
    features: [
      "Cadastro e armazenamento de contratos",
      "Lembretes automáticos de vencimento",
      "Resumo de informações principais",
      "Dashboard de indicadores de contratos",
      "Histórico de renovações e atualizações",
      "Alertas de cláusulas críticas"
    ]
  },
  {
    id: "ocorrencias",
    title: "Ocorrências de Qualidade",
    description: "Gestão sistemática de eventos que comprometem a qualidade",
    icon: <AlertCircle className="w-8 h-8" />,
    color: "from-rose-500 to-red-500",
    features: [
      "Identificação e registro de ocorrências",
      "Análise de causa raiz (RCA)",
      "Planos de ação corretiva",
      "Rastreamento de status e responsáveis",
      "Histórico completo de ocorrências",
      "Relatórios de tendências e padrões"
    ]
  },
  {
    id: "ged",
    title: "GED - Gestão de Documentos",
    description: "Controle completo do ciclo de vida de documentos com aprovações eletrônicas",
    icon: <FileText className="w-8 h-8" />,
    color: "from-blue-500 to-cyan-500",
    features: [
      "Elaboração, revisão e aprovação de documentos",
      "Lista mestra de controles de acesso",
      "Histórico de revisões e versões",
      "Gerenciamento de cópias controladas",
      "Notificações de alterações e vencimentos",
      "Treinamento de documentos"
    ]
  },
  {
    id: "qualidade",
    title: "Qualidade",
    description: "Controle e gerenciamento de processos de qualidade",
    icon: <CheckCircle2 className="w-8 h-8" />,
    color: "from-green-500 to-emerald-500",
    features: [
      "Planos de amostragem e inspeção",
      "Controle de qualidade de matérias-primas",
      "Controle de qualidade de produtos acabados",
      "Rastreabilidade de lotes",
      "Relatórios de não-conformidades",
      "Análise de tendências"
    ]
  },
  {
    id: "registro",
    title: "Registro de Produto",
    description: "Gestão completa do registro e regularização de produtos",
    icon: <Package className="w-8 h-8" />,
    color: "from-purple-500 to-pink-500",
    features: [
      "Cadastro de produtos e variações",
      "Gestão de registros ANVISA",
      "Documentação regulatória",
      "Histórico de alterações de registro",
      "Alertas de vencimento de registros",
      "Conformidade com normativas"
    ]
  },
  {
    id: "riscos",
    title: "Gerenciamento de Riscos",
    description: "Identificação, avaliação e mitigação de riscos operacionais",
    icon: <AlertTriangle className="w-8 h-8" />,
    color: "from-red-500 to-orange-500",
    features: [
      "Matriz de riscos e oportunidades",
      "Análise FMEA (Failure Mode and Effects Analysis)",
      "Planos de ação e mitigação",
      "Monitoramento de riscos",
      "Relatórios de risco",
      "Conformidade com ISO 31000"
    ]
  },
  {
    id: "calibracao",
    title: "Calibração",
    description: "Gestão de calibração e manutenção de equipamentos",
    icon: <Wrench className="w-8 h-8" />,
    color: "from-indigo-500 to-blue-500",
    features: [
      "Cadastro de equipamentos",
      "Planos de calibração",
      "Registro de calibrações",
      "Alertas de calibração vencida",
      "Certificados de calibração",
      "Fornecedores de calibração"
    ]
  },
  {
    id: "indicadores",
    title: "Indicadores",
    description: "Monitoramento de indicadores de desempenho e qualidade",
    icon: <BarChart3 className="w-8 h-8" />,
    color: "from-yellow-500 to-orange-500",
    features: [
      "Definição de KPIs",
      "Coleta de dados automática",
      "Dashboards em tempo real",
      "Gráficos e análises",
      "Alertas de desvios",
      "Relatórios gerenciais"
    ]
  }
];

export default function Vigix() {
  const [, setLocation] = useLocation();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredModules = modules.filter(module =>
    module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleModuleClick = (moduleId: string) => {
    setSelectedModule(selectedModule === moduleId ? null : moduleId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-cyan-500/20 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent mb-2">
                  VIGIX
                </h1>
                <p className="text-cyan-200 text-lg">
                  Sistema Integrado de Gestão da Qualidade
                </p>
              </div>
              <BackButton />
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-cyan-400" />
                <input
                  type="text"
                  placeholder="Buscar módulo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-cyan-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-sm"
                />
              </div>
              <button className="px-4 py-2 bg-white/10 border border-cyan-500/30 rounded-lg text-cyan-300 hover:bg-white/20 transition-all flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtrar
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredModules.map((module) => (
              <div
                key={module.id}
                onClick={() => handleModuleClick(module.id)}
                className="group cursor-pointer"
              >
                <div className="h-full glassmorphic p-6 rounded-xl border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20">
                  {/* Icon and Title */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${module.color} text-white shadow-lg`}>
                      {module.icon}
                    </div>
                    <ChevronLeft className={`w-5 h-5 text-cyan-400 transition-transform duration-300 ${selectedModule === module.id ? "rotate-90" : ""}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-cyan-300 mb-2">
                    {module.title}
                  </h3>
                  <p className="text-gray-300 text-sm mb-4">
                    {module.description}
                  </p>

                  {/* Features List */}
                  {selectedModule === module.id && (
                    <div className="mt-6 pt-6 border-t border-cyan-500/20 space-y-2 animate-in fade-in duration-300">
                      {module.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Button */}
                  <button className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-300 hover:text-cyan-200 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group/btn">
                    <Plus className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    Acessar Módulo
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredModules.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">
                Nenhum módulo encontrado para "{searchTerm}"
              </p>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Compliance */}
            <div className="glassmorphic p-8 rounded-xl border border-cyan-500/20">
              <h3 className="text-2xl font-bold text-cyan-300 mb-4">
                Conformidade Regulatória
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-gray-300">ANVISA - Agência Nacional de Vigilância Sanitária</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-gray-300">PADI - Programa de Acreditação de Distribuidoras</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-gray-300">ONA - Organização Nacional de Acreditação</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-gray-300">ISO 27001 - Segurança da Informação</span>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="glassmorphic p-8 rounded-xl border border-cyan-500/20">
              <h3 className="text-2xl font-bold text-cyan-300 mb-4">
                Benefícios Principais
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-gray-300">Otimização de processos e eficiência operacional</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-gray-300">Rastreabilidade completa de operações</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-gray-300">Redução de riscos e não-conformidades</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-gray-300">Tomada de decisão baseada em dados</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
