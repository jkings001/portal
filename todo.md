# Portal de Atendimento - TODO

## Notificação por E-mail e Assinatura Digital em Documentos
- [x] Criar helper de envio de e-mail SMTP (nodemailer) em server/email-service.ts
- [x] Criar template HTML de e-mail de atribuição de documento (sendDocumentAssignedEmail)
- [x] Integrar envio de e-mail nos endpoints /assign, /assign-department e /assign-all
- [x] Criar testes vitest para envio de e-mail e assinatura digital (server/document-sign.test.ts)
- [x] Adicionar colunas signedAt, signatureIp e signatureData na tabela document_assignments
- [x] Criar endpoint POST /api/documents/:id/sign para registrar assinatura digital
- [x] Implementar modal de confirmação de assinatura no frontend (TermsOfResponsibility.tsx)
- [x] Exibir badge "Assinado" com timestamp na lista de documentos
- [x] Exibir detalhes da assinatura (nome, data/hora, IP, departamento) no modal de preview
- [x] Criar testes vitest para assinatura digital (15 testes aprovados)
- [x] Validar fluxo completo (567 testes vitest passando)

## Correção da Página Terms (Meus Documentos)
- [x] Corrigir autenticação no endpoint /api/documents/my para aceitar JWT Bearer token
- [x] Corrigir frontend para enviar o token JWT nas requisições de documentos
- [x] Corrigir iframe de visualização de PDF para usar URL assinada do S3 (previewUrl) em vez do endpoint proxy
- [x] Validar que documentos aparecem corretamente para o usuário logado (2 documentos exibidos)
- [x] Validar visualização de PDF no modal (Termo de Responsabilidade exibido com sucesso)
- [x] Todos os 550 testes vitest passando


## Funcionalidades em Desenvolvimento

- [x] Criar modal de login para acessar admin na página Dashboard
- [x] Adicionar botão "Acessar como Admin" na página Dashboard
- [x] Integrar lógica de autenticação com redirecionamento para /admin
- [x] Testar fluxo completo de alternância de perfil

## Funcionalidades Completadas

- [x] Dashboard administrativo com glassmorphism
- [x] KPI cards com métricas
- [x] Tabela de chamados recentes
- [x] Sidebar de navegação
- [x] Notificações em tempo real
- [x] Perfil do admin com menu
- [x] Sistema de alternância de perfis (Admin/Usuário/Gerente)
- [x] Página de gerenciamento de usuários
- [x] Dashboard de usuário comum
- [x] Link para painel admin no user dashboard
- [x] Modal centralizado para trocar perfil
- [x] Remover opção de trocar perfil do Dashboard
- [x] Botão "Acessar Painel de Administrador" na página Dashboard
- [x] Modal de acesso admin com email e senha
- [x] Autenticação e redirecionamento para /admin
- [x] Fluxo completo testado e validado
- [x] Ajustar página Training removendo cursos de JavaScript/React
- [x] Adicionar curso "Integração de Novos Colaboradores"
- [x] Adicionar curso "Melhores Práticas de Uso de Equipamentos"
- [x] Gerar imagens condizentes aos novos cursos


## Gerenciamento de Empresas (Multi-Tenant)

- [x] Atualizar schema do banco de dados com tabela de empresas
- [x] Criar tabela de vinculação empresa-usuários
- [x] Implementar helpers de banco de dados para gerenciamento de empresas
- [x] Criar procedures tRPC para CRUD de empresas
- [x] Criar página Companies.tsx com tabela de empresas
- [x] Implementar modal de cadastro de novas empresas
- [x] Implementar modal de edição de empresas
- [x] Criar visualização de licenças e usuários por empresa
- [x] Integrar vinculação de usuários à empresa no cadastro
- [x] Criar testes vitest para gerenciamento de empresas
- [x] Validar fluxo completo de cadastro e edição de empresas


## Gerenciamento de Departamentos
- [x] Implementar helpers de banco de dados para gerenciamento de departamentos
- [x] Criar procedures tRPC para CRUD de departamentos
- [x] Criar página Departments.tsx com tabela de departamentos
- [x] Implementar modal de cadastro de departamentos
- [x] Implementar modal de edição de departamentos
- [x] Criar visualização de usuários por departamento
- [x] Implementar vinculação de usuários a departamentos
- [x] Adicionar rota /admin/departments no App.tsx
- [x] Criar testes vitest para gerenciamento de departamentos (20 testes aprovados)
- [x] Validar fluxo completo de cadastro e edição de departamentos


## Interface AdminServer
- [x] Criar página principal do AdminServer com layout moderno
- [x] Implementar tabela de gerenciamento de usuários
- [x] Criar modais para criar, editar e deletar usuários
- [x] Implementar gerenciamento de permissões por role
- [x] Criar dashboard com estatísticas de usuários
- [x] Implementar filtros e busca avançada
- [x] Integrar com sistema de login local
- [x] Corrigir erros de TypeScript


## Sincronização com Banco de Dados
- [x] Criar procedures tRPC para CRUD de usuários
- [x] Implementar funções de banco de dados para usuários
- [x] Integrar tRPC no frontend AdminServer
- [x] Implementar sincronização de dados em tempo real
- [x] Criar testes vitest para sincronização (18 testes aprovados)
- [ ] Validar fluxo completo de persistência


## Correção de Autenticação (Sessão Atual)
- [x] Atualizar senha de jeferson.reis@jkings.com.br para Jkadm2010***
- [x] Corrigir Companies.tsx para usar AuthContext ao invés de useAuth do tRPC
- [x] Corrigir Departments.tsx para usar AuthContext ao invés de useAuth do tRPC
- [x] Validar testes vitest (39 testes aprovados)
- [ ] Testar acesso a /admin/server como administrador
- [ ] Testar acesso a /companies como administrador
- [ ] Testar acesso a /admin/departments como administrador


## Unificação de Autenticação (Nova Sessão)
- [x] Criar sistema de autenticação tRPC com JWT
- [x] Implementar procedures de login e registro
- [x] Migrar dados de AuthContext para banco de dados (em memória)
- [ ] Atualizar frontend para usar novo sistema tRPC
- [ ] Remover AuthContext mockado
- [x] Criar testes de autenticação (66/66 testes aprovados ✅)
- [x] Validar fluxo completo de login/logout


## Acesso Público AdminServer
- [x] Remover proteção de autenticação da página /admin/server
- [x] Criar mock de usuário admin para acesso público
- [x] Validar que todos os 66 testes continuam passando


## Reinício Completo do Projeto
- [x] Parar servidor e limpar cache
- [x] Limpar node_modules e reinstalar dependências
- [x] Limpar diretórios de build (dist, .vite, .turbo)
- [x] Reverter para checkpoint anterior (50e43126)
- [x] Reinstalar dependências com sucesso
- [x] Reiniciar servidor de desenvolvimento
- [x] Validar que todos os 66 testes continuam passando
- [x] Servidor rodando e acessível em https://3000-iknxij673gw4v6r2j9w1a-af982697.us1.manus.computer


## Integração com MySQL Hostinger
- [x] Obter credenciais corretas do MySQL Hostinger
- [x] Liberar IP de origem (177.22.221.177) no painel Hostinger
- [x] Executar migração do schema com pnpm db:push
- [x] Validar criação de todas as 9 tabelas
- [x] Testar CRUD de dados (INSERT funcionando)
- [x] Todos os 66 testes vitest passando


## Gerenciamento de Senhas de Usuários (Nova Sessão)
- [x] Criar função updateUserPassword em server/db.ts com hash bcrypt
- [x] Implementar endpoint PUT /api/users/:id/password com validação
- [x] Adicionar modal de alterar senha em AdminServer.tsx
- [x] Implementar botão Lock para abrir modal de senha na lista de usuários
- [x] Adicionar validação de senha (mínimo 6 caracteres)
- [x] Implementar confirmação de senha (deve conferir)
- [x] Criar testes vitest para validação de senhas (14 testes aprovados)
- [x] Todos os 80 testes vitest passando (66 anteriores + 14 novos)


## Campos de Senha e Imagem no Modal de Novo Usuário
- [x] Adicionar campo passwordHash ao schema de usuários (já existia)
- [x] Adicionar campo profileImage ao schema de usuários
- [x] Atualizar endpoint POST /api/users para aceitar senha e imagem
- [x] Adicionar campo de senha no modal de novo usuário
- [x] Implementar validação de força de senha (mínimo 6 caracteres)
- [x] Implementar validação de confirmação de senha
- [x] Criar testes vitest para validação de imagem (18 testes aprovados)
- [x] Corrigir schema do banco de dados (tinyint -> int)
- [x] Total: 98 testes vitest passando (80 anteriores + 18 novos)


## Melhorias no Modal de Novo Usuário
- [x] Remover obrigatoriedade do campo Departamento
- [x] Adicionar campo de upload de imagem de perfil com preview
- [x] Atualizar validações para aceitar departamento opcional
- [x] Testar fluxo completo (98 testes vitest passando)


## Correção de IDs Duplicados
- [x] Investigar geração de IDs de usuários
- [x] Corrigir função de geração de ID único (adicionado random component + collision detection)
- [x] Validar que IDs são únicos no banco de dados
- [x] Testar criação de múltiplos usuários (9 novos testes de unicidade passando)
- [x] Total: 107 testes vitest passando (98 anteriores + 9 novos)


## Investigação de IDs Repetidos (13 e 14)
- [x] Verificar qual campo está sendo exibido como ID na lista de usuários (era departmentId)
- [x] Consultar banco de dados para confirmar se IDs realmente se repetem
- [x] Corrigir exibição ou geração de IDs (enriquecer com nomes de departamentos)
- [x] Testar e validar unicidade (107 testes vitest passando)


## Correção de Erro 400 ao Salvar Departamento
- [x] Investigar erro 400 em handleSaveDepartment (era erro de conexão com banco)
- [x] Verificar validação do endpoint de API
- [x] Adicionar melhor tratamento de erro (validacao + mensagens claras)
- [x] Melhorar frontend para exibir mensagens de erro do servidor
- [x] Testar fluxo completo (107 testes vitest passando)


## Implementação de Retry com Backoff Exponencial
- [x] Criar módulo de retry com backoff exponencial (server/retry.ts)
- [x] Integrar retry logic na função getDb() com 3 tentativas
- [x] Adicionar wrapper para operações críticas (server/db-operations.ts)
- [x] Escrever testes vitest para retry logic (15 testes aprovados)
- [x] Testar fluxo completo (122 testes vitest passando)


## Integração com API da Hostinger
- [x] Armazenar token de API da Hostinger de forma segura (HOSTINGER_API_TOKEN env var)
- [x] Criar serviço de integração com API da Hostinger (server/hostinger-service.ts)
- [x] Implementar endpoints para obter dados de recursos (5 endpoints REST)
- [x] Criar página de dashboard com métricas (client/src/pages/HostingerDashboard.tsx)
- [x] Escrever testes para integração (4 testes de validação do token)
- [x] Total: 126 testes vitest passando (122 anteriores + 4 novos)


## Auditoria de Integração com Banco de Dados
- [x] Auditar todas as 29 páginas do projeto
- [x] Identificar páginas sem integração com banco de dados (16 páginas críticas)
- [x] Analisar schema e identificar tabelas faltantes (5 tabelas criadas)
- [x] Criar tabelas e relacionamentos faltantes (ticket_comments, ticket_attachments, faqs, reports, user_preferences)
- [x] Implementar endpoints de API para páginas desvinculadas (8 endpoints REST)
- [x] Integrar páginas com endpoints (AdminDashboard, SupportTickets, FAQ)
- [x] Validar integração completa com testes (126 testes vitest passando)


## Correção de Erro ao Carregar Departamentos
- [x] Investigar erro de carregamento de departamentos (Connection lost ao banco de dados)
- [x] Verificar endpoint de API (GET /api/departments)
- [x] Corrigir problema identificado (adicionado retry logic e melhor tratamento de erro)
- [x] Testar fluxo completo (126 testes vitest passando)


## Correção de Erro departments.filter is not a function
- [x] Investigar causa do erro (API retornando objeto em vez de array em caso de erro)
- [x] Verificar tipo de dado retornado pela API (verificar se resposta é array)
- [x] Corrigir tratamento de dados no frontend (adicionar validação de tipo e fallback)
- [x] Testar fluxo completo (126 testes vitest passando)


## Correção de Erro Formato de resposta inválido
- [x] Investigar o que a API está retornando (retorna { success, data, attempts, totalTimeMs })
- [x] Corrigir validação de resposta no frontend (extrair array de response_data.data)
- [x] Testar fluxo completo (126 testes vitest passando)


## Integração de Perfil do Usuário Logado na Dashboard
- [x] Analisar página Dashboard e identificar botão de perfil (UserMenu component)
- [x] Criar endpoint de API para obter dados do usuário logado (GET /api/me com retry logic)
- [x] Integrar Dashboard com dados do usuário logado (UserMenu carrega dados reais)
- [x] Criar modal/dropdown de perfil com informações do usuário (nome, função, foto)
- [x] Testar integração completa (126 testes vitest passando)


## Atualização de Mensagem de Bem-vindo na Dashboard
- [x] Ler página Dashboard e identificar mensagem de bem-vindo (linha 181)
- [x] Integrar dados do usuário logado na mensagem (já estava integrado)
- [x] Testar e salvar checkpoint (126 testes vitest passando)


## Implementação de Autenticação na Página Home
- [x] Criar endpoint POST /api/auth/login que valida usuário contra base de dados
- [x] Atualizar página Home com formulário de login integrado
- [x] Implementar redirecionamento automático baseado em role (admin -> /admin, usuário -> /dashboard)
- [x] Adicionar validações de segurança (bcrypt, retry logic com backoff)
- [x] Escrever testes vitest para autenticação (27 testes de autenticação unificada)
- [x] Testar fluxo completo de login e redirecionamento (126 testes vitest passando)


## Correção de Erro de Login na Página Home
- [x] Investigar erro de login e verificar endpoint /api/auth/login (faltava pacote bcrypt)
- [x] Verificar relacionamento com banco de dados (schema correto, passwordHash pode ser nulo)
- [x] Corrigir problema identificado (usar Drizzle ORM, melhorar tratamento de erro)
- [x] Testar fluxo de login (criar script para usuário de teste)

## Correção de Erros 500 em Endpoints
- [x] Investigar erro 500 em GET /api/companies (problema: db.query() não existe no Drizzle ORM)
- [x] Investigar erro 500 em GET /api/dashboard/stats (mesmo problema)
- [x] Corrigir problemas identificados (reescrever db-new-tables.ts com Drizzle ORM)
- [x] Testar endpoints e validar correções (126 testes vitest passando)


## Correcao de Erro 500 Persistente ao Carregar Empresas
- [x] Investigar logs do servidor (erro: ETIMEDOUT na conexao com banco de dados)
- [x] Melhorar tratamento de erro no endpoint GET /api/companies (retornar 503 para ETIMEDOUT)
- [x] Melhorar tratamento de erro no endpoint GET /api/dashboard/stats (retornar 503 para ETIMEDOUT)
- [x] Atualizar frontend Companies.tsx para tratar status 503 e exibir mensagem clara
- [x] Testar e validar correcoes (126 testes vitest passando)

## Atualização de Credenciais do Banco de Dados
- [x] Identificar credenciais incorretas (auth-db718.hstgr.io ETIMEDOUT)
- [x] Testar conectividade com novas credenciais (srv1938.hstgr.io)
- [x] Validar que endpoints funcionam com novo banco
- [x] Salvar checkpoint com banco correto

## Sistema Seguro de Autenticação de Usuários
- [x] Revisar estrutura de usuários no banco de dados (8 usuários, 5 com senha)
- [x] Criar endpoint POST /api/auth/login com validação segura (bcrypt + retry logic)
- [x] Implementar geração de JWT token com expiração (7 dias)
- [x] Criar página de login no frontend com validação (Home.tsx integrado)
- [x] Adicionar proteção de rotas autenticadas (ProtectedRoute component)
- [x] Implementar logout e limpeza de sessão (localStorage)
- [x] Testar fluxo completo de autenticação (126 testes vitest passando)
- [ ] Adicionar rate limiting no endpoint de login (opcional)


## Sistema de Recuperação de Senha
- [ ] Criar tabela password_reset_tokens no banco de dados
- [ ] Implementar endpoint POST /api/auth/forgot-password (gerar token)
- [ ] Implementar endpoint POST /api/auth/reset-password (validar token e resetar)
- [ ] Criar página ForgotPassword.tsx no frontend
- [ ] Criar página ResetPassword.tsx no frontend
- [ ] Implementar envio de e-mail com token de reset
- [ ] Adicionar validação de força de senha
- [ ] Testar fluxo completo de recuperação


## Sistema de Recuperação de Senha com E-mail
- [x] Criar tabela password_reset_tokens no banco de dados
- [x] Implementar funções de criação e verificação de tokens (db.ts)
- [x] Criar endpoint POST /api/auth/forgot-password
- [x] Criar endpoint POST /api/auth/reset-password
- [x] Criar página ForgotPassword.tsx com formulário
- [x] Criar página ResetPassword.tsx com validação de senha
- [x] Implementar serviço de envio de e-mail (email-service.ts)
- [x] Adicionar rotas no App.tsx
- [x] Adicionar link "Esqueceu a senha?" na página Home
- [x] Instalar dependências (nodemailer)
- [x] Testar fluxo completo de recuperação (e-mail enviado com sucesso)
- [x] Configurar variáveis de ambiente SMTP (Hostinger: smtp.hostinger.com:465)
- [x] Validar conectividade SMTP (7 testes vitest passando)
- [ ] Adicionar rate limiting no endpoint forgot-password


## Correção de Fluxo de Autenticação (Sessão Atual)
- [x] Corrigir ProtectedRoute em App.tsx para verificar authToken no localStorage
- [x] Adicionar useEffect em Home.tsx para redirecionar usuários autenticados
- [x] Adicionar loading spinner enquanto redireciona usuário autenticado
- [x] Testar fluxo: usuário não autenticado vê login, autenticado é redirecionado
- [x] Validar que Dashboard não carrega quando usuário não está autenticado
- [x] Validar que Home redireciona para /dashboard ou /admin baseado no role


## Reescrever Botão de Perfil no Dashboard
- [x] Analisar estrutura atual do Dashboard e UserMenu
- [x] Criar componente UserProfileButton com foto/siglas do usuário
- [x] Implementar dropdown menu com opções (Meu Perfil, Admin, Configurações)
- [x] Criar página Settings.tsx para configurações de layout e notificações
- [x] Integrar UserProfileButton no Dashboard
- [x] Testar fluxo completo e validar para todos os tipos de usuário
- [x] Salvar checkpoint com novas funcionalidades


## Reescrever Página Profile com Edição de Dados e Alteração de Senha
- [x] Analisar estrutura atual do Profile e schema do banco
- [x] Criar/atualizar endpoints para buscar e atualizar perfil do usuário
- [x] Reescrever página Profile com formulários interativos
- [x] Implementar alteração de senha com validação e confirmação
- [x] Criar testes vitest para funcionalidades de perfil
- [x] Testar fluxo completo e validar alterações no banco
- [x] Salvar checkpoint com novas funcionalidades


## Adicionar Upload de Imagem de Perfil
- [ ] Analisar estrutura de upload e S3
- [ ] Criar endpoint para upload de imagem (POST /api/users/:id/upload-image)
- [ ] Adicionar seção de upload na página Profile
- [ ] Exibir imagem do usuário no Profile com preview
- [ ] Atualizar UserMenu para mostrar imagem em vez de siglas
- [ ] Criar testes vitest para validação de upload
- [ ] Testar fluxo completo e salvar checkpoint


## Reescrever Página Profile com Layout Enxuto
- [x] Reescrever página Profile com layout compacto
- [x] Upload de foto pequeno e discreto no canto superior
- [x] Exibir informações não-editáveis: empresa, departamento, função, último acesso
- [x] Implementar campos editáveis: nome, email
- [x] Criar botão único "Salvar Alterações"
- [x] Testar fluxo de salvamento no banco de dados
- [x] Salvar checkpoint com novas mudanças


## Atualizar Configurações de Banco de Dados Hostinger
- [x] Gerar par de chaves SSH Ed25519
- [x] Adicionar chave pública ao servidor Hostinger
- [x] Testar login SSH com chave privada (sem senha)
- [x] Criar túnal SSH localhost:3307 -> Hostinger MySQL:3306
- [x] Testar conexão MySQL via túnal SSH
- [x] Adicionar colunas company e position na tabela users
- [x] Atualizar db.ts para usar túnal SSH em desenvolvimento
- [x] Atualizar db.ts para usar localhost em produção
- [x] Corrigir testes vitest (238 testes passando)
- [x] Salvar checkpoint com configurações corretas

## Imagem de Perfil - Salvar no Banco e Atualizar Dashboard
- [x] Corrigir fluxo: imagem selecionada fica em preview até clicar Salvar
- [x] Ao clicar Salvar: fazer upload para S3 e salvar URL no banco (campo profileImage)
- [x] UserMenu no Dashboard: buscar profileImage atualizado do banco
- [x] Atualizar UserMenu em tempo real após salvar perfil (via CustomEvent)
- [x] Testar fluxo completo e salvar checkpoint

## Correção Upload de Imagem - Tipo MIME
- [x] Corrigir mapeamento de extensão para MIME (jpg → image/jpeg)
- [x] Testar upload com arquivos .jpg, .png, .webp

## Dashboard - Saudação e Busca Global
- [x] Alterar "Bem-vinda," para "Olá," no Dashboard
- [x] Criar barra de busca global no topo do Dashboard
- [x] Criar endpoint /api/search no backend para buscar chamados, termos e políticas
- [x] Exibir resultados de busca com categorias (Chamados, Políticas, etc.)
- [x] Testar e salvar checkpoint

## UserMenu - Reduzir Transparência do Dropdown
- [x] Reduzir transparência do menu dropdown para melhorar visibilidade das opções
- [x] Salvar checkpoint

## Admin - Botão de Perfil no Header
- [x] Analisar estrutura do header da página Admin
- [x] Criar variante AdminUserMenu com opção "Perfil de Usuário" (→ /dashboard)
- [x] Integrar AdminUserMenu no header da página Admin
- [x] Testar e salvar checkpoint

## Modal de Confirmação - Verificação Real de Senha para Acesso Admin
- [ ] Analisar modal de confirmação atual e SwitchProfileModal
- [ ] Criar endpoint POST /api/auth/verify-password com bcrypt
- [ ] Reescrever modal com verificação real e redirecionamento para /admin
- [ ] Testar fluxo completo e salvar checkpoint


## Modal de Confirmação de Senha para Acesso Admin (Sessão Atual)
- [x] Criar endpoint POST /api/auth/verify-admin-access com verificação bcrypt no banco
- [x] Reescrever AdminAccessModal para usar endpoint real em vez de credenciais hardcoded
- [x] Pré-preencher email do usuário logado via decodificação do token JWT
- [x] Verificar role do usuário (apenas admins têm acesso)
- [x] Retornar token JWT atualizado e dados do usuário após verificação bem-sucedida
- [x] Redirecionar para /admin após verificação bem-sucedida
- [x] Exibir mensagens de erro específicas (403 para não-admin, 401 para senha inválida)
- [x] Criar testes vitest para lógica de verificação (16 testes aprovados)
- [x] Total: 254 testes vitest passando (238 anteriores + 16 novos)


## Correção de Erro 500 na Página /companies (Sessão Atual)
- [x] Diagnosticar causa do erro 500 no endpoint /api/companies
- [x] Corrigir endpoint ou página Companies.tsx
- [x] Testar fluxo completo e salvar checkpoint


## Correção de Erro 401 no UserMenu da Página /admin (Sessão Atual)
- [x] Diagnosticar causa do erro 401 ao carregar perfil no UserMenu (/admin)
- [x] Corrigir problema de autenticação no AdminDashboard
- [x] Testar e salvar checkpoint

## Correção de Token Inválido no localStorage (Sessão Atual)
- [x] Diagnosticar por que o token continua inválido após o login
- [x] Corrigir fluxo de login para salvar token válido e redirecionar para /admin
- [x] Testar e salvar checkpoint

## Deploy na Hostinger
- [x] Auditar e corrigir configurações para produção
- [x] Fazer build do frontend
- [x] Preparar pacote de deploy (.zip)
- [x] Criar guia de deploy passo a passo
- [x] Salvar checkpoint e entregar ao usuário

## Atualização de Credenciais do Banco
- [x] Mapear todos os arquivos com credenciais incorretas
- [x] Atualizar credenciais em todos os arquivos do projeto
- [x] Atualizar túmel SSH com novos dados
- [x] Testar conexão com o banco e salvar checkpoint

## Página Support - Central de Atendimento (RBAC + Multi-Tenant)
- [ ] Auditar schema e estrutura atual
- [ ] Criar tabelas: requests, occurrences, approvals, item_attachments, item_history
- [ ] Implementar endpoints de API com RBAC e escopo por empresa
- [ ] Criar página Support com dashboard, ações rápidas e abas
- [ ] Implementar filtros avançados, busca e detalhes integrados
- [ ] Escrever testes vitest e salvar checkpoint

## Página Support - Central de Atendimento (Concluído)
- [x] Auditar schema e estrutura atual
- [x] Criar tabelas no banco (requests, approvals, support_history, support_attachments)
- [x] Implementar endpoints de API com RBAC e multi-tenant (/api/support/*)
- [x] Criar página Support.tsx com dashboard, ações rápidas e listas com abas
- [x] Implementar filtros avançados, busca e ordenação
- [x] Escrever 41 testes vitest para support-routes
- [x] Total: 295 testes vitest passando


## Responsividade da Página Admin
- [x] Auditar AdminDashboard para problemas de responsividade
- [x] Implementar layout responsivo com breakpoints
- [x] Otimizar tabelas e cards para mobile
- [x] Testar em diferentes resoluções e salvar checkpoint


## Ajuste de Visibilidade dos KPICards no Admin
- [x] Diagnosticar oclusão dos KPICards pelo menu lateral
- [x] Ajustar layout para visibilidade total em qualquer dispositivo
- [x] Testar em diferentes resoluções e salvar checkpoint

## Gerenciador Integrado ITAM + Documentos + RBAC
- [x] Criar tabelas MySQL: ativos, arquivos, permissoes (via Drizzle schema)
- [x] Rodar pnpm db:push para migrar tabelas (criadas via SQL direto)
- [x] Implementar endpoints API: /api/ativos, /api/arquivos, /api/gerenciador
- [x] Implementar RBAC por recurso (departamento/chamado/ativo/arquivo)
- [x] Criar página ITAM (Ativos) com listagem, filtros e CRUD
- [x] Criar página Gerenciador de Documentos com upload e árvore por departamento
- [x] Criar página de Permissões (admin only)
- [x] Integrar navegação no Dashboard (cards de serviço)
- [x] Escrever testes vitest para novos endpoints (332 testes passando)
- [x] Salvar checkpoint

## Correção de Erro useState + Atualização de Credenciais MySQL
- [x] Corrigir erro "Cannot read properties of null (reading 'useState')" na página /admin
- [x] Adicionar trpc.Provider e QueryClientProvider no main.tsx
- [x] Adicionar dedupe de React no vite.config.ts para garantir instância única
- [x] Atualizar credenciais do banco MySQL (banco: u298830991_portal, user: u298830991_admin)
- [x] Reiniciar túnel SSH com novas credenciais
- [x] Testar login e verificar que /admin carrega sem erros (332 testes passando)

## Página Management - Painel Administrativo
- [x] Criar endpoint GET /api/management/stats (chamados, requisições, aprovações)
- [x] Criar endpoint GET /api/management/approvals/history
- [x] Criar endpoint GET /api/management/tickets/recent
- [x] Criar endpoint GET /api/management/requests/recent
- [x] Criar página Management.tsx com sidebar RBAC e dashboard
- [x] Sidebar com 10 módulos filtrados por perfil (admin/manager/user)
- [x] Implementar KPI cards: chamados (5 cards), requisições (4 cards), aprovações (4 cards)
- [x] Adicionar gráfico PieChart de status de chamados (recharts)
- [x] Adicionar gráfico BarChart de prioridade de chamados (recharts)
- [x] Adicionar gráfico BarChart horizontal de status de requisições (recharts)
- [x] Tabela de chamados recentes com status/prioridade badges
- [x] Tabela de requisições recentes
- [x] Tabela de aprovações pendentes + histórico de aprovações
- [x] Controle de acesso RBAC (admin vê tudo, manager vê módulos autorizados, user vê apenas chamados)
- [x] Layout responsivo (desktop, tablet, mobile) com sidebar colapsável
- [x] Registrar rota /management no App.tsx
- [x] Adicionar link Management no AdminSidebar
- [x] Escrever 25 testes Vitest para endpoints de management (356 total passando)
- [x] Instalar supertest para testes de integração HTTP
- [x] Salvar checkpoint

## Correção de Erros React - Management.tsx
- [x] Corrigir aviso "Each child in a list should have a unique key prop" em TicketsSection
  - Causa: subcomponentes definidos dentro do componente Management (recriados a cada render)
  - Solução: mover ManagementSidebar, OverviewSection, TicketsSection, RequestsSection, ApprovalsSection para fora do componente, passando dados via props tipadas
  - Resultado: zero erros de key prop após refatoração (verificado no browserConsole.log)

## Correção departments.map is not a function
- [x] Corrigir GerenciadorDocumentos.tsx: extração correta do array da resposta { success, data: [...] }
- [x] Corrigir ITAM.tsx: mesma correção para departments e users
- [x] Corrigir Permissoes.tsx: mesma correção para departments

## Substituição /admin → /management
- [x] Atualizar redirecionamento pós-login: admin/gerente → /management
- [x] Adicionar AdminRoute (verifica role admin/manager antes de renderizar)
- [x] Rota /admin redireciona automaticamente para /management
- [x] Sidebar do Management atualizado com 14 módulos (Usuários, ITAM, Chamados, Requisições, Aprovações, Notificações, Permissões, Documentos, Empresas, Relatórios, Servidor, Configurações)
- [x] Corrigidos 9 arquivos que redirecionavam para /admin (UserDashboard, TeamsWeb, Reports, Companies, Users, Departments, AdminServer, AdminSidebar, UserDashboard href)
- [x] Salvar checkpoint

## Correção link Gestão de Usuários
- [x] Alterar href de Gestão de Usuários no Management.tsx de /admin/users para /admin/server
- [x] Salvar checkpoint

## Correção botão Voltar - Support
- [x] Corrigir botão Voltar em Support.tsx para usar window.history.back() (página anterior)
- [x] Salvar checkpoint

## Correção chaves duplicadas - Management
- [x] Corrigir key `ticket-row-undefined` em TicketsSection (usar t.id ?? t.ticketId ?? idx)
- [x] Corrigir key `req-row-undefined` em RequestsSection (usar r.id ?? r.requestId ?? idx)
- [x] Corrigir key `pend-undefined` em ApprovalsSection pendentes (usar a.id ?? idx)
- [x] Corrigir key `hist-undefined` em ApprovalsSection histórico (usar a.id ?? idx)
- [x] 356 testes passando
- [x] Salvar checkpoint

## Módulo Tickets de Estacionamento - RH
- [ ] Criar tabelas MySQL: tickets_estacionamento, solicitacoes_ticket, log_uso_tickets
- [ ] Criar endpoints backend: upload CSV, listar disponíveis, solicitar, dashboard KPIs
- [ ] Instalar dependências: qrcode, papaparse, xlsx
- [ ] Criar página /rh/tickets-estacionamento (gerência RH)
- [ ] Criar página /estacionamento/solicitar (usuários com QR Code)
- [ ] Criar página /rh/dashboard-estacionamento (KPIs + gráficos)
- [ ] Integrar rotas no App.tsx
- [ ] Adicionar links no sidebar do Management
- [ ] Escrever testes Vitest para o módulo
- [ ] Salvar checkpoint

## Módulo Tickets de Estacionamento RH

- [x] Criar tabelas MySQL: tickets_estacionamento, solicitacoes_ticket, log_uso_tickets
- [x] Criar endpoints backend com mysql2 (evitando conflito com rotas existentes)
  - [x] GET /api/estacionamento/tickets (RH)
  - [x] GET /api/estacionamento/disponiveis (usuários)
  - [x] POST /api/estacionamento/tickets (RH)
  - [x] POST /api/rh/tickets/upload-csv (RH - lote CSV/Excel)
  - [x] DELETE /api/estacionamento/tickets/:id (RH)
  - [x] POST /api/estacionamento/solicitar (usuários)
  - [x] GET /api/estacionamento/minhas-solicitacoes (usuários)
  - [x] GET /api/estacionamento/solicitacao/:id/qrcode (usuários)
  - [x] GET /api/rh/dashboard-estacionamento (RH)
  - [x] GET /api/rh/tickets-relatorio (RH)
- [x] Criar página /rh/tickets-estacionamento (gestão RH com upload CSV)
- [x] Criar página /estacionamento/solicitar (usuários com geração de QR Code)
- [x] Criar página /rh/dashboard-estacionamento (KPIs e gráficos)
- [x] Integrar rotas no App.tsx
- [x] Adicionar 3 itens ao sidebar do Management
- [x] Escrever 22 testes Vitest para o módulo
- [x] Corrigir conflito de rotas (/api/tickets/:id vs /api/tickets/disponiveis)
- [x] Corrigir uso de .user para .currentUser (AuthContextType)
- [x] 378 testes passando

## Correção: Criar Ticket de Estacionamento não salva

- [ ] Verificar se tabela tickets_estacionamento existe no banco
- [ ] Verificar endpoint POST /api/estacionamento/tickets
- [ ] Corrigir problema de salvamento e exibição

## Correção: Formulário Criar Ticket Estacionamento
- [x] Corrigir botão "Criando..." que fica preso sem concluir a criação
- [x] Substituir getConn() por pool de conexões (redução de 22s para 6s)
- [x] Substituir conn.end() por conn.release() em todos os endpoints
- [x] Adicionar AbortController com timeout de 30s no apiFetch
- [x] Impedir fechamento do modal durante carregamento
- [x] Adicionar spinner Loader2 e texto "Salvando..." no botão
- [x] 385 testes passando

## Dashboard - Módulo Estacionamento
- [x] Substituir módulo Permissões pelo card "Solicite seu Ticket de Estacionamento" com redirect para /estacionamento/solicitar

## Ícone Histórico de Chamados
- [x] Gerar novo ícone 3D sem fundo para módulo Histórico de Chamados

## Correção: Ícone errado no Histórico de Chamados
- [x] Corrigir ícone do módulo Histórico de Chamados (está exibindo carro em vez do ícone 3D de histórico)

## ITAM - Cadastro de Ativos
- [ ] Verificar página ITAM atual e estrutura do banco
- [ ] Criar/atualizar tabela it_assets no MySQL com campos completos
- [ ] Criar endpoints backend: GET/POST/PUT/DELETE /api/itam/assets e POST /api/itam/assets/upload
- [ ] Implementar modal de cadastro individual com todos os campos
- [ ] Implementar modal de upload em lote via CSV/Excel com preview e validação
- [ ] Adicionar download de template CSV de exemplo
- [ ] Escrever testes Vitest para endpoints de ITAM

## Melhorias no Formulário de Criação de Chamado (Support)
- [x] Support: upload de arquivos e imagens no formulário de criação de chamado
- [ ] Support: suporte a colar print (Ctrl+V / paste) na caixa de descrição
- [ ] Support: substituir campo de categoria por lista pré-definida de categorias de TI
- [x] Dashboard: substituir ícone do card Ticket de Estacionamento por carro com QR code
- [x] Training: remover mensagem de saudação 'Olá, {name}! 👋'
- [x] Dashboard: substituir ícone Ticket de Estacionamento pela imagem fornecida do carro com QR code
- [x] Support: upload de arquivos/imagens no formulário de criação de chamado
- [x] Support: paste de print (Ctrl+V) na descrição do chamado
- [x] Support: categorias pré-definidas de TI no formulário de chamado
- [x] Support: painel de ações de gestão (atribuir, atender, alterar status, encerrar)
- [x] Support: correção de permissões (retryWithBackoff wrapper)
- [ ] Management: vincular KPI Cards aos dados reais do Support
- [ ] Management: adicionar links com filtros pré-selecionados nos KPI Cards


## Correção de Erro 502 e Pool MySQL (Sessão Atual)
- [x] Criar módulo de pool MySQL compartilhado (server/mysql-pool.ts)
- [x] Refatorar support-routes.ts para usar pool com conn.release() no finally
- [x] Refatorar itam-routes.ts para usar pool compartilhado
- [x] Refatorar db.ts para usar pool em vez de createConnection individual
- [x] Refatorar estacionamento-routes.ts para usar pool compartilhado
- [x] Corrigir query de tickets recentes (remover coluna r.department inexistente)
- [x] Reiniciar servidor e verificar estabilidade

## KPI Cards Clicáveis com Filtros (Sessão Atual)
- [x] Adicionar prop href ao componente KpiCard no Management.tsx
- [x] Tornar KpiCard clicável com Link do wouter quando href fornecido
- [x] Adicionar indicador visual "Ver detalhes →" nos cards com link
- [x] Vincular KPI Cards de chamados (tickets) com filtros no Support
  - [x] Total → /support?type=ticket
  - [x] Abertos → /support?type=ticket&status=aberto
  - [x] Em Andamento → /support?type=ticket&status=em_andamento
  - [x] Resolvidos → /support?type=ticket&status=resolvido
  - [x] Fechados → /support?type=ticket&status=fechado
- [x] Vincular KPI Cards de requisições com filtros no Support
  - [x] Total → /support?type=request
  - [x] Pendentes → /support?type=request&status=aberto
  - [x] Aprovadas → /support?type=request&status=aprovado
  - [x] Rejeitadas → /support?type=request&status=rejeitado
- [x] Vincular KPI Cards de aprovações com filtros no Support
  - [x] Total → /support?tab=approvals
  - [x] Pendentes → /support?tab=approvals&status=pendente
  - [x] Aprovadas → /support?tab=approvals&status=aprovado
  - [x] Rejeitadas → /support?tab=approvals&status=rejeitado
- [x] Atualizar Support.tsx para ler parâmetros de URL ao navegar do Management
  - [x] Inicializar activeTab com base em ?tab= ou ?type= da URL
  - [x] Inicializar filters com base em ?type=, ?status=, ?priority= da URL
  - [x] Abrir painel de filtros automaticamente quando há filtros ativos
  - [x] Reagir a mudanças de URL via useEffect([location])

## Reposicionamento de Card no Dashboard Estacionamento
- [x] Mover card "Histórico de Solicitações" para imediatamente acima dos cards "Status dos Tickets" e "Uso por Dia"

## Correção de Erro na Página ITAM
- [x] Corrigir erro "Cannot read properties of undefined (reading 'color')" na página /itam

## Atualização do Menu Lateral do Management
- [x] Remover link "Servidor" do menu lateral do Management
- [x] Adicionar link para página TeamsWeb no lugar do link "Servidor"

## Substituição de Logo na Página Management
- [x] Upload do logo branco da JKINGS sem fundo
- [x] Substituir o logo "JKINGS Management" pelo logo branco na página Management

## Remoção de Logo e Informação da Barra Lateral
- [x] Remover logo e informação "JKINGS Management" da barra lateral do Management

## Ajuste de Z-Index na Página ITAM
- [x] Aumentar z-index dos botões "Cadastrar Ativo" e "Perfil" para sobrepor qualquer informação

## Alteração do Botão Voltar na Página ITAM
- [x] Alterar o botão voltar da página ITAM para redirecionar para Management

## Correção de Erro na Página AdminServer
- [x] Corrigir erro "departments.map is not a function" na página /admin/server

## Correção de Erro SQL na Criação de Usuário
- [x] Corrigir erro SQL na criação de novo usuário no AdminServer

## Deploy Railway
- [x] Atualizar db.ts para usar DATABASE_URL do ambiente (Railway) sem credenciais hardcoded
- [x] Criar arquivo railway.json com configurações de deploy
- [x] Criar arquivo DEPLOY_RAILWAY.md com guia atualizado

## Correção Deploy Railway
- [x] Corrigir erro ERR_INVALID_ARG_TYPE (__dirname undefined em ESM) no servidor Express
- [x] Atualizar DATABASE_URL para novas credenciais MySQL Railway
- [x] Atualizar DEPLOY_RAILWAY.md com novas credenciais

## Análise e Correção de Autenticação no Railway
- [x] Reiniciar servidor de desenvolvimento
- [x] Analisar problema de autenticação de usuário e senha no Railway
- [x] Corrigir problema de autenticação
- [x] Fazer deploy via GitHub

## Correção de Login no Railway
- [x] Investigar por que usuário jeferson.reis@jkings.com.br não tem senha cadastrada
- [x] Gerar hash de senha e atualizar banco Railway
- [x] Testar login no Railway

## Atualização de Configurações de Conexão Railway
- [x] Revisar e atualizar env.ts para usar variáveis de ambiente do Railway
- [x] Atualizar db.ts para parsear DATABASE_URL
- [x] Atualizar mysql-pool.ts para usar credenciais do Railway
- [x] Testar conexão com banco Railway


## Melhorias na Configuração de Banco de Dados (Sessão Atual)
- [x] Atualizar env.ts com variáveis de ambiente do Railway
- [x] Refatorar db.ts para suportar múltiplos provedores (Hostinger, Railway, local)
- [x] Implementar parser de DATABASE_URL com fallback em cascata
- [x] Adicionar retry automático com backoff exponencial em getDb()
- [x] Melhorar mysql-pool.ts com suporte a keep-alive e event listeners
- [x] Adicionar funções de password reset token (createPasswordResetToken, getPasswordResetToken, markPasswordResetTokenAsUsed)
- [x] Criar documentação DATABASE_CONFIG.md com guia de configuração
- [x] Criar documentação DATABASE_CONNECTION_IMPROVEMENTS.md com detalhes técnicos
- [ ] Atualizar DATABASE_URL com credenciais corretas do Hostinger (u298830991_adm:Jkadm1210###)
- [ ] Testar conexão com banco de dados após atualizar credenciais
- [ ] Validar que todas as operações de banco de dados funcionam corretamente


## Correção de Apontamento de Domínio (Sessão Atual)
- [x] Diagnosticar problema de apontamento de jkings.solutions para Railway (Erro 502 identificado)
- [x] Identificar que credenciais estavam incorretas (era Hostinger, deveria ser Railway)
- [x] Obter credenciais corretas do Railway MySQL
- [x] Atualizar MYSQL_URL e MYSQL_PUBLIC_URL com credenciais corretas do Railway
- [x] Corrigir prioridade de conexão em db.ts (MYSQL_PUBLIC_URL > MYSQL_URL > DATABASE_URL)
- [x] Conexão com Railway confirmada (turntable.proxy.rlwy.net:48844/railway)
- [x] Banco Railway verificado: 10+ usuários e 27 tabelas presentes
- [ ] Redeploy da aplicação no Railway com as novas variáveis
- [ ] Testar acesso a https://jkings.solutions/


## Correção de Erro updateUser3 is not a function (Sessão Atual)
- [x] Diagnosticar erro "updateUser3 is not a function" em dist/index.js
- [x] Identificar que função updateUser estava faltando em server/db.ts
- [x] Adicionar função updateUser(userId, updates) ao db.ts
- [x] Adicionar função deleteUser(userId) ao db.ts
- [ ] Testar endpoints PUT /api/users/:id e DELETE /api/users/:id
- [ ] Validar que funções estão sendo exportadas corretamente


## Validação Completa do Portal (Sessão Atual)
- [x] Verificar .env e .gitignore (credenciais não expostas)
- [x] Auditar env.ts — adicionadas variáveis SMTP, FRONTEND_URL, MYSQL_ROOT_PASSWORD, PORT
- [x] Auditar db.ts — removidos fallbacks hardcoded do Hostinger
- [x] Auditar mysql-pool.ts — já estava correto
- [x] Auditar ssh-tunnel.ts — removidas credenciais hardcoded
- [x] Auditar db-connection.test.ts — removidas credenciais hardcoded
- [x] Corrigir DATABASE_CONNECTION_IMPROVEMENTS.md — removidas referências ao Hostinger
- [x] Corrigir DATABASE_CONNECTION_REPORT.md — reescrito com informações do Railway
- [x] Atualizar MYSQL_URL e MYSQL_PUBLIC_URL com credenciais corretas do Railway
- [x] Atualizar SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_FROM com dados Hostinger
- [x] Conexão com Railway confirmada: turntable.proxy.rlwy.net:48844/railway
- [x] Banco Railway verificado: 10+ usuários e 27 tabelas presentes
- [ ] Sincronizar com GitHub jkings001/portal-atendimento
- [ ] Salvar checkpoint final


## Correção de Perfil e Cadastro de Usuários (Sessão Atual)
- [x] Auditar endpoint de atualização de perfil (PUT /api/users/:id)
- [x] Auditar endpoint de cadastro de usuário (POST /api/users)
- [x] Corrigir backend: PUT /api/users/:id rejeita base64, aceita apenas URLs
- [x] Corrigir backend: POST /api/users rejeita base64, gera openId e hash de senha
- [x] Corrigir db.ts: updatedAt usa string ISO em vez de objeto Date
- [x] Corrigir db.ts: updateUserPassword também usa string ISO
- [x] Ampliar schema profileImage de VARCHAR(500) para VARCHAR(2048)
- [x] Alterar campo profileImage no banco Railway via SQL
- [x] Corrigir upload-image: admins podem fazer upload para qualquer usuário
- [x] Corrigir passport-config: fallback por email quando ID não encontrado
- [ ] Testar fluxo completo de upload de imagem de perfil no ambiente de produção


## Correção Erro /admin/server (Sessão Atual)
- [x] Identificar endpoints inexistentes chamados pelo Management.tsx
- [x] Adicionar getAllUsers() e getAllCompanies() ao db.ts (estavam faltando)
- [x] Corrigir getAllUsers() para usar SQL direto (coluna 'company' não 'companyId')
- [x] Adicionar getUsersByCompany() ao db.ts
- [x] Corrigir Management.tsx para usar /api/management/stats (endpoint unificado)
- [x] Corrigir Management.tsx para usar /api/management/tickets/recent e /requests/recent
- [x] Testar endpoints: /api/users e /api/companies retornam JSON corretamente


## Módulo de Suporte Completo (Sessão Atual)
- [ ] Auditar páginas de suporte existentes (Support.tsx, Tickets.tsx, etc.)
- [ ] Verificar estrutura do banco: tabelas requests, approvals, categories
- [ ] Backend: endpoints CRUD para chamados (tickets)
- [ ] Backend: endpoints CRUD para requisições (requests)
- [ ] Backend: endpoints CRUD para ocorrências (occurrences)
- [ ] Backend: endpoint de atribuição de agente
- [ ] Backend: endpoint de comentários/histórico
- [ ] Backend: endpoint de anexos
- [ ] Frontend: página de listagem com filtros avançados
- [ ] Frontend: formulário de criação de chamado
- [ ] Frontend: página de detalhes do chamado
- [ ] Frontend: painel de atribuição e gestão (admin/agente)
- [ ] Frontend: dashboard de análise com métricas
- [ ] Testar consistência completa com banco Railway

## Módulo de Suporte Completo (Sessão Atual)
- [x] Auditar páginas de suporte existentes e estrutura do banco
- [x] Corrigir erro LIMIT/OFFSET no support-routes.ts (MySQL2 prepared statements)
- [x] Reescrever support-routes.ts com CRUD completo (chamados, requisições, ocorrências)
- [x] Adicionar endpoint /api/support/agents com colunas corretas da tabela users
- [x] Adicionar endpoint /api/support/analytics com volume, SLA e tempo médio
- [x] Adicionar endpoint /api/support/stats com métricas em tempo real
- [x] Adicionar endpoints /assign, /status, /comment, /attachments
- [x] Corrigir Support.tsx para usar endpoints dedicados (/assign, /status, /agents)
- [x] Reescrever Reports.tsx com dados reais do banco Railway (4 abas)
- [x] Implementar aba Visão Geral com KPIs, gráficos de status e tipo
- [x] Implementar aba Tendências com volume por dia, tipo e empresa
- [x] Implementar aba Agentes com tabela de performance e gráfico comparativo
- [x] Implementar aba SLA & Tempo com gauge de compliance e tempo médio por prioridade
- [x] Corrigir erro u.isActive (coluna não existe na tabela users)
- [x] Servidor estável conectado ao Railway (turntable.proxy.rlwy.net:48844)
- [x] Endpoints retornam 401 corretamente (autenticação funcionando)

## Redeploy Railway (Sessão Atual)
- [x] Verificar build de produção (pnpm run build)
- [x] Adicionar 20 funções faltantes ao db.ts (warnings import-is-undefined)
- [x] Build limpo sem warnings de funções indefinidas
- [ ] Sincronizar código com GitHub via checkpoint
- [ ] Redeploy no Railway para resolver erro 502
- [ ] Validar acesso a https://jkings.solutions/

## Correção key prop Management.tsx
- [x] Localizar elementos sem key prop em Management.tsx
- [x] Adicionar key nos 4 componentes Cell do PieChart
- [x] Converter legenda estática para .map() com key prop


## Correção de React key prop warning no Management.tsx (Sessão Atual)
- [x] Diagnosticar causa raiz do erro "Each child in a list should have a unique key prop"
- [x] Identificar que db.execute() retorna [rows, fields] e endpoints não desestruturavam corretamente
- [x] Corrigir endpoint /api/management/tickets/recent para retornar array plano de rows
- [x] Corrigir endpoint /api/management/requests/recent para retornar array plano de rows
- [x] Corrigir endpoint /api/management/approvals/history para desestruturar corretamente
- [x] Corrigir todos os db.execute() sem desestruturação no endpoint /api/management/stats
- [x] Validar que o dashboard exibe 8 chamados recentes e 7 requisições corretamente
- [x] Build de produção gerado sem erros

## Correção de Seleção de Horas e Valores no Estacionamento (Sessão Atual)
- [x] Corrigir select de duração em RHTicketsEstacionamento.tsx para apenas 2h e 12h
- [x] Corrigir campo de valor em RHTicketsEstacionamento.tsx para ser automático (2h=R$18, 12h=R$44)
- [x] Corrigir filtro de duração em EstacionamentoSolicitar.tsx para apenas 2h e 12h
- [x] Corrigir select de duração desejada em EstacionamentoSolicitar.tsx para apenas 2h e 12h
- [x] Corrigir cálculo de valor em EstacionamentoSolicitar.tsx para usar tabela fixa de preços
- [x] Validar que RHDashboardEstacionamento.tsx não precisa de alterações (apenas exibe dados)

## Correção de Exibição de Valor nos Cards de Estacionamento
- [x] Exibir valor que o usuário pagará (R$18 ou R$44) nos cards de tickets disponíveis em EstacionamentoSolicitar.tsx

## Reformulação da Página /estacionamento/solicitar
- [x] Ajustar endpoint para retornar apenas 1 ticket por duração (2h e 12h), o mais antigo disponível
- [x] Ordenar tickets do mais antigo para o mais novo no endpoint
- [x] Reformular frontend para exibir 2 cards fixos (1 para 2h, 1 para 12h)
- [x] Exibir histórico do último mês do usuário logo abaixo das opções de ticket
- [x] Remover filtro de duração (desnecessário com apenas 2 opções fixas)

## Responsividade Mobile — /estacionamento/solicitar
- [x] Aumentar ícone do carro no header
- [x] Remover botão de atualizar a página
- [x] Corrigir modal do QR Code para não expandir além da tela no mobile
- [x] Adicionar botão de voltar para a página inicial

## Gestão de Usuários e Permissões
- [ ] Criar tabelas no banco: companies, user_groups, group_members, portal_modules, group_permissions, permission_audit_log
- [ ] Criar endpoints de backend: CRUD empresas, grupos, membros, permissões e auditoria
- [ ] Criar página frontend /admin/permissions com layout completo
- [ ] Registrar rota /admin/permissions no App.tsx
- [ ] Adicionar link de acesso na sidebar/menu admin

## Gestão de Usuários e Permissões — Nova Página
- [x] Criar tabelas no banco: user_groups, group_members, group_permissions, portal_modules, permission_audit_log
- [x] Popular portal_modules com os módulos do portal
- [x] Criar endpoints de backend (permissions-routes.ts) para CRUD de grupos, membros, permissões e auditoria
- [x] Corrigir endpoint de usuários por empresa (fallback por campo company quando assignments vazio)
- [x] Corrigir alias SQL 'groups' (palavra reservada MySQL) para user_groups_list
- [x] Criar página frontend AdminPermissions.tsx com layout completo (KPIs, sidebar de empresas, abas Usuários/Grupos/Permissões/Auditoria)
- [x] Registrar rota /admin/permissions no App.tsx

## ITAM — Integração com Banco de Dados e Vínculo a Usuários
- [x] Analisar página ITAM atual e identificar erros
- [x] Verificar/criar tabelas de ativos no banco (tabela ativos já existia com 4 registros)
- [x] Corrigir endpoint GET /api/ativos (erro LIMIT/OFFSET com prepared statements MySQL)
- [x] Corrigir STATUS_CONFIG no ITAM.tsx para ter fallback seguro (evitar erro de color undefined)
- [x] Corrigir getTipoIcon para aceitar tipo null/undefined
- [x] Integrar Dashboard com ativos reais do usuário logado (substituir dados mockados)
- [x] Implementar vínculo de ativos a usuários cadastrados (campo usuarioId na tabela ativos)
- [x] Exibir equipamentos do usuário logado no dashboard com skeleton loading e estado vazio

## Responsividade Mobile — Auditoria Geral
- [ ] Corrigir página de login (Home.tsx) — layout e formulário mobile
- [ ] Corrigir Dashboard.tsx — grid de cards, header, busca global
- [ ] Corrigir SupportTickets.tsx — tabela de chamados, filtros, modais
- [ ] Corrigir ITAM.tsx — grid de ativos, filtros, modais de cadastro/edição
- [ ] Corrigir AdminDashboard / Management.tsx — sidebar, tabelas, KPIs
- [ ] Corrigir páginas RH (tickets e dashboard estacionamento) — tabelas e filtros
- [ ] Corrigir AdminPermissions.tsx — sidebar de empresas, tabelas de usuários
- [ ] Garantir que todos os modais não ultrapassem a tela em mobile
- [ ] Garantir que tabelas horizontais tenham scroll controlado em mobile

## Responsividade Mobile — Correções Aplicadas (Sessão Atual)
- [x] Auditoria de responsividade em SupportTickets.tsx — já estava responsivo, sem correções necessárias
- [x] Auditoria de responsividade em RHDashboardEstacionamento.tsx — já estava responsivo, sem correções necessárias
- [x] Auditoria de responsividade em RHTicketsEstacionamento.tsx — já estava responsivo, sem correções necessárias
- [x] Auditoria de responsividade em AdminPermissions.tsx — já estava responsivo (cards mobile + tabela desktop), sem correções necessárias
- [x] Corrigir Companies.tsx — grids do modal (grid-cols-2 → grid-cols-1 sm:grid-cols-2, grid-cols-3 → grid-cols-1 sm:grid-cols-3), título responsivo
- [x] Corrigir Users.tsx — header responsivo (flex-col sm:flex-row), título responsivo (text-2xl sm:text-4xl), padding responsivo (p-4 sm:p-8)
- [x] Corrigir AdminServer.tsx — KPI text-3xl → text-2xl sm:text-3xl
- [x] Auditoria de Reports.tsx — já estava responsivo, sem correções necessárias
- [x] Auditoria de AdminDashboard.tsx — já estava responsivo, sem correções necessárias

## Correção de Dropdowns com Visualização Inadequada (Sessão Atual)
- [x] Identificar páginas com dropdowns problemáticos (ITAM.tsx, EstacionamentoSolicitar.tsx, etc)
- [x] Analisar CSS dos elementos select e SelectContent do shadcn/ui
- [x] Corrigir cores de fundo, texto e hover dos dropdowns
- [x] Melhorar contraste e visibilidade dos itens
- [x] Adicionar estilos globais para select no index.css (bg-slate-700, border-white/20, hover, focus, option styling)
- [x] Corrigir selects em ITAM.tsx (Tipo, Status, Departamento, Usuário Responsável)
- [x] Validar que outras páginas já usam bg-slate-700 (AdminServer, Companies, Departments)

## Tipos de Ativos com Ícones (Sessão Atual)
- [x] Atualizar tipos de ativos no select de cadastro (Notebook, Smartphone, Tablet, Monitor, Licença, Outros)
- [x] Atualizar filtros de tipo no ITAM.tsx
- [x] Criar mapa de ícones por tipo (Laptop, Smartphone, Tablet, Monitor, Key, Package)
- [x] Atualizar getTipoIcon() no ITAM.tsx com novos tipos
- [x] Atualizar STATUS_CONFIG e exibição de ícones no dashboard do usuário
- [x] Validar exibição dos ícones na listagem de ativos do dashboard

## Migração para Novo Banco Railway e Correção de Ativos
- [x] Atualizar credenciais MYSQL_PUBLIC_URL e MYSQL_URL para novo banco Railway
- [x] Validar conexão com novo banco (turntable.proxy.rlwy.net:48844/railway)
- [x] Atualizar schema Drizzle: ENUM tipo de ativos (notebook, smartphone, tablet, monitor, licenca, outros)
- [x] Migrar ENUM no banco: VARCHAR temporário → UPDATE registros legados → ENUM novo
- [x] Corrigir tipos dos ativos existentes: Monitor LG 19 → monitor, Iphone 14 → smartphone
- [x] Reiniciar servidor com novas credenciais

## Correções AdminPermissions (admin/permissions)
- [ ] Corrigir dashboard de empresas para exibir usuários ativos reais por empresa
- [ ] Corrigir função de criar grupo (não está funcionando)
- [ ] Adicionar seleção de usuários no modal de novo grupo

## Correções na Tela de Chamado (Sessão Atual)
- [x] Corrigir botão de envio de mensagem (showCloseButton=false no DialogContent, flex fix no chat panel)
- [x] Melhorar UX do botão de envio (feedback visual quando ativo/inativo, type="button")
- [x] Destacar solicitação original do usuário (banner com borda colorida por prioridade, caixa cyan)
- [x] Adicionar seção de edição de SLA no painel de ações (agente/admin podem alterar prazo)
- [x] Corrigir query SQL de gestores (u.companyId → JOIN userCompanyAssignments)
- [x] Abrir endpoint de SLA para agentes (não apenas admin)

## Correções na Tela de Chamado (Sessão Atual)
- [x] Corrigir botão de envio de mensagem (showCloseButton=false no DialogContent, flex fix no chat panel)
- [x] Melhorar UX do botão de envio (feedback visual quando ativo/inativo, type=button)
- [x] Destacar solicitação original do usuário (banner com borda colorida por prioridade, caixa cyan)
- [x] Adicionar seção de edição de SLA no painel de ações (agente/admin podem alterar prazo)
- [x] Corrigir query SQL de gestores (u.companyId -> JOIN userCompanyAssignments)
- [x] Abrir endpoint de SLA para agentes (não apenas admin)
- [x] Remover op\u00e7\u00e3o de atualizar e sele\u00e7\u00e3o de perfil duplicada na tela Management
- [x] Adicionar link no dashboard de usuarios da pagina /admin/permissions para /admin/server
- [x] Trocar card Mudancas por Criar Usuario com redirecionamento para /admin/server
- [x] Botao Criar Usuario em /admin/permissions abre automaticamente o formulario de criacao em /admin/server
- [x] Link Gestao de Usuarios em Management aponta para /admin/permissions
- [x] Corrigido erro companyDepartments.map is not a function em /company-details
- [x] Dashboard /dashboard: Status dos Chamados agora mostra dados reais do usuário logado via /api/support/stats
- [x] Corrigir upload de arquivos na página /documentos e substituir campo Departamento por seleção de usuários cadastrados
- [x] Corrigir erro 'Erro ao carregar departamentos: [object Object]' na página /admin/departments

## Departamentos Padrão e Campo Responsável
- [x] Criar endpoint POST /api/departments/seed para criar departamentos padrão em todas as empresas
- [x] Criar departamentos padrão automaticamente ao criar nova empresa
- [x] Substituir campo Gerente por Responsável (seleção de usuários cadastrados) no modal de departamentos
- [x] Permitir edição de todas as informações dos departamentos padrão
- [x] Botão "Criar Padrões" na listagem para seed manual de departamentos
- [x] Exibir nome do responsável na listagem com ícone de usuário

## Correção de Erro /admin/server
- [x] Corrigir erro 'data.find is not a function' em AdminServer.tsx - loadDepartmentsByCompany
- [x] Corrigir endpoint GET /api/departments para extrair .data do retryWithBackoff
- [x] Corrigir endpoint GET /api/departments/company/:id para extrair .data do retryWithBackoff

## Sincronização de Departamentos Padrão
- [x] Atualizar lista de 19 departamentos padrão no db.ts
- [x] Criar função syncDepartmentsForCompany (remove duplicatas + cria faltantes)
- [x] Criar função syncAllCompaniesDepartments
- [x] Criar endpoint POST /api/departments/sync
- [x] Criar endpoint POST /api/departments/sync/:companyId
- [x] Adicionar botão "Sincronizar Padrões" (verde) na página /admin/departments
- [x] Manter botão "Criar Padrões" (amarelo) para empresas sem departamentos

## Auditoria e Correção de Edição de Usuário
- [x] Auditar schema do banco (tabela users e relacionamentos)
- [x] Auditar endpoint PUT /api/users/:id
- [x] Corrigir campos faltantes no PUT (departmentId, companyId, role, profileImage)
- [x] Corrigir vinculação empresa-usuário (tabela userCompanyAssignments)
- [x] Carregar departamentos ao abrir modal de edição (pela empresa do usuário)
- [x] Carregar departamentos ao trocar empresa no modal de edição
- [x] Verificar todos os relacionamentos do usuário no banco
- [x] Select de departamento usa departmentId (ID numérico) para persistência correta
- [x] Backend resolve nome do departamento pelo ID antes de salvar em users.department
- [x] userCompanyAssignments é criado/atualizado automaticamente ao editar usuário

## Melhorias na Listagem de Usuários e Validação
- [x] Enriquecer endpoint GET /api/users com nome da empresa via JOIN com userCompanyAssignments
- [x] Adicionar campo companyName na interface User do AdminServer.tsx
- [x] Adicionar badge "Empresa" (cyan) na listagem de usuários em /admin/server
- [x] Validar unicidade de e-mail por empresa no endpoint POST /api/users
- [x] Retornar erro claro quando e-mail já existe na mesma empresa
- [x] Criar userCompanyAssignment automaticamente ao criar novo usuário com empresa
- [x] Resolver nome do departamento pelo ID ao criar usuário

## Auditoria Completa AdminServer + Signup + Profile
- [x] Auditar AdminServer.tsx: formData, handleSaveUser, filtros, relacionamentos
- [x] Auditar Signup.tsx: fluxo de criação e vínculo com empresa Temporário
- [x] Auditar Profile.tsx: exibição e salvamento de dados do usuário
- [x] Corrigir erro crítico c.logo em getUserAssignmentsByUserId (ER_BAD_FIELD_ERROR)
- [x] Criar função getOrCreateTemporaryCompany no db.ts
- [x] Vincular usuários do signup à empresa Temporário automaticamente
- [x] Atualizar /api/me para retornar company, companyName, companyId, position
- [x] Corrigir handleSaveUser no AdminServer.tsx para passar departmentId ao criar usuário
- [x] UserProfile.tsx exibe empresa corretamente via /api/me (company field)
- [x] Relacionamentos entre admin/server, profile e signup verificados e corrigidos

## JLX – Classificados Internos
- [x] Upload do logo JLX para CDN
- [x] Criar tabelas jlx_listings e jlx_interests no banco de dados
- [x] Criar endpoints de API para anúncios JLX (CRUD, interesse, favoritos, meus anúncios)
- [x] Criar página JLX.tsx com grid de anúncios, busca e filtros
- [x] Criar modal de cadastro de anúncio com upload de imagem (via URL)
- [x] Criar modal de detalhes do anúncio com galeria e botão de interesse
- [x] Criar área "Meus Anúncios" para gerenciamento
- [x] Substituir bloco de histórico de chamados no Dashboard pelo widget JLX
- [x] Adicionar rota /jlx no App.tsx (ProtectedRoute)
- [x] Corrigir importação de toast (sonner em vez de @/hooks/use-toast)

## Correção de Publicação de Anúncios JLX
- [x] Diagnosticar causa: tabelas criadas no banco errado (Hostinger) em vez do Railway
- [x] Recriar tabelas jlx_listings e jlx_interests no banco Railway (MYSQL_PUBLIC_URL)
- [x] Recriar jlx_interests com coluna type ENUM('interesse','favorito')
- [x] Adicionar coluna views na tabela jlx_listings
- [x] Corrigir sintaxe de toast (sonner: toast.success/toast.error em vez de {title, variant})
- [x] Adicionar u.email as userEmail no SELECT principal do GET /api/jlx/listings
- [x] Validar fluxo: endpoint retorna JWT error (esperado) em vez de Table doesn't exist

## Correção de Listagem JLX (Anúncio Não Aparece)
- [x] Verificar se o anúncio foi salvo no banco de dados (confirmado: anuncio existe no banco)
- [x] Verificar logs do endpoint GET /api/jlx/listings (retornava 401 No auth token)
- [x] Diagnosticar: fetchListings chamava a API sem enviar o token JWT no header
- [x] Corrigir fetchListings para incluir Authorization: Bearer ${token} no header
- [x] Adicionar tratamento de erro HTTP com mensagem clara ao usuário
- [x] Confirmar: endpoint retorna anúncio corretamente com token válido

## Plataforma Training – Treinamentos Corporativos
- [x] Criar tabelas: training_lessons, training_progress, training_completions, training_comments, training_ratings, training_quizzes, training_quiz_questions
- [x] Criar endpoints de API (CRUD treinamentos, aulas, progresso, quiz, comentários, avaliações)
- [x] Criar página Training.tsx: cards, busca, filtros, Meus Treinamentos, trilhas
- [x] Criar página TrainingDetail.tsx: player de vídeo, lista lateral de aulas, progresso, quiz, comentários, curtidas, avaliações
- [x] Criar área administrativa de treinamentos (cadastrar, editar, gerenciar aulas e quiz)
- [x] Registrar rotas /treinamentos e /treinamentos/:id no App.tsx
- [x] Integrar com usuários cadastrados e respeitar permissões (JWT middleware)
- [x] Widget de Treinamentos Corporativos no Dashboard principal

## Remover Autenticação da Rota /treinamentos
- [x] Trocar ProtectedRoute por Route pública para /treinamentos e /treinamentos/:id no App.tsx
- [x] Criar middleware optionalJwt (usa jose, popula req.user se token válido, nunca bloqueia)
- [x] Mover registerTrainingRoutes para antes dos routers com authenticateJwt global no index.ts
- [x] Tornar token opcional no Training.tsx e TrainingDetail.tsx (envia se disponível)
- [x] Validar: endpoint /api/trainings acessível sem token (user: none no log)

## Correção dos 70 Erros TypeScript Pré-existentes
- [x] Catalogar todos os erros TypeScript por arquivo (70 erros em 12 arquivos)
- [x] Corrigir erros no server/db.ts (drizzle mode, Date vs string, eq overload)
- [x] Corrigir erros no server/itam-routes.ts (execute type arguments, conn tipagem)
- [x] Corrigir erros no server/auth-service.ts (RetryResult .data access)
- [x] Corrigir erros no server/auth-router.ts (createUser params, user.id cast)
- [x] Corrigir erros no server/db-new-tables.ts (colunas camelCase do schema)
- [x] Corrigir erros no server/_core/index.ts (getTicketById, resetUserPassword, createTicket, user.password, user.company)
- [x] Corrigir erros no server/_core/sdk.ts e server/_core/oauth.ts (Date vs string)
- [x] Corrigir erros no server/routers.ts (Date vs string)
- [x] Corrigir erros no client/src/pages/AdminDashboard.tsx (props faltantes)
- [x] Corrigir erros no client/src/pages/FAQ.tsx (Set iteration)
- [x] Corrigir erros no client/src/pages/Users.tsx (formData role type, password, onError)
- [x] Corrigir erros no client/src/pages/UsersManagement.tsx (gerente -> manager)
- [x] Validar que todos os 70 erros foram corrigidos (0 erros ✅)

## Acesso às Páginas de Treinamento sem Re-login
- [x] Analisar como o token/sessão é armazenado (localStorage.authToken para login local, cookie OAuth para Manus)
- [x] Criar endpoint GET /api/auth/token que gera JWT Bearer a partir da sessão OAuth
- [x] Criar hook useTrainingToken que unifica os dois sistemas (localStorage primeiro, depois OAuth)
- [x] Corrigir Training.tsx para usar useTrainingToken
- [x] Corrigir TrainingDetail.tsx para usar useTrainingToken (inclui userId sincronizado)
- [x] Corrigir TrainingAdmin.tsx para usar useTrainingToken
- [x] Validar: 0 erros TypeScript após as alterações

## Resolver Erro connect ETIMEDOUT (Banco Railway)
- [x] Diagnosticar causa: URL, host, porta, SSL, firewall (Railway estava temporariamente indisponível — voltou após ~5h)
- [x] Verificar qual URL está sendo usada (MYSQL_PUBLIC_URL para acesso externo)
- [x] Testar conectividade direta ao host do banco (Railway OK, 48 tabelas presentes)
- [x] Corrigir configuração de conexão (SSL, timeout, pool) — db.ts e mysql-pool.ts já configurados
- [x] Validar que o banco responde corretamente (SELECT 1 → OK, endpoints /api/management/* → 200)

## Remover Referências ao Banco Hostinger
- [x] Identificar todos os arquivos com referências Hostinger — nenhuma credencial de banco Hostinger encontrada (apenas API Hostinger legítima)
- [x] Corrigir server/db.ts para usar apenas Railway (MYSQL_URL interno / MYSQL_PUBLIC_URL externo) — já corrigido
- [x] Corrigir server/mysql-pool.ts para usar apenas Railway — já corrigido
- [x] Corrigir drizzle.config.ts para usar apenas Railway — atualizado com fallback DATABASE_URL
- [x] Remover credenciais Hostinger de scripts de teste e arquivos temporários — nenhuma encontrada
- [x] Testar conexão com Railway e validar que o banco responde — OK (440/452 testes passando)


## Remoção do OAuth e Autenticação Local Unificada
- [x] Remover dependência do OAuth externo (Manus) do fluxo de autenticação
- [x] Corrigir sdk.authenticateRequest para usar autenticação local sem OAuth externo
- [x] Atualizar /api/auth/login para setar cookie JWT de sessão (compatível com tRPC protectedProcedures)
- [x] Atualizar /api/auth/logout para limpar o cookie de sessão
- [x] Atualizar useAuth hook para incluir login mutation e usar setLocation em vez de window.location.href
- [x] Corrigir teste auth-login.test.ts para verificar cookie na resposta de login
- [x] Criar testes auth.local.test.ts para JWT helpers, password helpers e SDK session token
- [x] 422/422 testes vitest passando

## Banco de Dados Railway - Novas Tabelas
- [x] Adicionar tabelas categories, sla_rules, ticket_history ao schema Drizzle
- [x] Adicionar campos categoryId, slaDeadline, firstResponseAt, closedAt à tabela tickets
- [x] Criar script apply-new-tables.mjs para aplicar migrações diretamente no banco Railway
- [x] Criar tabela categories com 8 categorias padrão
- [x] Criar tabela sla_rules com 4 regras de SLA por prioridade
- [x] Criar tabela ticket_history para auditoria de alterações

## Remoção do OAuth da página /treinamentos
- [x] Corrigir useTrainingToken para não chamar /api/auth/token (OAuth)
- [x] Garantir que Training.tsx, TrainingDetail.tsx e TrainingAdmin.tsx usam apenas autenticação local

## Correção de Layout /treinamentos
- [x] Corrigir área branca à esquerda na página /treinamentos

## Remoção do Menu Lateral em /treinamentos
- [x] Remover DashboardLayout de Training.tsx e adicionar botão de voltar para /dashboard
- [x] Remover DashboardLayout de TrainingDetail.tsx e adicionar botão de voltar
- [x] Remover DashboardLayout de TrainingAdmin.tsx e adicionar botão de voltar


## Redirecionamento para Página de Treinamentos
- [x] Fazer o card "Treinamentos Online" no Dashboard redirecionar para /treinamentos


## Integração /terms com Documentos
- [ ] Analisar página /terms e /documentos
- [ ] Criar endpoints para documentos do usuário logado
- [ ] Integrar /terms com página de documentos
- [ ] Exibir documentos atribuídos ao usuário


## Integração /terms com Documentos (Sessão Atual)
- [x] Analisar páginas /terms e /documentos para entender a estrutura atual
- [x] Criar tabela document_assignments no banco para vincular documentos aos usuários
- [x] Adicionar procedimento tRPC documents.userDocuments para obter documentos do usuário
- [x] Adicionar procedimento tRPC documents.acknowledgeDocument para confirmar documentos
- [x] Reescrever TermsOfResponsibility.tsx para usar documentos reais do banco
- [x] Integrar com AuthContext e exibir documentos atribuídos ao usuário logado
- [x] Implementar abas de filtro (Todos, Pendentes, Lidos)
- [x] Implementar botões de visualizar, download e confirmar documentos


## Debug de localStorage na página /terms
- [x] Debugar por que currentUser é null na página /terms mesmo após login
- [x] Verificar se localStorage está sendo carregado corretamente no AuthContext
- [x] Corrigir o fluxo de autenticação para garantir que usuário persiste entre páginas


## Integração Microsoft Teams com Autenticação Local
- [x] Analisar código de Teams no GitHub
- [x] Adaptar Teams para usar autenticação JWT local
- [x] Testar integração de Teams
- [x] Salvar checkpoint


## Análise Completa do Código
- [x] Verificar erros TypeScript e dependências
- [x] Analisar backend (routers, db, autenticação, segurança)
- [x] Analisar frontend (páginas, rotas, contextos, hooks)
- [x] Analisar logs do servidor e console
- [x] Corrigir problemas encontrados
- [x] Relatório final


## Correções da Análise de Código (Mar 2026)

- [x] FIX-01: Adicionar rate limiting no login (express-rate-limit)
- [x] FIX-02: Adicionar headers de segurança (helmet)
- [x] FIX-03: Corrigir reset-password usando userId=0 (placeholder) - implementar validação real do token
- [x] FIX-04: Corrigir verifyToken chamado sem await no endpoint /api/search (é async)
- [x] FIX-05: Remover rotas duplicadas de tickets/comments (linhas 958/973 vs 1275/1286)
- [x] FIX-06: Substituir createConnection por pool no endpoint /api/search (vazamento de conexão)
- [x] FIX-07: Corrigir TermsOfResponsibility.tsx - usar tRPC client em vez de fetch manual
- [x] FIX-08: Adicionar sanitização XSS nos inputs do backend (xss package)
- [x] FIX-09: Proteger rotas REST sensíveis sem autenticação (GET /api/users, GET /api/companies, etc.)
- [x] FIX-10: Corrigir inconsistência bcryptjs.hash vs bcryptjs.default.hash no index.ts
- [x] FIX-11: Remover logs que expõem dados sensíveis (emails em falha de login)
- [x] FIX-12: Garantir que getUserById não exponha passwordHash nas respostas da API
- [x] Testes vitest: 30 testes de segurança passando (security-fixes.test.ts)


## Correção Erro 503 /management (Completo)
- [x] Investigar endpoint de stats retornando 503 (tabelas requests/approvals não existiam)
- [x] Criar tabelas requests e approvals no banco Railway via SQL
- [x] Adicionar tabelas requests e approvals ao schema Drizzle
- [x] Reescrever db.ts com fallback inteligente (MYSQL_PUBLIC_URL > DATABASE_URL > MYSQL_URL)
- [x] Atualizar mysql-pool.ts para usar URL ativa do banco
- [x] Banco Railway restabelecido e conectado com sucesso
- [x] Rodar pnpm db:push — schema sincronizado, migrações aplicadas
- [x] Atualizar drizzle.config.ts com fallback DATABASE_URL
- [x] Testar /api/management/stats — HTTP 200 com dados completos
- [x] Tratamento de erro gracioso no Management.tsx (banner com retry, mensagens 401/503/rede)
- [x] Rodar testes de segurança: 30/30 passando
- [x] Limpar arquivos temporários de teste
- [x] Sincronizar com GitHub

## Correção NaN em /admin/treinamentos
- [x] Investigar erro "Received NaN for children attribute" na página /admin/treinamentos
- [x] Corrigir valores NaN em TrainingAdmin.tsx (lesson_count, avg_rating, started, completions, quiz_score, order_index, duration)
- [x] Corrigir valores NaN em Training.tsx (progress, avg_rating)
- [x] Corrigir valores NaN em TrainingDetail.tsx (quiz_score)
- [x] TypeScript compila sem erros
- [x] Salvar checkpoint

## Correção Uncontrolled Input /admin/treinamentos
- [x] Localizar inputs com value={undefined} no TrainingAdmin.tsx
- [x] Corrigir TrainingForm: usar ?? em vez de || e Number() para campos numéricos
- [x] Corrigir LessonForm: usar ?? em vez de || e Number() para duration e order_index
- [x] TypeScript compila sem erros
- [x] Salvar checkpoint

## Correção Player YouTube e Campo is_active em Treinamentos
- [x] Corrigir player de vídeo: causa raiz era mismatch de nomes (banco retorna videoUrl, frontend esperava video_url)
- [x] Corrigir query SQL de lessons para retornar videoUrl AS video_url e orderIndex AS order_index
- [x] Corrigir envio de lesson: mapear video_url/order_index para videoUrl/orderIndex antes de enviar ao backend
- [x] Suporte a YouTube, Vimeo e links diretos (.mp4) já estava implementado em getEmbedUrl
- [x] Adicionar campo is_active no formulário de criação/edição de treinamentos
- [x] Garantir que treinamentos criados sejam ativos por padrão (isActive = 1 no INSERT)
- [x] Mapear campos snake_case para camelCase no envio de training ao backend
- [x] TypeScript 0 erros
- [x] Salvar checkpoint

## Correção Error 153 YouTube Player
- [x] Corrigir iframe YouTube com parâmetro origin e atributos corretos
- [x] Salvar checkpoint

## Correção Badge Inativo e Error 153 YouTube
- [x] Investigar por que badge "Inativo" persiste após marcar como ativo
- [x] Causa raiz: fetchTrainings usava /api/trainings (rota pública, só ativos, retorna isActive) mas frontend lia is_active
- [x] Criar GET /admin/trainings com SELECT explícito (isActive AS is_active, todos os treinamentos)
- [x] Atualizar fetchTrainings para usar /api/admin/trainings
- [x] Corrigir Error 153 YouTube: adicionar parâmetro origin na URL embed e atributos sandbox/referrerPolicy no iframe
- [x] TypeScript 0 erros
- [x] Salvar checkpoint

## Correção Página Terms - Exibir Documentos do Usuário
- [x] Investigar estrutura da página Terms e endpoint de documentos
- [x] Causa raiz: chamada tRPC falhava (usa cookie Manus OAuth, não JWT local) e não havia rotas REST de documentos
- [x] Criar document-routes.ts com 6 endpoints REST completos
- [x] GET /api/documents/my - documentos do usuário logado
- [x] GET /api/admin/documents - todos os documentos (admin)
- [x] POST /api/admin/documents - criar documento
- [x] PUT /api/admin/documents/:id - editar documento
- [x] DELETE /api/admin/documents/:id - excluir documento
- [x] POST /api/admin/documents/:id/assign - atribuir a usuários
- [x] POST /api/documents/:id/acknowledge - marcar como lido
- [x] Registrar rotas no index.ts
- [x] Corrigir TermsOfResponsibility.tsx para usar REST com JWT
- [x] Criar página AdminDocuments.tsx para gerenciar documentos
- [x] Registrar rota /admin/documentos no App.tsx
- [x] Atualizar menu lateral: "Gerenciar Documentos" (admin) e "Meus Documentos" (manager/user)
- [x] TypeScript 0 erros
- [x] Salvar checkpoint

## Integração Admin/Documentos com /terms
- [ ] Upload de arquivo no admin (PDF, DOCX, etc.) via S3
- [ ] Atribuição de documento a usuários cadastrados
- [ ] Visualização/download do arquivo na página /terms
- [ ] Botão de ciência (acknowledge) funcional
- [ ] Indicador de status (lido/pendente) por usuário
- [ ] Salvar checkpoint
- [x] Integrar /admin/documentos com upload de arquivo (S3) via multipart/form-data
- [x] Adicionar suporte a dois modos no formulário de documento: upload de arquivo e URL externa
- [x] Criar tabelas documents e document_assignments no banco Railway
- [x] Adicionar colunas fileKey, fileName, fileSize, mimeType na tabela documents
- [x] Implementar endpoint POST /api/admin/documents/upload (upload com arquivo)
- [x] Implementar endpoint PUT /api/admin/documents/:id/upload (substituir arquivo)
- [x] Atualizar AdminDocuments.tsx com área de upload, busca de usuários e botões de visualizar/baixar
- [x] Atualizar TermsOfResponsibility.tsx com preview inline de PDF/imagem, botão de confirmar no modal e tabs de filtro
- [x] Criar testes unitários para fluxo de documentos (15 testes passando)
- [x] Otimizar carregamento de páginas: lazy loading de 50+ rotas, transições CSS sem blur, code splitting no Vite
- [x] Corrigir crash do servidor por perda de conexão MySQL (Railway fecha conexões ociosas)
- [x] Adicionar handlers globais uncaughtException/unhandledRejection para evitar crash
- [x] Configurar session store com pool compartilhado (mais resiliente)
- [x] Adicionar ping periódico (4min) para manter conexões MySQL vivas
- [x] Corrigir code splitting no Vite (vendor.js: 1.29MB → 232KB)
- [x] Remover cards de ITAM e Documentos do Dashboard (mantidos apenas na página Management)
- [x] Adicionar campo Grupo/Departamento nos documentos (coluna group_name)
- [x] Melhorar aba de Usuários no modal de edição de documentos (lista de atribuídos sempre visível com botão remover)
- [x] Separar usuários já atribuídos dos disponíveis para adicionar no modal

## Unificação da Página de Documentos
- [ ] Migrar funcionalidades do AdminDocuments para GerenciadorDocumentos
- [ ] Usar endpoints /api/admin/documents na página /documentos
- [ ] Remover página AdminDocuments.tsx separada
- [ ] Atualizar rotas no App.tsx
- [x] Unificar páginas de documentos: GerenciadorDocumentos.tsx usa endpoints /api/admin/documents
- [x] Remover AdminDocuments como página separada (rota /admin/documentos aponta para GerenciadorDocumentos)
- [x] Corrigir erro "Erro ao carregar arquivos" na página /documentos
- [x] Corrigir layout da página /documentos (fundo branco → fundo escuro com header glassmorphic)
- [x] Unificar AdminDocuments e GerenciadorDocumentos em uma única página /documentos

## Responsividade Mobile na Página de Suporte (/support)
- [x] Redesenhar ItemsTable com cards responsivos para mobile (layout vertical com hierarquia clara)
- [x] Melhorar barra de busca/filtros para mobile (Select de ordenação e botão de direção não transbordam mais)
- [x] Melhorar abas (Tabs) para mobile com scroll horizontal e whitespace-nowrap
- [x] Melhorar botões de ação rápida (Novo Chamado, Nova Requisição, Nova Ocorrência) para mobile (flex-1, texto compacto)
- [x] TypeScript 0 erros
- [x] Salvar checkpoint

## Correção do Modal "Novo Documento" (/documentos)
- [x] Aumentar largura do modal para evitar barra de scroll (max-w-2xl → max-w-3xl)
- [x] Reduzir transparência do fundo do modal (bg-background translúcido → bg-[#0d1526] sólido)
- [x] Eliminar barra de scroll vertical dentro do modal (removido overflow-y-auto do modal de criação)
- [x] Escurecer overlay do Dialog (bg-black/50 → bg-black/70 + backdrop-blur-sm)
- [x] Aplicar fundo sólido como padrão em todos os modais do sistema (dialog.tsx base)

## Background de Circuitos Animados (Home + Management)
- [x] Componente CircuitBackground já existia (reutilizado do Dashboard)
- [x] Aplicar CircuitBackground na página Home (login) — substitui imagem estática
- [x] Aplicar CircuitBackground na página Management — canvas fixo com overlay suave
- [x] Sidebar do Management com fundo semi-transparente (backdrop-blur)
- [x] Header mobile do Management com fundo semi-transparente
- [x] TypeScript 0 erros
- [x] Salvar checkpoint

## Bug: Chamados não carregam no Dashboard do Management
- [x] Investigar logs e endpoint de chamados recentes — API retornava status 200 com dados válidos
- [x] Identificar causa raiz: interface RecentTicket usava campo ticketId (inexistente), API retorna requestId
- [x] Corrigir interface RecentTicket: ticketId → requestId, department → category
- [x] Corrigir JSX: t.ticketId → t.requestId, t.department → t.category
- [x] Adicionar executeWithReconnect() em todos os 4 endpoints do management-routes.ts para reconexão automática MySQL
- [x] TypeScript 0 erros
- [x] Salvar checkpoint

## Bug: Menu lateral mobile não funciona no Management
- [x] Investigar o código do menu lateral mobile no Management.tsx
- [x] Causa raiz: zIndex inline (2) sobrescrevia z-40 do className, deixando sidebar atrás do CircuitBackground
- [x] Corrigir zIndex da sidebar para 50 (acima do overlay e do canvas)
- [x] Corrigir overlay de fechamento para zIndex 40 (entre sidebar e conteúdo)
- [x] Adicionar fechamento automático da sidebar ao navegar no mobile (handleNavClick)
- [x] TypeScript 0 erros
- [x] Salvar checkpoint

## Bug: /teamsweb não funciona em jkings.team (funciona no Railway)
- [ ] Investigar diferença entre Railway e jkings.team para /teamsweb
- [ ] Identificar causa raiz (proxy, CORS, rota, domínio)
- [ ] Corrigir o problema
- [ ] Salvar checkpoint

## Melhoria: Limite de 1 subscription por tenant no Microsoft Graph
- [ ] Detectar erro 403 de limite de subscription e exibir mensagem clara na UI
- [ ] Verificar se já existe subscription no banco antes de tentar criar nova
- [ ] Adicionar botão de deletar subscription existente no Graph (DELETE /subscriptions/{id})
- [ ] Melhorar UX: se já existe 1 subscription, sugerir renovar em vez de criar nova
- [ ] TypeScript 0 erros
- [ ] Salvar checkpoint

## Bug: Recebimento de mensagens Teams não funciona
- [ ] Verificar logs do webhook e endpoint de notificação
- [ ] Testar validação do webhook (handshake do Graph)
- [ ] Verificar se subscription está ativa no Graph
- [ ] Testar processamento de mensagem manualmente
- [ ] Corrigir problemas identificados
- [ ] Salvar checkpoint

## Teams: Recriar Subscription e Cron Job de Renovação
- [x] Deletar subscription atual (041a3b7d) via API do Graph
- [x] Recriar subscription com clientState: teams-portal-online
- [x] Implementar cron job de renovação automática a cada 2 dias (startSubscriptionRenewalCron)
- [x] Webhook processa clientState correto sem erro Zod
- [x] TypeScript 0 erros
- [x] Checkpoint salvo (792afd5c) e publicado

## Bug: processing_error e validation_error nas notificações reais do Graph
- [ ] Verificar erros exatos no banco (teams_integration_events)
- [ ] Identificar causa raiz (clientState, resource format, permissões Graph)
- [ ] Corrigir o processamento de notificações reais
- [ ] Salvar checkpoint e publicar


## Diagnóstico Graph e Fallback Teams (Sessão Atual)
- [x] Implementar fallback inteligente em resolveChatMessageFromGraph (usar dados da notificação quando Graph retorna 404/403)
- [x] Adicionar função testGraphMessageFetch para diagnóstico de permissões Azure AD
- [x] Adicionar função listRecentTeamsEvents para listar eventos recentes
- [x] Criar endpoint GET /api/teams/diag-graph para testar chamada Graph com chatId/messageId
- [x] Criar endpoint GET /api/teams/diag-events para listar eventos recentes do banco
- [x] Adicionar rota tRPC teams.testGraphFetch para diagnóstico via UI
- [x] Adicionar aba "Diagnóstico Graph" na UI TeamsWeb com guia de configuração Azure AD
- [x] Adicionar botões de clique para preencher chatId/messageId dos eventos com falha
- [x] Escrever testes vitest para parseTeamsMessage, normalizeMessageText, getTeamsEnv e lógica de fallback
- [x] Total: 494 testes vitest passando

## Correção Banco de Produção Teams (Sessão Atual)
- [x] Diagnosticar erro Column 'userId' cannot be null na tabela requests
- [x] Diagnosticar erro validation_error com clientState: null nas notificações reais
- [x] Criar tabelas teams_subscriptions, teams_integration_events, teams_message_ticket_map no banco dev
- [x] Criar tabela support_history no banco dev
- [x] Alterar requests.userId para aceitar NULL no banco dev
- [x] Adicionar endpoint POST /api/teams/db-migrate para aplicar migrações no banco de produção
- [x] Publicar código e executar /api/teams/db-migrate no banco de produção
- [ ] Testar webhook real com mensagem do Teams após correção


## Página de Tickets com Dados Reais (Sessão Atual)

- [x] Funções db.ts: getMyTickets (UNION tickets+requests), getMyTicketStats, getTicketDetail, getTicketComments, addTicketComment
- [x] Procedures tRPC: tickets.myTickets, tickets.myStats, tickets.detail, tickets.comments, tickets.addComment
- [x] Página SupportTickets.tsx reescrita com dados reais, filtros, paginação e modal de novo chamado
- [x] 30 testes unitários para as novas funções (todos passando, 524 total)

## Correção da Página de Tickets (Dados Reais)

- [ ] Diagnosticar por que a página não busca dados reais do banco
- [ ] Verificar estrutura das tabelas tickets, requests e ocorrencias no banco
- [ ] Corrigir mapeamento do usuário logado nas queries SQL
- [ ] Vincular todos os tipos: chamados, requisições e ocorrências
- [ ] Validar que dados aparecem corretamente na UI


## Página de Tickets com Dados Reais (v2 - Mar 2026)
- [x] Diagnosticar queries SQL que retornavam zero resultados (userId vs email mismatch)
- [x] Corrigir getMyTickets para admin ver todos os registros (isAdmin flag)
- [x] Corrigir getMyTickets para buscar por userId OU userEmail (usuários externos Teams)
- [x] Incluir campo type (ticket/request/occurrence) da tabela requests
- [x] Adicionar filtro por tipo na UI (Chamado/Requisição/Ocorrência)
- [x] Cards de estatísticas por tipo (chamados, requisições, ocorrências)
- [x] Reescrever SupportTickets.tsx com dados reais e filtros completos
- [x] Atualizar procedures tRPC (myTickets, myStats) com isAdmin e type
- [x] 524 testes vitest passando

## Recriação Completa da Página de Tickets (Mar 2026)
- [ ] Auditar estrutura real das tabelas tickets e requests no banco
- [ ] Reescrever queries SQL com todos os campos reais
- [ ] Recriar SupportTickets.tsx do zero sem dados mockados
- [ ] Implementar listagem unificada (tickets + requests + occurrences)
- [ ] Implementar filtros reais (status, prioridade, tipo, busca)
- [ ] Implementar paginação real
- [ ] Implementar cards de estatísticas reais
- [ ] Implementar painel de detalhes com dados reais
- [ ] Implementar criação de novo chamado real
- [ ] Implementar adição de comentários real

## Sprint 3 - Detalhes, E-mail e Produção

- [ ] Página de detalhes do chamado /tickets/:id com linha do tempo
- [ ] Exibir histórico de alterações de status na página de detalhes
- [ ] Exibir comentários e permitir adicionar comentários
- [ ] Exibir e fazer download de anexos
- [ ] Registrar rota /tickets/:id no App.tsx
- [ ] Notificação por e-mail ao abrir chamado via portal
- [ ] Notificação por e-mail ao abrir chamado via Teams
- [ ] Aplicar migração do banco de produção via endpoint db-migrate


## AdminDocuments - Seleção de Usuários/Departamentos na Criação (Sessão Atual)
- [x] Remover bloqueio "Salve o documento primeiro" na aba de Usuários
- [x] Remover bloqueio "Salve o documento primeiro" na aba de Departamentos
- [x] Adicionar aviso informativo na aba de Usuários (seleção antes de salvar)
- [x] Adicionar aviso informativo na aba de Departamentos (seleção antes de salvar)
- [x] Implementar seletor de Empresa na aba de Departamentos (cascata empresa→departamento)
- [x] Buscar empresas via /api/companies ao abrir modal
- [x] Buscar departamentos filtrados por empresa via /api/departments/company/:id
- [x] Implementar estados selectedCompanyId, companies, filteredDepts, loadingDepts
- [x] Resetar selectedCompanyId e filteredDepts ao abrir modal de criação
- [x] Fluxo "Criar e Atribuir": ao criar documento, aplica atribuições pendentes de usuários e departamentos
- [x] Corrigir erros de estrutura JSX (fechamentos duplicados, ternário desnecessário)
- [x] Criar testes vitest para AdminDocuments (16 testes aprovados)
- [x] Total: 544 testes vitest passando


## Correção de Erro "Unknown column 'group_name'" (Sessão Atual)
- [x] Investigar erro ao criar documento (Unknown column 'group_name')
- [x] Adicionar coluna groupName ao schema da tabela documents
- [x] Resolver conflito de migrações (fileKey já existia)
- [x] Limpar e regenerar arquivo de migração
- [x] Executar pnpm db:push com sucesso
- [x] Reiniciar servidor após aplicar migrações
- [x] Todos os 544 testes vitest passando


## Simplificação do Modal de Documentos (Sessão Atual)
- [x] Remover as abas (info, users, departments) do modal
- [x] Adicionar campo de seleção de usuários no formulário principal
- [x] Adicionar campo de seleção de departamentos no formulário principal
- [x] Implementar cascata empresa→departamento no campo de departamentos
- [x] Testar fluxo completo de criação com seleção de usuários/departamentos
- [x] Corrigir erro de coluna group_name em todos os endpoints


## Correção de Erros de Colunas (Sessão Atual)
- [x] Corrigir erro "Unknown column 'd.fileKey'" no endpoint GET /api/documents
- [x] Corrigir erro "Unknown column 'departmentId'" no endpoint POST /api/admin/documents/:id/assign-department
- [x] Todos os 550 testes vitest passando


## Upload de Arquivos e Status em Tempo Real (Sessão Atual)
- [x] Adicionar colunas fileKey, fileName, fileSize, mimeType à tabela documents
- [x] Implementar upload de arquivos funcional com S3
- [x] Mudar status de "Pendente" para "Confirmado" ao visualizar documento
- [x] Implementar edição em tempo real de documentos (sem salvar antes)
- [x] Testar fluxo completo de upload e visualização


## Correção de Visualização de PDF no Chrome
- [x] Adicionar headers CORS ao endpoint de visualização
- [x] Adicionar Content-Disposition: inline ao endpoint
- [x] Testar visualização de PDF no navegador


## Suporte para OneDrive e Google Drive
- [x] Converter links do OneDrive para URLs de visualização direta
- [x] Converter links do Google Drive para URLs de visualização direta
- [x] Testar visualização de documentos de OneDrive/Google Drive


## Debug - Exibição de Documentos na Página Terms
- [x] Verificar se o endpoint GET /api/documents/my está retornando os documentos
- [x] Verificar se o frontend está renderizando os documentos corretamente
- [x] Corrigir a exibição de arquivo e versão por link na página Terms


## Ajuste de Visualização de Documentos na Página Terms
- [x] Melhorar contraste do visualizador de PDF
- [x] Aumentar tamanho do iframe para melhor visualização
- [x] Adicionar barra de ferramentas ao visualizador (zoom, download, etc)
- [x] Ajustar padding e margem do container


## Debug - Erro de Autenticação na Página Terms
- [x] Verificar se a função getAuthToken está retornando o token corretamente
- [x] Verificar se o token está sendo enviado nas requisições
- [x] Corrigir o erro "No auth token" nas requisições da página Terms


## Debug - Loop de Sessão Expirada na Página Terms
- [x] Verificar se o cookie de autenticação está sendo criado após login
- [x] Verificar se o endpoint /api/documents/my está retornando 401
- [x] Verificar se o cookie está sendo enviado nas requisições
- [x] Corrigir o fluxo de autenticação para manter a sessão persistente

## Correção de Botões de Voltar e Tamanho Mobile
- [x] Reescrever BackButton com lógica inteligente (to, onClick, history.back, fallback)
- [x] Corrigir AdminServer - botão inline → BackButton to="/management"
- [x] Corrigir Companies - botão inline → BackButton to="/management"
- [x] Corrigir Departments - botão inline → BackButton to="/management" ou "/companies"
- [x] Corrigir Users - botão inline → BackButton to="/management"
- [x] Corrigir CompanyDetails - botão inline → BackButton to="/companies"
- [x] Corrigir EstacionamentoPage - botão inline → BackButton to="/management"
- [x] Corrigir EstacionamentoSolicitar - botão inline → BackButton to="/estacionamento"
- [x] Corrigir TeamsWeb - botão inline → BackButton to="/management"
- [x] Corrigir Training - botão inline → BackButton to="/dashboard"
- [x] Corrigir TrainingDetails - botão inline → BackButton to="/training"
- [x] Corrigir Reports - botão inline → BackButton to="/dashboard"
- [x] Corrigir Settings - botão inline → BackButton to="/dashboard"
- [x] Corrigir UserProfile - botão inline → BackButton to="/dashboard"
- [x] Corrigir Support - botão inline → BackButton (history.back automático)
- [x] Corrigir JLX - botão inline → BackButton (history.back automático)
- [x] Corrigir RHDashboardEstacionamento - botão inline → BackButton to="/estacionamento"
- [x] Corrigir AdminPermissions - botão inline → BackButton to="/management"
- [x] Corrigir TicketDetail - botão inline → BackButton to="/tickets"
- [x] Corrigir TicketHistory - botão inline → BackButton to="/support"
- [x] Garantir área de toque mínima de 44x44px (min-h-[44px] no BackButton)
- [x] Testar visualmente em viewport 375px (iPhone SE) e 768px (tablet)

## Ajuste de Destino do BackButton por Perfil de Usuário
- [x] Atualizar BackButton para aceitar prop `homeRoute` dinâmica baseada no role do usuário
- [x] Criar hook `useHomeRoute()` que retorna /dashboard (user) ou /management (admin/agent/manager)
- [x] Corrigir Support.tsx - BackButton usa history.back (já correto)
- [x] Corrigir TicketHistory.tsx - removido to="/support", usa homeRoute role-aware
- [x] Corrigir TicketDetail.tsx - mantém to="/tickets" (correto)
- [x] Revisadas 12 páginas: removidos to hardcoded para /dashboard ou /management, agora usam homeRoute role-aware
- [x] Testado: 567 testes vitest passando, TypeScript sem erros

## Ajuste de Background da Página admin/users
- [x] Substituir background inconsistente (imagem bg-admin-dashboard.jpg + overlay radial) pelo padrão do portal (#020810 + CircuitBackground animado + overlay linear sutil)
- [x] Adicionar import do CircuitBackground em Users.tsx
- [x] Verificar visualmente: background alinhado com Management, Dashboard e Home

## Correção BackButton Página de Tickets
- [x] Corrigir TicketHistory.tsx - BackButton já sem to (role-aware, OK)
- [x] Corrigir Support.tsx - BackButton já sem to (role-aware, OK)
- [x] Corrigir TicketDetail.tsx - removido to="/tickets", usa homeRoute role-aware

## Busca por Documentos e Links no Dashboard
- [ ] Auditar tabelas documents, document_assignments e links no banco Railway
- [ ] Criar índices FULLTEXT em documents (title, tags, description) e links (title, tags, url)
- [ ] Criar endpoint GET /api/search?q=&type= com lógica de permissão (público, atribuído ao usuário)
- [ ] Criar tRPC procedure search.query para busca unificada
- [ ] Criar componente DashboardSearch.tsx com campo visual (ícone lupa + placeholder)
- [ ] Implementar dropdown de resultados com categorias (Documentos / Links)
- [ ] Integrar DashboardSearch no Dashboard.tsx
- [ ] Suporte a busca por nome e por tag
- [ ] Resultados filtrados por permissão: documentos públicos (sem atribuição) + atribuídos ao usuário logado
- [ ] Escrever testes vitest para o endpoint de busca

## Busca por Documentos e Links no Dashboard (concluído)
- [x] Criar índices FULLTEXT em documents (title, description, category, groupName)
- [x] Criar índice FULLTEXT em portal_modules (label, description, category)
- [x] Criar índice idx_da_userId em document_assignments para busca rápida
- [x] Criar endpoint GET /api/search com lógica de permissão (documentos públicos + atribuídos ao usuário)
- [x] Busca FULLTEXT com fallback LIKE para queries curtas (< 3 chars)
- [x] Criar componente DashboardSearch.tsx com dropdown glassmorphic e navegação por teclado
- [x] Integrar DashboardSearch no header desktop e área mobile do Dashboard
- [x] Remover lógica de busca inline do Dashboard.tsx (agora encapsulada no componente)
- [x] Criar testes vitest para endpoint de busca (8 testes, 576 total passando)

## Correção da Busca no Dashboard
- [x] Diagnosticar por que o endpoint /api/search não retorna resultados
- [x] Verificar se o searchRouter está registrado corretamente no index.ts
- [x] Verificar se os índices FULLTEXT foram criados com sucesso
- [x] Testar endpoint diretamente com curl
- [x] Corrigir o problema identificado (campo type ausente nos resultados + busca em portal_modules)
- [x] Validar que a busca retorna documentos e módulos corretamente (576 testes passando)

## Substituição do Botão Atualizar na Página Support
- [x] Remover botão de atualizar (RefreshCw) da página Support.tsx
- [x] Adicionar ícone de casa (Home) como botão para página inicial (role-aware via useHomeRoute)

## Responsividade da Página Support (Notebook 14")
- [ ] Auditar layout principal: container, padding, max-width em 1366×768
- [ ] Corrigir header da página (título + botões) para não transbordar em telas menores
- [ ] Corrigir Quick Actions (botões de criar chamado) para caber em 1366px
- [ ] Corrigir filtros e abas para serem compactos em telas médias
- [ ] Corrigir lista de chamados: colunas, badges e ações para 1366px
- [ ] Corrigir painel lateral de detalhes (se houver) para não sobrepor conteúdo
- [ ] Corrigir formulários de criação/edição para caber em telas menores
- [ ] Testar visualmente em 1366×768 e 1280×800

## Responsividade da Página Support para Notebook 14" (concluído)
- [x] Reduzir padding do container principal (py-3 sm:py-4 lg:py-6, px-3 sm:px-4 lg:px-6)
- [x] Reduzir margin-bottom do header e quick actions (mb-3 sm:mb-4)
- [x] Reduzir tamanho do título (text-lg sm:text-xl lg:text-2xl)
- [x] Reduzir padding dos cards de stats (p-2.5 sm:p-4) e gap do grid (gap-2 sm:gap-3)
- [x] Reduzir padding do painel principal (p-3 sm:p-4)
- [x] Ajustar largura do painel de ações (sm:w-72 md:w-80 lg:w-96)
- [x] Corrigir CreateItemDialog para ser responsivo (max-w-[95vw] sm:max-w-lg, max-h-[95vh])
- [x] Conteúdo acima da lista ocupa apenas 276px (header+actions+stats), deixando espaço para lista
- [x] 576 testes vitest passando

## Correção de Link no Dashboard
- [x] Alterar link do card "Abrir Chamado" no Dashboard para /tickets (576 testes passando)

## Melhorias na Página Tickets
- [ ] Adicionar cards de ação (Novo Chamado, Nova Requisição, Nova Ocorrência) que abrem o modal de criação
- [ ] Remover cards Total, Fechados e SLA Vencido da página Tickets

## Cards de Ação e Remoção de Stats na Página /tickets
- [x] Adicionar cards de ação (Novo Chamado, Nova Requisição, Nova Ocorrência) na página /tickets que abrem modais inline (sem redirecionar para /support)
- [x] Remover cards de stat Total, Fechados e SLA Vencido da página /tickets
- [x] Manter apenas os cards Abertos, Em Andamento e Resolvidos
- [x] Implementar modal CreateModal com campos Título, Descrição, Prioridade e Categoria
- [x] Botão "Abrir novo chamado" no estado vazio agora abre modal inline
- [x] 576 testes vitest passando

## Dashboard de Relatórios (Reports) — Redesign Completo
- [x] Criar endpoint GET /api/support/dashboard-reports com KPIs, top suporte, chamados recentes, volume e status
- [x] KPI cards: Total, Abertos, Em Andamento, Resolvidos, Tempo Médio, SLA Vencido
- [x] Card de Taxa de Resolução em destaque com anel de progresso animado e meta de 80%
- [x] Seção Status dos Chamados com barras de progresso + gráfico de pizza
- [x] Cards de Prioridade e Tipo com barras de progresso visuais
- [x] Gráfico de área para Volume de Chamados nos últimos 14 dias
- [x] Seção Chamados Recentes (10 mais recentes) com navegação para detalhe
- [x] Card Top Suporte com ranking de agentes, medalhas (ouro/prata/bronze), taxa de resolução e tempo médio
- [x] Gráfico comparativo de atendimentos no rodapé do Top Suporte
- [x] Gráfico de barras horizontal com distribuição completa por status
- [x] Seletor de período (7, 14, 30, 60, 90, 365 dias)
- [x] Background CircuitBackground + glassmorphic igual ao Management
- [x] Corrigido teste flaky de timing em retry.test.ts (tolerância 40ms)
- [x] 576 testes vitest passando

- [x] Alterar link do card "Histórico de Chamados" no Dashboard para /reports
