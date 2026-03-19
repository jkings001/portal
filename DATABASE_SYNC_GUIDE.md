# Guia de Sincronização com Banco de Dados

## Resumo da Implementação

Este documento descreve a implementação completa de sincronização entre o frontend (AdminServer) e o banco de dados MySQL via tRPC.

## Arquitetura de Sincronização

### Backend (Node.js + tRPC)

#### 1. Procedures tRPC para Usuários (`server/routers.ts`)

Foram implementados os seguintes procedures para gerenciamento de usuários:

```typescript
users: router({
  list: protectedProcedure.query() // Listar todos os usuários
  getById: protectedProcedure.query() // Obter usuário por ID
  create: protectedProcedure.mutation() // Criar novo usuário
  update: protectedProcedure.mutation() // Atualizar usuário
  delete: protectedProcedure.mutation() // Deletar usuário
})
```

**Validação de Permissões:**
- Apenas usuários com role `admin` podem acessar estes procedures
- Cada operação valida o contexto de autenticação

#### 2. Funções de Banco de Dados (`server/db.ts`)

Adicionadas as seguintes funções para interagir com o banco de dados:

```typescript
// Criar/atualizar usuário
export async function upsertUser(user: InsertUser): Promise<void>

// Atualizar usuário por ID
export async function updateUser(id: number, data: Partial<InsertUser>)

// Deletar usuário por ID
export async function deleteUser(id: number)

// Obter usuário por email
export async function getUserByEmail(email: string)

// Listar todos os usuários
export async function getAllUsers()

// Obter usuário por ID
export async function getUserById(id: number)
```

### Frontend (React + tRPC)

#### 1. Integração no AdminServer (`client/src/pages/AdminServer.tsx`)

O AdminServer foi completamente refatorado para usar tRPC:

```typescript
// Queries
const usersQuery = trpc.users.list.useQuery()

// Mutations
const createUserMutation = trpc.users.create.useMutation()
const updateUserMutation = trpc.users.update.useMutation()
const deleteUserMutation = trpc.users.delete.useMutation()
```

**Funcionalidades Implementadas:**

- **Listagem de Usuários**: Carrega dados do banco em tempo real
- **Criação de Usuários**: Modal com validação de email e nome
- **Edição de Usuários**: Atualiza dados no banco de dados
- **Exclusão de Usuários**: Remove usuários com confirmação
- **Busca e Filtros**: Busca por email/nome e filtro por role
- **Loading States**: Indicadores visuais durante operações
- **Error Handling**: Mensagens de erro claras

#### 2. Conversão de Dados

Os dados do banco de dados são convertidos para o formato esperado pelo frontend:

```typescript
const users: User[] = (usersQuery.data || []).map((dbUser: any) => ({
  id: dbUser.id,
  email: dbUser.email || '',
  name: dbUser.name || '',
  role: (dbUser.role || 'user') as 'user' | 'admin' | 'manager',
  department: dbUser.department,
  createdAt: dbUser.createdAt ? new Date(dbUser.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  isActive: true,
}));
```

## Fluxo de Sincronização

### Criar Usuário

1. Usuário preenche formulário no modal
2. Clica em "Criar"
3. Frontend valida dados (email, nome obrigatórios)
4. Envia mutation `users.create` para o backend
5. Backend valida permissões (admin only)
6. Cria openId temporário: `local-{email}-{timestamp}`
7. Insere usuário no banco via `upsertUser()`
8. Frontend refetch da lista de usuários
9. Exibe mensagem de sucesso

### Atualizar Usuário

1. Usuário clica em "Editar" na tabela
2. Modal abre com dados preenchidos
3. Usuário modifica dados
4. Clica em "Atualizar"
5. Frontend valida dados
6. Envia mutation `users.update` para o backend
7. Backend valida permissões e dados
8. Atualiza usuário no banco via `updateUser()`
9. Frontend refetch da lista
10. Exibe mensagem de sucesso

### Deletar Usuário

1. Usuário clica em ícone de lixeira
2. Confirmação via dialog
3. Frontend envia mutation `users.delete`
4. Backend valida permissões
5. Deleta usuário do banco via `deleteUser()`
6. Frontend refetch da lista
7. Exibe mensagem de sucesso

## Testes Vitest

Foram criados 18 testes para validar a sincronização:

### Testes de Criação
- ✓ Criar usuário com dados válidos
- ✓ Criar usuário com role admin
- ✓ Validar formato de email

### Testes de Atualização
- ✓ Atualizar role do usuário
- ✓ Atualizar departamento
- ✓ Atualizar múltiplos campos

### Testes de Exclusão
- ✓ Marcar usuário para exclusão

### Testes de Recuperação
- ✓ Recuperar usuário por email
- ✓ Recuperar todos os usuários
- ✓ Filtrar usuários por role

### Testes de Validação
- ✓ Validar enum de roles
- ✓ Validar campos obrigatórios
- ✓ Lidar com campos opcionais

### Testes de Operações em Lote
- ✓ Criar múltiplos usuários
- ✓ Atualizar múltiplos usuários

### Testes de Tratamento de Erros
- ✓ Lidar com emails duplicados
- ✓ Lidar com roles inválidas
- ✓ Validar formato de email

**Status dos Testes:**
```
✓ server/users-sync.test.ts (18 tests)
✓ server/departments.test.ts (20 tests)
✓ server/auth.logout.test.ts (1 test)
Total: 39 tests passed
```

## Configuração do Banco de Dados

### Schema Utilizado

A tabela `users` possui os seguintes campos:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320) UNIQUE,
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin', 'manager') DEFAULT 'user' NOT NULL,
  department VARCHAR(100),
  avatar VARCHAR(2),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Variáveis de Ambiente

```env
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-secret-key
```

## Como Usar

### 1. Acessar AdminServer

- Faça login no portal
- Clique em "AdminServer" (se tiver permissão de admin)
- Acesse a aba "Usuários"

### 2. Criar Novo Usuário

1. Clique em "Novo Usuário"
2. Preencha:
   - Nome: Nome completo
   - Email: Email válido
   - Papel: user, manager ou admin
   - Departamento: (opcional)
3. Clique em "Criar"

### 3. Editar Usuário

1. Clique no ícone de edição (lápis)
2. Modifique os dados
3. Clique em "Atualizar"

### 4. Deletar Usuário

1. Clique no ícone de lixeira
2. Confirme a exclusão

## Tratamento de Erros

O sistema trata os seguintes erros:

- **Email inválido**: Validação Zod no frontend e backend
- **Email duplicado**: Erro do banco de dados tratado
- **Usuário não encontrado**: Erro ao atualizar/deletar
- **Permissão negada**: Apenas admins podem gerenciar usuários
- **Conexão com banco**: Fallback para dados mockados se necessário

## Performance

- **Lazy loading**: Banco de dados conectado sob demanda
- **Caching**: React Query cache automático
- **Refetch**: Atualização automática após mutações
- **Paginação**: Suportada via queries (não implementada ainda)

## Próximos Passos

1. **Implementar Paginação**: Adicionar suporte a paginação na listagem
2. **Adicionar Filtros Avançados**: Filtros por data de criação, status, etc.
3. **Exportar Dados**: Exportar lista de usuários em CSV/Excel
4. **Auditoria**: Registrar todas as operações em log
5. **Bulk Operations**: Operações em lote (criar, atualizar, deletar múltiplos)
6. **Permissões Granulares**: Expandir RBAC com permissões específicas

## Troubleshooting

### Erro: "Not authorized"
- Verifique se seu usuário tem role `admin`
- Faça logout e login novamente

### Erro: "Database not available"
- Verifique se DATABASE_URL está configurada
- Verifique conexão com o banco de dados

### Usuários não aparecem na lista
- Verifique se há usuários no banco de dados
- Tente fazer refresh da página
- Verifique logs do servidor

## Referências

- [tRPC Documentation](https://trpc.io/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zod Validation](https://zod.dev/)
