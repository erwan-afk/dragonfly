import prisma from '@/utils/prisma/client';

/**
 * Script pour vérifier l'état de la base de données et la structure des tables
 */
async function checkDatabase() {
  console.log('🔍 Vérification de la structure de la base de données');

  try {
    // Vérifier les colonnes de la table boats
    const boatColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'boats'
      ORDER BY ordinal_position;
    `;

    console.log('📋 Colonnes de la table boats:');
    console.log(boatColumns);

    // Vérifier quelques bateaux et leur view_count
    const boats = await prisma.boat.findMany({
      take: 3,
      select: {
        id: true,
        viewCount: true,
        model: true
      }
    });

    console.log('🚤 Échantillon de bateaux avec viewCount:');
    boats.forEach(boat => {
      console.log(`- ${boat.model}: ${boat.viewCount} vues`);
    });

    // Vérifier les vues récentes
    const recentViews = await prisma.boat_view.findMany({
      take: 5,
      orderBy: { viewedAt: 'desc' },
      include: {
        boat: {
          select: { model: true, viewCount: true }
        }
      }
    });

    console.log('👁️ Vues récentes:');
    recentViews.forEach(view => {
      console.log(`- ${view.boat.model}: vue enregistrée, compteur actuel: ${view.boat.viewCount}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la vérification
checkDatabase();
