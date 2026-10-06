// Arquivo: src/routes/user.route.ts
import { Router } from 'express';
import * as UserController from '../controllers/user.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createUserSchema, updateUserSchema, userIdSchema } from '../schemas/user.schema.js';
import { authMiddleware, requireSelf } from '../middlewares/auth.middleware.js';

/**
 * @openapi
 * components:
 *   schemas:
 *     PublicUser:
 *       type: object
 *       properties:
 *         id: { type: integer, minimum: 1 }
 *         email: { type: string, format: email }
 *         name: { type: string, nullable: true }
 *         createdAt: { type: string, format: date-time }
 *     CreateUser:
 *       type: object
 *       additionalProperties: false
 *       required: [email, password]
 *       properties:
 *         email: { type: string, format: email, maxLength: 254 }
 *         name: { type: string, minLength: 2, maxLength: 100 }
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           description: Máximo de 72 bytes em UTF-8.
 *     UpdateUser:
 *       type: object
 *       additionalProperties: false
 *       minProperties: 1
 *       properties:
 *         email: { type: string, format: email, maxLength: 254 }
 *         name: { type: string, minLength: 2, maxLength: 100 }
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           description: Máximo de 72 bytes em UTF-8.
 * /users:
 *   post:
 *     summary: Cadastrar uma conta
 *     tags: [Usuários]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateUser' }
 *     responses:
 *       '201':
 *         description: Conta criada sem hash de senha na resposta.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PublicUser' }
 *       '400': { description: Dados inválidos. }
 *       '409': { description: E-mail já utilizado. }
 *       '429': { description: Limite de requisições. }
 *   get:
 *     summary: Listar somente a própria conta
 *     tags: [Usuários]
 *     responses:
 *       '200':
 *         description: Lista com a própria conta.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/PublicUser' }
 *       '401': { description: Token ausente ou inválido. }
 * /users/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema: { type: integer, minimum: 1, maximum: 2147483647 }
 *       description: ID da própria conta.
 *   get:
 *     summary: Consultar a própria conta
 *     tags: [Usuários]
 *     responses:
 *       '200':
 *         description: Conta encontrada.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PublicUser' }
 *       '400': { description: ID inválido. }
 *       '401': { description: Token ausente ou inválido. }
 *       '403': { description: Conta de outro usuário. }
 *       '404': { description: Conta inexistente. }
 *   put:
 *     summary: Atualizar campos da própria conta
 *     tags: [Usuários]
 *     description: Somente os campos enviados são alterados; corpo vazio é rejeitado.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateUser' }
 *     responses:
 *       '200':
 *         description: Conta atualizada.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PublicUser' }
 *       '400': { description: Dados inválidos. }
 *       '401': { description: Token ausente ou inválido. }
 *       '403': { description: Conta alheia ou origem de cookie não permitida. }
 *       '404': { description: Conta inexistente. }
 *       '409': { description: E-mail já utilizado. }
 *   delete:
 *     summary: Excluir a própria conta
 *     tags: [Usuários]
 *     responses:
 *       '204': { description: Conta excluída, sem corpo. }
 *       '400': { description: ID inválido. }
 *       '401': { description: Token ausente ou inválido. }
 *       '403': { description: Conta alheia ou origem de cookie não permitida. }
 *       '404': { description: Conta inexistente. }
 */
const router = Router();
router.post('/users', validate(createUserSchema), UserController.createUser);
router.get('/users', authMiddleware, UserController.getAllUsers);
router.get('/users/:id', authMiddleware, validate(userIdSchema), requireSelf, UserController.getUserById);
router.put('/users/:id', authMiddleware, validate(updateUserSchema), requireSelf, UserController.updateUser);
router.delete('/users/:id', authMiddleware, validate(userIdSchema), requireSelf, UserController.deleteUser);
export default router;