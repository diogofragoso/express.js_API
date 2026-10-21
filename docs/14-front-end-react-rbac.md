<!-- Documento: docs/14-front-end-react-rbac.md -->

# 14 · Front-end em React com controle de acesso por perfil (RBAC)

[← Anterior](13-controle-de-acesso-com-rbac.md) · [Índice](../README.md) · **Etapa 14 de 14**

**Ponto de partida:** conclua o [capítulo 13](13-controle-de-acesso-com-rbac.md) antes de continuar. A API Express deve estar em execução em `http://localhost:3000`. O front-end será construído em uma pasta irmã chamada `web`, rodando na porta padrão do Vite `http://localhost:5173` (já autorizada no CORS e no origin guard da nossa API nos capítulos 5 e 7).

---

## Resultado desta etapa

Uma aplicação web em **React com TypeScript e Vite** onde a validação dos tipos de usuários é demonstrada logo nas primeiras atividades:

1. **Configuração de Ambiente e Rotas:** inicialização rápida com Vite e React Router.
2. **Tela de Login com JWT:** autenticação contra a API, recebimento do token JWT e identificação imediata do papel (`role: 'ALUNO' | 'ADMIN'`).
3. **Tela Específica do Usuário Padrão (Aluno):** área comum com dados da própria conta (`GET /users`) via Bearer token JWT.
4. **Tela Específica do Administrador:** painel restrito consumindo `GET /admin/users` com o JWT de administrador, exibindo a listagem de todos os usuários do sistema.
5. **Proteção de Rotas e Navegação:** bloqueio no front-end para impedir acesso indevido e comprovação de segurança real pelo back-end (status 403).

| Rota | Tela | Acesso Sem Login | Usuário Padrão (ALUNO) | Administrador (ADMIN) | O que a tela faz |
|---|---|---|---|---|---|
| `/login` | Login | Permitido | Redireciona | Redireciona | Envia credenciais, recebe e armazena o JWT e papel |
| `/aluno` | Painel do Aluno | Redireciona para `/login` | **Acesso Permitido** | Acesso Permitido | Exibe dados da conta do aluno via JWT e seus contatos |
| `/admin` | Painel do Administrador | Redireciona para `/login` | **403: Acesso Restrito** | **Acesso Permitido** | Consome `GET /admin/users` e lista todas as contas |
| `/403` | Acesso Negado | Redireciona para `/login` | Aviso visual | Aviso visual | Alerta de privilégio insuficiente |

---

## 1. Segurança no Front-end com JWT: Como funciona

**Propósito do passo:** compreender o fluxo do JWT do login às telas específicas.

1. O usuário preenche e-mail e senha na **Tela de Login**.
2. A API Express valida os dados no banco PostgreSQL e retorna um **JWT** assinado contendo o `id`, além do objeto com o papel (`role: "ALUNO"` ou `"ADMIN"`).
3. O React armazena o JWT e o papel do usuário no estado da aplicação e no `localStorage`.
4. Ao navegar:
   - Se o usuário for **ALUNO**, ele acessa `/aluno`. Se tentar acessar `/admin`, o React intercepta a rota e o direciona para a tela de Acesso Negado.
   - Se o usuário for **ADMIN**, ele acessa `/admin`. O React envia o cabeçalho `Authorization: Bearer <token_jwt>` para a rota `GET /admin/users` da API, que autoriza a entrega de todas as contas.

```mermaid
sequenceDiagram
    participant U as Usuário / Aluno
    participant R as React (Vite: 5173)
    participant A as API Express (3000)
    participant D as PostgreSQL (Prisma 8)

    U->>R: 1. Informa e-mail e senha na Tela de Login
    R->>A: 2. POST /login
    A->>D: 3. Consulta usuário e tipo_usuario
    D-->>A: 4. Retorna conta (ex: role = 'ALUNO' ou 'ADMIN')
    A-->>R: 5. Devolve JWT + { id, email, role }
    R->>R: 6. Salva JWT e papel no estado/storage
    alt Se for ADMIN
        R->>A: 7. GET /admin/users (Bearer JWT de Admin)
        A-->>R: 8. Status 200: Lista de todas as contas
        R-->>U: 9. Exibe Tela Específica do Admin
    else Se for ALUNO tentando acessar /admin
        R-->>U: 10. Bloqueio no Front: Tela 403 (Acesso Restrito)
        Note over R,A: Se forçar requisição direta:<br/>API retorna 403 Forbidden
    end
```

---

## 2. Configurar o Ambiente React, Rotas e Cliente HTTP

**Propósito do passo:** criar a pasta `web` com Vite, instalar o React Router e já estruturar as pastas do projeto separando as rotas em um arquivo dedicado (`src/routes/index.tsx`). Isso economiza tempo e mantém o `App.tsx` limpo desde o início.

Abra uma janela do terminal (CMD) no **diretório pai** da pasta da API (para manter `api` e `web` no mesmo nível):

```bat
npm.cmd create vite@latest web -- --template react-ts
cd web
npm.cmd install
npm.cmd install react-router-dom@7.1.5
```

A estrutura de arquivos será organizada da seguinte forma:

```text
web/
├── src/
│   ├── routes/
│   │   └── index.tsx          # Arquivo dedicado de rotas (AppRoutes)
│   ├── services/
│   │   └── api.ts             # Cliente HTTP com Bearer JWT automático
│   ├── context/
│   │   └── AuthContext.tsx    # Gerenciador do token JWT e dados do usuário
│   ├── pages/
│   │   ├── LoginPage.tsx      # Atividade 1: Tela de Login
│   │   ├── AlunoPage.tsx      # Atividade 2: Tela Específica do Usuário Padrão
│   │   ├── AdminPage.tsx      # Atividade 2: Tela Específica do Administrador
│   │   └── UnauthorizedPage.tsx
│   ├── components/
│   │   ├── Navbar.tsx         # Menu com opções conforme o papel
│   │   └── ProtectedRoute.tsx # Guardião de rotas por perfil
│   ├── App.tsx                # Componente raiz simplificado (BrowserRouter + Providers)
│   └── main.tsx
├── package.json
└── vite.config.ts
```

### Criar o cliente HTTP com envio do JWT

**Arquivo: `web/src/services/api.ts`**

Crie a pasta `src/services` e copie o código abaixo. Ele centraliza as chamadas para `http://localhost:3000` e anexa o token JWT automaticamente quando disponível:

<!-- file: web/src/services/api.ts -->
```typescript
// Arquivo: src/services/api.ts
const API_URL = 'http://localhost:3000';

export interface ApiError {
  error: string;
  status: number;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Anexa o JWT no padrão Bearer se estiver salvo
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // mantém suporte a cookies se aplicável
  });

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error: ApiError = {
      error: data.error || 'Erro na requisição.',
      status: response.status,
    };
    throw error;
  }

  return data as T;
}
```

---

## 3. Contexto de Autenticação com JWT

**Propósito do passo:** armazenar o token JWT e disponibilizar os dados e o papel (`role: 'ALUNO' | 'ADMIN'`) para toda a aplicação.

**Arquivo: `web/src/context/AuthContext.tsx`**

Crie a pasta `src/context` e adicione este arquivo:

<!-- file: web/src/context/AuthContext.tsx -->
```typescript
// Arquivo: src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

export type UserRole = 'ALUNO' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
  userTypeId: number;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserRole>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Restaura a sessão ao carregar a página utilizando o token salvo
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        setLoading(false);
        return;
      }
      try {
        const users = await apiRequest<User[]>('/users');
        if (users && users.length > 0) {
          setUser(users[0]);
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    void restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<UserRole> => {
    const data = await apiRequest<{ token: string; user: User }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user.role;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};
```

---

## 4. Atividade 1: Criar a Tela de Login

**Propósito do passo:** receber o e-mail e a senha do usuário, enviar para a API, receber o JWT e direcionar automaticamente o usuário para a sua tela específica conforme o papel retornado (`ALUNO` vai para `/aluno`, `ADMIN` vai para `/admin`).

**Arquivo: `web/src/pages/LoginPage.tsx`**

Crie a pasta `src/pages` e adicione este arquivo:

<!-- file: web/src/pages/LoginPage.tsx -->
```typescript
// Arquivo: src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      // 1. Envia credenciais e recebe o papel (role)
      const role = await login(email, password);

      // 2. Redirecionamento inteligente logo após o login com base no papel retornado
      if (role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/aluno');
      }
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setErrorMsg(apiErr.error || 'Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '3rem auto', padding: '2rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontFamily: 'sans-serif', backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', margin: '0 0 0.5rem 0', color: '#0f172a' }}>Entrar no Sistema</h2>
      <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Autenticação com JWT e validação de tipos de usuários
      </p>

      {errorMsg && (
        <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem', color: '#334155' }}>
            E-mail:
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="usuario@example.com"
            style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem', color: '#334155' }}>
            Senha:
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Senha da conta"
            style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: '#0284c7',
            color: '#fff',
            border: 'none',
            padding: '0.75rem',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '1rem',
            marginTop: '0.5rem'
          }}
        >
          {loading ? 'Validando JWT...' : 'Entrar'}
        </button>
      </form>

      {/* Dica para os alunos em aula */}
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '6px', fontSize: '0.8rem', color: '#475569', border: '1px solid #e2e8f0' }}>
        <strong>🎓 Contas para teste em aula:</strong>
        <div style={{ marginTop: '0.5rem' }}>
          <div>🔹 <strong>Usuário Padrão (Aluno):</strong> <code>ana-rbac@example.com</code> / <code>Estudo123!</code></div>
          <div style={{ marginTop: '0.3rem' }}>🛡️ <strong>Administrador:</strong> <code>bruno-rbac@example.com</code> / <code>Estudo123!</code></div>
        </div>
      </div>
    </div>
  );
};
```

---

## 5. Atividade 2: Criar as Telas Específicas por Tipo de Usuário

**Propósito do passo:** construir a tela do usuário comum e a tela administrativa para demonstrar na prática o comportamento de cada perfil após o login.

### A. Tela Específica do Usuário Padrão (`AlunoPage.tsx`)

Esta tela atende ao perfil `ALUNO`. Ela consome a rota pessoal `GET /users` enviando o JWT recebido no login e exibe a mensagem de que o usuário só pode gerenciar os dados da sua própria conta.

**Arquivo: `web/src/pages/AlunoPage.tsx`**

<!-- file: web/src/pages/AlunoPage.tsx -->
```typescript
// Arquivo: src/pages/AlunoPage.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';

interface Cliente {
  id: number;
  name: string;
  email: string;
}

export const AlunoPage: React.FC = () => {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);

  useEffect(() => {
    // Aluno autenticado pode consultar recursos gerais autorizados, como a lista de contatos do capítulo 10
    apiRequest<Cliente[]>('/clientes')
      .then(setClientes)
      .catch(() => setClientes([]))
      .finally(() => setLoadingClientes(false));
  }, []);

  if (!user) return null;

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem', fontFamily: 'sans-serif' }}>
      {/* Cabeçalho específico do Aluno */}
      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, color: '#1e40af' }}>🎓 Painel do Aluno (Usuário Padrão)</h2>
          <span style={{ backgroundColor: '#2563eb', color: '#fff', padding: '0.3rem 0.8rem', borderRadius: '9999px', fontWeight: 'bold', fontSize: '0.8rem' }}>
            Perfil: {user.role} (Tipo {user.userTypeId})
          </span>
        </div>
        <p style={{ margin: '0.8rem 0 0 0', color: '#1d4ed8', fontSize: '0.9rem' }}>
          Você está autenticado com um token JWT de usuário comum. Pelas regras de segurança da API, você só pode visualizar e alterar os seus próprios dados.
        </p>
      </div>

      {/* Dados Pessoais do Aluno */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>👤 Meus Dados Cadastrais</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.95rem' }}>
          <div><strong>ID:</strong> #{user.id}</div>
          <div><strong>Nome:</strong> {user.name || 'Não informado'}</div>
          <div><strong>E-mail:</strong> {user.email}</div>
          <div><strong>Conta criada em:</strong> {new Date(user.createdAt).toLocaleDateString('pt-BR')}</div>
        </div>
      </div>

      {/* Demonstração de restrição para o estudante */}
      <div style={{ backgroundColor: '#fff7ed', border: '1px dashed #fdba74', borderRadius: '8px', padding: '1.2rem', marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#9a3412' }}>🧪 Teste de Segurança Prático em Aula:</h4>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#c2410c' }}>
          Tente digitar diretamente na barra de endereços do seu navegador a rota <code>http://localhost:5173/admin</code>.
          O Guardião de Rotas do React vai ler o seu perfil e bloquear imediatamente o acesso, exibindo a tela 403!
        </p>
      </div>

      {/* Lista de Contatos/Clientes */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem 0' }}>📋 Contatos Compartilhados (Capítulo 10)</h3>
        {loadingClientes ? (
          <p>Carregando contatos...</p>
        ) : clientes.length === 0 ? (
          <p style={{ color: '#64748b' }}>Nenhum contato encontrado.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>ID</th>
                <th style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Nome</th>
                <th style={{ padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>E-mail</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(c => (
                <tr key={c.id}>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>#{c.id}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>{c.name}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>{c.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
```

---

### B. Tela Específica do Administrador (`AdminPage.tsx`)

Esta tela atende exclusivamente ao perfil `ADMIN`. Ao ser carregada, ela envia o JWT de administrador para a rota `GET /admin/users` criada no Capítulo 13 e exibe em tabela todas as contas do banco.

**Arquivo: `web/src/pages/AdminPage.tsx`**

<!-- file: web/src/pages/AdminPage.tsx -->
```typescript
// Arquivo: src/pages/AdminPage.tsx
import React, { useEffect, useState } from 'react';
import { apiRequest, ApiError } from '../services/api';
import { User, useAuth } from '../context/AuthContext';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [testResult, setTestResult] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Chama a rota administrativa passando o Bearer JWT do Admin
      const data = await apiRequest<User[]>('/admin/users');
      setUsers(data);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setErrorMsg(apiErr.error || 'Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  // Demonstração em aula: o que acontece se alguém fizer requisição sem o JWT do Admin?
  const testUnauthorizedCall = async () => {
    setTestResult('Enviando requisição sem token...');
    try {
      const res = await fetch('http://localhost:3000/admin/users');
      const data = await res.json();
      setTestResult(`Resposta da API: Status ${res.status} (${data.error})`);
    } catch {
      setTestResult('Falha na requisição.');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem', fontFamily: 'sans-serif' }}>
      {/* Cabeçalho do Admin */}
      <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, color: '#991b1b' }}>🛡️ Painel Exclusivo de Administração</h2>
            <p style={{ margin: '0.4rem 0 0 0', color: '#b91c1c', fontSize: '0.9rem' }}>
              Autenticado como: <strong>{user?.name || user?.email}</strong> — Permissão <code>users:read:any</code> ativa
            </p>
          </div>
          <button
            onClick={loadUsers}
            style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '0.6rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            🔄 Recarregar Dados
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Tabela de Gestão de Usuários */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>👥 Todas as Contas do Sistema (`GET /admin/users`)</h3>
        </div>

        {loading ? (
          <p style={{ padding: '1.5rem' }}>Consultando contas via API Express...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ padding: '0.75rem' }}>ID</th>
                <th style={{ padding: '0.75rem' }}>Nome</th>
                <th style={{ padding: '0.75rem' }}>E-mail</th>
                <th style={{ padding: '0.75rem' }}>Tipo</th>
                <th style={{ padding: '0.75rem' }}>Papel (Role)</th>
                <th style={{ padding: '0.75rem' }}>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>#{u.id}</td>
                  <td style={{ padding: '0.75rem' }}>{u.name || <span style={{ color: '#94a3b8' }}>Não informado</span>}</td>
                  <td style={{ padding: '0.75rem' }}>{u.email}</td>
                  <td style={{ padding: '0.75rem' }}>Tipo {u.userTypeId}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      backgroundColor: u.role === 'ADMIN' ? '#fee2e2' : '#dbeafe',
                      color: u.role === 'ADMIN' ? '#991b1b' : '#1e40af',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      fontSize: '0.8rem'
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#64748b' }}>
                    {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Demonstração didática de rejeição de requisição sem privilégio */}
      <div style={{ marginTop: '2rem', padding: '1.2rem', backgroundColor: '#f8fafc', border: '1px dashed #94a3b8', borderRadius: '8px' }}>
        <h4 style={{ margin: '0 0 0.4rem 0' }}>🧪 Demonstração: Por que o Back-end é o guardião real?</h4>
        <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.85rem', color: '#475569' }}>
          Clique no botão abaixo para disparar a mesma requisição sem o token JWT administrativo. O servidor responderá 401 ou 403:
        </p>
        <button
          onClick={testUnauthorizedCall}
          style={{ backgroundColor: '#475569', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          Disparar GET /admin/users sem credencial
        </button>
        {testResult && (
          <div style={{ marginTop: '0.6rem', padding: '0.6rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '0.85rem' }}>
            🔒 {testResult}
          </div>
        )}
      </div>
    </div>
  );
};
```

---

### C. Tela de Acesso Negado (`UnauthorizedPage.tsx`)

Exibida quando um usuário comum tenta navegar para `/admin`.

**Arquivo: `web/src/pages/UnauthorizedPage.tsx`**

<!-- file: web/src/pages/UnauthorizedPage.tsx -->
```typescript
// Arquivo: src/pages/UnauthorizedPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '480px', margin: '4rem auto', textAlign: 'center', padding: '2rem', border: '1px solid #fecaca', borderRadius: '8px', backgroundColor: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🚫</div>
      <h2 style={{ color: '#dc2626', margin: '0 0 0.5rem 0' }}>403 · Acesso Restrito</h2>
      <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: '1.5' }}>
        Seu usuário possui o perfil de <strong>ALUNO</strong>. Esta rota é restrita exclusivamente a contas com perfil de <strong>ADMIN</strong>.
      </p>
      <div style={{ marginTop: '1.5rem' }}>
        <Link
          to="/aluno"
          style={{
            backgroundColor: '#0284c7',
            color: '#fff',
            textDecoration: 'none',
            padding: '0.6rem 1.2rem',
            borderRadius: '4px',
            fontWeight: 'bold',
            display: 'inline-block'
          }}
        >
          Voltar para o Painel do Aluno
        </Link>
      </div>
    </div>
  );
};
```

---

## 6. Componentes de Rota Protegida e Barra de Navegação

**Propósito do passo:** conectar a lógica de papéis (`allowedRoles`) no roteador para impedir navegação indevida.

### A. Guardião de Rotas por Papel (`ProtectedRoute.tsx`)

**Arquivo: `web/src/components/ProtectedRoute.tsx`**

Crie a pasta `src/components` e copie:

<!-- file: web/src/components/ProtectedRoute.tsx -->
```typescript
// Arquivo: src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>Verificando permissões...</div>;
  }

  // 1. Sem autenticação -> tela de login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Sem o perfil necessário -> tela 403
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  // 3. Autorizado -> renderiza a tela
  return <Outlet />;
};
```

### B. Barra Superior com Menus Condicionais (`Navbar.tsx`)

Exibe a opção "Painel Admin" **somente** quando `user.role === 'ADMIN'`.

**Arquivo: `web/src/components/Navbar.tsx`**

<!-- file: web/src/components/Navbar.tsx -->
```typescript
// Arquivo: src/components/Navbar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.8rem 2rem',
      backgroundColor: '#0f172a',
      color: '#fff',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>🎓 Escola Dev</span>
        
        {/* Link sempre visível para usuários autenticados */}
        <Link to="/aluno" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Meu Painel</Link>

        {/* Link condicional: visível APENAS para ADMIN */}
        {user.role === 'ADMIN' && (
          <Link
            to="/admin"
            style={{
              color: '#f87171',
              textDecoration: 'none',
              fontWeight: 'bold',
              border: '1px solid #f87171',
              padding: '0.2rem 0.6rem',
              borderRadius: '4px'
            }}
          >
            🛡️ Painel Admin
          </Link>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.85rem' }}>
          {user.name || user.email}
        </span>
        <span style={{
          backgroundColor: user.role === 'ADMIN' ? '#dc2626' : '#2563eb',
          color: '#fff',
          fontSize: '0.75rem',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          fontWeight: 'bold'
        }}>
          {user.role}
        </span>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: '#334155',
            color: '#fff',
            border: 'none',
            padding: '0.4rem 0.8rem',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Sair
        </button>
      </div>
    </nav>
  );
};
```

---

## 7. Arquivo de Rotas Dedicado e Inicialização da Aplicação

**Propósito do passo:** isolar a declaração das rotas em `src/routes/index.tsx` (`AppRoutes`) para que o `App.tsx` permaneça enxuto e escalável.

### A. Arquivo de Rotas Separado (`src/routes/index.tsx`)

**Arquivo: `web/src/routes/index.tsx`**

Crie a pasta `src/routes` e copie todo o conteúdo abaixo. Todas as rotas públicas, protegidas e restritas por papel ficam concentradas aqui:

<!-- file: web/src/routes/index.tsx -->
```typescript
// Arquivo: src/routes/index.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { AlunoPage } from '../pages/AlunoPage';
import { AdminPage } from '../pages/AdminPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Rota pública de entrada */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rota para usuários autenticados (ALUNO e ADMIN) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/aluno" element={<AlunoPage />} />
      </Route>

      {/* Rota restrita APENAS a quem tem perfil ADMIN */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>

      {/* Rota informativa de erro 403 */}
      <Route path="/403" element={<UnauthorizedPage />} />

      {/* Redirecionamento padrão */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
```

### B. Componente Raiz Enxuto (`src/App.tsx`)

**Arquivo: `web/src/App.tsx`**

Com as rotas isoladas, o `App.tsx` fica limpo e desacoplado, apenas envelopando os provedores de contexto, a barra de navegação e as rotas:

<!-- file: web/src/App.tsx -->
```typescript
// Arquivo: src/App.tsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AppRoutes } from './routes';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <AppRoutes />
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
```

---

## 8. Roteiro Prático de Validação em Sala de Aula

**Propósito do passo:** testar a validação dos tipos de usuários na prática com os estudantes.

### 1. Iniciar os dois servidores

No **Terminal 1** (API Express):
```bat
cd api
npm.cmd run dev
```

No **Terminal 2** (React Vite):
```bat
cd web
npm.cmd run dev
```
Abra o navegador em `http://localhost:5173`.

---

### 2. Testar Login como Usuário Padrão (`ALUNO`)

1. Na tela de login, informe:
   - **E-mail:** `ana-rbac@example.com`
   - **Senha:** `Estudo123!`
2. Clique em **Entrar**:
   - A aplicação recebe o JWT e o papel `ALUNO`.
   - Você é redirecionado imediatamente para a tela **`/aluno`**.
   - Na barra superior, o badge azul indica **ALUNO**.
   - O botão "🛡️ Painel Admin" **não aparece**.
3. **Teste de violação de rota:**
   - Digite no navegador `http://localhost:5173/admin` e pressione Enter.
   - O React intercepta a rota e exibe a tela **403 · Acesso Restrito**.
4. Clique em **Sair**.

---

### 3. Testar Login como Administrador (`ADMIN`)

1. Na tela de login, informe:
   - **E-mail:** `bruno-rbac@example.com`
   - **Senha:** `Estudo123!`
2. Clique em **Entrar**:
   - A aplicação recebe o JWT e o papel `ADMIN`.
   - Você é redirecionado automaticamente para a tela **`/admin`**.
   - O badge vermelho indica **ADMIN** e o botão "🛡️ Painel Admin" fica visível.
   - A tabela lista com sucesso todos os usuários do sistema cadastrados no PostgreSQL.
3. Abra o DevTools (**F12 → Rede / Network**):
   - Localize a requisição `GET /admin/users`.
   - Em **Cabeçalhos da Requisição (Request Headers)**, confirme a presença de:
     `Authorization: Bearer eyJhbGciOiJIUzI1NiIs...` (o JWT do Admin).
   - O status retornado é **200 OK**.

---

## Conferência antes de concluir

- [ ] Ambiente React configurado na pasta `web` com Vite e TypeScript.
- [ ] Atividade 1 concluída: tela de login recebendo o JWT e identificando o papel.
- [ ] Atividade 2 concluída: telas específicas de `ALUNO` e `ADMIN` criadas e consumindo a API.
- [ ] Rota `/admin` protegida contra acessos de usuários do tipo `ALUNO`.
- [ ] JWT trafegado com sucesso no cabeçalho `Authorization: Bearer`.

[← Capítulo 13: RBAC na API](13-controle-de-acesso-com-rbac.md) · [Índice do Guia](../README.md)
