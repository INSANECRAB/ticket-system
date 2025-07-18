import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthRequest } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// 사용자 목록 (관리자만)
router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: '권한이 없습니다.' });
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true }
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
      data: { email, name, role, password: 'changeme' }
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
    const userId = req.params.id;
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
    const userId = req.params.id;
    await prisma.user.delete({ where: { id: userId } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 내 환경설정 조회
router.get('/me/settings', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id ? req.user.id : undefined;
    if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    res.json(user);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 내 환경설정 수정
router.put('/me/settings', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id ? req.user.id : undefined;
    if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });
    const { extraEmails } = req.body;
    const data: any = {};
    if (Array.isArray(extraEmails)) data.extraEmails = extraEmails;
    const user = await prisma.user.update({
      where: { id: userId },
      data,
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
      where: { id: req.user.id },
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
    const inviteId = req.params.id;
    await prisma.invite.delete({ where: { id: Number(inviteId) } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// === Company(고객사) 관리 API ===
// 고객사 목록 조회 (관리자만)
router.get('/companies', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: '권한이 없습니다.' });
    const companies = await prisma.company.findMany({
      include: { users: { select: { id: true, email: true, name: true } } }
    });
    res.json({ companies });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 고객사 생성 (관리자만)
router.post('/companies', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: '권한이 없습니다.' });
    const { name, domain } = req.body;
    if (!name) return res.status(400).json({ message: '고객사명을 입력하세요.' });
    const company = await prisma.company.create({ data: { name, domain } });
    res.json({ company });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 고객사 정보 수정 (관리자만)
router.put('/companies/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: '권한이 없습니다.' });
    const { name, domain } = req.body;
    const company = await prisma.company.update({ where: { id: req.params.id }, data: { name, domain } });
    res.json({ company });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 고객사 삭제 (관리자만)
router.delete('/companies/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: '권한이 없습니다.' });
    await prisma.company.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 고객사에 유저 추가 (관리자만, 수동)
router.post('/companies/:id/users', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: '권한이 없습니다.' });
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId 필요' });
    const user = await prisma.user.update({ where: { id: userId }, data: { companyId: req.params.id } });
    res.json({ user });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 고객사에서 유저 제거 (관리자만)
router.delete('/companies/:id/users/:userId', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: '권한이 없습니다.' });
    const user = await prisma.user.update({ where: { id: req.params.userId }, data: { companyId: null } });
    res.json({ user });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 회원가입/초대 시 이메일 도메인 기반 자동 고객사 매핑 (서비스 함수에서 활용)

export default router; 