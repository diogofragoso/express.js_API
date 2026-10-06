// Arquivo: src/routes/auth.route.ts
import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { loginSchema } from '../schemas/auth.schema.js';

/**
 * @openapi
 * /login:
 *   post:
 *     summary: Autenticar e receber token e cookie HttpOnly
 *     tags: [Autenticação]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *     responses:
 *       '200':
 *         description: Token válido por 15 minutos; cookie HttpOnly enviado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token: { type: string }
 *                 user: { $ref: '#/components/schemas/PublicUser' }
 *       '400': { description: Dados inválidos. }
 *       '401': { description: Credenciais inválidas. }
 *       '429': { description: Excesso de tentativas. }
 * /logout:
 *   post:
 *     summary: Limpar o cookie de autenticação
 *     tags: [Autenticação]
 *     security: []
 *     description: Tokens Bearer já emitidos continuam válidos até expirar.
 *     responses:
 *       '204': { description: Cookie removido, sem corpo. }
 */
const router = Router();
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/logout', AuthController.logout);
export default router;