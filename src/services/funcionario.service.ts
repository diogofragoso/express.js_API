import { db } from "../prisma/db.js";
import { HttpError } from "../lib/http-error.js";

export interface CreateFuncionarioInput {
    name: string;
    email: string;
    telefones?: string[];
}

export type UpdateFuncionarioInput = Partial<CreateFuncionarioInput>;

type FuncionarioRow = Awaited<ReturnType<typeof db.orm.public.Funcionario.create>>;

// Seleciona os campos públicos e acrescenta os números relacionados.
const toPublicFuncionario = (funcionario: FuncionarioRow, telefones: string[]) => ({
    id: funcionario.id,
    name: funcionario.name,
    email: funcionario.email,
    createdAt: funcionario.createdAt,
    telefones,
});

// Tipos TypeScript não validam os dados recebidos durante a execução.
function validarTelefones(telefones: string[] | undefined) {
    if (telefones === undefined) return;
    if (!Array.isArray(telefones) ||
        telefones.some(t => typeof t !== "string" || t.trim().length === 0)) {
        throw new HttpError(400, "Telefones deve ser uma lista de textos não vazios.");
    }
}

export async function createFuncionario(data: CreateFuncionarioInput) {
    validarTelefones(data.telefones);
    return db.transaction(async (tx) => {
        const funcionario = await tx.orm.public.Funcionario.create({
            name: data.name,
            email: data.email,
        });
        const telefones: string[] = [];
        for (const numero of data.telefones ?? []) {
            const telefone = await tx.orm.public.TelFuncionario.create({
                idTelFuncionario: funcionario.id,
                telFuncionario: numero.trim(),
            });
            telefones.push(telefone.telFuncionario);
        }
        return toPublicFuncionario(funcionario, telefones);
    });
}

export async function getAllFuncionarios() {
    const funcionarios = await db.orm.public.Funcionario.all();
    if (funcionarios.length === 0) return [];

    // Uma consulta para os telefones evita uma consulta por funcionário.
    const registros = await db.orm.public.TelFuncionario.all();
    const telefonesPorFuncionario = new Map<number, string[]>();
    for (const registro of registros) {
        const numeros = telefonesPorFuncionario.get(registro.idTelFuncionario) ?? [];
        numeros.push(registro.telFuncionario);
        telefonesPorFuncionario.set(registro.idTelFuncionario, numeros);
    }
    return funcionarios.map(funcionario =>
        toPublicFuncionario(funcionario, telefonesPorFuncionario.get(funcionario.id) ?? []));
}

export async function updateFuncionario(id: number, params: UpdateFuncionarioInput) {
    validarTelefones(params.telefones);
    const changes: Partial<Pick<CreateFuncionarioInput, "name" | "email">> = {};
    if (params.name !== undefined) changes.name = params.name;
    if (params.email !== undefined) changes.email = params.email;
    if (Object.keys(changes).length === 0 && params.telefones === undefined) {
        throw new HttpError(400, "Informe pelo menos um campo.");
    }

    return db.transaction(async (tx) => {
        // Atualizar a linha também serializa alterações concorrentes nos telefones.
        const funcionario = await tx.orm.public.Funcionario.where({ id }).update({
            ...changes,
            id,
        });
        if (!funcionario) throw new HttpError(404, "Funcionário não encontrado.");

        if (params.telefones !== undefined) {
            await tx.orm.public.TelFuncionario.where({ idTelFuncionario: id }).delete();
            for (const numero of params.telefones) {
                await tx.orm.public.TelFuncionario.create({
                    idTelFuncionario: id,
                    telFuncionario: numero.trim(),
                });
            }
        }
        const telefones = await tx.orm.public.TelFuncionario.where({ idTelFuncionario: id }).all();
        return toPublicFuncionario(funcionario, telefones.map(t => t.telFuncionario));
    });
}

export async function deleteFuncionario(id: number) {
    return db.transaction(async (tx) => {
        const funcionario = await tx.orm.public.Funcionario.where({ id }).update({ id });
        if (!funcionario) throw new HttpError(404, "Funcionário não encontrado.");
        const telefones = await tx.orm.public.TelFuncionario.where({ idTelFuncionario: id }).all();
        // A relação usa Restrict: os telefones precisam ser excluídos primeiro.
        await tx.orm.public.TelFuncionario.where({ idTelFuncionario: id }).delete();
        await tx.orm.public.Funcionario.where({ id }).delete();
        return toPublicFuncionario(funcionario, telefones.map(t => t.telFuncionario));
    });
}

export async function getFuncionariosById(id: number) {
    const funcionario = await db.orm.public.Funcionario.first({ id });
    if (!funcionario) throw new HttpError(404, "Funcionário não encontrado.");
    const telefones = await db.orm.public.TelFuncionario.where({ idTelFuncionario: id }).all();
    return toPublicFuncionario(funcionario, telefones.map(t => t.telFuncionario));
}
