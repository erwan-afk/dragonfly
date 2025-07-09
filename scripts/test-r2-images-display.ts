/**
 * Script de test pour vérifier l'affichage des images R2
 * 
 * Ce script vérifie que :
 * 1. Les URLs R2 sont correctement générées
 * 2. Les images sont accessibles
 * 3. Les pages de bateaux affichent correctement les images
 */

import prisma from '../utils/prisma/client';
import { validateR2Config } from '../utils/cloudflare/r2';

interface TestResult {
  boatId: string;
  model: string;
  photos: string[];
  photoUrls: string[];
  accessibleImages: boolean[];
  allAccessible: boolean;
}

async function testImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`❌ Error testing URL ${url}:`, error);
    return false;
  }
}

function normalizeImageUrls(photos: string[] | null | undefined): string[] {
  if (!photos || !Array.isArray(photos) || photos.length === 0) {
    return [];
  }

  return photos
    .filter(url => url && typeof url === 'string' && url.trim() !== '')
    .map(url => {
      const trimmedUrl = url.trim();
      
      // Si l'URL est déjà complète (commence par http), la retourner telle quelle
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        return trimmedUrl;
      }
      
      // Si l'URL commence par '/', c'est une URL relative locale
      if (trimmedUrl.startsWith('/')) {
        return `http://localhost:3000${trimmedUrl}`;
      }
      
      // Pour les clés R2 relatives, construire l'URL complète
      const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
      const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
      const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
      
      if (R2_PUBLIC_URL) {
        return `${R2_PUBLIC_URL}/${trimmedUrl}`;
      } else if (R2_ACCOUNT_ID && R2_BUCKET_NAME) {
        return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${trimmedUrl}`;
      }
      
      // Fallback : retourner l'URL telle quelle
      return trimmedUrl;
    });
}

async function testBoatImages(): Promise<TestResult[]> {
  console.log('🧪 Starting R2 images display test...\n');

  // Valider la configuration R2
  const configValidation = validateR2Config();
  if (!configValidation.valid) {
    console.error('❌ R2 configuration invalid:', configValidation.missing);
    throw new Error('R2 configuration missing');
  }

  console.log('✅ R2 configuration valid\n');

  // Récupérer les bateaux avec des photos
  const boats = await prisma.$queryRaw`
    SELECT id, model, photos 
    FROM boats 
    WHERE photos IS NOT NULL 
    AND array_length(photos, 1) > 0
    ORDER BY created_at DESC
    LIMIT 10
  ` as any[];

  console.log(`📊 Found ${boats.length} boats with photos\n`);

  const results: TestResult[] = [];

  for (const boat of boats) {
    console.log(`🚢 Testing boat: ${boat.id} (${boat.model})`);
    
    const normalizedUrls = normalizeImageUrls(boat.photos);
    console.log(`   📸 Original photos: ${boat.photos.length}`);
    console.log(`   🔗 Normalized URLs: ${normalizedUrls.length}`);

    if (normalizedUrls.length === 0) {
      console.log('   ⚠️  No valid URLs after normalization');
      results.push({
        boatId: boat.id,
        model: boat.model,
        photos: boat.photos,
        photoUrls: [],
        accessibleImages: [],
        allAccessible: false
      });
      continue;
    }

    // Tester l'accessibilité de chaque image
    const accessibilityTests = await Promise.all(
      normalizedUrls.map(async (url, index) => {
        const accessible = await testImageUrl(url);
        console.log(`   ${accessible ? '✅' : '❌'} Image ${index + 1}: ${url}`);
        return accessible;
      })
    );

    const allAccessible = accessibilityTests.every(result => result);
    
    results.push({
      boatId: boat.id,
      model: boat.model,
      photos: boat.photos,
      photoUrls: normalizedUrls,
      accessibleImages: accessibilityTests,
      allAccessible
    });

    console.log(`   📋 Result: ${allAccessible ? '✅ All images accessible' : '❌ Some images inaccessible'}\n`);
  }

  return results;
}

function generateReport(results: TestResult[]): void {
  console.log('\n📊 TEST REPORT');
  console.log('================\n');

  const totalBoats = results.length;
  const boatsWithAllImages = results.filter(r => r.allAccessible).length;
  const boatsWithSomeImages = results.filter(r => r.accessibleImages.some(a => a) && !r.allAccessible).length;
  const boatsWithNoImages = results.filter(r => r.accessibleImages.every(a => !a)).length;

  console.log(`📈 Summary:`);
  console.log(`   Total boats tested: ${totalBoats}`);
  console.log(`   ✅ All images accessible: ${boatsWithAllImages} (${Math.round(boatsWithAllImages/totalBoats*100)}%)`);
  console.log(`   ⚠️  Some images accessible: ${boatsWithSomeImages} (${Math.round(boatsWithSomeImages/totalBoats*100)}%)`);
  console.log(`   ❌ No images accessible: ${boatsWithNoImages} (${Math.round(boatsWithNoImages/totalBoats*100)}%)`);

  console.log('\n🔍 Detailed Results:');
  
  results.forEach(result => {
    const accessibleCount = result.accessibleImages.filter(a => a).length;
    const totalCount = result.accessibleImages.length;
    
    console.log(`\n🚢 ${result.boatId} (${result.model})`);
    console.log(`   📸 Images: ${accessibleCount}/${totalCount} accessible`);
    
    if (!result.allAccessible) {
      result.photoUrls.forEach((url, index) => {
        if (!result.accessibleImages[index]) {
          console.log(`   ❌ Failed: ${url}`);
        }
      });
    }
  });

  console.log('\n💡 Recommendations:');
  
  if (boatsWithNoImages > 0) {
    console.log('   - Check R2 configuration and bucket accessibility');
    console.log('   - Verify that images were uploaded correctly');
    console.log('   - Run the R2 migration script if needed');
  }
  
  if (boatsWithSomeImages > 0) {
    console.log('   - Some images may have upload errors');
    console.log('   - Check individual image keys for typos or corruption');
  }
  
  if (boatsWithAllImages === totalBoats) {
    console.log('   ✅ All images are working perfectly!');
    console.log('   ✅ R2 integration is successful');
  }
}

async function main() {
  try {
    const results = await testBoatImages();
    generateReport(results);
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Visit http://localhost:3000/boat/{boat_id} to test in browser');
    console.log('   2. Check that images display correctly in the carousel');
    console.log('   3. Verify that error handling works for missing images');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Lancer le test si exécuté directement
if (require.main === module) {
  main();
}

export { testBoatImages, generateReport, normalizeImageUrls }; 