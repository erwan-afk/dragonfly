const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
  console.log('=== VÉRIFICATION DU SCHÉMA DE LA BASE DE DONNÉES ===');

  try {
    // Vérifier les colonnes de la table boats
    const boatColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'boats'
      ORDER BY ordinal_position;
    `;

    console.log('📋 Colonnes de la table boats:');
    boatColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Vérifier les colonnes de la table payments
    const paymentColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'payments'
      ORDER BY ordinal_position;
    `;

    console.log('\n💳 Colonnes de la table payments:');
    paymentColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Vérifier les tables existantes
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public';
    `;

    console.log('\n📊 Tables dans le schéma public:');
    tables.forEach(table => {
      console.log(`  - ${table.tablename}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
