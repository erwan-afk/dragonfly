import type { MetadataRoute } from 'next';
import { getURL } from '@/utils/helpers';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getURL().replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/account',
          '/admin',
          '/api/',
          '/boost/',
          '/extras/',
          '/upgrade/',
          '/edit-listing/',
          '/list-boat',
          '/reset-password',
          '/signin',
          '/auth/',
          '/payment-error',
          '/demo-animations',
          '/demo-transitions'
        ]
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}
