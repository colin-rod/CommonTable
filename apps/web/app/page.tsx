import { redirect } from 'next/navigation';

import { LandingPageContent } from '@/components/landing/LandingPageContent';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect authenticated users to dashboard
  if (user) {
    redirect('/dashboard');
  }

  return <LandingPageContent />;
}
