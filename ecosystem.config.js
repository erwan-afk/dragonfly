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
                BETTER_AUTH_SECRET: 'PKJo2MfDZyys4Y2JPbuxbhwX2AgQJbeF',
                BETTER_AUTH_URL: 'http://217.65.144.71:3000',
                NEXT_PUBLIC_BETTER_AUTH_URL: 'http://217.65.144.71:3000',
                // Base de données - vraie configuration
                DATABASE_URL: 'postgresql://postgres:Ywars.ollo6255@localhost:5432/default',
                // Ajoutez vos autres variables ici
            }
        }
    ]
}; 