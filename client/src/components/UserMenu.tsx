import { useState, useEffect, useRef, useCallback } from "react";
import { LogOut, User, Lock, Home, Shield, Settings, LayoutDashboard } from "lucide-react";
import { useLocation } from "wouter";

/**
 * Design Philosophy: Glassmorphism Futurista
 * - Menu dropdown do usuário com opções de navegação
 * - Exibe foto do perfil ou siglas do nome/sobrenome
 * - Acesso rápido a perfil, admin, configurações e logout
 * - Funciona para qualquer tipo de usuário (admin, manager, user)
 */

interface UserMenuProps {
  showHome?: boolean;
  onAdminAccessClick?: () => void;
  /** variant="admin": troca "Painel de Administrador" por "Perfil de Usuário" (→ /dashboard) */
  variant?: 'default' | 'admin';
}

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
  company?: string;
  department?: string;
}

/**
 * Gera siglas do nome e sobrenome
 * Ex: "João Silva" -> "JS"
 * Ex: "Maria" -> "M"
 */
function getNameInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    // Se tem apenas um nome, retorna primeira letra
    return parts[0].charAt(0).toUpperCase();
  }
  
  // Se tem mais de um nome, retorna primeira letra do primeiro e último nome
  const firstInitial = parts[0].charAt(0).toUpperCase();
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  
  return `${firstInitial}${lastInitial}`;
}

export default function UserMenu({ showHome = true, onAdminAccessClick, variant = 'default' }: UserMenuProps) {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Carregar dados do usuário logado
  const loadUserData = useCallback(async () => {
    try {
      const rawToken = localStorage.getItem('authToken');
      if (!rawToken) {
        console.error('Token não encontrado');
        setIsLoadingUser(false);
        return;
      }

      // Garantir que o token é uma string válida (não um objeto serializado)
      let token = rawToken;
      if (typeof token !== 'string' || !token.startsWith('eyJ')) {
        // Token inválido - limpar e não tentar usar
        console.error('Token inválido no localStorage, limpando...');
        localStorage.removeItem('authToken');
        setIsLoadingUser(false);
        return;
      }

      const response = await fetch('/api/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else {
        console.error('Erro ao carregar perfil:', response.status);
        if (response.status === 401) {
          // Token expirado ou inválido - limpar
          localStorage.removeItem('authToken');
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados do usuário:', err);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Recarregar dados quando o token for atualizado (ex: após confirmação de acesso admin)
  useEffect(() => {
    // storage event: funciona entre abas diferentes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' && e.newValue && e.newValue !== e.oldValue) {
        setIsLoadingUser(true);
        loadUserData();
      }
    };
    // auth-token-updated: evento customizado para a mesma aba
    const handleTokenUpdated = () => {
      setIsLoadingUser(true);
      loadUserData();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-token-updated', handleTokenUpdated);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-token-updated', handleTokenUpdated);
    };
  }, [loadUserData]);

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

  // Escutar evento de atualização de imagem de perfil (disparado pela página Profile ao salvar)
  useEffect(() => {
    const handleProfileImageUpdated = (event: CustomEvent) => {
      const { profileImage } = event.detail;
      setUserData((prev) => prev ? { ...prev, profileImage } : prev);
    };

    window.addEventListener('profileImageUpdated', handleProfileImageUpdated as EventListener);
    return () => window.removeEventListener('profileImageUpdated', handleProfileImageUpdated as EventListener);
  }, []);

  const handleLogout = () => {
    // Limpar localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    
    // Redirecionar para home
    setLocation("/");
    setIsOpen(false);
  };

  const handleProfile = () => {
    setLocation("/profile");
    setIsOpen(false);
  };

  const handleSettings = () => {
    setLocation("/settings");
    setIsOpen(false);
  };

  const handleAdmin = () => {
    if (onAdminAccessClick) {
      onAdminAccessClick();
    } else {
      setLocation("/admin");
    }
    setIsOpen(false);
  };

  const handleHome = () => {
    setLocation("/");
    setIsOpen(false);
  };

  const handleDashboard = () => {
    setLocation("/dashboard");
    setIsOpen(false);
  };

  // Mostrar loading enquanto carrega dados do usuário
  if (isLoadingUser) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold animate-pulse">
        ...
      </div>
    );
  }

  const displayName = userData?.name || "Usuário";
  const displayRole = userData?.role || "Usuário";
  const initials = getNameInitials(displayName);
  
  // Validar se a URL de imagem é válida (não é Data URL e não está vazia)
  const hasProfileImage = userData?.profileImage 
    && userData.profileImage.trim() !== ""
    && !userData.profileImage.startsWith('data:');

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* Avatar Button - Mostra foto ou siglas */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold hover:shadow-lg hover:shadow-cyan-400/50 transition-all hover:scale-105 border-2 border-cyan-300/50 hover:border-cyan-300"
          title={`${displayName} (${displayRole})`}
        >
          {hasProfileImage ? (
            <img 
              src={userData.profileImage} 
              alt={displayName} 
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const span = document.createElement('span');
                  span.className = 'text-lg font-bold';
                  span.textContent = initials;
                  parent.appendChild(span);
                }
              }}
            />
          ) : (
            <span className="text-lg font-bold">{initials}</span>
          )}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-3 w-64 rounded-xl shadow-2xl border border-cyan-400/40 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2" style={{ background: 'rgba(10, 20, 40, 0.97)', backdropFilter: 'blur(8px)' }}>
            {/* Header com dados do usuário */}
            <div className="px-4 py-4 border-b border-cyan-400/30" style={{ background: 'rgba(6, 182, 212, 0.12)' }}>
              <div className="flex items-center gap-3">
                {hasProfileImage ? (
                  <img
                    src={userData.profileImage}
                    alt={displayName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400/50"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const div = document.createElement('div');
                        div.className = 'w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold border-2 border-cyan-300/50';
                        div.textContent = initials;
                        parent.appendChild(div);
                      }
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold border-2 border-cyan-300/50">
                    {initials}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">{displayName}</p>
                  <p className="text-cyan-200 text-xs">{userData?.email}</p>
                  <p className="text-gray-400 text-xs mt-1 capitalize">{displayRole}</p>
                </div>
              </div>
            </div>

              {/* Menu Items */}
            <div className="py-1">
              {/* Meu Perfil */}
              <button
                onClick={handleProfile}
                className="w-full px-4 py-3 text-left text-white hover:bg-cyan-500/25 transition-colors flex items-center gap-3 group"
              >
                <User className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
                <span className="text-sm font-semibold">Meu Perfil</span>
              </button>

              {/* Painel de Administrador OU Perfil de Usuário dependendo do contexto */}
              {variant === 'admin' ? (
                <button
                  onClick={handleDashboard}
                  className="w-full px-4 py-3 text-left text-white hover:bg-blue-500/25 transition-colors flex items-center gap-3 group"
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                  <span className="text-sm font-semibold">Perfil de Usuário</span>
                </button>
              ) : (
                userData?.role === 'admin' && (
                  <button
                    onClick={handleDashboard}
                    className="w-full px-4 py-3 text-left text-white hover:bg-blue-500/25 transition-colors flex items-center gap-3 group"
                  >
                    <LayoutDashboard className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                    <span className="text-sm font-semibold">Painel do Usuário</span>
                  </button>
                )
              )}

              {/* Configurações */}
              <button
                onClick={handleSettings}
                className="w-full px-4 py-3 text-left text-white hover:bg-purple-500/25 transition-colors flex items-center gap-3 group"
              >
                <Settings className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                <span className="text-sm font-semibold">Configurações</span>
              </button>

              {/* Divider */}
              <div className="my-1 border-t border-white/10" />

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-left text-red-300 hover:bg-red-500/25 hover:text-red-200 transition-colors flex items-center gap-3 group"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-semibold">Sair</span>
              </button>
            </div>

            {/* Footer com informações adicionais */}
            {userData?.company && (
              <div className="px-4 py-3 border-t border-white/10 text-xs" style={{ background: 'rgba(6, 182, 212, 0.08)' }}>
                <p className="truncate text-gray-300">
                  <span className="text-cyan-400 font-semibold">Empresa:</span> {userData.company}
                </p>
                {userData.department && (
                  <p className="truncate mt-1 text-gray-300">
                    <span className="text-cyan-400 font-semibold">Departamento:</span> {userData.department}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
