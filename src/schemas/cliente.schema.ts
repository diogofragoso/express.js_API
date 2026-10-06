import { z }  from "zod";

export const idParams = z.object({
  id: z.string().regex(/^\d+$/, 'ID deve ser numérico.').refine(value => {
    const id = Number(value);
    return Number.isSafeInteger(id) && id >= 1 && id <= 2147483647;
  }, 'ID fora do intervalo permitido.'),
});

export const createCliente = z.object({
  nomeCliente: z.string().trim().min(2).max(100).optional(),
  emailCliente: z.string().trim().toLowerCase().max(254).pipe(z.email()),
}).strict();

export const updateCliente = createCliente.partial().refine(
    value => Object.keys(value).length > 0,    
         "Ao menos um campo deve ser informado.",
);

export const createClienteSchema = z.object({ body: createCliente });
export const updateClienteSchema = z.object({ body: updateCliente, params: idParams });
export const clienteIdSchema = z.object({ params: idParams });