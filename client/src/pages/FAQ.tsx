import { useState } from "react";
import { Search, ChevronDown, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import BackButton from "@/components/BackButton";
import UserMenu from "@/components/UserMenu";

/**
 * Design Philosophy: Glassmorphism Futurista
 * - Página de FAQ com perguntas frequentes
 * - Busca e filtros por categoria
 * - Respostas detalhadas e expandíveis
 */

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: "1",
    category: "Conta e Acesso",
    question: "Como faço para resetar minha senha?",
    answer: "Você pode resetar sua senha clicando em 'Esqueceu a senha?' na página de login. Um email será enviado para seu email corporativo com instruções. Se não receber o email, verifique a pasta de spam ou contate o suporte técnico."
  },
  {
    id: "2",
    category: "Conta e Acesso",
    question: "Posso acessar o portal de múltiplos dispositivos?",
    answer: "Sim, você pode acessar o portal de qualquer dispositivo com navegador web. Por segurança, recomendamos fazer logout quando usar computadores compartilhados. Sua sessão expirará automaticamente após 30 minutos de inatividade."
  },
  {
    id: "3",
    category: "Treinamentos",
    question: "Posso fazer download dos materiais de treinamento?",
    answer: "Sim, você pode fazer download dos materiais disponibilizados em cada curso. Alguns materiais podem estar protegidos por direitos autorais e não poderão ser compartilhados. Respeite os direitos autorais e as políticas de confidencialidade."
  },
  {
    id: "4",
    category: "Treinamentos",
    question: "Como obtenho meu certificado de conclusão?",
    answer: "Após completar 100% do curso, você receberá automaticamente um certificado digital. O certificado será enviado por email e também estará disponível em seu perfil na seção 'Meus Certificados'. Você pode imprimir ou fazer download do certificado em formato PDF."
  },
  {
    id: "5",
    category: "Suporte e Chamados",
    question: "Qual é o tempo médio de resposta para um chamado?",
    answer: "O tempo de resposta varia conforme a prioridade: Crítica (1 hora), Alta (4 horas), Média (8 horas), Baixa (24 horas). Você receberá atualizações por email sobre o status do seu chamado."
  },
  {
    id: "6",
    category: "Suporte e Chamados",
    question: "Como faço para acompanhar o status do meu chamado?",
    answer: "Você pode acompanhar o status do seu chamado em 'Histórico de Chamados' no dashboard. Clique em um chamado para ver detalhes, comentários e atualizações. Você também receberá notificações por email quando houver atualizações."
  },
  {
    id: "7",
    category: "Equipamentos",
    question: "O que fazer se meu equipamento apresentar problemas?",
    answer: "Abra um chamado de suporte selecionando 'Incidente' e escolhendo a categoria 'Hardware'. Descreva o problema em detalhes e inclua o modelo do equipamento. A equipe de TI entrará em contato para agendamento de reparo ou substituição."
  },
  {
    id: "8",
    category: "Equipamentos",
    question: "Posso levar meu equipamento corporativo para casa?",
    answer: "Sim, equipamentos corporativos podem ser levados para casa para trabalho remoto. Você é responsável pela segurança e integridade do equipamento. Não compartilhe sua senha e mantenha o equipamento protegido. Ao sair da empresa, todos os equipamentos devem ser devolvidos."
  },
  {
    id: "9",
    category: "Segurança",
    question: "Quais são as políticas de segurança que devo seguir?",
    answer: "Você deve seguir as políticas de segurança da empresa: não compartilhe suas credenciais, use senhas fortes, mantenha o software atualizado, não instale software não autorizado, e reporte qualquer atividade suspeita. Consulte 'Políticas de TI' para mais detalhes."
  },
  {
    id: "10",
    category: "Segurança",
    question: "Como faço para reportar um incidente de segurança?",
    answer: "Se você suspeitar de um incidente de segurança (acesso não autorizado, vazamento de dados, etc.), abra imediatamente um chamado de suporte com prioridade 'Crítica' ou contate o departamento de segurança diretamente pelo telefone (11) 3000-0000."
  }
];

export default function FAQ() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const categories = Array.from(new Set(faqItems.map((item) => item.category)));

  const filteredItems = faqItems.filter((item) => {
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-black"
      style={{
        backgroundImage: "url('https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/KoIkonwMtIdIHrjnda2AbH-img-1_1770239808000_na1fn_YmctcGFnZXMtZ2VuZXJhbA.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94L0tvSWtvbndNdElkSUhyam5kYTJBYkgtaW1nLTFfMTc3MDIzOTgwODAwMF9uYTFmbl9ZbWN0Y0dGblpYTXRaMlZ1WlhKaGJBLmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=G-4sam25r3pn-X1QcnliL6aRvhIeTzyayYtXnPHYnJmFJBa7YxlwfCxXZmRdTqb0WuQNAPbaInMrWlNU9Qwu4-MOoxGokBbR~g5S7~K8SJiVWEeilwBhReWUwy8Xv-0mJjOJUVzQ-kKG5wf87sTt60z68n39mMMx36gvnf-X6qNkWt4PfgQziT6L5vreP5betjsfIDH9HvQ6~TTWwAN~8qFR1A8x5tVX2lrJt8F22C~NRVAHfU2XdoqawdV~0zGZVA5gqCO9H88uWz3YeFT6Jq8hJAWE48b373pP2~oSFD8dg6me9Lk1OjZnWYeN6trzN8NYrWMoa~MJHXmDXvNwvw__')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/30 to-black/50 pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <header className="glassmorphic border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="/images/logo-jkings.png" 
                  alt="JKINGS" 
                  className="h-8"
                />
                <div>
                  <h1 className="text-white font-bold">Perguntas Frequentes</h1>
                  <p className="text-gray-300 text-xs">Respostas para as dúvidas mais comuns</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <BackButton onClick={() => setLocation("/dashboard")} />
                <div className="pl-4 border-l border-white/20">
                  <UserMenu showHome={false} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Busca */}
          <div className="glassmorphic rounded-lg p-6 border border-white/10 mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar perguntas frequentes..."
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Categorias */}
            <div className="lg:col-span-1">
              <div className="glassmorphic rounded-lg p-4 border border-white/10 sticky top-24">
                <h3 className="text-white font-bold mb-4">Categorias</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                      selectedCategory === null
                        ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/50"
                        : "text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    Todas
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                        selectedCategory === category
                          ? "bg-cyan-400/20 text-cyan-400 border border-cyan-400/50"
                          : "text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* FAQ Items */}
            <div className="lg:col-span-3 space-y-4">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="glassmorphic rounded-lg border border-white/10 overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedItem(expandedItem === item.id ? null : item.id)
                      }
                      className="w-full p-4 hover:bg-white/5 transition-all text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageCircle className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-bold text-cyan-400">
                              {item.category}
                            </span>
                          </div>
                          <h3 className="text-white font-bold text-base">
                            {item.question}
                          </h3>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-4 ${
                            expandedItem === item.id ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {expandedItem === item.id && (
                      <div className="px-4 py-4 border-t border-white/10 bg-white/5">
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="glassmorphic rounded-lg p-12 border border-white/10 text-center">
                  <p className="text-gray-400">Nenhuma pergunta encontrada</p>
                </div>
              )}
            </div>
          </div>

          {/* Contato */}
          <div className="mt-12 glassmorphic rounded-lg p-6 border border-white/10 text-center">
            <p className="text-gray-300 mb-4">Não encontrou a resposta que procurava?</p>
            <button
              onClick={() => setLocation("/support")}
              className="px-6 py-2 bg-gradient-to-r from-cyan-400 to-cyan-500 text-gray-900 font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-400/50 transition-all"
            >
              Abra um Chamado de Suporte
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
