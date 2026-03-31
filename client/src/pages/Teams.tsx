import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { teamsData } from "@/lib/mockData";
import { ArrowLeft, CheckCircle, MessageSquare, Zap, Activity } from "lucide-react";
import AuroraBackground from "@/components/AuroraBackground";

export default function Teams() {
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
              <h1 className="text-2xl font-bold text-white">Integração Microsoft Teams</h1>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-400" size={24} />
              <span className="text-green-400 font-semibold">Conectado</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          {/* Connection Status */}
          <div className="glass p-8 rounded-xl mb-12 border-l-4 border-green-400">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Status da Integração</h2>
                <p className="text-gray-400">Sua integração com Microsoft Teams está funcionando perfeitamente</p>
              </div>
              <CheckCircle className="text-green-400" size={48} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-white/10">
              <div>
                <p className="text-gray-400 text-sm mb-2">Última Sincronização</p>
                <p className="text-white font-semibold">{teamsData.lastSync}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Canais Sincronizados</p>
                <p className="text-cyan-400 font-bold text-2xl">{teamsData.syncedChannels}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Usuários Sincronizados</p>
                <p className="text-cyan-400 font-bold text-2xl">{teamsData.syncedUsers}</p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <h2 className="text-2xl font-bold text-white mb-6">Recursos Disponíveis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="glass p-6 rounded-xl hover:bg-white/20 transition">
              <div className="flex items-start gap-4">
                <div className="bg-cyan-500/20 p-3 rounded-lg">
                  <MessageSquare className="text-cyan-400" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">Sincronização de Mensagens</h3>
                  <p className="text-gray-400 text-sm mb-4">Receba notificações de chamados diretamente no Teams</p>
                  <Button size="sm" className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400">
                    Configurar
                  </Button>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-xl hover:bg-white/20 transition">
              <div className="flex items-start gap-4">
                <div className="bg-cyan-500/20 p-3 rounded-lg">
                  <Activity className="text-cyan-400" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">Atividade em Tempo Real</h3>
                  <p className="text-gray-400 text-sm mb-4">Acompanhe atualizações de tickets em tempo real</p>
                  <Button size="sm" className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400">
                    Ativar
                  </Button>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-xl hover:bg-white/20 transition">
              <div className="flex items-start gap-4">
                <div className="bg-cyan-500/20 p-3 rounded-lg">
                  <Zap className="text-cyan-400" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">Automações</h3>
                  <p className="text-gray-400 text-sm mb-4">Configure fluxos automáticos entre Teams e Portal</p>
                  <Button size="sm" className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400">
                    Gerenciar
                  </Button>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-xl hover:bg-white/20 transition">
              <div className="flex items-start gap-4">
                <div className="bg-cyan-500/20 p-3 rounded-lg">
                  <MessageSquare className="text-cyan-400" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">Canais Personalizados</h3>
                  <p className="text-gray-400 text-sm mb-4">Crie canais específicos para cada departamento</p>
                  <Button size="sm" className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400">
                    Criar Canal
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <h2 className="text-2xl font-bold text-white mb-6">Atividade Recente</h2>
          <div className="glass p-6 rounded-xl">
            <div className="space-y-4">
              {teamsData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start justify-between pb-4 border-b border-white/10 last:border-b-0">
                  <div className="flex-1">
                    <p className="text-white font-semibold">{activity.action}</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {activity.channel ? `Canal: ${activity.channel}` : `Usuário: ${activity.user}`}
                    </p>
                  </div>
                  <span className="text-gray-400 text-sm whitespace-nowrap ml-4">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Synced Channels */}
          <h2 className="text-2xl font-bold text-white mb-6 mt-12">Canais Sincronizados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "suporte-ti", members: 45 },
              { name: "geral", members: 156 },
              { name: "anuncios", members: 89 },
              { name: "desenvolvimento", members: 34 },
              { name: "vendas", members: 67 },
              { name: "rh", members: 23 },
              { name: "financeiro", members: 12 },
              { name: "projetos", members: 78 },
            ].map((channel) => (
              <div key={channel.name} className="glass p-4 rounded-xl hover:bg-white/20 transition">
                <h3 className="text-white font-semibold mb-2">#{channel.name}</h3>
                <p className="text-gray-400 text-sm">{channel.members} membros</p>
              </div>
            ))}
          </div>

          {/* Settings */}
          <div className="mt-12 glass p-8 rounded-xl">
            <h2 className="text-2xl font-bold text-white mb-6">Configurações de Integração</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-semibold">Notificações de Chamados</p>
                  <p className="text-gray-400 text-sm">Receber notificações quando novos chamados são criados</p>
                </div>
                <div className="w-12 h-6 bg-green-500 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-semibold">Sincronização Automática</p>
                  <p className="text-gray-400 text-sm">Sincronizar dados automaticamente a cada 5 minutos</p>
                </div>
                <div className="w-12 h-6 bg-green-500 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-semibold">Menções no Teams</p>
                  <p className="text-gray-400 text-sm">Mencionar usuários do Teams em comentários</p>
                </div>
                <div className="w-12 h-6 bg-gray-500 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5" />
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
                Salvar Configurações
              </Button>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Desconectar Teams
              </Button>
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
