import prisma from '@/utils/prisma/client';

/**
 * Script de test pour vérifier que le compteur de vues des bateaux fonctionne
 * avec la nouvelle logique de 5 secondes et détection d'activité
 */
async function testBoatViewCounter() {
  console.log('🧪 Test du compteur de vues des bateaux (avec logique 5 secondes)');

  try {
    // Récupérer un bateau existant pour le test
    const existingBoat = await prisma.boat.findFirst({
      where: { status: 'active' },
      select: { id: true, viewCount: true }
    });

    if (!existingBoat) {
      console.log('❌ Aucun bateau actif trouvé pour le test');
      return;
    }

    console.log(`✅ Bateau de test trouvé avec ID: ${existingBoat.id}`);
    console.log(`📊 Compteur initial: ${existingBoat.viewCount}`);

    // Supprimer les vues existantes pour ce bateau aujourd'hui pour permettre un nouveau test
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('🧹 Suppression des vues existantes pour permettre un nouveau test...');
    await prisma.boat_view.deleteMany({
      where: {
        boatId: existingBoat.id,
        viewedAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Remettre le compteur à 0 pour ce bateau
    await prisma.boat.update({
      where: { id: existingBoat.id },
      data: { viewCount: 0 }
    });

    console.log('✅ Vues supprimées et compteur remis à zéro');

    // Simuler une vue (comme si un utilisateur restait 5 secondes sur la page)
    console.log('📡 Envoi de la requête à l\'API...');
    const response = await fetch('http://localhost:3000/api/boat-views', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ boatId: existingBoat.id }),
    });

    console.log(`📡 Réponse HTTP: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`📄 Données de réponse:`, data);
      console.log(`👁️ Vue enregistrée avec ID: ${data.viewId}`);

      // Attendre un peu pour s'assurer que la transaction est terminée
      await new Promise(resolve => setTimeout(resolve, 100));

      // Vérifier que le compteur a été mis à jour
      const updatedBoat = await prisma.boat.findUnique({
        where: { id: existingBoat.id },
        select: { id: true, viewCount: true }
      });

      if (updatedBoat) {
        console.log(`📈 Nouveau compteur: ${updatedBoat.viewCount}`);
        if (updatedBoat.viewCount > existingBoat.viewCount) {
          console.log('✅ Test réussi ! Le compteur fonctionne avec la nouvelle logique.');
        } else {
          console.log('❌ Test échoué ! Le compteur n\'a pas été incrémenté.');
        }
      }
    } else {
      const errorData = await response.json();
      console.log(`❌ Échec de l'enregistrement de la vue: ${response.status}`);
      console.log(`❌ Détails de l'erreur:`, errorData);
    }

    console.log('📝 Note: Pour tester complètement la logique de 5 secondes,');
    console.log('   il faudrait simuler une vraie session utilisateur sur la page.');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testBoatViewCounter();
