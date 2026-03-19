import { useState } from 'react';
import { ChevronRight, Shield, Zap, Lock, Headphones, Settings, CheckCircle, ArrowRight, Menu, X, Bell, HelpCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import UserMenu from '@/components/UserMenu';

/**
 * Página Solution - Serviços de TI
 * Design: Glassmorphism com características visuais do Dashboard
 */

interface ServiceCard {
  id: string;
  title: string;
  icon: string;
  description: string;
}

export default function Solution() {
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const serviceCards: ServiceCard[] = [
    {
      id: '1',
      title: 'Assessoria em TI',
      icon: '🧠',
      description: 'Consultoria especializada',
    },
    {
      id: '2',
      title: 'Monitoramento 24/7',
      icon: '📡',
      description: 'Proteção contínua',
    },
    {
      id: '3',
      title: 'Segurança Digital',
      icon: '🔒',
      description: 'Proteção completa',
    },
    {
      id: '4',
      title: 'Help Desk 24/7',
      icon: '🎧',
      description: 'Suporte imediato',
    },
  ];

  const services = [
    {
      id: 1,
      title: 'Assessoria em TI',
      description: 'Consultoria especializada para otimizar sua infraestrutura tecnológica',
    },
    {
      id: 2,
      title: 'Monitoramento Preventivo',
      description: 'Monitoramento 24/7 de sua rede e sistemas para evitar problemas',
    },
    {
      id: 3,
      title: 'Segurança Digital',
      description: 'Proteção completa contra ameaças e vulnerabilidades',
    },
    {
      id: 4,
      title: 'Help Desk 24/7',
      description: 'Suporte técnico imediato presencial ou remoto',
    },
    {
      id: 5,
      title: 'Segurança de Dados',
      description: 'Backup, criptografia e conformidade com LGPD',
    },
    {
      id: 6,
      title: 'Firewall & Internet',
      description: 'Proteção e gestão avançada de internet e acesso',
    },
  ];

  const advantages = [
    { title: 'Atendimento Imediato', icon: '⚡' },
    { title: 'Tecnologia de Ponta', icon: '🚀' },
    { title: 'Microsoft Partner', icon: '✓' },
    { title: 'Equipe Especializada', icon: '👨‍💼' },
  ];

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Formulário enviado:', formData);
    setFormSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', message: '' });
      setFormSubmitted(false);
    }, 3000);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-black"
      style={{
        backgroundImage: "url('https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/HvVqCE7k0Noj0nuQ0XGqJh-img-1_1770239210000_na1fn_YmctZGFzaGJvYXJkLXVzZXI.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94L0h2VnFDRTdrME5vajBudVEwWEdxSmgtaW1nLTFfMTc3MDIzOTIxMDAwMF9uYTFmbl9ZbWN0WkdGemFHSnZZWEprTFhWelpYSS5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=ORPxLnGzZ4EMhLumGPBPtRwu4L5tYIte7mU76TmKHzrD2KvF3u~AYTTKcBNEWbKW-p4CJv-oDp2auOhGjc0SoVeOPH6U1hgJqE5agXMUdMs5Y5i2C-Wg9PqHP3-c2OGdCOw2sA9ySu8vK5SXBoAbX5uPecstmkNTpgyvhq1WVUUI5CS5pdUSN4k8U4x3Mboadc5d0cUUu9m5bLD4lZ2Le6PiiIeN2rLDVeMaDT-oev7LON~QwN4k4ceET9tNwxx1atwdKUPIwtpPEZBF6vb-i44K5l-Ggm90kSVYh3FZzajGCnhvMwuF9R0StsbFy3ZQ3GBoPjVxP3GrE1-Pmv8nDA__')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
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
                  src="/images/logo-jkings-dashboard.png"
                  alt="JKINGS"
                  className="h-8 transition-all duration-300 hover:scale-110"
                  style={{
                    filter: 'drop-shadow(0 0 15px rgba(34, 211, 238, 0.5)) drop-shadow(0 0 30px rgba(34, 211, 238, 0.2))',
                  }}
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
                  <UserMenu showHome={true} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Banner */}
          <div className="glassmorphic rounded-2xl p-8 mb-8 overflow-hidden relative">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <h1 className="text-4xl font-bold text-cyan-300 mb-2">
                Soluções em Informática
              </h1>
              <p className="text-xl text-cyan-200 font-light">
                Assessoria e Suporte em TI para sua empresa
              </p>
            </div>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {serviceCards.map((service) => (
              <div
                key={service.id}
                onClick={() => setLocation('/support')}
                className="glassmorphic rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 cursor-pointer group"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-cyan-200 font-bold text-lg mb-2">
                  {service.title}
                </h3>
                <p className="text-cyan-100 text-sm mb-4">
                  {service.description}
                </p>
                <div className="flex items-center text-cyan-300 group-hover:translate-x-1 transition-transform font-bold">
                  <span className="text-sm font-medium">Acessar</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            ))}
          </div>

          {/* Info Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Serviços Completos */}
            <div className="glassmorphic rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-3xl">⚙️</div>
                <h2 className="text-cyan-300 font-bold text-xl">Nossos Serviços</h2>
              </div>
              <div className="space-y-4">
                {services.slice(0, 3).map((service) => (
                  <div key={service.id} className="border-b border-white/10 pb-4 last:border-0">
                    <p className="text-white font-semibold">{service.title}</p>
                    <p className="text-gray-400 text-sm">{service.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vantagens */}
            <div className="glassmorphic rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">⭐</div>
                  <h2 className="text-cyan-300 font-bold text-xl">Por que nos escolher?</h2>
                </div>
              </div>
              <div className="space-y-4 mb-6">
                {advantages.map((advantage, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{advantage.icon}</span>
                      <span className="text-gray-300">{advantage.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Formulário de Contato */}
          <div className="glassmorphic rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-cyan-300 mb-6">Entre em Contato</h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Seu nome"
                  required
                  className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-colors"
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="Seu e-mail"
                  required
                  className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleFormChange}
                placeholder="Sua mensagem"
                required
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-colors resize-none"
              ></textarea>
              <button
                type="submit"
                className="w-full glassmorphic rounded-lg px-6 py-3 text-cyan-300 font-bold hover:bg-cyan-400/20 transition-all flex items-center justify-center gap-2 border border-cyan-400/50 hover:border-cyan-300"
              >
                {formSubmitted ? '✓ Mensagem Enviada!' : 'Enviar Mensagem'}
              </button>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setLocation('/support')}
              className="glassmorphic rounded-lg px-6 py-3 text-cyan-300 font-bold hover:bg-cyan-400/20 transition-all flex items-center justify-center gap-2 border border-cyan-400/50 hover:border-cyan-300"
            >
              <Zap className="w-5 h-5" />
              Abrir Chamado
            </button>
            <a
              href="https://wa.me/551125003068"
              target="_blank"
              rel="noopener noreferrer"
              className="glassmorphic rounded-lg px-6 py-3 text-cyan-300 font-bold hover:bg-cyan-400/20 transition-all flex items-center justify-center gap-2 border border-cyan-400/50 hover:border-cyan-300"
            >
              <span>💬</span>
              WhatsApp
            </a>
            <button
              onClick={() => setLocation('/help')}
              className="glassmorphic rounded-lg px-6 py-3 text-cyan-300 font-bold hover:bg-cyan-400/20 transition-all flex items-center justify-center gap-2 border border-cyan-400/50 hover:border-cyan-300"
            >
              <HelpCircle className="w-5 h-5" />
              Suporte
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
