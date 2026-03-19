/**
 * Tipos e dados mockados para o sistema de treinamentos
 * Design Philosophy: Glassmorphism Futurista
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  department?: string;
  position?: string;
}

export interface Course {
  id: string;
  title: string;
  instructorName: string;
  instructorBio: string;
  shortDesc: string;
  fullDesc: string;
  durationMinutes: number;
  thumbnailUrl: string;
  contentType: "video" | "pdf" | "written";
  contentUrl?: string;
  contentData?: string;
  previewRules: {
    type: "video" | "pdf" | "written";
    value: string; // tempo para vídeo, páginas para PDF, trecho para escrito
  };
  status: "published" | "draft";
  createdAt: string;
  category?: string;
  level?: "beginner" | "intermediate" | "advanced";
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: "enrolled" | "in_progress" | "completed";
  progressPercent: number;
  startedAt: string;
  completedAt?: string;
  lastAccessedAt: string;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  certificateCode: string;
  issuedAt: string;
  pdfUrl?: string;
}

// Dados mockados - Usuário atual
export const currentUser: User = {
  id: "user-001",
  name: "Carol",
  email: "carol@jkings.com",
  role: "user",
  department: "Tecnologia da Informação",
  position: "Analista"
};

// Dados mockados - Cursos
export const mockCourses: Course[] = [
  {
    id: "course-001",
    title: "Integração de Novos Colaboradores",
    instructorName: "Jeferson Reis",
    instructorBio: "Gerente de Tecnologia e Recursos Humanos",
    shortDesc: "Informações sobre o departamento de Tecnologia, sistemas de chamados, controles de acessos",
    fullDesc: "Bem-vindo ao departamento de Tecnologia! Este curso essencial fornece informações completas sobre: estrutura do departamento, como usar o sistema de chamados (tickets), políticas de acesso, segurança da informação e integração com os sistemas internos. Aprenda tudo que você precisa para começar com sucesso.",
    durationMinutes: 120,
    thumbnailUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663168635381/toGEtmZswpDFQnom.jpg",
    contentType: "written",
    contentData: "# Integração de Novos Colaboradores\n\n## Bem-vindo ao Departamento de Tecnologia\n\n### Estrutura do Departamento\nConheça a equipe, hierarquia e responsabilidades...\n\n### Sistema de Chamados (Tickets)\nComo abrir, acompanhar e resolver tickets de suporte...\n\n### Controles de Acesso\nPermissões, autenticação e segurança da informação...\n\n### Integração com Sistemas Internos\nAcesso a ferramentas e plataformas corporativas...",
    previewRules: {
      type: "written",
      value: "Introdução e primeiros 3 tópicos"
    },
    status: "published",
    createdAt: "2025-02-01",
    category: "Onboarding",
    level: "beginner"
  },
  {
    id: "course-002",
    title: "Melhores Práticas de Uso de Equipamentos",
    instructorName: "Jeferson Reis",
    instructorBio: "Gerente de Tecnologia e Segurança da Informação",
    shortDesc: "Informações sobre uso de Laptops, Smartphones, dispositivos internos, rede interna, acessos e permissões",
    fullDesc: "Aprenda as melhores práticas para usar e cuidar dos equipamentos fornecidos pela empresa. Este curso cobre: uso correto de laptops e smartphones, manutenção de dispositivos, acesso à rede interna, políticas de segurança, permissões de acesso, proteção de dados e responsabilidades do usuário. Essencial para todos os colaboradores.",
    durationMinutes: 90,
    thumbnailUrl: "https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/zeO8vRUX6ohSdJ6p0l8XVp-img-2_1770896864000_na1fn_Y291cnNlLWVxdWlwbWVudC1wcmFjdGljZXM.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94L3plTzh2UlVYNm9oU2RKNnAwbDhYVnAtaW1nLTJfMTc3MDg5Njg2NDAwMF9uYTFmbl9ZMjkxY25ObExXVnhkV2x3YldWdWRDMXdjbUZqZEdsalpYTS5qcGc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=lQLkZeevck9RsafPKguVauRF-Gaj5fAHyAkhd9b3qFprEqDKG8Ny2D5T~R92wQY2VVfnWigjaak4ZVEz7ILFiMsBYi8MrETJsjOvgUXMM38b0BWGQnTykvWS77-JBzl-EK-XXjpR~can~8jKVpn3rCP1EAZW9Wqscq2ANRMUhpBKeslRIQSkIW-DPNEjMj~pURPLzmCw7ff1OFqgEV-VsAfo-3IlP1XeCaMVmt2OfnQBjj-x7nzDUSV5Eh9lanx~tDgGROn-8zirX1oDPosXlAABYOsC1yEbnOviocGxgVf23qc-lZn1KIhkjs4qdZAWM5UBTEyVLKENXtrr9lnBsw__",
    contentType: "written",
    contentData: "# Melhores Práticas de Uso de Equipamentos\n\n## Cuidados com Laptops\nManutenção, armazenamento e uso seguro...\n\n## Smartphones e Dispositivos Móveis\nPolitícas de uso, segurança e responsabilidade...\n\n## Acesso à Rede Interna\nConexão, VPN e protocolos de segurança...\n\n## Permissões e Acessos\nNíveis de acesso, autenticação e controle de dados...\n\n## Proteção de Dados\nBackup, criptografia e conformidade com políticas...",
    previewRules: {
      type: "written",
      value: "Introdução e primeiros 3 tópicos"
    },
    status: "published",
    createdAt: "2025-02-01",
    category: "Segurança",
    level: "beginner"
  },
  {
    id: "course-003",
    title: "Segurança da Informação: Boas Práticas",
    instructorName: "Carlos Oliveira",
    instructorBio: "Certificado em Segurança da Informação (CISSP)",
    shortDesc: "Guia essencial sobre segurança, senhas e proteção de dados",
    fullDesc: "Entenda os princípios fundamentais de segurança da informação, como proteger suas credenciais, identificar ameaças e implementar boas práticas no dia a dia.",
    durationMinutes: 120,
    thumbnailUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&h=300&fit=crop",
    contentType: "pdf",
    contentUrl: "https://example.com/pdfs/security-guide.pdf",
    previewRules: {
      type: "pdf",
      value: "3"
    },
    status: "published",
    createdAt: "2025-01-05",
    category: "Segurança",
    level: "intermediate"
  },
  {
    id: "course-004",
    title: "Produtividade e Gestão de Tempo",
    instructorName: "Ana Costa",
    instructorBio: "Coach de produtividade e especialista em gestão de tempo",
    shortDesc: "Técnicas comprovadas para aumentar sua produtividade no trabalho",
    fullDesc: "Descubra métodos eficazes como Pomodoro, matriz de Eisenhower e outras técnicas para gerenciar melhor seu tempo e aumentar a produtividade.",
    durationMinutes: 90,
    thumbnailUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop",
    contentType: "written",
    contentData: "# Técnicas de Produtividade\n\n## Método Pomodoro\nTrabalie em blocos de 25 minutos...\n\n## Matriz de Eisenhower\nClassifique tarefas por urgência e importância...",
    previewRules: {
      type: "written",
      value: "Introdução e primeiros 2 tópicos"
    },
    status: "published",
    createdAt: "2025-01-01",
    category: "Desenvolvimento Pessoal",
    level: "beginner"
  }
];

// Dados mockados - Inscrições do usuário
export const mockEnrollments: Enrollment[] = [
  {
    id: "enroll-001",
    userId: "user-001",
    courseId: "course-001",
    status: "in_progress",
    progressPercent: 45,
    startedAt: "2025-01-20",
    lastAccessedAt: "2025-01-28"
  },
  {
    id: "enroll-002",
    userId: "user-001",
    courseId: "course-004",
    status: "completed",
    progressPercent: 100,
    startedAt: "2025-01-10",
    completedAt: "2025-01-25",
    lastAccessedAt: "2025-01-25"
  }
];

// Dados mockados - Certificados
export const mockCertificates: Certificate[] = [
  {
    id: "cert-001",
    userId: "user-001",
    courseId: "course-004",
    certificateCode: "CERT-2025-001",
    issuedAt: "2025-01-25",
    pdfUrl: "https://example.com/certificates/cert-001.pdf"
  }
];

// Funções auxiliares
export const getCourseById = (courseId: string): Course | undefined => {
  return mockCourses.find(c => c.id === courseId);
};

export const getUserEnrollments = (userId: string): Enrollment[] => {
  return mockEnrollments.filter(e => e.userId === userId);
};

export const getEnrollmentByCourseAndUser = (
  courseId: string,
  userId: string
): Enrollment | undefined => {
  return mockEnrollments.find(e => e.courseId === courseId && e.userId === userId);
};

export const getCourseStats = (userId: string) => {
  const enrollments = getUserEnrollments(userId);
  const available = mockCourses.length - enrollments.length;
  const inProgress = enrollments.filter(e => e.status === "in_progress").length;
  const completed = enrollments.filter(e => e.status === "completed").length;
  const avgProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + e.progressPercent, 0) / enrollments.length)
    : 0;

  return { available, inProgress, completed, avgProgress };
};

export const getCertificateByUserAndCourse = (
  userId: string,
  courseId: string
): Certificate | undefined => {
  return mockCertificates.find(c => c.userId === userId && c.courseId === courseId);
};


// Equipamentos do usuário
export const userEquipments = [
  {
    id: "eq-001",
    name: "Notebook",
    model: "Dell Latitude 7420",
    serialNumber: "DL123456789",
    status: "Ativo",
    assignedDate: "2024-06-15"
  },
  {
    id: "eq-002",
    name: "Smartphone",
    model: "iPhone 14",
    serialNumber: "AP987654321",
    status: "Ativo",
    assignedDate: "2024-08-20"
  },
  {
    id: "eq-003",
    name: "Monitor",
    model: "LG 27 UltraWide",
    serialNumber: "LG456789123",
    status: "Ativo",
    assignedDate: "2024-06-15"
  }
];

// Foto do usuário
export const userProfilePhoto = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop";


// Tipos para Termos de Responsabilidade
export interface EquipmentTerm {
  id: string;
  equipmentName: string;
  equipmentModel: string;
  serialNumber: string;
  signedDate: string;
  status: "signed" | "pending";
  documentUrl?: string;
}

export interface WorkContract {
  id: string;
  contractType: string;
  startDate: string;
  signedDate: string;
  status: "signed" | "pending";
  documentUrl?: string;
}

export interface TrainingCertificate {
  id: string;
  trainingTitle: string;
  completedDate: string;
  certificateCode: string;
  status: "issued" | "pending";
  documentUrl?: string;
}

// Dados mockados de Termos de Equipamentos
export const equipmentTerms: EquipmentTerm[] = [
  {
    id: "term-eq-001",
    equipmentName: "Notebook",
    equipmentModel: "Dell Latitude 7420",
    serialNumber: "DL123456789",
    signedDate: "2024-06-15",
    status: "signed",
    documentUrl: "#"
  },
  {
    id: "term-eq-002",
    equipmentName: "Smartphone",
    equipmentModel: "iPhone 14",
    serialNumber: "AP987654321",
    signedDate: "2024-08-20",
    status: "signed",
    documentUrl: "#"
  },
  {
    id: "term-eq-003",
    equipmentName: "Monitor",
    equipmentModel: "LG 27 UltraWide",
    serialNumber: "LG456789123",
    signedDate: "2024-06-15",
    status: "signed",
    documentUrl: "#"
  }
];

// Dados mockados de Contrato de Trabalho
export const workContracts: WorkContract[] = [
  {
    id: "contract-001",
    contractType: "Contrato de Trabalho - Período Indeterminado",
    startDate: "2024-01-15",
    signedDate: "2024-01-10",
    status: "signed",
    documentUrl: "#"
  },
  {
    id: "contract-002",
    contractType: "Acordo de Confidencialidade",
    startDate: "2024-01-15",
    signedDate: "2024-01-10",
    status: "signed",
    documentUrl: "#"
  },
  {
    id: "contract-003",
    contractType: "Política de Uso de Equipamentos",
    startDate: "2024-01-15",
    signedDate: "2024-01-10",
    status: "signed",
    documentUrl: "#"
  }
];

// Dados mockados de Certificados de Treinamentos
export const trainingCertificates: TrainingCertificate[] = [
  {
    id: "cert-001",
    trainingTitle: "Introdução à Segurança da Informação",
    completedDate: "2024-03-20",
    certificateCode: "SEC-2024-001",
    status: "issued",
    documentUrl: "#"
  },
  {
    id: "cert-002",
    trainingTitle: "Compliance e Regulamentações",
    completedDate: "2024-05-10",
    certificateCode: "COMP-2024-001",
    status: "issued",
    documentUrl: "#"
  },
  {
    id: "cert-003",
    trainingTitle: "Treinamento de Liderança",
    completedDate: "2024-07-15",
    certificateCode: "LEAD-2024-001",
    status: "issued",
    documentUrl: "#"
  }
];


// Tipos para Suporte/Chamados
export interface SupportTicket {
  id: string;
  userId: string;
  type: "requisition" | "incident" | "request";
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
}

// Dados mockados de Chamados/Tickets
export const userTickets: SupportTicket[] = [
  {
    id: "ticket-001",
    userId: "user-001",
    type: "requisition",
    title: "Requisição de Software - Microsoft Office",
    description: "Necessário instalação de Microsoft Office 365 no notebook para trabalhos de documentação.",
    status: "in_progress",
    priority: "high",
    category: "Software",
    createdAt: "2024-01-20",
    updatedAt: "2024-01-22",
    dueDate: "2024-01-25"
  },
  {
    id: "ticket-002",
    userId: "user-001",
    type: "incident",
    title: "Incidente - Conexão VPN Intermitente",
    description: "A conexão VPN está caindo frequentemente, afetando o trabalho remoto. Necessário investigação urgente.",
    status: "open",
    priority: "critical",
    category: "Rede",
    createdAt: "2024-01-23",
    updatedAt: "2024-01-23"
  },
  {
    id: "ticket-003",
    userId: "user-001",
    type: "request",
    title: "Solicitação - Aumento de Espaço em Disco",
    description: "Solicito aumento do espaço em disco do servidor de trabalho de 500GB para 1TB.",
    status: "resolved",
    priority: "medium",
    category: "Hardware",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20",
    dueDate: "2024-01-22"
  },
  {
    id: "ticket-004",
    userId: "user-001",
    type: "requisition",
    title: "Requisição de Hardware - Monitor Adicional",
    description: "Necessário um monitor adicional 27 polegadas para melhorar produtividade.",
    status: "closed",
    priority: "low",
    category: "Hardware",
    createdAt: "2024-01-10",
    updatedAt: "2024-01-18",
    dueDate: "2024-01-20"
  },
  {
    id: "ticket-005",
    userId: "user-001",
    type: "incident",
    title: "Incidente - Impressora Não Responde",
    description: "A impressora de rede não está respondendo aos comandos de impressão.",
    status: "resolved",
    priority: "medium",
    category: "Periféricos",
    createdAt: "2024-01-19",
    updatedAt: "2024-01-21",
    dueDate: "2024-01-22"
  }
];

export const getStatusColor = (status: string): string => {
  switch (status) {
    case "open":
      return "bg-red-500/20 text-red-400";
    case "in_progress":
      return "bg-yellow-500/20 text-yellow-400";
    case "resolved":
      return "bg-green-500/20 text-green-400";
    case "closed":
      return "bg-gray-500/20 text-gray-400";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case "low":
      return "text-blue-400";
    case "medium":
      return "text-yellow-400";
    case "high":
      return "text-orange-400";
    case "critical":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case "open":
      return "Aberto";
    case "in_progress":
      return "Em Progresso";
    case "resolved":
      return "Resolvido";
    case "closed":
      return "Fechado";
    default:
      return "Desconhecido";
  }
};

export const getPriorityLabel = (priority: string): string => {
  switch (priority) {
    case "low":
      return "Baixa";
    case "medium":
      return "Média";
    case "high":
      return "Alta";
    case "critical":
      return "Crítica";
    default:
      return "Desconhecida";
  }
};
