import { useState } from "react";
import { Headset, Plus, AlertCircle, FileText, MessageSquare, X, Clock, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import BackButton from "@/components/BackButton";
import UserMenu from "@/components/UserMenu";
import { userTickets, getStatusColor, getPriorityColor, getStatusLabel, getPriorityLabel } from "@/lib/trainingData";

/**
 * Design Philosophy: Glassmorphism Futurista
 * - Página de Suporte com diálogo de seleção de tipo de chamado
 * - Formulários padrão para Requisição e Incidente
 * - Lista de chamados do usuário
 */

type TicketType = "requisition" | "incident" | "request" | null;

export default function SupportTickets() {
  const [, setLocation] = useLocation();
  const [selectedType, setSelectedType] = useState<TicketType>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    priority: "medium"
  });

  const handleCreateTicket = () => {
    console.log("Criando ticket:", { type: selectedType, ...formData });
    setFormData({ title: "", category: "", description: "", priority: "medium" });
    setSelectedType(null);
    setShowForm(false);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "requisition":
        return "Requisição";
      case "incident":
        return "Incidente";
      case "request":
        return "Solicitação";
      default:
        return "Desconhecido";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "requisition":
        return <FileText className="w-5 h-5" />;
      case "incident":
        return <AlertCircle className="w-5 h-5" />;
      case "request":
        return <MessageSquare className="w-5 h-5" />;
      default:
        return null;
    }
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
                  <h1 className="text-white font-bold">Suporte Técnico</h1>
                  <p className="text-gray-300 text-xs">Abra um chamado ou acompanhe suas solicitações</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <BackButton onClick={() => setLocation("/dashboard")} />
                <div className="pl-4 border-l border-white/20">
                  <UserMenu showHome={false} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dialog de Seleção */}
          {!showForm && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Plus className="w-6 h-6 text-cyan-400" />
                Criar Novo Chamado
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Requisição */}
                <button
                  onClick={() => {
                    setSelectedType("requisition");
                    setShowForm(true);
                  }}
                  className="glassmorphic rounded-lg p-6 border border-white/10 hover:border-cyan-400/50 transition-all group"
                >
                  <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-500 mb-4 group-hover:from-cyan-300 group-hover:to-cyan-400 transition-all shadow-lg group-hover:shadow-cyan-400/50">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-3">Nova Requisição</h3>
                  <p className="text-gray-200 text-sm leading-relaxed font-medium">
                    Solicite software, hardware ou outros recursos necessários para seu trabalho
                  </p>
                </button>

                {/* Incidente */}
                <button
                  onClick={() => {
                    setSelectedType("incident");
                    setShowForm(true);
                  }}
                  className="glassmorphic rounded-lg p-6 border border-white/10 hover:border-cyan-400/50 transition-all group"
                >
                  <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-red-400 to-red-500 mb-4 group-hover:from-red-300 group-hover:to-red-400 transition-all shadow-lg group-hover:shadow-red-400/50">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-3">Relatar Incidente</h3>
                  <p className="text-gray-200 text-sm leading-relaxed font-medium">
                    Reporte problemas técnicos, falhas ou erros urgentes que afetam seu trabalho
                  </p>
                </button>

                {/* Solicitação */}
                <button
                  onClick={() => {
                    setSelectedType("request");
                    setShowForm(true);
                  }}
                  className="glassmorphic rounded-lg p-6 border border-white/10 hover:border-cyan-400/50 transition-all group"
                >
                  <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 mb-4 group-hover:from-blue-300 group-hover:to-blue-400 transition-all shadow-lg group-hover:shadow-blue-400/50">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-3">Escrever Solicitação</h3>
                  <p className="text-gray-200 text-sm leading-relaxed font-medium">
                    Envie uma solicitação customizada ou dúvida geral ao departamento
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Formulário */}
          {showForm && selectedType && (
            <div className="mb-8 glassmorphic rounded-lg p-8 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-400/20">
                    {getTypeIcon(selectedType)}
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {getTypeLabel(selectedType)}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setSelectedType(null);
                    setFormData({ title: "", category: "", description: "", priority: "medium" });
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Título */}
                <div>
                  <label className="block text-white font-bold mb-2">Título</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Descreva brevemente o assunto"
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-white font-bold mb-3 text-lg">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-white/15 to-white/10 border-2 border-cyan-400/50 text-white font-semibold focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-400/50 transition-all hover:border-cyan-400 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-gray-800 text-white">📋 Selecione uma categoria</option>
                    <option value="Software" className="bg-gray-800 text-white">💻 Software</option>
                    <option value="Hardware" className="bg-gray-800 text-white">🖥️ Hardware</option>
                    <option value="Rede" className="bg-gray-800 text-white">🌐 Rede</option>
                    <option value="Periféricos" className="bg-gray-800 text-white">🖱️ Periféricos</option>
                    <option value="Acesso" className="bg-gray-800 text-white">🔐 Acesso</option>
                    <option value="Outro" className="bg-gray-800 text-white">❓ Outro</option>
                  </select>
                </div>

                {/* Prioridade */}
                <div>
                  <label className="block text-white font-bold mb-3 text-lg">Prioridade</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-white/15 to-white/10 border-2 border-cyan-400/50 text-white font-semibold focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-400/50 transition-all hover:border-cyan-400 appearance-none cursor-pointer"
                  >
                    <option value="low" className="bg-gray-800 text-white">🟢 Baixa</option>
                    <option value="medium" className="bg-gray-800 text-white">🟡 Média</option>
                    <option value="high" className="bg-gray-800 text-white">🟠 Alta</option>
                    <option value="critical" className="bg-gray-800 text-white">🔴 Crítica</option>
                  </select>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-white font-bold mb-2">Descrição Detalhada</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva detalhadamente o problema ou solicitação"
                    rows={6}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-all resize-none"
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleCreateTicket}
                    className="flex-1 px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 text-gray-900 font-bold hover:from-cyan-300 hover:to-cyan-400 transition-all shadow-lg hover:shadow-cyan-400/50"
                  >
                    Criar Chamado
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setSelectedType(null);
                      setFormData({ title: "", category: "", description: "", priority: "medium" });
                    }}
                    className="flex-1 px-6 py-2 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Chamados */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-cyan-400" />
              Meus Chamados ({userTickets.length})
            </h2>

            <div className="space-y-4">
              {userTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="glassmorphic rounded-lg p-6 border border-white/10 hover:border-cyan-400/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(ticket.status)}`}>
                          {getStatusLabel(ticket.status)}
                        </span>
                        <span className={`flex items-center gap-1 text-xs font-bold ${getPriorityColor(ticket.priority)}`}>
                          <AlertTriangle className="w-3 h-3" />
                          {getPriorityLabel(ticket.priority)}
                        </span>
                      </div>
                      <h3 className="text-white font-bold text-lg mb-1">{ticket.title}</h3>
                      <p className="text-gray-400 text-sm mb-3">{ticket.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Tipo</p>
                          <p className="text-white">{getTypeLabel(ticket.type)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Categoria</p>
                          <p className="text-white">{ticket.category}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Criado em</p>
                          <p className="text-white">{new Date(ticket.createdAt).toLocaleDateString("pt-BR")}</p>
                        </div>
                        {ticket.dueDate && (
                          <div>
                            <p className="text-gray-500">Prazo</p>
                            <p className="text-white">{new Date(ticket.dueDate).toLocaleDateString("pt-BR")}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-gray-500 text-xs">ID</p>
                      <p className="text-cyan-400 font-mono text-sm">{ticket.id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
