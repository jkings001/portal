import { useState } from "react";
import { Bell, HelpCircle, LogOut, Menu, X, ChevronRight, Lock } from "lucide-react";
import { useLocation } from "wouter";
import UserMenu from "@/components/UserMenu";
import BackButton from "@/components/BackButton";
import AdminAccessModal from "@/components/AdminAccessModal";

/**
 * Design Philosophy: Glassmorphism Futurista
 * - Mantém a paleta azul profunda do design original
 * - Cards glassmorphic com efeito de vidro
 * - Botões com estilos consistentes (ciano primário, bordas secundárias)
 * - Layout responsivo com sidebar colapsável
 */

interface ServiceCard {
  id: string;
  title: string;
  icon: string;
  description?: string;
}

interface Equipment {
  name: string;
  model: string;
}

interface TicketStatus {
  status: string;
  count: number;
  color: string;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName] = useState("Carol");
  const [showAdminModal, setShowAdminModal] = useState(false);

  const serviceCards: ServiceCard[] = [
    {
      id: "1",
      title: "Treinamentos Online",
      icon: "🎓",
      description: "Acesse nossos cursos e materiais"
    },
    {
      id: "2",
      title: "Termos de Responsabilidade",
      icon: "📋",
      description: "Documentos e políticas"
    },
    {
      id: "3",
      title: "Abrir Chamado",
      icon: "🎧",
      description: "Solicite suporte técnico"
    },
    {
      id: "4",
      title: "Histórico de Chamados",
      icon: "⏱️",
      description: "Acompanhe suas solicitações"
    }
  ];

  const equipment: Equipment[] = [
    { name: "Notebook", model: "Dell Latitude 7420" },
    { name: "Smartphone", model: "iPhone 14" },
    { name: "Monitor", model: "LG 21\"" }
  ];

  const ticketStatus: TicketStatus[] = [
    { status: "Abertos", count: 2, color: "bg-blue-500" },
    { status: "Em Andamento", count: 1, color: "bg-yellow-500" },
    { status: "Resolvidos", count: 7, color: "bg-green-500" }
  ];

  const handleLogout = () => {
    console.log("Logout");
    window.location.href = "/";
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-black"
      style={{
        backgroundImage: "url('https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/HvVqCE7k0Noj0nuQ0XGqJh-img-1_1770239210000_na1fn_YmctZGFzaGJvYXJkLXVzZXI.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94L0h2VnFDRTdrME5vajBudVEwWEdxSmgtaW1nLTFfMTc3MDIzOTIxMDAwMF9uYTFmbl9ZbWN0WkdGemFHSnZZWEprTFhWelpYSS5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=ORPxLnGzZ4EMhLumGPBPtRwu4L5tYIte7mU76TmKHzrD2KvF3u~AYTTKcBNEWbKW-p4CJv-oDp2auOhGjc0SoVeOPH6U1hgJqE5agXMUdMs5Y5i2C-Wg9PqHP3-c2OGdCOw2sA9ySu8vK5SXBoAbX5uPecstmkNTpgyvhq1WVUUI5CS5pdUSN4k8U4x3Mboadc5d0cUUu9m5bLD4lZ2Le6PiiIeN2rLDVeMaDT-oev7LON~QwN4k4ceET9tNwxx1atwdKUPIwtpPEZBF6vb-i44K5l-Ggm90kSVYh3FZzajGCnhvMwuF9R0StsbFy3ZQ3GBoPjVxP3GrE1-Pmv8nDA__')",
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
              {/* Logo e Menu */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden text-white hover:text-cyan-400 transition-colors"
                >
                  {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <img 
                  src="/images/logo-jkings.png" 
                  alt="JKINGS" 
                  className="h-8"
                />
              </div>

              {/* Ações do Header */}
              <div className="flex items-center gap-4">
                <button className="text-white hover:text-cyan-400 transition-colors p-2">
                  <Bell className="w-5 h-5" />
                </button>
                <button className="text-white hover:text-cyan-400 transition-colors p-2">
                  <HelpCircle className="w-5 h-5" />
                </button>
                
                {/* User Menu */}
                <div className="flex items-center gap-3 pl-4 border-l border-white/20">
                  <UserMenu showHome={true} onAdminAccessClick={() => setShowAdminModal(true)} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Banner */}
          <div className="glassmorphic rounded-2xl p-8 mb-8 overflow-hidden relative" style={{height: '105px'}}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <h1 className="text-4xl font-bold text-white mb-2" style={{fontSize: '20px'}}>
                Bem-vinda, {userName}!
              </h1>
              <p className="text-xl text-gray-200 font-light" style={{fontSize: '15px'}}>
                Como podemos ajudar você hoje?
              </p>
            </div>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {serviceCards.map((service) => (
              <div
                key={service.id}
                onClick={() => {
                  if (service.id === "1") {
                    setLocation("/training");
                  } else if (service.id === "2") {
                    setLocation("/terms");
                  } else if (service.id === "3") {
                    setLocation("/support");
                  } else if (service.id === "4") {
                    setLocation("/tickets");
                  }
                }}
                className="glassmorphic rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 cursor-pointer group"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  {service.description}
                </p>
                <div className="flex items-center text-cyan-400 group-hover:translate-x-1 transition-transform">
                  <span className="text-sm font-medium">Acessar</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            ))}
          </div>

          {/* Info Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Meus Equipamentos */}
            <div className="glassmorphic rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-3xl">💻</div>
                <h2 className="text-white font-bold text-xl">Meus Equipamentos</h2>
              </div>
              <div className="space-y-4">
                {equipment.map((item, idx) => (
                  <div key={idx} className="border-b border-white/10 pb-4 last:border-0">
                    <p className="text-white font-semibold">{item.name}</p>
                    <p className="text-gray-400 text-sm">{item.model}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Status dos Chamados */}
            <div className="glassmorphic rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">📊</div>
                  <h2 className="text-white font-bold text-xl">Status dos Chamados</h2>
                </div>
              </div>
              <div className="space-y-4 mb-6">
                {ticketStatus.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-gray-300">{item.status}</span>
                    </div>
                    <span className="text-white font-bold text-lg">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <button onClick={() => setLocation("/help")} className="glassmorphic rounded-lg px-6 py-3 text-white font-medium hover:bg-white/15 transition-all flex items-center justify-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Central de Ajuda
            </button>
            <button onClick={() => setLocation("/faq")} className="glassmorphic rounded-lg px-6 py-3 text-white font-medium hover:bg-white/15 transition-all flex items-center justify-center gap-2">
              <span>📋</span>
              FAQ
            </button>
            <button onClick={() => setLocation("/policy")} className="glassmorphic rounded-lg px-6 py-3 text-white font-medium hover:bg-white/15 transition-all flex items-center justify-center gap-2">
              <span>🛡️</span>
              Políticas de TI
            </button>
          </div>

          {/* Admin Access Button */}
          <button
            onClick={() => setShowAdminModal(true)}
            className="w-full glassmorphic rounded-lg px-6 py-3 text-white font-medium hover:bg-white/15 transition-all flex items-center justify-center gap-2 border border-purple-500/50 hover:border-purple-400 bg-purple-500/10"
          >
            <Lock className="w-5 h-5" />
            Acessar Painel de Administrador
          </button>
        </main>
      </div>

      {/* Admin Access Modal */}
      <AdminAccessModal 
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />
    </div>
  );
}
