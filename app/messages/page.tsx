import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import MessagesClient from '@/components/ui/Messages/MessagesClient';

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/signin/password_signin?callbackUrl=/messages');
  }

  return <MessagesClient currentUserId={session.user.id} />;
}
