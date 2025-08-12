import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, AuthRequest } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// 기본 템플릿 생성 함수
const createDefaultTemplate = async (type: string) => {
  const defaultTemplates = {
    invite: {
      subject: '[티켓시스템] 회원 초대 안내',
      body: `<p>안녕하세요.</p><p>아래 링크를 클릭해 비밀번호를 설정하고 가입을 완료하세요.</p><p><a href="\${inviteUrl}">\${inviteUrl}</a></p><p>이메일: \${email}</p>`
    }
  };
  
  const defaultTemplate = defaultTemplates[type as keyof typeof defaultTemplates];
  if (defaultTemplate) {
    return await prisma.inviteEmailTemplate.create({
      data: { type, ...defaultTemplate }
    });
  }
  return null;
};

// 템플릿 조회 (관리자만)
router.get('/:type', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: '권한이 없습니다.' });
    const { type } = req.params;
    let template = await prisma.inviteEmailTemplate.findFirst({ where: { type } });
    if (!template) {
      template = await createDefaultTemplate(type);
      if (!template) return res.status(404).json({ message: '템플릿 없음' });
    }
    res.json(template);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// 템플릿 수정/저장 (관리자만)
router.put('/:type', authenticateJWT, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: '권한이 없습니다.' });
    const { type } = req.params;
    const { subject, body } = req.body;
    if (!subject || !body) return res.status(400).json({ message: 'subject/body 필수' });
    let template = await prisma.inviteEmailTemplate.findFirst({ where: { type } });
    if (template) {
      template = await prisma.inviteEmailTemplate.update({ where: { id: template.id }, data: { subject, body } });
    } else {
      template = await prisma.inviteEmailTemplate.create({ data: { type, subject, body } });
    }
    res.json(template);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});



export default router; 