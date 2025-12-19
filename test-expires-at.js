const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient();

  try {
    const boats = await prisma.boat.findMany({
      where: { status: 'active' },
      select: { id: true, model: true, expiresAt: true },
      take: 2
    });

    console.log('Test des données expiresAt:');
    console.log(JSON.stringify(boats, null, 2));
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
