// Arquivo: src/services/user.service.ts
import bcrypt from 'bcrypt';
import { db } from '../prisma/db.js';
import { HttpError } from '../lib/http-error.js';

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
  userTypeCode?: '1' | '2';
}
export type UpdateUserInput = Partial<Omit<CreateUserInput, 'userTypeCode'>>;
type UserRow = Awaited<ReturnType<typeof db.orm.public.User.create>>;

export const toPublicUser = async (user: UserRow) => {
  const type = await db.orm.public.UserType.first({ id: user.userTypeId });
  if (!type) throw new HttpError(500, 'Tipo de usuário não encontrado.');
  const roles: Record<string, string> = { '1': 'aluno', '2': 'professor', '3': 'admin' };
  const role = roles[type.code];
  if (!role) throw new HttpError(500, 'Código de tipo de usuário desconhecido.');

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    userTypeId: user.userTypeId,
    userTypeCode: type.code,
    role,
  };
};

export async function createUser(data: CreateUserInput) {
  const type = await db.orm.public.UserType.first({ code: data.userTypeCode ?? '1' });
  if (!type) throw new HttpError(400, 'Tipo de usuário não cadastrado.');
  return db.orm.public.User.create({
    email: data.email,
    name: data.name ?? null,
    password: await bcrypt.hash(data.password, 12),
    userTypeId: type.id,
  });
}

export async function getAllUsers() {
  return db.orm.public.User.all();
}

export async function getUserById(id: number) {
  const user = await db.orm.public.User.first({ id });
  if (!user) throw new HttpError(404, 'Usuário não encontrado.');
  return user;
}

export async function updateUser(id: number, data: UpdateUserInput) {
  const changes: any = {};
  if (data.name !== undefined) changes.name = data.name;
  if (data.email !== undefined) changes.email = data.email;
  if (data.password !== undefined) changes.password = await bcrypt.hash(data.password, 12);
  if (Object.keys(changes).length === 0) throw new HttpError(400, 'Informe pelo menos um campo.');
  const user = await db.orm.public.User.where({ id }).update(changes);
  if (!user) throw new HttpError(404, 'Usuário não encontrado.');
  return user;
}

export async function deleteUser(id: number) {
  const user = await db.orm.public.User.where({ id }).delete();
  if (!user) throw new HttpError(404, 'Usuário não encontrado.');
}
