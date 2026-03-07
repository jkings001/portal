import React, { createContext, useContext, ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import type { User } from "@shared/types";

/**
 * AuthContext — integração real com o backend via tRPC.
 *
 * O usuário autenticado é obtido de `auth.me` (sessão via cookie JWT).
 * O login é feito pelo fluxo OAuth (redirecionamento para a página de login).
 * O logout limpa o cookie de sessão via mutation tRPC.
 *
 * Roles disponíveis (definidas no banco): 'user' | 'admin' | 'manager'
 */

export type UserRole = "user" | "admin" | "manager";

export interface AuthContextType {
  /** Usuário autenticado ou null se não logado */
  currentUser: User | null;
  /** true se há sessão ativa */
  isAuthenticated: boolean;
  /** true enquanto a sessão está sendo verificada */
  isLoading: boolean;
  /** Redireciona para a página de login OAuth */
  login: () => void;
  /** Encerra a sessão via tRPC e redireciona para login */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const utils = trpc.useUtils();

  // Busca o usuário da sessão atual (cookie JWT)
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      // Limpa o cache local do usuário
      utils.auth.me.setData(undefined, null);
    },
  });

  const login = () => {
    window.location.href = getLoginUrl();
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      window.location.href = "/";
    }
  };

  const currentUser = meQuery.data ?? null;

  const value: AuthContextType = {
    currentUser,
    isAuthenticated: Boolean(currentUser),
    isLoading: meQuery.isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
};
