import React from 'react';
import { ChevronRight, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

/**
 * RecentTickets - Tabela de chamados recentes
 * 
 * Design: Glassmorphism com linhas alternadas
 * Exibe: ID, Título, Usuário, Departamento, Status, Prioridade, Data
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
      <div className="text-center py-12">
        <div className="text-slate-400 mb-2">📭</div>
        <p className="text-slate-400 font-medium">Nenhum chamado encontrado</p>
        <p className="text-slate-500 text-sm mt-1">Tente ajustar seus filtros ou busca</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">ID</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Título</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Usuário</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Departamento</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Prioridade</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Data</th>
            <th className="text-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Ação</th>
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
              {/* ID */}
              <td className="px-4 py-4 text-sm font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors">
                {ticket.id}
              </td>

              {/* Título */}
              <td className="px-4 py-4 text-sm text-white group-hover:text-cyan-100 transition-colors max-w-xs truncate">
                {ticket.title}
              </td>

              {/* Usuário */}
              <td className="px-4 py-4 text-sm text-slate-300 hidden md:table-cell">
                {ticket.user}
              </td>

              {/* Departamento */}
              <td className="px-4 py-4 text-sm text-slate-400 hidden lg:table-cell">
                {ticket.department}
              </td>

              {/* Status */}
              <td className="px-4 py-4">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-medium w-fit ${getStatusColor(ticket.status)}`}>
                  {getStatusIcon(ticket.status)}
                  <span>{getStatusLabel(ticket.status)}</span>
                </div>
              </td>

              {/* Prioridade */}
              <td className="px-4 py-4">
                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                  {getPriorityLabel(ticket.priority)}
                </span>
              </td>

              {/* Data */}
              <td className="px-4 py-4 text-sm text-slate-400 hidden sm:table-cell">
                {ticket.createdAt}
              </td>

              {/* Ação */}
              <td className="px-4 py-4 text-center">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300 group/btn opacity-0 group-hover:opacity-100">
                  <ChevronRight size={18} className="text-slate-400 group-hover/btn:text-cyan-400 transition-colors" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentTickets;
