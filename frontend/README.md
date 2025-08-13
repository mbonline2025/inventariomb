# Sistema de Gestão de Ativos - Frontend

Este é o frontend do Sistema de Gestão de Ativos, desenvolvido em React com Vite, Tailwind CSS e shadcn/ui.

## Funcionalidades

- **Autenticação**: Login e registro de usuários com diferentes níveis de acesso
- **Dashboard**: Visão geral com estatísticas e atividades recentes
- **Gestão de Hardware**: CRUD completo para itens de hardware
- **Gestão de Usuários**: Administração de usuários (apenas para admins)
- **Gestão de Fornecedores**: CRUD para fornecedores e parceiros
- **Chat com IA**: Assistente inteligente para consultas sobre o sistema

## Tecnologias Utilizadas

- React 18
- Vite
- Tailwind CSS
- shadcn/ui
- Lucide React (ícones)
- React Router DOM
- Fetch API para comunicação com backend

## Configuração

### Pré-requisitos

- Node.js 18+
- npm ou pnpm

### Instalação

1. Instale as dependências:
```bash
npm install
# ou
pnpm install
```

2. Configure o backend:
   - Certifique-se de que o backend está rodando na porta 3001
   - O frontend está configurado para se conectar em `http://localhost:3001/api`

### Executando o Projeto

```bash
npm run dev
# ou
pnpm run dev
```

O frontend estará disponível em `http://localhost:5173`

### Build para Produção

```bash
npm run build
# ou
pnpm run build
```

## Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes UI do shadcn/ui
│   ├── Layout.jsx      # Layout principal da aplicação
│   └── ProtectedRoute.jsx # Componente para rotas protegidas
├── contexts/           # Contextos React
│   └── AuthContext.jsx # Contexto de autenticação
├── pages/              # Páginas da aplicação
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── Hardware.jsx
│   ├── Users.jsx
│   ├── Vendors.jsx
│   └── Chat.jsx
├── services/           # Serviços e APIs
│   └── api.js          # Cliente API
├── App.jsx             # Componente principal
└── main.jsx            # Ponto de entrada
```

## Funcionalidades por Página

### Dashboard
- Estatísticas gerais do sistema
- Gráficos de status dos ativos
- Atividade recente
- Alertas de licenças próximas ao vencimento

### Hardware
- Listagem de todos os itens de hardware
- Busca e filtros
- Criação, edição e exclusão (para gestores e admins)
- Visualização detalhada dos itens

### Usuários
- Gestão completa de usuários (apenas admins)
- Diferentes níveis de acesso: Colaborador, Gestor, Administrador
- Criação, edição e exclusão de usuários

### Fornecedores
- Cadastro de fornecedores e parceiros
- Informações de contato e endereço
- Categorização por tipo (Loja Física, E-commerce, etc.)

### Chat IA
- Interface de chat com assistente IA
- Consultas sobre hardware, usuários e fornecedores
- Sugestões de perguntas comuns

## Níveis de Acesso

- **Colaborador**: Visualização de hardware, fornecedores e chat
- **Gestor**: Todas as funcionalidades do colaborador + criação/edição de hardware e fornecedores
- **Administrador**: Acesso completo incluindo gestão de usuários

## API Integration

O frontend se comunica com o backend através de uma API REST. Todas as requisições incluem:

- Autenticação via JWT tokens
- Refresh automático de tokens
- Tratamento de erros
- Interceptação de respostas 401 para redirecionamento ao login

## Responsividade

A interface é totalmente responsiva, funcionando bem em:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (até 767px)

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

