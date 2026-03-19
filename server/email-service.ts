import nodemailer from 'nodemailer';

// Configurar transporter de e-mail
// Em produção, use variáveis de ambiente para credenciais
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Se não houver credenciais SMTP, apenas logar (modo desenvolvimento)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('[Email Service] Modo desenvolvimento - e-mail não enviado');
      console.log(`[Email Service] Para: ${options.to}`);
      console.log(`[Email Service] Assunto: ${options.subject}`);
      return true;
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log('[Email Service] E-mail enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email Service] Erro ao enviar e-mail:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  userName: string,
  resetLink: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperar Senha - Portal de Atendimento</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9fafb;
        }
        .header {
          background: linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%);
          color: white;
          padding: 30px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .content {
          background-color: white;
          padding: 30px;
          border-radius: 0 0 8px 8px;
          border: 1px solid #e5e7eb;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%);
          color: white;
          padding: 12px 30px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .footer {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
        .warning {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Recuperar Senha</h1>
          <p>Portal de Atendimento JKINGS</p>
        </div>
        <div class="content">
          <p>Olá <strong>${userName}</strong>,</p>
          
          <p>Recebemos uma solicitação para recuperar sua senha. Clique no botão abaixo para redefinir sua senha:</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Redefinir Senha</a>
          </div>
          
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 12px;">
            ${resetLink}
          </p>
          
          <div class="warning">
            <strong>⚠️ Atenção:</strong> Este link expira em 24 horas. Se você não solicitou esta recuperação de senha, ignore este e-mail.
          </div>
          
          <p>Por segurança, nunca compartilhe este link com ninguém.</p>
          
          <p>Atenciosamente,<br>Equipe JKINGS</p>
          
          <div class="footer">
            <p>Este é um e-mail automático. Por favor, não responda.</p>
            <p>&copy; 2026 JKINGS Soluções em Tecnologia. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Olá ${userName},

Recebemos uma solicitação para recuperar sua senha. Clique no link abaixo para redefinir sua senha:

${resetLink}

Este link expira em 24 horas. Se você não solicitou esta recuperação de senha, ignore este e-mail.

Por segurança, nunca compartilhe este link com ninguém.

Atenciosamente,
Equipe JKINGS
  `;

  return sendEmail({
    to: email,
    subject: 'Recuperar Senha - Portal de Atendimento JKINGS',
    html,
    text,
  });
}

export async function sendWelcomeEmail(
  email: string,
  userName: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bem-vindo - Portal de Atendimento</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9fafb;
        }
        .header {
          background: linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%);
          color: white;
          padding: 30px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .content {
          background-color: white;
          padding: 30px;
          border-radius: 0 0 8px 8px;
          border: 1px solid #e5e7eb;
        }
        .footer {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Bem-vindo!</h1>
          <p>Portal de Atendimento JKINGS</p>
        </div>
        <div class="content">
          <p>Olá <strong>${userName}</strong>,</p>
          
          <p>Sua conta foi criada com sucesso no Portal de Atendimento JKINGS!</p>
          
          <p>Agora você pode:</p>
          <ul>
            <li>Acessar seu dashboard pessoal</li>
            <li>Criar e gerenciar chamados</li>
            <li>Acompanhar o status de seus tickets</li>
            <li>Comunicar-se com nossa equipe de suporte</li>
          </ul>
          
          <p>Se tiver dúvidas, não hesite em entrar em contato conosco.</p>
          
          <p>Atenciosamente,<br>Equipe JKINGS</p>
          
          <div class="footer">
            <p>Este é um e-mail automático. Por favor, não responda.</p>
            <p>&copy; 2026 JKINGS Soluções em Tecnologia. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Bem-vindo ao Portal de Atendimento JKINGS',
    html,
  });
}

// ─── Notificação de novo chamado ──────────────────────────────────────────────
export interface TicketEmailData {
  requestId: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  description: string;
  userName: string;
  userEmail: string;
  companyName?: string;
  departmentName?: string;
  category?: string;
  createdAt: string;
  portalUrl?: string;
}

const TYPE_LABELS: Record<string, string> = {
  ticket: 'Chamado', request: 'Requisição', occurrence: 'Ocorrência',
};
const PRIORITY_LABELS: Record<string, string> = {
  critica: 'Crítica 🔴', alta: 'Alta 🟠', media: 'Média 🟡', baixa: 'Baixa 🟢',
};
const STATUS_LABELS: Record<string, string> = {
  aberto: 'Aberto', em_analise: 'Em Análise', em_andamento: 'Em Andamento',
  aguardando_aprovacao: 'Aguardando Aprovação', resolvido: 'Resolvido', fechado: 'Fechado',
};

export async function sendTicketCreatedEmail(
  to: string,
  ticket: TicketEmailData,
): Promise<boolean> {
  const typeLabel = TYPE_LABELS[ticket.type] || ticket.type;
  const priorityLabel = PRIORITY_LABELS[ticket.priority] || ticket.priority;
  const statusLabel = STATUS_LABELS[ticket.status] || ticket.status;
  const portalUrl = ticket.portalUrl || process.env.PORTAL_URL || 'https://jkings.team';
  const ticketUrl = `${portalUrl}/support`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Novo ${typeLabel} - ${ticket.requestId}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f1f5f9; }
        .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
        .card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); padding: 28px 32px; }
        .header h1 { color: #e2e8f0; font-size: 20px; margin: 0 0 4px; }
        .header p { color: #94a3b8; font-size: 13px; margin: 0; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #06b6d4; color: #fff; margin-top: 10px; }
        .body { padding: 28px 32px; }
        .field { margin-bottom: 14px; }
        .field label { display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 3px; }
        .field p { margin: 0; font-size: 14px; color: #1e293b; }
        .desc-box { background: #f8fafc; border-left: 3px solid #06b6d4; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 14px; color: #334155; white-space: pre-wrap; word-break: break-word; }
        .cta { text-align: center; padding: 20px 32px 28px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #06b6d4, #0ea5e9); color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; }
        .footer { background: #f8fafc; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 480px) { .grid { grid-template-columns: 1fr; } .body, .header, .cta, .footer { padding-left: 20px; padding-right: 20px; } }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">
          <div class="header">
            <h1>🎫 Novo ${typeLabel} Aberto</h1>
            <p>Portal de Atendimento JKINGS</p>
            <span class="badge">${ticket.requestId}</span>
          </div>
          <div class="body">
            <div class="field">
              <label>Título</label>
              <p><strong>${ticket.title}</strong></p>
            </div>
            <div class="grid">
              <div class="field">
                <label>Tipo</label>
                <p>${typeLabel}</p>
              </div>
              <div class="field">
                <label>Prioridade</label>
                <p>${priorityLabel}</p>
              </div>
              <div class="field">
                <label>Status</label>
                <p>${statusLabel}</p>
              </div>
              <div class="field">
                <label>Abertura</label>
                <p>${new Date(ticket.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div class="field">
                <label>Solicitante</label>
                <p>${ticket.userName}</p>
              </div>
              <div class="field">
                <label>E-mail</label>
                <p>${ticket.userEmail}</p>
              </div>
              ${ticket.companyName ? `<div class="field"><label>Empresa</label><p>${ticket.companyName}</p></div>` : ''}
              ${ticket.departmentName ? `<div class="field"><label>Departamento</label><p>${ticket.departmentName}</p></div>` : ''}
              ${ticket.category ? `<div class="field"><label>Categoria</label><p>${ticket.category}</p></div>` : ''}
            </div>
            <div class="field" style="margin-top:8px">
              <label>Descrição</label>
              <div class="desc-box">${ticket.description || 'Sem descrição.'}</div>
            </div>
          </div>
          <div class="cta">
            <a href="${ticketUrl}" class="btn">Ver no Portal →</a>
          </div>
          <div class="footer">
            <p>Este é um e-mail automático gerado pelo Portal de Atendimento JKINGS.</p>
            <p>&copy; ${new Date().getFullYear()} JKINGS Soluções em Tecnologia.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `[${ticket.requestId}] Novo ${typeLabel}: ${ticket.title}`,
    html,
    text: `Novo ${typeLabel} aberto: ${ticket.title}\nPrioridade: ${priorityLabel}\nSolicitante: ${ticket.userName} (${ticket.userEmail})\nDescrição: ${ticket.description}\nVer no portal: ${ticketUrl}`,
  });
}

export async function sendTicketStatusChangedEmail(
  to: string,
  ticket: { requestId: string; title: string; oldStatus: string; newStatus: string; changedBy: string; comment?: string },
): Promise<boolean> {
  const oldLabel = STATUS_LABELS[ticket.oldStatus] || ticket.oldStatus;
  const newLabel = STATUS_LABELS[ticket.newStatus] || ticket.newStatus;
  const portalUrl = process.env.PORTAL_URL || 'https://jkings.team';

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f1f5f9; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
        .card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); padding: 24px 32px; }
        .header h1 { color: #e2e8f0; font-size: 18px; margin: 0; }
        .body { padding: 24px 32px; }
        .status-change { display: flex; align-items: center; gap: 12px; background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
        .old { background: #e2e8f0; color: #64748b; }
        .new { background: #06b6d4; color: #fff; }
        .arrow { color: #94a3b8; font-size: 18px; }
        .cta { text-align: center; padding: 16px 32px 24px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #06b6d4, #0ea5e9); color: #fff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; }
        .footer { background: #f8fafc; padding: 14px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">
          <div class="header">
            <h1>🔄 Status Atualizado — ${ticket.requestId}</h1>
          </div>
          <div class="body">
            <p><strong>${ticket.title}</strong></p>
            <div class="status-change">
              <span class="status-badge old">${oldLabel}</span>
              <span class="arrow">→</span>
              <span class="status-badge new">${newLabel}</span>
            </div>
            <p style="font-size:13px;color:#64748b">Alterado por: <strong>${ticket.changedBy}</strong></p>
            ${ticket.comment ? `<p style="font-size:13px;color:#334155;background:#f8fafc;padding:12px;border-radius:8px;border-left:3px solid #06b6d4">${ticket.comment}</p>` : ''}
          </div>
          <div class="cta">
            <a href="${portalUrl}/tickets" class="btn">Ver Chamado →</a>
          </div>
          <div class="footer">
            <p>Portal de Atendimento JKINGS &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `[${ticket.requestId}] Status atualizado: ${oldLabel} → ${newLabel}`,
    html,
    text: `Chamado ${ticket.requestId} — ${ticket.title}\nStatus: ${oldLabel} → ${newLabel}\nAlterado por: ${ticket.changedBy}\nVer: ${portalUrl}/tickets`,
  });
}

// ─── Notificação de documento atribuído ──────────────────────────────────────
export interface DocumentAssignedEmailData {
  userName: string;
  userEmail: string;
  documentTitle: string;
  documentDescription?: string;
  documentCategory?: string;
  assignedBy?: string;
  portalUrl?: string;
  dueDate?: string;
}

export async function sendDocumentAssignedEmail(
  data: DocumentAssignedEmailData,
): Promise<boolean> {
  const portalUrl = data.portalUrl || process.env.PORTAL_URL || 'https://jkings.team';
  const termsUrl = `${portalUrl}/terms`;
  const categoryLabel = data.documentCategory || 'Documento';
  const now = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Novo Documento Atribuído - Portal JKINGS</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background: #f1f5f9; }
        .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
        .card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); padding: 28px 32px; text-align: center; }
        .header-icon { font-size: 40px; margin-bottom: 12px; }
        .header h1 { color: #e2e8f0; font-size: 20px; margin: 0 0 4px; }
        .header p { color: #94a3b8; font-size: 13px; margin: 0; }
        .body { padding: 28px 32px; }
        .greeting { font-size: 16px; color: #1e293b; margin-bottom: 16px; }
        .doc-card { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #2BDEFD; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
        .doc-title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
        .doc-meta { font-size: 12px; color: #64748b; margin: 0; }
        .doc-desc { font-size: 13px; color: #475569; margin: 10px 0 0; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: rgba(43,222,253,0.12); color: #0891b2; border: 1px solid rgba(43,222,253,0.25); margin-top: 8px; }
        .info-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 18px; margin: 20px 0; font-size: 13px; color: #92400e; }
        .info-box strong { color: #78350f; }
        .cta { text-align: center; padding: 20px 32px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%); color: #ffffff !important; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; letter-spacing: 0.02em; }
        .steps { background: #f8fafc; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
        .steps h3 { font-size: 13px; font-weight: 600; color: #475569; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.05em; }
        .step { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; font-size: 13px; color: #334155; }
        .step-num { background: #2BDEFD; color: #0f172a; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
        .footer { background: #f8fafc; padding: 20px 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">
          <div class="header">
            <div class="header-icon">📄</div>
            <h1>Novo Documento para Você</h1>
            <p>Portal de Atendimento JKINGS</p>
          </div>
          <div class="body">
            <p class="greeting">Olá, <strong>${data.userName}</strong>!</p>
            <p style="font-size:14px;color:#475569">
              Um novo documento foi atribuído a você e requer sua leitura e confirmação.
              Por favor, acesse o portal para visualizar e assinar digitalmente.
            </p>

            <div class="doc-card">
              <p class="doc-title">${data.documentTitle}</p>
              <p class="doc-meta">
                Atribuído em ${now}
                ${data.assignedBy ? ` · Por: <strong>${data.assignedBy}</strong>` : ''}
              </p>
              ${data.documentDescription ? `<p class="doc-desc">${data.documentDescription}</p>` : ''}
              <span class="badge">${categoryLabel}</span>
            </div>

            <div class="info-box">
              <strong>⚠️ Ação necessária:</strong> Este documento precisa ser lido e confirmado por você.
              Sua assinatura digital ficará registrada com data e hora.
            </div>

            <div class="steps">
              <h3>Como confirmar</h3>
              <div class="step"><span class="step-num">1</span><span>Acesse o portal clicando no botão abaixo</span></div>
              <div class="step"><span class="step-num">2</span><span>Vá em <strong>Meus Documentos</strong></span></div>
              <div class="step"><span class="step-num">3</span><span>Abra o documento e leia com atenção</span></div>
              <div class="step"><span class="step-num">4</span><span>Clique em <strong>Assinar Digitalmente</strong> para confirmar</span></div>
            </div>
          </div>
          <div class="cta">
            <a href="${termsUrl}" class="btn">Acessar Meus Documentos →</a>
          </div>
          <div class="footer">
            <p>Portal de Atendimento JKINGS &copy; ${new Date().getFullYear()}</p>
            <p>Este é um e-mail automático. Por favor, não responda.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Olá ${data.userName},

Um novo documento foi atribuído a você: "${data.documentTitle}"
Categoria: ${categoryLabel}
Atribuído em: ${now}
${data.assignedBy ? `Por: ${data.assignedBy}` : ''}

Acesse o portal para ler e assinar digitalmente:
${termsUrl}

Atenciosamente,
Equipe JKINGS
  `;

  return sendEmail({
    to: data.userEmail,
    subject: `📄 Novo documento para assinar: ${data.documentTitle}`,
    html,
    text,
  });
}
