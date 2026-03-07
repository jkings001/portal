import React from 'react';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';

/**
 * AdminNotifications - Dropdown de notificações em tempo real
 * 
 * Design: Glassmorphism com notificações coloridas
 * Exibe: Novos chamados, atualizações, alertas
 */

interface Notification {
  id: string;
  type: 'alert' | 'success' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface AdminNotificationsProps {
  onClose: () => void;
}

const AdminNotifications: React.FC<AdminNotificationsProps> = ({ onClose }) => {
  const [notifications] = React.useState<Notification[]>([
    {
      id: '1',
      type: 'alert',
      title: 'Novo Chamado Urgente',
      message: 'Erro crítico ao fazer login no portal',
      time: '2 minutos atrás',
      read: false,
    },
    {
      id: '2',
      type: 'alert',
      title: 'Chamado Pendente',
      message: 'TK-005 aguardando resposta há 3 horas',
      time: '15 minutos atrás',
      read: false,
    },
    {
      id: '3',
      type: 'success',
      title: 'Chamado Resolvido',
      message: 'TK-003 foi marcado como resolvido',
      time: '1 hora atrás',
      read: true,
    },
    {
      id: '4',
      type: 'info',
      title: 'Atualização de Sistema',
      message: 'Manutenção programada para hoje às 22h',
      time: '3 horas atrás',
      read: true,
    },
  ]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertCircle size={18} className="text-red-400" />;
      case 'success':
        return <CheckCircle2 size={18} className="text-green-400" />;
      case 'info':
        return <Info size={18} className="text-blue-400" />;
      default:
        return null;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'alert':
        return 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20';
      case 'success':
        return 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20';
      default:
        return 'bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="absolute top-16 right-0 w-96 max-w-[calc(100vw-24px)] bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h3 className="text-lg font-bold text-white">Notificações</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors duration-300"
        >
          <X size={20} className="text-slate-400" />
        </button>
      </div>

      {/* Notificações */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>Nenhuma notificação</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-6 py-4 border-b border-white/5 transition-all duration-300 cursor-pointer ${getNotificationColor(notification.type)} ${
                !notification.read ? 'bg-white/5' : ''
              }`}
            >
              <div className="flex gap-4">
                {/* Ícone */}
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-white">
                      {notification.title}
                    </h4>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-cyan-500 rounded-full flex-shrink-0 mt-1.5"></div>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    {notification.time}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10 bg-white/2">
        <button className="w-full text-center text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors duration-300">
          Ver todas as notificações
        </button>
      </div>
    </div>
  );
};

export default AdminNotifications;
