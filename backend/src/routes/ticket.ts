import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthRequest } from '../middlewares/auth';
import multer from 'multer';
import { uploadFileToMinio } from '../utils/minio';
import { sendMail, getUserNotificationEmails } from '../utils/email';

const router = Router();
const prisma = new PrismaClient();
const upload = multer();

// 티켓 목록 (본인 또는 관리자)
router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
  console.log('GET /tickets', req.user);
  try {
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'ADMIN';
    let where = {};
    if (!isAdmin && userId) {
      where = { userId };
    }
    let tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      where,
      select: {
        id: true,
        ticketNo: true,
        title: true,
        status: true,
        createdAt: true,
        ccEmails: true,
        company: {
          select: { name: true }
        }
      }
    });
    res.json({ tickets });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 티켓 생성 (파일 업로드 지원)
router.post('/', authenticateJWT, upload.single('file'), async (req: AuthRequest, res) => {
  console.log('POST /tickets', req.body, req.user, req.file);
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });
    const { title, content, cc, companyId } = req.body;
    if (!title || !content) return res.status(400).json({ message: '제목과 내용을 입력하세요.' });
    let ccList: string[] = [];
    if (cc) {
      try {
        ccList = typeof cc === 'string' ? JSON.parse(cc) : cc;
        if (!Array.isArray(ccList)) throw new Error();
      } catch {
        return res.status(400).json({ message: 'cc는 이메일 배열(JSON)이어야 합니다.' });
      }
    }
    // ticketNo 생성: TKT-YYYYMMDD-0001
    const today = new Date();
    const dateStr = today.toISOString().slice(0,10).replace(/-/g, '');
    const count = await prisma.ticket.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0,0,0,0)),
          lte: new Date(today.setHours(23,59,59,999)),
        }
      }
    });
    const ticketNo = `TKT-${dateStr}-${String(count+1).padStart(4, '0')}`;
    const ticket = await prisma.ticket.create({
      data: {
        ticketNo,
        title,
        content,
        userId,
        status: 'OPEN',
        ccEmails: ccList,
        companyId: companyId || null,
      },
      include: {
        company: { select: { name: true } },
      },
    });
    // 파일이 있으면 MinIO에 업로드 후 File 모델에 저장
    if (req.file) {
      try {
        const { originalFileName, url } = await uploadFileToMinio(req.file.originalname, req.file.buffer, req.file.mimetype);
        await prisma.file.create({
          data: {
            filename: originalFileName.normalize('NFC'),
            url,
            ticketId: ticket.id,
            uploadedById: userId,
          },
        });
      } catch (e: any) {
        await prisma.ticket.delete({ where: { id: ticket.id } });
        return res.status(400).json({ message: '파일 업로드 실패: ' + e.message });
      }
    }
    // === 이메일 알림 ===
    try {
      const toList = await getUserNotificationEmails(userId);
      const ccEmails = ccList.length > 0 ? ccList : undefined;
      if (toList.length > 0) {
        const subject = `[티켓 생성] ${title}`;
        const html = `<div><b>티켓이 생성되었습니다.</b><br/>티켓번호: ${ticketNo}<br/>제목: ${title}<br/>내용: ${content}<br/>고객사: ${ticket.company?.name || '-'}<br/>생성일: ${new Date(ticket.createdAt).toLocaleString('ko-KR')}</div>`;
        await sendMail({ to: toList, cc: ccEmails, subject, html });
      }
    } catch (e) {
      console.error('이메일 발송 실패:', e);
    }
    // === // ===
    res.json({ ticket });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 티켓 상세 조회
router.get('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        files: true,
        company: { select: { name: true } },
      },
    });
    if (!ticket) return res.status(404).json({ message: '티켓을 찾을 수 없습니다.' });
    res.json({ ticket });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 티켓 수정 (상태/내용/CC 등)
router.put('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const ticketId = req.params.id;
    const { title, content, status, cc } = req.body;
    const data: any = {};
    if (title) data.title = title;
    if (content) data.content = content;
    if (status) data.status = status;
    if (typeof cc !== 'undefined') {
      try {
        data.ccEmails = typeof cc === 'string' ? JSON.parse(cc) : cc;
        if (!Array.isArray(data.ccEmails)) throw new Error();
      } catch {
        return res.status(400).json({ message: 'cc는 이메일 배열(JSON)이어야 합니다.' });
      }
    }
    // 기존 상태/내용 조회
    const prevTicket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { company: true } });
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data,
      include: { company: true },
    });
    // === 상태/내용 변경 시 알림 메일 ===
    if ((status && prevTicket && prevTicket.status !== status) || (content && prevTicket && prevTicket.content !== content)) {
      // 관련자 이메일 수집: owner, CC, 댓글/메시지 참여자
      const emails = new Set<string>();
      emails.add(ticket.userId); // owner id(이메일로 변환 필요)
      (ticket.ccEmails || []).forEach(e => emails.add(e));
      // 댓글/메시지 참여자
      const comments = await prisma.comment.findMany({ where: { ticketId }, include: { user: true } });
      const messages = await prisma.message.findMany({ where: { ticketId }, include: { user: true } });
      comments.forEach(c => c.user?.email && emails.add(c.user.email));
      messages.forEach(m => m.user?.email && emails.add(m.user.email));
      // owner id → 이메일 변환
      const owner = await prisma.user.findUnique({ where: { id: ticket.userId } });
      if (owner?.email) emails.add(owner.email);
      // 히스토리(댓글+메시지)
      const history = [...comments.map(c => ({ type: '댓글', user: c.user?.name || c.user?.email, content: c.content, createdAt: c.createdAt })), ...messages.map(m => ({ type: '채팅', user: m.user?.name || m.user?.email, content: m.content, createdAt: m.createdAt }))]
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      // 메일 본문
      let html = `<div><b>티켓 정보</b><br/>티켓번호: ${ticket.ticketNo}<br/>제목: ${ticket.title}<br/>내용: ${ticket.content}<br/>고객사: ${ticket.company?.name || '-'}<br/>상태: ${ticket.status}<br/>생성일: ${new Date(ticket.createdAt).toLocaleString('ko-KR')}</div>`;
      if (status && prevTicket && prevTicket.status !== status) {
        html += `<div style='margin-top:12px'><b>상태 변경:</b> ${prevTicket.status} → ${status}</div>`;
      }
      if (content && prevTicket && prevTicket.content !== content) {
        html += `<div style='margin-top:12px'><b>내용 수정됨</b></div>`;
      }
      if (history.length > 0) {
        html += `<div style='margin-top:16px'><b>티켓 히스토리</b><ul style='margin:0;padding-left:16px'>`;
        history.forEach(h => {
          html += `<li>[${h.type}] ${h.user} (${new Date(h.createdAt).toLocaleString('ko-KR')}): ${h.content}</li>`;
        });
        html += `</ul></div>`;
      }
      await sendMail({
        to: Array.from(emails).filter(Boolean),
        subject: `[티켓 알림] ${ticket.title} (상태/내용 변경)` ,
        html,
      });
    }
    // === // ===
    res.json({ ticket });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

export default router;