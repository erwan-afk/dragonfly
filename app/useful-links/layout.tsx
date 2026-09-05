import type { Metadata } from 'next';
import { getURL } from '@/utils/helpers';

// Static generation crashes in production for this page — force dynamic
// rendering like the rest of the site's public pages.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Useful Links - 3Hulls',
  description: 'Useful resources and links for Dragonfly trimaran owners.',
  alternates: { canonical: getURL('/useful-links') }
};

export default function UsefulLinksLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
