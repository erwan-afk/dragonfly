import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/utils/auth/auth';
import prisma from '@/utils/prisma/client';
import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    redirect('/signin?callbackUrl=/admin');
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });

  if (!user || (user.role !== 'admin' && user.role !== 'superAdmin')) {
    redirect('/?error=unauthorized');
  }

  // Fetch admin data
  const [users, boats, payments] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        banned: true,
        _count: {
          select: { boats: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    }),
    prisma.boat.findMany({
      select: {
        id: true,
        model: true,
        price: true,
        currency: true,
        country: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    }),
    prisma.payment.findMany({
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
  ]);

  // Serialize data
  const serializedUsers = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    boatsCount: u._count.boats
  }));

  const serializedBoats = boats.map((b) => ({
    ...b,
    price: parseFloat(b.price.toString()),
    createdAt: b.createdAt.toISOString(),
    expiresAt: b.expiresAt?.toISOString() || null
  }));

  const serializedPayments = payments.map((p) => ({
    ...p,
    amount: parseFloat(p.amount.toString()),
    createdAt: p.createdAt?.toISOString()
  }));

  const currentUserRole = user.role as 'admin' | 'superAdmin';

  return (
    <AdminClient
      users={serializedUsers}
      boats={serializedBoats}
      payments={serializedPayments}
      currentUserRole={currentUserRole}
    />
  );
}
