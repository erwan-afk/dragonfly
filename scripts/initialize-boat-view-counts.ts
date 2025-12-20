import prisma from '@/utils/prisma/client';

/**
 * Script pour initialiser les compteurs de vues des bateaux existants
 * basé sur les données de la table boat_views
 */
async function initializeBoatViewCounts() {
  console.log('Initialisation des compteurs de vues des bateaux...');

  try {
    // Récupérer le nombre de vues par bateau
    const viewCounts = await prisma.boat_view.groupBy({
      by: ['boatId'],
      _count: {
        id: true
      }
    });

    console.log(`Trouvé ${viewCounts.length} bateaux avec des vues`);

    // Mettre à jour chaque bateau avec son nombre de vues
    for (const viewCount of viewCounts) {
      await prisma.boat.update({
        where: { id: viewCount.boatId },
        data: { viewCount: viewCount._count.id }
      });
    }

    console.log('✅ Tous les compteurs de vues ont été initialisés avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des compteurs:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
initializeBoatViewCounts();
