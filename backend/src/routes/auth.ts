import { Router } from 'express';
import { inviteUser, acceptInvite, login, requestReset, resetPassword } from '../services/authService';
import { authenticateJWT, requireRole, AuthRequest } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

// 회원 초대 (관리자만)
router.post('/invite', authenticateJWT, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) return res.status(400).json({ message: '이메일과 권한을 입력하세요.' });
    const result = await inviteUser(req.user!.id, email, role as Role);
    res.json({ message: '초대 메일이 발송되었습니다.', token: result.token });
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 초대 수락 (비밀번호 설정)
router.post('/accept-invite', async (req, res) => {
  try {
    const { token, password } = req.body;
    console.log('accept-invite called', { token, password });
    if (!token || !password) return res.status(400).json({ message: '토큰과 비밀번호를 입력하세요.' });
    const result = await acceptInvite(token, password);
    res.json(result);
  } catch (e: any) {
    console.error('accept-invite error:', e, e?.stack);
    res.status(400).json({ message: e.message });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: '이메일과 비밀번호를 입력하세요.' });
    const result = await login(email, password);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 비밀번호 재설정 요청
router.post('/request-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: '이메일을 입력하세요.' });
    const result = await requestReset(email);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 비밀번호 재설정
router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: '토큰과 비밀번호를 입력하세요.' });
    const result = await resetPassword(token, password);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

export default router; 