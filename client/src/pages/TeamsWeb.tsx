import React, { useState } from 'react';
import BackButton from '@/components/BackButton';
import {
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Zap,
  Activity,
  Bell,
  Link2,
  Settings,
  MessageSquare,
  Clock,
  BarChart2,
  Send,
  Plus,
  Loader2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';

/**
 * TeamsWeb — Painel de Integração Microsoft Teams
 *
 * Conecta-se às rotas tRPC reais:
 *   teams.health              → status das credenciais / token Graph
 *   teams.dashboard           → painel operacional (admin)
 *   teams.createSubscription  → criar subscription no Graph (admin)
 *   teams.renewSubscription   → renovar subscription (admin)
 *   teams.processMessage      → processar mensagem manualmente (admin)
 *
 * Endpoints HTTP públicos (apenas informados na UI):
 *   GET  /api/teams/webhook
 *   POST /api/teams/webhook
 *   POST /api/teams/lifecycle
 */

type TabType = 'status' | 'subscriptions' | 'events' | 'manual' | 'diag' | 'permissions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    active:    { color: 'bg-green-500/20 text-green-300 border-green-500/30',  label: 'Ativa' },
    expired:   { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', label: 'Expirada' },
    error:     { color: 'bg-red-500/20 text-red-300 border-red-500/30',        label: 'Erro' },
    received:  { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',     label: 'Recebido' },
    processed: { color: 'bg-green-500/20 text-green-300 border-green-500/30',  label: 'Processado' },
    ignored:   { color: 'bg-slate-500/20 text-slate-300 border-slate-500/30',  label: 'Ignorado' },
    failed:    { color: 'bg-red-500/20 text-red-300 border-red-500/30',        label: 'Falhou' },
  };
  const cfg = map[status] ?? { color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', label: status };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

const TeamsWeb: React.FC = () => {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const [activeTab, setActiveTab] = useState<TabType>('status');
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  // ── Diagnóstico Graph ────────────────────────────────────────────────────────
  const [diagChatId, setDiagChatId] = useState('');
  const [diagMessageId, setDiagMessageId] = useState('');
  const [diagResult, setDiagResult] = useState<any>(null);
  const testGraphFetchMutation = trpc.teams.testGraphFetch.useMutation();

  // ── Permissões Azure AD ────────────────────────────────────────────────────────────────────
  const [reprocessResult, setReprocessResult] = useState<any>(null);
  const [fixSubResult, setFixSubResult] = useState<any>(null);
  const checkPermissionsQuery = trpc.teams.checkPermissions.useQuery(undefined, {
    enabled: isAdmin && activeTab === 'permissions',
    refetchOnWindowFocus: false,
  });
  const fixSubscriptionMutation = trpc.teams.fixSubscription.useMutation();
  const reprocessFailedMutation = trpc.teams.reprocessFailed.useMutation();

  const handleFixSubscription = async () => {
    setFixSubResult(null);
    try {
      const result = await fixSubscriptionMutation.mutateAsync();
      setFixSubResult(result);
      dashboardQuery.refetch();
    } catch (err: any) {
      setFixSubResult({ ok: false, error: err?.message ?? 'Erro desconhecido' });
    }
  };

  const handleReprocessFailed = async () => {
    setReprocessResult(null);
    try {
      const result = await reprocessFailedMutation.mutateAsync({ limit: 20 });
      setReprocessResult(result);
      dashboardQuery.refetch();
    } catch (err: any) {
      setReprocessResult({ ok: false, error: err?.message ?? 'Erro desconhecido' });
    }
  };

  // ── tRPC queries ────────────────────────────────────────────────────────────
  const healthQuery = trpc.teams.health.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  const dashboardQuery = trpc.teams.dashboard.useQuery(undefined, {
    enabled: isAdmin,
    refetchInterval: 30_000,
  });

  // ── tRPC mutations ──────────────────────────────────────────────────────────
  const createSubMutation  = trpc.teams.createSubscription.useMutation();
  const renewSubMutation   = trpc.teams.renewSubscription.useMutation();
  const deleteSubMutation  = trpc.teams.deleteSubscription.useMutation();
  const processMsgMutation = trpc.teams.processMessage.useMutation();

  // Lista subscriptions diretamente do Graph (fonte de verdade)
  const graphSubsQuery = trpc.teams.listGraphSubscriptions.useQuery(undefined, {
    enabled: isAdmin && activeTab === 'subscriptions',
    refetchInterval: 30_000,
  });

  // ── Form state: criar subscription ─────────────────────────────────────────
  // Expiração padrão: 1 dia (máximo permitido pelo Graph para /chats/getAllMessages: 3 dias / 4.320 min)
  const maxExpiryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const [subForm, setSubForm] = useState({
    resource: '/chats/getAllMessages',
    changeType: 'created',
    expirationDateTime: (() => {
      // Padrão: 1 dia (máximo real do Graph para /chats/getAllMessages: 3 dias)
      const d = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
      return d.toISOString().slice(0, 16);
    })(),
    // Deixar vazio: o servidor usa TEAMS_NOTIFICATION_URL e TEAMS_LIFECYCLE_URL como fallback
    notificationUrl: '',
    lifecycleNotificationUrl: '',
  });
  const [subResult, setSubResult] = useState<string | null>(null);

  // ── Form state: processar mensagem manualmente ──────────────────────────────
  const [msgForm, setMsgForm] = useState({
    messageId: '',
    messageText: '',
    senderName: '',
    senderEmail: '',
    contextType: 'chat' as 'chat' | 'channel',
    chatId: '',
    teamId: '',
    channelId: '',
  });
  const [msgResult, setMsgResult] = useState<string | null>(null);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCreateSubscription = async () => {
    setSubResult(null);
    try {
      const expiry = new Date(subForm.expirationDateTime).toISOString();
      const result = await createSubMutation.mutateAsync({
        resource: subForm.resource,
        changeType: subForm.changeType,
        expirationDateTime: expiry,
        notificationUrl: subForm.notificationUrl || undefined,
        lifecycleNotificationUrl: subForm.lifecycleNotificationUrl || undefined,
      });
      setSubResult(`✅ Subscription criada: ${result.id}`);
      dashboardQuery.refetch();
    } catch (error: any) {
      setSubResult(`❌ Erro: ${error?.message ?? 'Falha ao criar subscription'}`);
    }
  };

  const handleRenewSubscription = async (subscriptionId: string) => {
    try {
      const newExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      await renewSubMutation.mutateAsync({ subscriptionId, expirationDateTime: newExpiry });
      dashboardQuery.refetch();
      graphSubsQuery.refetch();
    } catch (error: any) {
      alert(`Erro ao renovar: ${error?.message}`);
    }
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (!confirm(`Deletar subscription ${subscriptionId} do Microsoft Graph? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteSubMutation.mutateAsync({ subscriptionId });
      dashboardQuery.refetch();
      graphSubsQuery.refetch();
      setSubResult(`✅ Subscription ${subscriptionId} deletada com sucesso.`);
    } catch (error: any) {
      setSubResult(`❌ Erro ao deletar: ${error?.message ?? 'Falha ao deletar subscription'}`);
    }
  };

  const handleTestGraphFetch = async () => {
    setDiagResult(null);
    if (!diagChatId || !diagMessageId) {
      setDiagResult({ ok: false, error: 'chatId e messageId são obrigatórios.' });
      return;
    }
    try {
      const result = await testGraphFetchMutation.mutateAsync({
        chatId: diagChatId,
        messageId: diagMessageId,
      });
      setDiagResult(result);
    } catch (err: any) {
      setDiagResult({ ok: false, error: err?.message ?? 'Erro desconhecido' });
    }
  };

  const handleProcessMessage = async () => {
    setMsgResult(null);
    if (!msgForm.messageId || !msgForm.senderEmail) {
      setMsgResult('❌ messageId e senderEmail são obrigatórios.');
      return;
    }
    try {
      const result = await processMsgMutation.mutateAsync({
        ...msgForm,
        createdAt: new Date().toISOString(),
      });
      if (result.created) {
        setMsgResult(`✅ Chamado criado: ${result.requestCode} (ID #${result.ticketId})`);
      } else if (result.duplicate) {
        setMsgResult(`⚠️ Duplicado: chamado #${result.ticketId} já existe para esta mensagem.`);
      } else {
        setMsgResult(`ℹ️ ${JSON.stringify(result)}`);
      }
      dashboardQuery.refetch();
    } catch (error: any) {
      setMsgResult(`❌ Erro: ${error?.message ?? 'Falha ao processar mensagem'}`);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const health = healthQuery.data;
  const dashboard = dashboardQuery.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <BackButton variant="ghost" />
            <div className="w-px h-6 bg-white/20" />
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
                Teams Web — Integração Microsoft Teams
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Gerenciamento de webhooks, subscriptions e chamados via Microsoft Graph
              </p>
            </div>
          </div>

          {/* Status pill */}
          <div className="flex items-center gap-2">
            {healthQuery.isLoading ? (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verificando...
              </span>
            ) : health?.tokenOk ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full text-xs text-green-300 font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Graph conectado
              </span>
            ) : health?.configured ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-full text-xs text-red-300 font-medium">
                <XCircle className="w-3.5 h-3.5" /> Erro no token
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-xs text-yellow-300 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> Não configurado
              </span>
            )}
            <button
              onClick={() => { healthQuery.refetch(); dashboardQuery.refetch(); }}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Atualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 px-6 sticky top-[73px] z-10">
        <div className="max-w-7xl mx-auto flex gap-6">
          {([
            { id: 'status',        label: 'Status',        icon: Activity },
            { id: 'subscriptions', label: 'Subscriptions', icon: Bell,    adminOnly: true },
            { id: 'events',        label: 'Eventos',       icon: BarChart2, adminOnly: true },
            { id: 'manual',        label: 'Teste Manual',  icon: Send,    adminOnly: true },
            { id: 'diag',          label: 'Diagnóstico Graph', icon: Zap,  adminOnly: true },
            { id: 'permissions',   label: 'Permissões Azure AD', icon: Settings, adminOnly: true },
          ] as Array<{ id: TabType; label: string; icon: any; adminOnly?: boolean }>)
            .filter(t => !t.adminOnly || isAdmin)
            .map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 py-4 px-1 text-sm font-medium border-b-2 transition-all ${
                  activeTab === t.id
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* ── Tab: Status ─────────────────────────────────────────────────── */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            {/* Credenciais */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                Status das Credenciais
              </h2>
              {healthQuery.isLoading ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-sm text-slate-300">Credenciais configuradas</span>
                    {health?.configured
                      ? <CheckCircle className="w-5 h-5 text-green-400" />
                      : <XCircle className="w-5 h-5 text-red-400" />}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-sm text-slate-300">Token Microsoft Graph</span>
                    {health?.tokenOk
                      ? <CheckCircle className="w-5 h-5 text-green-400" />
                      : <XCircle className="w-5 h-5 text-red-400" />}
                  </div>
                  {health?.message && (
                    <div className={`p-3 rounded-lg text-sm ${health.tokenOk ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20'}`}>
                      {health.message}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Endpoints públicos */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-cyan-400" />
                Endpoints Públicos
              </h2>
              <div className="space-y-3">
                {[
                  { method: 'GET',  path: '/api/teams/webhook',   desc: 'Validação do challenge do Microsoft Graph' },
                  { method: 'POST', path: '/api/teams/webhook',   desc: 'Recebimento de change notifications' },
                  { method: 'POST', path: '/api/teams/lifecycle', desc: 'Lifecycle notifications (renovação automática)' },
                ].map(ep => (
                  <div key={ep.path + ep.method} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                    <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded ${ep.method === 'GET' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'}`}>
                      {ep.method}
                    </span>
                    <div>
                      <code className="text-sm text-cyan-300 font-mono">{ep.path}</code>
                      <p className="text-xs text-slate-400 mt-0.5">{ep.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              {dashboard?.publicUrls?.notification && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300">
                  <strong>Notification URL configurada:</strong>{' '}
                  <span className="font-mono">{dashboard.publicUrls.notification}</span>
                </div>
              )}
            </div>

            {/* Guia de configuração */}
            {!health?.configured && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-yellow-300 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Configuração Necessária
                </h2>
                <p className="text-sm text-yellow-200 mb-4">
                  Defina as seguintes variáveis de ambiente no Railway (ou no seu <code className="font-mono">.env</code>):
                </p>
                <div className="space-y-2 font-mono text-xs">
                  {[
                    ['TEAMS_TENANT_ID',            'ID do tenant Azure AD (Directory ID)'],
                    ['TEAMS_CLIENT_ID',            'Application (client) ID do app Azure'],
                    ['TEAMS_CLIENT_SECRET',        'Client secret gerado no Azure AD'],
                    ['TEAMS_WEBHOOK_CLIENT_STATE', 'Segredo para validar webhooks (padrão: teams-portal-online)'],
                    ['TEAMS_NOTIFICATION_URL',     'URL pública: https://seu-dominio.com/api/teams/webhook'],
                    ['TEAMS_LIFECYCLE_URL',        'URL pública: https://seu-dominio.com/api/teams/lifecycle'],
                    ['TEAMS_DEFAULT_RESOURCE',     'Recurso padrão (padrão: /chats/getAllMessages)'],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex gap-2">
                      <code className="text-cyan-300 shrink-0">{key}</code>
                      <span className="text-slate-400">— {desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Subscriptions ──────────────────────────────────────────── */}
        {activeTab === 'subscriptions' && isAdmin && (
          <div className="space-y-6">
            {/* Criar nova subscription */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                Criar Subscription no Microsoft Graph
              </h2>
              {/* Nota informativa sobre URLs automáticas */}
              <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-xs text-cyan-300">
                <strong>ℹ️ URLs automáticas:</strong> Os campos Notification URL e Lifecycle URL são opcionais — o servidor usa automaticamente as URLs configuradas nas variáveis de ambiente. <strong>Limite de expiração:</strong> o Microsoft Graph permite no máximo <strong>3 dias (4.320 minutos)</strong> para o recurso <code className="font-mono">/chats/getAllMessages</code>. O servidor ajusta automaticamente datas além desse limite.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Resource', key: 'resource', placeholder: '/chats/getAllMessages' },
                  { label: 'Change Type', key: 'changeType', placeholder: 'created' },
                  { label: 'Expiration (local) — máx. 3 dias (4.320 min)', key: 'expirationDateTime', type: 'datetime-local', max: maxExpiryDate },
                  { label: 'Notification URL (opcional — usa env var se vazio)', key: 'notificationUrl', placeholder: 'https://jkings.team/api/teams/webhook' },
                  { label: 'Lifecycle URL (opcional — usa env var se vazio)', key: 'lifecycleNotificationUrl', placeholder: 'https://jkings.team/api/teams/lifecycle' },
                ].map((field: any) => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-slate-400 mb-1">{field.label}</label>
                    <input
                      type={field.type ?? 'text'}
                      placeholder={field.placeholder}
                      max={field.max}
                      value={(subForm as any)[field.key]}
                      onChange={e => setSubForm(f => ({ ...f, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handleCreateSubscription}
                  disabled={createSubMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {createSubMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Criar Subscription
                </button>
                {subResult && (
                  <span className="text-sm text-slate-300">{subResult}</span>
                )}
              </div>
            </div>

            {/* Subscriptions no Microsoft Graph (fonte de verdade) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-cyan-400" />
                  Subscriptions no Microsoft Graph
                  <span className="text-xs font-normal text-slate-400 ml-1">(fonte de verdade)</span>
                </h2>
                <button
                  onClick={() => graphSubsQuery.refetch()}
                  disabled={graphSubsQuery.isFetching}
                  className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 text-slate-300 rounded text-xs transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${graphSubsQuery.isFetching ? 'animate-spin' : ''}`} /> Atualizar
                </button>
              </div>

              {/* Aviso de limite */}
              <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-xs text-orange-300">
                <strong>⚠️ Limite do Microsoft Graph:</strong> O plano atual permite apenas <strong>1 subscription</strong> do tipo <code className="font-mono">/chats/getAllMessages</code> por tenant. Se já existe uma subscription ativa e você quiser criar uma nova, <strong>delete a existente primeiro</strong> usando o botão abaixo.
              </div>

              {graphSubsQuery.isLoading || graphSubsQuery.isFetching ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Consultando Microsoft Graph...
                </div>
              ) : graphSubsQuery.error ? (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-300">
                  ❌ Erro ao consultar Graph: {(graphSubsQuery.error as any)?.message}
                </div>
              ) : !graphSubsQuery.data?.length ? (
                <p className="text-sm text-slate-400">Nenhuma subscription ativa no Microsoft Graph. Você pode criar uma nova acima.</p>
              ) : (
                <div className="space-y-3">
                  {graphSubsQuery.data.map((sub: any) => (
                    <div key={sub.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer"
                        onClick={() => setExpandedSub(expandedSub === sub.id ? null : sub.id)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-green-500/20 text-green-300 border-green-500/30">Ativa no Graph</span>
                          <code className="text-xs text-slate-300 font-mono truncate max-w-[200px]">{sub.id}</code>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 hidden sm:block">
                            Expira: {formatDate(sub.expirationDateTime)}
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); handleRenewSubscription(sub.id); }}
                            disabled={renewSubMutation.isPending}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-xs transition-colors"
                          >
                            <RefreshCw className="w-3 h-3" /> Renovar
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteSubscription(sub.id); }}
                            disabled={deleteSubMutation.isPending}
                            className="flex items-center gap-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-xs transition-colors"
                          >
                            <XCircle className="w-3 h-3" /> Deletar
                          </button>
                          {expandedSub === sub.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>
                      {expandedSub === sub.id && (
                        <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-2 text-xs text-slate-400">
                          <div><strong className="text-slate-300">Resource:</strong> <code className="font-mono">{sub.resource}</code></div>
                          <div><strong className="text-slate-300">Change Type:</strong> {sub.changeType}</div>
                          <div><strong className="text-slate-300">Notification URL:</strong> <code className="font-mono break-all">{sub.notificationUrl}</code></div>
                          <div><strong className="text-slate-300">Client State:</strong> <code className="font-mono">{sub.clientState}</code></div>
                          <div><strong className="text-slate-300">Expira em:</strong> {formatDate(sub.expirationDateTime)}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subscriptions no banco local */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-slate-400" />
                Subscriptions no Banco Local
                <span className="text-xs font-normal text-slate-400 ml-1">(cache)</span>
              </h2>
              {dashboardQuery.isLoading ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                </div>
              ) : !dashboard?.subscriptions?.length ? (
                <p className="text-sm text-slate-400">Nenhuma subscription no banco local.</p>
              ) : (
                <div className="space-y-3">
                  {dashboard.subscriptions.map((sub: any) => (
                    <div key={sub.subscriptionId} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer"
                        onClick={() => setExpandedSub(expandedSub === sub.subscriptionId ? null : sub.subscriptionId)}
                      >
                        <div className="flex items-center gap-3">
                          <StatusBadge status={sub.status} />
                          <code className="text-xs text-slate-300 font-mono truncate max-w-[200px]">{sub.subscriptionId}</code>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 hidden sm:block">
                            Expira: {formatDate(sub.expirationDateTime)}
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteSubscription(sub.subscriptionId); }}
                            disabled={deleteSubMutation.isPending}
                            className="flex items-center gap-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-xs transition-colors"
                          >
                            <XCircle className="w-3 h-3" /> Deletar
                          </button>
                          {expandedSub === sub.subscriptionId ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>
                      {expandedSub === sub.subscriptionId && (
                        <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-2 text-xs text-slate-400">
                          <div><strong className="text-slate-300">Resource:</strong> <code className="font-mono">{sub.resource}</code></div>
                          <div><strong className="text-slate-300">Change Type:</strong> {sub.changeType}</div>
                          <div><strong className="text-slate-300">Notification URL:</strong> <code className="font-mono break-all">{sub.notificationUrl}</code></div>
                          {sub.lifecycleNotificationUrl && (
                            <div><strong className="text-slate-300">Lifecycle URL:</strong> <code className="font-mono break-all">{sub.lifecycleNotificationUrl}</code></div>
                          )}
                          <div><strong className="text-slate-300">Criada em:</strong> {formatDate(sub.createdAt)}</div>
                          <div><strong className="text-slate-300">Atualizada em:</strong> {formatDate(sub.updatedAt)}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Eventos ─────────────────────────────────────────────────── */}
        {activeTab === 'events' && isAdmin && (
          <div className="space-y-6">
            {/* Eventos recentes */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Eventos Recentes (últimos 10)
              </h2>
              {dashboardQuery.isLoading ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                </div>
              ) : !dashboard?.recentEvents?.length ? (
                <p className="text-sm text-slate-400">Nenhum evento registrado ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="pb-2 pr-4">Message ID</th>
                        <th className="pb-2 pr-4">Tipo</th>
                        <th className="pb-2 pr-4">Email</th>
                        <th className="pb-2 pr-4">Status</th>
                        <th className="pb-2 pr-4">Recebido em</th>
                        <th className="pb-2">Processado em</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {dashboard.recentEvents.map((ev: any) => (
                        <tr key={ev.id} className="hover:bg-white/5">
                          <td className="py-2 pr-4 font-mono text-slate-300 max-w-[140px] truncate">{ev.messageId}</td>
                          <td className="py-2 pr-4 text-slate-400">{ev.eventType}</td>
                          <td className="py-2 pr-4 text-slate-400">{ev.userEmail ?? '—'}</td>
                          <td className="py-2 pr-4"><StatusBadge status={ev.processingStatus} /></td>
                          <td className="py-2 pr-4 text-slate-400">{formatDate(ev.createdAt)}</td>
                          <td className="py-2 text-slate-400">{ev.processedAt ? formatDate(ev.processedAt) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Mapeamentos recentes */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                Mapeamentos Recentes (últimos 10)
              </h2>
              {dashboardQuery.isLoading ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                </div>
              ) : !dashboard?.recentMappings?.length ? (
                <p className="text-sm text-slate-400">Nenhum mapeamento registrado ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="pb-2 pr-4">Message ID</th>
                        <th className="pb-2 pr-4">Ticket ID</th>
                        <th className="pb-2 pr-4">Categoria</th>
                        <th className="pb-2 pr-4">Prioridade</th>
                        <th className="pb-2">Criado em</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {dashboard.recentMappings.map((m: any) => (
                        <tr key={m.id} className="hover:bg-white/5">
                          <td className="py-2 pr-4 font-mono text-slate-300 max-w-[140px] truncate">{m.messageId}</td>
                          <td className="py-2 pr-4 text-cyan-300">#{m.ticketId}</td>
                          <td className="py-2 pr-4 text-slate-400">{m.category ?? '—'}</td>
                          <td className="py-2 pr-4 text-slate-400">{m.priority ?? '—'}</td>
                          <td className="py-2 text-slate-400">{formatDate(m.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        {/* ── Tab: Diagnóstico Graph ───────────────────────────────────────── */}
        {activeTab === 'diag' && isAdmin && (
          <div className="space-y-6">
            {/* Aviso de permissões */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-yellow-300 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Diagnóstico de Permissões Azure AD
              </h2>
              <p className="text-sm text-yellow-200 mb-4">
                Se as notificações reais do Teams estão falhando com erro 404, o problema mais comum é a falta de
                permissão <code className="font-mono bg-yellow-500/20 px-1 rounded">Chat.Read.All</code> como
                <strong> Application Permission</strong> com admin consent no Azure AD.
              </p>
              <div className="space-y-2 text-sm text-yellow-100">
                <p className="font-semibold">Como corrigir no Azure AD:</p>
                <ol className="list-decimal list-inside space-y-1 text-yellow-200">
                  <li>Acesse <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">portal.azure.com</a></li>
                  <li>Vá em <strong>Microsoft Entra ID → App Registrations → Portal-Atendimento</strong></li>
                  <li>Clique em <strong>API Permissions → Add a permission → Microsoft Graph → Application permissions</strong></li>
                  <li>Adicione: <code className="font-mono bg-yellow-500/20 px-1 rounded">Chat.Read.All</code> e <code className="font-mono bg-yellow-500/20 px-1 rounded">ChannelMessage.Read.All</code></li>
                  <li>Clique em <strong>Grant admin consent for [seu tenant]</strong> (botão verde)</li>
                  <li>Aguarde 2-5 minutos e teste abaixo</li>
                </ol>
              </div>
            </div>

            {/* Teste direto da chamada Graph */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                Testar Chamada Graph Diretamente
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                Informe um chatId e messageId de um evento recente (aba Eventos) para testar se a permissão está configurada.
                Copie os valores da coluna <em>Message ID</em> nos eventos com status <em>Falhou</em>.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Chat ID</label>
                  <input
                    type="text"
                    placeholder="19:xxxxxxxx@thread.v2"
                    value={diagChatId}
                    onChange={e => setDiagChatId(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Message ID</label>
                  <input
                    type="text"
                    placeholder="1234567890123"
                    value={diagMessageId}
                    onChange={e => setDiagMessageId(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>
              <button
                onClick={handleTestGraphFetch}
                disabled={testGraphFetchMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {testGraphFetchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Testar Permissão Graph
              </button>

              {diagResult && (
                <div className={`mt-4 p-4 rounded-xl border text-sm ${
                  diagResult.ok
                    ? 'bg-green-500/10 border-green-500/20 text-green-200'
                    : 'bg-red-500/10 border-red-500/20 text-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {diagResult.ok
                      ? <CheckCircle className="w-4 h-4 text-green-400" />
                      : <XCircle className="w-4 h-4 text-red-400" />}
                    <strong>{diagResult.ok ? 'Sucesso!' : `Erro HTTP ${diagResult.status ?? 'desconhecido'}`}</strong>
                  </div>
                  {diagResult.hint && (
                    <p className="mb-2 text-yellow-200">{diagResult.hint}</p>
                  )}
                  {diagResult.error && (
                    <pre className="text-xs font-mono bg-black/20 p-2 rounded overflow-x-auto">
                      {typeof diagResult.error === 'object'
                        ? JSON.stringify(diagResult.error, null, 2)
                        : diagResult.error}
                    </pre>
                  )}
                  {diagResult.ok && diagResult.data && (
                    <pre className="text-xs font-mono bg-black/20 p-2 rounded overflow-x-auto mt-2">
                      {JSON.stringify(diagResult.data, null, 2).slice(0, 800)}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Eventos recentes com erros */}
            {(dashboard?.recentEvents?.filter((ev: any) => ev.processingStatus === 'failed')?.length ?? 0) > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  Eventos com Falha (clique para copiar IDs)
                </h2>
                <div className="space-y-2">
                  {dashboard?.recentEvents
                    .filter((ev: any) => ev.processingStatus === 'failed')
                    .slice(0, 5)
                    .map((ev: any) => {
                      let payload: any = {};
                      try { payload = typeof ev.payload === 'string' ? JSON.parse(ev.payload) : ev.payload; } catch {}
                      const chatId = payload?.chatId ?? payload?.notification?.resourceData?.chatId ?? '';
                      const msgId = ev.messageId ?? '';
                      return (
                        <div key={ev.id} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-red-300 font-mono">{ev.eventType}</span>
                            <span className="text-xs text-slate-400">{formatDate(ev.createdAt)}</span>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {chatId && (
                              <button
                                onClick={() => setDiagChatId(chatId)}
                                className="text-xs px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-300 hover:bg-cyan-500/30 transition-colors"
                                title="Usar este chatId no teste"
                              >
                                Chat: {chatId.slice(0, 30)}...
                              </button>
                            )}
                            {msgId && (
                              <button
                                onClick={() => setDiagMessageId(msgId)}
                                className="text-xs px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 hover:bg-purple-500/30 transition-colors"
                                title="Usar este messageId no teste"
                              >
                                Msg: {msgId.slice(0, 20)}...
                              </button>
                            )}
                          </div>
                          {payload?.graphFetchError && (
                            <p className="text-xs text-red-300 mt-1 font-mono">{payload.graphFetchError}</p>
                          )}
                          {payload?.hint && (
                            <p className="text-xs text-yellow-300 mt-1">{payload.hint}</p>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Teste Manual ──────────────────────────────────────────────── */}        {activeTab === 'manual' && isAdmin && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Send className="w-5 h-5 text-cyan-400" />
              Processar Mensagem Manualmente
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Simule o recebimento de uma mensagem do Teams e crie um chamado na tabela <code className="font-mono text-cyan-300">requests</code>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Message ID *', key: 'messageId', placeholder: 'teams-msg-001' },
                { label: 'Sender Email *', key: 'senderEmail', placeholder: 'usuario@empresa.com' },
                { label: 'Sender Name', key: 'senderName', placeholder: 'João Silva' },
                { label: 'Chat ID', key: 'chatId', placeholder: '19:...' },
                { label: 'Team ID', key: 'teamId', placeholder: 'uuid' },
                { label: 'Channel ID', key: 'channelId', placeholder: '19:...' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-slate-400 mb-1">{field.label}</label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={(msgForm as any)[field.key]}
                    onChange={e => setMsgForm(f => ({ ...f, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Texto da Mensagem</label>
                <textarea
                  rows={4}
                  placeholder="Olá, preciso de uma solicitação urgente de acesso ao sistema..."
                  value={msgForm.messageText}
                  onChange={e => setMsgForm(f => ({ ...f, messageText: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Palavras-chave detectadas: <em>solicitação</em>, <em>requisição</em>, <em>ocorrência</em>, <em>urgente</em>, <em>prioridade alta</em>
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Contexto</label>
                <select
                  value={msgForm.contextType}
                  onChange={e => setMsgForm(f => ({ ...f, contextType: e.target.value as 'chat' | 'channel' }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  <option value="chat">chat</option>
                  <option value="channel">channel</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={handleProcessMessage}
                disabled={processMsgMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {processMsgMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Processar Mensagem
              </button>
              {msgResult && (
                <span className={`text-sm ${msgResult.startsWith('✅') ? 'text-green-300' : msgResult.startsWith('⚠️') ? 'text-yellow-300' : 'text-red-300'}`}>
                  {msgResult}
                </span>
              )}
            </div>
          </div>
        )}

         {/* ── Tab: Permissões Azure AD ────────────────────────────────────────── */}
        {activeTab === 'permissions' && isAdmin && (
          <div className="space-y-6">

            {/* Checklist de configuração */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                Checklist de Configuração Azure AD
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Siga os passos abaixo para garantir que a integração com o Microsoft Graph esteja corretamente configurada.
              </p>
              <ol className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-center font-bold">1</span>
                  <div>
                    <p className="font-medium text-white">Registrar aplicativo no Azure AD</p>
                    <p className="text-xs text-slate-400 mt-0.5">Portal Azure → Azure Active Directory → App registrations → New registration</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-center font-bold">2</span>
                  <div>
                    <p className="font-medium text-white">Adicionar Application Permissions (não Delegated)</p>
                    <p className="text-xs text-slate-400 mt-0.5">API permissions → Add a permission → Microsoft Graph → Application permissions</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {['Chat.Read.All', 'User.Read.All', 'ChannelMessage.Read.All'].map(p => (
                        <code key={p} className="px-2 py-0.5 bg-slate-700 rounded text-xs text-cyan-300 font-mono">{p}</code>
                      ))}
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-center font-bold">3</span>
                  <div>
                    <p className="font-medium text-white">Conceder Admin Consent</p>
                    <p className="text-xs text-slate-400 mt-0.5">API permissions → Grant admin consent for [seu tenant] → confirmar</p>
                    <p className="text-xs text-yellow-400 mt-1">⚠️ Sem Admin Consent, o Graph retorna 403 ao tentar ler mensagens.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-center font-bold">4</span>
                  <div>
                    <p className="font-medium text-white">Configurar variáveis de ambiente no Railway</p>
                    <div className="mt-2 grid grid-cols-1 gap-1">
                      {[
                        ['TEAMS_TENANT_ID', 'ID do tenant Azure AD (Directory ID)'],
                        ['TEAMS_CLIENT_ID', 'Application (client) ID do app registrado'],
                        ['TEAMS_CLIENT_SECRET', 'Client secret gerado em Certificates & secrets'],
                        ['TEAMS_NOTIFICATION_URL', 'https://jkings.team/api/teams/webhook'],
                        ['TEAMS_LIFECYCLE_URL', 'https://jkings.team/api/teams/lifecycle'],
                        ['TEAMS_WEBHOOK_CLIENT_STATE', 'Chave secreta para validar notificações (ex: teams-portal-online)'],
                      ].map(([key, desc]) => (
                        <div key={key} className="flex items-start gap-2">
                          <code className="text-xs font-mono text-cyan-300 bg-slate-700/50 px-1.5 py-0.5 rounded flex-shrink-0">{key}</code>
                          <span className="text-xs text-slate-400">{desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-center font-bold">5</span>
                  <div>
                    <p className="font-medium text-white">Criar subscription no Microsoft Graph</p>
                    <p className="text-xs text-slate-400 mt-0.5">Use a aba <strong className="text-white">Subscriptions</strong> para criar uma nova subscription com resource <code className="font-mono text-cyan-300">/chats/getAllMessages</code>.</p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Teste de permissões */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400" />
                Verificar Permissões Automaticamente
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Testa se <code className="font-mono">Chat.Read.All</code>, <code className="font-mono">User.Read.All</code> e <code className="font-mono">Subscription.Read.All</code> estão configurados corretamente no Azure AD.
              </p>

              {checkPermissionsQuery.isLoading && (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Verificando permissões...
                </div>
              )}

              {checkPermissionsQuery.data && (
                <div className="space-y-3">
                  {/* Resumo */}
                  <div className="space-y-1.5">
                    {checkPermissionsQuery.data.summary.map((line, i) => (
                      <p key={i} className={`text-sm ${
                        line.startsWith('✅') ? 'text-green-300' :
                        line.startsWith('❌') ? 'text-red-300' :
                        'text-yellow-300'
                      }`}>{line}</p>
                    ))}
                  </div>

                  {/* Recomendações */}
                  {checkPermissionsQuery.data.recommendations.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-3">
                      <p className="text-xs font-semibold text-yellow-300 mb-2">Recomendações:</p>
                      <ul className="space-y-1">
                        {checkPermissionsQuery.data.recommendations.map((rec, i) => (
                          <li key={i} className="text-xs text-yellow-200">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Detalhes técnicos */}
                  <details className="mt-2">
                    <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">Ver detalhes técnicos</summary>
                    <pre className="mt-2 text-xs bg-slate-900/60 rounded-lg p-3 overflow-auto text-slate-300 max-h-48">
                      {JSON.stringify(checkPermissionsQuery.data, null, 2)}
                    </pre>
                  </details>
                </div>
              )}

              {checkPermissionsQuery.error && (
                <p className="text-sm text-red-300">❌ Erro: {checkPermissionsQuery.error.message}</p>
              )}

              <button
                onClick={() => checkPermissionsQuery.refetch()}
                disabled={checkPermissionsQuery.isFetching}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {checkPermissionsQuery.isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {checkPermissionsQuery.data ? 'Reverificar Permissões' : 'Verificar Permissões'}
              </button>
            </div>

            {/* Corrigir Subscription */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-cyan-400" />
                Recriar Subscription com ClientState
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Deleta subscriptions sem <code className="font-mono">clientState</code> e cria uma nova com a chave <code className="font-mono">TEAMS_WEBHOOK_CLIENT_STATE</code> configurada. Isso melhora a segurança e a validação das notificações.
              </p>

              {fixSubResult && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  fixSubResult.ok !== false ? 'bg-green-500/10 border border-green-500/20 text-green-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'
                }`}>
                  {fixSubResult.ok !== false ? (
                    <div>
                      <p className="font-medium">✅ Subscription recriada com sucesso!</p>
                      {fixSubResult.deleted?.length > 0 && (
                        <p className="text-xs mt-1">Deletadas: {fixSubResult.deleted.join(', ')}</p>
                      )}
                      {fixSubResult.created && (
                        <p className="text-xs mt-1">Nova ID: <code className="font-mono">{fixSubResult.created.id}</code></p>
                      )}
                    </div>
                  ) : (
                    <p>❌ Erro: {fixSubResult.error}</p>
                  )}
                </div>
              )}

              <button
                onClick={handleFixSubscription}
                disabled={fixSubscriptionMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {fixSubscriptionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Recriar Subscription
              </button>
            </div>

            {/* Reprocessar eventos falhos */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                Reprocessar Eventos com Falha
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Reprocessa até 20 eventos com status <code className="font-mono">failed</code> que não geraram chamados. Útil para recuperar mensagens que falharam antes da correção do banco de dados.
              </p>

              {reprocessResult && (
                <div className="mb-4 p-3 rounded-lg bg-slate-900/60 border border-white/10">
                  <p className="text-sm font-medium text-white mb-2">
                    {reprocessResult.ok !== false ? `✅ ${reprocessResult.total} evento(s) processado(s)` : `❌ Erro: ${reprocessResult.error}`}
                  </p>
                  {reprocessResult.results?.length > 0 && (
                    <div className="space-y-1 max-h-48 overflow-auto">
                      {reprocessResult.results.map((r: any, i: number) => (
                        <div key={i} className="text-xs flex items-start gap-2">
                          <span className={r.error ? 'text-red-400' : r.result?.skipped ? 'text-slate-400' : 'text-green-400'}>
                            {r.error ? '❌' : r.result?.skipped ? '⏭️' : '✅'}
                          </span>
                          <span className="text-slate-300 font-mono">{r.messageId}</span>
                          <span className="text-slate-400">
                            {r.error ? r.error : r.result?.skipped ? `Já processado (#${r.result.ticketId})` : r.result?.created ? `Chamado criado: ${r.result.requestCode}` : JSON.stringify(r.result)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleReprocessFailed}
                disabled={reprocessFailedMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {reprocessFailedMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Reprocessar Eventos Falhos
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};
export default TeamsWeb;
