import { Lock, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AdminAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * AdminAccessModal — redireciona para o fluxo OAuth.
 * A verificacao de role (admin/manager) e feita pelo backend apos autenticacao.
 * Credenciais nunca sao armazenadas no frontend.
 */
export default function AdminAccessModal({ isOpen, onClose }: AdminAccessModalProps) {
  const { login } = useAuth();

  const handleLogin = () => {
    onClose();
    login();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-[9999] w-full max-w-md mx-4">
        <div className="glassmorphic rounded-2xl p-8 border border-white/20 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Acesso Admin</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Description */}
          <p className="text-gray-300 text-sm mb-6">
            Clique em "Entrar" para ser redirecionado ao portal de autenticacao.
            O acesso ao painel administrativo e concedido automaticamente apos verificacao do seu perfil.
          </p>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-all border border-white/20"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleLogin}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-medium transition-all"
            >
              Entrar
            </button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-400 text-center mt-4">
            💡 Apenas administradores podem acessar este painel
          </p>
        </div>
      </div>
    </div>
  );
}
