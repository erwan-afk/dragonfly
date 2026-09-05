import type { Metadata } from 'next';
import { getURL } from '@/utils/helpers';

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
