import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Ban } from 'lucide-react';
import prisma from '@/utils/prisma/client';
import { requireAdmin } from '../../requireAdmin';

export const dynamic = 'force-dynamic';

type Tone = 'neutral' | 'good' | 'bad' | 'warn';

interface TimelineItem {
  at: Date;
  label: string;
  detail?: string;
  tone: Tone;
}

const TONE: Record<Tone, string> = {
  neutral: 'bg-gray-400',
  good: 'bg-green-500',
  bad: 'bg-red-500',
  warn: 'bg-yellow-500'
};

const AUTH_LABELS: Record<string, string> = {
  signin: 'Connexion',
  signup: 'Inscription',
  reset_requested: 'Demande de reset du mot de passe',
  reset_completed: 'Nouveau mot de passe défini',
  oauth_start: 'Connexion Google/GitHub lancée',
  oauth_callback: 'Retour Google/GitHub',
  captcha: 'Vérification reCAPTCHA',
  rate_limited: 'Bloqué (trop de tentatives)'
};

const EMAIL_LABELS: Record<string, string> = {
  reminder_7d: 'Email : rappel d’expiration (7 jours)',
  reminder_1d: 'Email : rappel d’expiration (1 jour)',
  expired: 'Email : annonce expirée',
  pending_payment: 'Email : finir le paiement de l’annonce',
  password_reset: 'Email : reset du mot de passe',
  admin_password_reset: 'Email : mot de passe réinitialisé par un admin',
  verification: 'Email : vérification de l’adresse',
  invitation: 'Email : invitation',
  new_message: 'Email : notification de nouveau message',
  report: 'Email : signalement de conversation',
  contact_form: 'Email : formulaire de contact'
};

const fmt = (d: Date) =>
  d.toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Paris'
  });

function device(ua?: string | null) {
  if (!ua) return '';
  const os = /iPhone|iPad/.test(ua)
    ? 'iOS'
    : /Android/.test(ua)
      ? 'Android'
      : /Windows/.test(ua)
        ? 'Windows'
        : /Mac OS/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : '';
  const br = /Edg\//.test(ua)
    ? 'Edge'
    : /Chrome\//.test(ua)
      ? 'Chrome'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Safari\//.test(ua)
          ? 'Safari'
          : '';
  return [br, os].filter(Boolean).join(' / ');
}

export default async function AdminUserPage({
  params
}: {
  params: { id: string };
}) {
  await requireAdmin(`/admin/users/${params.id}`);

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      ban_reason: true,
      createdAt: true,
      _count: { select: { boats: true, favorites: true } }
    }
  });
  if (!user) notFound();

  const [
    authEvents,
    firstLogged,
    sessions,
    boats,
    payments,
    emailLogs,
    emailEvents,
    firstEmailLogged,
    messages,
    buyerConvos
  ] = await Promise.all([
    prisma.auth_event.findMany({
      where: { OR: [{ userId: user.id }, { email: user.email.toLowerCase() }] },
      orderBy: { createdAt: 'desc' },
      take: 200
    }),
    prisma.auth_event.aggregate({ _min: { createdAt: true } }),
    prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { createdAt: true, ipAddress: true, userAgent: true }
    }),
    prisma.boat.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        model: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        viewCount: true,
        boostedAt: true
      }
    }),
    prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        amount: true,
        status: true,
        createdAt: true,
        boat: { select: { model: true } }
      }
    }),
    prisma.email_log.findMany({
      where: { userId: user.id },
      orderBy: { sentAt: 'desc' },
      take: 50,
      select: { type: true, sentAt: true, boat: { select: { model: true } } }
    }),
    prisma.email_event.findMany({
      where: { OR: [{ userId: user.id }, { toEmail: user.email.toLowerCase() }] },
      orderBy: { createdAt: 'desc' },
      take: 200
    }),
    prisma.email_event.aggregate({ _min: { createdAt: true } }),
    prisma.message.findMany({
      where: { senderId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        createdAt: true,
        conversation: { select: { boat: { select: { model: true } } } }
      }
    }),
    prisma.conversation.findMany({
      where: { buyerId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { createdAt: true, boat: { select: { model: true } } }
    })
  ]);

  const items: TimelineItem[] = [
    { at: user.createdAt, label: 'Compte créé', tone: 'good' }
  ];

  for (const e of authEvents) {
    items.push({
      at: e.createdAt,
      label: `${AUTH_LABELS[e.type] ?? e.type}${e.success ? '' : ' — échec'}`,
      detail: [
        e.detail,
        device(e.userAgent),
        e.ipAddress,
        e.origin && `depuis ${e.origin.replace('https://', '')}`
      ]
        .filter(Boolean)
        .join(' · '),
      tone: e.success ? 'good' : 'bad'
    });
  }

  // Sessions only fill the gap before the event log existed (avoids duplicates)
  const loggingStart = firstLogged._min.createdAt;
  for (const s of sessions) {
    if (loggingStart && s.createdAt >= loggingStart) continue;
    items.push({
      at: s.createdAt,
      label: 'Connexion (historique)',
      detail: [device(s.userAgent), s.ipAddress].filter(Boolean).join(' · '),
      tone: 'neutral'
    });
  }

  for (const b of boats) {
    items.push({
      at: b.createdAt,
      label: `Annonce démarrée : ${b.model}`,
      detail: `statut actuel : ${b.status}`,
      tone: 'neutral'
    });
    if (b.boostedAt) {
      items.push({
        at: b.boostedAt,
        label: `Annonce boostée : ${b.model}`,
        tone: 'good'
      });
    }
    if (b.expiresAt && b.expiresAt < new Date()) {
      items.push({
        at: b.expiresAt,
        label: `Annonce expirée : ${b.model}`,
        tone: 'warn'
      });
    }
  }

  for (const p of payments) {
    if (!p.createdAt) continue;
    items.push({
      at: p.createdAt,
      label: `Paiement ${p.status ?? ''}`.trim(),
      detail: `${String(p.amount)}${p.boat?.model ? ` · ${p.boat.model}` : ''}`,
      tone: p.status === 'succeeded' || p.status === 'paid' ? 'good' : 'warn'
    });
  }

  for (const m of emailEvents) {
    const label = EMAIL_LABELS[m.type] ?? `Email : ${m.type}`;
    items.push({
      at: m.createdAt,
      label: m.status === 'sent' ? label : `${label} — échec`,
      detail: [m.subject, m.error].filter(Boolean).join(' · '),
      tone: m.status === 'sent' ? 'neutral' : 'bad'
    });
  }

  // Legacy reminder log only fills the gap before email tracking existed
  const emailTrackingStart = firstEmailLogged._min.createdAt;
  for (const m of emailLogs) {
    if (emailTrackingStart && m.sentAt >= emailTrackingStart) continue;
    items.push({
      at: m.sentAt,
      label: EMAIL_LABELS[m.type] ?? `Email envoyé : ${m.type}`,
      detail: m.boat?.model,
      tone: 'neutral'
    });
  }

  for (const c of buyerConvos) {
    items.push({
      at: c.createdAt,
      label: 'Conversation démarrée avec un vendeur',
      detail: c.boat?.model,
      tone: 'neutral'
    });
  }

  for (const m of messages) {
    items.push({
      at: m.createdAt,
      label: 'Message envoyé',
      detail: m.conversation.boat?.model,
      tone: 'neutral'
    });
  }

  items.sort((a, b) => b.at.getTime() - a.at.getTime());

  const failures = authEvents.filter((e) => !e.success).length;

  return (
    <div className="max-w-4xl mx-auto px-16 py-32 text-gray-900">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mb-6"
      >
        <ArrowLeft size={16} /> Retour au dashboard
      </Link>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <div className="text-gray-500">{user.email}</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
              {user.role}
            </span>
            {user.banned && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                <Ban size={12} /> Banni
                {user.ban_reason ? ` : ${user.ban_reason}` : ''}
              </span>
            )}
          </div>
        </div>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
          <div>
            <dt className="text-gray-500">Inscrit le</dt>
            <dd className="font-medium text-gray-900">{fmt(user.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Annonces</dt>
            <dd className="font-medium text-gray-900">{user._count.boats}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Favoris</dt>
            <dd className="font-medium text-gray-900">{user._count.favorites}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Échecs d&apos;auth</dt>
            <dd className={`font-medium ${failures ? 'text-red-600' : 'text-gray-900'}`}>
              {failures}
            </dd>
          </div>
        </dl>
      </div>

      {boats.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Annonces</h2>
          <ul className="divide-y divide-gray-100 text-sm">
            {boats.map((b) => (
              <li key={b.id} className="py-2 flex justify-between gap-4">
                <Link
                  href={`/boats/${b.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {b.model}
                </Link>
                <span className="text-gray-500">
                  {b.status} · {b.viewCount} vues · créée le {fmt(b.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">
          Journal d&apos;authentification
          {failures > 0 && (
            <span className="ml-2 text-xs font-normal text-red-600">
              {failures} échec{failures > 1 ? 's' : ''}
            </span>
          )}
        </h2>
        {authEvents.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun événement enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {authEvents.slice(0, 30).map((e) => (
                  <tr key={e.id}>
                    <td className="py-2 pr-4 whitespace-nowrap text-gray-500">{fmt(e.createdAt)}</td>
                    <td className="py-2 pr-4">{AUTH_LABELS[e.type] ?? e.type}</td>
                    <td className={`py-2 pr-4 ${e.success ? 'text-green-700' : 'text-red-600'}`}>
                      {e.success ? 'OK' : e.detail || 'échec'}
                    </td>
                    <td className="py-2 text-gray-500">
                      {[device(e.userAgent), e.ipAddress, e.origin?.replace('https://', '')]
                        .filter(Boolean)
                        .join(' · ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Emails envoyés</h2>
        {emailEvents.length === 0 ? (
          <p className="text-sm text-gray-400">
            Aucun email suivi pour l&apos;instant (le suivi commence à sa mise en service).
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {emailEvents.slice(0, 30).map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 pr-4 whitespace-nowrap text-gray-500">{fmt(m.createdAt)}</td>
                    <td className="py-2 pr-4">{EMAIL_LABELS[m.type] ?? m.type}</td>
                    <td className={`py-2 pr-4 ${m.status === 'sent' ? 'text-green-700' : 'text-red-600'}`}>
                      {m.status === 'sent' ? 'Envoyé' : `Échec${m.error ? ` : ${m.error}` : ''}`}
                    </td>
                    <td className="py-2 text-gray-500">{m.subject}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Activité</h2>
        <ol className="relative border-l border-gray-200 ml-2">
          {items.map((it, i) => (
            <li key={i} className="mb-5 ml-5">
              <span
                className={`absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full ${TONE[it.tone]}`}
              />
              <div className="text-sm font-medium text-gray-900">{it.label}</div>
              {it.detail && (
                <div className="text-xs text-gray-500">{it.detail}</div>
              )}
              <div className="text-xs text-gray-400">{fmt(it.at)}</div>
            </li>
          ))}
        </ol>
        {!loggingStart && (
          <p className="text-xs text-gray-400 mt-2">
            Le journal des tentatives de connexion commence à partir de sa mise
            en service.
          </p>
        )}
      </div>
    </div>
  );
}
