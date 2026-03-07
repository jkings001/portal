import React from 'react';
import { TicketIcon, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

/**
 * KPICards - Componente de cards de métricas principais
 * 
 * Design: Glassmorphism com 4 cards destacados
 * Cores: Ciano (#06B6D4), Vermelho (#EF4444), Amarelo (#F59E0B), Verde (#10B981)
 * 
 * Props:
 * - data: Objeto com totalTickets, pendingTickets, inProgressTickets, resolvedTickets
 */

interface KPICardsProps {
  data: {
    totalTickets: number;
    pendingTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
  };
}

const KPICards: React.FC<KPICardsProps> = ({ data }) => {
  const cards = [
    {
      title: 'Total de Chamados',
      value: data.totalTickets,
      icon: TicketIcon,
      color: 'from-cyan-500 to-blue-600',
      bgColor: 'bg-cyan-500/20',
      textColor: 'text-cyan-400',
      trend: '+12% este mês',
    },
    {
      title: 'Chamados Pendentes',
      value: data.pendingTickets,
      icon: AlertCircle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-400',
      trend: 'Requer atenção',
    },
    {
      title: 'Em Andamento',
      value: data.inProgressTickets,
      icon: Clock,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-500/20',
      textColor: 'text-amber-400',
      trend: 'Processando',
    },
    {
      title: 'Resolvidos',
      value: data.resolvedTickets,
      icon: CheckCircle2,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-400',
      trend: '+8% esta semana',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="group relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 hover:bg-white/10 cursor-pointer overflow-hidden"
          >
            {/* Fundo gradiente animado */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

            {/* Conteúdo */}
            <div className="relative z-10">
              {/* Ícone com gradiente */}
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <Icon size={24} className="text-white" />
              </div>

              {/* Título */}
              <h3 className="text-slate-400 text-sm font-medium mb-2 group-hover:text-slate-300 transition-colors">
                {card.title}
              </h3>

              {/* Número grande */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {card.value}
                </span>
              </div>

              {/* Trend/Status */}
              <p className={`text-xs font-medium ${card.textColor} group-hover:brightness-110 transition-all`}>
                {card.trend}
              </p>
            </div>

            {/* Linha divisória inferior */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
          </div>
        );
      })}
    </div>
  );
};

export default KPICards;
