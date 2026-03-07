import { useState } from "react";
import { Shield, ChevronDown, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import BackButton from "@/components/BackButton";
import UserMenu from "@/components/UserMenu";

/**
 * Design Philosophy: Glassmorphism Futurista
 * - Página de Políticas de TI com conteúdo profissional
 * - Seções expandíveis para melhor leitura
 * - Informações relevantes para grandes empresas
 */

interface PolicySection {
  id: string;
  title: string;
  icon: string;
  content: string;
}

const policySections: PolicySection[] = [
  {
    id: "1",
    title: "Política de Segurança da Informação",
    icon: "🔒",
    content: `1. OBJETIVO
Proteger os ativos de informação da empresa contra acessos não autorizados, alterações, destruição ou divulgação.

2. ESCOPO
Esta política se aplica a todos os funcionários, contratados e terceiros que utilizam sistemas e recursos de TI da empresa.

3. PRINCÍPIOS FUNDAMENTAIS
- Confidencialidade: Informações sensíveis devem ser acessadas apenas por pessoas autorizadas
- Integridade: Dados não devem ser alterados sem autorização
- Disponibilidade: Sistemas devem estar disponíveis quando necessário
- Autenticidade: Identidade dos usuários deve ser verificada

4. REQUISITOS
- Senhas devem ter no mínimo 12 caracteres, incluindo maiúsculas, minúsculas, números e símbolos
- Senhas devem ser alteradas a cada 90 dias
- Não compartilhe suas credenciais com ninguém
- Faça logout ao sair do computador
- Reporte imediatamente qualquer atividade suspeita`
  },
  {
    id: "2",
    title: "Política de Uso Aceitável",
    icon: "📋",
    content: `1. RECURSOS CORPORATIVOS
Computadores, telefones, emails e internet fornecidos pela empresa são para uso profissional.

2. USO PESSOAL
Uso pessoal limitado é permitido, desde que não interfira com o trabalho e respeite a privacidade de terceiros.

3. PROIBIÇÕES
- Acesso a conteúdo ilegal ou ofensivo
- Compartilhamento de arquivos protegidos por direitos autorais
- Instalação de software não autorizado
- Uso para atividades comerciais concorrentes
- Envio de spam ou emails em massa

4. MONITORAMENTO
A empresa pode monitorar o uso de recursos corporativos para garantir conformidade com esta política.

5. CONSEQUÊNCIAS
Violações podem resultar em ação disciplinar, incluindo rescisão de contrato.`
  },
  {
    id: "3",
    title: "Política de Senhas",
    icon: "🔐",
    content: `1. CRIAÇÃO DE SENHAS
- Mínimo de 12 caracteres
- Incluir maiúsculas, minúsculas, números e símbolos
- Não usar informações pessoais (nome, data de nascimento, etc.)
- Não usar senhas anteriores

2. ALTERAÇÃO DE SENHAS
- Alterar a cada 90 dias
- Não reutilizar as últimas 5 senhas
- Alterar imediatamente se houver suspeita de comprometimento

3. PROTEÇÃO DE SENHAS
- Nunca compartilhar com colegas
- Não anotar em papel ou post-its
- Não usar a mesma senha em múltiplos sistemas
- Usar gerenciador de senhas aprovado pela TI

4. RECUPERAÇÃO DE SENHA
- Contate o suporte técnico
- Verificação de identidade será necessária
- Tempo de processamento: até 24 horas`
  },
  {
    id: "4",
    title: "Política de Backup e Recuperação",
    icon: "💾",
    content: `1. RESPONSABILIDADE
- TI é responsável por backups de dados corporativos
- Usuários são responsáveis por dados pessoais em suas máquinas

2. FREQUÊNCIA DE BACKUP
- Dados críticos: diários
- Dados importantes: semanais
- Dados gerais: mensais

3. RETENÇÃO DE DADOS
- Backups são retidos por 30 dias
- Dados deletados não podem ser recuperados após esse período
- Dados de funcionários desligados são retidos por 90 dias

4. RECUPERAÇÃO
- Contate o suporte técnico com detalhes do arquivo
- Tempo de recuperação: até 48 horas
- Arquivos corrompidos podem não ser recuperáveis`
  },
  {
    id: "5",
    title: "Política de Acesso Remoto",
    icon: "🌐",
    content: `1. AUTORIZAÇÃO
Acesso remoto deve ser autorizado pelo gerente do departamento.

2. REQUISITOS TÉCNICOS
- Usar VPN corporativa obrigatoriamente
- Autenticação de dois fatores (2FA) é obrigatória
- Firewall pessoal deve estar ativo
- Software antivírus deve estar atualizado

3. SEGURANÇA
- Não use redes Wi-Fi públicas sem VPN
- Não compartilhe credenciais de VPN
- Desconecte da VPN quando não estiver usando
- Reporte qualquer acesso não autorizado

4. MONITORAMENTO
- Atividades de acesso remoto são registradas
- Acessos suspeitos serão investigados
- Violações podem resultar em revogação de acesso`
  },
  {
    id: "6",
    title: "Política de Equipamentos",
    icon: "💻",
    content: `1. PROPRIEDADE
Todos os equipamentos fornecidos pela empresa são propriedade corporativa.

2. RESPONSABILIDADE DO USUÁRIO
- Manter o equipamento em bom estado
- Não fazer modificações não autorizadas
- Reportar danos ou problemas imediatamente
- Usar apenas software autorizado

3. DEVOLUÇÃO
- Equipamentos devem ser devolvidos ao sair da empresa
- Dados serão apagados antes da reutilização
- Usuário é responsável por danos causados por negligência

4. ROUBO OU PERDA
- Reporte imediatamente ao suporte técnico
- Investigação será iniciada
- Usuário pode ser responsabilizado por negligência`
  },
  {
    id: "7",
    title: "Política de Conformidade e Auditoria",
    icon: "✅",
    content: `1. CONFORMIDADE
Todos os usuários devem cumprir com as políticas de TI e leis aplicáveis.

2. AUDITORIA
- Auditorias de segurança são realizadas regularmente
- Logs de acesso são mantidos por 1 ano
- Investigações podem ser iniciadas em caso de suspeita de violação

3. RELATÓRIOS
- Violações devem ser reportadas ao departamento de TI
- Retalho é proibido
- Confidencialidade será mantida durante investigações

4. ATUALIZAÇÕES
- Políticas são revisadas anualmente
- Mudanças serão comunicadas com antecedência
- Treinamento será fornecido quando necessário`
  },
  {
    id: "8",
    title: "Política de Incidentes de Segurança",
    icon: "🚨",
    content: `1. DEFINIÇÃO
Um incidente de segurança é qualquer evento que compromete ou pode comprometer a confidencialidade, integridade ou disponibilidade de dados.

2. EXEMPLOS
- Acesso não autorizado a sistemas
- Vazamento de dados sensíveis
- Malware ou ransomware
- Phishing ou engenharia social
- Falha de sistema ou perda de dados

3. PROCEDIMENTO DE REPORTE
- Reporte imediatamente ao suporte técnico
- Não tente resolver por conta própria
- Preserve evidências (screenshots, emails, etc.)
- Não compartilhe informações sobre o incidente

4. RESPOSTA
- Investigação será iniciada dentro de 2 horas
- Comunicação será mantida durante o processo
- Medidas corretivas serão implementadas
- Relatório final será fornecido em até 5 dias úteis`
  }
];

export default function ITPolicy() {
  const [, setLocation] = useLocation();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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
                  <h1 className="text-white font-bold">Políticas de TI</h1>
                  <p className="text-gray-300 text-xs">Diretrizes e padrões de segurança da empresa</p>
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
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Aviso */}
          <div className="glassmorphic rounded-lg p-4 border border-yellow-400/30 bg-yellow-400/10 mb-8 flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-300 font-bold text-sm">Importante</p>
              <p className="text-yellow-200 text-sm">Você é responsável por conhecer e cumprir com todas as políticas de TI. Violações podem resultar em ação disciplinar.</p>
            </div>
          </div>

          {/* Seções de Política */}
          <div className="space-y-4">
            {policySections.map((section) => (
              <div
                key={section.id}
                className="glassmorphic rounded-lg border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedSection(expandedSection === section.id ? null : section.id)
                  }
                  className="w-full p-4 hover:bg-white/5 transition-all text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{section.icon}</span>
                      <div>
                        <h3 className="text-white font-bold text-lg">
                          {section.title}
                        </h3>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                        expandedSection === section.id ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {expandedSection === section.id && (
                  <div className="px-4 py-4 border-t border-white/10 bg-white/5">
                    <p className="text-gray-300 text-sm whitespace-pre-line leading-relaxed font-mono">
                      {section.content}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Rodapé */}
          <div className="mt-12 glassmorphic rounded-lg p-6 border border-white/10 text-center">
            <Shield className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
            <p className="text-gray-300 mb-2">Última atualização: Janeiro de 2026</p>
            <p className="text-gray-400 text-sm">Próxima revisão: Janeiro de 2027</p>
            <p className="text-gray-400 text-sm mt-4">Dúvidas? Contate o departamento de TI em suporte@jkings.com</p>
          </div>
        </main>
      </div>
    </div>
  );
}
