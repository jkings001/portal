import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const [location] = useLocation();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [, setLocation2] = useLocation();

  useEffect(() => {
    // Extract token from URL
    const params = new URLSearchParams(location.split("?")[1]);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("Token não encontrado na URL");
    }
  }, [location]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Senha deve ter pelo menos 8 caracteres";
    }
    if (!/[A-Z]/.test(password)) {
      return "Senha deve conter pelo menos uma letra maiúscula";
    }
    if (!/[a-z]/.test(password)) {
      return "Senha deve conter pelo menos uma letra minúscula";
    }
    if (!/\d/.test(password)) {
      return "Senha deve conter pelo menos um número";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    // Validate password strength
    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.error || "Erro ao resetar senha");
      }
    } catch (err) {
      console.error("Erro:", err);
      setError("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage:
          "url('https://files.manuscdn.com/user_upload_by_module/session_file/310519663168635381/MiEBjftpMreYTsFs.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/20 to-black/40 pointer-events-none" />

      {/* Conteúdo */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Card */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 sm:p-10 shadow-2xl">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="flex justify-center mb-4">
                <Lock className="w-12 h-12 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Resetar Senha
              </h1>
              <p className="text-gray-300 text-sm">
                Digite sua nova senha abaixo
              </p>
            </div>

            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                {/* New Password Input */}
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-white text-sm font-medium">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Digite sua nova senha"
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-white transition"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400">
                    Mínimo 8 caracteres, com maiúsculas, minúsculas e números
                  </p>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-white text-sm font-medium">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme sua nova senha"
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-white transition"
                    >
                      {showConfirm ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !token}
                  className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isLoading ? "Resetando..." : "Resetar Senha"}
                </button>

                {/* Back to Login */}
                <button
                  type="button"
                  onClick={() => setLocation2("/")}
                  className="w-full py-2 px-4 rounded-lg bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition"
                >
                  Voltar ao Login
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                {/* Success Message */}
                <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="text-green-300 font-semibold">Sucesso!</p>
                      <p className="text-green-200 text-sm">
                        Sua senha foi resetada com sucesso
                      </p>
                    </div>
                  </div>
                </div>

                {/* Back to Login */}
                <button
                  onClick={() => setLocation2("/")}
                  className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-600 hover:to-blue-600 transition"
                >
                  Fazer Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
