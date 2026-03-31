import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { dashboardData } from "@/lib/mockData";
import { ArrowLeft, TrendingUp, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import AuroraBackground from "@/components/AuroraBackground";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const priorityColors = {
    "Crítica": "#ff4444",
    "Alta": "#ff9900",
    "Média": "#ffcc00",
    "Baixa": "#00cc66",
  };

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
              <h1 className="text-2xl font-bold text-white">Portal de Atendimento - Dashboard</h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="glass p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-300 text-sm font-semibold">Chamados Abertos</h3>
                <AlertCircle className="text-red-400" size={24} />
              </div>
              <p className="text-4xl font-bold text-white">{dashboardData.openTickets}</p>
              <p className="text-cyan-400 text-sm mt-2">+2 desde ontem</p>
            </div>

            <div className="glass p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-300 text-sm font-semibold">Em Andamento</h3>
                <Clock className="text-yellow-400" size={24} />
              </div>
              <p className="text-4xl font-bold text-white">{dashboardData.inProgressTickets}</p>
              <p className="text-cyan-400 text-sm mt-2">Tempo médio: {dashboardData.averageResolutionTime}</p>
            </div>

            <div className="glass p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-300 text-sm font-semibold">Resolvidos</h3>
                <CheckCircle className="text-green-400" size={24} />
              </div>
              <p className="text-4xl font-bold text-white">{dashboardData.resolvedTickets}</p>
              <p className="text-cyan-400 text-sm mt-2">Taxa: {dashboardData.satisfactionRate}</p>
            </div>

            <div className="glass p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-300 text-sm font-semibold">Aguardando</h3>
                <TrendingUp className="text-blue-400" size={24} />
              </div>
              <p className="text-4xl font-bold text-white">{dashboardData.pendingTickets}</p>
              <p className="text-cyan-400 text-sm mt-2">Resposta do cliente</p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {/* Priority Distribution */}
            <div className="glass p-6 rounded-xl">
              <h2 className="text-xl font-bold text-white mb-6">Chamados por Prioridade</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.ticketsByPriority}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.ticketsByPriority.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category Distribution */}
            <div className="glass p-6 rounded-xl">
              <h2 className="text-xl font-bold text-white mb-6">Chamados por Categoria</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.ticketsByCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#00d4ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Tickets */}
          <div className="glass p-6 rounded-xl">
            <h2 className="text-xl font-bold text-white mb-6">Chamados Recentes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">ID</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Título</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Prioridade</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-semibold">Usuário</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentTickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="py-3 px-4 text-cyan-400 font-semibold">{ticket.id}</td>
                      <td className="py-3 px-4 text-white">{ticket.title}</td>
                      <td className="py-3 px-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: priorityColors[ticket.priority as keyof typeof priorityColors] + "30" }}
                        >
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400">
                          {ticket.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{ticket.user}</td>
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
