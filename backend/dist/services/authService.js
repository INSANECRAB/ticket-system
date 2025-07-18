"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteUser = inviteUser;
exports.acceptInvite = acceptInvite;
exports.login = login;
exports.requestReset = requestReset;
exports.resetPassword = resetPassword;
const client_1 = require("@prisma/client");
const jwt_1 = require("../utils/jwt");
const email_1 = require("../utils/email");
const password_1 = require("../utils/password");
const prisma = new client_1.PrismaClient();
async function inviteUser(adminId, email, role) {
    // 이미 가입된 유저인지 확인
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
        throw new Error('이미 등록된 이메일입니다.');
    // 이미 초대된 이메일인지 Invite 테이블에서 확인
    const existingInvite = await prisma.invite.findUnique({ where: { email } });
    if (existingInvite && !existingInvite.accepted)
        throw new Error('이미 초대된 이메일입니다.');
    // Invite 테이블에 초대 기록 추가
    await prisma.invite.upsert({
        where: { email },
        update: { role, invitedAt: new Date(), accepted: false, acceptedAt: null },
        create: { email, role },
    });
    // 초대 토큰 생성 (24시간 유효)
    const token = (0, jwt_1.signToken)({ email, role, type: 'invite' }, '24h');
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/accept-invite?token=${token}`;
    // 초대 메일 템플릿 불러오기
    let subject = '[티켓시스템] 회원 초대 안내';
    let body = `<p>아래 링크를 클릭해 비밀번호를 설정하고 가입을 완료하세요.</p><p><a href="${inviteUrl}">${inviteUrl}</a></p>`;
    const template = await prisma.inviteEmailTemplate.findFirst({ where: { type: 'invite' } });
    if (template) {
        subject = template.subject;
        body = template.body
            .replace(/\$\{inviteUrl\}/g, inviteUrl)
            .replace(/\$\{email\}/g, email);
    }
    // 초대 이메일 발송
    await (0, email_1.sendMail)({
        to: email,
        subject,
        html: body
    });
    return { token };
}
async function acceptInvite(token, password) {
    try {
        // 토큰 검증
        const payload = (0, jwt_1.verifyToken)(token);
        if (payload.type !== 'invite')
            throw new Error('유효하지 않은 초대 토큰입니다.');
        // 이미 가입된 유저인지 확인
        const existing = await prisma.user.findUnique({ where: { email: payload.email } });
        if (existing)
            throw new Error('이미 등록된 이메일입니다.');
        // Invite 테이블에서 초대 내역 확인
        const invite = await prisma.invite.findUnique({ where: { email: payload.email } });
        if (!invite || invite.accepted)
            throw new Error('초대 내역이 없거나 이미 가입 완료된 이메일입니다.');
        // 패스워드 규칙: 8자 이상, 영문/숫자/특수문자 2종류 이상
        if (!isValidPassword(password)) {
            throw new Error('비밀번호는 8자 이상, 영문/숫자/특수문자 중 2종류 이상이어야 합니다.');
        }
        // 유저 생성
        const hashed = await (0, password_1.hashPassword)(password);
        await prisma.user.create({
            data: {
                email: payload.email,
                role: payload.role,
                invited: false,
                password: hashed
            }
        });
        // Invite 테이블 상태 갱신
        await prisma.invite.update({
            where: { email: payload.email },
            data: { accepted: true, acceptedAt: new Date() }
        });
        return { message: '가입이 완료되었습니다.' };
    }
    catch (e) {
        console.error('acceptInvite error:', e);
        throw e;
    }
}
function isValidPassword(pw) {
    if (pw.length < 8)
        return false;
    let types = 0;
    if (/[A-Za-z]/.test(pw))
        types++;
    if (/[0-9]/.test(pw))
        types++;
    if (/[^A-Za-z0-9]/.test(pw))
        types++;
    return types >= 2;
}
async function login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.invited)
        throw new Error('가입되지 않은 사용자입니다.');
    if (!user.password)
        throw new Error('비밀번호가 설정되지 않았습니다.');
    const valid = await (0, password_1.comparePassword)(password, user.password);
    if (!valid)
        throw new Error('비밀번호가 일치하지 않습니다.');
    const token = (0, jwt_1.signToken)({ id: user.id, email: user.email, role: user.role }, '7d');
    return { token, user: { id: user.id, email: user.email, role: user.role } };
}
async function requestReset(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
        throw new Error('가입되지 않은 이메일입니다.');
    const token = (0, jwt_1.signToken)({ id: user.id, email: user.email, type: 'reset' }, '1h');
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    await (0, email_1.sendMail)({
        to: user.email,
        subject: '[티켓시스템] 비밀번호 재설정',
        html: `<p>아래 링크를 클릭해 비밀번호를 재설정하세요.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
    });
    return { message: '비밀번호 재설정 메일이 발송되었습니다.' };
}
async function resetPassword(token, password) {
    const payload = (0, jwt_1.verifyToken)(token);
    if (payload.type !== 'reset')
        throw new Error('유효하지 않은 토큰입니다.');
    const user = await prisma.user.findUnique({ where: { id: Number(payload.id) } });
    if (!user)
        throw new Error('가입되지 않은 사용자입니다.');
    const hashed = await (0, password_1.hashPassword)(password);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed, invited: false } });
    return { message: '비밀번호가 재설정되었습니다.' };
}
