"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const ticket_1 = __importDefault(require("./routes/ticket"));
const comment_1 = __importDefault(require("./routes/comment"));
const emailTemplate_1 = __importDefault(require("./routes/emailTemplate"));
const minio_1 = require("./utils/minio");
const email_1 = require("./utils/email");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: '*' } });
const prisma = new client_1.PrismaClient();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/auth', auth_1.default);
app.use('/users', user_1.default);
app.use('/tickets', ticket_1.default);
app.use('/comments', comment_1.default);
app.use('/email-template', emailTemplate_1.default);
app.get('/health', (req, res) => res.send('OK'));
// TODO: 라우터 연결, 인증, 파일 업로드 등
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    socket.on('join', async ({ ticketId, userName }) => {
        if (!ticketId || isNaN(Number(ticketId))) {
            socket.emit('history', []);
            return;
        }
        socket.join(ticketId);
        console.log(`${userName} joined ticket ${ticketId}`);
        // 이전 메시지 + 파일 불러오기
        const messages = await prisma.message.findMany({
            where: { ticketId: Number(ticketId) },
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
        if (!msg.ticketId || isNaN(Number(msg.ticketId))) {
            // ticketId가 없거나 잘못된 값이면 메시지 저장하지 않고 무시
            return;
        }
        let user = await prisma.user.findUnique({ where: { email: msg.user } });
        if (!user) {
            user = await prisma.user.create({ data: { email: msg.user, role: 'CUSTOMER', invited: false, password: 'changeme' } });
        }
        // 메시지 저장
        const message = await prisma.message.create({
            data: {
                content: msg.content,
                userId: user.id,
                ticketId: Number(msg.ticketId),
            },
        });
        // 파일 저장(있으면)
        let fileData = null;
        if (msg.file) {
            // msg.file: { name, data(base64), mimetype }
            const buffer = Buffer.from(msg.file.data, 'base64');
            const { url, originalFileName } = await (0, minio_1.uploadFileToMinio)(msg.file.name, buffer, msg.file.mimetype);
            const file = await prisma.file.create({
                data: {
                    filename: originalFileName.normalize('NFC'), // 반드시 NFC로 정규화해서 저장
                    url,
                    size: buffer.length,
                    messageId: message.id,
                },
            });
            fileData = { filename: file.filename, url: file.url };
        }
        // 알림 메일 발송
        try {
            const ticket = await prisma.ticket.findUnique({
                where: { id: msg.ticketId },
                include: { user: true },
            });
            if (ticket) {
                const to = [ticket.user.email];
                if (user.email !== ticket.user.email)
                    to.push(user.email); // 고객/상담원 모두에게
                await (0, email_1.sendMail)({
                    to: to.join(','),
                    subject: `[티켓시스템] 새 채팅 메시지 알림`,
                    html: `<p>티켓: ${ticket.title}</p><p>${user.email}: ${msg.content}</p>${fileData ? `<p>파일: <a href='${fileData.url}'>${fileData.filename}</a></p>` : ''}`
                });
            }
        }
        catch (e) {
            console.error('메일 발송 오류', e);
        }
        io.to(msg.ticketId).emit('chat', {
            id: message.id,
            user: user.email,
            content: message.content,
            createdAt: message.createdAt,
            file: fileData,
        });
    });
});
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
});
