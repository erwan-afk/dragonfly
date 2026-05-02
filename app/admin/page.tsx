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
  const [users, boats, products, payments, surveyRaw] = await Promise.all([
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
        productId: true,
        product: {
          select: { id: true, name: true }
        },
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    }),
    prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
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
    }),
    prisma.survey_response.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500
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
    expiresAt: b.expiresAt?.toISOString() || null,
    product: b.product || null
  }));

  const serializedPayments = payments.map((p) => ({
    ...p,
    amount: parseFloat(p.amount.toString()),
    createdAt: p.createdAt?.toISOString()
  }));

  // Aggregate survey data per page
  const pageMap: Record<string, { total: number; answers: Record<string, number>; comments: { answer: string; comment: string; createdAt: string }[] }> = {};
  for (const r of surveyRaw) {
    if (!pageMap[r.page]) pageMap[r.page] = { total: 0, answers: {}, comments: [] };
    pageMap[r.page].total++;
    pageMap[r.page].answers[r.answer] = (pageMap[r.page].answers[r.answer] || 0) + 1;
    if (r.comment) pageMap[r.page].comments.push({ answer: r.answer, comment: r.comment, createdAt: r.createdAt.toISOString() });
  }
  const POSITIVE = ['Oui', 'Super', 'Bien'];
  const NEGATIVE = ['Non', 'À améliorer'];
  const surveyData = {
    total: surveyRaw.length,
    byPage: Object.entries(pageMap).map(([page, d]) => {
      const pos = POSITIVE.reduce((s, k) => s + (d.answers[k] || 0), 0);
      const neg = NEGATIVE.reduce((s, k) => s + (d.answers[k] || 0), 0);
      return {
        page,
        total: d.total,
        answers: d.answers,
        satisfactionPct: d.total > 0 ? Math.round((pos / d.total) * 100) : 0,
        negativePct: d.total > 0 ? Math.round((neg / d.total) * 100) : 0,
        comments: d.comments.slice(0, 10)
      };
    }).sort((a, b) => a.satisfactionPct - b.satisfactionPct),
    recent: surveyRaw.slice(0, 30).map(r => ({
      page: r.page,
      question: r.question,
      answer: r.answer,
      comment: r.comment,
      createdAt: r.createdAt.toISOString()
    }))
  };

  const currentUserRole = user.role as 'admin' | 'superAdmin';

  return (
    <AdminClient
      users={serializedUsers}
      boats={serializedBoats}
      payments={serializedPayments}
      products={products}
      currentUserRole={currentUserRole}
      surveyData={surveyData}
    />
  );
}
