module.exports = {
    apps: [
        {
            name: 'dragonfly-app',
            script: 'npm',
            args: 'start',
            cwd: '/var/www/dragonfly',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development',
                PORT: 3000,
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000,
                // Better Auth
                BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
                BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
                NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
                // Base de données
                DATABASE_URL: process.env.DATABASE_URL,
                // Ajoutez vos autres variables ici
            }
        }
    ]
}; 