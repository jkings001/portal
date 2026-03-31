// Mock data for showcase - all fictional data for demonstration purposes

export const contactData = {
  phone: "(11) 96415-6881",
  email: "suporte@jkings.com.br",
  hours: "Seg-Sex 08h-18h",
  team: [
    {
      id: 1,
      name: "Jeferson Reis",
      role: "IT Manager",
      email: "jeferson.reis@external.hartmann.info",
      phone: "(11) 96415-6881",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    {
      id: 2,
      name: "Thainá Godoy",
      role: "Business Administrator",
      email: "thaina.godoy@external.hartmann.info",
      phone: "(11) 92156-4688",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    {
      id: 3,
      name: "Filipi Farbo",
      role: "IT Specialist",
      email: "filipi.farbo@external.hartmann.info",
      phone: "(11) 94019-0380",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    {
      id: 4,
      name: "Henrique Hipólito",
      role: "IT Specialist",
      email: "henrique.hipolito@external.hartmann.info",
      phone: "(11) 97264-7900",
      avatar: "https://i.pravatar.cc/150?img=4",
    },
  ],
};

export const helpCategories = [
  { id: "all", label: "Todas" },
  { id: "getting-started", label: "Primeiros Passos" },
  { id: "training", label: "Treinamentos" },
  { id: "technical", label: "Suporte Técnico" },
  { id: "equipment", label: "Equipamentos" },
];

export const helpArticles = [
  {
    id: 1,
    category: "getting-started",
    title: "Como fazer login no portal",
    description: "Guia passo a passo para acessar o portal de atendimento",
    content: "Acesse o portal através do navegador, insira suas credenciais e clique em entrar.",
  },
  {
    id: 2,
    category: "getting-started",
    title: "Configurar seu perfil",
    description: "Saiba como atualizar suas informações pessoais",
    content: "Vá para configurações, clique em perfil e atualize seus dados.",
  },
  {
    id: 3,
    category: "training",
    title: "Como acessar os treinamentos online",
    description: "Instruções para acessar e participar dos cursos disponíveis",
    content: "Acesse a seção de treinamentos e selecione o curso desejado.",
  },
  {
    id: 4,
    category: "technical",
    title: "Como abrir um chamado de suporte",
    description: "Aprenda a solicitar ajuda técnica através do portal",
    content: "Clique em novo chamado, preencha os dados e envie.",
  },
  {
    id: 5,
    category: "technical",
    title: "Problemas de acesso e permissões",
    description: "Solução para problemas de login e permissões",
    content: "Verifique suas permissões ou entre em contato com o suporte.",
  },
  {
    id: 6,
    category: "equipment",
    title: "Gerenciamento de equipamentos atribuídos",
    description: "Informações sobre seus equipamentos corporativos",
    content: "Consulte a lista de equipamentos atribuídos a você.",
  },
];

// Dashboard mock data
export const dashboardData = {
  openTickets: 12,
  inProgressTickets: 8,
  resolvedTickets: 145,
  pendingTickets: 5,
  averageResolutionTime: "4.5 horas",
  satisfactionRate: "98%",
  ticketsByPriority: [
    { name: "Crítica", value: 3, color: "#ff4444" },
    { name: "Alta", value: 8, color: "#ff9900" },
    { name: "Média", value: 25, color: "#ffcc00" },
    { name: "Baixa", value: 129, color: "#00cc66" },
  ],
  ticketsByCategory: [
    { name: "Hardware", value: 45 },
    { name: "Software", value: 67 },
    { name: "Rede", value: 23 },
    { name: "Impressoras", value: 15 },
    { name: "Outros", value: 12 },
  ],
  recentTickets: [
    {
      id: "TK001",
      title: "Monitor não liga",
      priority: "Alta",
      status: "Aberto",
      user: "João Silva",
    },
    {
      id: "TK002",
      title: "Erro de impressão",
      priority: "Média",
      status: "Em Andamento",
      user: "Maria Santos",
    },
    {
      id: "TK003",
      title: "Acesso VPN",
      priority: "Crítica",
      status: "Aberto",
      user: "Pedro Costa",
    },
  ],
};

// Help Desk mock data
export const helpDeskData = {
  tickets: [
    {
      id: "HD001",
      title: "Problema com email corporativo",
      priority: "Alta",
      status: "Em Andamento",
      assignee: "Jeferson Reis",
      createdAt: "2026-03-28",
      category: "Email",
    },
    {
      id: "HD002",
      title: "Reset de senha",
      priority: "Média",
      status: "Resolvido",
      assignee: "Thainá Godoy",
      createdAt: "2026-03-27",
      category: "Acesso",
    },
    {
      id: "HD003",
      title: "Instalação de software",
      priority: "Baixa",
      status: "Aguardando",
      assignee: "Filipi Farbo",
      createdAt: "2026-03-26",
      category: "Software",
    },
    {
      id: "HD004",
      title: "Problema de conectividade",
      priority: "Crítica",
      status: "Em Andamento",
      assignee: "Henrique Hipólito",
      createdAt: "2026-03-25",
      category: "Rede",
    },
  ],
};

// Training mock data
export const trainingData = {
  courses: [
    {
      id: 1,
      title: "Introdução ao Portal",
      instructor: "Jeferson Reis",
      duration: "2 horas",
      students: 156,
      progress: 75,
      status: "Em Progresso",
    },
    {
      id: 2,
      title: "Segurança da Informação",
      instructor: "Thainá Godoy",
      duration: "4 horas",
      students: 203,
      progress: 45,
      status: "Em Progresso",
    },
    {
      id: 3,
      title: "Políticas de TI",
      instructor: "Filipi Farbo",
      duration: "1.5 horas",
      students: 89,
      progress: 100,
      status: "Concluído",
    },
    {
      id: 4,
      title: "Ferramentas Colaborativas",
      instructor: "Henrique Hipólito",
      duration: "3 horas",
      students: 142,
      progress: 60,
      status: "Em Progresso",
    },
  ],
};

// Teams integration mock data
export const teamsData = {
  status: "Conectado",
  syncedChannels: 24,
  syncedUsers: 156,
  lastSync: "2026-03-30 14:30",
  recentActivity: [
    { id: 1, action: "Novo canal sincronizado", channel: "suporte-ti", time: "2 horas" },
    { id: 2, action: "Usuário adicionado", user: "João Silva", time: "5 horas" },
    { id: 3, action: "Mensagem sincronizada", channel: "geral", time: "1 hora" },
  ],
};

// Reports mock data
export const reportsData = {
  monthlyTickets: [
    { month: "Jan", tickets: 145, resolved: 142 },
    { month: "Fev", tickets: 158, resolved: 155 },
    { month: "Mar", tickets: 172, resolved: 168 },
    { month: "Abr", tickets: 189, resolved: 185 },
    { month: "Mai", tickets: 201, resolved: 198 },
    { month: "Jun", tickets: 215, resolved: 210 },
  ],
  departmentStats: [
    { department: "TI", tickets: 245, avgTime: "3.2h" },
    { department: "RH", tickets: 156, avgTime: "4.1h" },
    { department: "Financeiro", tickets: 98, avgTime: "2.8h" },
    { department: "Vendas", tickets: 187, avgTime: "3.9h" },
  ],
};

// Multi-company mock data
export const companiesData = {
  companies: [
    {
      id: 1,
      name: "Hartmann Brasil",
      logo: "https://i.pravatar.cc/150?u=hartmann",
      employees: 450,
      tickets: 245,
      status: "Ativo",
    },
    {
      id: 2,
      name: "Tech Solutions",
      logo: "https://i.pravatar.cc/150?u=techsol",
      employees: 320,
      tickets: 156,
      status: "Ativo",
    },
    {
      id: 3,
      name: "Inovação Digital",
      logo: "https://i.pravatar.cc/150?u=inovacao",
      employees: 280,
      tickets: 98,
      status: "Ativo",
    },
    {
      id: 4,
      name: "Global Services",
      logo: "https://i.pravatar.cc/150?u=global",
      employees: 520,
      tickets: 312,
      status: "Ativo",
    },
  ],
};

// Modules for showcase
export const showcaseModules = [
  {
    id: "dashboard",
    title: "Portal de Atendimento",
    description: "Sistema completo de gestão de chamados com interface intuitiva",
    icon: "📊",
    color: "from-cyan-400 to-blue-600",
  },
  {
    id: "helpdesk",
    title: "Help Desk 24/7",
    description: "Suporte técnico imediato com especialistas disponíveis",
    icon: "🎧",
    color: "from-blue-400 to-purple-600",
  },
  {
    id: "training",
    title: "Gestão de Treinamentos",
    description: "Plataforma completa de cursos e capacitação profissional",
    icon: "📚",
    color: "from-purple-400 to-pink-600",
  },
  {
    id: "teams",
    title: "Integração Teams",
    description: "Sincronização perfeita com Microsoft Teams",
    icon: "💬",
    color: "from-pink-400 to-red-600",
  },
  {
    id: "reports",
    title: "Relatórios Avançados",
    description: "Análise de dados e métricas em tempo real",
    icon: "📈",
    color: "from-red-400 to-orange-600",
  },
  {
    id: "companies",
    title: "Gestão Multi-Empresa",
    description: "Controle centralizado de múltiplas empresas",
    icon: "🏢",
    color: "from-orange-400 to-yellow-600",
  },
];
