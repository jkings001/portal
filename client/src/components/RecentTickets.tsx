import React, { useState } from 'react';
import { ChevronRight, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

/**
 * RecentTickets - Tabela de chamados recentes com layout responsivo
 * 
 * Design: Glassmorphism com layout adaptativo
 * Desktop: Tabela completa
 * Mobile: Cards empilhados
 */

interface Ticket {
  id: string;
  title: string;
  user: string;
  department: string;
  status: 'pendente' | 'em_andamento' | 'resolvido';
  priority: 'alta' | 'média' | 'baixa';
  createdAt: string;
}

interface RecentTicketsProps {
  tickets: Ticket[];
}

const RecentTickets: React.FC<RecentTicketsProps> = ({ tickets }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <AlertCircle size={16} className="text-red-400" />;
      case 'em_andamento':
        return <Clock size={16} className="text-amber-400" />;
      case 'resolvido':
        return <CheckCircle2 size={16} className="text-green-400" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'em_andamento':
        return 'Em Andamento';
      case 'resolvido':
        return 'Resolvido';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'em_andamento':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'resolvido':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'bg-red-500/20 text-red-300';
      case 'média':
        return 'bg-amber-500/20 text-amber-300';
      case 'baixa':
        return 'bg-blue-500/20 text-blue-300';
      default:
        return 'bg-slate-500/20 text-slate-300';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'alta':
        return '🔴 Alta';
      case 'média':
        return '🟡 Média';
      case 'baixa':
        return '🟢 Baixa';
      default:
        return priority;
    }
  };

  if (tickets.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="text-slate-400 mb-2 text-2xl">📭</div>
        <p className="text-slate-400 font-medium text-sm sm:text-base">Nenhum chamado encontrado</p>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">Tente ajustar seus filtros ou busca</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">ID</th>
              <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Título</th>
              <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Usuário</th>
              <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Departamento</th>
              <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Prioridade</th>
              <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Data</th>
              <th className="text-center px-2 sm:px-4 py-2 sm:py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Ação</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket, index) => (
              <tr
                key={ticket.id}
                className={`border-b border-white/5 hover:bg-white/5 transition-colors duration-300 cursor-pointer group ${
                  index % 2 === 0 ? 'bg-white/2' : 'bg-transparent'
                }`}
              >
                <td className="px-2 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors">
                  {ticket.id}
                </td>
                <td className="px-2 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm text-white group-hover:text-cyan-100 transition-colors max-w-xs truncate">
                  {ticket.title}
                </td>
                <td className="px-2 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm text-slate-300 hidden md:table-cell">
                  {ticket.user}
                </td>
                <td className="px-2 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm text-slate-400 hidden lg:table-cell">
                  {ticket.department}
                </td>
                <td className="px-2 sm:px-4 py-2 sm:py-4">
                  <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-lg border text-xs font-medium w-fit ${getStatusColor(ticket.status)}`}>
                    {getStatusIcon(ticket.status)}
                    <span className="hidden sm:inline">{getStatusLabel(ticket.status)}</span>
                  </div>
                </td>
                <td className="px-2 sm:px-4 py-2 sm:py-4">
                  <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                    {getPriorityLabel(ticket.priority)}
                  </span>
                </td>
                <td className="px-2 sm:px-4 py-2 sm:py-4 text-xs sm:text-sm text-slate-400 hidden sm:table-cell">
                  {ticket.createdAt}
                </td>
                <td className="px-2 sm:px-4 py-2 sm:py-4 text-center">
                  <button className="p-1 sm:p-2 hover:bg-white/10 rounded-lg transition-all duration-300 group/btn opacity-0 group-hover:opacity-100">
                    <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px] text-slate-400 group-hover/btn:text-cyan-400 transition-colors" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Hidden on desktop */}
      <div className="sm:hidden space-y-3">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 hover:bg-slate-700 transition-colors"
          >
            {/* Header com ID e Status */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-cyan-400">{ticket.id}</div>
                <h3 className="text-sm font-semibold text-white truncate">{ticket.title}</h3>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium flex-shrink-0 ${getStatusColor(ticket.status)}`}>
                {getStatusIcon(ticket.status)}
              </div>
            </div>

            {/* Detalhes */}
            <div className="space-y-1.5 text-xs text-slate-300 mb-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Usuário:</span>
                <span>{ticket.user}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Departamento:</span>
                <span>{ticket.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Data:</span>
                <span>{ticket.createdAt}</span>
              </div>
            </div>

            {/* Prioridade e Ação */}
            <div className="flex items-center justify-between gap-2">
              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                {getPriorityLabel(ticket.priority)}
              </span>
              <button 
                onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
              >
                <ChevronRight size={16} className="text-slate-400 hover:text-cyan-400 transition-colors" />
              </button>
            </div>

            {/* Detalhes expandidos */}
            {expandedId === ticket.id && (
              <div className="mt-3 pt-3 border-t border-slate-600">
                <p className="text-xs text-slate-400">Status: <span className="text-white">{getStatusLabel(ticket.status)}</span></p>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default RecentTickets;
