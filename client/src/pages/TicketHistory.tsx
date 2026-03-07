import { useState } from "react";
import { Clock, Filter, Search, Eye, Download, AlertCircle, CheckCircle, Clock as ClockIcon } from "lucide-react";
import { useLocation } from "wouter";
import BackButton from "@/components/BackButton";
import UserMenu from "@/components/UserMenu";
import { userTickets, getStatusColor, getPriorityColor, getStatusLabel, getPriorityLabel } from "@/lib/trainingData";

/**
 * Design Philosophy: Glassmorphism Futurista
 * - Página de Histórico de Chamados com listagem completa
 * - Filtros por tipo e status
 * - Visualização detalhada de cada chamado
 */

type FilterType = "all" | "requisition" | "incident" | "request";
type FilterStatus = "all" | "open" | "in_progress" | "resolved" | "closed";

export default function TicketHistory() {
  const [, setLocation] = useLocation();
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

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
        return "📋";
      case "incident":
        return "🚨";
      case "request":
        return "💬";
      default:
        return "❓";
    }
  };

  const filteredTickets = userTickets.filter((ticket) => {
    const matchesType = filterType === "all" || ticket.type === filterType;
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const stats = {
    total: userTickets.length,
    open: userTickets.filter((t) => t.status === "open").length,
    inProgress: userTickets.filter((t) => t.status === "in_progress").length,
    resolved: userTickets.filter((t) => t.status === "resolved").length,
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
                  <h1 className="text-white font-bold">Histórico de Chamados</h1>
                  <p className="text-gray-300 text-xs">Acompanhe todos os seus chamados, requisições e incidentes</p>
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
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="glassmorphic rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total de Chamados</p>
                  <p className="text-white text-2xl font-bold">{stats.total}</p>
                </div>
                <Clock className="w-8 h-8 text-cyan-400" />
              </div>
            </div>

            <div className="glassmorphic rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Abertos</p>
                  <p className="text-white text-2xl font-bold">{stats.open}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>

            <div className="glassmorphic rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Em Andamento</p>
                  <p className="text-white text-2xl font-bold">{stats.inProgress}</p>
                </div>
                <ClockIcon className="w-8 h-8 text-yellow-400" />
              </div>
            </div>

            <div className="glassmorphic rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Resolvidos</p>
                  <p className="text-white text-2xl font-bold">{stats.resolved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="glassmorphic rounded-lg p-6 border border-white/10 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-cyan-400" />
              <h2 className="text-white font-bold text-lg">Filtros</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Busca */}
              <div>
                <label className="block text-white font-bold mb-2 text-sm">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ID ou título do chamado..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>
              </div>

              {/* Filtro por Tipo */}
              <div>
                <label className="block text-white font-bold mb-2 text-sm">Tipo</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                  className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-white/15 to-white/10 border-2 border-cyan-400/50 text-white font-semibold focus:outline-none focus:border-cyan-400 transition-all"
                >
                  <option value="all" className="bg-gray-800 text-white">📋 Todos os Tipos</option>
                  <option value="requisition" className="bg-gray-800 text-white">📋 Requisições</option>
                  <option value="incident" className="bg-gray-800 text-white">🚨 Incidentes</option>
                  <option value="request" className="bg-gray-800 text-white">💬 Solicitações</option>
                </select>
              </div>

              {/* Filtro por Status */}
              <div>
                <label className="block text-white font-bold mb-2 text-sm">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                  className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-white/15 to-white/10 border-2 border-cyan-400/50 text-white font-semibold focus:outline-none focus:border-cyan-400 transition-all"
                >
                  <option value="all" className="bg-gray-800 text-white">📊 Todos os Status</option>
                  <option value="open" className="bg-gray-800 text-white">🔴 Aberto</option>
                  <option value="in_progress" className="bg-gray-800 text-white">🟡 Em Andamento</option>
                  <option value="resolved" className="bg-gray-800 text-white">🟢 Resolvido</option>
                  <option value="closed" className="bg-gray-800 text-white">⚫ Fechado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Chamados */}
          <div className="space-y-4">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="glassmorphic rounded-lg p-6 border border-white/10 hover:border-cyan-400/50 transition-all cursor-pointer group"
                  onClick={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getTypeIcon(ticket.type)}</span>
                        <div>
                          <h3 className="text-white font-bold text-lg">{ticket.title}</h3>
                          <p className="text-gray-400 text-sm">ID: {ticket.id}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(ticket.status)}`}>
                          {getStatusLabel(ticket.status)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(ticket.priority)}`}>
                          {getPriorityLabel(ticket.priority)}
                        </span>
                        <span className="text-gray-400 text-xs">
                          Tipo: {getTypeLabel(ticket.type)}
                        </span>
                        <span className="text-gray-400 text-xs">
                          Criado em: {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        className="p-2 hover:bg-white/10 rounded-lg transition-all text-cyan-400 hover:text-cyan-300"
                        title="Visualizar detalhes"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        className="p-2 hover:bg-white/10 rounded-lg transition-all text-cyan-400 hover:text-cyan-300"
                        title="Baixar"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Detalhes Expandidos */}
                  {selectedTicket === ticket.id && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Categoria</p>
                          <p className="text-white font-semibold">{ticket.category}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Atualizado em</p>
                          <p className="text-white font-semibold">{new Date(ticket.updatedAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-gray-400 text-sm mb-2">Descrição</p>
                        <p className="text-gray-200 text-sm leading-relaxed">{ticket.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="glassmorphic rounded-lg p-12 border border-white/10 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Nenhum chamado encontrado com os filtros selecionados</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
