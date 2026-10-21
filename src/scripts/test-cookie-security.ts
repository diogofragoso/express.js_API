// Arquivo: src/scripts/test-cookie-security.ts
import assert from 'node:assert';
import { getCookieOptions } from '../controllers/auth.controller.js';
import type { Request } from 'express';

console.log('🧪 Iniciando Testes Automatizados de Emissão de Cookies HttpOnly...');

// Teste 1: Requisição simulada do Azure Static Web Apps (HTTPS via proxy ARR)
{
  const mockReqAzure = {
    secure: true,
    get: (header: string) => {
      if (header.toLowerCase() === 'x-forwarded-proto') return 'https';
      if (header.toLowerCase() === 'origin') return 'https://green-pond-0f2bcd00f.5.azurestaticapps.net';
      return undefined;
    },
  } as unknown as Request;

  const options = getCookieOptions(mockReqAzure);
  assert.strictEqual(options.httpOnly, true, 'O cookie DEVE ser httpOnly!');
  assert.strictEqual(options.secure, true, 'O cookie no Azure DEVE ser secure: true!');
  assert.strictEqual(options.sameSite, 'none', 'O cookie no Azure DEVE ser sameSite: none para requisições cross-domain!');
  assert.strictEqual(options.path, '/', 'O path do cookie DEVE ser "/"!');
  console.log('✅ Teste 1 PASSOU: Cookie configurado com HttpOnly, Secure=true e SameSite=None para Azure Static Web Apps.');
}

// Teste 2: Requisição onde NODE_ENV não foi configurado (default development) mas vem via HTTPS do Azure
{
  const mockReqAzureHttp = {
    secure: false, // Node vê HTTP atrás do proxy
    get: (header: string) => {
      if (header.toLowerCase() === 'x-forwarded-proto') return 'https'; // Mas ARR informa HTTPS
      if (header.toLowerCase() === 'origin') return 'https://green-pond-0f2bcd00f.azurestaticapps.net';
      return undefined;
    },
  } as unknown as Request;

  const options = getCookieOptions(mockReqAzureHttp);
  assert.strictEqual(options.httpOnly, true, 'O cookie DEVE ser httpOnly!');
  assert.strictEqual(options.secure, true, 'Mesmo sem NODE_ENV=production, X-Forwarded-Proto garante secure: true!');
  assert.strictEqual(options.sameSite, 'none', 'SameSite DEVE ser none para não ser bloqueado pelo navegador!');
  console.log('✅ Teste 2 PASSOU: Resiliência comprovada! Mesmo sem NODE_ENV=production no Azure, o cookie é emitido com Secure e SameSite=None.');
}

// Teste 3: Requisição local de desenvolvimento (http://localhost:5173 para http://localhost:3000)
{
  const mockReqLocal = {
    secure: false,
    get: (header: string) => {
      if (header.toLowerCase() === 'origin') return 'http://localhost:5173';
      return undefined;
    },
  } as unknown as Request;

  const options = getCookieOptions(mockReqLocal);
  assert.strictEqual(options.httpOnly, true, 'Em localhost o cookie DEVE continuar sendo httpOnly!');
  assert.strictEqual(options.secure, false, 'Em localhost sem HTTPS, secure DEVE ser false para o navegador aceitar!');
  assert.strictEqual(options.sameSite, 'lax', 'Em localhost, sameSite DEVE ser lax!');
  console.log('✅ Teste 3 PASSOU: Ambiente local continua funcionando perfeitamente em HTTP sem quebrar cookies.');
}

console.log('🎉 TODOS OS TESTES DE SEGURANÇA DE COOKIES PASSARAM COM SUCESSO!');

