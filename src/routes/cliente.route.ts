import { Router } from "express";
import * as ClienteController from "../controllers/cliente.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createClienteSchema, updateClienteSchema, clienteIdSchema } from "../schemas/cliente.schema.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     PublicCliente:
 *       type: object
 *       properties:
 *         idCliente: { type: integer, minimum: 1 }
 *         nomeCliente: { type: string, nullable: true }
 *         emailCliente: { type: string, format: email, nullable: true }
 *     CreateCliente:
 *       type: object
 *       additionalProperties: false
 *       required: [emailCliente]
 *       properties:
 *         nomeCliente: { type: string, minLength: 2, maxLength: 100 }
 *         emailCliente: { type: string, format: email, maxLength: 254 }
 *     UpdateCliente:
 *       type: object
 *       additionalProperties: false
 *       minProperties: 1
 *       properties:
 *         nomeCliente: { type: string, minLength: 2, maxLength: 100 }
 *         emailCliente: { type: string, format: email, maxLength: 254 }
 * /clientes:
 *   post:
 *     summary: Cadastrar um cliente
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateCliente' }
 *     responses:
 *       '201':
 *         description: Cliente criado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PublicCliente' }
 *       '400': { description: Dados inválidos. }
 *       '401': { description: Token ausente ou inválido. }
 *       '409': { description: E-mail de cliente já utilizado. }
 *   get:
 *     summary: Listar clientes
 *     tags: [Clientes]
 *     responses:
 *       '200':
 *         description: Lista de clientes.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/PublicCliente' }
 *       '401': { description: Token ausente ou inválido. }
 * /clientes/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema: { type: integer, minimum: 1, maximum: 2147483647 }
 *       description: ID do cliente.
 *   get:
 *     summary: Consultar um cliente
 *     tags: [Clientes]
 *     responses:
 *       '200':
 *         description: Cliente encontrado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PublicCliente' }
 *       '400': { description: ID inválido. }
 *       '401': { description: Token ausente ou inválido. }
 *       '404': { description: Cliente inexistente. }
 *   put:
 *     summary: Atualizar campos do cliente
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UpdateCliente' }
 *     responses:
 *       '200':
 *         description: Cliente atualizado.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PublicCliente' }
 *       '400': { description: Dados inválidos. }
 *       '401': { description: Token ausente ou inválido. }
 *       '404': { description: Cliente inexistente. }
 *       '409': { description: E-mail de cliente já utilizado. }
 *   delete:
 *     summary: Excluir um cliente
 *     tags: [Clientes]
 *     responses:
 *       '204': { description: Cliente removido. }
 *       '400': { description: ID inválido. }
 *       '401': { description: Token ausente ou inválido. }
 *       '404': { description: Cliente inexistente. }
 */

router.post("/clientes", authMiddleware, validate(createClienteSchema), ClienteController.createCliente);
router.get("/clientes", authMiddleware, ClienteController.getAllClientes);
router.get("/clientes/:id", authMiddleware, validate(clienteIdSchema), ClienteController.getClienteById);
router.put("/clientes/:id", authMiddleware, validate(updateClienteSchema), ClienteController.updateCliente);
router.delete("/clientes/:id", authMiddleware, validate(clienteIdSchema), ClienteController.deleteCliente);

export default router;
