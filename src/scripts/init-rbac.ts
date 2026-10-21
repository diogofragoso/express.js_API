// Arquivo: src/scripts/init-rbac.ts
import { db } from '../prisma/db.js';

try {
  const types = [
    { id: 1, code: 'ALUNO', name: 'Estudante' },
    { id: 2, code: 'ADMIN', name: 'Administração' },
  ];
  for (const type of types) {
    const byId = await db.orm.public.UserType.first({ id: type.id });
    const byCode = await db.orm.public.UserType.first({ code: type.code });
    if ((byId && byId.code !== type.code) || (byCode && byCode.id !== type.id)) {
      throw new Error('Catálogo de tipos conflitante. Revise os IDs antes de continuar.');
    }
    if (!byId) await db.orm.public.UserType.create(type);
  }
  let updated = 0;
  for (const user of await db.orm.public.User.all()) {
    if (user.userTypeId === null) {
      await db.orm.public.User.where({ id: user.id }).update({ userTypeId: 1 });
      updated++;
    }
  }
  console.log(`Tipos preparados com sucesso; ${updated} conta(s) antiga(s) vinculada(s) a ALUNO.`);
} finally {
  await db.close();
}

