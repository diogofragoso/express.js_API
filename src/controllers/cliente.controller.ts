import type { Request, Response } from "express";

import * as ClienteService from "../services/cliente.service.js";

export const createCliente = async (req: Request, res: Response) => {
  const cliente = await ClienteService.createCliente(req.body);
  res.status(201).json(ClienteService.toPublicCliente(cliente));
};

export const getAllClientes = async (_req: Request, res: Response) => {
  const clientes = await ClienteService.getAllClientes();
  res.json(clientes.map(ClienteService.toPublicCliente));
};

export const getClienteById = async (req: Request, res: Response) => {
  const cliente = await ClienteService.getClienteById(Number(req.params.id));
  res.json(ClienteService.toPublicCliente(cliente));
};

export const updateCliente = async (req: Request, res: Response) => {
  const cliente = await ClienteService.updateCliente(Number(req.params.id), req.body);
  res.json(ClienteService.toPublicCliente(cliente));
};

export const deleteCliente = async (req: Request, res: Response) => {
  await ClienteService.deleteCliente(Number(req.params.id));
  res.status(204).send();
};