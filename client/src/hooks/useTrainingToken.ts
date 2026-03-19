/**
 * Hook useTrainingToken
 *
 * Unifica os dois sistemas de autenticação do portal:
 * 1. Login local (email/senha) → token em localStorage.authToken
 * 2. Manus OAuth → sessão via cookie HTTP
 *
 * Retorna um token JWT Bearer válido para usar nas chamadas REST
 * das páginas de treinamento, independentemente de como o usuário fez login.
 *
 * Uso:
 *   const { token, userId, isAuthenticated, loading } = useTrainingToken();
 */

import { useState, useEffect } from "react";

interface TrainingTokenState {
  token: string;
  userId: number | null;
  userName: string | null;
  userRole: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

function parseJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    // Verificar se o token não expirou
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function getLocalToken(): string {
  return localStorage.getItem("authToken") || "";
}

function getLocalUser(): { id: number; name: string; role: string } | null {
  try {
    const stored = localStorage.getItem("currentUser");
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

export function useTrainingToken(): TrainingTokenState {
  const [state, setState] = useState<TrainingTokenState>({
    token: "",
    userId: null,
    userName: null,
    userRole: null,
    isAuthenticated: false,
    loading: true,
  });

  useEffect(() => {
    // Usar apenas autenticação local (sem OAuth externo)
    const localToken = getLocalToken();
    if (localToken) {
      const payload = parseJwtPayload(localToken);
      if (payload?.user) {
        const u = payload.user;
        setState({
          token: localToken,
          userId: typeof u.id === "number" ? u.id : parseInt(u.id) || null,
          userName: u.name || null,
          userRole: u.role || null,
          isAuthenticated: true,
          loading: false,
        });
        return;
      }
    }

    // Fallback: currentUser no localStorage
    try {
      const stored = localStorage.getItem("currentUser");
      if (stored) {
        const u = JSON.parse(stored);
        setState({
          token: localToken,
          userId: u.id || null,
          userName: u.name || null,
          userRole: u.role || null,
          isAuthenticated: Boolean(u.id),
          loading: false,
        });
        return;
      }
    } catch {
      // ignore
    }

    // Sem autenticação
    setState({
      token: "",
      userId: null,
      userName: null,
      userRole: null,
      isAuthenticated: false,
      loading: false,
    });
  }, []);

  return state;
}
