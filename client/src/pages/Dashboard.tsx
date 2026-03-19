import { useState, useEffect } from "react";
import { Bell, HelpCircle, LogOut, Menu, X, ChevronRight, Lock, Car, Laptop, Smartphone, Tablet, Monitor, Key, Package, Server } from "lucide-react";
import { useLocation } from "wouter";
import UserMenu from "@/components/UserMenu";
import BackButton from "@/components/BackButton";
import AdminAccessModal from "@/components/AdminAccessModal";
import CircuitBackground from "@/components/CircuitBackground";
import DashboardSearch from "@/components/DashboardSearch";

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
  id: number;
  nome: string;
  serial: string;
  tipo: string;
  status: string;
  fabricante?: string;
  modelo?: string;
}

interface TicketStatus {
  status: string;
  count: number;
  color: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  company: string;
  department: string;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Carregar dados do usuário logado
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const rawToken = localStorage.getItem('authToken');
        if (!rawToken) {
          setIsLoadingUser(false);
          return;
        }
        // Validar que o token é um JWT válido
        if (typeof rawToken !== 'string' || !rawToken.startsWith('eyJ') || rawToken.split('.').length !== 3) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('isAuthenticated');
          setIsLoadingUser(false);
          return;
        }
        
        const response = await fetch('/api/me', {
          headers: {
            'Authorization': `Bearer ${rawToken}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data);
        } else {
          console.error('Erro ao carregar perfil:', response.status);
          if (response.status === 401) {
            localStorage.removeItem('authToken');
          }
        }
      } catch (err) {
        console.error('Erro ao carregar perfil do usuário:', err);
      } finally {
        setIsLoadingUser(false);
      }
    };
    loadUserProfile();
  }, []);

  const services: ServiceCard[] = [
    {
      id: "1",
      title: "Treinamentos Online",
      icon: "https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/9GcwaVwvCRV3T5NPUEhvH9_1772062383882_na1fn_aWNvbi10cmVpbmFtZW50b3MtM2QtdHJhbnNwYXJlbnQ.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94LzlHY3dhVnd2Q1JWM1Q1TlBVRWh2SDlfMTc3MjA2MjM4Mzg4Ml9uYTFmbl9hV052YmkxMGNtVnBibUZ0Wlc1MGIzTXRNMlF0ZEhKaGJuTndZWEpsYm5RLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=ajqph0NEep1cClr~UKgYJ8ivr4S0CzPAuPOiscpgbC~2yJNdi96mu1iwhU084ZbvSJ6c19omsPcl7OtJuoLtJ434n-axXeDVA-kWI40vmWsJZtEwzC1pVBRM~7EqUInchxCnpMAk1o7WtoZHuaa9RR4m7R7mjAiZMYHY5DgoOdMtnXOSGhRJXTmbOSexOJdAPgWiPKNnCUFMjpBtrviE2yqNRxPA3Y-lEG3rjl53ZjoL8vItCqtFza1EEsdiW-db~YxLCJgp86R~0FneqW4QldKjLDefkkwhEKLbbsUPABnDmE1BZbsGOTDYFx692FRsHjbishGmMQvwBr2BIdHntw__",
      description: "Acesse nossos cursos e materiais"
    },
    {
      id: "2",
      title: "Termos de Responsabilidade",
      icon: "https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/9GcwaVwvCRV3T5NPUEhvH9_1772062383882_na1fn_aWNvbi10ZXJtb3MtM2QtdHJhbnNwYXJlbnQ.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94LzlHY3dhVnd2Q1JWM1Q1TlBVRWh2SDlfMTc3MjA2MjM4Mzg4Ml9uYTFmbl9hV052YmkxMFpYSnRiM010TTJRdGRISmhibk53WVhKbGJuUS5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=E1dtcij3g6Nl5NUyjuO2IogKrhczhsIv1k7v7hHnpmI3rcVbUmBZLNQnUoqvipPIOUtTFrkbHPtyaQ4QFLAojZSRNjWhCEt6Kg-jpe4HOucOnGmji6imWVBwnQSSEToQigoTGBjA5KRwMrrINwoJcxOMAM5cvR8h8Agh5Pabx9P6TY~m2M9o5LBWOoS1UxyXj6n~tPRQdjmw3s~TDdy~ohZq-QfRcjnwdxX1Y3KIUBIunmUr-hiiGd-dNHn4NCuwnWwK1GM-NBupNlpaM~Xa6SvpjWZLezZDUTemCsBVoNLGLTM8-T-26lbuhXhg73RsXv6lgQlPcCeVX1qbN~n07A__",
      description: "Documentos e políticas"
    },
    {
      id: "3",
      title: "Abrir Chamado",
      icon: "https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/9GcwaVwvCRV3T5NPUEhvH9_1772062383883_na1fn_aWNvbi1jaGFtYWRvLTNkLXRyYW5zcGFyZW50.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94LzlHY3dhVnd2Q1JWM1Q1TlBVRWh2SDlfMTc3MjA2MjM4Mzg4M19uYTFmbl9hV052YmkxamFHRnRZV1J2TFROa0xYUnlZVzV6Y0dGeVpXNTAucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=Q0wT9cMJeD3N3h3l4nx4nAzR1sJnhlyjTeZ7PtJBklB6DKuTkYY~vJPqRxZkcfouql2ziZb0LaiE1QJSzKoxTPNZAJJ8GMvySZjC0zbJGOxR8aGEAgVdOY6xAZR7R1MOBmKPdfozDdRSQ-YWYYPxoLacKySoc2pgCPRtDu9mZha2O04UYYvEklnHwztIRnLQqGeX18mhWlLcBd5-oSzBae73npfSfrtEuAeW~ye1qKWwnHtxeC9vV03oOqWeQAYL6jtvF1bq85fDbJVdNvCAqnveav9m1eGDNsJd9dIxTyD0x-4IzOXNAxGHDwnVavzXxK9oBys2SxC9zaWJ7nxtGw__",
      description: "Solicite suporte técnico"
    },
    {
      id: "4",
      title: "Ticket de Estacionamento",
      icon: "https://d2xsxph8kpxj0f.cloudfront.net/310519663168635381/2ppvVQqQXicPrS84JQM2bL/car-qrcode-icon-user_3e21d79e.png",
      description: "Solicite seu ticket de estacionamento"
    },
    {
      id: "5",
      title: "Gestão de Qualidade",
      icon: "https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/9GcwaVwvCRV3T5NPUEhvH9_1772062383884_na1fn_aWNvbi1xdWFsaWRhZGUtM2QtdHJhbnNwYXJlbnQ.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94LzlHY3dhVnd2Q1JWM1Q1TlBVRWh2SDlfMTc3MjA2MjM4Mzg4NF9uYTFmbl9hV052YmkxeGRXRnNhV1JoWkdVdE0yUXRkSEpoYm5Od1lYSmxiblEucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=mYoZXtRfCWH9yf-XjkXSa9ck8kW1wltCsODKZzXFQYt0KMU8LIhs4lwPJw7oDj51HU65G-3vn5hoaFF7SCXKwqe1kwc~I01L8G70wW96P9K1Vxa3R5rBYpB3eRJIfqt-ls7ZT8OJ5gzW~XkEnfO1fFPdCdF-us2r6oPSbubJPbuZfWt1w19BpyolJ6MOylwDt2T64EmmpahH1GVUJ9ZnzQkX33rJYrvUKSwVUd3rsAygOov1TeMgESVBD25xbkGftKNELKQHpATF740ZQFI~TXU7PhNBgf8pZCuXaiBjF6Dv3o8Xo4S-jZO6TceVEoN3Rlul8iiR7r1lXERQ2-I0kg__",
      description: "Acesse o sistema VIGIX"
    },
    {
      id: "8",
      title: "Histórico de Chamados",
      icon: "https://d2xsxph8kpxj0f.cloudfront.net/310519663168635381/2ppvVQqQXicPrS84JQM2bL/icon-historico-chamados-v2-3d-W7HEUTZUNNAZQEEwG485z5.webp",
      description: "Acompanhe suas solicitações"
    }
  ];

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(true);

  // Carregar ativos do usuário logado
  useEffect(() => {
    const loadEquipment = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) { setIsLoadingEquipment(false); return; }
        const response = await fetch('/api/ativos/meus', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setEquipment(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Erro ao carregar equipamentos:', err);
      } finally {
        setIsLoadingEquipment(false);
      }
    };
    loadEquipment();
  }, []);

  const [ticketStatus, setTicketStatus] = useState<TicketStatus[]>([
    { status: "Abertos", count: 0, color: "bg-blue-500" },
    { status: "Em Andamento", count: 0, color: "bg-yellow-500" },
    { status: "Resolvidos", count: 0, color: "bg-green-500" },
    { status: "Fechados", count: 0, color: "bg-slate-500" },
  ]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);

  // Carregar status dos chamados do usuário logado
  useEffect(() => {
    const loadTicketStats = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) { setIsLoadingTickets(false); return; }
        const response = await fetch('/api/support/stats', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          // Processar tickets (chamados)
          const ticketMap: Record<string, number> = {};
          if (Array.isArray(data.tickets)) {
            data.tickets.forEach((row: any) => {
              ticketMap[row.status] = Number(row.count);
            });
          }
          // Processar requests (requisições) também
          if (Array.isArray(data.byStatus)) {
            data.byStatus.forEach((row: any) => {
              ticketMap[row.status] = (ticketMap[row.status] || 0) + Number(row.count);
            });
          }
          setTicketStatus([
            { status: 'Abertos', count: (ticketMap['aberto'] || 0) + (ticketMap['pendente'] || 0), color: 'bg-blue-500' },
            { status: 'Em Andamento', count: (ticketMap['em_andamento'] || 0) + (ticketMap['em_analise'] || 0), color: 'bg-yellow-500' },
            { status: 'Resolvidos', count: (ticketMap['resolvido'] || 0) + (ticketMap['aprovado'] || 0), color: 'bg-green-500' },
            { status: 'Fechados', count: (ticketMap['fechado'] || 0) + (ticketMap['cancelado'] || 0), color: 'bg-slate-500' },
          ]);
        }
      } catch (err) {
        console.error('Erro ao carregar status dos chamados:', err);
      } finally {
        setIsLoadingTickets(false);
      }
    };
    loadTicketStats();
  }, []);


  const handleLogout = () => {
    console.log("Logout");
    window.location.href = "/";
  };

  return (
    <div 
      className="min-h-screen"
      style={{ background: "#020810", position: "relative" }}
    >
      {/* Background animado de circuito eletrônico */}
      <CircuitBackground />

      {/* Overlay suave sobre o canvas */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1, background: "linear-gradient(to bottom, rgba(2,8,16,0.15) 0%, rgba(2,8,16,0.05) 50%, rgba(2,8,16,0.25) 100%)" }} />

      <div className="relative z-10">
        {/* Header — Alura-inspired */}
        <header className="sticky top-0 z-50" style={{ background: 'rgba(1,8,14,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(43,222,253,0.15)', boxShadow: '0 1px 0 rgba(43,222,253,0.06)' }}>
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
                    filter: 'drop-shadow(0 0 15px rgba(34, 211, 238, 0.5)) drop-shadow(0 0 30px rgba(34, 211, 238, 0.2))'
                  }}
                />
              </div>

              {/* Barra de Busca Global — DashboardSearch */}
              <div className="flex-1 max-w-xl mx-3 sm:mx-6 hidden sm:block">
                <DashboardSearch />
              </div>

              {/* Ações do Header */}
              <div className="flex items-center gap-1 sm:gap-4">
                <button className="hidden sm:flex transition-colors p-2" style={{ color: 'rgba(152,212,222,0.8)' }}>
                  <Bell className="w-5 h-5" />
                </button>
                <button className="hidden sm:flex transition-colors p-2" style={{ color: 'rgba(152,212,222,0.8)' }}>
                  <HelpCircle className="w-5 h-5" />
                </button>
                
                {/* User Menu */}
                <div className="flex items-center gap-2 sm:gap-3 sm:pl-4 sm:border-l border-white/20">
                  <UserMenu showHome={true} onAdminAccessClick={() => setShowAdminModal(true)} />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Barra de busca mobile */}
          <div className="sm:hidden mb-4">
            <DashboardSearch />
          </div>

          {/* Welcome Banner — Alura-inspired */}
          <div className="rounded-xl p-4 sm:p-8 mb-6 sm:mb-8 overflow-hidden relative animate-fade-in-up" style={{ minHeight: '80px', background: 'var(--alura-bg-card)', border: '1px solid rgba(43,222,253,0.18)', boxShadow: '0 2px 16px rgba(0,0,0,0.35)' }}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <h1 className="font-bold mb-2" style={{ fontSize: '20px', fontFamily: 'Poppins, Inter, sans-serif', color: '#D7F9FF' }}>
                Olá, {userProfile?.name || 'Usuário'}!
              </h1>
              <p className="font-light" style={{ fontSize: '15px', color: '#98D4DE', fontFamily: 'Inter, sans-serif' }}>
                Como podemos ajudar você hoje?
              </p>
            </div>
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {services.map((service: ServiceCard) => (
              <div
                key={service.id}
                onClick={() => {
                  if (service.id === "1") {
                    setLocation("/treinamentos");
                  } else if (service.id === "2") {
                    setLocation("/terms");
                  } else if (service.id === "3") {
                    setLocation("/tickets");
                  } else if (service.id === "4") {
                    setLocation("/estacionamento/solicitar");
                  } else if (service.id === "5") {
                    setLocation("/vigix");
                  } else if (service.id === "8") {
                    setLocation("/reports");
                  }
                }}
                className="rounded-xl p-3 sm:p-6 cursor-pointer group transition-all duration-250 hover:-translate-y-1"
                style={{ background: 'var(--alura-bg-card)', border: '1px solid rgba(43,222,253,0.15)', boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(43,222,253,0.4)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.4), 0 0 16px rgba(43,222,253,0.12)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(43,222,253,0.15)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.3)'; }}
              >
                <div className="mb-2 sm:mb-4">
                  {service.id === "4" ? (
                    <div className="w-12 h-12 sm:w-20 sm:h-20 flex items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(8,145,178,0.25) 100%)", border: "1px solid rgba(6,182,212,0.3)" }}>
                      <Car className="w-6 h-6 sm:w-10 sm:h-10" style={{ color: "#22d3ee", filter: "drop-shadow(0 0 8px rgba(34,211,238,0.5))" }} strokeWidth={1.5} />
                    </div>
                  ) : service.icon.startsWith('http') ? (
                    <img src={service.icon} alt={service.title} className="w-12 h-12 sm:w-20 sm:h-20 object-contain" />
                  ) : (
                    <div className="text-2xl sm:text-4xl">{service.icon}</div>
                  )}
                </div>
                <h3 className="font-bold text-sm sm:text-lg mb-1 sm:mb-2 leading-tight" style={{ color: '#D7F9FF', fontFamily: 'Poppins, Inter, sans-serif' }}>
                  {service.title}
                </h3>
                <p className="text-xs sm:text-sm mb-2 sm:mb-4 hidden sm:block" style={{ color: '#98D4DE', fontFamily: 'Inter, sans-serif' }}>
                  {service.description}
                </p>
                <div className="flex items-center group-hover:translate-x-1 transition-transform font-bold" style={{ color: '#2BDEFD' }}>
                  <span className="text-xs sm:text-sm font-medium">Acessar</span>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                </div>
              </div>
            ))}
          </div>

          {/* Info Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Meus Equipamentos */}
            <div className="rounded-xl p-4 sm:p-6 animate-fade-in-up animate-delay-100" style={{ background: 'var(--alura-bg-card)', border: '1px solid rgba(43,222,253,0.15)', boxShadow: '0 2px 16px rgba(0,0,0,0.3)' }}>
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <img src="https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/DDJLSreuqGRx2hJLgYzICl_1772064317166_na1fn_aWNvbi1lcXVpcGFtZW50b3MtM2QtdHJhbnNwYXJlbnQtdjI.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94L0RESkxTcmV1cUdSeDJoSkxnWXpJQ2xfMTc3MjA2NDMxNzE2Nl9uYTFmbl9hV052YmkxbGNYVnBjR0Z0Wlc1MGIzTXRNMlF0ZEhKaGJuTndZWEpsYm5RdGRqSS5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=ONfgCB~y26sPXGh6Hd526PHQvcis0K3VOOD3cakhz-6U1fd0PewtL943zMGMTeyZ3thnPs~5ni-bm3I6yXlzsxIWoIXT0jqnQvxudgIOZLar9Hl1xr3xZBsby-WNH~wfDSIWfy~WcnR~SzRu5rHpf2drJbzAczPEUpbDhx0filKo-F2j0ypF6MiRjQgaCDqp9fh4yt9h~FVdn5b5Em3le3ccS~FGycRlu8-o6A75jcGOLXyZZbwEZFOrskAviM1jAEhO5p4FzqZadQqnExX2ehGAtFuk6nrMLWQ17htgWenxP7kd5sn24HFqKULJxLv~DN6RI8hxs3SPFkZyzAwAUw__" alt="Equipamentos" className="w-9 h-9 sm:w-12 sm:h-12" />
                <h2 className="font-bold text-lg sm:text-xl" style={{ color: '#2BDEFD', fontFamily: 'Poppins, Inter, sans-serif' }}>Meus Equipamentos</h2>
              </div>
              {isLoadingEquipment ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-12 rounded-lg skeleton-shimmer" style={{ borderRadius: '6px' }} />
                  ))}
                </div>
              ) : equipment.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-white/40 text-sm">Nenhum equipamento atribuído</p>
                  <p className="text-white/25 text-xs mt-1">Contate o TI para vincular seus ativos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {equipment.map((item) => (
                                  <div key={item.id ?? item.serial ?? item.nome} className="flex items-center gap-3 pb-3 last:pb-0" style={{ borderBottom: '1px solid rgba(43,222,253,0.07)' }}>
                        <div className="p-2 rounded-lg flex-shrink-0" style={{ background: 'rgba(43,222,253,0.08)', border: '1px solid rgba(43,222,253,0.18)' }}>
                        {item.tipo === 'notebook'    ? <Laptop     className="w-5 h-5 text-cyan-400" /> :
                         item.tipo === 'smartphone' ? <Smartphone className="w-5 h-5 text-cyan-400" /> :
                         item.tipo === 'tablet'     ? <Tablet     className="w-5 h-5 text-cyan-400" /> :
                         item.tipo === 'monitor'    ? <Monitor    className="w-5 h-5 text-cyan-400" /> :
                         item.tipo === 'licenca'    ? <Key        className="w-5 h-5 text-cyan-400" /> :
                         item.tipo === 'outros'     ? <Package    className="w-5 h-5 text-cyan-400" /> :
                         /* legado */
                         item.tipo === 'hardware'   ? <Laptop     className="w-5 h-5 text-cyan-400" /> :
                         item.tipo === 'software'   ? <Package    className="w-5 h-5 text-cyan-400" /> :
                                                      <Server     className="w-5 h-5 text-cyan-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{item.nome}</p>
                        <p className="text-gray-400 text-xs truncate">
                          {item.fabricante ? `${item.fabricante} • ` : ''}{item.modelo || item.serial}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                        item.status === 'alocado' ? 'bg-blue-500/20 text-blue-300' :
                        item.status === 'disponivel' ? 'bg-green-500/20 text-green-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {item.status === 'alocado' ? 'Alocado' : item.status === 'disponivel' ? 'Disponível' : 'Manutenção'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* JLX – Classificados Internos */}
            <div
              className="rounded-xl p-4 sm:p-6 cursor-pointer group transition-all duration-250 animate-fade-in-up animate-delay-150"
              style={{ background: 'var(--alura-bg-card)', border: '1px solid rgba(43,222,253,0.15)', boxShadow: '0 2px 16px rgba(0,0,0,0.3)' }}
              onClick={() => setLocation('/jlx')}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(43,222,253,0.35)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(43,222,253,0.15)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310519663168635381/2ppvVQqQXicPrS84JQM2bL/jlx-logo2_ed0dbf4f.png"
                    alt="JLX"
                    className="h-10 sm:h-14 object-contain drop-shadow-lg group-hover:scale-105 transition-transform"
                  />
                  <div>
                    <h2 className="text-amber-300 font-bold text-base sm:text-lg leading-tight">Classificados Internos</h2>
                    <p className="text-amber-200/60 text-xs">Venda, troque ou doe para colegas</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Categorias decorativas */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { icon: '📱', label: 'Eletrônicos', color: 'bg-blue-500/20 border-blue-500/30' },
                  { icon: '👕', label: 'Vestuário', color: 'bg-purple-500/20 border-purple-500/30' },
                  { icon: '💻', label: 'Informática', color: 'bg-cyan-500/20 border-cyan-500/30' },
                  { icon: '📖', label: 'Livros', color: 'bg-green-500/20 border-green-500/30' },
                  { icon: '🏠', label: 'Móveis', color: 'bg-amber-500/20 border-amber-500/30' },
                  { icon: '📦', label: 'Outros', color: 'bg-slate-500/20 border-slate-500/30' },
                ].map((cat) => (
                  <div key={cat.label} className={`flex flex-col items-center justify-center p-2 rounded-lg border ${cat.color}`}>
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-xs text-white/70 mt-0.5 hidden sm:block">{cat.label}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex gap-2">
                  <span className="px-2 py-1 rounded-full text-xs bg-emerald-900/50 border border-emerald-700 text-emerald-300">Venda</span>
                  <span className="px-2 py-1 rounded-full text-xs bg-blue-900/50 border border-blue-700 text-blue-300">Troca</span>
                  <span className="px-2 py-1 rounded-full text-xs bg-purple-900/50 border border-purple-700 text-purple-300">Doação</span>
                </div>
                <span className="text-amber-400 text-xs font-semibold group-hover:text-amber-300">Acessar →</span>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
            <button onClick={() => setLocation("/help")} className="rounded-lg px-6 py-3 font-bold transition-all flex items-center justify-center gap-2" style={{ background: 'var(--alura-bg-card)', border: '1px solid rgba(43,222,253,0.3)', color: '#2BDEFD', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>
              <HelpCircle className="w-5 h-5" />
              Central de Ajuda
            </button>
            <button onClick={() => setLocation("/faq")} className="rounded-lg px-6 py-3 font-bold transition-all flex items-center justify-center gap-2" style={{ background: 'var(--alura-bg-card)', border: '1px solid rgba(43,222,253,0.3)', color: '#2BDEFD', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>
              <span>📋</span>
              FAQ
            </button>
            <button onClick={() => setLocation("/policy")} className="rounded-lg px-6 py-3 font-bold transition-all flex items-center justify-center gap-2" style={{ background: 'var(--alura-bg-card)', border: '1px solid rgba(43,222,253,0.3)', color: '#2BDEFD', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>
              <span>🛡️</span>
              Políticas de TI
            </button>
          </div>

          {/* Admin Access Button */}
          <button
            onClick={() => setShowAdminModal(true)}
            className="w-full rounded-lg px-6 py-3 font-bold transition-all flex items-center justify-center gap-2" style={{ background: 'rgba(43,222,253,0.06)', border: '1px solid rgba(43,222,253,0.25)', color: '#2BDEFD', fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.875rem' }}
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
