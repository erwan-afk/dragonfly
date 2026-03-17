/** @type {import('next').NextConfig} */
const nextConfig = {
    // Désactiver complètement la génération statique pour éviter les erreurs useSearchParams
    output: 'standalone',
    productionBrowserSourceMaps: false,
    // Désactiver React Strict Mode pour éviter les doubles rendus en dev
    reactStrictMode: false,
    experimental: {
        webpackBuildWorker: true,
        missingSuspenseWithCSRBailout: false,
        serverComponentsExternalPackages: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner']
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        }

        // Résoudre le problème AWS SDK
        config.resolve.extensionAlias = {
            '.js': ['.ts', '.tsx', '.js', '.jsx'],
        };

        return config;
    },
    images: {
        domains: [
            'www.dragonfly-trimarans.org', // Ancien domaine FTP (pour compatibilité)
            // Domaines R2 - ajoutez votre domaine personnalisé si vous en avez un
            'flagcdn.com',
        ],
        remotePatterns: [
            // Ancien pattern FTP (pour compatibilité)
            {
                protocol: 'https',
                hostname: 'www.dragonfly-trimarans.org',
                pathname: '/wp-content/uploads/**',
            },
            // Pattern pour R2 avec domaine par défaut
            {
                protocol: 'https',
                hostname: '*.r2.cloudflarestorage.com',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'flagcdn.com',
                pathname: '/**',
            },
            // Pattern pour domaine personnalisé R2 (si vous en avez un)
            // Décommentez et modifiez selon votre domaine personnalisé
            /*
            {
                protocol: 'https',
                hostname: 'your-custom-domain.com',
                pathname: '/**',
            },
            */
        ],
    },
    typescript: {
        ignoreBuildErrors: false,
    },
    async headers() {
        // Security headers (incl. CSP) for production. In particular, Stripe Payment Element
        // requires connections to Stripe domains + iframes/scripts from js.stripe.com.

        // Next.js needs unsafe-eval in dev for React Fast Refresh; keep it out of production.
        const isDev = process.env.NODE_ENV !== 'production';
        const scriptSrc = isDev
            ? "'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.google.com https://www.gstatic.com"
            : "'self' 'unsafe-inline' https://js.stripe.com https://www.google.com https://www.gstatic.com";

        const csp = [
            "default-src 'self'",
            `script-src ${scriptSrc}`,
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            // Stripe elements run in iframes.
            "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.google.com",
            // Stripe telemetry + APIs + direct-to-R2 uploads (signed URL PUT) + reCAPTCHA.
            "connect-src 'self' https://dragonfly-trimarans.org https://www.dragonfly-trimarans.org https://api.stripe.com https://m.stripe.com https://m.stripe.network https://*.stripe.com https://*.stripe.network https://*.r2.cloudflarestorage.com https://www.google.com https://www.gstatic.com https://accounts.google.com",
            "font-src 'self' data: https:",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
        ].join('; ');

        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                    { key: 'Content-Security-Policy', value: csp },
                ],
            },
        ];
    },
};

module.exports = nextConfig; 