import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../store/auth';
import Chat from '../../components/Chat';
import api from '../../utils/api';
import debounce from 'lodash.debounce';

interface Ticket {
  id: string;
  ticketNo: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  files: { id: string; name: string; url: string }[];
  ccEmails?: string[];
  company?: { name: string };
}

interface Comment {
  id: string;
  content: string;
  user: { name: string };
  createdAt: string;
  files?: { id: string; name: string; url: string }[];
}

export default function TicketDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { token } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusEdit, setStatusEdit] = useState('');
  const [ccEdit, setCcEdit] = useState('');
  const [ccList, setCcList] = useState<string[]>([]);
  const [ccSuggestions, setCcSuggestions] = useState<string[]>([]);
  const [toast, setToast] = useState('');

  // CC 자동완성 (유저 이메일 추천)
  const fetchCcSuggestions = debounce(async (q: string) => {
    if (!q) return setCcSuggestions([]);
    try {
      const res = await api.get(`/users?query=${q}`, { headers: { Authorization: `Bearer ${token}` } });
      setCcSuggestions(res.data.users.map((u: any) => u.email).filter((email: string) => !ccList.includes(email)));
    } catch { setCcSuggestions([]); }
  }, 300);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    if (!id) return;
    setLoading(true);
    api.get(`/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const t = res.data.ticket;
        setTicket({
          id: t.id,
          ticketNo: t.ticketNo,
          title: t.title,
          content: t.content,
          status: t.status,
          createdAt: t.createdAt,
          files: (t.files || []).map((f: any) => ({ id: f.id, name: f.filename, url: f.url })),
          ccEmails: t.ccEmails || [],
          company: t.company || undefined,
        });
        setStatusEdit(t.status);
        setCcList(t.ccEmails || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // 댓글 목록 불러오기
    api.get(`/comments/ticket/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setComments(res.data.comments || []));
  }, [token, id, router]);

  useEffect(() => {
    if (ccEdit) fetchCcSuggestions(ccEdit);
    else setCcSuggestions([]);
  }, [ccEdit]);

  // 댓글 작성
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment) return;
    const res = await api.post('/comments', { ticketId: id, content: comment }, { headers: { Authorization: `Bearer ${token}` } });
    setComments(prev => [...prev, res.data.comment]);
    setComment('');
    setFile(null);
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: string) => {
    await api.delete(`/comments/${commentId}`, { headers: { Authorization: `Bearer ${token}` } });
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  // 댓글 수정
  const handleEditComment = async (commentId: string, newContent: string) => {
    const res = await api.put(`/comments/${commentId}`, { content: newContent }, { headers: { Authorization: `Bearer ${token}` } });
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: res.data.comment.content } : c));
  };

  // 티켓 삭제
  const handleDeleteTicket = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    await api.delete(`/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    router.push('/tickets');
  };

  // 티켓 수정
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const handleEditTicket = async () => {
    await api.put(`/tickets/${id}`, { title: editTitle, content: editContent }, { headers: { Authorization: `Bearer ${token}` } });
    setTicket(t => t ? { ...t, title: editTitle, content: editContent } : t);
    setEditMode(false);
  };

  // 상태 변경
  const handleStatusChange = async () => {
    await api.put(`/tickets/${id}`, { status: statusEdit }, { headers: { Authorization: `Bearer ${token}` } });
    setTicket(t => t ? { ...t, status: statusEdit } : t);
    setToast('상태가 변경되었습니다.');
    setTimeout(() => setToast(''), 2000);
  };

  // CC 추가
  const handleAddCc = () => {
    if (ccEdit && !ccList.includes(ccEdit)) {
      setCcList([...ccList, ccEdit]);
      setCcEdit('');
    }
  };
  // CC 저장
  const handleSaveCc = async () => {
    await api.put(`/tickets/${id}`, { cc: ccList }, { headers: { Authorization: `Bearer ${token}` } });
    setTicket(t => t ? { ...t, ccEmails: ccList } : t);
  };
  // CC 삭제
  const handleRemoveCc = (email: string) => {
    setCcList(ccList.filter(e => e !== email));
  };

  if (loading) return <Layout><div>로딩 중...</div></Layout>;
  if (!ticket) return <Layout><div>티켓을 찾을 수 없습니다.</div></Layout>;

  return (
    <Layout>
      {toast && <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow z-50">{toast}</div>}
      <div className="mb-10 p-8 bg-white rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">{ticket.title}</h1>
          <div>
            <button onClick={() => { setEditMode(true); setEditTitle(ticket.title); setEditContent(ticket.content); }} className="mr-2 text-xs text-blue-600 underline">수정</button>
            <button onClick={handleDeleteTicket} className="text-xs text-red-600 underline">삭제</button>
          </div>
        </div>
        <div className="text-gray-500 mb-3">
          <span className="font-semibold">티켓번호:</span> {ticket.ticketNo} |
          <span className="font-semibold ml-2">상태:</span> {ticket.status}
          <span className="ml-2">(변경:&nbsp;
            <select value={statusEdit} onChange={e => setStatusEdit(e.target.value)} className="border rounded px-2 py-1">
              <option value="NEW">NEW</option>
              <option value="OPEN">OPEN</option>
              <option value="PENDING">PENDING</option>
              <option value="ON_HOLD">ON_HOLD</option>
            </select>
            <button onClick={handleStatusChange} className="ml-1 px-2 py-1 bg-blue-500 text-white rounded text-xs">변경</button>
          )</span>
          <span className="font-semibold ml-2">고객사:</span> {ticket.company?.name ? (
            <a href={`/companies?name=${encodeURIComponent(ticket.company.name)}`} className="text-blue-600 underline hover:text-blue-800">{ticket.company.name}</a>
          ) : '-'}
          <span className="ml-2">생성일: {ticket.createdAt}</span>
        </div>
        {/* CC 표시 및 추가 UI */}
        <div className="mb-2">
          <span className="font-semibold">CC:</span>
          {ticket.ccEmails && ticket.ccEmails.length > 0 ? (
            ticket.ccEmails.map(email => (
              <span key={email} className="ml-2 inline-block bg-gray-200 px-2 py-1 rounded">
                {email}
                <button onClick={() => handleRemoveCc(email)} className="ml-1 text-xs text-red-500">x</button>
              </span>
            ))
          ) : <span className="ml-2 text-gray-400">없음</span>}
          <div className="mt-2 flex gap-2 relative">
            <input
              type="email"
              value={ccEdit}
              onChange={e => setCcEdit(e.target.value)}
              placeholder="이메일 추가"
              className="border rounded px-2 py-1"
              autoComplete="off"
            />
            <button onClick={handleAddCc} className="px-2 py-1 bg-gray-300 rounded">추가</button>
            <button onClick={handleSaveCc} className="px-2 py-1 bg-blue-500 text-white rounded">저장</button>
            {/* CC 자동완성 드롭다운 */}
            {ccSuggestions.length > 0 && (
              <ul className="absolute left-0 top-10 bg-white border rounded shadow z-10 w-full max-h-32 overflow-auto">
                {ccSuggestions.map(email => (
                  <li key={email} className="px-3 py-2 hover:bg-blue-100 cursor-pointer" onClick={() => { setCcEdit(email); setCcSuggestions([]); }}>{email}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mb-4 whitespace-pre-line text-lg">{ticket.content}</div>
        {editMode && (
          <div className="mt-2 p-4 border rounded bg-gray-50">
            <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="제목" className="block w-full mb-2 border px-3 py-2 rounded" />
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="내용" className="block w-full mb-2 border px-3 py-2 rounded min-h-[80px]" />
            <button onClick={handleEditTicket} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">저장</button>
            <button onClick={() => setEditMode(false)} className="bg-gray-300 px-4 py-2 rounded">취소</button>
          </div>
        )}
        {/* 첨부파일, ... */}
        {ticket.files.length > 0 && (
          <div className="mb-4">
            <span className="font-semibold">첨부파일:</span>
            {ticket.files.map(f => {
              const decodedName = decodeURIComponent(f.name);
              const isImage = /\.(png|jpe?g|gif|bmp|webp)$/i.test(decodedName);
              return (
                <span key={f.id} className="ml-2">
                  <a href={f.url} className="text-blue-600 underline" download>{decodedName}</a>
                  {isImage && (
                    <div style={{marginTop: 8}}>
                      <img src={f.url} alt={decodedName} style={{maxWidth: 400}} />
                    </div>
                  )}
                </span>
              );
            })}
          </div>
        )}
      </div>
      <div className="mb-12 p-8 bg-white rounded shadow">
        <h2 className="text-lg font-bold mb-4">댓글</h2>
        <form onSubmit={handleComment} className="flex flex-col gap-3 mb-6">
          <textarea
            placeholder="댓글을 입력하세요"
            className="w-full px-3 py-2 border rounded min-h-[60px]"
            value={comment}
            onChange={e => setComment(e.target.value)}
            required
          />
          <input
            type="file"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="border rounded px-3 py-2"
          />
          <button
            type="submit"
            className="self-end bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={!comment}
          >
            댓글 등록
          </button>
        </form>
        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="bg-gray-100 rounded p-4 flex justify-between items-start">
              <div>
                <div className="font-semibold mb-1">{c.user.name} <span className="text-xs text-gray-500">{c.createdAt}</span></div>
                <div className="mb-2 whitespace-pre-line">{c.content}</div>
              </div>
              <button onClick={() => handleDeleteComment(c.id)} className="text-xs text-red-600 underline ml-4">삭제</button>
              {/* 댓글 수정 UI는 인라인 에디터로 추가 가능 */}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
} 