import { db } from '../prisma/db.js';
import { HttpError } from '../lib/http-error.js';

export interface CreateClienteInput {
  name: string;
  email: string;
  telefones: string[];
}

export type UpdateClienteInput = Partial<CreateClienteInput>;

type ClienteRow = Awaited<ReturnType<typeof db.orm.public.Cliente.create>>;

// Função para formatar o cliente para retorno público
export const toPublicCliente = (cliente: any) => ({
    id: cliente.id,
    name: cliente.name,
    email: cliente.email,
    telefones: cliente.telClientes?.map((t: any) => t.telCliente) || [],
});

export async function createCliente(data: CreateClienteInput) {
    try {
        // Para garantir que cliente e telefones sejam criados juntos
        const cliente = await db.transaction(async (tx) => {
            const novoCliente = await tx.orm.public.Cliente.create({
                name: data.name,
                email: data.email,
            });

            const telefonesCriados = [];
            for (const tel of data.telefones) {
                const novoTel = await tx.orm.public.TelCliente.create({
                    idTelClienteFk: novoCliente.id,
                    telCliente: tel,
                });
                telefonesCriados.push(novoTel);
            }

            return { ...novoCliente, telClientes: telefonesCriados };
        });

        return cliente;
    } catch (error: any) {
        // Erro de unique constraint no postgres (email duplicado)
        if (error.code === '23505') {
            throw new HttpError(409, 'Este email já está cadastrado.');
        }
        throw error;
    }
}

export async function getAllClientes() {
    // Buscando clientes e seus telefones manualmente caso o pg-orm não tenha includes automáticos no all()
    const clientes = await db.orm.public.Cliente.all();
    const telefones = await db.orm.public.TelCliente.all();

    return clientes.map(c => ({
        ...c,
        telClientes: telefones.filter(t => t.idTelClienteFk === c.id)
    }));
}

export async function getClienteById(id: number) {
    const cliente = await db.orm.public.Cliente.first({ id });
    if (!cliente) throw new HttpError(404, 'Cliente não encontrado.');
    
    const telefones = await db.orm.public.TelCliente.where({ idTelClienteFk: id }).all();
    
    return { ...cliente, telClientes: telefones };
}

export async function updateCliente(id: number, data: UpdateClienteInput) {
    const changes: any = {};
    if (data.name !== undefined) changes.name = data.name;
    if (data.email !== undefined) changes.email = data.email;
    
    if (Object.keys(changes).length === 0) {
        throw new HttpError(400, 'Informe pelo menos um campo para atualizar.');
    }
    
    const cliente = await db.orm.public.Cliente.where({ id }).update(changes);
    if (!cliente) throw new HttpError(404, 'Cliente não encontrado.');
    
    // Retornamos os telefones também para manter o formato
    const telefones = await db.orm.public.TelCliente.where({ idTelClienteFk: id }).all();
    return { ...cliente, telClientes: telefones };
}

export async function deleteCliente(id: number) {
    // Removemos os telefones antes por conta da foreign key com restrição restrict
    await db.orm.public.TelCliente.where({ idTelClienteFk: id }).delete();
    const cliente = await db.orm.public.Cliente.where({ id }).delete();
    if (!cliente) throw new HttpError(404, 'Cliente não encontrado.');
}
