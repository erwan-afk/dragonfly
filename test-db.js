const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');

    // Test simple connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Connection successful:', result);

    // Test boats table
    const boatCount = await prisma.boat.count();
    console.log('✅ Boats count:', boatCount);

    // Test users table
    const userCount = await prisma.user.count();
    console.log('✅ Users count:', userCount);

    console.log('✅ Database connection and queries working!');
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();




