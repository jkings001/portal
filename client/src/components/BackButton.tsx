import { ArrowLeft } from "lucide-react";

/**
 * Design Philosophy: Glassmorphism Futurista
 * - Botão de voltar destacado e visível em todas as páginas
 * - Estilo vibrante com gradiente ciano e efeito hover
 * - Ícone grande e texto claro para fácil identificação
 */

interface BackButtonProps {
  label?: string;
  onClick?: () => void;
}

export default function BackButton({ label = "Voltar", onClick }: BackButtonProps) {
  const handleBack = () => {
    if (onClick) {
      onClick();
    } else {
      window.history.back();
    }
  };

  return (
    <button
      onClick={handleBack}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 text-gray-900 font-bold hover:from-cyan-300 hover:to-cyan-400 transition-all shadow-lg hover:shadow-cyan-400/50 hover:scale-105"
      title="Voltar à página anterior"
    >
      <ArrowLeft className="w-5 h-5" />
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}
