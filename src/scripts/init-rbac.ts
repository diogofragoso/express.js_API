// Arquivo: src/scripts/init-rbac.ts
import { db } from '../prisma/db.js';

try {
  const types = [
    { code: '1', name: 'Estudante' },
    { code: '2', name: 'Professor' },
    { code: '3', name: 'Administração' },
  ];
  for (const type of types) {
    const existing = await db.orm.public.UserType.first({ code: type.code });
    if (!existing) await db.orm.public.UserType.create(type);
  }
  const aluno = await db.orm.public.UserType.first({ code: '1' });
  if (!aluno) throw new Error('Tipo de aluno (código 1) não encontrado.');
  let updated = 0;
  for (const user of await db.orm.public.User.all()) {
    if (user.userTypeId === null) {
      await db.orm.public.User.where({ id: user.id }).update({ userTypeId: aluno.id });
      updated++;
    }
  }
  console.log(`Tipos preparados com sucesso; ${updated} conta(s) antiga(s) vinculada(s) a ALUNO.`);
} finally {
  await db.close();
}

