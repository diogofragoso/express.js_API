<!-- Documento: docs/14-front-end-react-rbac.md -->

# 14 · Front-end em React: RBAC (Aluno e Professor), Ambientes e Deploy no Azure

[← Anterior](13-controle-de-acesso-com-rbac.md) · [Índice](../README.md) · **Etapa 14 de 14**

**Ponto de partida:** A API Express pode ser executada localmente em `http://localhost:3000` ou consumida diretamente na nuvem (Azure App Service: `https://expresst13-gtazeuceene4a2d4.canadacentral-01.azurewebsites.net`). O front-end React está estruturado na pasta `React-App`, utilizando **React 19 + TypeScript + Vite + React-Bootstrap + React Router 7**, conectado à API via Axios com autenticação 100% segura por **Cookies HttpOnly**.

---

## 🎯 Resultado desta etapa

Uma aplicação web completa e pronta para produção, cobrindo:

1. **Tela de Login com Modal de Cadastro:**
   - Permite que novos usuários se cadastrem como **Aluno** (`userTypeId: 2`) ou **Professor** (`userTypeId: 3`) diretamente por um modal Bootstrap.
   - Autentica o usuário recebendo o cookie `HttpOnly` com o token JWT e identifica o perfil (`role: 'aluno' | 'professor' | 'admin'`).
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
5. **Autenticação Segura com Cookies HttpOnly (Sem LocalStorage):**
   - Elimina o armazenamento de tokens no `localStorage`, prevenindo vazamento de credenciais via ataques XSS.
   - Restauração de sessão real e automática ao dar F5 via chamada `GET /users` com `withCredentials: true`.
6. **Alternância entre Ambiente Local e Produção na Nuvem:**
   - Gerenciamento seguro por arquivos `.env` e scripts no `package.json`.
   - Boas práticas com `.gitignore` e modelo `.env.example`.
7. **Deploy no Azure Static Web Apps sem Erros:**
   - Correção do erro de pasta de artefatos do Vite (`dist` em vez de `build`).
   - Resolução do erro 404 ao dar F5 ou acessar URLs diretas (`staticwebapp.config.json`).

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
│   │   └── AuthContext.tsx        # Contexto global seguro (sessão via HttpOnly Cookie)
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
│   │   └── api.ts                 # Instância Axios com withCredentials: true
│   ├── types/
│   │   └── index.ts               # Tipagens TypeScript (User, CreateUserInput, etc.)
│   ├── App.tsx                    # BrowserRouter + AuthProvider + AppRoutes
│   └── main.tsx
├── .env.development               # VITE_API_URL=http://localhost:3000
├── .env.production                # VITE_API_URL=https://expresst13-gtazeuceene4a2d4.canadacentral-01.azurewebsites.net
├── .env.example                   # Modelo público para documentação
├── .gitignore                     # Ignora .env e arquivos de máquina local
├── package.json
└── vite.config.ts
```

---

## 1. Configuração de Ambientes e Boas Práticas (`.env`)

### Por que NÃO subir o `.env` no Git?
1. **Segurança no Front-end:** Qualquer variável com prefixo `VITE_` é inserida em texto aberto no código JavaScript compilado e fica acessível a qualquer usuário no navegador (`F12`). Segredos (chaves privadas, senhas de banco) **nunca** devem existir no front-end.
2. **Evitar Conflitos:** O arquivo `.env` reflete a máquina de quem está desenvolvendo. Subir o `.env` sobrescreveria a porta ou o endereço de outros colegas de equipe ao realizarem `git pull`.

### Arquivos de Ambiente Criados:

**Arquivo: `.env.development`** (usado no desenvolvimento local):
```env
# Ambiente de Desenvolvimento Local
VITE_API_URL=http://localhost:3000
```

**Arquivo: `.env.production`** (usado para deploy ou testes com a nuvem):
```env
# Ambiente de Produção (Azure App Service)
VITE_API_URL=https://expresst13-gtazeuceene4a2d4.canadacentral-01.azurewebsites.net
```

**Arquivo: `.env.example`** (modelo seguro que sobe no repositório):
```env
# Exemplo de configuração de ambiente para o Front-end
# Local:
# VITE_API_URL=http://localhost:3000
# Produção:
VITE_API_URL=https://expresst13-gtazeuceene4a2d4.canadacentral-01.azurewebsites.net
```

**Arquivo: `.gitignore`** (certifique-se de que os arquivos locais estão ignorados):
```gitignore
# Arquivos de Ambiente (Segurança e Isolamento Local)
.env
.env.local
.env.*.local
*.local

# Permite versionar apenas o modelo de exemplo
!.env.example
```

---

### Cliente HTTP com Cookies HttpOnly (`src/services/api.ts`)

O Axios carrega a URL automaticamente a partir da variável `import.meta.env.VITE_API_URL` e transporta os cookies HttpOnly em todas as requisições:

```typescript
// src/services/api.ts
import axios from 'axios';

// Obtém a URL da API da variável de ambiente ou usa localhost como padrão
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ESSENCIAL: envia cookies HttpOnly automaticamente
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Sessão expirada ou não autorizada na API:', API_BASE_URL);
    }
    return Promise.reject(error);
  }
);
```

> [!IMPORTANT]
> **Por que NUNCA usar `localStorage` para tokens JWT:**
> Salvar tokens no `localStorage` torna a aplicação vulnerável a ataques XSS (*Cross-Site Scripting*), pois qualquer script malicioso no navegador pode executar `localStorage.getItem('token')` e roubar a credencial. Com cookies `HttpOnly`, o JavaScript não tem acesso ao token e o navegador anexa o cookie automaticamente nas requisições graças ao `withCredentials: true`.

---

### Scripts de Alternância Rápida no `package.json`

Adicione scripts no `package.json` para alternar entre os ambientes com apenas um comando no terminal:

```json
"scripts": {
  "dev": "vite",
  "dev:prod": "vite --mode production",
  "build": "tsc -b && vite build --mode production",
  "build:local": "tsc -b && vite build --mode development",
  "lint": "oxlint",
  "preview": "vite preview"
}
```

- **`npm run dev`**: Executa o front-end local consumindo a API local (`http://localhost:3000`).
- **`npm run dev:prod`**: Executa o front-end local consumindo diretamente a API da Azure.
- **`npm run build`**: Gera o pacote otimizado apontando para a API de produção da Azure.

---

## 2. Contexto de Autenticação (`src/context/AuthContext.tsx`)

Gerencia a sessão global do usuário com segurança, restaurando a sessão diretamente através do cookie `HttpOnly` via `GET /users` ao recarregar a tela (F5), sem jamais expor o token no `localStorage`:

```typescript
// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginCredentials, LoginResponse } from '../types';
import { api } from '../services/api';

export interface AuthContextType {
  user: User | null;
  /** @deprecated O token JWT agora fica 100% protegido em cookie HttpOnly gerenciado pelo navegador */
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
  const [loading, setLoading] = useState<boolean>(true);

  // Restaura a sessão ao carregar a aplicação utilizando exclusivamente o cookie HttpOnly
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        // Envia requisição com withCredentials: true.
        // O navegador anexa automaticamente o cookie HttpOnly 'token'
        const response = await api.get<User[]>('/users');
        if (isMounted) {
          const currentUser = response.data?.[0] ?? null;
          setUser(currentUser);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          // Higienização de segurança: garante que o localStorage não contenha tokens antigos
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    // Ao efetuar login, o servidor Express define o cookie HttpOnly (token)
    // via cabeçalho Set-Cookie com SameSite=None (ou Lax) e Secure=true.
    const response = await api.post<LoginResponse>('/login', credentials);
    const { user: loggedUser } = response.data;

    // Higieniza o localStorage: o token NUNCA deve ser gravado no localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setUser(loggedUser);
    return loggedUser;
  };

  const logout = async () => {
    try {
      // Notifica o backend para invalidar e limpar o cookie HttpOnly (res.clearCookie)
      await api.post('/logout');
    } catch (err) {
      console.warn('Erro ao efetuar logout na API:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token: null, loading, login, logout }}>
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

## 3. Guardião de Rotas com Isolamento de Perfis (`src/components/ProtectedRoute.tsx`)

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

## 4. Configuração Centralizada de Rotas (`src/routes/index.tsx`)

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

      {/* Rota 404 amigável */}
      <Route
        path="*"
        element={
          <div className="container py-5 text-center">
            <h3>404 - Página não encontrada</h3>
            <a href="/" className="btn btn-primary mt-3">Voltar para o Início</a>
          </div>
        }
      />
    </Routes>
  );
}
```

---

## 5. Configuração do Back-end no Azure App Service

Para permitir requisições vindas do front-end na nuvem e local simultaneamente com cookies HttpOnly seguros:

1. **Proxy Reverso (`src/app.ts`):**
   ```typescript
   export const app = express();
   app.set('trust proxy', 1); // Indispensável atrás do proxy ARR da Azure
   ```
2. **Origens Autorizadas Dinâmicas ([`src/config/origins.ts`](file:///C:/Users/diogo.fsilva/Documents/T13/express.js_API/src/config/origins.ts)):**
   - Aceita `http://localhost:5173` e `http://localhost:3000` para testes locais.
   - Aceita dinamicamente qualquer subdomínio do Azure Static Web Apps (`*.azurestaticapps.net`, incluindo ambientes de preview como `.5.azurestaticapps.net`).
   - Lê qualquer URL adicional informada na variável `FRONTEND_ORIGIN` (separadas por vírgula).
3. **Validação de Origem em Mutações com Cookie ([`src/middlewares/auth.middleware.ts`](file:///C:/Users/diogo.fsilva/Documents/T13/express.js_API/src/middlewares/auth.middleware.ts)):**
   - Utiliza `isOriginAllowed(origin)` para validar dinamicamente chamadas com cookie do Static Web Apps.
4. **Cookies Cross-Domain Dinâmicos ([`src/controllers/auth.controller.ts`](file:///C:/Users/diogo.fsilva/Documents/T13/express.js_API/src/controllers/auth.controller.ts)):**
   - Utiliza a função `getCookieOptions(req)` para identificar dinamicamente conexões HTTPS ou chamadas remotas (`x-forwarded-proto`, `req.secure` ou origem externa do Azure Static Web Apps).
   - Aplica obrigatoriamente `secure: true` e `sameSite: 'none'`, impedindo que o navegador rejeite o cookie HttpOnly caso a variável `NODE_ENV` não esteja definida como `production` no Azure.
   - Em ambiente local (`localhost`), utiliza `secure: false` e `sameSite: 'lax'`.
   - Script de teste automatizado disponível em `src/scripts/test-cookie-security.ts`.
5. **Variáveis de Ambiente no Portal da Azure:**
   No portal Azure (**Seu App Service ➔ Configuração ➔ Configurações do Aplicativo**), defina:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: `postgresql://usuario:senha@host:5432/banco?sslmode=require`
   - `JWT_SECRET`: Chave secreta aleatória com mais de 32 caracteres.
   - `API_ORIGIN`: `https://expresst13-gtazeuceene4a2d4.canadacentral-01.azurewebsites.net`
   - `FRONTEND_ORIGIN`: `http://localhost:5173,https://green-pond-0f2bcd00f.5.azurestaticapps.net,https://green-pond-0f2bcd00f.azurestaticapps.net`
   - `SCM_DO_BUILD_DURING_DEPLOYMENT`: `false` (acelera o deploy no Kudu)

---

## 6. Deploy no Azure Static Web Apps: Como Evitar Erros Comuns

### ⚠️ Erro 1: "The app build failed to produce artifact folder: 'build'"
- **Causa:** O assistente da Azure sugere por padrão a predefinição "React" antiga (Create React App), que gera os arquivos na pasta `build`. O **Vite** gera o build na pasta **`dist`**!
- **Solução:** No arquivo de workflow do GitHub Actions (`.github/workflows/azure-static-web-apps-*.yml`), altere a linha `output_location`:
  ```yaml
  ###### Configuração do Build ######
  app_location: "/" 
  api_location: "" 
  output_location: "dist" # <-- Altere de "build" para "dist"
  ```

### ⚠️ Erro 2: Erro 404 ao dar F5 ou acessar URLs diretas (Fallback SPA)
- **Causa:** Por ser uma SPA (*Single Page Application*), rotas como `/login` ou `/aluno` existem apenas na memória do navegador. Ao dar F5, o servidor busca um arquivo `/login/index.html` inexistente no disco e retorna **404 Not Found**.
- **Solução:** Crie o arquivo `public/staticwebapp.config.json` no projeto React:
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
  O Vite copia automaticamente esse arquivo de `public/` para a raiz de `dist/` durante o `npm run build`.

---

## 🧪 Roteiro de Validação Prática em Sala de Aula

1. **Iniciar a aplicação localmente:**
   ```bat
   # Terminal 1: API
   cd express.js_API
   npm run dev

   # Terminal 2: React
   cd React-App
   npm run dev
   ```
2. **Testar Autocadastro de Perfis:**
   - Acesse `http://localhost:5173/login`.
   - Clique em **"Cadastre-se como Aluno ou Professor"**.
   - Crie uma conta de **Aluno** (`aluno@teste.com`) e uma de **Professor** (`professor@teste.com`).
3. **Testar Isolamento de Aluno:**
   - Faça login com o Aluno ➔ Sistema redireciona para `/aluno`.
   - Clique em **"Tentar Acessar Área do Professor"** (ou digite `/professor`).
   - O guardião de rota intercepta e exibe a tela **403 - Acesso Negado**.
4. **Testar Isolamento de Professor:**
   - Faça login com o Professor ➔ Sistema redireciona para `/professor`.
   - Clique em **"Tentar Acessar Área do Aluno"** (ou digite `/aluno`).
   - O guardião de rota intercepta e exibe a tela **403 - Acesso Negado**.
5. **Auditar o Armazenamento no DevTools (F12):**
   - Acesse **Application ➔ Storage ➔ Local Storage**: Confirme que `token` **NÃO** existe.
   - Acesse **Application ➔ Storage ➔ Cookies**: Confirme que o cookie `token` está presente com a marcação **HttpOnly** ativa.
6. **Testar F5 e Atualização de Página:**
   - Em qualquer tela protegida, aperte `F5`. O `useEffect` do `AuthProvider` dispara uma requisição `GET /users`, o navegador anexa o cookie `HttpOnly` e a sessão é mantida com sucesso.
