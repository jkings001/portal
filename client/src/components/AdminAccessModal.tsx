import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, Mail, X, ShieldCheck, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

interface AdminAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminAccessModal({ isOpen, onClose }: AdminAccessModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [, setLocation] = useLocation();

  // Pré-preencher email do usuário logado
  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem("authToken");
      if (token) {
        try {
          // Decodificar payload do JWT (sem verificar assinatura - só para pré-preencher)
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload?.user?.email) {
            setEmail(payload.user.email);
          }
        } catch {
          // Ignorar erros de decodificação
        }
      }
      setError("");
      setPassword("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-admin-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (response.status === 403) {
          setError("Acesso negado. Apenas administradores podem acessar este painel.");
        } else if (response.status === 401) {
          setError(
            newAttempts >= 3
              ? `Credenciais inválidas. ${newAttempts} tentativas realizadas.`
              : "Email ou senha incorretos. Verifique suas credenciais."
          );
        } else {
          setError(data.error || "Erro ao verificar credenciais. Tente novamente.");
        }
        setIsLoading(false);
        return;
      }

      // Sucesso: atualizar token e dados do usuário no localStorage
      if (data.token) {
        localStorage.setItem("authToken", data.token);
        // Disparar evento customizado para notificar componentes na mesma aba
        window.dispatchEvent(new CustomEvent('auth-token-updated', { detail: { token: data.token } }));
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        // Salvar também como 'currentUser' para compatibilidade com módulos ITAM, Estacionamento, etc.
        localStorage.setItem("currentUser", JSON.stringify(data.user));
      }

      // Fechar modal e redirecionar para /admin
      onClose();
      setLocation("/admin");
    } catch (err) {
      console.error("Admin access error:", err);
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-[9999] w-full max-w-md mx-4 animate-slide-in">
        <div
          className="rounded-2xl p-8 border border-white/15 shadow-2xl"
          style={{
            background: "rgba(10, 15, 35, 0.97)",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Acesso Administrativo</h2>
                <p className="text-gray-400 text-xs">Confirme suas credenciais</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Aviso de segurança */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 mb-5">
            <Lock className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
            <p className="text-purple-200 text-xs leading-relaxed">
              Esta área é restrita a administradores. Suas credenciais serão verificadas no servidor antes de conceder acesso.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mensagem de Erro */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/15 border border-red-500/30">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="text-sm text-gray-300 font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/8 border border-white/15 text-white placeholder-gray-600 focus:outline-none focus:border-purple-400 focus:bg-white/12 transition-all text-sm"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="text-sm text-gray-300 font-medium">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white/8 border border-white/15 text-white placeholder-gray-600 focus:outline-none focus:border-purple-400 focus:bg-white/12 transition-all text-sm"
                  required
                  autoComplete="current-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/8 hover:bg-white/15 text-gray-300 hover:text-white font-medium transition-all border border-white/15 text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Confirmar Acesso
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Rodapé */}
          <p className="text-xs text-gray-600 text-center mt-4">
            Apenas usuários com perfil <span className="text-purple-400 font-medium">Administrador</span> têm acesso a este painel
          </p>
        </div>
      </div>
    </div>
  );
}
