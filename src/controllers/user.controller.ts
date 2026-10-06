// Arquivo: src/controllers/user.controller.ts
import type { Request, Response } from 'express';
import * as UserService from '../services/user.service.js';

export const createUser = async (req: Request, res: Response) => {
  const user = await UserService.createUser(req.body);
  res.status(201).json(UserService.toPublicUser(user));
};

export const getAllUsers = async (_req: Request, res: Response) => {
  const user = await UserService.getUserById(res.locals.userId);
  res.json([UserService.toPublicUser(user)]);
};

export const getUserById = async (req: Request, res: Response) => {
  res.json(UserService.toPublicUser(await UserService.getUserById(Number(req.params.id))));
};

export const updateUser = async (req: Request, res: Response) => {
  res.json(UserService.toPublicUser(await UserService.updateUser(Number(req.params.id), req.body)));
};

export const deleteUser = async (req: Request, res: Response) => {
  await UserService.deleteUser(Number(req.params.id));
  res.status(204).send();
};