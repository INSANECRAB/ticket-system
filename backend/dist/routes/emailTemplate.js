"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// 템플릿 조회 (관리자만)
router.get('/:type', auth_1.authenticateJWT, async (req, res) => {
    if (req.user?.role !== 'ADMIN')
        return res.status(403).json({ message: '권한이 없습니다.' });
    const { type } = req.params;
    const template = await prisma.inviteEmailTemplate.findFirst({ where: { type } });
    if (!template)
        return res.status(404).json({ message: '템플릿 없음' });
    res.json(template);
});
// 템플릿 수정/저장 (관리자만)
router.put('/:type', auth_1.authenticateJWT, async (req, res) => {
    if (req.user?.role !== 'ADMIN')
        return res.status(403).json({ message: '권한이 없습니다.' });
    const { type } = req.params;
    const { subject, body } = req.body;
    if (!subject || !body)
        return res.status(400).json({ message: 'subject/body 필수' });
    let template = await prisma.inviteEmailTemplate.findFirst({ where: { type } });
    if (template) {
        template = await prisma.inviteEmailTemplate.update({ where: { id: template.id }, data: { subject, body } });
    }
    else {
        template = await prisma.inviteEmailTemplate.create({ data: { type, subject, body } });
    }
    res.json(template);
});
// /email-template/invite 라우트 추가 (관리자만)
router.get('/invite', auth_1.authenticateJWT, async (req, res) => {
    if (req.user?.role !== 'ADMIN')
        return res.status(403).json({ message: '권한이 없습니다.' });
    const template = await prisma.inviteEmailTemplate.findFirst({ where: { type: 'invite' } });
    if (!template)
        return res.status(404).json({ message: '템플릿 없음' });
    res.json(template);
});
exports.default = router;
