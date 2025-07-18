"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.changeUserRole = changeUserRole;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function getUsers() {
    return prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, invited: true, createdAt: true }
    });
}
async function changeUserRole(userId, role) {
    return prisma.user.update({ where: { id: Number(userId) }, data: { role } });
}
