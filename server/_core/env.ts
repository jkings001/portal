export const ENV = {
  // App
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",

  // Database — Railway MySQL
  databaseUrl: process.env.DATABASE_URL ?? "",
  mysqlUrl: process.env.MYSQL_URL ?? "",
  mysqlPublicUrl: process.env.MYSQL_PUBLIC_URL ?? "",
  mysqlHost: process.env.MYSQLHOST ?? "",
  mysqlPort: parseInt(process.env.MYSQLPORT ?? "3306", 10),
  mysqlUser: process.env.MYSQLUSER ?? "root",
  mysqlPassword: process.env.MYSQLPASSWORD ?? "",
  mysqlDatabase: process.env.MYSQL_DATABASE ?? "railway",
  mysqlRootPassword: process.env.MYSQL_ROOT_PASSWORD ?? "",

  // OAuth / URLs
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "https://jkings.solutions",
  frontendUrl: process.env.FRONTEND_URL ?? process.env.VITE_FRONTEND_URL ?? "https://jkings.solutions",

  // SMTP (Hostinger)
  smtpHost: process.env.SMTP_HOST ?? "smtp.hostinger.com",
  smtpPort: parseInt(process.env.SMTP_PORT ?? "465", 10),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPassword: process.env.SMTP_PASSWORD ?? "",
  smtpFrom: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "",

  // Runtime
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT ?? "3000", 10),

  // Manus built-in APIs
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // ─── Microsoft Teams Integration ─────────────────────────────────────────────
  // Obtenha no Azure AD → App Registrations → seu app
  teamsTenantId: process.env.TEAMS_TENANT_ID ?? "",
  teamsClientId: process.env.TEAMS_CLIENT_ID ?? "",
  teamsClientSecret: process.env.TEAMS_CLIENT_SECRET ?? "",

  // Segredo para validar webhooks do Microsoft Graph (clientState)
  teamsWebhookClientState: process.env.TEAMS_WEBHOOK_CLIENT_STATE ?? "teams-portal-online",

  // URLs públicas para receber notificações do Graph
  // Exemplo: https://seu-dominio.com/api/teams/webhook
  teamsNotificationUrl: process.env.TEAMS_NOTIFICATION_URL ?? "",
  teamsLifecycleUrl: process.env.TEAMS_LIFECYCLE_URL ?? "",

  // Recurso padrão para subscription (ex: /chats/getAllMessages)
  teamsDefaultResource: process.env.TEAMS_DEFAULT_RESOURCE ?? "/chats/getAllMessages",
};

