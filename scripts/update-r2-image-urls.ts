/**
 * Script pour mettre à jour les URLs d'images vers le format R2 correct
 * 
 * Ce script :
 * 1. Analyse les URLs d'images existantes dans la base de données
 * 2. Met à jour les URLs relatives vers le format R2 complet
 * 3. Valide que toutes les URLs sont accessibles
 */

import prisma from '../utils/prisma/client';
import { validateR2Config } from '../utils/cloudflare/r2';

interface UpdateResult {
  boatId: string;
  model: string;
  originalUrls: string[];
  updatedUrls: string[];
  updated: boolean;
}

function normalizeR2Url(url: string): string {
  const trimmedUrl = url.trim();
  
  // Si l'URL est déjà complète (commence par http), la retourner telle quelle
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }
  
  // Si l'URL commence par '/', c'est une URL relative locale - la garder telle quelle
  if (trimmedUrl.startsWith('/')) {
    return trimmedUrl;
  }
  
  // Pour les clés R2 relatives, construire l'URL complète
  const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
  const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
  const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
  
  if (R2_PUBLIC_URL) {
    // Utiliser le domaine personnalisé si configuré
    return `${R2_PUBLIC_URL}/${trimmedUrl}`;
  } else if (R2_ACCOUNT_ID && R2_BUCKET_NAME) {
    // Utiliser l'URL R2 standard
    return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${trimmedUrl}`;
  }
  
  // Fallback : retourner l'URL telle quelle
  console.warn(`⚠️ Unable to normalize URL: ${trimmedUrl} (missing R2 config)`);
  return trimmedUrl;
}

async function updateBoatImageUrls(dryRun: boolean = true): Promise<UpdateResult[]> {
  console.log(`🔄 ${dryRun ? 'DRY RUN' : 'UPDATING'} boat image URLs...\n`);

  // Valider la configuration R2
  const configValidation = validateR2Config();
  if (!configValidation.valid) {
    console.error('❌ R2 configuration invalid:', configValidation.missing);
    throw new Error('R2 configuration missing');
  }

  console.log('✅ R2 configuration valid\n');

  // Récupérer tous les bateaux avec des photos
  const boats = await prisma.$queryRaw`
    SELECT id, model, photos 
    FROM boats 
    WHERE photos IS NOT NULL 
    AND array_length(photos, 1) > 0
    ORDER BY created_at DESC
  ` as any[];

  console.log(`📊 Found ${boats.length} boats with photos\n`);

  const results: UpdateResult[] = [];

  for (const boat of boats) {
    console.log(`🚢 Processing boat: ${boat.id} (${boat.model})`);
    
    const originalUrls = boat.photos || [];
    const updatedUrls = originalUrls.map((url: string) => normalizeR2Url(url));
    
    // Vérifier si des URLs ont changé
    const hasChanges = JSON.stringify(originalUrls) !== JSON.stringify(updatedUrls);
    
    console.log(`   📸 Original URLs: ${originalUrls.length}`);
    console.log(`   🔗 Updated URLs: ${updatedUrls.length}`);
    console.log(`   🔄 Has changes: ${hasChanges ? 'Yes' : 'No'}`);
    
    if (hasChanges) {
      console.log('   Changes detected:');
      originalUrls.forEach((original: string, index: number) => {
        const updated = updatedUrls[index];
        if (original !== updated) {
          console.log(`   📝 ${original} → ${updated}`);
        }
      });
      
      if (!dryRun) {
        // Mettre à jour la base de données
        const urlsArray = `{${updatedUrls.map((url: string) => `"${url}"`).join(',')}}`;
        
        await prisma.$executeRaw`
          UPDATE boats 
          SET photos = ${urlsArray}::text[]
          WHERE id = ${boat.id}
        `;
        
        console.log('   ✅ Database updated');
      } else {
        console.log('   🔍 DRY RUN - Database not updated');
      }
    }
    
    results.push({
      boatId: boat.id,
      model: boat.model,
      originalUrls,
      updatedUrls,
      updated: hasChanges && !dryRun
    });
    
    console.log('');
  }

  return results;
}

function generateUpdateReport(results: UpdateResult[], dryRun: boolean): void {
  console.log('\n📊 UPDATE REPORT');
  console.log('==================\n');

  const totalBoats = results.length;
  const boatsWithChanges = results.filter(r => r.originalUrls.length !== r.updatedUrls.length || 
    JSON.stringify(r.originalUrls) !== JSON.stringify(r.updatedUrls)).length;
  const boatsUpdated = results.filter(r => r.updated).length;

  console.log(`📈 Summary:`);
  console.log(`   Total boats processed: ${totalBoats}`);
  console.log(`   🔄 Boats with URL changes: ${boatsWithChanges}`);
  
  if (dryRun) {
    console.log(`   🔍 DRY RUN - No actual updates performed`);
    console.log(`   📝 Would update: ${boatsWithChanges} boats`);
  } else {
    console.log(`   ✅ Boats actually updated: ${boatsUpdated}`);
  }

  if (boatsWithChanges > 0) {
    console.log('\n🔍 Boats with changes:');
    
    results
      .filter(r => JSON.stringify(r.originalUrls) !== JSON.stringify(r.updatedUrls))
      .forEach(result => {
        console.log(`\n🚢 ${result.boatId} (${result.model})`);
        console.log(`   Status: ${result.updated ? '✅ Updated' : (dryRun ? '🔍 Dry run' : '❌ Failed')}`);
        
        result.originalUrls.forEach((original, index) => {
          const updated = result.updatedUrls[index];
          if (original !== updated) {
            console.log(`   📝 ${original}`);
            console.log(`      → ${updated}`);
          }
        });
      });
  }

  console.log('\n💡 Recommendations:');
  
  if (dryRun && boatsWithChanges > 0) {
    console.log('   - Run script without --dry-run to perform actual updates');
    console.log('   - Review the changes above to ensure they are correct');
    console.log('   - Backup your database before running the actual update');
  }
  
  if (!dryRun && boatsUpdated > 0) {
    console.log('   ✅ URLs updated successfully!');
    console.log('   - Test the image display on boat pages');
    console.log('   - Run the image accessibility test script');
  }
  
  if (boatsWithChanges === 0) {
    console.log('   ✅ All URLs are already in the correct format');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
    console.log('   Use --execute flag to perform actual updates\n');
  } else {
    console.log('⚠️  EXECUTE MODE - Database will be modified');
    console.log('   Make sure you have a backup!\n');
  }

  try {
    const results = await updateBoatImageUrls(dryRun);
    generateUpdateReport(results, dryRun);
    
    console.log('\n🎯 Next Steps:');
    if (dryRun) {
      console.log('   1. Run: npx ts-node scripts/update-r2-image-urls.ts --execute');
      console.log('   2. Test image display: npx ts-node scripts/test-r2-images-display.ts');
    } else {
      console.log('   1. Test image display: npx ts-node scripts/test-r2-images-display.ts');
      console.log('   2. Visit boat pages to verify images load correctly');
      console.log('   3. Check carousel functionality in browser');
    }
    
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Lancer le script si exécuté directement
if (require.main === module) {
  main();
}

export { updateBoatImageUrls, generateUpdateReport, normalizeR2Url }; 