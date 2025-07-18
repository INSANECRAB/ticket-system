import type { NextApiRequest, NextApiResponse } from 'next';
import jwt, { JwtPayload } from 'jsonwebtoken';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: '토큰 없음' });
  try {
    const payload = jwt.decode(token) as JwtPayload;
    if (!payload?.email) throw new Error();
    res.json({ email: payload.email });
  } catch {
    res.status(400).json({ message: '유효하지 않은 초대 토큰입니다.' });
  }
} 