import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * AuthContext - Gerencia autenticação e perfis de usuário
 * Integrado com servidor backend via /api/auth/login
 * 
 * Roles disponíveis: 'user' | 'admin'
 * Persiste dados em localStorage
 */

export type UserRole = 'user' | 'admin' | 'manager' | 'agent';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  avatar?: string;
}

export interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchProfile: (email: string, password: string) => Promise<boolean>;
  getAllUsers: () => User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Carregar usuário do localStorage se existir
    // Tentar primeiro 'user' (usado por Home.tsx), depois 'currentUser' (compatibilidade)
    let stored = localStorage.getItem('user');
    if (!stored) {
      stored = localStorage.getItem('currentUser');
    }
    return stored ? JSON.parse(stored) : null;
  });

  // Sincronizar com localStorage sempre que a página muda
  React.useEffect(() => {
    const handleStorageChange = () => {
      let stored = localStorage.getItem('user');
      if (!stored) {
        stored = localStorage.getItem('currentUser');
      }
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        setCurrentUser(null);
      }
    };

    // Sincronizar imediatamente
    handleStorageChange();

    // Sincronizar quando localStorage muda em outra aba
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        // Normalizar role para 'user' ou 'admin'
        const normalizedUser: User = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || email.split('@')[0],
          role: (['admin', 'manager', 'agent'].includes(data.user.role) ? data.user.role : 'user') as UserRole,
          department: data.user.department,
          avatar: data.user.avatar,
        };

        setCurrentUser(normalizedUser);
        // Salvar em ambas as chaves para compatibilidade com Home.tsx
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        localStorage.setItem('currentUser', JSON.stringify(normalizedUser));
        localStorage.setItem('authToken', data.token || '');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAuthenticated');
    // Disparar evento de armazenamento para sincronizar com outras abas
    window.dispatchEvent(new Event('storage'));
  };

  const switchProfile = async (email: string, password: string): Promise<boolean> => {
    return login(email, password);
  };

  const getAllUsers = (): User[] => {
    // Retorna apenas o usuário atual
    return currentUser ? [currentUser] : [];
  };

  const value: AuthContextType = {
    currentUser,
    isAuthenticated: currentUser !== null,
    login,
    logout,
    switchProfile,
    getAllUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
