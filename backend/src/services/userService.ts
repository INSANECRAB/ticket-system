import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export async function getUsers() {
  return prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, invited: true, createdAt: true }
  });
}

export async function changeUserRole(userId: string, role: Role) {
  return prisma.user.update({ where: { id: Number(userId) }, data: { role } });
} 