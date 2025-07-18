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
    const userId = req.user?.id ? Number(req.user.id) : undefined;
    let tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        userId: true,
      },
    });
    if (req.user?.role !== 'ADMIN' && userId) {
      tickets = tickets.filter(t => Number(t.userId) === userId);
    }
    const ticketsWithNo = tickets.map((t, i) => ({
      ...t,
      ticketNo: `TKT-${t.createdAt.getFullYear()}${String(t.createdAt.getMonth()+1).padStart(2,'0')}${String(t.createdAt.getDate()).padStart(2,'0')}-${String(t.id).padStart(4,'0')}`
    }));
    // userId는 응답에서 제거
    res.json({ tickets: ticketsWithNo.map(({ userId, ...rest }) => rest) });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 티켓 생성 (파일 업로드 지원)
router.post('/', authenticateJWT, upload.single('file'), async (req: AuthRequest, res) => {
  console.log('POST /tickets', req.body, req.user, req.file);
  try {
    const userId = req.user?.id ? Number(req.user.id) : undefined;
    if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });
    const { title, content, cc, companyName } = req.body;
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
    const ticket = await prisma.ticket.create({
      data: {
        title,
        content,
        userId,
        status: 'OPEN',
        cc: ccList,
        companyName: companyName || null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        cc: true,
        companyName: true,
      },
    });
    // 파일이 있으면 MinIO에 업로드 후 File 모델에 저장
    if (req.file) {
      try {
        // 파일명 정제는 uploadFileToMinio에서 처리됨
        const { url, originalFileName } = await uploadFileToMinio(req.file.originalname, req.file.buffer, req.file.mimetype);
        await prisma.file.create({
          data: {
            filename: originalFileName.normalize('NFC'), // 반드시 NFC로 정규화해서 저장
            url,
            size: req.file.size,
            ticketId: ticket.id,
            uploadedById: userId,
          },
        });
      } catch (e: any) {
        // 파일 업로드 실패 시 티켓도 삭제(롤백)
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
        const html = `<div><b>티켓이 생성되었습니다.</b><br/>제목: ${title}<br/>내용: ${content}<br/>고객사명: ${companyName || '-'}<br/>생성일: ${new Date(ticket.createdAt).toLocaleString('ko-KR')}</div>`;
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
      where: { id: Number(req.params.id) },
      include: {
        files: true,
      },
    });
    if (!ticket) return res.status(404).json({ message: '티켓을 찾을 수 없습니다.' });
    res.json({ ticket });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 티켓 수정
router.put('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const ticketId = Number(req.params.id);
    const { title, content, status, cc, companyName } = req.body;
    const data: any = {};
    if (title) data.title = title;
    if (content) data.content = content;
    if (status) data.status = status;
    if (typeof cc !== 'undefined') {
      try {
        data.cc = typeof cc === 'string' ? JSON.parse(cc) : cc;
        if (!Array.isArray(data.cc)) throw new Error();
      } catch {
        return res.status(400).json({ message: 'cc는 이메일 배열(JSON)이어야 합니다.' });
      }
    }
    if (typeof companyName !== 'undefined') data.companyName = companyName;
    // 상태 변경 감지용: 기존 상태 조회
    const prevTicket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data,
      select: {
        id: true,
        title: true,
        content: true,
        status: true,
        createdAt: true,
        cc: true,
        companyName: true,
      },
    });
    // === 상태 변경 시 이메일 알림 ===
    if (status && prevTicket && prevTicket.status !== status) {
      try {
        const toList = await getUserNotificationEmails(prevTicket.userId);
        const ccEmails = (ticket.cc && ticket.cc.length > 0) ? ticket.cc : undefined;
        if (toList.length > 0) {
          const subject = `[티켓 상태변경] ${ticket.title}`;
          const html = `<div><b>티켓 상태가 변경되었습니다.</b><br/>제목: ${ticket.title}<br/>고객사명: ${ticket.companyName || '-'}<br/>이전 상태: ${prevTicket.status}<br/>변경 후 상태: ${status}<br/>변경일: ${new Date().toLocaleString('ko-KR')}</div>`;
          await sendMail({ to: toList, cc: ccEmails, subject, html });
        }
      } catch (e) {
        console.error('상태변경 이메일 발송 실패:', e);
      }
    }
    // === // ===
    res.json({ ticket });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 티켓 삭제
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const ticketId = Number(req.params.id);
    // 연관 파일, 댓글, 메시지 등도 함께 삭제 (prisma에서 onDelete: CASCADE 권장)
    await prisma.file.deleteMany({ where: { ticketId } });
    await prisma.comment.deleteMany({ where: { ticketId } });
    await prisma.message.deleteMany({ where: { ticketId } });
    await prisma.ticket.delete({ where: { id: ticketId } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 티켓별 메시지(채팅) history 조회
router.get('/:id/messages', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const ticketId = Number(req.params.id);
    const messages = await prisma.message.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      include: { user: true, files: true },
    });
    res.json({ messages });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

export default router; 