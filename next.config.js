/** @type {import('next').NextConfig} */
const nextConfig = {
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