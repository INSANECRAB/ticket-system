import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth';
import userRouter from './routes/user';
import ticketRouter from './routes/ticket';
import commentRouter from './routes/comment';
import emailTemplateRouter from './routes/emailTemplate';
import { uploadFileToMinio } from './utils/minio';
import { sendMail } from './utils/email';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/tickets', ticketRouter);
app.use('/comments', commentRouter);
app.use('/email-template', emailTemplateRouter);

app.get('/health', (req, res) => res.send('OK'));

// TODO: 라우터 연결, 인증, 파일 업로드 등

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join', async ({ ticketId, userName }) => {
    if (!ticketId) {
      socket.emit('history', []);
      return;
    }
    socket.join(ticketId);
    console.log(`${userName} joined ticket ${ticketId}`);
    // 이전 메시지 + 파일 불러오기
    const messages = await prisma.message.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      include: { user: true },
    });
    socket.emit('history', messages.map(m => ({
      id: m.id,
      user: m.user?.email,
      content: m.content,
      createdAt: m.createdAt,
    })));
  });

  socket.on('chat', async (msg) => {
    // msg: { ticketId, user, content, createdAt, file }
    if (!msg.ticketId) {
      // ticketId가 없거나 잘못된 값이면 메시지 저장하지 않고 무시
      return;
    }
    let user = await prisma.user.findUnique({ where: { email: msg.user } });
    if (!user) {
      user = await prisma.user.create({ data: { email: msg.user, role: 'CUSTOMER', password: 'changeme' } });
    }
    // 메시지 저장
    const message = await prisma.message.create({
      data: {
        content: msg.content,
        userId: user.id,
        ticketId: msg.ticketId,
      },
    });
    // 파일 저장(있으면)
    let fileData = null;
    if (msg.file) {
      const buffer = Buffer.from(msg.file.data, 'base64');
      const { originalFileName } = await uploadFileToMinio(msg.file.name, buffer, msg.file.mimetype);
      const file = await prisma.file.create({
        data: {
          filename: originalFileName.normalize('NFC'),
        },
      });
      fileData = { filename: file.filename };
    }
    // 알림 메일 발송
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: msg.ticketId },
        include: { user: true },
      });
      if (ticket) {
        const to = ticket.user ? [ticket.user.email] : [];
        if (user.email !== ticket.user.email) to.push(user.email); // 고객/상담원 모두에게
        await sendMail({
          to: to.join(','),
          subject: `[티켓시스템] 새 채팅 메시지 알림`,
          html: `<p>티켓: ${ticket.title}</p><p>${user.email}: ${msg.content}</p>${fileData ? `<p>파일: <a href='${fileData.filename}'>${fileData.filename}</a></p>` : ''}`
        });
      }
    } catch (e) { console.error('메일 발송 오류', e); }
    io.to(msg.ticketId).emit('chat', {
      id: message.id,
      user: user.email,
      content: message.content,
      createdAt: message.createdAt,
      file: fileData,
    });
  });
});

// 서버 실행
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});