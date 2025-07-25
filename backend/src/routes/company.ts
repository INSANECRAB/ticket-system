import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthRequest } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// 고객사 목록 조회 (관리자만)
router.get('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: '관리자만 접근 가능합니다.' });
    }
    const companies = await prisma.company.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { users: true, tickets: true } }
      }
    });
    res.json({ companies });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 고객사 생성 (관리자만)
router.post('/', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: '관리자만 접근 가능합니다.' });
    }
    const { name, contact, contractInfo, supportType, description } = req.body;
    if (!name) return res.status(400).json({ message: '고객사명을 입력하세요.' });
    
    const company = await prisma.company.create({
      data: { name, contact, contractInfo, supportType, description }
    });
    res.json({ company });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 고객사 수정 (관리자만)
router.put('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: '관리자만 접근 가능합니다.' });
    }
    const { name, contact, contractInfo, supportType, description } = req.body;
    const company = await prisma.company.update({
      where: { id: req.params.id },
      data: { name, contact, contractInfo, supportType, description }
    });
    res.json({ company });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 고객사 삭제 (관리자만)
router.delete('/:id', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: '관리자만 접근 가능합니다.' });
    }
    await prisma.company.delete({ where: { id: req.params.id } });
    res.json({ message: '삭제되었습니다.' });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

export default router;