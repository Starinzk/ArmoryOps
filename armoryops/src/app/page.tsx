'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { api } from "~/trpc/react"; // KEEP this import
import Auth from '../components/Auth';
import { BatchList } from '../components/BatchList';
import { CreateBatchForm } from '../components/CreateBatchForm';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { createBrowserClient } from '@supabase/ssr';
import type { Session } from '@supabase/supabase-js';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [openCreateBatchModal, setOpenCreateBatchModal] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setIsLoadingSession(false);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleOpenCreateBatchModal = () => {
    setOpenCreateBatchModal(true);
  };

  const handleCloseCreateBatchModal = () => {
    setOpenCreateBatchModal(false);
  };

  if (isLoadingSession) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white text-black">
        <CircularProgress />
      </main>
    );
  }

  return (
      <main className="flex min-h-screen flex-col items-center bg-white text-black pt-16">
        {session?.user ? (
          <Box className="w-full max-w-4xl p-4">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <p>Authenticated! User: {session.user.email}</p>
              <Button variant="contained" onClick={handleOpenCreateBatchModal}>
                  Create New Batch
              </Button>
            </Box>
            <CreateBatchForm 
                open={openCreateBatchModal} 
                onClose={handleCloseCreateBatchModal} 
            />
            <BatchList />
          </Box>
        ) : (
          <div className="flex flex-col items-center justify-center flex-grow">
             <Auth />
          </div>
        )}
      </main>
  );
}
