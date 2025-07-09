import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from 'dotenv';
import sharp from 'sharp';

// Charger les variables d'environnement depuis .env.local
config({ path: '.env.local' });

// Configuration Cloudflare R2
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // Optionnel pour custom domain

// Configuration du client S3 pour Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// Types
export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface ImageMetadata {
  boatId: string;
  originalName: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
}

// Génère une clé unique pour l'image : boats/{boatId}/{timestamp}-{filename}
export function generateImageKey(boatId: string, filename: string): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `boats/${boatId}/${timestamp}-${sanitizedFilename}`;
}

// Génère une clé unique pour l'image temporaire : temp_{sessionId}/{timestamp}-{filename}
export function generateTempImageKey(sessionId: string, filename: string): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `temp_${sessionId}/${timestamp}-${sanitizedFilename}`;
}

// Upload une image vers R2 (uniquement pour bateaux payés)
export async function uploadImageToR2(
  file: File,
  boatId: string
): Promise<UploadResult> {
  try {
    const key = generateImageKey(boatId, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        boatId,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    await r2Client.send(command);

    // Génère l'URL publique
    const publicUrl = R2_PUBLIC_URL 
      ? `https://${R2_PUBLIC_URL}/${key}`
      : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

    return {
      success: true,
      url: publicUrl,
      key,
    };
  } catch (error) {
    console.error('Error uploading to R2:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

// Upload une image vers un dossier temporaire (avant paiement)
export async function uploadImageToTempR2(
  file: File,
  sessionId: string
): Promise<UploadResult> {
  try {
    const key = generateTempImageKey(sessionId, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        sessionId,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        temporary: 'true',
      },
    });

    await r2Client.send(command);

    // Génère l'URL publique
    const publicUrl = R2_PUBLIC_URL 
      ? `https://${R2_PUBLIC_URL}/${key}`
      : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

    return {
      success: true,
      url: publicUrl,
      key,
    };
  } catch (error) {
    console.error('Error uploading to temporary R2:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Temporary upload failed',
    };
  }
}

// Convertit une image en WebP avec compression
export async function convertImageToWebP(
  file: File,
  quality: number = 80
): Promise<{ buffer: Buffer; filename: string }> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Convertir l'image en WebP avec Sharp
    const webpBuffer = await sharp(buffer)
      .webp({ quality })
      .toBuffer();

    // Générer le nouveau nom de fichier avec l'extension .webp
    const originalName = file.name.split('.').slice(0, -1).join('.') || 'image';
    const webpFilename = `${originalName}.webp`;

    return {
      buffer: webpBuffer,
      filename: webpFilename
    };
  } catch (error) {
    console.error('Error converting image to WebP:', error);
    throw new Error('Failed to convert image to WebP');
  }
}

// Upload une image vers R2 avec conversion WebP automatique
export async function uploadImageToR2WithWebP(
  file: File,
  boatId: string,
  quality: number = 80
): Promise<UploadResult> {
  try {
    // Convertir l'image en WebP
    const { buffer, filename } = await convertImageToWebP(file, quality);
    
    const key = generateImageKey(boatId, filename);

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'image/webp',
      Metadata: {
        boatId,
        originalName: file.name,
        convertedFilename: filename,
        uploadedAt: new Date().toISOString(),
        converted: 'true',
        quality: quality.toString(),
      },
    });

    await r2Client.send(command);

    // Génère l'URL publique
    const publicUrl = R2_PUBLIC_URL 
      ? `https://${R2_PUBLIC_URL}/${key}`
      : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

    return {
      success: true,
      url: publicUrl,
      key,
    };
  } catch (error) {
    console.error('Error uploading to R2 with WebP conversion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload with WebP conversion failed',
    };
  }
}

// Upload une image vers un dossier temporaire avec conversion WebP
export async function uploadImageToTempR2WithWebP(
  file: File,
  sessionId: string,
  quality: number = 80
): Promise<UploadResult> {
  try {
    // Convertir l'image en WebP
    const { buffer, filename } = await convertImageToWebP(file, quality);
    
    const key = generateTempImageKey(sessionId, filename);

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: 'image/webp',
      Metadata: {
        sessionId,
        originalName: file.name,
        convertedFilename: filename,
        uploadedAt: new Date().toISOString(),
        temporary: 'true',
        converted: 'true',
        quality: quality.toString(),
      },
    });

    await r2Client.send(command);

    // Génère l'URL publique
    const publicUrl = R2_PUBLIC_URL 
      ? `https://${R2_PUBLIC_URL}/${key}`
      : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

    return {
      success: true,
      url: publicUrl,
      key,
    };
  } catch (error) {
    console.error('Error uploading to temporary R2 with WebP conversion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Temporary upload with WebP conversion failed',
    };
  }
}

// Upload multiple images pour un bateau
export async function uploadImagesForBoat(
  files: File[],
  boatId: string
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file => uploadImageToR2(file, boatId));
  return Promise.all(uploadPromises);
}

// Upload multiple images pour un bateau avec conversion WebP
export async function uploadImagesForBoatWithWebP(
  files: File[],
  boatId: string,
  quality: number = 80
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file => uploadImageToR2WithWebP(file, boatId, quality));
  return Promise.all(uploadPromises);
}

// Déplace les images du dossier temporaire vers le dossier final du bateau
export async function moveTempImagesToBoat(
  tempKeys: string[],
  boatId: string
): Promise<{ success: boolean; finalUrls: string[]; error?: string }> {
  try {
    const finalUrls: string[] = [];

    for (const tempKey of tempKeys) {
      // Récupérer l'image temporaire
      const getCommand = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: tempKey,
      });

      const response = await r2Client.send(getCommand);
      
      if (!response.Body) {
        console.error(`No data found for temp key: ${tempKey}`);
        continue;
      }

      // Convertir le stream en buffer
      const bodyBuffer = Buffer.from(await response.Body.transformToByteArray());

      // Extraire le nom du fichier original de la clé temporaire
      const filename = tempKey.split('/').pop()?.split('-').slice(1).join('-') || 'image.jpg';
      
      // Générer la nouvelle clé pour le bateau
      const finalKey = generateImageKey(boatId, filename);
      
      // Copier vers la destination finale
      const putCommand = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: finalKey,
        Body: bodyBuffer,
        ContentType: response.ContentType,
        Metadata: {
          boatId,
          originalName: filename,
          uploadedAt: new Date().toISOString(),
          movedFrom: tempKey,
        },
      });

      await r2Client.send(putCommand);

      // Supprimer l'image temporaire
      await deleteImageFromR2(tempKey);

      // Générer l'URL finale
      const finalUrl = R2_PUBLIC_URL 
        ? `https://${R2_PUBLIC_URL}/${finalKey}`
        : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${finalKey}`;

      finalUrls.push(finalUrl);
      console.log(`✅ Moved temp image ${tempKey} to ${finalKey}`);
    }

    return {
      success: true,
      finalUrls,
    };
  } catch (error) {
    console.error('Error moving temp images to boat:', error);
    return {
      success: false,
      finalUrls: [],
      error: error instanceof Error ? error.message : 'Failed to move images',
    };
  }
}

// Récupère une image depuis R2
export async function getImageFromR2(key: string): Promise<{
  success: boolean;
  data?: Buffer;
  contentType?: string;
  error?: string;
}> {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const response = await r2Client.send(command);
    
    if (!response.Body) {
      return { success: false, error: 'No image data found' };
    }

    const data = Buffer.from(await response.Body.transformToByteArray());
    
    return {
      success: true,
      data,
      contentType: response.ContentType || 'image/jpeg',
    };
  } catch (error) {
    console.error('Error getting image from R2:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get image',
    };
  }
}

// Supprime une image de R2
export async function deleteImageFromR2(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting image from R2:', error);
    return false;
  }
}

// Liste toutes les images d'un bateau
export async function listBoatImages(boatId: string): Promise<string[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: `boats/${boatId}/`,
    });

    const response = await r2Client.send(command);
    
    return response.Contents?.map(object => object.Key!).filter(Boolean) || [];
  } catch (error) {
    console.error('Error listing boat images:', error);
    return [];
  }
}

// Supprime toutes les images d'un bateau
export async function deleteAllBoatImages(boatId: string): Promise<boolean> {
  try {
    const imageKeys = await listBoatImages(boatId);
    
    if (imageKeys.length === 0) {
      return true;
    }

    const deletePromises = imageKeys.map(key => deleteImageFromR2(key));
    const results = await Promise.all(deletePromises);
    
    return results.every(result => result === true);
  } catch (error) {
    console.error('Error deleting all boat images:', error);
    return false;
  }
}

// Génère une URL signée pour l'upload direct (optionnel, pour les gros fichiers)
export async function generateUploadSignedUrl(
  boatId: string,
  filename: string,
  contentType: string,
  expiresIn: number = 3600 // 1 heure
): Promise<{ success: boolean; url?: string; key?: string; error?: string }> {
  try {
    const key = generateImageKey(boatId, filename);
    
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      Metadata: {
        boatId,
        originalName: filename,
        uploadedAt: new Date().toISOString(),
      },
    });

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });

    return {
      success: true,
      url: signedUrl,
      key,
    };
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate signed URL',
    };
  }
}

// Extrait l'ID du bateau depuis une clé R2
export function extractBoatIdFromKey(key: string): string | null {
  const match = key.match(/^boats\/([^\/]+)\//);
  return match ? match[1] : null;
}

// Convertit une URL publique en clé R2
export function urlToKey(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // Supprime le slash initial
    return pathname.startsWith('/') ? pathname.slice(1) : pathname;
  } catch {
    return null;
  }
}

// Valide la configuration R2
export function validateR2Config(): { valid: boolean; missing: string[] } {
  const requiredVars = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID', 
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  return {
    valid: missing.length === 0,
    missing
  };
}

// ==================== NETTOYAGE DES IMAGES TEMPORAIRES ====================

// Liste toutes les images temporaires
export async function listTempImages(): Promise<string[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: `temp_session_`,
    });

    const response = await r2Client.send(command);
    
    return response.Contents?.map(object => object.Key!).filter(Boolean) || [];
  } catch (error) {
    console.error('Error listing temp images:', error);
    return [];
  }
}

// Supprime toutes les images temporaires d'une session spécifique
export async function deleteTempSessionImages(sessionId: string): Promise<boolean> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: `temp_session_${sessionId}/`,
    });

    const response = await r2Client.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      return true; // Pas d'images à supprimer
    }

    const deletePromises = response.Contents.map(object => 
      deleteImageFromR2(object.Key!)
    );
    
    const results = await Promise.all(deletePromises);
    const allDeleted = results.every(result => result === true);
    
    if (allDeleted) {
      console.log(`✅ Deleted ${response.Contents.length} temp images for session: ${sessionId}`);
    } else {
      console.log(`⚠️ Some temp images failed to delete for session: ${sessionId}`);
    }
    
    return allDeleted;
  } catch (error) {
    console.error('Error deleting temp session images:', error);
    return false;
  }
}

// Supprime les images temporaires anciennes (plus de X heures)
export async function cleanupOldTempImages(hoursOld: number = 2): Promise<{
  deleted: number;
  failed: number;
  totalFound: number;
}> {
  try {
    console.log(`🧹 Starting cleanup of temp images older than ${hoursOld} hours...`);
    
    const tempImages = await listTempImages();
    const cutoffTime = new Date(Date.now() - (hoursOld * 60 * 60 * 1000));
    
    let deleted = 0;
    let failed = 0;
    
    for (const key of tempImages) {
      try {
        // Extraire le timestamp du nom de fichier
        const match = key.match(/temp_session_(\d+)_/);
        if (!match) continue;
        
        const timestamp = parseInt(match[1]);
        const imageDate = new Date(timestamp);
        
        if (imageDate < cutoffTime) {
          const success = await deleteImageFromR2(key);
          if (success) {
            deleted++;
            console.log(`🗑️ Deleted old temp image: ${key}`);
          } else {
            failed++;
            console.log(`❌ Failed to delete temp image: ${key}`);
          }
        }
      } catch (error) {
        console.error(`Error processing temp image ${key}:`, error);
        failed++;
      }
    }
    
    console.log(`✅ Cleanup completed: ${deleted} deleted, ${failed} failed, ${tempImages.length} total found`);
    
    return {
      deleted,
      failed,
      totalFound: tempImages.length,
    };
  } catch (error) {
    console.error('Error during temp images cleanup:', error);
    return {
      deleted: 0,
      failed: 0,
      totalFound: 0,
    };
  }
}

// Supprime TOUTES les images temporaires (dangereux - utiliser avec précaution)
export async function deleteAllTempImages(): Promise<{
  deleted: number;
  failed: number;
}> {
  try {
    console.log('🧹 Starting cleanup of ALL temp images...');
    
    const tempImages = await listTempImages();
    
    let deleted = 0;
    let failed = 0;
    
    for (const key of tempImages) {
      const success = await deleteImageFromR2(key);
      if (success) {
        deleted++;
        console.log(`🗑️ Deleted temp image: ${key}`);
      } else {
        failed++;
        console.log(`❌ Failed to delete temp image: ${key}`);
      }
    }
    
    console.log(`✅ Cleanup completed: ${deleted} deleted, ${failed} failed`);
    
    return { deleted, failed };
  } catch (error) {
    console.error('Error during temp images cleanup:', error);
    return { deleted: 0, failed: 0 };
  }
} 