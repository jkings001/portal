import { useState, useEffect } from "react";
import { Eye, EyeOff, LogIn, UserPlus, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import CircuitBackground from "@/components/CircuitBackground";

/**
 * Design Philosophy: Glassmorphism Moderno com Cores Vividas
 * - Efeito de vidro translúcido com backdrop blur premium
 * - Gradiente vibrante com cores cyan, azul e roxo
 * - Acentos em cyan/turquesa brilhante para máximo contraste
 * - Tipografia moderna com melhor legibilidade
 * - Animações fluidas e efeitos de glow
 */

export default function Home() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [, setLocation] = useLocation();
  const { login } = useAuth();

  // Verificar se usuário já está autenticado
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      // Validar que o token é um JWT válido (deve começar com eyJ)
      if (typeof token !== 'string' || !token.startsWith('eyJ') || token.split('.').length !== 3) {
        // Token corrompido - limpar tudo e mostrar login
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isAuthenticated');
        return;
      }
      try {
        const userData = JSON.parse(user);
        // Redirecionar para /management (admin/manager) ou /dashboard (demais)
        if (userData.role === 'admin' || userData.role === 'manager') {
          setLocation('/management');
        } else {
          setLocation('/dashboard');
        }
      } catch (err) {
        console.error('Erro ao parsear usuário:', err);
        // Dados corrompidos - limpar
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isAuthenticated');
      }
    }
  }, [setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Salvar também como 'currentUser' para compatibilidade com módulos ITAM, Estacionamento, etc.
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        localStorage.setItem('isAuthenticated', 'true');
        
        // admin e manager → /management | demais → /dashboard
        if (data.user.role === 'admin' || data.user.role === 'manager') {
          setLocation("/management");
        } else {
          setLocation("/dashboard");
        }
      } else {
        setError(data.error || "Email ou senha incorretos");
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      setError("Erro ao fazer login. Tente novamente.");
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    setLocation("/signup");
  };

  const handleTrial = () => {
    console.log("Redirect to trial");
  };

  // Se o usuário já está autenticado com token válido, mostrar spinner de redirecionamento
  const token = localStorage.getItem('authToken');
  const isValidToken = token && typeof token === 'string' && token.startsWith('eyJ') && token.split('.').length === 3;
  if (isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cyan-300">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#020810' }}
    >
      {/* Background animado de circuito eletrônico */}
      <CircuitBackground />

      {/* Overlay suave para melhor legibilidade do card */}
      <div className="fixed inset-0 pointer-events-none" style={{ 
        zIndex: 1,
        background: 'linear-gradient(to bottom, rgba(2,8,16,0.18) 0%, rgba(2,8,16,0.08) 50%, rgba(2,8,16,0.28) 100%)'
      }} />

      {/* Conteúdo Principal */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Card Glassmorphic Premium — Alura-inspired */}
          <div className="animate-blur-in p-5 sm:p-8 md:p-10" style={{ background: 'rgba(6,15,24,0.82)', border: '1px solid rgba(43,222,253,0.22)', borderRadius: '12px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 8px 48px rgba(0,0,0,0.6), 0 0 32px rgba(43,222,253,0.08), inset 0 1px 0 rgba(43,222,253,0.1)' }}>
            {/* Logo / Branding */}
            <div className="mb-5 sm:mb-8 text-center">
              <img 
                src="/images/logo-jkings-dashboard.png" 
                alt="JKINGS Logo" 
                className="h-14 sm:h-20 mx-auto mb-5 sm:mb-8 drop-shadow-2xl transition-all duration-300 hover:scale-110"
                style={{
                  filter: 'drop-shadow(0 0 25px rgba(34, 211, 238, 0.9)) drop-shadow(0 0 50px rgba(34, 211, 238, 0.5))',
                }}
              />
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3" style={{ fontFamily: 'Poppins, Inter, sans-serif', background: 'linear-gradient(135deg, #D7F9FF 0%, #2BDEFD 50%, #2BFDBE 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.02em' }}>
                Portal de Atendimento
              </h1>
              <p className="text-base sm:text-lg font-medium" style={{ color: '#98D4DE', fontFamily: 'Inter, sans-serif' }}>
                Bem-vindo ao seu espaço
              </p>
            </div>

            {/* Formulário de Login */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Mensagem de Erro */}
              {error && (
                <div className="p-3 rounded-lg bg-red-500/25 border border-red-400/50 text-red-200 text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold" style={{ color: '#2BDEFD', fontFamily: 'Inter, sans-serif', letterSpacing: '0.02em' }}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-400 font-medium transition-all duration-200"
                  style={{ background: 'rgba(43,222,253,0.06)', border: '1px solid rgba(43,222,253,0.22)', fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold" style={{ color: '#2BDEFD', fontFamily: 'Inter, sans-serif', letterSpacing: '0.02em' }}>
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-lg text-white placeholder-gray-400 font-medium transition-all duration-200 pr-12"
                    style={{ background: 'rgba(43,222,253,0.06)', border: '1px solid rgba(43,222,253,0.22)', fontFamily: 'Inter, sans-serif' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: '#2BDEFD' }}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded bg-white/15 border border-cyan-400/40 accent-cyan-400 cursor-pointer"
                  />
                  <span style={{ color: '#D7F9FF', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>Lembrar-me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setLocation("/forgot-password")}
                  className="transition-colors font-semibold bg-none border-none cursor-pointer" style={{ color: '#2BDEFD', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}
                >
                  Esqueceu a senha?
                </button>
              </div>

              {/* Botão de Login */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-md font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2" style={{ background: '#2BFDBE', color: '#01080E', fontFamily: 'Inter, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.875rem', boxShadow: '0 0 24px rgba(43,253,190,0.35)' }}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-transparent border-t-white rounded-full animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Entrar
                  </>
                )}
              </button>
            </form>

            {/* Divisor */}
            <div className="my-4 sm:my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
              <span className="text-xs text-cyan-300 font-medium">OU</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
            </div>

            {/* Botões Secundários */}
            <div className="space-y-3">
              <button
                onClick={handleSignUp}
                className="w-full px-6 py-3 rounded-md font-semibold transition-all duration-200 flex items-center justify-center gap-2" style={{ background: 'transparent', color: '#2BDEFD', border: '1.5px solid rgba(43,222,253,0.5)', fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.875rem' }}
              >
                <UserPlus className="w-4 h-4" />
                Criar Conta
              </button>
              <button
                onClick={handleTrial}
                className="w-full px-6 py-3 rounded-md font-semibold transition-all duration-200 flex items-center justify-center gap-2" style={{ background: 'transparent', color: '#98D4DE', border: '1px solid rgba(43,222,253,0.2)', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}
              >
                <Zap className="w-4 h-4" />
                Experimentar Grátis
              </button>
              <a
                href="/presentation"
                className="w-full px-6 py-3 rounded-md font-semibold transition-all duration-200 flex items-center justify-center gap-2 block" style={{ background: 'rgba(43,222,253,0.05)', color: '#98D4DE', border: '1px solid rgba(43,222,253,0.15)', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}
              >
                <Zap className="w-4 h-4" />
                Conhecer JKINGS
              </a>
            </div>

            {/* Rodapé */}
            <div className="mt-5 sm:mt-8 pt-4 sm:pt-6 text-center text-xs" style={{ borderTop: '1px solid rgba(43,222,253,0.12)', color: '#98D4DE', fontFamily: 'Inter, sans-serif' }}>
              <p>
                Ao entrar, você concorda com nossos{" "}
                <a href="#" className="transition-colors font-semibold" style={{ color: '#2BDEFD' }}>
                  Termos de Serviço
                </a>
              </p>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="mt-8 text-center text-sm" style={{ color: '#98D4DE', fontFamily: 'Inter, sans-serif' }}>
            <p>
              Tudo o que você precisa de TI,{" "}
              <span className="font-bold" style={{ color: '#2BDEFD' }}>em um só lugar</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
