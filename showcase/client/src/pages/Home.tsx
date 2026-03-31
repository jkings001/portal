import { useLocation } from "wouter";
import { showcaseModules } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import AuroraBackground from "@/components/AuroraBackground";

export default function Home() {
  const [, setLocation] = useLocation();

  const routeMap: { [key: string]: string } = {
    dashboard: '/dashboard',
    helpdesk: '/helpdesk',
    training: '/training',
    teams: '/teams',
    reports: '/reports',
    companies: '/companies',
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AuroraBackground />


      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-md bg-white/5">
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">JK</span>
              </div>
              <h1 className="text-2xl font-bold text-white">JKINGS Showcase</h1>
            </div>
            <nav className="flex gap-4">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={() => setLocation("/help")}
              >
                Central de Ajuda
              </Button>
              <Button
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
                onClick={() => setLocation("/help")}
              >
                Contato
              </Button>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Soluções Avançadas em Tecnologia
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Explore nossos módulos de demonstração: gestão de chamados, help desk, treinamentos, integração Teams, relatórios e gestão multi-empresa
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold px-8 py-6 text-lg"
              onClick={() => setLocation("/dashboard")}
            >
              Explorar Demonstração <ArrowRight className="ml-2" />
            </Button>
            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg"
              onClick={() => setLocation("/help")}
            >
              Saiba Mais
            </Button>
          </div>
        </section>

        {/* Modules Grid */}
        <section className="container mx-auto px-4 py-20">
          <h3 className="text-3xl font-bold text-white mb-12 text-center">Nossos Módulos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showcaseModules.map((module, index) => (
              <div
                key={module.id}
                className="group cursor-pointer animate-slide-in"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => setLocation(routeMap[module.id] || "/")}
              >
                <div className="glass glass-hover glow-hover p-8 rounded-2xl h-full flex flex-col justify-between transform transition-all duration-300 hover:-translate-y-2">
                  <div>
                    <div className="text-5xl mb-4">{module.icon}</div>
                    <h4 className="text-2xl font-bold text-white mb-3">{module.title}</h4>
                    <p className="text-gray-300 mb-6">{module.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold group-hover:gap-3 transition-all">
                    Explorar <ArrowRight size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { number: "+15", label: "Anos de Experiência" },
              { number: "+500", label: "Empresas Atendidas" },
              { number: "95%", label: "Chamados Resolvidos no Mesmo Dia" },
              { number: "98%", label: "Chamados Resolvidos Remotamente" },
            ].map((stat, index) => (
              <div key={index} className="glass p-6 rounded-xl text-center">
                <div className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">{stat.number}</div>
                <div className="text-sm text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="container mx-auto px-4 py-20">
          <h3 className="text-3xl font-bold text-white mb-12 text-center">Por que escolher JKINGS?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Redução de Custos",
                description: "Otimize seus gastos com TI e infraestrutura",
              },
              {
                title: "Aumento de Produtividade",
                description: "Sistemas operacionais sem interrupção",
              },
              {
                title: "Planejamento Estratégico",
                description: "Soluções dimensionadas corretamente para seu negócio",
              },
            ].map((benefit, index) => (
              <div key={index} className="glass p-8 rounded-xl">
                <h4 className="text-xl font-bold text-white mb-3">{benefit.title}</h4>
                <p className="text-gray-300">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 backdrop-blur-md bg-white/5 mt-20">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h5 className="font-bold text-white mb-4">Sobre</h5>
                <p className="text-gray-400 text-sm">Portal de demonstração com dados fictícios para showcase dos módulos JKINGS</p>
              </div>
              <div>
                <h5 className="font-bold text-white mb-4">Links Rápidos</h5>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition">Central de Ajuda</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition">Contato</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition">Termos de Serviço</a></li>
                </ul>
              </div>
              <div>
                <h5 className="font-bold text-white mb-4">Contato</h5>
                <p className="text-gray-400 text-sm">(11) 96415-6881</p>
                <p className="text-gray-400 text-sm">suporte@jkings.com.br</p>
              </div>
            </div>
            <div className="border-t border-white/10 pt-8 text-center text-gray-400 text-sm">
              <p>© 2026 JKINGS. Todos os direitos reservados. Portal de Demonstração - Dados Fictícios</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
