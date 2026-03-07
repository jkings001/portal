import { X, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * SwitchProfileModal - Modal para trocar perfil de usuario
 *
 * Redireciona para o fluxo OAuth para autenticacao segura.
 * Credenciais nunca sao armazenadas ou comparadas no frontend.
 */

interface SwitchProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SwitchProfileModal: React.FC<SwitchProfileModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();

  const handleSwitch = () => {
    onClose();
    login();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay - Cobre toda a tela */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      ></div>

      {/* Modal Container - Centralizado na tela */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-md bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden my-auto">
          {/* Header */}
          <div className="px-6 py-6 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-blue-600/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <LogIn className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Trocar Perfil</h2>
                  <p className="text-gray-400 text-xs">Faça login com outro usuário</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Corpo */}
          <div className="p-6 space-y-4">
            <p className="text-gray-300 text-sm">
              Para trocar de perfil, voce sera redirecionado ao portal de autenticacao.
              Faca login com as credenciais do perfil desejado.
            </p>

            {/* Botoes */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-all duration-300 font-medium text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSwitch}
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 font-medium text-sm flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Trocar Perfil
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SwitchProfileModal;
