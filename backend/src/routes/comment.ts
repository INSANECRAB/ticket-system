import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthRequest } from '../middlewares/auth';
import { sendMail, getUserNotificationEmails } from '../utils/email';

const router = Router();
const prisma = new PrismaClient();

// 댓글 목록 조회 (티켓별)
router.get('/ticket/:ticketId', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const ticketId = req.params.ticketId;
    const comments = await prisma.comment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      include: { user: true },
    });
    res.json({ comments });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 댓글 생성
router.post('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });
    const { ticketId, content } = req.body;
    if (!ticketId || !content) return res.status(400).json({ message: '내용을 입력하세요.' });
    const comment = await prisma.comment.create({
      data: {
        content,
        ticketId: ticketId,
        userId,
      },
      include: { user: true },
    });
    // === 이메일 알림 ===
    try {
      const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
      if (ticket) {
        const toList = await getUserNotificationEmails(ticket.userId);
        const ccEmails = ticket.ccEmails && ticket.ccEmails.length > 0 ? ticket.ccEmails : undefined;
        if (toList.length > 0) {
          const subject = `[티켓 댓글] ${ticket.title}`;
          const html = `<div><b>티켓에 댓글이 등록되었습니다.</b><br/>제목: ${ticket.title}<br/>고객사명: ${ticket.companyId || '-'}<br/><br/><b>댓글:</b><br/>${content}<br/><br/>작성자: ${comment.user.name || comment.user.email}<br/>작성일: ${new Date(comment.createdAt).toLocaleString('ko-KR')}</div>`;
          await sendMail({ to: toList, cc: ccEmails, subject, html });
        }
      }
    } catch (e) {
      console.error('댓글 이메일 발송 실패:', e);
    }
    // === // ===
    res.json({ comment });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 댓글 수정
router.put('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const commentId = req.params.id;
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: '내용을 입력하세요.' });
    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: { user: true },
    });
    res.json({ comment });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 댓글 삭제
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const commentId = req.params.id;
    await prisma.comment.delete({ where: { id: commentId } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

export default router; 