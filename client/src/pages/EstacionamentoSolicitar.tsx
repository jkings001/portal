import { useState, useEffect, useCallback } from "react";
import {
  Car, Clock, CheckCircle2, Download, QrCode, History,
  AlertTriangle, Loader2, CalendarDays, Home,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TicketDisponivel {
  id: number;
  codigo: string;
  valor: string;
  duracao_horas: number;
  data_validade: string | null;
  status: string;
  criado_em?: string;
}

interface Solicitacao {
  id: number;
  ticket_codigo: string;
  duracao_solicitada: number;
  valor_pago: string;
  data_solicitacao: string;
  status: "solicitado" | "aprovado" | "usado" | "cancelado";
  qrcode_data: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAuthToken() { return localStorage.getItem("authToken"); }

async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = getAuthToken();
  const res = await fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function fmtCurrency(v: string | number | null) {
  if (v === null || v === undefined) return "-";
  return `R$ ${parseFloat(String(v)).toFixed(2).replace(".", ",")}`;
}

function fmtDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function statusColor(status: string) {
  switch (status) {
    case "solicitado": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "aprovado":   return "bg-green-500/20 text-green-300 border-green-500/30";
    case "usado":      return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    case "cancelado":  return "bg-red-500/20 text-red-300 border-red-500/30";
    default:           return "bg-white/10 text-white/60 border-white/20";
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    solicitado: "Solicitado", aprovado: "Aprovado", usado: "Usado", cancelado: "Cancelado",
  };
  return map[status] || status;
}

// Tabela fixa de preços
const PARKING_OPTIONS = [
  { horas: 2,  valor: 18, label: "2 horas",  descricao: "Ideal para visitas rápidas" },
  { horas: 12, valor: 44, label: "12 horas", descricao: "Ideal para o dia de trabalho" },
] as const;

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function EstacionamentoSolicitar() {
  const [, setLocation] = useLocation();

  // Tickets disponíveis (1 por duração, mais antigo)
  const [ticket2h,  setTicket2h]  = useState<TicketDisponivel | null>(null);
  const [ticket12h, setTicket12h] = useState<TicketDisponivel | null>(null);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // Histórico do último mês
  const [historico, setHistorico] = useState<Solicitacao[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(true);

  // Seleção e solicitação
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<2 | 12 | null>(null);
  const [solicitando, setSolicitando] = useState(false);

  // Modais
  const [qrResult, setQrResult] = useState<{ qrCode: string; ticket: any; solicitacaoId: number } | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showHistoricoQr, setShowHistoricoQr] = useState<{ qrCode: string; codigo: string } | null>(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const data = await apiFetch("/api/estacionamento/disponiveis");
      const tickets: TicketDisponivel[] = data.tickets || [];
      setTicket2h(tickets.find(t => t.duracao_horas === 2)  ?? null);
      setTicket12h(tickets.find(t => t.duracao_horas === 12) ?? null);
    } catch {
      toast.error("Erro ao carregar tickets disponíveis");
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  const fetchHistorico = useCallback(async () => {
    setLoadingHistorico(true);
    try {
      const data = await apiFetch("/api/estacionamento/historico-mes");
      setHistorico(data.solicitacoes || []);
    } catch {
      // silencioso
    } finally {
      setLoadingHistorico(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchHistorico();
  }, [fetchTickets, fetchHistorico]);

  // ─── Solicitar ───────────────────────────────────────────────────────────────

  async function handleSolicitar() {
    if (!opcaoSelecionada) return;
    const ticket = opcaoSelecionada === 2 ? ticket2h : ticket12h;
    if (!ticket) {
      toast.error("Ticket não disponível para esta duração");
      return;
    }
    setSolicitando(true);
    try {
      const data = await apiFetch("/api/estacionamento/solicitar", {
        method: "POST",
        body: JSON.stringify({ ticket_id: ticket.id, duracao_solicitada: opcaoSelecionada }),
      });
      setQrResult(data);
      setShowQrModal(true);
      toast.success("Ticket solicitado! Seu QR Code está pronto.");
      setOpcaoSelecionada(null);
      fetchTickets();
      fetchHistorico();
    } catch (e: any) {
      toast.error(e.message || "Erro ao solicitar ticket");
    } finally {
      setSolicitando(false);
    }
  }

  async function handleVerQrHistorico(solicitacaoId: number, codigo: string) {
    try {
      const data = await apiFetch(`/api/estacionamento/solicitacao/${solicitacaoId}/qrcode`);
      setShowHistoricoQr({ qrCode: data.qrCode, codigo });
    } catch {
      toast.error("Erro ao carregar QR Code");
    }
  }

  function downloadQR(qrCode: string, filename: string) {
    const a = document.createElement("a");
    a.href = qrCode;
    a.download = `${filename}.png`;
    a.click();
    toast.success("QR Code baixado!");
  }

  const opcaoAtual    = PARKING_OPTIONS.find(o => o.horas === opcaoSelecionada);
  const ticketDaOpcao = opcaoSelecionada === 2 ? ticket2h : opcaoSelecionada === 12 ? ticket12h : null;

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #0a0e27 0%, #1e3a5f 50%, #0a0e27 100%)" }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 pb-10">

        {/* ─── Header ─── */}
        <div className="flex items-center gap-3 mb-6">
          <BackButton to="/estacionamento" variant="ghost" />

          {/* Ícone grande + título */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
              <Car className="w-7 h-7 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-white leading-tight truncate">
                Ticket de Estacionamento
              </h1>
              <p className="text-white/40 text-xs hidden sm:block">Escolha a duração e gere seu QR Code</p>
            </div>
          </div>

          {/* Botão Página Inicial */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setLocation("/")}
            className="shrink-0 text-white/40 hover:text-white h-9 px-2 gap-1.5 text-xs"
            title="Ir para página inicial"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Início</span>
          </Button>
        </div>

        {/* ─── Opções de Ticket ─── */}
        <section className="mb-7">
          <h2 className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">
            Opções Disponíveis
          </h2>

          {loadingTickets ? (
            <div className="flex items-center justify-center py-14">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PARKING_OPTIONS.map(opcao => {
                const ticket     = opcao.horas === 2 ? ticket2h : ticket12h;
                const disponivel = !!ticket;
                const selecionado = opcaoSelecionada === opcao.horas;

                return (
                  <button
                    key={opcao.horas}
                    type="button"
                    disabled={!disponivel}
                    onClick={() => disponivel && setOpcaoSelecionada(opcao.horas)}
                    className={`relative w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                      !disponivel
                        ? "border-white/5 bg-white/3 opacity-50 cursor-not-allowed"
                        : selecionado
                        ? "border-cyan-400/70 bg-cyan-500/15 shadow-lg shadow-cyan-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/8 cursor-pointer"
                    }`}
                  >
                    {selecionado && (
                      <span className="absolute top-3 right-3">
                        <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                      </span>
                    )}
                    {!disponivel && (
                      <span className="absolute top-3 right-3 flex items-center gap-1 text-xs text-white/30">
                        <AlertTriangle className="w-3.5 h-3.5" /> Indisponível
                      </span>
                    )}

                    <div className="flex items-end justify-between mb-3 pr-6">
                      <div>
                        <p className="text-white font-bold text-xl">{opcao.label}</p>
                        <p className="text-white/40 text-xs mt-0.5">{opcao.descricao}</p>
                      </div>
                      <p className="text-cyan-300 font-bold text-2xl shrink-0">{fmtCurrency(opcao.valor)}</p>
                    </div>

                    {disponivel && ticket ? (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-white/40 border-t border-white/8 pt-2.5 mt-1">
                        <Clock className="w-3 h-3 text-cyan-400/50 shrink-0" />
                        <span className="truncate">Cód: <span className="text-cyan-400/70 font-mono">{ticket.codigo}</span></span>
                        {ticket.data_validade && (
                          <span className="ml-auto shrink-0">Válido até {fmtDate(ticket.data_validade)}</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-white/20 border-t border-white/5 pt-2.5 mt-1">
                        Nenhum ticket disponível para esta duração
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Barra de confirmação + botão solicitar */}
          {opcaoSelecionada && (
            <div className="mt-4 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-white/50 text-xs">Você selecionou</p>
                <p className="text-white font-semibold">
                  {opcaoAtual?.label} — <span className="text-cyan-300">{fmtCurrency(opcaoAtual?.valor ?? 0)}</span>
                </p>
              </div>
              <Button
                onClick={handleSolicitar}
                disabled={solicitando || !ticketDaOpcao}
                className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {solicitando ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando...</>
                ) : (
                  <><QrCode className="w-4 h-4 mr-2" /> Gerar QR Code</>
                )}
              </Button>
            </div>
          )}
        </section>

        {/* ─── Histórico do Último Mês ─── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-cyan-400/70 shrink-0" />
            <h2 className="text-white/50 text-xs font-semibold uppercase tracking-widest">
              Meu Histórico — Últimos 30 dias
            </h2>
            {historico.length > 0 && (
              <span className="ml-1 bg-cyan-500/20 text-cyan-300 text-xs font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                {historico.length}
              </span>
            )}
          </div>

          {loadingHistorico ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            </div>
          ) : historico.length === 0 ? (
            <div className="text-center py-10 rounded-xl border border-white/8 bg-white/3">
              <History className="w-8 h-8 mx-auto mb-2 text-white/20" />
              <p className="text-white/30 text-sm">Nenhuma solicitação nos últimos 30 dias</p>
            </div>
          ) : (
            /* Cards para mobile / tabela para desktop */
            <>
              {/* Mobile: lista de cards */}
              <div className="flex flex-col gap-2 sm:hidden">
                {historico.map((s, idx) => (
                  <div
                    key={`sol-m-${s.id ?? idx}`}
                    className="rounded-xl border border-white/10 bg-white/4 p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-cyan-400 font-mono text-xs truncate">{s.ticket_codigo || "-"}</p>
                      <p className="text-white/70 text-sm font-medium mt-0.5">
                        {s.duracao_solicitada}h · {fmtCurrency(s.valor_pago)}
                      </p>
                      <p className="text-white/30 text-xs mt-0.5">{fmtDate(s.data_solicitacao)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${statusColor(s.status)}`}>
                        {statusLabel(s.status)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleVerQrHistorico(s.id, s.ticket_codigo)}
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-7 px-2 text-xs"
                      >
                        <QrCode className="w-3.5 h-3.5 mr-1" /> QR
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: tabela */}
              <div className="hidden sm:block rounded-xl overflow-hidden border border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        {["Ticket", "Duração", "Valor Pago", "Data", "Status", "QR Code"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {historico.map((s, idx) => (
                        <tr
                          key={`sol-d-${s.id ?? idx}`}
                          className="hover:bg-white/5 transition-colors"
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                        >
                          <td className="px-4 py-3 text-cyan-400 font-mono text-xs">{s.ticket_codigo || "-"}</td>
                          <td className="px-4 py-3 text-white/70">{s.duracao_solicitada}h</td>
                          <td className="px-4 py-3 text-white/80">{fmtCurrency(s.valor_pago)}</td>
                          <td className="px-4 py-3 text-white/40 text-xs">{fmtDate(s.data_solicitacao)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${statusColor(s.status)}`}>
                              {statusLabel(s.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleVerQrHistorico(s.id, s.ticket_codigo)}
                              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-7 px-2 text-xs"
                            >
                              <QrCode className="w-3.5 h-3.5 mr-1" /> Ver QR
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ─── Modal QR Code (nova solicitação) ─── */}
      {qrResult && (
        <Dialog open={showQrModal} onOpenChange={() => { setShowQrModal(false); setQrResult(null); }}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-xs sm:max-w-sm bg-[#0d1b2a] border border-white/10 text-white text-center p-4 sm:p-6">
            <DialogHeader className="mb-2">
              <DialogTitle className="text-white flex items-center justify-center gap-2 text-base">
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" /> Ticket Solicitado!
              </DialogTitle>
              <DialogDescription className="text-white/50 text-xs">
                Apresente este QR Code na entrada do estacionamento
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {/* QR Code — tamanho responsivo */}
              <div className="bg-white p-3 rounded-xl inline-block mx-auto">
                <img
                  src={qrResult.qrCode}
                  alt="QR Code"
                  className="w-36 h-36 sm:w-44 sm:h-44 mx-auto block"
                />
              </div>

              <div className="space-y-0.5 text-sm">
                <p className="text-cyan-400 font-mono font-bold text-sm">{qrResult.ticket?.codigo}</p>
                <p className="text-white/60 text-xs">{qrResult.ticket?.duracao}h — {fmtCurrency(qrResult.ticket?.valorPago)}</p>
              </div>

              <Button
                onClick={() => downloadQR(qrResult.qrCode, `qrcode-${qrResult.ticket?.codigo}`)}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white h-9 text-sm"
              >
                <Download className="w-4 h-4 mr-2" /> Baixar QR Code (PNG)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── Modal QR Code (histórico) ─── */}
      {showHistoricoQr && (
        <Dialog open={!!showHistoricoQr} onOpenChange={() => setShowHistoricoQr(null)}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-xs sm:max-w-sm bg-[#0d1b2a] border border-white/10 text-white text-center p-4 sm:p-6">
            <DialogHeader className="mb-2">
              <DialogTitle className="text-white flex items-center justify-center gap-2 text-base">
                <QrCode className="w-5 h-5 text-cyan-400 shrink-0" />
                <span className="truncate max-w-[180px]">QR — {showHistoricoQr.codigo}</span>
              </DialogTitle>
              <DialogDescription className="sr-only">QR Code do ticket</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="bg-white p-3 rounded-xl inline-block mx-auto">
                <img
                  src={showHistoricoQr.qrCode}
                  alt="QR Code"
                  className="w-36 h-36 sm:w-44 sm:h-44 mx-auto block"
                />
              </div>
              <Button
                onClick={() => downloadQR(showHistoricoQr.qrCode, `qrcode-${showHistoricoQr.codigo}`)}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white h-9 text-sm"
              >
                <Download className="w-4 h-4 mr-2" /> Baixar QR Code (PNG)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
