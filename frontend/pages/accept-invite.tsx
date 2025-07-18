import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function AcceptInvitePage() {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(true);

  // 토큰에서 이메일 추출(백엔드에 요청)
  useEffect(() => {
    if (!token) return;
    setChecking(true);
    axios.post('/api/auth/check-invite', { token })
      .then(res => setEmail(res.data.email))
      .catch(() => setError('유효하지 않은 초대 토큰입니다.'))
      .finally(() => setChecking(false));
  }, [token]);

  // 패스워드 규칙: 8자 이상, 영문/숫자/특수문자 2종류 이상
  function isValidPassword(pw: string) {
    if (pw.length < 8) return false;
    let types = 0;
    if (/[A-Za-z]/.test(pw)) types++;
    if (/[0-9]/.test(pw)) types++;
    if (/[^A-Za-z0-9]/.test(pw)) types++;
    return types >= 2;
  }
  const passwordValid = isValidPassword(password);
  const canSubmit = passwordValid && password === confirm && !loading && !!token && !!email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!token) return setError('초대 토큰이 없습니다.');
    if (!passwordValid) return setError('비밀번호 규칙을 확인하세요.');
    if (password !== confirm) return setError('비밀번호가 일치하지 않습니다.');
    setLoading(true);
    try {
      await axios.post('/api/auth/accept-invite', { token, password });
      setSuccess('가입이 완료되었습니다. 로그인 해주세요.');
      setTimeout(() => router.push('/login'), 1500);
    } catch (e: any) {
      setError(e.response?.data?.message || '가입 실패');
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <div className="flex min-h-screen items-center justify-center bg-gray-50">초대 정보 확인 중...</div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-80">
        <h2 className="text-2xl font-bold mb-6 text-center">비밀번호 설정</h2>
        <div className="mb-3">
          <label className="block text-sm mb-1">이메일</label>
          <input type="email" value={email} disabled className="w-full px-3 py-2 border rounded bg-gray-100 text-gray-500" />
        </div>
        <input
          type="password"
          placeholder="새 비밀번호"
          className="w-full mb-2 px-3 py-2 border rounded"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="비밀번호 확인"
          className="w-full mb-2 px-3 py-2 border rounded"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
        />
        <div className="text-xs text-gray-500 mb-2">
          비밀번호 규칙: 8자 이상, 영문/숫자/특수문자 중 2종류 이상
        </div>
        {!passwordValid && password.length > 0 && (
          <div className="text-red-500 text-xs mb-2">비밀번호 규칙을 확인하세요.</div>
        )}
        {password && confirm && password !== confirm && (
          <div className="text-red-500 text-xs mb-2">비밀번호가 일치하지 않습니다.</div>
        )}
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        {success && <div className="text-green-600 text-sm mb-2">{success}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={!canSubmit}
        >
          {loading ? '설정 중...' : '비밀번호 설정'}
        </button>
      </form>
    </div>
  );
} 