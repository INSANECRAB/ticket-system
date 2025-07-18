import React, { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!token) return setError('토큰이 없습니다.');
    if (password.length < 6) return setError('비밀번호는 6자 이상이어야 합니다.');
    if (password !== confirm) return setError('비밀번호가 일치하지 않습니다.');
    setLoading(true);
    try {
      await axios.post('/api/auth/reset', { token, password });
      setSuccess('비밀번호가 재설정되었습니다. 로그인 해주세요.');
      setTimeout(() => router.push('/login'), 1500);
    } catch (e: any) {
      setError(e.response?.data?.message || '재설정 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-80">
        <h2 className="text-2xl font-bold mb-6 text-center">비밀번호 재설정</h2>
        <input
          type="password"
          placeholder="새 비밀번호"
          className="w-full mb-3 px-3 py-2 border rounded"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="비밀번호 확인"
          className="w-full mb-3 px-3 py-2 border rounded"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
        />
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        {success && <div className="text-green-600 text-sm mb-2">{success}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? '재설정 중...' : '비밀번호 재설정'}
        </button>
      </form>
    </div>
  );
} 