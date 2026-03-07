import React, { useState } from 'react';
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Bell, Menu, X, Plus, MessageSquare, Clock, CheckCircle2, AlertCircle, LogOut, ToggleLeft, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * UserDashboard - Dashboard para usuários comuns
 * 
 * Design: Mais simples e focado em chamados pessoais
 * Exibe: Meus chamados, histórico, status
 */

const UserDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [filterStatus, setFilterStatus] = useState('todos');

  // Redirecionar para /dashboard
  useEffect(() => {
    setLocation('/dashboard');
  }, [setLocation]);

  // Dados mockados de chamados do usuário
  const myTickets = [
    {
      id: 'TK-001',
      title: 'Erro ao fazer login no portal',
      status: 'pendente',
      priority: 'alta',
      createdAt: '2026-01-28 10:30',
      description: 'Não consigo acessar o portal com minha senha',
    },
    {
      id: 'TK-002',
      title: 'Solicitar acesso ao servidor de arquivos',
      status: 'em_andamento',
      priority: 'média',
      createdAt: '2026-01-28 09:15',
      description: 'Preciso de acesso ao servidor de arquivos compartilhados',
    },
    {
      id: 'TK-003',
      title: 'Problema resolvido com email',
      status: 'resolvido',
      priority: 'baixa',
      createdAt: '2026-01-27 16:45',
      description: 'Email corporativo funcionando normalmente',
    },
  ];

  const filteredTickets = filterStatus === 'todos' 
    ? myTickets 
    : myTickets.filter(t => t.status === filterStatus);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <AlertCircle size={18} />;
      case 'em_andamento':
        return <Clock size={18} />;
      case 'resolvido':
        return <CheckCircle2 size={18} />;
      default:
        return <MessageSquare size={18} />;
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleSwitchToAdmin = () => {
    window.location.href = '/admin';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-slate-900/95 to-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
              JK
            </div>
            <h1 className="text-xl font-bold text-white hidden sm:block">JKINGS Portal</h1>
          </div>

          {/* Menu Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-300"
          >
            {showMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Menu Dropdown */}
        {showMenu && (
          <div className="absolute top-16 right-0 w-72 bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden">
            {/* Perfil */}
            <div className="px-6 py-6 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-blue-600/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {currentUser?.avatar || 'US'}
                </div>
                <div>
                  <h4 className="text-white font-bold">{currentUser?.name || 'Usuário'}</h4>
                  <p className="text-slate-400 text-sm">{currentUser?.email}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="py-2">
              <button className="w-full flex items-center gap-3 px-6 py-3 text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-300">
                <MessageSquare size={18} />
                <span className="font-medium">Meus Chamados</span>
              </button>
              <button className="w-full flex items-center gap-3 px-6 py-3 text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-300">
                <Clock size={18} />
                <span className="font-medium">Histórico</span>
              </button>
            </nav>

            {/* Divider */}
            <div className="border-t border-white/10"></div>

            {/* Trocar para Admin */}
            {currentUser?.role === 'admin' && (
              <>
                <button
                  onClick={handleSwitchToAdmin}
                  className="w-full flex items-center gap-3 px-6 py-3 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all duration-300 font-medium"
                >
                  <ToggleLeft size={18} />
                  <span>Voltar para Admin</span>
                </button>
                <div className="border-t border-white/10"></div>
              </>
            )}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-6 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 font-medium"
            >
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo, {currentUser?.name?.split(' ')[0]}!</h2>
              <p className="text-slate-400">Acompanhe seus chamados e solicitações</p>
            </div>
            {currentUser?.role === 'admin' && (
              <a
                href="/admin"
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                <Shield size={20} />
                <span>Painel Admin</span>
              </a>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              {
                label: 'Total de Chamados',
                value: myTickets.length,
                icon: <MessageSquare size={24} />,
                color: 'from-blue-500 to-cyan-500',
              },
              {
                label: 'Em Andamento',
                value: myTickets.filter(t => t.status === 'em_andamento').length,
                icon: <Clock size={24} />,
                color: 'from-amber-500 to-orange-500',
              },
              {
                label: 'Resolvidos',
                value: myTickets.filter(t => t.status === 'resolvido').length,
                icon: <CheckCircle2 size={24} />,
                color: 'from-green-500 to-emerald-500',
              },
            ].map((stat, index) => (
              <div key={index} className="admin-kpi-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Meus Chamados */}
          <div className="admin-card">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-white/10">
              <div>
                <h3 className="text-2xl font-bold text-white" style={{fontSize: '18px', width: '245px'}}>Meus Chamados</h3>
                <p className="text-slate-400 text-sm mt-1">Acompanhe o status de suas solicitações</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-300">
                <Plus size={18} />
                <span>Novo Chamado</span>
              </button>
            </div>

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap mb-6">
              {[
                { value: 'todos', label: 'Todos' },
                { value: 'pendente', label: 'Pendentes' },
                { value: 'em_andamento', label: 'Em Andamento' },
                { value: 'resolvido', label: 'Resolvidos' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilterStatus(filter.value)}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                    filterStatus === filter.value
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Tickets List */}
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-bold text-cyan-400">{ticket.id}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                          {ticket.status === 'pendente' && 'Pendente'}
                          {ticket.status === 'em_andamento' && 'Em Andamento'}
                          {ticket.status === 'resolvido' && 'Resolvido'}
                        </span>
                      </div>
                      <h4 className="text-white font-semibold mb-1 group-hover:text-cyan-400 transition-colors">
                        {ticket.title}
                      </h4>
                      <p className="text-slate-400 text-sm mb-2">{ticket.description}</p>
                      <p className="text-slate-500 text-xs">Criado em: {ticket.createdAt}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      ticket.priority === 'alta' ? 'bg-red-500/20 text-red-300' :
                      ticket.priority === 'média' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-green-500/20 text-green-300'
                    }`}>
                      {ticket.priority === 'alta' && '🔴 Alta'}
                      {ticket.priority === 'média' && '🟡 Média'}
                      {ticket.priority === 'baixa' && '🟢 Baixa'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredTickets.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare size={48} className="mx-auto text-slate-500 mb-4" />
                <p className="text-slate-400 text-lg">Nenhum chamado encontrado</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-slate-400 text-sm">
            <p>© 2026 J-KINGS Portal. Todos os direitos reservados.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
