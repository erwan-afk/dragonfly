import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/utils/auth/auth';
import prisma from '@/utils/prisma/client';

/** Server-side guard for admin pages: redirects unless the viewer is admin/superAdmin. */
export async function requireAdmin(callbackUrl: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (!user || (user.role !== 'admin' && user.role !== 'superAdmin')) {
    redirect('/?error=unauthorized');
  }

  return session.user;
}
