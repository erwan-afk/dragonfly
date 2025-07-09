// Script de test simple pour vérifier la migration
const { PrismaClient } = require('@prisma/client');

async function testMigration() {
    const prisma = new PrismaClient();

    try {
        console.log('🔍 Testing Prisma connection...');

        // Test simple de connexion
        const userCount = await prisma.user.count();
        console.log(`✅ Connected! Found ${userCount} users in database`);

        // Test des modèles principaux
        const boatCount = await prisma.boat.count();
        console.log(`✅ Found ${boatCount} boats in database`);

        const productCount = await prisma.product.count();
        console.log(`✅ Found ${productCount} products in database`);

        console.log('🎉 Migration test successful!');

    } catch (error) {
        console.error('❌ Migration test failed:', error.message);

        if (error.code === 'P1001') {
            console.log('💡 Database connection failed. Check your DATABASE_URL in .env');
        } else if (error.code === 'P2021') {
            console.log('💡 Table not found. Run: npm run db:migrate');
        }
    } finally {
        await prisma.$disconnect();
    }
}

testMigration(); 