// Arquivo: src/scripts/set-user-role.ts
import { db } from '../prisma/db.js';

try {
  const [emailArg, code, ...extra] = process.argv.slice(2);
  if (!emailArg || (code !== 'ALUNO' && code !== 'ADMIN') || extra.length > 0) {
    throw new Error('Uso: npx tsx src/scripts/set-user-role.ts email ALUNO|ADMIN');
  }
  const user = await db.orm.public.User.first({ email: emailArg.trim().toLowerCase() });
  const type = await db.orm.public.UserType.first({ code });
  if (!user || !type) throw new Error('Conta ou tipo inexistente. Confira cadastro e init-rbac.');
  await db.orm.public.User.where({ id: user.id }).update({ userTypeId: type.id });
  console.log(`Conta ${user.id}: tipo alterado para ${code}.`);
} finally {
  await db.close();
}

