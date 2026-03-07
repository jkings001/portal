import { useState, useRef, useEffect } from "react";
import { LogOut, User, Lock, Home, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { currentUser, userProfilePhoto } from "@/lib/trainingData";

/**
 * Design Philosophy: Glassmorphism Futurista
 * - Menu dropdown do usuário com opções de navegação
 * - Acesso rápido a perfil, admin e logout
 */

interface UserMenuProps {
  showHome?: boolean;
  onAdminAccessClick?: () => void;
}

export default function UserMenu({ showHome = true, onAdminAccessClick }: UserMenuProps) {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setLocation("/");
    setIsOpen(false);
  };

  const handleProfile = () => {
    setLocation("/profile");
    setIsOpen(false);
  };

  const handleHome = () => {
    setLocation("/");
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* Avatar Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold hover:shadow-lg hover:shadow-cyan-400/50 transition-all"
          title={currentUser.name}
        >
          {currentUser.name.charAt(0)}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 glassmorphic rounded-lg shadow-xl border border-white/20 overflow-hidden z-50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src={userProfilePhoto}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-white font-bold text-sm">{currentUser.name}</p>
                  <p className="text-gray-400 text-xs">{currentUser.position}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {/* Perfil */}
              <button
                onClick={handleProfile}
                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                <User className="w-4 h-4 text-cyan-400" />
                <span className="text-sm">Meu Perfil</span>
              </button>

              {/* Painel de Administrador */}
              <button
                onClick={() => {
                  if (onAdminAccessClick) {
                    onAdminAccessClick();
                  } else {
                    setLocation("/admin");
                  }
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-sm">Painel de Administrador</span>
              </button>

              {/* Divider */}
              <div className="my-2 border-t border-white/10" />

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sair</span>
              </button>
            </div>
          </div>
        )}
      </div>


    </>
  );
}
