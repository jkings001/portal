import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { companiesData } from "@/lib/mockData";
import { ArrowLeft, Plus, Users, Ticket, TrendingUp } from "lucide-react";
import { useState } from "react";
import AuroraBackground from "@/components/AuroraBackground";

export default function Companies() {
  const [, setLocation] = useLocation();
  const [selectedCompany, setSelectedCompany] = useState(companiesData.companies[0]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AuroraBackground />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-md bg-white/5">
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => setLocation("/")}
              >
                <ArrowLeft size={24} />
              </Button>
              <h1 className="text-2xl font-bold text-white">Gestão Multi-Empresa</h1>
            </div>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
              <Plus size={20} className="mr-2" />
              Nova Empresa
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="glass p-6 rounded-xl">
              <p className="text-gray-300 text-sm mb-2">Total de Empresas</p>
              <p className="text-4xl font-bold text-cyan-400">{companiesData.companies.length}</p>
              <p className="text-green-400 text-sm mt-2">Todas ativas</p>
            </div>
            <div className="glass p-6 rounded-xl">
              <p className="text-gray-300 text-sm mb-2">Total de Funcionários</p>
              <p className="text-4xl font-bold text-blue-400">
                {companiesData.companies.reduce((acc, c) => acc + c.employees, 0)}
              </p>
              <p className="text-gray-400 text-sm mt-2">Usuários cadastrados</p>
            </div>
            <div className="glass p-6 rounded-xl">
              <p className="text-gray-300 text-sm mb-2">Total de Tickets</p>
              <p className="text-4xl font-bold text-purple-400">
                {companiesData.companies.reduce((acc, c) => acc + c.tickets, 0)}
              </p>
              <p className="text-green-400 text-sm mt-2">↑ 12% vs mês anterior</p>
            </div>
            <div className="glass p-6 rounded-xl">
              <p className="text-gray-300 text-sm mb-2">Taxa de Resolução</p>
              <p className="text-4xl font-bold text-green-400">98%</p>
              <p className="text-gray-400 text-sm mt-2">Média geral</p>
            </div>
          </div>

          {/* Companies Grid */}
          <h2 className="text-2xl font-bold text-white mb-6">Empresas Cadastradas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {companiesData.companies.map((company) => (
              <div
                key={company.id}
                className={`glass p-6 rounded-xl cursor-pointer transition-all duration-300 ${
                  selectedCompany.id === company.id
                    ? "ring-2 ring-cyan-400 bg-white/20"
                    : "hover:bg-white/20"
                }`}
                onClick={() => setSelectedCompany(company)}
              >
                <div className="flex items-center justify-between mb-4">
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="w-12 h-12 rounded-lg"
                  />
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                    {company.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-4">{company.name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-gray-300">
                    <span className="flex items-center gap-2">
                      <Users size={16} className="text-cyan-400" />
                      Funcionários
                    </span>
                    <span className="text-white font-semibold">{company.employees}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-300">
                    <span className="flex items-center gap-2">
                      <Ticket size={16} className="text-cyan-400" />
                      Tickets
                    </span>
                    <span className="text-white font-semibold">{company.tickets}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Company Details */}
          <h2 className="text-2xl font-bold text-white mb-6">Detalhes da Empresa</h2>
          <div className="glass p-8 rounded-xl mb-12">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-6">
                <img
                  src={selectedCompany.logo}
                  alt={selectedCompany.name}
                  className="w-24 h-24 rounded-lg"
                />
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedCompany.name}</h2>
                  <p className="text-gray-400">ID: {selectedCompany.id}</p>
                  <span className="inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold bg-green-500/20 text-green-400">
                    {selectedCompany.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
                  Editar
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Configurações
                </Button>
              </div>
            </div>

            {/* Company Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-8 border-t border-white/10">
              <div>
                <p className="text-gray-400 text-sm mb-2">Funcionários</p>
                <p className="text-3xl font-bold text-cyan-400">{selectedCompany.employees}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Total de Tickets</p>
                <p className="text-3xl font-bold text-blue-400">{selectedCompany.tickets}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Taxa de Resolução</p>
                <p className="text-3xl font-bold text-green-400">98%</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Tempo Médio</p>
                <p className="text-3xl font-bold text-purple-400">3.5h</p>
              </div>
            </div>
          </div>

          {/* Department Breakdown */}
          <h2 className="text-2xl font-bold text-white mb-6">Departamentos</h2>
          <div className="glass p-6 rounded-xl mb-12">
            <div className="space-y-4">
              {[
                { name: "TI", employees: 45, tickets: 156 },
                { name: "RH", employees: 23, tickets: 45 },
                { name: "Financeiro", employees: 12, tickets: 23 },
                { name: "Vendas", employees: 67, tickets: 89 },
              ].map((dept) => (
                <div key={dept.name} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition">
                  <div className="flex-1">
                    <p className="text-white font-semibold">{dept.name}</p>
                    <p className="text-gray-400 text-sm">{dept.employees} funcionários</p>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">Tickets</p>
                      <p className="text-cyan-400 font-bold text-lg">{dept.tickets}</p>
                    </div>
                    <Button size="sm" className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400">
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Users Management */}
          <h2 className="text-2xl font-bold text-white mb-6">Gestão de Usuários</h2>
          <div className="glass p-6 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-gray-300 text-sm mb-1">Total de Usuários</p>
                <p className="text-3xl font-bold text-cyan-400">{selectedCompany.employees}</p>
              </div>
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
                <Plus size={20} className="mr-2" />
                Adicionar Usuário
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Nome</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Departamento</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Função</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "João Silva", email: "joao@empresa.com", dept: "TI", role: "Desenvolvedor", status: "Ativo" },
                    { name: "Maria Santos", email: "maria@empresa.com", dept: "RH", role: "Gerente", status: "Ativo" },
                    { name: "Pedro Costa", email: "pedro@empresa.com", dept: "Financeiro", role: "Analista", status: "Ativo" },
                  ].map((user) => (
                    <tr key={user.email} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="py-3 px-4 text-white font-semibold">{user.name}</td>
                      <td className="py-3 px-4 text-gray-300">{user.email}</td>
                      <td className="py-3 px-4 text-gray-300">{user.dept}</td>
                      <td className="py-3 px-4 text-gray-300">{user.role}</td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Button size="sm" className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs">
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 backdrop-blur-md bg-white/5 mt-20">
          <div className="container mx-auto px-4 py-12 text-center text-gray-400 text-sm">
            <p>© 2026 JKINGS. Todos os direitos reservados. Portal de Demonstração - Dados Fictícios</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
