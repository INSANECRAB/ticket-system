import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticateJWT, AuthRequest } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// 사용자 목록 (관리자만)
router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: '권한이 없습니다.' });
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, invited: true, createdAt: true }
    });
    res.json({ users });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 사용자 초대/추가 (관리자만)
router.post('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: '권한이 없습니다.' });
    const { email, name, role } = req.body;
    if (!email || !role) return res.status(400).json({ message: '이메일/권한 필수' });
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ message: '이미 존재하는 이메일' });
    const user = await prisma.user.create({
      data: { email, name, role, invited: false, password: 'changeme' }
    });
    res.json({ user });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 권한 변경 (관리자만)
router.put('/:id/role', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: '권한이 없습니다.' });
    const userId = Number(req.params.id);
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: '권한 필수' });
    const user = await prisma.user.update({ where: { id: userId }, data: { role } });
    res.json({ user });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 사용자 삭제 (관리자만)
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: '권한이 없습니다.' });
    const userId = Number(req.params.id);
    await prisma.user.delete({ where: { id: userId } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 내 환경설정 조회
router.get('/me/settings', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id ? Number(req.user.id) : undefined;
    if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailNotificationsEnabled: true,
        extraEmails: true,
      },
    });
    res.json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 내 환경설정 수정
router.put('/me/settings', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id ? Number(req.user.id) : undefined;
    if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });
    const { emailNotificationsEnabled, extraEmails } = req.body;
    const data: any = {};
    if (typeof emailNotificationsEnabled !== 'undefined') data.emailNotificationsEnabled = emailNotificationsEnabled;
    if (Array.isArray(extraEmails)) data.extraEmails = extraEmails;
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        emailNotificationsEnabled: true,
        extraEmails: true,
      },
    });
    res.json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 내 정보 조회
router.get('/me', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: '로그인이 필요합니다.' });
    const user = await prisma.user.findUnique({
      where: { id: Number(req.user.id) },
      select: { id: true, email: true, name: true, role: true }
    });
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    res.json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 초대 내역 조회 (관리자만)
router.get('/invites', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: '권한이 없습니다.' });
    const invites = await prisma.invite.findMany();
    res.json({ invites });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 초대 내역 삭제 (관리자만)
router.delete('/invites/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: '권한이 없습니다.' });
    const inviteId = Number(req.params.id);
    await prisma.invite.delete({ where: { id: inviteId } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

export default router; 