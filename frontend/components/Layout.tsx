import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../store/auth';

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, logout, user, fetchUser } = useAuth();

  React.useEffect(() => {
    if (token && !user) fetchUser();
  }, [token, user, fetchUser]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <nav className="sticky top-0 z-20 bg-white/90 backdrop-blur shadow-md px-8 py-4 flex items-center justify-between border-b">
        <Link href="/">
          <span className="font-extrabold text-2xl text-blue-700 tracking-tight cursor-pointer select-none">Ticket System</span>
        </Link>
        <div className="flex items-center gap-4">
          {token ? (
            <>
              <Link href="/tickets">
                <span className="hover:underline cursor-pointer text-blue-700 font-semibold px-3 py-1 rounded transition">티켓 목록</span>
              </Link>
              <Link href="/mypage">
                <span className="hover:underline cursor-pointer text-gray-700 font-semibold px-3 py-1 rounded transition">내 정보</span>
              </Link>
              {user?.role === 'ADMIN' && (
                <Link href="/admin">
                  <span className="hover:underline cursor-pointer text-red-700 font-semibold px-3 py-1 rounded transition">관리자</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="bg-gray-100 px-3 py-1 rounded hover:bg-gray-200 text-gray-700 font-semibold border border-gray-200 transition"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link href="/login">
              <span className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 cursor-pointer font-semibold transition">로그인</span>
            </Link>
          )}
        </div>
      </nav>
      <main className="max-w-3xl mx-auto py-12 px-4 md:px-0">{children}</main>
    </div>
  );
} 