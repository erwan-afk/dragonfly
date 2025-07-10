/** @type {import('next').NextConfig} */
const nextConfig = {
    // Désactiver complètement la génération statique pour éviter les erreurs useSearchParams
    output: 'standalone',
    experimental: {
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
        ignoreBuildErrors: true,
    },
};

module.exports = nextConfig; 