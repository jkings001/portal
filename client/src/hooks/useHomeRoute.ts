import { useAuth } from "@/contexts/AuthContext";

/**
 * useHomeRoute — Retorna a rota "home" correta baseada no perfil do usuário.
 *
 * - admin | manager | agent → /management
 * - user (e qualquer outro) → /dashboard
 */
export function useHomeRoute(): string {
  const { currentUser } = useAuth();
  const adminRoles = ["admin", "manager", "agent"];
  if (currentUser && adminRoles.includes(currentUser.role)) {
    return "/management";
  }
  return "/dashboard";
}
