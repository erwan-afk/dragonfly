import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import prisma from '@/utils/prisma/client';
import { requireAdmin } from '../requireAdmin';

export const dynamic = 'force-dynamic';

const fmt = (d: Date) =>
  d.toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'Europe/Paris'
  });

export default async function EmailsPage({
  searchParams
}: {
  searchParams: { failures?: string };
}) {
  await requireAdmin('/admin/emails');
  const onlyFailures = searchParams.failures === '1';

  const emails = await prisma.email_event.findMany({
    where: onlyFailures ? { status: 'failed' } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 300
  });

  return (
    <div className="max-w-6xl mx-auto px-16 py-32 text-gray-900">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mb-6"
      >
        <ArrowLeft size={16} /> Retour au dashboard
      </Link>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Emails envoyés</h1>
        <Link
          href={onlyFailures ? '/admin/emails' : '/admin/emails?failures=1'}
          className="text-sm text-blue-600 hover:underline"
        >
          {onlyFailures ? 'Tout afficher' : 'Échecs uniquement'}
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Destinataire</th>
              <th className="px-4 py-3 text-left">Résultat</th>
              <th className="px-4 py-3 text-left">Sujet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {emails.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                  {fmt(m.createdAt)}
                </td>
                <td className="px-4 py-2">{m.type}</td>
                <td className="px-4 py-2">
                  {m.userId ? (
                    <Link
                      href={`/admin/users/${m.userId}`}
                      className="text-blue-600 hover:underline"
                    >
                      {m.toEmail}
                    </Link>
                  ) : (
                    m.toEmail
                  )}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={
                      m.status === 'sent' ? 'text-green-700' : 'text-red-600'
                    }
                  >
                    {m.status === 'sent' ? 'Envoyé' : m.error || 'Échec'}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-500">{m.subject}</td>
              </tr>
            ))}
            {emails.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Aucun email suivi pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
