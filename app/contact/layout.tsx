import type { Metadata } from 'next';
import { getURL } from '@/utils/helpers';

// Static generation crashes in production for this page — force dynamic
// rendering like the rest of the site's public pages.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contact - 3Hulls',
  description: 'Get in touch with the 3Hulls team.',
  alternates: { canonical: getURL('/contact') }
};

export default function ContactLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return children;
}
