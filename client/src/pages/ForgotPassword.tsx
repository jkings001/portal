import { useState } from "react";
import { useLocation } from "wouter";
import { Mail, CheckCircle } from "lucide-react";
import BackButton from "@/components/BackButton";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setEmail("");
      } else {
        setError(data.error || "Erro ao processar solicitação");
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
                <Mail className="w-12 h-12 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Recuperar Senha
              </h1>
              <p className="text-gray-300 text-sm">
                Digite seu email para receber um link de reset
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

                {/* Email Input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-white text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:bg-white/20 transition"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isLoading ? "Enviando..." : "Enviar Link de Reset"}
                </button>

                {/* Back to Login */}
                <div className="w-full flex justify-center">
                  <BackButton to="/" label="Voltar ao Login" />
                </div>
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
                        Verifique seu email para o link de reset de senha
                      </p>
                    </div>
                  </div>
                </div>

                {/* Back to Login */}
                <button
                  onClick={() => setLocation("/")}
                  className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:from-cyan-600 hover:to-blue-600 transition"
                >
                  Voltar ao Login
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
              Lembrou sua senha?{" "}
              <button
                onClick={() => setLocation("/")}
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition"
              >
                Fazer Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
