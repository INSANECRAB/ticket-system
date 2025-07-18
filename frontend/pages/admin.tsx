import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { useAuth } from '../store/auth';

interface User {
  id: number;
  email: string;
  name?: string;
  role: string;
  invited: boolean;
  createdAt: string;
}

interface Invite {
  id: number;
  email: string;
  role: string;
  invitedAt: string;
  accepted: boolean;
  acceptedAt?: string;
}

export default function AdminPage() {
  const { token, user, fetchUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  // 초대 관련 상태
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('CUSTOMER');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  // 템플릿 관련 상태
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState('');
  const [templateSuccess, setTemplateSuccess] = useState('');
  const [deleteMessage, setDeleteMessage] = useState<{text: string, color: string} | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);

  // 사용자 목록 새로고침 함수
  const fetchUsersAndInvites = () => {
    if (!token) return;
    setLoading(true);
    setFetchError('');
    Promise.all([
      api.get('/users', { headers: { Authorization: `Bearer ${token}` } }),
      api.get('/users/invites', { headers: { Authorization: `Bearer ${token}` } })
    ]).then(([usersRes, invitesRes]) => {
      setUsers(Array.isArray(usersRes.data?.users) ? usersRes.data.users : []);
      setInvites(Array.isArray(invitesRes.data?.invites) ? invitesRes.data.invites : []);
      setLoading(false);
    }).catch((e) => {
      setFetchError(e?.response?.data?.message || '데이터를 불러오지 못했습니다.');
      setUsers([]);
      setInvites([]);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (token && !user) fetchUser();
    if (!token) return;
    fetchUsersAndInvites();
    // 초대 메일 템플릿 불러오기
    setTemplateLoading(true);
    api.get('/email-template/invite', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setTemplateSubject(res.data?.subject || '');
        setTemplateBody(res.data?.body || '');
        setTemplateLoading(false);
      })
      .catch(() => {
        setTemplateSubject('');
        setTemplateBody('');
        setTemplateLoading(false);
      });
  }, [token, user, fetchUser]);

  // 접근 차단: ADMIN이 아니면
  if (user && user.role !== 'ADMIN') {
    return (
      <Layout>
        <div className="max-w-xl mx-auto mt-16 text-center text-red-600 text-lg font-bold">관리자만 접근할 수 있습니다.</div>
      </Layout>
    );
  }

  // 로딩/에러/빈 데이터 방어 분기
  if (loading) {
    return <Layout><div className="text-center mt-16">로딩 중...</div></Layout>;
  }
  if (fetchError) {
    return <Layout><div className="text-center mt-16 text-red-600">{fetchError}</div></Layout>;
  }
  if (!Array.isArray(users) || !Array.isArray(invites)) {
    return <Layout><div className="text-center mt-16 text-red-600">데이터를 불러오지 못했습니다.</div></Layout>;
  }

  // 사용자 초대 핸들러
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(''); setInviteSuccess('');
    try {
      await api.post('/auth/invite', { email: inviteEmail, role: inviteRole }, { headers: { Authorization: `Bearer ${token}` } });
      setInviteSuccess('초대 메일이 발송되었습니다.');
      setInviteEmail(''); setInviteRole('CUSTOMER');
      fetchUsersAndInvites(); // 초대 성공 시 목록 갱신
    } catch (e: any) {
      setInviteError(e.response?.data?.message || '초대 실패');
      fetchUsersAndInvites(); // 초대 실패 시에도 목록 갱신(실패로 추가된 유저가 있으면 바로 반영)
    }
  };

  // 템플릿 저장 핸들러
  const handleSaveTemplate = async () => {
    setTemplateError(''); setTemplateSuccess('');
    try {
      await api.put('/email-template/invite', { subject: templateSubject, body: templateBody }, { headers: { Authorization: `Bearer ${token}` } });
      setTemplateSuccess('저장되었습니다.');
    } catch (e: any) {
      setTemplateError(e.response?.data?.message || '저장 실패');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    setDeleteMessage(null);
    try {
      await api.delete(`/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(prev => prev.filter(u => u.id !== id));
      setDeleteMessage({ text: '유저가 삭제되었습니다.', color: 'blue' });
    } catch (e) {
      setDeleteMessage({ text: '삭제 실패했습니다.', color: 'red' });
    }
  };

  const handleRoleChange = async (id: number, newRole: string) => {
    await api.put(`/users/${id}/role`, { role: newRole }, { headers: { Authorization: `Bearer ${token}` } });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
  };

  const handleDeleteInvite = async (inviteId: number) => {
    if (!window.confirm('정말 초대 내역을 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/users/invites/${inviteId}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchUsersAndInvites();
      setDeleteMessage({ text: '초대 내역이 삭제되었습니다.', color: 'blue' });
    } catch (e) {
      setDeleteMessage({ text: '초대 내역 삭제 실패', color: 'red' });
    }
  };

  const allEmails = new Set([
    ...((Array.isArray(users) ? users : []).map(u => u.email)),
    ...((Array.isArray(invites) ? invites : []).filter(i => !i.accepted).map(i => i.email))
  ]);
  const mergedList = Array.from(allEmails).map(email => {
    const user = (Array.isArray(users) ? users : []).find(u => u.email === email);
    const invite = (Array.isArray(invites) ? invites : []).find(i => i.email === email && !i.accepted);
    return {
      email,
      name: user?.name || '-',
      role: user?.role || invite?.role || 'CUSTOMER',
      createdAt: user?.createdAt || invite?.invitedAt || '',
      status: user ? '등록완료' : '초대메일 발송완료',
      id: user?.id || invite?.id,
      isUser: !!user
    };
  });

  return (
    <Layout>
      <div className="max-w-2xl mx-auto bg-white rounded shadow p-8 mt-8">
        <h1 className="text-2xl font-bold mb-6">사용자 관리</h1>
        {deleteMessage && (
          <div className={`mb-4 text-${deleteMessage.color}-600 font-semibold`}>{deleteMessage.text}</div>
        )}
        {/* 사용자 초대 폼 */}
        <form onSubmit={handleInvite} className="flex gap-2 mb-6 items-end">
          <div className="flex-1">
            <label className="block text-sm mb-1">초대 이메일</label>
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full border px-2 py-1 rounded" required type="email" />
          </div>
          <div>
            <label className="block text-sm mb-1">권한</label>
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="border px-2 py-1 rounded">
              <option value="CUSTOMER">고객</option>
              <option value="AGENT">상담원</option>
              <option value="ADMIN">관리자</option>
            </select>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">초대</button>
        </form>
        {inviteError && <div className="text-red-600 mb-2">{inviteError}</div>}
        {inviteSuccess && <div className="text-green-600 mb-2">{inviteSuccess}</div>}
        {/* 템플릿 관리 UI */}
        <div className="my-8 p-4 bg-gray-50 rounded">
          <div className="font-bold mb-2">초대 메일 템플릿 관리</div>
          <div className="text-xs text-gray-500 mb-2">사용 가능한 변수: <span className="font-mono">${'{inviteUrl}'}</span>, <span className="font-mono">${'{email}'}</span></div>
          <input
            type="text"
            className="w-full border px-2 py-1 rounded mb-2"
            value={templateSubject}
            onChange={e => setTemplateSubject(e.target.value)}
            placeholder="메일 제목"
            disabled={templateLoading}
          />
          <textarea
            className="w-full border px-2 py-1 rounded mb-2 min-h-[100px]"
            value={templateBody}
            onChange={e => setTemplateBody(e.target.value)}
            placeholder="메일 본문 (HTML 가능)"
            disabled={templateLoading}
          />
          {templateError && <div className="text-red-600 mb-2">{templateError}</div>}
          {templateSuccess && <div className="text-green-600 mb-2">{templateSuccess}</div>}
          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={handleSaveTemplate}
            disabled={templateLoading}
          >
            템플릿 저장
          </button>
        </div>
        {/* 기존 사용자 목록 테이블은 그대로 유지 */}
        {Array.isArray(mergedList) && mergedList.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-3">이메일</th>
                <th className="py-2 px-3">이름</th>
                <th className="py-2 px-3">권한</th>
                <th className="py-2 px-3">가입/초대일</th>
                <th className="py-2 px-3">상태</th>
                <th className="py-2 px-3">관리</th>
              </tr>
            </thead>
            <tbody>
              {mergedList.map(u => (
                <tr key={u.email} className="border-b">
                  <td className="py-2 px-3">{u.email}</td>
                  <td className="py-2 px-3">{u.name}</td>
                  <td className="py-2 px-3">
                    <select
                      value={u.role}
                      onChange={e => {
                        if (u.isUser && u.id !== undefined) {
                          handleRoleChange(u.id, e.target.value);
                        }
                      }}
                      className="border rounded px-2 py-1"
                      disabled={!u.isUser}
                    >
                      <option value="CUSTOMER">고객</option>
                      <option value="AGENT">상담원</option>
                      <option value="ADMIN">관리자</option>
                    </select>
                  </td>
                  <td className="py-2 px-3">{u.createdAt.slice(0, 10)}</td>
                  <td className="py-2 px-3">
                    {u.status === '등록완료' ? <span className="text-green-600">등록완료</span> : <span className="text-blue-600">초대메일 발송완료</span>}
                  </td>
                  <td className="py-2 px-3">
                    {u.isUser && u.id !== undefined ? (
                      <button onClick={() => handleDelete(u.id as number)} className="text-red-600 hover:underline">삭제</button>
                    ) : !u.isUser && u.id !== undefined ? (
                      <button onClick={() => handleDeleteInvite(u.id as number)} className="text-red-600 hover:underline">초대 삭제</button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center text-gray-500">표시할 사용자가 없습니다.</div>
        )}
      </div>
    </Layout>
  );
} 