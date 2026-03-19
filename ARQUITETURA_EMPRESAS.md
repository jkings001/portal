# Arquitetura da Página "Empresas"

## 1. Visão Geral

A página "Empresas" permite gerenciar organizações, vincular usuários a empresas, e classificar usuários por departamento e cargo para organizar fluxos de aprovação de requisições.

---

## 2. Modelos de Dados

### 2.1 Tabela `companies`

Armazena informações das empresas cadastradas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `name` | VARCHAR(255) | Nome da empresa |
| `cnpj` | VARCHAR(18) | CNPJ (único) |
| `email` | VARCHAR(255) | Email corporativo |
| `phone` | VARCHAR(20) | Telefone |
| `address` | TEXT | Endereço completo |
| `city` | VARCHAR(100) | Cidade |
| `state` | VARCHAR(2) | Estado (UF) |
| `zipCode` | VARCHAR(10) | CEP |
| `status` | ENUM('ativa', 'inativa', 'suspensa') | Status da empresa |
| `createdAt` | TIMESTAMP | Data de criação |
| `updatedAt` | TIMESTAMP | Data de atualização |

### 2.2 Tabela `departments`

Armazena departamentos dentro de cada empresa.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `companyId` | UUID | FK para `companies` |
| `name` | VARCHAR(255) | Nome do departamento |
| `description` | TEXT | Descrição |
| `manager` | VARCHAR(255) | Gerente responsável |
| `createdAt` | TIMESTAMP | Data de criação |

### 2.3 Tabela `positions`

Armazena cargos/posições dentro de cada departamento.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `departmentId` | UUID | FK para `departments` |
| `name` | VARCHAR(255) | Nome do cargo |
| `level` | ENUM('junior', 'pleno', 'senior', 'gerente', 'diretor') | Nível hierárquico |
| `description` | TEXT | Descrição do cargo |
| `createdAt` | TIMESTAMP | Data de criação |

### 2.4 Tabela `userCompanyAssignment`

Vincula usuários a empresas, departamentos e cargos (relação muitos-para-muitos).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `userId` | UUID | FK para `users` |
| `companyId` | UUID | FK para `companies` |
| `departmentId` | UUID | FK para `departments` |
| `positionId` | UUID | FK para `positions` |
| `role` | ENUM('colaborador', 'supervisor', 'gerente', 'admin') | Papel na empresa |
| `approvalLevel` | INT | Nível de aprovação para requisições (1-5) |
| `isActive` | BOOLEAN | Vínculo ativo |
| `startDate` | DATE | Data de início |
| `endDate` | DATE | Data de término (opcional) |
| `createdAt` | TIMESTAMP | Data de criação |

---

## 3. Relações entre Tabelas

```
companies (1) ──→ (N) departments
companies (1) ──→ (N) userCompanyAssignment
departments (1) ──→ (N) positions
positions (1) ──→ (N) userCompanyAssignment
users (1) ──→ (N) userCompanyAssignment
```

---

## 4. Componentes Front-End

### 4.1 Página Principal: `Companies.tsx`

- **Header:** Logo JKINGS, título "Gestão de Empresas", botão "Nova Empresa"
- **Abas:** Empresas, Departamentos, Cargos, Usuários por Empresa
- **Filtros:** Busca por nome, status, cidade
- **Tabelas:** Listagem com ações (editar, deletar, visualizar usuários)

### 4.2 Componentes Auxiliares

#### `CompanyForm.tsx`
- Formulário para cadastrar/editar empresa
- Campos: Nome, CNPJ, Email, Telefone, Endereço, Cidade, Estado, CEP, Status
- Validações: CNPJ único, campos obrigatórios

#### `DepartmentForm.tsx`
- Formulário para cadastrar/editar departamento
- Campos: Nome, Descrição, Gerente, Empresa
- Seletor de empresa com dropdown

#### `PositionForm.tsx`
- Formulário para cadastrar/editar cargo
- Campos: Nome, Nível, Descrição, Departamento
- Enum de níveis: junior, pleno, senior, gerente, diretor

#### `UserCompanyAssignmentModal.tsx`
- Modal para vincular usuários a empresas
- Seletor de usuário, empresa, departamento, cargo, papel
- Campo de nível de aprovação (1-5)
- Data de início e término

#### `CompanyUsersTable.tsx`
- Tabela mostrando usuários vinculados a uma empresa
- Colunas: Nome, Departamento, Cargo, Papel, Nível de Aprovação, Status
- Ações: Editar, Remover vínculo

---

## 5. Procedures tRPC (Back-End)

### 5.1 Procedures de Empresas

```typescript
// Listar empresas com filtros
companies.list(filters: { search?, status?, city? })
  → { id, name, cnpj, email, userCount, status, createdAt }[]

// Criar empresa
companies.create(data: { name, cnpj, email, phone, address, city, state, zipCode })
  → { id, name, cnpj, ... }

// Atualizar empresa
companies.update(id: string, data: Partial<Company>)
  → { id, name, ... }

// Deletar empresa
companies.delete(id: string)
  → { success: boolean }

// Obter empresa com usuários
companies.getWithUsers(id: string)
  → { id, name, cnpj, users: UserCompanyAssignment[] }
```

### 5.2 Procedures de Departamentos

```typescript
// Listar departamentos por empresa
departments.listByCompany(companyId: string)
  → { id, name, description, manager, positionCount }[]

// Criar departamento
departments.create(data: { companyId, name, description, manager })
  → { id, name, ... }

// Atualizar departamento
departments.update(id: string, data: Partial<Department>)
  → { id, name, ... }

// Deletar departamento
departments.delete(id: string)
  → { success: boolean }
```

### 5.3 Procedures de Cargos

```typescript
// Listar cargos por departamento
positions.listByDepartment(departmentId: string)
  → { id, name, level, description }[]

// Criar cargo
positions.create(data: { departmentId, name, level, description })
  → { id, name, ... }

// Atualizar cargo
positions.update(id: string, data: Partial<Position>)
  → { id, name, ... }

// Deletar cargo
positions.delete(id: string)
  → { success: boolean }
```

### 5.4 Procedures de Vinculação de Usuários

```typescript
// Listar usuários de uma empresa
userAssignments.listByCompany(companyId: string)
  → { id, userId, user: { name, email }, departmentId, department: { name }, 
      positionId, position: { name, level }, role, approvalLevel, isActive }[]

// Vincular usuário a empresa
userAssignments.create(data: { userId, companyId, departmentId, positionId, 
                                role, approvalLevel, startDate })
  → { id, userId, companyId, ... }

// Atualizar vínculo
userAssignments.update(id: string, data: Partial<UserCompanyAssignment>)
  → { id, userId, ... }

// Remover vínculo
userAssignments.delete(id: string)
  → { success: boolean }

// Listar empresas de um usuário
userAssignments.listByUser(userId: string)
  → { id, companyId, company: { name, cnpj }, departmentId, positionId, role }[]
```

---

## 6. Fluxo de Dados

### 6.1 Cadastro de Empresa

1. Admin acessa página "Empresas"
2. Clica em "Nova Empresa"
3. Preenche formulário (nome, CNPJ, contato, endereço)
4. Valida CNPJ único
5. Envia mutation `companies.create`
6. Back-end insere em `companies`
7. Front-end atualiza lista e exibe toast de sucesso

### 6.2 Vinculação de Usuário a Empresa

1. Admin seleciona empresa
2. Clica em "Adicionar Usuário"
3. Abre modal de seleção
4. Seleciona: Usuário → Departamento → Cargo → Papel → Nível de Aprovação
5. Define data de início/término
6. Envia mutation `userAssignments.create`
7. Back-end insere em `userCompanyAssignment`
8. Front-end atualiza tabela de usuários

### 6.3 Aprovação de Requisições (Futuro)

1. Usuário cria requisição
2. Sistema identifica empresa, departamento, cargo do usuário
3. Busca usuários com `approvalLevel >= requisição.approvalLevel`
4. Roteia para aprovadores em cadeia

---

## 7. Validações

### Back-End (tRPC Procedures)

- **CNPJ:** Formato válido, único no banco
- **Email:** Formato válido
- **Usuário:** Deve existir em `users`
- **Empresa:** Deve existir em `companies`
- **Departamento:** Deve pertencer à empresa selecionada
- **Cargo:** Deve pertencer ao departamento selecionado
- **Nível de Aprovação:** Entre 1 e 5
- **Datas:** `startDate` ≤ `endDate` (se definida)

### Front-End (React)

- Campos obrigatórios marcados
- Validação em tempo real (CNPJ, email)
- Feedback visual de erros
- Confirmação antes de deletar

---

## 8. Permissões (RBAC)

| Ação | Admin | Gerente | Colaborador |
|------|-------|---------|-------------|
| Criar empresa | ✅ | ❌ | ❌ |
| Editar empresa | ✅ | ❌ | ❌ |
| Deletar empresa | ✅ | ❌ | ❌ |
| Gerenciar departamentos | ✅ | ✅ | ❌ |
| Gerenciar cargos | ✅ | ✅ | ❌ |
| Vincular usuários | ✅ | ✅ | ❌ |
| Visualizar empresa | ✅ | ✅ | ✅ |

---

## 9. Próximos Passos

1. Implementar schema no banco de dados
2. Criar procedures tRPC
3. Desenvolver componentes React
4. Integrar com fluxo de aprovação de requisições
5. Adicionar relatórios de usuários por empresa/departamento

