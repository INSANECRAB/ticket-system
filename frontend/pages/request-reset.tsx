import React, { useState } from 'react';
import axios from 'axios';

export default function RequestResetPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await axios.post('/api/auth/request-reset', { email });
      setSuccess('비밀번호 재설정 메일이 발송되었습니다. 메일을 확인하세요.');
    } catch (e: any) {
      setError(e.response?.data?.message || '요청 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-80">
        <h2 className="text-2xl font-bold mb-6 text-center">비밀번호 재설정 요청</h2>
        <input
          type="email"
          placeholder="이메일"
          className="w-full mb-3 px-3 py-2 border rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        {success && <div className="text-green-600 text-sm mb-2">{success}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? '요청 중...' : '메일 발송'}
        </button>
      </form>
    </div>
  );
} 