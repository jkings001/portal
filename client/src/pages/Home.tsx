import { LogIn, UserPlus, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

/**
 * Design Philosophy: Glassmorphism Futurista
 * - Efeito de vidro translúcido com backdrop blur
 * - Gradiente azul profundo (céu → oceano → noite)
 * - Acentos em ciano/turquesa para elementos interativos
 * - Tipografia moderna: Poppins (títulos) + Inter (corpo)
 * - Animações fluidas (300ms) sem distrações
 */

export default function Home() {
  const [, setLocation] = useLocation();
  const { currentUser, isAuthenticated, isLoading, login } = useAuth();

  // Redirecionar usuario ja autenticado para o painel correto
  useEffect(() => {
    if (!isLoading && isAuthenticated && currentUser) {
      if (currentUser.role === "admin" || currentUser.role === "manager") {
        setLocation("/admin");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [isLoading, isAuthenticated, currentUser, setLocation]);

  const handleSignUp = () => {
    setLocation("/signup");
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: "url('https://files.manuscdn.com/user_upload_by_module/session_file/310519663168635381/wrxjgZvBGGKjjpRd.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Overlay para melhorar contraste */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/20 to-black/40 pointer-events-none" />

      {/* Conteúdo Principal */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Card Glassmorphic */}
          <div className="glassmorphic animate-slide-in p-8 sm:p-10">
            {/* Logo / Branding */}
            <div className="mb-8 text-center">
              <img 
                src="/images/logo-jkings.png" 
                alt="JKINGS Logo" 
                className="h-16 mx-auto mb-6 drop-shadow-lg"
              />
              <h1 className="title-hero text-3xl sm:text-4xl mb-2">
                Portal de Atendimento
              </h1>
              <p className="subtitle text-sm sm:text-base">
                Bem-vindo ao seu espaço
              </p>
            </div>

            {/* Botao principal de login OAuth */}
            <div className="space-y-4">
              <button
                onClick={login}
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-transparent border-t-white rounded-full animate-spin" />
                    Verificando sessao...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Entrar com JKINGS
                  </>
                )}
              </button>
            </div>

            {/* Divisor */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="text-xs text-gray-400">OU</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {/* Botões Secundários */}
            <div className="space-y-3">
              <button
                onClick={handleSignUp}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Criar Conta
              </button>
              <button
                onClick={login}
                className="w-full px-6 py-2 rounded-lg font-medium text-sm border-2 border-amber-400/50 text-amber-300 hover:border-amber-400 hover:bg-amber-400/10 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Experimentar Gratis
              </button>
            </div>

            {/* Rodapé */}
            <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-gray-400">
              <p>
                Ao entrar, você concorda com nossos{" "}
                <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  Termos de Serviço
                </a>
              </p>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="mt-8 text-center text-sm text-gray-300">
            <p>
              Tudo o que você precisa de TI,{" "}
              <span className="text-cyan-400 font-semibold">em um só lugar</span>
            </p>
          </div>
        </div>
      </div>

      {/* Elementos Decorativos Abstratos (opcional) */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none hidden md:block" />
      <div className="absolute bottom-10 left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none hidden md:block" />
    </div>
  );
}
