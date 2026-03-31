import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { reportsData } from "@/lib/mockData";
import { ArrowLeft, Download, Filter } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import AuroraBackground from "@/components/AuroraBackground";

export default function Reports() {
  const [, setLocation] = useLocation();

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
              <h1 className="text-2xl font-bold text-white">Relatórios Avançados</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Filter size={20} className="mr-2" />
                Filtros
              </Button>
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
                <Download size={20} className="mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="glass p-6 rounded-xl">
              <p className="text-gray-300 text-sm mb-2">Total de Chamados</p>
              <p className="text-4xl font-bold text-cyan-400">
                {reportsData.monthlyTickets.reduce((acc, m) => acc + m.tickets, 0)}
              </p>
              <p className="text-green-400 text-sm mt-2">↑ 12% vs mês anterior</p>
            </div>
            <div className="glass p-6 rounded-xl">
              <p className="text-gray-300 text-sm mb-2">Resolvidos</p>
              <p className="text-4xl font-bold text-green-400">
                {reportsData.monthlyTickets.reduce((acc, m) => acc + m.resolved, 0)}
              </p>
              <p className="text-green-400 text-sm mt-2">Taxa: 98%</p>
            </div>
            <div className="glass p-6 rounded-xl">
              <p className="text-gray-300 text-sm mb-2">Tempo Médio</p>
              <p className="text-4xl font-bold text-blue-400">3.5h</p>
              <p className="text-green-400 text-sm mt-2">↓ 15% vs mês anterior</p>
            </div>
            <div className="glass p-6 rounded-xl">
              <p className="text-gray-300 text-sm mb-2">Satisfação</p>
              <p className="text-4xl font-bold text-purple-400">4.8/5</p>
              <p className="text-green-400 text-sm mt-2">↑ 0.2 vs mês anterior</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {/* Monthly Tickets */}
            <div className="glass p-6 rounded-xl">
              <h2 className="text-xl font-bold text-white mb-6">Chamados por Mês</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportsData.monthlyTickets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="tickets" stroke="#00d4ff" strokeWidth={2} name="Total" />
                  <Line type="monotone" dataKey="resolved" stroke="#00cc66" strokeWidth={2} name="Resolvidos" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Department Stats */}
            <div className="glass p-6 rounded-xl">
              <h2 className="text-xl font-bold text-white mb-6">Chamados por Departamento</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportsData.departmentStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="department" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip />
                  <Bar dataKey="tickets" fill="#00d4ff" name="Tickets" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Details Table */}
          <div className="glass p-6 rounded-xl mb-12">
            <h2 className="text-xl font-bold text-white mb-6">Detalhes por Departamento</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Departamento</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Total de Chamados</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Tempo Médio</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Taxa de Resolução</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Satisfação</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsData.departmentStats.map((dept) => (
                    <tr key={dept.department} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="py-3 px-4 text-white font-semibold">{dept.department}</td>
                      <td className="py-3 px-4 text-cyan-400">{dept.tickets}</td>
                      <td className="py-3 px-4 text-white">{dept.avgTime}</td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                          98%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white">4.7/5</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="glass p-6 rounded-xl mb-12">
            <h2 className="text-xl font-bold text-white mb-6">Distribuição de Prioridades</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { priority: "Crítica", count: 45, color: "bg-red-500/20 text-red-400" },
                { priority: "Alta", count: 156, color: "bg-orange-500/20 text-orange-400" },
                { priority: "Média", count: 312, color: "bg-yellow-500/20 text-yellow-400" },
                { priority: "Baixa", count: 487, color: "bg-green-500/20 text-green-400" },
              ].map((item) => (
                <div key={item.priority} className={`p-4 rounded-lg ${item.color}`}>
                  <p className="text-sm font-semibold mb-2">{item.priority}</p>
                  <p className="text-2xl font-bold">{item.count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-bold text-white mb-6">Métricas de Desempenho</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Taxa de Resolução</span>
                    <span className="text-cyan-400 font-semibold">98%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full" style={{ width: "98%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Satisfação do Cliente</span>
                    <span className="text-cyan-400 font-semibold">96%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full" style={{ width: "96%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Disponibilidade do Sistema</span>
                    <span className="text-cyan-400 font-semibold">99.9%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full" style={{ width: "99.9%" }} />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="text-gray-300 text-sm mb-2">Tempo Médio de Resposta</p>
                  <p className="text-2xl font-bold text-cyan-400">45 minutos</p>
                  <p className="text-green-400 text-xs mt-2">↓ 20% vs mês anterior</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="text-gray-300 text-sm mb-2">Tempo Médio de Resolução</p>
                  <p className="text-2xl font-bold text-cyan-400">3.5 horas</p>
                  <p className="text-green-400 text-xs mt-2">↓ 15% vs mês anterior</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="text-gray-300 text-sm mb-2">Chamados por Agente</p>
                  <p className="text-2xl font-bold text-cyan-400">18.5</p>
                  <p className="text-green-400 text-xs mt-2">↑ 5% vs mês anterior</p>
                </div>
              </div>
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
