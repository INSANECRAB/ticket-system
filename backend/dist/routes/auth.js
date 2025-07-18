"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authService_1 = require("../services/authService");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// 회원 초대 (관리자만)
router.post('/invite', auth_1.authenticateJWT, (0, auth_1.requireRole)('ADMIN'), async (req, res) => {
    try {
        const { email, role } = req.body;
        if (!email || !role)
            return res.status(400).json({ message: '이메일과 권한을 입력하세요.' });
        const result = await (0, authService_1.inviteUser)(req.user.id, email, role);
        res.json({ message: '초대 메일이 발송되었습니다.', token: result.token });
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
// 초대 수락 (비밀번호 설정)
router.post('/accept-invite', async (req, res) => {
    try {
        const { token, password } = req.body;
        console.log('accept-invite called', { token, password });
        if (!token || !password)
            return res.status(400).json({ message: '토큰과 비밀번호를 입력하세요.' });
        const result = await (0, authService_1.acceptInvite)(token, password);
        res.json(result);
    }
    catch (e) {
        console.error('accept-invite error:', e, e?.stack);
        res.status(400).json({ message: e.message });
    }
});
// 로그인
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: '이메일과 비밀번호를 입력하세요.' });
        const result = await (0, authService_1.login)(email, password);
        res.json(result);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
// 비밀번호 재설정 요청
router.post('/request-reset', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ message: '이메일을 입력하세요.' });
        const result = await (0, authService_1.requestReset)(email);
        res.json(result);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
// 비밀번호 재설정
router.post('/reset', async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password)
            return res.status(400).json({ message: '토큰과 비밀번호를 입력하세요.' });
        const result = await (0, authService_1.resetPassword)(token, password);
        res.json(result);
    }
    catch (e) {
        res.status(400).json({ message: e.message });
    }
});
exports.default = router;
