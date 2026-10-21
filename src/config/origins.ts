// src/config/origins.ts
import { env } from './env.js';

/**
 * Retorna a lista unificada de todas as origens autorizadas (CORS e Origin Guard)
 * tanto para o ambiente de desenvolvimento local quanto para produção no Azure.
 */
export function getAllowedOrigins(): string[] {
  const origins = new Set<string>();

  // 1. Origens Padrão de Desenvolvimento Local
  origins.add('http://localhost:5173');
  origins.add('http://localhost:3000');

  // 2. Origem do Back-end Hospedado no Azure
  origins.add('https://expresst13-gtazeuceene4a2d4.canadacentral-01.azurewebsites.net');

  // 3. Origens configuradas via variáveis de ambiente (suporta vírgulas para múltiplas origens)
  if (env.FRONTEND_ORIGIN) {
    env.FRONTEND_ORIGIN.split(',').forEach((orig) => {
      const trimmed = orig.trim().replace(/\/+$/, '');
      if (trimmed) origins.add(trimmed);
    });
  }

  if (env.API_ORIGIN) {
    env.API_ORIGIN.split(',').forEach((orig) => {
      const trimmed = orig.trim().replace(/\/+$/, '');
      if (trimmed) origins.add(trimmed);
    });
  }

  return Array.from(origins);
}

/**
 * Valida se uma origem é permitida, suportando correspondência exata
 * e dinamicamente qualquer subdomínio do Azure Static Web Apps (*.azurestaticapps.net)
 * ou do Azure Web Apps (*.azurewebsites.net).
 */
export function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true;

  const trimmed = origin.trim().replace(/\/+$/, '');
  const allowed = getAllowedOrigins();

  // 1. Verificação exata (localhost, URLs estáticas, envs)
  if (allowed.includes(trimmed)) return true;

  // 2. Aceita automaticamente qualquer subdomínio do Azure Static Web Apps (inclui previews como .5.azurestaticapps.net)
  if (/^https:\/\/[a-z0-9-.]+\.azurestaticapps\.net$/i.test(trimmed)) {
    return true;
  }

  // 3. Aceita automaticamente domínios do Azure Web Apps
  if (/^https:\/\/[a-z0-9-.]+\.azurewebsites\.net$/i.test(trimmed)) {
    return true;
  }

  return false;
}

