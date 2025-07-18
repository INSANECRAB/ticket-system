import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../utils/api';

interface ChatMessage {
  id: string;
  user: string;
  content: string;
  createdAt: string;
  file?: { name: string; url: string };
}

let socket: Socket | null = null;

export default function Chat({ ticketId, userName }: { ticketId: string; userName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // history 유지: 페이지 진입 시 서버에서 메시지 불러오기
  useEffect(() => {
    api.get(`/tickets/${ticketId}/messages`).then(res => {
      setMessages(res.data.messages || []);
    });
  }, [ticketId]);

  useEffect(() => {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000', {
      transports: ['websocket'],
    });
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.emit('join', { ticketId, userName });
    socket.on('chat', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });
    socket.on('history', (msgs: ChatMessage[]) => {
      setMessages(msgs);
    });
    return () => {
      socket?.disconnect();
    };
  }, [ticketId, userName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input && !file) return;
    let fileObj = undefined;
    let filePayload = undefined;
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      filePayload = {
        name: file.name,
        data: base64,
        mimetype: file.type,
      };
      fileObj = { name: file.name, url: '#' };
    }
    const msg: ChatMessage = {
      id: Math.random().toString(),
      user: userName,
      content: input,
      createdAt: new Date().toLocaleString(),
      file: fileObj,
    };
    setMessages(prev => [...prev, msg]);
    socket?.emit('chat', { ticketId, user: userName, content: input, createdAt: new Date().toISOString(), file: filePayload });
    setInput('');
    setFile(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg mx-auto border border-gray-100">
      <div className="font-bold mb-4 text-lg flex items-center gap-2">
        실시간 채팅
        {connected ? <span className="text-green-500 text-base">●</span> : <span className="text-gray-400 text-base">●</span>}
      </div>
      <div className="h-64 overflow-y-auto border rounded-lg p-3 mb-4 bg-gray-50 space-y-3">
        {messages.map(m => (
          <div key={m.id} className={`flex flex-col ${m.user === userName ? 'items-end' : 'items-start'}`}> 
            <div className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-sm ${m.user === userName ? 'bg-blue-100 text-blue-900' : 'bg-gray-200 text-gray-800'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{m.user}</span>
                <span className="text-xs text-gray-500">{m.createdAt}</span>
              </div>
              <div className="whitespace-pre-line break-words text-sm">{m.content}</div>
              {m.file && (
                <div className="mt-2">
                  <a href={m.file.url} className="text-xs text-blue-600 underline" download>{decodeURIComponent(m.file.name)}</a>
                  {/\.(png|jpe?g|gif|bmp|webp)$/i.test(decodeURIComponent(m.file.name)) && (
                    <div className="mt-2">
                      <img src={m.file.url} alt={decodeURIComponent(m.file.name)} className="max-w-[200px] rounded-lg border" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex flex-col sm:flex-row gap-2 items-stretch">
        <input
          type="text"
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-base"
          placeholder="메시지 입력"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <label className="flex items-center gap-2 cursor-pointer bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-200 transition text-sm">
          파일 선택
          <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
        </label>
        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
          disabled={!input && !file}
        >
          전송
        </button>
      </form>
      {file && <div className="text-xs text-gray-500 mt-2">선택된 파일: {file.name}</div>}
    </div>
  );
} 