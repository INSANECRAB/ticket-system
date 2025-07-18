import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useAuth } from '../../store/auth';
import api from '../../utils/api';
import Chat from '../../components/Chat';

interface Ticket {
  id: string;
  ticketNo: string;
  title: string;
  status: string;
  createdAt: string;
  company?: { name: string };
}

export default function TicketListPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    api.get('/tickets', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setTickets(res.data.tickets);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, router]);

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">티켓 목록</h1>
        <button
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition font-semibold text-base"
          onClick={() => router.push('/tickets/new')}
        >
          + 새 티켓 생성
        </button>
      </div>
      {loading ? (
        <div className="text-center text-gray-500 py-12">로딩 중...</div>
      ) : tickets.length === 0 ? (
        <div className="text-center text-gray-400 py-12">티켓이 없습니다.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-lg bg-white">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-sm">
                <th className="py-3 px-4 text-left font-semibold">번호</th>
                <th className="py-3 px-4 text-left font-semibold">제목</th>
                <th className="py-3 px-4 text-left font-semibold">고객사</th>
                <th className="py-3 px-4 text-left font-semibold">상태</th>
                <th className="py-3 px-4 text-left font-semibold">생성일</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <tr
                  key={ticket.id}
                  className="hover:bg-blue-50 cursor-pointer border-b transition"
                  onClick={() => router.push(`/tickets/${ticket.id}`)}
                >
                  <td className="py-3 px-4 font-mono text-xs text-gray-700">{ticket.ticketNo}</td>
                  <td className="py-3 px-4 text-base text-gray-900 font-medium">{ticket.title}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{ticket.company?.name || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                      ticket.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                      ticket.status === 'NEW' ? 'bg-blue-100 text-blue-700' :
                      ticket.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      ticket.status === 'ON_HOLD' ? 'bg-gray-300 text-gray-700' :
                      'bg-gray-200 text-gray-600'
                    }`}>{ticket.status}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{new Date(ticket.createdAt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="my-16">
        <Chat ticketId="main" userName="익명" />
      </div>
    </Layout>
  );
} 