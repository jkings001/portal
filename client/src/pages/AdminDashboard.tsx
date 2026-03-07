import React, { useState } from 'react';
import { Bell, Settings, LogOut, Menu, X, Plus, Download, Search, Filter } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import KPICards from '../components/KPICards';
import RecentTickets from '../components/RecentTickets';
import AdminNotifications from '../components/AdminNotifications';
import AdminProfile from '../components/AdminProfile';
import SwitchProfileModal from '../components/SwitchProfileModal';
import { useAuth } from '@/contexts/AuthContext';

/**
 * AdminDashboard - Página principal do dashboard administrativo J-KINGS Admin
 * 
 * Design: Glassmorphism Corporativo Minimalista
 * Paleta: Azul Marinho (#0F172A) + Cinza Ardósia (#475569) + Branco (#FFFFFF)
 * 
 * Estrutura:
 * - Header com notificações e perfil
 * - Sidebar fixa com navegação
 * - Conteúdo principal com KPIs e tabela de chamados
 * - Ações rápidas flutuantes
 */
const AdminDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSwitchProfile, setShowSwitchProfile] = useState(false);
  const [filterStatus, setFilterStatus] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(3);

  // Dados mockados de KPIs
  const kpiData = {
    totalTickets: 247,
    pendingTickets: 23,
    inProgressTickets: 15,
    resolvedTickets: 209,
  };

  // Dados mockados de chamados recentes
  const recentTicketsData: Array<{
    id: string;
    title: string;
    user: string;
    department: string;
    status: 'pendente' | 'em_andamento' | 'resolvido';
    priority: 'alta' | 'média' | 'baixa';
    createdAt: string;
  }> = [
    {
      id: 'TK-001',
      title: 'Erro ao fazer login no portal',
      user: 'João Silva',
      department: 'Financeiro',
      status: 'pendente',
      priority: 'alta',
      createdAt: '2026-01-28 10:30',
    },
    {
      id: 'TK-002',
      title: 'Solicitar acesso ao servidor de arquivos',
      user: 'Maria Santos',
      department: 'RH',
      status: 'em_andamento',
      priority: 'média',
      createdAt: '2026-01-28 09:15',
    },
    {
      id: 'TK-003',
      title: 'Atualizar software de design',
      user: 'Carlos Oliveira',
      department: 'Marketing',
      status: 'resolvido',
      priority: 'baixa',
      createdAt: '2026-01-27 16:45',
    },
    {
      id: 'TK-004',
      title: 'Configurar VPN para trabalho remoto',
      user: 'Ana Costa',
      department: 'TI',
      status: 'em_andamento',
      priority: 'alta',
      createdAt: '2026-01-27 14:20',
    },
    {
      id: 'TK-005',
      title: 'Resetar senha do email corporativo',
      user: 'Pedro Ferreira',
      department: 'Vendas',
      status: 'pendente',
      priority: 'média',
      createdAt: '2026-01-27 11:00',
    },
  ];

  // Filtrar chamados
  const filteredTickets = recentTicketsData.filter((ticket) => {
    const matchesStatus = filterStatus === 'todos' || ticket.status === (filterStatus as any);
    const matchesSearch = 
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleSwitchProfileSuccess = () => {
    window.location.reload();
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      style={{
        backgroundImage: "url('https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/HvVqCE7k0Noj0nuQ0XGqJh-img-2_1770239208000_na1fn_YmctZGFzaGJvYXJkLWFkbWlu.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94L0h2VnFDRTdrME5vajBudVEwWEdxSmgtaW1nLTJfMTc3MDIzOTIwODAwMF9uYTFmbl9ZbWN0WkdGemFHSnZZWEprTFdGa2JXbHUuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=NS-In4kf-gU2f8MNkw040n4ixh32Z2cc-0HYXOh81AIwpgryUgApEP8JncHcE39YUjfiXPZl6AIxXAOWaNTE0m0fxigaHbA4VxKK0AaGYhlWgqoy-bCaY0PmF7eQmIkp3VzX-t1UWtf3f4bCbow9IJLuATvgXfVUT7IoNP7ulSJ~CqEQ57brJiqyCMhnMGZFG6szGMbWx8lEVatOkCqTUK8Tn5yh9pDhnMO8CAgP-FE3WgXt9w9Oezf09gHG2Mt9srbGBgNbp0TUH71yQzZnzt~fdn72AF4h4llI396h0oUrFfTp1ftDrhFsCivVJy6O5-X5jIvQMlxqDbDNLBcIFw__')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(6,182,212,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(6,182,212,0.1),transparent_50%)]"></div>
      </div>

      {/* Switch Profile Modal */}
      <SwitchProfileModal 
        isOpen={showSwitchProfile}
        onClose={() => setShowSwitchProfile(false)}
        onSuccess={handleSwitchProfileSuccess}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-slate-900/95 to-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo e Menu Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-300 lg:hidden"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
                JK
              </div>
              <h1 className="text-xl font-bold text-white hidden sm:block">J-KINGS Admin</h1>
            </div>
          </div>

          {/* Ações do Header */}
          <div className="flex items-center gap-4">
            {/* Notificações */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-white/10 rounded-lg transition-colors duration-300 group"
              >
                <Bell size={24} className="text-white group-hover:text-cyan-400 transition-colors" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {notificationCount}
                  </span>
                )}
              </button>
              {showNotifications && <AdminNotifications onClose={() => setShowNotifications(false)} />}
            </div>

            {/* Perfil do Admin */}
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg transition-colors duration-300 group"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {currentUser?.avatar || 'AD'}
                </div>
                <span className="text-sm font-medium text-white hidden sm:block">{currentUser?.name?.split(' ')[0] || 'Admin'}</span>
              </button>
              {showProfile && (
                <AdminProfile 
                  onLogout={handleLogout}
                  onClose={() => setShowProfile(false)}
                  onSwitchProfile={() => setShowSwitchProfile(true)}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex pt-20">
        {/* Sidebar */}
        {sidebarOpen && <AdminSidebar />}

        {/* Conteúdo Principal */}
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-0' : ''}`}>
          <div className="p-6 max-w-7xl mx-auto">
            {/* Título da Página */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
              <p className="text-slate-400">Bem-vindo ao painel administrativo J-KINGS</p>
            </div>

            {/* KPI Cards */}
            <KPICards data={kpiData} />

            {/* Seção de Chamados Recentes */}
            <div className="mt-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
              {/* Header da Seção */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white">Chamados Recentes</h3>
                  <p className="text-slate-400 text-sm mt-1">Gestão prioritária de solicitações</p>
                </div>

                {/* Ações Rápidas */}
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    <Plus size={18} />
                    <span className="hidden sm:inline">Novo Chamado</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all duration-300 border border-white/20">
                    <Download size={18} />
                    <span className="hidden sm:inline">Exportar</span>
                  </button>
                </div>
              </div>

              {/* Filtros e Busca */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Barra de Busca */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar por ID, título ou usuário..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white/10 transition-all duration-300"
                  />
                </div>

                {/* Filtro por Status */}
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  {[
                    { value: 'todos', label: 'Todos' },
                    { value: 'pendente', label: 'Pendentes' },
                    { value: 'em_andamento', label: 'Em Andamento' },
                    { value: 'resolvido', label: 'Resolvidos' },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setFilterStatus(filter.value)}
                      className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-300 whitespace-nowrap ${
                        filterStatus === filter.value
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabela de Chamados */}
              <RecentTickets tickets={filteredTickets} />
            </div>

            {/* Rodapé */}
            <div className="mt-8 text-center text-slate-400 text-sm">
              <p>© 2026 J-KINGS Admin. Todos os direitos reservados.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
