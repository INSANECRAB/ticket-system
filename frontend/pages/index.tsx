import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Chat from '../components/Chat';
import { useAuth } from '../store/auth';
import Layout from '../components/Layout';

export default function Home() {
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      router.replace('/tickets');
    } else {
      router.replace('/login');
    }
  }, [token, router]);

  return (
    <Layout>
      <div className="my-8">
        <Chat ticketId="main" userName={'익명'} />
      </div>
    </Layout>
  );
} 