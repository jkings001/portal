# Hospedagem do Portal JKINGS na Hostinger

## O que foi ajustado neste pacote
- página inicial refeita com visual mais maduro, inspirada em plataformas tech/educação de alto contraste
- proteção básica de rotas no front-end para evitar acesso direto sem login
- endpoint `/api/health` para monitoramento
- cabeçalhos HTTP básicos de segurança
- servidor em produção respeitando a porta definida pela Hostinger
- arquivo `.env.example` para evitar vazar credenciais reais

## Estrutura recomendada
- `jkings.solutions` para o site institucional
- `portal.jkings.solutions` para o portal de atendimento
- `api.jkings.solutions` apenas se você separar o backend depois

## Melhor prática de deploy
1. subir o projeto por Git, não por arrastar arquivos manualmente
2. manter `.env` apenas no servidor
3. rodar `pnpm install`
4. rodar `pnpm run build`
5. configurar entry point `dist/index.js`
6. validar `/api/health`
7. publicar o subdomínio do portal

## Banco de dados
- use um banco exclusivo para o portal
- use um usuário exclusivo do banco
- nunca deixe senha em PDF, ZIP ou repositório
- faça backup diário do banco e da pasta de uploads

## Produção
- o login atual continua mockado no front-end e deve ser trocado antes de uso real
- ideal: autenticação em banco com hash de senha usando bcrypt/argon2 e sessão segura
- ideal: reset de senha por e-mail
- ideal: auditoria de ações sensíveis

## Operação
- teste após deploy:
  - login
  - criação de ticket
  - listagem de tickets
  - upload de anexos
  - telas administrativas
  - healthcheck
