import { useLocation } from "wouter";
import { useCallback } from "react";

/**
 * Hook que fornece uma função de navegação com suporte a transições suaves.
 * Usa wouter para navegação e permite delay opcional para sincronizar com animações.
 */
export function usePageTransition() {
  const [, navigate] = useLocation();

  /**
   * Navega para uma rota com um pequeno delay opcional para
   * permitir que animações de saída completem antes da transição.
   * @param to - Rota de destino
   * @param delay - Delay em ms antes de navegar (padrão: 0)
   */
  const navigateTo = useCallback(
    (to: string, delay = 0) => {
      if (delay > 0) {
        setTimeout(() => navigate(to), delay);
      } else {
        navigate(to);
      }
    },
    [navigate]
  );

  return { navigateTo };
}
