"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const password_1 = require("../utils/password");
const prisma = new client_1.PrismaClient();
async function main() {
    const email = process.argv[2];
    const password = process.argv[3];
    const name = process.argv[4] || '관리자';
    if (!email || !password) {
        console.log('사용법: ts-node scripts/create-admin.ts <이메일> <비밀번호> [이름]');
        process.exit(1);
    }
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
        console.log('이미 존재하는 이메일입니다.');
        process.exit(1);
    }
    const hashed = await (0, password_1.hashPassword)(password);
    await prisma.user.create({
        data: { email, password: hashed, name, role: client_1.Role.ADMIN, invited: false }
    });
    console.log('관리자 계정이 생성되었습니다.');
    process.exit(0);
}
main();
