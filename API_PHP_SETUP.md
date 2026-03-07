# Setup da API PHP na Hostinger

## 📋 Arquivos Necessários

Você precisa fazer upload de 3 arquivos para a Hostinger:

1. **config.php** - Configuração de conexão com MySQL
2. **api.php** - Endpoints da API
3. **.htaccess** - Roteamento de requisições

## 🚀 Como Fazer Upload

### Opção 1: Usando FileZilla (Recomendado)

1. Abra FileZilla e conecte ao servidor FTP da Hostinger
2. Navegue até `public_html/`
3. Crie uma pasta chamada `api` (se não existir)
4. Faça upload dos 3 arquivos para `public_html/api/`:
   - `config.php`
   - `api.php`
   - `.htaccess`

### Opção 2: Usando Gerenciador de Arquivos da Hostinger

1. Acesse o painel Hostinger
2. Vá para "Gerenciador de Arquivos"
3. Navegue até `public_html/`
4. Crie uma pasta `api`
5. Faça upload dos 3 arquivos

## 📁 Estrutura Final Esperada

```
public_html/
├── index.html
├── api/
│   ├── config.php
│   ├── api.php
│   └── .htaccess
├── assets/
└── images/
```

## 🔧 Configuração

Os arquivos PHP já estão configurados com:
- Host: `auth-db718.hstgr.io`
- Usuário: `u856380736_jkings`
- Senha: `Jk1210**`
- Banco: `u856380736_portal`

**Se as credenciais mudarem, edite o arquivo `config.php` e atualize as constantes:**

```php
define('DB_HOST', 'seu_host');
define('DB_USER', 'seu_usuario');
define('DB_PASS', 'sua_senha');
define('DB_NAME', 'seu_banco');
```

## 🧪 Testando a API

Após fazer upload, teste a API acessando:

```
https://seudominio.com/api/listUsers
```

Você deve receber uma resposta JSON com a lista de usuários.

## 📡 Endpoints Disponíveis

### Autenticação
- `POST /api/login` - Fazer login
- `POST /api/logout` - Fazer logout
- `GET /api/getUser?userId=1` - Obter dados do usuário

### Chamados
- `GET /api/listTickets` - Listar todos os chamados
- `GET /api/getTicketsByUser?userId=1` - Listar chamados do usuário
- `POST /api/createTicket` - Criar novo chamado
- `POST /api/updateTicketStatus` - Atualizar status do chamado

### Notificações
- `GET /api/getNotifications?userId=1` - Listar notificações
- `POST /api/markNotificationAsRead` - Marcar como lida

### Usuários (Admin)
- `GET /api/listUsers` - Listar todos os usuários
- `POST /api/createUser` - Criar novo usuário
- `POST /api/updateUser` - Atualizar usuário
- `POST /api/deleteUser` - Deletar usuário

### Documentos
- `GET /api/listDocuments` - Listar documentos

### Treinamentos
- `GET /api/listTrainings` - Listar treinamentos

## 📝 Exemplo de Requisição

### Login
```bash
curl -X POST https://seudominio.com/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@jkings.com",
    "password": "senha123"
  }'
```

### Criar Chamado
```bash
curl -X POST https://seudominio.com/api/createTicket \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Problema com impressora",
    "description": "A impressora não está funcionando",
    "userId": 1,
    "userName": "João Silva",
    "department": "TI",
    "priority": "alta"
  }'
```

## ⚠️ Notas Importantes

1. **Segurança**: Em produção, implemente autenticação adequada e use prepared statements
2. **CORS**: A API permite requisições de qualquer origem (configure conforme necessário)
3. **Senha**: A senha está armazenada em texto plano no PHP. Use `password_hash()` em produção
4. **Validação**: Adicione validação mais robusta dos dados de entrada

## 🆘 Troubleshooting

### "Erro ao conectar ao banco de dados"
- Verifique se as credenciais estão corretas em `config.php`
- Confirme que o usuário tem permissão para conectar remotamente
- Verifique se a porta 3306 está aberta

### "Ação não encontrada"
- Certifique-se de que o arquivo `.htaccess` foi feito upload corretamente
- Verifique se o módulo `mod_rewrite` está ativado no servidor

### "Access Denied"
- Verifique as permissões dos arquivos (devem ser 644 para .php e .htaccess)
- Confirme que a pasta `api/` tem permissão 755
