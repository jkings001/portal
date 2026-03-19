import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Filter, Calendar, TrendingUp, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

/**
 * Reports - Página de Relatórios Administrativos
 * 
 * Design: Glassmorphism similar ao AdminDashboard
 * Paleta: Azul Marinho (#0F172A) + Cinza Ardósia (#475569) + Branco (#FFFFFF)
 * 
 * Abas:
 * - Chamados: Gráficos de status, prioridade e tendências
 * - Treinamentos: Gráficos de conclusão, inscrições e progresso
 * - Requisições: Gráficos de tipos, status e distribuição
 */

type ReportTab = 'tickets' | 'trainings' | 'requests';

const Reports: React.FC = () => {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<ReportTab>('tickets');
  const [dateRange, setDateRange] = useState('30days');

  // Dados para Relatório de Chamados
  const ticketStatusData = [
    { name: 'Aberto', value: 24, fill: '#ef4444' },
    { name: 'Em Andamento', value: 18, fill: '#3b82f6' },
    { name: 'Resolvido', value: 42, fill: '#10b981' },
  ];

  const ticketPriorityData = [
    { name: 'Baixa', value: 15, fill: '#10b981' },
    { name: 'Média', value: 28, fill: '#f59e0b' },
    { name: 'Alta', value: 41, fill: '#ef4444' },
  ];

  const ticketTrendData = [
    { date: '01/02', total: 12, resolvidos: 8 },
    { date: '02/02', total: 15, resolvidos: 10 },
    { date: '03/02', total: 18, resolvidos: 12 },
    { date: '04/02', total: 22, resolvidos: 14 },
    { date: '05/02', total: 25, resolvidos: 16 },
    { date: '06/02', total: 28, resolvidos: 18 },
    { date: '07/02', total: 32, resolvidos: 20 },
    { date: '08/02', total: 35, resolvidos: 22 },
    { date: '09/02', total: 38, resolvidos: 24 },
    { date: '10/02', total: 40, resolvidos: 26 },
    { date: '11/02', total: 42, resolvidos: 28 },
    { date: '12/02', total: 45, resolvidos: 30 },
  ];

  const ticketMetrics = [
    { label: 'Total de Chamados', value: '84', change: '+12%' },
    { label: 'Tempo Médio Resolução', value: '2.4h', change: '-8%' },
    { label: 'Taxa de Satisfação', value: '94%', change: '+3%' },
    { label: 'Chamados Vencidos', value: '3', change: '-50%' },
  ];

  // Dados para Relatório de Treinamentos
  const trainingCompletionData = [
    { name: 'Concluído', value: 156, fill: '#10b981' },
    { name: 'Em Progresso', value: 89, fill: '#3b82f6' },
    { name: 'Não Iniciado', value: 45, fill: '#9ca3af' },
  ];

  const trainingEnrollmentData = [
    { date: '01/02', inscritos: 45, concluidos: 12 },
    { date: '02/02', inscritos: 52, concluidos: 18 },
    { date: '03/02', inscritos: 58, concluidos: 25 },
    { date: '04/02', inscritos: 65, concluidos: 32 },
    { date: '05/02', inscritos: 72, concluidos: 41 },
    { date: '06/02', inscritos: 78, concluidos: 48 },
    { date: '07/02', inscritos: 85, concluidos: 56 },
    { date: '08/02', inscritos: 92, concluidos: 65 },
    { date: '09/02', inscritos: 98, concluidos: 73 },
    { date: '10/02', inscritos: 105, concluidos: 82 },
    { date: '11/02', inscritos: 112, concluidos: 91 },
    { date: '12/02', inscritos: 120, concluidos: 100 },
  ];

  const trainingByCategory = [
    { name: 'Segurança', value: 45, fill: '#ef4444' },
    { name: 'Compliance', value: 38, fill: '#3b82f6' },
    { name: 'Técnico', value: 52, fill: '#10b981' },
    { name: 'Soft Skills', value: 21, fill: '#f59e0b' },
  ];

  const trainingMetrics = [
    { label: 'Total de Inscritos', value: '290', change: '+18%' },
    { label: 'Taxa de Conclusão', value: '53.8%', change: '+5%' },
    { label: 'Tempo Médio', value: '4.2h', change: '-2%' },
    { label: 'Cursos Ativos', value: '12', change: '+2' },
  ];

  // Dados para Relatório de Requisições
  const requestTypeData = [
    { name: 'Acesso', value: 34, fill: '#3b82f6' },
    { name: 'Hardware', value: 28, fill: '#10b981' },
    { name: 'Software', value: 22, fill: '#f59e0b' },
    { name: 'Rede', value: 16, fill: '#ef4444' },
  ];

  const requestStatusData = [
    { date: '01/02', pendentes: 8, aprovadas: 12, rejeitadas: 2 },
    { date: '02/02', pendentes: 10, aprovadas: 14, rejeitadas: 3 },
    { date: '03/02', pendentes: 9, aprovadas: 16, rejeitadas: 2 },
    { date: '04/02', pendentes: 12, aprovadas: 18, rejeitadas: 4 },
    { date: '05/02', pendentes: 11, aprovadas: 20, rejeitadas: 3 },
    { date: '06/02', pendentes: 13, aprovadas: 22, rejeitadas: 5 },
    { date: '07/02', pendentes: 14, aprovadas: 24, rejeitadas: 4 },
    { date: '08/02', pendentes: 12, aprovadas: 26, rejeitadas: 3 },
    { date: '09/02', pendentes: 15, aprovadas: 28, rejeitadas: 6 },
    { date: '10/02', pendentes: 16, aprovadas: 30, rejeitadas: 5 },
    { date: '11/02', pendentes: 14, aprovadas: 32, rejeitadas: 4 },
    { date: '12/02', pendentes: 17, aprovadas: 34, rejeitadas: 7 },
  ];

  const requestMetrics = [
    { label: 'Total de Requisições', value: '178', change: '+22%' },
    { label: 'Taxa de Aprovação', value: '82%', change: '+4%' },
    { label: 'Tempo Médio', value: '1.8 dias', change: '-6%' },
    { label: 'Pendentes', value: '17', change: '+3' },
  ];

  const handleExportReport = () => {
    console.log('Exportando relatório:', activeTab);
    // Implementar lógica de exportação
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      style={{
        backgroundImage: "url('https://private-us-east-1.manuscdn.com/sessionFile/2CKTBX4DHqsYpFG9sDRB7L/sandbox/HvVqCE7k0Noj0nuQ0XGqJh-img-2_1770239208000_na1fn_YmctZGFzaGJvYXJkLWFkbWlu.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkNLVEJYNERIcXNZcEZHOXNEUkI3TC9zYW5kYm94L0h2VnFDRTdrME5vajBudVEwWEdxSmgtaW1nLTJfMTc3MDIzOTIwODAwMF9uYTFmbl9ZbWN0WkdGemFHSnZZWEprTFdGa2JXbHUuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=NS-In4kf-gU2f8MNkw040n4ixh32Z2cc-0HYXOh81AIwpgryUgApEP8JncHcE39YUjfiXPZl6AIxXAOWaNTE0m0fxigaHbA4VxKK0AaGYhlWgqoy-bCaY0PmF7eQmIkp3VzX-t1UWtf3f4bCbow9IJLuATvgXfVUT7IoNP7ulSJ~CqEQ57brJiqyCMhnMGZFG6szGMbWx8lEVatOkCqTUK8Tn5yh9pDhnMO8CAgP-FE3WgXt9w9Oezf09gHG2Mt9srbGBgNbp0TUH71yQzZnzt~fdn72AF4h4llI396h0oUrFfTp1ftDrhFsCivVJy6O5-X5jIvQMlxqDbDNLBcIFw__')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(6,182,212,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(6,182,212,0.1),transparent_50%)]"></div>
      </div>

      <div className="relative z-10 flex flex-col h-screen">
        {/* Header com Botão de Voltar */}
        <header className="bg-gradient-to-b from-slate-900/95 to-slate-900/80 backdrop-blur-xl border-b border-white/10 px-6 py-4">
          <button
            onClick={() => setLocation('/management')}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Relatórios</h1>
              <p className="text-xs text-slate-400">Análise e métricas do portal</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition-all"
              >
                <option value="7days">Últimos 7 dias</option>
                <option value="30days">Últimos 30 dias</option>
                <option value="90days">Últimos 90 dias</option>
                <option value="1year">Último ano</option>
              </select>
              <button
                onClick={handleExportReport}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all"
              >
                <Download size={18} />
                Exportar
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-gradient-to-b from-slate-900/80 to-slate-900/60 backdrop-blur-xl border-b border-white/10 px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`py-4 px-2 font-medium transition-all border-b-2 ${
                activeTab === 'tickets'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Chamados
            </button>
            <button
              onClick={() => setActiveTab('trainings')}
              className={`py-4 px-2 font-medium transition-all border-b-2 ${
                activeTab === 'trainings'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Treinamentos
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-4 px-2 font-medium transition-all border-b-2 ${
                activeTab === 'requests'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Requisições
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {/* Tab: Chamados */}
          {activeTab === 'tickets' && (
            <div className="space-y-8">
              {/* Métricas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {ticketMetrics.map((metric, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all">
                    <p className="text-sm text-slate-400 mb-2">{metric.label}</p>
                    <div className="flex items-end justify-between">
                      <p className="text-2xl font-bold text-white">{metric.value}</p>
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <TrendingUp size={14} />
                        {metric.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Status dos Chamados</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={ticketStatusData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                        {ticketStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Prioridade */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Distribuição por Prioridade</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={ticketPriorityData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                        {ticketPriorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tendência */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Tendência de Chamados</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ticketTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total" strokeWidth={2} />
                    <Line type="monotone" dataKey="resolvidos" stroke="#10b981" name="Resolvidos" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tab: Treinamentos */}
          {activeTab === 'trainings' && (
            <div className="space-y-8">
              {/* Métricas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {trainingMetrics.map((metric, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all">
                    <p className="text-sm text-slate-400 mb-2">{metric.label}</p>
                    <div className="flex items-end justify-between">
                      <p className="text-2xl font-bold text-white">{metric.value}</p>
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <TrendingUp size={14} />
                        {metric.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conclusão */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Taxa de Conclusão</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={trainingCompletionData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                        {trainingCompletionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Por Categoria */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Treinamentos por Categoria</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={trainingByCategory} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                        {trainingByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Inscrições */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Inscrições e Conclusões</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trainingEnrollmentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="inscritos" stroke="#3b82f6" name="Inscritos" strokeWidth={2} />
                    <Line type="monotone" dataKey="concluidos" stroke="#10b981" name="Concluídos" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tab: Requisições */}
          {activeTab === 'requests' && (
            <div className="space-y-8">
              {/* Métricas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {requestMetrics.map((metric, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all">
                    <p className="text-sm text-slate-400 mb-2">{metric.label}</p>
                    <div className="flex items-end justify-between">
                      <p className="text-2xl font-bold text-white">{metric.value}</p>
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <TrendingUp size={14} />
                        {metric.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tipos */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Tipos de Requisições</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={requestTypeData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                        {requestTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Status */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Status das Requisições</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={requestStatusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                      <YAxis stroke="rgba(255,255,255,0.5)" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="pendentes" fill="#f59e0b" name="Pendentes" />
                      <Bar dataKey="aprovadas" fill="#10b981" name="Aprovadas" />
                      <Bar dataKey="rejeitadas" fill="#ef4444" name="Rejeitadas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
