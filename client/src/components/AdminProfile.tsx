import React from 'react';
import { X, User, Settings, HelpCircle, LogOut, ToggleLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * AdminProfile - Menu de perfil do administrador
 * 
 * Design: Glassmorphism com opções de menu
 * Opções: Meu Perfil, Configurações, Ajuda, Trocar Perfil, Logout
 */

interface AdminProfileProps {
  onLogout: () => void;
  onClose: () => void;
  onSwitchProfile?: () => void;
}

const AdminProfile: React.FC<AdminProfileProps> = ({ onLogout, onClose, onSwitchProfile }) => {
  const { currentUser } = useAuth();

  const menuItems = [
    {
      icon: <User size={18} />,
      label: 'Meu Perfil',
      href: '#',
    },
    {
      icon: <Settings size={18} />,
      label: 'Configurações',
      href: '#',
    },
    {
      icon: <HelpCircle size={18} />,
      label: 'Ajuda & Suporte',
      href: '#',
    },
  ];

  return (
    <div className="absolute top-16 right-0 w-72 bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden">
      {/* Header com Perfil */}
      <div className="px-6 py-6 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-blue-600/10">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{fontSize: '15px', borderRadius: '4px', height: '40px', borderStyle: 'dashed'}}>
            {currentUser?.avatar || 'AD'}
          </div>
          <div>
            <h4 className="text-white font-bold">{currentUser?.name || 'Administrador'}</h4>
            <p className="text-slate-400 text-sm" style={{width: '145px'}}>{currentUser?.email || 'admin@jkings.com'}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-1 hover:bg-white/10 rounded-lg transition-colors duration-300"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="py-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className="w-full flex items-center gap-3 px-6 py-3 text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-300 group"
          >
            <span className="text-slate-400 group-hover:text-cyan-400 transition-colors">
              {item.icon}
            </span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="border-t border-white/10"></div>

      {/* Trocar Perfil */}
      <button
        onClick={() => {
          onSwitchProfile?.();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-6 py-3 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all duration-300 group font-medium"
      >
        <ToggleLeft size={18} />
        <span>Trocar Perfil</span>
      </button>

      {/* Divider */}
      <div className="border-t border-white/10"></div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-6 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 group font-medium"
      >
        <LogOut size={18} />
        <span>Sair</span>
      </button>
    </div>
  );
};

export default AdminProfile;
