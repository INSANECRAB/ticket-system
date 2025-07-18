import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { useAuth } from '../store/auth';

export default function MyPage() {
  const { token } = useAuth();
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [extraEmailInput, setExtraEmailInput] = useState('');
  const [extraEmails, setExtraEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) return;
    api.get('/users/me/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setEmailNotificationsEnabled(res.data.emailNotificationsEnabled ?? true);
        setExtraEmails(res.data.extraEmails || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const handleAddEmail = () => {
    const email = extraEmailInput.trim();
    if (email && !extraEmails.includes(email)) {
      setExtraEmails([...extraEmails, email]);
      setExtraEmailInput('');
    }
  };
  const handleRemoveEmail = (email: string) => {
    setExtraEmails(extraEmails.filter(e => e !== email));
  };
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/users/me/settings', {
        emailNotificationsEnabled,
        extraEmails,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('저장되었습니다.');
    } catch (e: any) {
      setError(e.response?.data?.message || '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><div className="text-center py-12">로딩 중...</div></Layout>;

  return (
    <Layout>
      <div className="max-w-lg mx-auto bg-white rounded shadow p-8 mt-8">
        <h1 className="text-2xl font-bold mb-6">내 환경설정</h1>
        <div className="mb-6 flex items-center gap-2">
          <input
            type="checkbox"
            id="emailNotificationsEnabled"
            checked={emailNotificationsEnabled}
            onChange={e => setEmailNotificationsEnabled(e.target.checked)}
            className="w-5 h-5"
          />
          <label htmlFor="emailNotificationsEnabled" className="text-lg">티켓/댓글/상태변경 알림 메일 받기</label>
        </div>
        <div className="mb-6">
          <div className="mb-2 font-semibold">추가 이메일</div>
          <div className="flex gap-2 mb-2">
            <input
              type="email"
              placeholder="추가 이메일 입력"
              className="flex-1 px-3 py-2 border rounded"
              value={extraEmailInput}
              onChange={e => setExtraEmailInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddEmail(); } }}
            />
            <button type="button" onClick={handleAddEmail} className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700">추가</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {extraEmails.map(email => (
              <span key={email} className="bg-gray-200 px-2 py-1 rounded text-sm flex items-center gap-1">
                {email}
                <button type="button" onClick={() => handleRemoveEmail(email)} className="ml-1 text-red-500 hover:underline">×</button>
              </span>
            ))}
          </div>
        </div>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}
        <button
          type="button"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-semibold"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </Layout>
  );
} 