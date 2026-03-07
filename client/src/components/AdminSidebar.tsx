import React from 'react';
import { LayoutDashboard, Users, BookOpen, FileText, BarChart3, ChevronRight } from 'lucide-react';
import { useLocation, Link } from 'wouter';

/**
 * AdminSidebar - Barra lateral de navegação fixa
 * 
 * Design: Glassmorphism com menu vertical
 * Items: Dashboard, Usuários, Treinamentos, Arquivos, Relatórios
 */

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
}

const AdminSidebar: React.FC = () => {
  const [location] = useLocation();

  const menuItems: MenuItem[] = [
    {
      icon: <LayoutDashboard size={20} />,
      label: 'Dashboard',
      href: '/admin',
    },
    {
      icon: <Users size={20} />,
      label: 'Usuários',
      href: '/admin/users',
      badge: 12,
    },
    {
      icon: <BookOpen size={20} />,
      label: 'Treinamentos',
      href: '/admin/trainings',
    },
    {
      icon: <FileText size={20} />,
      label: 'Arquivos',
      href: '/admin/files',
      badge: 5,
    },
    {
      icon: <BarChart3 size={20} />,
      label: 'Relatórios',
      href: '/admin/reports',
    },
  ];

  const isActive = (href: string) => location === href;

  return (
    <aside className="fixed left-0 top-20 h-[calc(100vh-80px)] w-64 bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-r border-white/10 overflow-y-auto hidden lg:block z-30">
      {/* Navegação */}
      <nav className="p-6 space-y-2">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={`flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all duration-300 group block ${
              isActive(item.href)
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`${isActive(item.href) ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'} transition-colors`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.badge && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
              <ChevronRight
                size={16}
                className={`opacity-0 group-hover:opacity-100 transition-all duration-300 ${
                  isActive(item.href) ? 'opacity-100 translate-x-1' : ''
                }`}
              />
            </div>
          </Link>
        ))}
      </nav>

      {/* Seção de Atalhos */}
      <div className="px-6 py-8 border-t border-white/10">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Atalhos Rápidos</h4>
        <div className="space-y-2">
          <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300">
            📋 Criar Comunicado
          </button>
          <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300">
            📊 Gerar Relatório
          </button>
          <button className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300">
            ⚙️ Configurações
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="px-6 py-6 border-t border-white/10">
        <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-lg p-4">
          <h4 className="text-sm font-bold text-cyan-300 mb-2">💡 Dica</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Use os filtros rápidos para visualizar chamados por prioridade e status.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
