import { config } from 'dotenv';
import { cleanupOldTempImages, listTempImages } from '../utils/cloudflare/r2';

// Charger les variables d'environnement
config({ path: '.env.local' });

async function main() {
  console.log('🧹 Starting automatic temp images cleanup...');
  
  try {
    // 1. Lister toutes les images temporaires
    console.log('\n📋 Listing all temp images...');
    const tempImages = await listTempImages();
    console.log(`Found ${tempImages.length} temp images on R2`);
    
    if (tempImages.length === 0) {
      console.log('✅ No temp images found. Nothing to clean up.');
      return;
    }

    // 2. Afficher quelques exemples
    console.log('\n📄 Sample temp images:');
    tempImages.slice(0, 5).forEach((image, index) => {
      console.log(`${index + 1}. ${image}`);
    });
    
    if (tempImages.length > 5) {
      console.log(`... and ${tempImages.length - 5} more`);
    }

    // 3. Nettoyer les images temporaires de plus de 2 heures
    console.log('\n🧹 Cleaning up temp images older than 2 hours...');
    const result = await cleanupOldTempImages(2);
    
    console.log('\n📊 Cleanup Results:');
    console.log(`- Total found: ${result.totalFound}`);
    console.log(`- Deleted: ${result.deleted}`);
    console.log(`- Failed: ${result.failed}`);
    console.log(`- Remaining: ${result.totalFound - result.deleted - result.failed}`);
    
    if (result.deleted > 0) {
      console.log(`✅ Successfully cleaned up ${result.deleted} old temp images`);
    }
    
    if (result.failed > 0) {
      console.log(`⚠️ Failed to delete ${result.failed} temp images`);
    }

  } catch (error) {
    console.error('❌ Error during temp images cleanup:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Temp images cleanup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Temp images cleanup failed:', error);
      process.exit(1);
    });
}

export default main; 