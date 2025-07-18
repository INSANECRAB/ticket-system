import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export async function sendMail({
  to,
  subject,
  html,
  cc,
  text,
}: {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string[];
  text?: string;
}) {
  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    cc,
    subject,
    html,
    text,
  });
}

export async function getUserNotificationEmails(userId: number): Promise<string[]> {
  // Prisma import는 함수 내부에서 동적으로
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return [];
  if (!user.emailNotificationsEnabled) return [];
  const emails = [user.email, ...(user.extraEmails || [])];
  // 중복 제거
  return Array.from(new Set(emails.filter(Boolean)));
} 