import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useHomeRoute } from "@/hooks/useHomeRoute";

/**
 * BackButton — Botão de voltar com lógica inteligente de navegação.
 *
 * Lógica de destino (em ordem de prioridade):
 * 1. Se `to` for fornecido, navega para essa rota específica.
 * 2. Se `onClick` for fornecido, executa o callback.
 * 3. Se `window.history.length > 1`, usa `window.history.back()` para voltar ao histórico real.
 * 4. Fallback: navega para a rota pai mapeada (role-aware).
 *
 * Rota "home" é dinâmica por perfil:
 * - admin | manager | agent → /management
 * - user                    → /dashboard
 *
 * Mapa de rotas pai (fallback quando não há histórico):
 * - /training/:id        → /training
 * - /treinamentos/:id    → /treinamentos
 * - /tickets/:id         → /tickets
 * - /estacionamento/*    → /estacionamento
 * - /admin/*             → /management
 * - /rh/*                → /management
 * - /companies           → /management
 * - Qualquer outra       → homeRoute (role-aware)
 */

interface BackButtonProps {
  /** Rota de destino explícita (sobrepõe tudo) */
  to?: string;
  /** Callback customizado (sobrepõe history.back, mas não `to`) */
  onClick?: () => void;
  /** Texto do botão */
  label?: string;
  /** Variante visual: "default" (ciano) | "ghost" (transparente) | "minimal" (só ícone) */
  variant?: "default" | "ghost" | "minimal";
}

/** Rotas que têm destino fixo independente do role */
const FIXED_PARENT_ROUTES: Array<{ pattern: RegExp; parent: string }> = [
  { pattern: /^\/training\//, parent: "/training" },
  { pattern: /^\/treinamentos\//, parent: "/treinamentos" },
  { pattern: /^\/tickets\//, parent: "/tickets" },
  { pattern: /^\/estacionamento\//, parent: "/estacionamento" },
  { pattern: /^\/admin\//, parent: "/management" },
  { pattern: /^\/rh\//, parent: "/management" },
  { pattern: /^\/companies/, parent: "/management" },
  { pattern: /^\/user-dashboard/, parent: "/" },
];

function getParentRoute(currentPath: string, homeRoute: string): string {
  for (const { pattern, parent } of FIXED_PARENT_ROUTES) {
    if (pattern.test(currentPath)) return parent;
  }
  // Todas as demais páginas voltam para a home do usuário (role-aware)
  return homeRoute;
}

export default function BackButton({
  to,
  onClick,
  label = "Voltar",
  variant = "default",
}: BackButtonProps) {
  const [currentPath, setLocation] = useLocation();
  const homeRoute = useHomeRoute();

  const handleBack = () => {
    // 1. Destino explícito
    if (to) {
      setLocation(to);
      return;
    }

    // 2. Callback customizado
    if (onClick) {
      onClick();
      return;
    }

    // 3. Histórico do browser (funciona em desktop e mobile)
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }

    // 4. Fallback: rota pai mapeada (role-aware)
    const parent = getParentRoute(currentPath, homeRoute);
    setLocation(parent);
  };

  // ── Estilos por variante ──────────────────────────────────────────────────
  if (variant === "minimal") {
    return (
      <button
        onClick={handleBack}
        className="flex items-center justify-center w-9 h-9 rounded-xl transition-all hover:bg-white/10 active:scale-95"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        title={label}
        aria-label={label}
      >
        <ArrowLeft className="w-4 h-4" style={{ color: "rgba(255,255,255,0.55)" }} />
      </button>
    );
  }

  if (variant === "ghost") {
    return (
      <button
        onClick={handleBack}
        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:bg-white/10 active:scale-95"
        style={{ color: "rgba(255,255,255,0.55)", fontFamily: "Inter, sans-serif" }}
        title={label}
        aria-label={label}
      >
        <ArrowLeft className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium hidden sm:inline">{label}</span>
      </button>
    );
  }

  // variant === "default" — ciano vibrante (padrão original)
  return (
    <button
      onClick={handleBack}
      className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 text-gray-900 font-bold hover:from-cyan-300 hover:to-cyan-400 transition-all shadow-lg hover:shadow-cyan-400/50 hover:scale-105 active:scale-95"
      title={label}
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
      <span className="text-sm font-bold hidden sm:inline">{label}</span>
    </button>
  );
}
