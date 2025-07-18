"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
exports.getUserNotificationEmails = getUserNotificationEmails;
const nodemailer_1 = __importDefault(require("nodemailer"));
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});
async function sendMail({ to, subject, html, cc, text, }) {
    await transporter.sendMail({
        from: EMAIL_FROM,
        to,
        cc,
        subject,
        html,
        text,
    });
}
async function getUserNotificationEmails(userId) {
    // Prisma import는 함수 내부에서 동적으로
    const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        return [];
    if (!user.emailNotificationsEnabled)
        return [];
    const emails = [user.email, ...(user.extraEmails || [])];
    // 중복 제거
    return Array.from(new Set(emails.filter(Boolean)));
}
