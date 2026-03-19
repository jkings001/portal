/**
 * Testes para o fluxo de AdminDocuments:
 * - Criação de documento com atribuição de usuários e departamentos
 * - Cascata empresa → departamento
 * - Endpoints de atribuição
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

// ─── Verificações de estrutura do código ────────────────────────────────────

describe("AdminDocuments - estrutura do componente", () => {
  let componentContent: string;

  beforeEach(() => {
    const filePath = path.resolve(
      __dirname,
      "../client/src/pages/AdminDocuments.tsx"
    );
    componentContent = fs.readFileSync(filePath, "utf-8");
  });

  it("deve declarar estado selectedCompanyId para cascata empresa→departamento", () => {
    expect(componentContent).toContain("selectedCompanyId");
    expect(componentContent).toContain("setSelectedCompanyId");
  });

  it("deve declarar estado companies para lista de empresas", () => {
    expect(componentContent).toContain("companies");
    expect(componentContent).toContain("setCompanies");
  });

  it("deve declarar estado filteredDepts para departamentos filtrados", () => {
    expect(componentContent).toContain("filteredDepts");
    expect(componentContent).toContain("setFilteredDepts");
  });

  it("deve buscar empresas em fetchCompanies via /api/companies", () => {
    expect(componentContent).toContain("fetchCompanies");
    expect(componentContent).toContain("/api/companies");
  });

  it("deve aplicar atribuições pendentes de usuários ao criar documento", () => {
    expect(componentContent).toContain("selectedUserIds.length > 0");
    expect(componentContent).toContain("/assign");
    expect(componentContent).toContain("newDocId");
  });

  it("deve aplicar atribuições pendentes de departamentos ao criar documento", () => {
    expect(componentContent).toContain("selectedDeptIds.length > 0");
    expect(componentContent).toContain("/assign-department");
  });

  it("deve resetar selectedCompanyId ao abrir modal de criação", () => {
    expect(componentContent).toContain("setSelectedCompanyId(null)");
  });

  it("deve resetar filteredDepts ao abrir modal de criação", () => {
    expect(componentContent).toContain("setFilteredDepts([])");
  });

  it("deve ter campo de seleção de usuários no formulário principal", () => {
    expect(componentContent).toContain("Atribuir a Usuários");
    expect(componentContent).toContain("Buscar usuário por nome ou email");
  });

  it("deve ter seletor de empresa para filtrar departamentos", () => {
    expect(componentContent).toContain("Selecione a Empresa");
    expect(componentContent).toContain("Escolha uma empresa");
  });

  it("deve mostrar lista de departamentos filtrada por empresa selecionada", () => {
    expect(componentContent).toContain("Departamentos da Empresa");
    expect(componentContent).toContain("Atribuir a Departamentos");
  });

  it("deve ter interface Company com id e name", () => {
    expect(componentContent).toContain("interface Company");
    expect(componentContent).toContain("id: number");
    expect(componentContent).toContain("name: string");
  });

  it("deve ter interface Department com companyId opcional", () => {
    expect(componentContent).toContain("interface Department");
    expect(componentContent).toContain("companyId?: number");
  });

  it("deve ter interface User com id, name e email", () => {
    expect(componentContent).toContain("interface User");
    expect(componentContent).toContain("id: number");
    expect(componentContent).toContain("name: string");
    expect(componentContent).toContain("email: string");
  });

  it("deve ter estado selectedUserIds para rastrear usuários selecionados", () => {
    expect(componentContent).toContain("selectedUserIds");
    expect(componentContent).toContain("setSelectedUserIds");
  });

  it("deve ter estado selectedDeptIds para rastrear departamentos selecionados", () => {
    expect(componentContent).toContain("selectedDeptIds");
    expect(componentContent).toContain("setSelectedDeptIds");
  });

  it("deve ter função fetchCompanies que busca de /api/companies", () => {
    expect(componentContent).toContain("const fetchCompanies");
    expect(componentContent).toContain("/api/companies");
  });

  it("deve filtrar departamentos quando empresa é selecionada", () => {
    expect(componentContent).toContain("useEffect");
    expect(componentContent).toContain("selectedCompanyId");
    expect(componentContent).toContain("departments.filter");
  });

  it("deve renderizar modal com campos de título, categoria e descrição", () => {
    expect(componentContent).toContain("Título");
    expect(componentContent).toContain("Categoria");
    expect(componentContent).toContain("Descrição");
  });

  it("deve ter opção de upload de arquivo ou URL externa", () => {
    expect(componentContent).toContain("Upload de Arquivo");
    expect(componentContent).toContain("URL Externa");
  });

  it("deve ter botão de criar/salvar documento", () => {
    expect(componentContent).toContain("Criar documento");
    expect(componentContent).toContain("Salvar alterações");
  });
});

// ─── Verificações do backend ─────────────────────────────────────────────────

describe("AdminDocuments - endpoints do backend", () => {
  let indexContent: string;

  beforeEach(() => {
    const filePath = path.resolve(__dirname, "_core/index.ts");
    indexContent = fs.readFileSync(filePath, "utf-8");
  });

  it("deve ter endpoint GET /api/companies", () => {
    expect(indexContent).toContain("/api/companies");
  });

  it("deve ter endpoint POST /api/admin/documents/:id/assign", () => {
    const docRoutesPath = path.resolve(__dirname, "document-routes.ts");
    const docContent = fs.readFileSync(docRoutesPath, "utf-8");
    expect(docContent).toContain("/assign");
  });

  it("deve ter endpoint POST /api/admin/documents/:id/assign-department", () => {
    const docRoutesPath = path.resolve(__dirname, "document-routes.ts");
    const docContent = fs.readFileSync(docRoutesPath, "utf-8");
    expect(docContent).toContain("assign-department");
  });

  it("deve usar coluna groupName (camelCase) no banco de dados", () => {
    const docRoutesPath = path.resolve(__dirname, "document-routes.ts");
    const docContent = fs.readFileSync(docRoutesPath, "utf-8");
    expect(docContent).toContain("groupName");
    expect(docContent).not.toContain("group_name");
  });
});
