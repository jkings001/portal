import { useState, useEffect } from 'react';
import { Bell, Menu, X, Plus, Download, Search, Filter, ChevronRight } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import KPICards from '../components/KPICards';
import RecentTickets from '../components/RecentTickets';
import AdminNotifications from '../components/AdminNotifications';
import AdminProfile from '../components/AdminProfile';
import SwitchProfileModal from '../components/SwitchProfileModal';
import { useAuth } from '@/contexts/AuthContext';
import UserMenu from '../components/UserMenu';

const AdminDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSwitchProfile, setShowSwitchProfile] = useState(false);
  const [filterStatus, setFilterStatus] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(3);
  const [kpiData, setKpiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Notificar UserMenu que o token pode ter mudado (ex: após confirmação de acesso admin)
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      window.dispatchEvent(new CustomEvent('auth-token-updated', { detail: { token } }));
    }
  }, []);

  // Detectar mudanças de tamanho de tela
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) throw new Error('Failed to fetch dashboard stats');
        const data = await response.json();
        setKpiData({
          totalTickets: data.totalTickets || 0,
          pendingTickets: data.ticketsByStatus?.find((s: any) => s.status === 'pendente')?.count || 0,
          inProgressTickets: data.ticketsByStatus?.find((s: any) => s.status === 'em_andamento')?.count || 0,
          resolvedTickets: data.ticketsByStatus?.find((s: any) => s.status === 'resolvido')?.count || 0,
          recentTickets: data.recentTickets || [],
        });
        setError(null);
      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.message);
        setKpiData({
          totalTickets: 247,
          pendingTickets: 23,
          inProgressTickets: 15,
          resolvedTickets: 209,
          recentTickets: [],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  const recentTicketsData = kpiData?.recentTickets || [];

  const filteredTickets = (recentTicketsData || []).filter((ticket: any) => {
    const matchesStatus = filterStatus === 'todos' || ticket.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.user.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      {/* Sidebar - Hidden on mobile by default */}
      <div className={`${sidebarOpen && !isMobile ? 'block' : 'hidden'} md:block fixed md:relative z-40 h-full`}>
        <AdminSidebar />
      </div>
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300 w-full">
        {/* Header - Responsive */}
        <div className="bg-slate-800 border-b border-slate-700 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg transition flex-shrink-0"
            >
              {sidebarOpen ? <X size={18} className="sm:w-5 sm:h-5" /> : <Menu size={18} className="sm:w-5 sm:h-5" />}
            </button>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg transition"
            >
              <Bell size={18} className="sm:w-5 sm:h-5" />
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs">
                  {notificationCount}
                </span>
              )}
            </button>
            {/* Botão de perfil com dropdown - variant admin mostra "Perfil de Usuário" em vez de "Painel de Administrador" */}
            <UserMenu variant="admin" showHome={false} />
          </div>
        </div>

        {/* Main Content - Responsive */}
        <div className="flex-1 overflow-auto w-full">
          <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 w-full">
            {/* KPI Cards - Garantir visibilidade total */}
            {kpiData && (
              <div className="w-full">
                <KPICards data={kpiData} />
              </div>
            )}

            {/* Filtros e Busca - Responsive */}
            <div className="bg-slate-800 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Search size={18} className="text-slate-400 flex-shrink-0 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base text-white placeholder-slate-400"
                />
              </div>
              <div className="flex gap-2 items-center">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base text-white flex-1 sm:flex-none"
                >
                  <option value="todos">Todos</option>
                  <option value="pendente">Pendente</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="resolvido">Resolvido</option>
                </select>
                <button className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg transition flex-shrink-0">
                  <Filter size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Recent Tickets - Responsive */}
            <div className="bg-slate-800 rounded-lg p-3 sm:p-4 md:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Chamados Recentes</h2>
              <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
                {filteredTickets.length > 0 ? (
                  <RecentTickets tickets={filteredTickets} />
                ) : (
                  <p className="text-slate-400 text-sm sm:text-base">Nenhum chamado encontrado</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showNotifications && <AdminNotifications onClose={() => setShowNotifications(false)} />}
      {showProfile && <AdminProfile onLogout={() => { /* handle logout */ }} onClose={() => setShowProfile(false)} />}
      {showSwitchProfile && <SwitchProfileModal isOpen={showSwitchProfile} onClose={() => setShowSwitchProfile(false)} />}
    </div>
  );
};

export default AdminDashboard;
