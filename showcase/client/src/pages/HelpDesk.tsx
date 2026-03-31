import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { helpDeskData } from "@/lib/mockData";
import { ArrowLeft, Plus, Filter } from "lucide-react";
import { useState } from "react";
import AuroraBackground from "@/components/AuroraBackground";

export default function HelpDesk() {
  const [, setLocation] = useLocation();
  const [filterStatus, setFilterStatus] = useState("all");

  const statusColors = {
    "Em Andamento": "bg-blue-500/20 text-blue-400",
    "Resolvido": "bg-green-500/20 text-green-400",
    "Aguardando": "bg-yellow-500/20 text-yellow-400",
    "Aberto": "bg-red-500/20 text-red-400",
  };

  const priorityColors = {
    "Crítica": "bg-red-500/20 text-red-400",
    "Alta": "bg-orange-500/20 text-orange-400",
    "Média": "bg-yellow-500/20 text-yellow-400",
    "Baixa": "bg-green-500/20 text-green-400",
  };

  const filteredTickets = filterStatus === "all"
    ? helpDeskData.tickets
    : helpDeskData.tickets.filter(t => t.status === filterStatus);

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
              <h1 className="text-2xl font-bold text-white">Help Desk 24/7</h1>
            </div>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
              <Plus size={20} className="mr-2" />
              Novo Ticket
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="glass p-4 rounded-xl text-center">
              <p className="text-3xl font-bold text-cyan-400">{helpDeskData.tickets.length}</p>
              <p className="text-gray-300 text-sm mt-2">Total de Tickets</p>
            </div>
            <div className="glass p-4 rounded-xl text-center">
              <p className="text-3xl font-bold text-blue-400">{helpDeskData.tickets.filter(t => t.status === "Em Andamento").length}</p>
              <p className="text-gray-300 text-sm mt-2">Em Andamento</p>
            </div>
            <div className="glass p-4 rounded-xl text-center">
              <p className="text-3xl font-bold text-green-400">{helpDeskData.tickets.filter(t => t.status === "Resolvido").length}</p>
              <p className="text-gray-300 text-sm mt-2">Resolvidos</p>
            </div>
            <div className="glass p-4 rounded-xl text-center">
              <p className="text-3xl font-bold text-yellow-400">{helpDeskData.tickets.filter(t => t.status === "Aguardando").length}</p>
              <p className="text-gray-300 text-sm mt-2">Aguardando</p>
            </div>
          </div>

          {/* Filters */}
          <div className="glass p-6 rounded-xl mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <Filter size={20} className="text-cyan-400" />
              <span className="text-gray-300 font-semibold">Filtrar por status:</span>
              <div className="flex gap-2 flex-wrap">
                {["all", "Em Andamento", "Resolvido", "Aguardando", "Aberto"].map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? "default" : "outline"}
                    className={`${
                      filterStatus === status
                        ? "bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                        : "border-white/30 text-white hover:bg-white/10"
                    }`}
                    onClick={() => setFilterStatus(status)}
                  >
                    {status === "all" ? "Todos" : status}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Tickets List */}
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="glass p-6 rounded-xl hover:bg-white/20 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-cyan-400 font-bold text-lg">{ticket.id}</span>
                      <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition">
                        {ticket.title}
                      </h3>
                    </div>
                    <p className="text-gray-400 text-sm">Criado em: {ticket.createdAt}</p>
                  </div>
                  <div className="flex gap-2 flex-col items-end">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        priorityColors[ticket.priority as keyof typeof priorityColors]
                      }`}
                    >
                      {ticket.priority}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        statusColors[ticket.status as keyof typeof statusColors]
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Categoria</p>
                    <p className="text-white font-semibold">{ticket.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Atribuído a</p>
                    <p className="text-white font-semibold">{ticket.assignee}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-400 text-xs mb-1">Ações</p>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs">
                        Visualizar
                      </Button>
                      <Button size="sm" className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs">
                        Comentar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredTickets.length === 0 && (
            <div className="glass p-12 rounded-xl text-center">
              <p className="text-gray-400 text-lg mb-4">Nenhum ticket encontrado</p>
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
                <Plus size={20} className="mr-2" />
                Criar Novo Ticket
              </Button>
            </div>
          )}
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
