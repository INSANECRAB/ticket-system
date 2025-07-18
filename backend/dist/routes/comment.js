"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middlewares/auth");
const email_1 = require("../utils/email");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// 댓글 목록 조회 (티켓별)
router.get('/ticket/:ticketId', auth_1.authenticateJWT, async (req, res) => {
    try {
        const ticketId = Number(req.params.ticketId);
        const comments = await prisma.comment.findMany({
            where: { ticketId },
            orderBy: { createdAt: 'asc' },
            include: { user: true },
        });
        res.json({ comments });
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
// 댓글 생성
router.post('/', auth_1.authenticateJWT, async (req, res) => {
    try {
        const userId = req.user?.id ? Number(req.user.id) : undefined;
        if (!userId)
            return res.status(401).json({ message: '로그인이 필요합니다.' });
        const { ticketId, content } = req.body;
        if (!ticketId || !content)
            return res.status(400).json({ message: '내용을 입력하세요.' });
        const comment = await prisma.comment.create({
            data: {
                content,
                ticketId: Number(ticketId),
                userId,
            },
            include: { user: true },
        });
        // === 이메일 알림 ===
        try {
            const ticket = await prisma.ticket.findUnique({ where: { id: Number(ticketId) } });
            if (ticket) {
                const toList = await (0, email_1.getUserNotificationEmails)(ticket.userId);
                const ccEmails = ticket.cc && ticket.cc.length > 0 ? ticket.cc : undefined;
                if (toList.length > 0) {
                    const subject = `[티켓 댓글] ${ticket.title}`;
                    const html = `<div><b>티켓에 댓글이 등록되었습니다.</b><br/>제목: ${ticket.title}<br/>고객사명: ${ticket.companyName || '-'}<br/><br/><b>댓글:</b><br/>${content}<br/><br/>작성자: ${comment.user.name || comment.user.email}<br/>작성일: ${new Date(comment.createdAt).toLocaleString('ko-KR')}</div>`;
                    await (0, email_1.sendMail)({ to: toList, cc: ccEmails, subject, html });
                }
            }
        }
        catch (e) {
            console.error('댓글 이메일 발송 실패:', e);
        }
        // === // ===
        res.json({ comment });
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
// 댓글 수정
router.put('/:id', auth_1.authenticateJWT, async (req, res) => {
    try {
        const commentId = Number(req.params.id);
        const { content } = req.body;
        if (!content)
            return res.status(400).json({ message: '내용을 입력하세요.' });
        const comment = await prisma.comment.update({
            where: { id: commentId },
            data: { content },
            include: { user: true },
        });
        res.json({ comment });
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
// 댓글 삭제
router.delete('/:id', auth_1.authenticateJWT, async (req, res) => {
    try {
        const commentId = Number(req.params.id);
        await prisma.comment.delete({ where: { id: commentId } });
        res.json({ ok: true });
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
exports.default = router;
