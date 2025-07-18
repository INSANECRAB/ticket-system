import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    console.log('API ROUTE req.body:', req.body);
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    const result = await axios.post(
      `${backendUrl}/auth/accept-invite`,
      req.body,
      { headers: { 'Content-Type': 'application/json' } }
    );
    res.status(200).json(result.data);
  } catch (e: any) {
    res.status(e.response?.status || 500).json({ message: e.response?.data?.message || '가입 실패' });
  }
} 