import Link from "next/link";

import { LatestPost } from "~/app/_components/post";
import { api, HydrateClient } from "~/trpc/server";
import Auth from '../components/Auth'
import { BatchList } from '../components/BatchList'
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-white text-black">
        {session?.user ? (
          <div className="w-full max-w-2xl mt-8">
            <BatchList />
          </div>
        ) : (
          <Auth />
        )}
      </main>
    </HydrateClient>
  );
}
