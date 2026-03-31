import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { contactData, helpCategories, helpArticles } from "@/lib/mockData";
import { ArrowLeft, Mail, Phone, Clock, MessageCircle } from "lucide-react";
import AuroraBackground from "@/components/AuroraBackground";

export default function Help() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredArticles = selectedCategory === "all"
    ? helpArticles
    : helpArticles.filter(article => article.category === selectedCategory);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AuroraBackground />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-md bg-white/5">
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => setLocation("/")}
              >
                <ArrowLeft size={24} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Central de Ajuda</h1>
                <p className="text-sm text-gray-400">Encontre respostas e soluções para suas dúvidas</p>
              </div>
            </div>
          </div>
        </header>

        {/* Contact Info */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 rounded-xl flex items-start gap-4">
              <Phone className="text-cyan-400 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-white mb-1">Telefone Suporte</h3>
                <p className="text-cyan-400 font-semibold">{contactData.phone}</p>
              </div>
            </div>
            <div className="glass p-6 rounded-xl flex items-start gap-4">
              <Mail className="text-cyan-400 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-white mb-1">Email Geral</h3>
                <p className="text-cyan-400 font-semibold">{contactData.email}</p>
              </div>
            </div>
            <div className="glass p-6 rounded-xl flex items-start gap-4">
              <Clock className="text-cyan-400 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="font-bold text-white mb-1">Horário de Atendimento</h3>
                <p className="text-cyan-400 font-semibold">{contactData.hours}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-white mb-8">Equipe de TI</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactData.team.map((member) => (
              <div key={member.id} className="glass p-6 rounded-xl text-center hover:bg-white/20 transition-all duration-300">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-cyan-400"
                />
                <h3 className="font-bold text-white mb-1">{member.name}</h3>
                <p className="text-cyan-400 text-sm font-semibold mb-4">{member.role}</p>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300 truncate">{member.email}</p>
                  <p className="text-gray-300">{member.phone}</p>
                  <Button
                    size="sm"
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold mt-2"
                  >
                    <MessageCircle size={16} className="mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Help Articles */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-white mb-8">Base de Conhecimento</h2>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-3 mb-8">
            {helpCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className={`${
                  selectedCategory === category.id
                    ? "bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                    : "border-white/30 text-white hover:bg-white/10"
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label}
              </Button>
            ))}
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="glass p-6 rounded-xl hover:bg-white/20 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/20 px-3 py-1 rounded-full">
                    {helpCategories.find(c => c.id === article.category)?.label}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition">
                  {article.title}
                </h3>
                <p className="text-gray-300 text-sm mb-4">{article.description}</p>
                <div className="text-cyan-400 font-semibold text-sm group-hover:gap-2 flex items-center gap-1 transition">
                  Ler mais →
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-white mb-8">Perguntas Frequentes</h2>
          <div className="space-y-4 max-w-3xl">
            {[
              {
                q: "Como faço para resetar minha senha?",
                a: "Clique em 'Esqueci minha senha' na tela de login e siga as instruções enviadas para seu email.",
              },
              {
                q: "Qual é o tempo médio de resposta do suporte?",
                a: "Respondemos a 95% dos chamados dentro de 4 horas durante o horário comercial.",
              },
              {
                q: "Como abro um novo chamado?",
                a: "Acesse o portal, clique em 'Novo Chamado' e preencha os dados solicitados.",
              },
              {
                q: "Posso acessar o portal de qualquer lugar?",
                a: "Sim, o portal é acessível de qualquer lugar com conexão à internet.",
              },
            ].map((faq, index) => (
              <div key={index} className="glass p-6 rounded-xl">
                <h3 className="font-bold text-white mb-3">{faq.q}</h3>
                <p className="text-gray-300">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="glass p-12 rounded-2xl text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Não encontrou o que procura?</h2>
            <p className="text-gray-300 mb-6">Entre em contato conosco através do email ou telefone</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold px-8 py-6"
                onClick={() => window.location.href = `mailto:${contactData.email}`}
              >
                <Mail className="mr-2" size={20} />
                Enviar Email
              </Button>
              <Button
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold px-8 py-6"
                onClick={() => window.location.href = `tel:${contactData.phone.replace(/\D/g, '')}`}
              >
                <Phone className="mr-2" size={20} />
                Ligar Agora
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 backdrop-blur-md bg-white/5 mt-20">
          <div className="container mx-auto px-4 py-12 text-center text-gray-400 text-sm">
            <p>© 2026 JKINGS. Todos os direitos reservados. Portal de Demonstração - Dados Fictícios</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
