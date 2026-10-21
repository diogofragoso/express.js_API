<!-- Documento: docs/14-front-end-react-rbac.md -->

# 14 · Front-end em React com controle de acesso por perfil (Aluno e Professor)

[← Anterior](13-controle-de-acesso-com-rbac.md) · [Índice](../README.md) · **Etapa 14 de 14**

**Ponto de partida:** A API Express deve estar em execução em `http://localhost:3000` (ou na nuvem no Azure: `https://expresst13-gtazeuceene4a2d4.canadacentral-01.azurewebsites.net`). O front-end React está estruturado na pasta `React-App`, utilizando **React 19 + TypeScript + Vite + React-Bootstrap + React Router**, conectado à API via Axios com suporte híbrido a HttpOnly Cookies e cabeçalhos `Authorization: Bearer <token>`.

---

## 🎯 Resultado desta etapa

Uma aplicação web moderna com isolamento estrito de rotas e perfis de usuários:

1. **Tela de Login com Modal de Cadastro:**
   - Permite que novos usuários se cadastrem como **Aluno** (`userTypeId: 2`) ou **Professor** (`userTypeId: 3`) diretamente por um modal Bootstrap.
   - Autentica o usuário, recebe o token JWT e identifica o perfil (`role: 'aluno' | 'professor' | 'admin'`).
2. **Tela Exclusiva do Aluno (`src/pages/Aluno/`):**
   - Acessível apenas por contas com perfil `aluno`.
   - Exibe dados cadastrais, disciplinas em andamento e notas.
   - **Bloqueio total:** se o Aluno tentar acessar `/professor`, o guardião de rota intercepta e redireciona para a tela de Acesso Negado (403).
3. **Tela Exclusiva do Professor (`src/pages/Professor/`):**
   - Acessível apenas por contas com perfil `professor`.
   - Exibe painel pedagógico, turmas coordenadas e ações para lançamento de notas e chamada.
   - **Bloqueio total:** se o Professor tentar acessar `/aluno`, o guardião de rota intercepta e redireciona para a tela de Acesso Negado (403).
4. **Guardião de Rotas (`ProtectedRoute.tsx`):**
   - Avalia a autenticação e a lista de papéis permitidos (`allowedRoles`).
   - Garante que **um não possa visualizar a tela do outro**.
5. **Tela de Acesso Negado (`src/pages/Unauthorized/`):**
   - Apresenta feedback visual amigável (403) informando a incompatibilidade do perfil e botões para voltar à respectiva área correta.

---

## 📊 Matriz de Permissões das Rotas no React

| Rota | Tela | Visitante (Sem Login) | Perfil ALUNO | Perfil PROFESSOR | Regra de Isolamento |
|---|---|:---:|:---:|:---:|---|
| `/` | Home | Acesso Livre | Acesso Livre | Acesso Livre | Apresenta os atalhos e status da sessão |
| `/login` | Login & Cadastro | Acesso Livre | Redireciona p/ `/aluno` | Redireciona p/ `/professor` | Login e modal de autocadastro |
| `/aluno` | Painel do Aluno | Redireciona p/ `/login` | **✅ Permitido** | **🚫 403 Bloqueado** | Professor **não** pode visualizar tela de Aluno |
| `/professor` | Painel do Professor | Redireciona p/ `/login` | **🚫 403 Bloqueado** | **✅ Permitido** | Aluno **não** pode visualizar tela de Professor |
| `/unauthorized` | Acesso Negado (403) | Acesso Livre | Acesso Livre | Acesso Livre | Mensagem explicativa e retorno seguro |

---

## 🏗️ Estrutura de Arquivos no Front-end (`React-App`)

```text
React-App/
├── public/
│   ├── staticwebapp.config.json   # Regras de roteamento SPA e fallback F5 no Azure
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── ProtectedRoute.tsx     # Guardião que impede Aluno ver Professor e vice-versa
│   ├── context/
│   │   └── AuthContext.tsx        # Contexto global: user, token, login, logout
│   ├── pages/
│   │   ├── Home/
│   │   │   └── index.tsx          # Página inicial com links de teste de proteção
│   │   ├── Login/
│   │   │   └── index.tsx          # Login com Modal de cadastro (Aluno / Professor)
│   │   ├── Aluno/
│   │   │   └── index.tsx          # Tela exclusiva do Aluno
│   │   ├── Professor/
│   │   │   └── index.tsx          # Tela exclusiva do Professor
│   │   └── Unauthorized/
│   │       └── index.tsx          # Tela amigável 403 (Acesso Negado)
│   ├── routes/
│   │   └── index.tsx              # Declaração das rotas públicas e protegidas
│   ├── services/
│   │   └── api.ts                 # Instância Axios com cookies e Bearer token
│   ├── types/
│   │   └── index.ts               # Tipagens TypeScript (User, CreateUserInput, etc.)
│   ├── App.tsx                    # BrowserRouter + AuthProvider + AppRoutes
│   └── main.tsx
├── .env.development               # VITE_API_URL=http://localhost:3000
├── .env.production                # VITE_API_URL=https://expresst13...azurewebsites.net
├── package.json
└── vite.config.ts
```

---

## 1. Contexto de Autenticação (`src/context/AuthContext.tsx`)

Gerencia o estado de autenticação em toda a aplicação, mantendo o usuário logado após recarregar a página e integrando com o `localStorage`:

```typescript
// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginCredentials, LoginResponse } from '../types';
import { api } from '../services/api';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  token: null,
  loading: false,
  login: async () => { throw new Error('AuthProvider não inicializado.'); },
  logout: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedToken) setToken(savedToken);
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    const response = await api.post<LoginResponse>('/login', credentials);
    const { token: receivedToken, user: loggedUser } = response.data;

    if (receivedToken) {
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
    }
    localStorage.setItem('user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    return loggedUser;
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  return context ?? defaultAuthContext;
}
```

---

## 2. Guardião de Rotas com Isolamento de Perfis (`src/components/ProtectedRoute.tsx`)

O segredo para garantir que **um perfil não consiga visualizar a tela do outro** está na conferência do array `allowedRoles`:

```typescript
// src/components/ProtectedRoute.tsx
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner, Container } from 'react-bootstrap';

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </Spinner>
      </Container>
    );
  }

  // 1. Visitante sem login -> redireciona para a tela de login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = (user.role || '').toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map((r) => r.toLowerCase());

  // 2. Perfil não autorizado para esta rota -> redireciona para /unauthorized
  if (!normalizedAllowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 3. Acesso autorizado para o perfil correto
  return <>{children}</>;
}
```

---

## 3. Configuração de Rotas Protegidas (`src/routes/index.tsx`)

As rotas são associadas às suas permissões correspondentes:

```typescript
// src/routes/index.tsx
import { Routes, Route } from 'react-router-dom';
import { Home } from '../pages/Home';
import { Login } from '../pages/Login';
import { Aluno } from '../pages/Aluno';
import { Professor } from '../pages/Professor';
import { Unauthorized } from '../pages/Unauthorized';
import { ProtectedRoute } from '../components/ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Rota Protegida Exclusiva para Alunos */}
      <Route
        path="/aluno"
        element={
          <ProtectedRoute allowedRoles={['aluno']}>
            <Aluno />
          </ProtectedRoute>
        }
      />

      {/* Rota Protegida Exclusiva para Professores */}
      <Route
        path="/professor"
        element={
          <ProtectedRoute allowedRoles={['professor']}>
            <Professor />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

---

## 4. Deploy no Azure Static Web Apps: Evitando Erro 404 no F5 (`staticwebapp.config.json`)

Como utilizamos o `react-router-dom`, as rotas (`/login`, `/aluno`, `/professor`, etc.) são resolvidas pelo JavaScript no navegador (Single Page Application - SPA). Ao dar **F5** ou acessar uma rota diretamente pela URL em produção, o servidor web tradicional tentará buscar uma pasta física no disco e retornará **404 Not Found**.

Para resolver isso no **Azure Static Web Apps**, adicionamos o arquivo [`public/staticwebapp.config.json`](file:///C:/Users/diogo.fsilva/Documents/T13/React-App/public/staticwebapp.config.json). Durante o `npm run build`, o Vite copia esse arquivo automaticamente para a raiz de `dist/`:

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/*.{png,jpg,gif,ico,svg}"]
  },
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html",
      "statusCode": 200
    }
  }
}
```

- **`navigationFallback`**: redireciona qualquer requisição de rota de página para o `/index.html`, permitindo que o `react-router-dom` processe a rota sem erro 404.
- **`exclude`**: impede que arquivos estáticos reais (CSS, JS, imagens) sejam reescritos caso estejam faltando.

---

## 🧪 Como Testar o Isolamento na Prática

1. Inicie a API e o React nos respectivos terminais:
   ```bat
   # Terminal 1 (API Express)
   cd express.js_API
   npm.cmd run dev

   # Terminal 2 (React Frontend)
   cd React-App
   npm.cmd run dev
   ```
2. Acesse `http://localhost:5173/login`.
3. Abra o modal **"Cadastre-se como Aluno ou Professor"**:
   - Cadastre uma conta como **Aluno** (ex: `aluno@teste.com`).
   - Cadastre outra conta como **Professor** (ex: `professor@teste.com`).
4. **Teste 1: Usuário Aluno logado:**
   - Faça login com a conta de aluno.
   - O sistema o leva automaticamente para `/aluno`.
   - Clique em **"Tentar Acessar Área do Professor"** (ou digite `/professor` na URL).
   - O React intercepta a navegação e exibe a tela **403 - Acesso Negado**.
5. **Teste 2: Usuário Professor logado:**
   - Faça logout e entre com a conta do professor.
   - O sistema o leva automaticamente para `/professor`.
   - Clique em **"Tentar Acessar Área do Aluno"** (ou digite `/aluno` na URL).
   - O React intercepta a navegação e exibe a tela **403 - Acesso Negado**.
6. **Teste 3: Recarregar a página (F5):**
   - Em qualquer tela protegida (`/aluno` ou `/professor`), pressione F5. A sessão permanece ativa graças ao `localStorage` e ao `staticwebapp.config.json`.
