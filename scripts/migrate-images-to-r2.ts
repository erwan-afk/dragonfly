#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { Client } from 'basic-ftp';
import { uploadImageToR2, validateR2Config } from '../utils/cloudflare/r2';
import streamBuffers from 'stream-buffers';
import path from 'path';

// Configuration FTP
const FTP_HOST = process.env.FTP_HOST!;
const FTP_USER = process.env.FTP_USER!;
const FTP_PASSWORD = process.env.FTP_PASSWORD!;
const FTP_PATH = "/www.dragonfly-trimarans.org/wp-content/uploads/saas/";

const prisma = new PrismaClient();

interface MigrationResult {
  totalBoats: number;
  migratedBoats: number;
  totalImages: number;
  migratedImages: number;
  failedImages: number;
  errors: string[];
}

// Extrait le nom du fichier depuis l'URL
function extractFilenameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return path.basename(pathname);
  } catch {
    return null;
  }
}

// Télécharge un fichier depuis FTP
async function downloadFromFTP(filename: string): Promise<Buffer | null> {
  const client = new Client();
  
  try {
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
    });

    const writableStream = new streamBuffers.WritableStreamBuffer();
    await client.downloadTo(writableStream, `${FTP_PATH}${filename}`);
    client.close();

    const fileBuffer = writableStream.getContents();
    return fileBuffer || null;
  } catch (error) {
    console.error(`Error downloading ${filename} from FTP:`, error);
    client.close();
    return null;
  }
}

// Migre les images d'un bateau spécifique
async function migrateBoatImages(
  boatId: string, 
  photoUrls: string[]
): Promise<{ success: number; failed: number; newUrls: string[]; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const newUrls: string[] = [];
  const errors: string[] = [];

  console.log(`\n🚢 Migrating images for boat ${boatId}...`);
  console.log(`Found ${photoUrls.length} images to migrate`);

  for (let index = 0; index < photoUrls.length; index++) {
    const url = photoUrls[index];
    try {
      console.log(`📥 [${index + 1}/${photoUrls.length}] Processing: ${url}`);
      
      const filename = extractFilenameFromUrl(url);
      if (!filename) {
        errors.push(`Invalid URL format: ${url}`);
        failed++;
        continue;
      }

      // Télécharger depuis FTP
      const buffer = await downloadFromFTP(filename);
      if (!buffer) {
        errors.push(`Failed to download from FTP: ${filename}`);
        failed++;
        continue;
      }

      // Créer un objet File-like pour l'upload R2
      const file = new File([buffer], filename, {
        type: filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
      });

      // Upload vers R2 avec le boatId
      const result = await uploadImageToR2(file, boatId);
      
      if (result.success && result.url) {
        newUrls.push(result.url);
        success++;
        console.log(`✅ Migrated: ${filename} → ${result.url}`);
      } else {
        errors.push(`R2 upload failed for ${filename}: ${result.error}`);
        failed++;
      }

    } catch (error) {
      errors.push(`Unexpected error for ${url}: ${error instanceof Error ? error.message : 'Unknown'}`);
      failed++;
    }
  }

  return { success, failed, newUrls, errors };
}

// Fonction principale de migration
async function migrateAllImages(dryRun: boolean = false): Promise<MigrationResult> {
  const result: MigrationResult = {
    totalBoats: 0,
    migratedBoats: 0,
    totalImages: 0,
    migratedImages: 0,
    failedImages: 0,
    errors: []
  };

  try {
    // Valider la configuration R2
    const configValidation = validateR2Config();
    if (!configValidation.valid) {
      throw new Error(`Missing R2 configuration: ${configValidation.missing.join(', ')}`);
    }

    console.log('🔍 Fetching boats from database...');
    
    // Récupérer tous les bateaux avec des photos
    const boats = await prisma.$queryRaw<Array<{
      id: string;
      photos: string[];
    }>>`
      SELECT id, photos 
      FROM boats 
      WHERE photos IS NOT NULL 
      AND array_length(photos, 1) > 0
    `;

    result.totalBoats = boats.length;
    console.log(`Found ${boats.length} boats with photos`);

    if (dryRun) {
      console.log('\n🔍 DRY RUN - No actual migration will be performed');
    }

    for (let index = 0; index < boats.length; index++) {
      const boat = boats[index];
      console.log(`\n📊 Processing boat ${index + 1}/${boats.length}: ${boat.id}`);
      
      if (!boat.photos || boat.photos.length === 0) {
        console.log('⏭️ No photos found, skipping...');
        continue;
      }

      result.totalImages += boat.photos.length;

      // Filtrer seulement les URLs qui pointent vers l'ancien système FTP
      const ftpUrls = boat.photos.filter((url: string) => 
        url.includes('dragonfly-trimarans.org/wp-content/uploads/saas/')
      );

      if (ftpUrls.length === 0) {
        console.log('ℹ️ No FTP images found (already migrated?), skipping...');
        continue;
      }

      if (dryRun) {
        console.log(`Would migrate ${ftpUrls.length} FTP images for boat ${boat.id}`);
        result.migratedBoats++;
        continue;
      }

      // Migrer les images
      const migrationResult = await migrateBoatImages(boat.id, ftpUrls);
      
      result.migratedImages += migrationResult.success;
      result.failedImages += migrationResult.failed;
      result.errors.push(...migrationResult.errors);

      if (migrationResult.success > 0) {
        // Mettre à jour la base de données avec les nouvelles URLs
        const updatedPhotos = [
          ...boat.photos.filter((url: string) => !url.includes('dragonfly-trimarans.org/wp-content/uploads/saas/')), // Garder les non-FTP
          ...migrationResult.newUrls // Ajouter les nouvelles URLs R2
        ];

        await prisma.$executeRaw`
          UPDATE boats 
          SET photos = ${updatedPhotos}::text[]
          WHERE id = ${boat.id}
        `;

        console.log(`✅ Updated database for boat ${boat.id}`);
        result.migratedBoats++;
      }

      // Pause entre les bateaux pour éviter de surcharger
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

  } catch (error) {
    result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    await prisma.$disconnect();
  }

  return result;
}

// Fonction pour nettoyer les images temporaires anciennes (plus de 24h)
async function cleanupOldTempImages(): Promise<{ deleted: number; errors: string[] }> {
  console.log('\n🧹 Starting cleanup of old temp images...');
  
  // Cette fonction serait implémentée pour supprimer les images temp anciennes
  // Pour l'instant, on retourne juste un placeholder
  return { deleted: 0, errors: [] };
}

// Script principal
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const cleanup = args.includes('--cleanup') || args.includes('-c');

  console.log('🚀 Starting image migration to Cloudflare R2...');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);

  if (cleanup) {
    const cleanupResult = await cleanupOldTempImages();
    console.log(`\n🧹 Cleanup completed: ${cleanupResult.deleted} temp images deleted`);
    if (cleanupResult.errors.length > 0) {
      console.error('Cleanup errors:', cleanupResult.errors);
    }
  }

  const result = await migrateAllImages(dryRun);

  // Afficher le rapport final
  console.log('\n📊 Migration Report:');
  console.log('==================');
  console.log(`Total boats: ${result.totalBoats}`);
  console.log(`Migrated boats: ${result.migratedBoats}`);
  console.log(`Total images: ${result.totalImages}`);
  console.log(`Migrated images: ${result.migratedImages}`);
  console.log(`Failed images: ${result.failedImages}`);
  
  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  const successRate = result.totalImages > 0 
    ? ((result.migratedImages / result.totalImages) * 100).toFixed(1)
    : '0';
  
  console.log(`\n✅ Success rate: ${successRate}%`);
  
  if (!dryRun && result.migratedImages > 0) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('💡 You can now update your frontend to use the new R2 URLs.');
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

export { migrateAllImages, migrateBoatImages, cleanupOldTempImages }; 