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
 *         id: { type: integer, minimum: 1 }
 *         name: { type: string, nullable: true }
 *         email: { type: string, format: email, nullable: true }
 *         telefones: { type: array, items: { type: string } }
 *     CreateCliente:
 *       type: object
 *       additionalProperties: false
 *       required: [email, name, telefones]
 *       properties:
 *         name: { type: string, minLength: 2, maxLength: 100 }
 *         email: { type: string, format: email, maxLength: 254 }
 *         telefones:
 *           type: array
 *           items: { type: string, minLength: 8, maxLength: 15 }
 *           minItems: 1
 *     UpdateCliente:
 *       type: object
 *       additionalProperties: false
 *       minProperties: 1
 *       properties:
 *         name: { type: string, minLength: 2, maxLength: 100 }
 *         email: { type: string, format: email, maxLength: 254 }
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
