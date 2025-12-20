const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  console.log('=== VÉRIFICATION DES DONNÉES DE BASE ===');

  try {
    const products = await prisma.product.findMany();
    console.log(`📦 Produits: ${products.length}`);
    products.forEach(p => console.log(`  - ${p.name} (${p.id})`));

    const prices = await prisma.price.findMany();
    console.log(`💰 Prix: ${prices.length}`);
    prices.forEach(p => console.log(`  - ${p.id}: ${p.unit_amount} ${p.currency}`));

    const boats = await prisma.boat.findMany();
    console.log(`🚤 Bateaux: ${boats.length}`);

    const payments = await prisma.payment.findMany();
    console.log(`💳 Paiements: ${payments.length}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
