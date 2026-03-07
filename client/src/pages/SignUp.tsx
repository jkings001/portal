import { useState } from "react";
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

/**
 * Design Philosophy: Glassmorphism Futurista
 * - Mantém a paleta azul profunda do design original
 * - Card glassmorphic com efeito de vidro
 * - Formulário responsivo com validação em tempo real
 * - Botões com estilos consistentes (ciano primário)
 */

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  department: string;
  role: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function SignUp() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    role: ""
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const departments = [
    "Selecione um departamento",
    "Tecnologia da Informação",
    "Recursos Humanos",
    "Financeiro",
    "Vendas",
    "Marketing",
    "Operações",
    "Suporte ao Cliente"
  ];

  const roles = [
    "Selecione uma função",
    "Gerente",
    "Supervisor",
    "Analista",
    "Técnico",
    "Assistente",
    "Estagiário",
    "Consultor"
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Nome é obrigatório";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Sobrenome é obrigatório";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
    } else if (formData.password.length < 8) {
      newErrors.password = "Senha deve ter pelo menos 8 caracteres";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Senhas não conferem";
    }
    if (formData.department === "Selecione um departamento") {
      newErrors.department = "Selecione um departamento";
    }
    if (formData.role === "Selecione uma função") {
      newErrors.role = "Selecione uma função";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    // Limpar erro do campo quando o usuário começa a digitar
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Simulação de requisição - substituir com integração real
    setTimeout(() => {
      console.log("Cadastro realizado:", formData);
      setIsLoading(false);
      // Redirecionar para dashboard após cadastro bem-sucedido
      setLocation("/dashboard");
    }, 1500);
  };

  const handleBack = () => {
    setLocation("/");
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-black flex items-center justify-center py-8"
      style={{
        backgroundImage: "url('https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/KoIkonwMtIdIHrjnda2AbH-img-1_1770239808000_na1fn_YmctcGFnZXMtZ2VuZXJhbA.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94L0tvSWtvbndNdElkSUhyam5kYTJBYkgtaW1nLTFfMTc3MDIzOTgwODAwMF9uYTFmbl9ZbWN0Y0dGblpYTXRaMlZ1WlhKaGJBLmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=G-4sam25r3pn-X1QcnliL6aRvhIeTzyayYtXnPHYnJmFJBa7YxlwfCxXZmRdTqb0WuQNAPbaInMrWlNU9Qwu4-MOoxGokBbR~g5S7~K8SJiVWEeilwBhReWUwy8Xv-0mJjOJUVzQ-kKG5wf87sTt60z68n39mMMx36gvnf-X6qNkWt4PfgQziT6L5vreP5betjsfIDH9HvQ6~TTWwAN~8qFR1A8x5tVX2lrJt8F22C~NRVAHfU2XdoqawdV~0zGZVA5gqCO9H88uWz3YeFT6Jq8hJAWE48b373pP2~oSFD8dg6me9Lk1OjZnWYeN6trzN8NYrWMoa~MJHXmDXvNwvw__')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/30 to-black/50 pointer-events-none" />

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Botão Voltar */}
          <button
            onClick={handleBack}
            className="mb-6 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar ao Login
          </button>

          {/* Card Glassmorphic */}
          <div className="glassmorphic animate-slide-in p-8 sm:p-10">
            {/* Logo / Branding */}
            <div className="mb-8 text-center">
              <img
                src="/images/logo-jkings.png"
                alt="JKINGS Logo"
                className="h-12 mx-auto mb-4 drop-shadow-lg"
              />
              <h1 className="title-hero text-3xl sm:text-4xl mb-2">
                Criar Conta
              </h1>
              <p className="subtitle text-sm sm:text-base">
                Preencha os dados abaixo para se cadastrar
              </p>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nome e Sobrenome - Grid 2 colunas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Seu nome"
                    className={`w-full px-4 py-3 rounded-lg bg-white/10 border transition-all backdrop-blur-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                      errors.firstName
                        ? "border-red-500"
                        : "border-white/20 hover:border-white/30"
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>
                  )}
                </div>

                {/* Sobrenome */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Sobrenome
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Seu sobrenome"
                    className={`w-full px-4 py-3 rounded-lg bg-white/10 border transition-all backdrop-blur-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                      errors.lastName
                        ? "border-red-500"
                        : "border-white/20 hover:border-white/30"
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  className={`w-full px-4 py-3 rounded-lg bg-white/10 border transition-all backdrop-blur-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                    errors.email
                      ? "border-red-500"
                      : "border-white/20 hover:border-white/30"
                  }`}
                />
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Senha e Confirmar Senha - Grid 2 colunas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Senha */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 rounded-lg bg-white/10 border transition-all backdrop-blur-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 pr-10 ${
                        errors.password
                          ? "border-red-500"
                          : "border-white/20 hover:border-white/30"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Confirmar Senha */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 rounded-lg bg-white/10 border transition-all backdrop-blur-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 pr-10 ${
                        errors.confirmPassword
                          ? "border-red-500"
                          : "border-white/20 hover:border-white/30"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Departamento e Função - Grid 2 colunas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Departamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Departamento
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg bg-white/10 border transition-all backdrop-blur-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                      errors.department
                        ? "border-red-500"
                        : "border-white/20 hover:border-white/30"
                    }`}
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept} className="bg-gray-900">
                        {dept}
                      </option>
                    ))}
                  </select>
                  {errors.department && (
                    <p className="text-red-400 text-xs mt-1">{errors.department}</p>
                  )}
                </div>

                {/* Função */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Função
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg bg-white/10 border transition-all backdrop-blur-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                      errors.role
                        ? "border-red-500"
                        : "border-white/20 hover:border-white/30"
                    }`}
                  >
                    {roles.map((role) => (
                      <option key={role} value={role} className="bg-gray-900">
                        {role}
                      </option>
                    ))}
                  </select>
                  {errors.role && (
                    <p className="text-red-400 text-xs mt-1">{errors.role}</p>
                  )}
                </div>
              </div>

              {/* Botão Cadastrar */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-8 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 text-gray-900 font-bold text-lg hover:from-cyan-300 hover:to-cyan-400 transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  "Criar Conta"
                )}
              </button>

              {/* Link para Login */}
              <p className="text-center text-gray-300 text-sm mt-6">
                Já tem uma conta?{" "}
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                >
                  Fazer login
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
