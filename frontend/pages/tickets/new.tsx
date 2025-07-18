import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../store/auth';
import api from '../../utils/api';

export default function NewTicketPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // 추가: CC, 고객사명
  const [ccInput, setCcInput] = useState('');
  const [ccList, setCcList] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState('');

  if (!token && typeof window !== 'undefined') {
    router.push('/login');
    return null;
  }

  const handleAddCc = () => {
    const email = ccInput.trim();
    if (email && !ccList.includes(email)) {
      setCcList([...ccList, email]);
      setCcInput('');
    }
  };
  const handleRemoveCc = (email: string) => {
    setCcList(ccList.filter(e => e !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('cc', JSON.stringify(ccList));
      formData.append('companyName', companyName);
      if (file) formData.append('file', file);
      await api.post('/tickets', formData, { headers: { Authorization: `Bearer ${token}` } });
      router.push('/tickets');
    } catch (e: any) {
      setError(e.response?.data?.message || '생성 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">새 티켓 생성</h1>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
          <input
            type="text"
            placeholder="제목"
            className="w-full px-3 py-2 border rounded"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="내용"
            className="w-full px-3 py-2 border rounded min-h-[100px]"
            value={content}
            onChange={e => setContent(e.target.value)}
            required
          />
          {/* 고객사명 입력 */}
          <input
            type="text"
            placeholder="고객사명 (선택)"
            className="w-full px-3 py-2 border rounded"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
          />
          {/* CC 입력 */}
          <div>
            <div className="flex gap-2 mb-2">
              <input
                type="email"
                placeholder="CC 이메일 추가"
                className="flex-1 px-3 py-2 border rounded"
                value={ccInput}
                onChange={e => setCcInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCc(); } }}
              />
              <button type="button" onClick={handleAddCc} className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700">추가</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {ccList.map(email => (
                <span key={email} className="bg-gray-200 px-2 py-1 rounded text-sm flex items-center gap-1">
                  {email}
                  <button type="button" onClick={() => handleRemoveCc(email)} className="ml-1 text-red-500 hover:underline">×</button>
                </span>
              ))}
            </div>
          </div>
          <input
            type="file"
            className="mb-3"
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? '생성 중...' : '티켓 생성'}
          </button>
        </form>
      </div>
    </Layout>
  );
} 