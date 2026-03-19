import { useState } from "react";
import { Search, HelpCircle, ChevronDown, Phone, Mail, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import BackButton from "@/components/BackButton";
import UserMenu from "@/components/UserMenu";

/**
 * Design Philosophy: Glassmorphism Futurista
 * - Central de Ajuda com categorias de artigos
 * - Busca funcional
 * - Contato direto com suporte
 */

interface HelpArticle {
  id: string;
  category: string;
  title: string;
  description: string;
  content: string;
}

const helpArticles: HelpArticle[] = [
  {
    id: "1",
    category: "Primeiros Passos",
    title: "Como fazer login no portal",
    description: "Guia passo a passo para acessar o portal de atendimento",
    content: "1. Acesse o portal através do navegador\n2. Insira seu email corporativo\n3. Digite sua senha\n4. Clique em 'Entrar'\n5. Você será redirecionado ao dashboard"
  },
  {
    id: "2",
    category: "Primeiros Passos",
    title: "Configurar seu perfil",
    description: "Saiba como atualizar suas informações pessoais",
    content: "1. Clique no avatar no canto superior direito\n2. Selecione 'Meu Perfil'\n3. Clique em 'Editar Perfil'\n4. Atualize suas informações\n5. Clique em 'Salvar Alterações'"
  },
  {
    id: "3",
    category: "Treinamentos",
    title: "Como acessar os treinamentos online",
    description: "Instruções para acessar e participar dos cursos disponíveis",
    content: "1. No dashboard, clique em 'Treinamentos Online'\n2. Visualize a lista de cursos disponíveis\n3. Clique em um curso para ver detalhes\n4. Clique em 'Inscrever-se'\n5. Acompanhe seu progresso na página do curso"
  },
  {
    id: "4",
    category: "Suporte Técnico",
    title: "Como abrir um chamado de suporte",
    description: "Aprenda a solicitar ajuda técnica através do portal",
    content: "1. Clique em 'Abrir Chamado' no dashboard\n2. Escolha o tipo: Requisição, Incidente ou Solicitação\n3. Preencha o formulário com detalhes\n4. Selecione a categoria e prioridade\n5. Clique em 'Enviar' e acompanhe o status"
  },
  {
    id: "5",
    category: "Suporte Técnico",
    title: "Problemas de acesso e permissões",
    description: "Solução para problemas de login e permissões",
    content: "Se você não consegue acessar o portal:\n- Verifique se está usando seu email corporativo correto\n- Limpe o cache do navegador\n- Tente usar outro navegador\n- Se o problema persistir, abra um chamado de suporte\n\nPara problemas de permissão:\n- Contate seu gerente de departamento\n- Abra um chamado informando qual acesso você precisa"
  },
  {
    id: "6",
    category: "Equipamentos",
    title: "Gerenciamento de equipamentos atribuídos",
    description: "Informações sobre seus equipamentos corporativos",
    content: "Você pode visualizar seus equipamentos atribuídos:\n1. No dashboard, vá para 'Meus Equipamentos'\n2. Veja a lista de notebooks, smartphones e periféricos\n3. Para problemas técnicos, abra um chamado de suporte\n4. Para devolução, contate o departamento de TI"
  }
];

export default function HelpCenter() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const categories = Array.from(new Set(helpArticles.map((a) => a.category)));

  const filteredArticles = helpArticles.filter((article) => {
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase());
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
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(15,23,42,0.3) 0%, rgba(0,0,0,0.7) 100%)' }} />

      <div className="relative z-10">
        {/* Header */}
        <header className="glassmorphic border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="/images/logo-jkings-dashboard.png" 
                  alt="JKINGS" 
                  className="h-8 transition-all duration-300 hover:scale-110"
                  style={{
                    filter: 'drop-shadow(0 0 15px rgba(34, 211, 238, 0.5)) drop-shadow(0 0 30px rgba(34, 211, 238, 0.2))'
                  }}
                />
                <div>
                  <h1 className="text-white font-bold">Central de Ajuda</h1>
                  <p className="text-gray-300 text-xs">Encontre respostas e soluções para suas dúvidas</p>
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
                placeholder="Buscar artigos de ajuda..."
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>
          </div>

          {/* Contato Rápido */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="glassmorphic rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <Phone className="w-6 h-6 text-cyan-400" />
                <div>
                  <p className="text-gray-400 text-sm">Telefone</p>
                  <p className="text-white font-bold">(11) 3000-0000</p>
                </div>
              </div>
            </div>

            <div className="glassmorphic rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-cyan-400" />
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white font-bold">suporte@jkings.com</p>
                </div>
              </div>
            </div>

            <div className="glassmorphic rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-cyan-400" />
                <div>
                  <p className="text-gray-400 text-sm">Chat</p>
                  <p className="text-white font-bold">Seg-Sex 9h-18h</p>
                </div>
              </div>
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

            {/* Artigos */}
            <div className="lg:col-span-3 space-y-4">
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className="glassmorphic rounded-lg border border-white/10 overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedArticle(expandedArticle === article.id ? null : article.id)
                      }
                      className="w-full p-4 hover:bg-white/5 transition-all text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <HelpCircle className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-bold text-cyan-400">
                              {article.category}
                            </span>
                          </div>
                          <h3 className="text-white font-bold text-lg mb-1">
                            {article.title}
                          </h3>
                          <p className="text-gray-400 text-sm">{article.description}</p>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedArticle === article.id ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {expandedArticle === article.id && (
                      <div className="px-4 py-4 border-t border-white/10 bg-white/5">
                        <p className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">
                          {article.content}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="glassmorphic rounded-lg p-12 border border-white/10 text-center">
                  <p className="text-gray-400">Nenhum artigo encontrado</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
