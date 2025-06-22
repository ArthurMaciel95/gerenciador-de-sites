# CMS Multi-Site com Sistema de Aprovação

Um sistema de gerenciamento de conteúdo (CMS) completo para múltiplos sites, construído com MERN stack (MongoDB, Express, React/Next.js, Node.js) e sistema de aprovação de usuários.

## 🚀 Funcionalidades

### Sistema de Aprovação de Usuários
- **Registro Público**: Novos usuários podem se registrar através da página `/register`
- **Aprovação Administrativa**: Apenas administradores podem aprovar novos usuários
- **Controle de Roles**: Apenas admins podem alterar permissões de usuários
- **Status de Aprovação**: Sistema de status (pendente, aprovado, rejeitado)
- **Bloqueio de Acesso**: Usuários pendentes/rejeitados não podem fazer login

### Gerenciamento de Sites
- **Multi-Site**: Gerencie múltiplos sites em uma única plataforma
- **Controle de Acesso**: Relacionamento many-to-many entre usuários e sites
- **Meta Tags**: Scraping automático de meta tags dos sites
- **Integração Analytics**: Suporte para Google Analytics e Facebook Pixel

### Sistema de Autenticação
- **JWT com Cookies**: Autenticação segura usando JWT em cookies httpOnly
- **Middleware de Proteção**: Rotas protegidas com verificação de autenticação
- **Logout Seguro**: Limpeza automática de cookies ao fazer logout

## 🏗️ Arquitetura

### Backend (Node.js + Express)
```
backend/
├── controllers/     # Lógica de negócio
├── models/         # Modelos do MongoDB
├── routes/         # Definição de rotas
├── middleware/     # Middlewares (auth, etc.)
├── utils/          # Utilitários (scraping, tokens)
└── index.js        # Servidor principal
```

### Frontend (Next.js + TypeScript)
```
frontend/
├── src/
│   ├── app/        # Páginas da aplicação
│   ├── components/ # Componentes reutilizáveis
│   └── middleware.ts # Middleware de autenticação
└── public/         # Arquivos estáticos
```

## 📋 Pré-requisitos

- Node.js (v16 ou superior)
- MongoDB (v4.4 ou superior)
- npm ou yarn

## 🛠️ Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd cms_privado
```

2. **Instale as dependências do backend**
```bash
cd backend
npm install
```

3. **Instale as dependências do frontend**
```bash
cd ../frontend
npm install
```

4. **Configure as variáveis de ambiente**
```bash
# No diretório backend, crie um arquivo .env
cp .env.example .env
```

Edite o arquivo `.env`:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/cms_privado
JWT_SECRET=sua_chave_secreta_aqui
PORT=3001
```

5. **Inicie o MongoDB**
```bash
# Certifique-se de que o MongoDB está rodando
mongod
```

6. **Inicie o backend**
```bash
cd backend
npm run dev
```

7. **Inicie o frontend**
```bash
cd frontend
npm run dev
```

## 🧪 Testando o Sistema

### Teste do Sistema de Aprovação
```bash
# Execute o script de teste
node test-approval.js
```

Este script testa:
- Registro de novo usuário
- Bloqueio de login para usuários pendentes
- Aprovação de usuário por admin
- Login bem-sucedido após aprovação
- Rejeição de usuário
- Bloqueio de login para usuários rejeitados

### Teste Manual da API
```bash
# Teste o backend diretamente
node test-backend.js
```

## 🔐 Fluxo de Aprovação

### 1. Registro Público
- Usuário acessa `/register`
- Preenche formulário com nome, email e senha
- Sistema cria usuário com status "pending" e role "pending"
- Usuário recebe mensagem de confirmação

### 2. Aprovação Administrativa
- Admin faz login no dashboard
- Acessa seção "Usuários" 
- Vê lista de usuários pendentes
- Clica em "Aprovar/Rejeitar"
- Define role (viewer, editor, admin)
- Aprova ou rejeita o usuário

### 3. Controle de Acesso
- Usuários pendentes: não podem fazer login
- Usuários aprovados: podem fazer login normalmente
- Usuários rejeitados: não podem fazer login
- Apenas admins podem alterar roles

## 📱 Páginas da Aplicação

### Páginas Públicas
- `/` - Landing page com informações do sistema
- `/login` - Página de login
- `/register` - Página de registro (requer aprovação)

### Páginas do Dashboard (Protegidas)
- `/dashboard` - Dashboard principal
- `/dashboard/users` - Gerenciamento de usuários
- `/dashboard/sites` - Gerenciamento de sites
- `/dashboard/settings` - Configurações
- `/dashboard/permissions` - Gerenciamento de permissões

## 🔧 Configuração do Proxy

O frontend está configurado com proxy para o backend para evitar problemas de CORS com cookies:

```typescript
// frontend/next.config.ts
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:3001/api/:path*',
    },
  ];
}
```

## 🚨 Segurança

- **Cookies HttpOnly**: Tokens JWT armazenados em cookies seguros
- **Validação de Entrada**: Todas as entradas são validadas
- **Controle de Acesso**: Middleware de autenticação em rotas protegidas
- **Hash de Senhas**: Senhas criptografadas com bcrypt
- **Aprovação Obrigatória**: Novos usuários precisam de aprovação

## 📊 Estrutura do Banco de Dados

### Modelo User
```javascript
{
  name: String,
  email: String (único),
  password: String (hash),
  role: ['admin', 'editor', 'viewer', 'pending'],
  approvalStatus: ['pending', 'approved', 'rejected'],
  approvedBy: ObjectId (ref: User),
  approvedAt: Date,
  sites: [ObjectId] (ref: Site),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Modelo Site
```javascript
{
  name: String,
  url: String,
  description: String,
  metaTags: {
    title: String,
    description: String,
    image: String
  },
  users: [ObjectId] (ref: User),
  googleAnalyticsId: String,
  facebookPixelId: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🐛 Solução de Problemas

### MongoDB não conecta
```bash
# Verifique se o MongoDB está rodando
mongod --version
# Inicie o MongoDB
mongod
```

### Erro de CORS
- Verifique se o proxy está configurado corretamente
- Certifique-se de que o backend está rodando na porta 3001

### Usuário não consegue fazer login
- Verifique se o usuário foi aprovado por um admin
- Confirme se o status de aprovação está como "approved"

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, envie um email para [seu-email@exemplo.com] ou abra uma issue no GitHub. 