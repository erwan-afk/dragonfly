import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import { checkUser } from '@/utils/auth/check-user';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';
import { deleteImageFromR2, deleteAllBoatImages, deleteTempSessionImages, cleanupOldTempImages } from '@/utils/cloudflare/r2';
import prisma from '@/utils/prisma/client';

export const dynamic = 'force-dynamic';

const rateLimiter = createRateLimiter('admin_r2', 60, 60); // 60 requests per minute

// R2 client for listing
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;

function getPublicUrl(key: string): string {
  if (R2_PUBLIC_URL) {
    const hasProtocol = R2_PUBLIC_URL.startsWith('http://') || R2_PUBLIC_URL.startsWith('https://');
    const baseUrl = hasProtocol ? R2_PUBLIC_URL : `https://${R2_PUBLIC_URL}`;
    return `${baseUrl}/${key}`;
  }
  return `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
}

export interface R2Object {
  key: string;
  size: number;
  lastModified: Date;
  url: string;
  folder: string;
  filename: string;
}

export interface R2Folder {
  name: string;
  prefix: string;
  objectCount: number;
  totalSize: number;
  type: 'boat' | 'temp' | 'other';
  boatId?: string;
  sessionId?: string;
  ownerEmail?: string;
  ownerName?: string;
  boatModel?: string;
}

// GET - List all objects/folders in R2
export async function GET(request: NextRequest) {
  try {
    const userCheck = await checkUser();

    if (!userCheck.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (userCheck.isBanned) {
      return NextResponse.json({ error: 'Account is banned' }, { status: 403 });
    }

    // Only superAdmin can access R2 management
    if (!userCheck.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden - SuperAdmin only' }, { status: 403 });
    }

    const rateLimitResponse = await checkRateLimit(rateLimiter, userCheck.user!.id);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || '';
    const action = searchParams.get('action') || 'list';

    if (action === 'stats') {
      // Get bucket statistics
      return await getBucketStats();
    }

    if (action === 'folders') {
      // Get top-level folder structure
      return await getFolderStructure();
    }

    // List objects with optional prefix
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: 1000,
    });

    const response = await r2Client.send(command);

    const objects: R2Object[] = (response.Contents || []).map(obj => {
      const key = obj.Key!;
      const parts = key.split('/');
      const filename = parts.pop() || key;
      const folder = parts.join('/');

      return {
        key,
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
        url: getPublicUrl(key),
        folder,
        filename,
      };
    });

    return NextResponse.json({
      objects,
      count: objects.length,
      truncated: response.IsTruncated,
      prefix,
    });
  } catch (error) {
    console.error('Error listing R2 objects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getBucketStats() {
  try {
    // List all objects to calculate stats
    let continuationToken: string | undefined;
    let totalObjects = 0;
    let totalSize = 0;
    let boatFolders = new Set<string>();
    let tempFolders = new Set<string>();
    let tempSize = 0;
    let boatSize = 0;

    do {
      const command = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      });

      const response = await r2Client.send(command);

      for (const obj of response.Contents || []) {
        totalObjects++;
        totalSize += obj.Size || 0;

        const key = obj.Key!;
        if (key.startsWith('boats/')) {
          const boatId = key.split('/')[1];
          if (boatId) boatFolders.add(boatId);
          boatSize += obj.Size || 0;
        } else if (key.startsWith('temp_')) {
          const sessionMatch = key.match(/^temp_([^\/]+)/);
          if (sessionMatch) tempFolders.add(sessionMatch[1]);
          tempSize += obj.Size || 0;
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return NextResponse.json({
      totalObjects,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      boatFolders: boatFolders.size,
      tempFolders: tempFolders.size,
      boatSize,
      boatSizeFormatted: formatBytes(boatSize),
      tempSize,
      tempSizeFormatted: formatBytes(tempSize),
    });
  } catch (error) {
    console.error('Error getting bucket stats:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}

async function getFolderStructure() {
  try {
    let continuationToken: string | undefined;
    const folders: Map<string, R2Folder> = new Map();

    do {
      const command = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      });

      const response = await r2Client.send(command);

      for (const obj of response.Contents || []) {
        const key = obj.Key!;
        const parts = key.split('/');

        let folderName: string;
        let folderType: 'boat' | 'temp' | 'other';
        let boatId: string | undefined;
        let sessionId: string | undefined;

        if (key.startsWith('boats/')) {
          folderName = `boats/${parts[1]}`;
          folderType = 'boat';
          boatId = parts[1];
        } else if (key.startsWith('temp_')) {
          folderName = parts[0];
          folderType = 'temp';
          sessionId = parts[0].replace('temp_', '');
        } else {
          folderName = parts[0] || 'root';
          folderType = 'other';
        }

        const existing = folders.get(folderName);
        if (existing) {
          existing.objectCount++;
          existing.totalSize += obj.Size || 0;
        } else {
          folders.set(folderName, {
            name: folderName,
            prefix: folderName + '/',
            objectCount: 1,
            totalSize: obj.Size || 0,
            type: folderType,
            boatId,
            sessionId,
          });
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    // Get boat info from database for boat folders
    const boatIds = Array.from(folders.values())
      .filter(f => f.type === 'boat' && f.boatId)
      .map(f => f.boatId!);

    if (boatIds.length > 0) {
      const boats = await prisma.boat.findMany({
        where: { id: { in: boatIds } },
        select: {
          id: true,
          model: true,
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });

      // Map boat info to folders
      const boatMap = new Map(boats.map(b => [b.id, b]));
      for (const folder of folders.values()) {
        if (folder.type === 'boat' && folder.boatId) {
          const boat = boatMap.get(folder.boatId);
          if (boat) {
            folder.ownerEmail = boat.user?.email || undefined;
            folder.ownerName = boat.user?.name || undefined;
            folder.boatModel = boat.model || undefined;
          }
        }
      }
    }

    const folderList = Array.from(folders.values()).sort((a, b) => {
      // Sort: boats first, then temp, then other
      if (a.type !== b.type) {
        const order = { boat: 0, temp: 1, other: 2 };
        return order[a.type] - order[b.type];
      }
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ folders: folderList });
  } catch (error) {
    console.error('Error getting folder structure:', error);
    return NextResponse.json({ error: 'Failed to get folders' }, { status: 500 });
  }
}

// DELETE - Delete files or folders
export async function DELETE(request: NextRequest) {
  try {
    const userCheck = await checkUser();

    if (!userCheck.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (userCheck.isBanned) {
      return NextResponse.json({ error: 'Account is banned' }, { status: 403 });
    }

    if (!userCheck.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden - SuperAdmin only' }, { status: 403 });
    }

    const rateLimitResponse = await checkRateLimit(rateLimiter, userCheck.user!.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { action, key, boatId, sessionId, hoursOld } = body;

    switch (action) {
      case 'deleteFile':
        if (!key) {
          return NextResponse.json({ error: 'Missing key' }, { status: 400 });
        }
        const fileDeleted = await deleteImageFromR2(key);
        return NextResponse.json({ success: fileDeleted, key });

      case 'deleteBoatFolder':
        if (!boatId) {
          return NextResponse.json({ error: 'Missing boatId' }, { status: 400 });
        }
        const boatDeleted = await deleteAllBoatImages(boatId);
        return NextResponse.json({ success: boatDeleted, boatId });

      case 'deleteTempSession':
        if (!sessionId) {
          return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
        }
        const tempDeleted = await deleteTempSessionImages(sessionId);
        return NextResponse.json({ success: tempDeleted, sessionId });

      case 'cleanupOldTemp':
        const hours = hoursOld || 2;
        const cleanupResult = await cleanupOldTempImages(hours);
        return NextResponse.json({ success: true, ...cleanupResult });

      case 'cleanupOrphans':
        const orphanResult = await cleanupOrphanedImages();
        return NextResponse.json({ success: true, ...orphanResult });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error deleting R2 objects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Cleanup orphaned images (images in R2 not referenced in database)
async function cleanupOrphanedImages(): Promise<{
  orphanedBoatFolders: number;
  orphanedBoatFoldersDeleted: number;
  orphanedImages: number;
  orphanedImagesDeleted: number;
  bytesFreed: number;
  bytesFreedFormatted: string;
  details: string[];
}> {
  const details: string[] = [];
  let orphanedBoatFolders = 0;
  let orphanedBoatFoldersDeleted = 0;
  let orphanedImages = 0;
  let orphanedImagesDeleted = 0;
  let bytesFreed = 0;

  try {
    // 1. List all boat images in R2
    let continuationToken: string | undefined;
    const r2BoatImages: Map<string, { key: string; size: number }[]> = new Map();

    do {
      const command = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: 'boats/',
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      });

      const response = await r2Client.send(command);

      for (const obj of response.Contents || []) {
        const key = obj.Key!;
        const parts = key.split('/');
        if (parts.length >= 2) {
          const boatId = parts[1];
          if (!r2BoatImages.has(boatId)) {
            r2BoatImages.set(boatId, []);
          }
          r2BoatImages.get(boatId)!.push({ key, size: obj.Size || 0 });
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    // 2. Get all boats from database with their photos
    const boatIds = Array.from(r2BoatImages.keys());
    const boats = await prisma.boat.findMany({
      where: { id: { in: boatIds } },
      select: { id: true, photos: true },
    });

    const boatMap = new Map(boats.map(b => [b.id, b.photos || []]));

    // 3. Process each boat folder
    for (const [boatId, r2Images] of r2BoatImages) {
      const dbPhotos = boatMap.get(boatId);

      if (!dbPhotos) {
        // Boat doesn't exist in DB - entire folder is orphaned
        orphanedBoatFolders++;
        details.push(`Orphaned boat folder: ${boatId} (${r2Images.length} files)`);

        for (const img of r2Images) {
          const deleted = await deleteImageFromR2(img.key);
          if (deleted) {
            orphanedBoatFoldersDeleted++;
            bytesFreed += img.size;
          }
        }
      } else {
        // Boat exists - check each image against photos array
        // Normalize DB URLs to extract just the key/filename part for comparison
        const normalizedDbPhotos = new Set<string>();
        for (const photo of dbPhotos) {
          if (typeof photo === 'string') {
            // Extract key from full URL or use as-is if it's already a key
            if (photo.includes('/')) {
              // It's a URL or path - extract the boats/boatId/filename part
              const match = photo.match(/boats\/[^\/]+\/[^\/]+$/);
              if (match) {
                normalizedDbPhotos.add(match[0]);
              } else {
                // Try just the filename
                const filename = photo.split('/').pop();
                if (filename) {
                  normalizedDbPhotos.add(filename);
                }
              }
            } else {
              normalizedDbPhotos.add(photo);
            }
          }
        }

        for (const img of r2Images) {
          const imgKey = img.key; // e.g., "boats/abc123/1234567890-photo.webp"
          const imgFilename = imgKey.split('/').pop() || '';

          // Check if this image is referenced in DB
          const isReferenced =
            normalizedDbPhotos.has(imgKey) ||
            normalizedDbPhotos.has(imgFilename) ||
            Array.from(normalizedDbPhotos).some(dbPhoto =>
              dbPhoto.includes(imgFilename) || imgKey.includes(dbPhoto)
            );

          if (!isReferenced) {
            orphanedImages++;
            details.push(`Orphaned image: ${imgKey}`);

            const deleted = await deleteImageFromR2(img.key);
            if (deleted) {
              orphanedImagesDeleted++;
              bytesFreed += img.size;
            }
          }
        }
      }
    }

    return {
      orphanedBoatFolders,
      orphanedBoatFoldersDeleted,
      orphanedImages,
      orphanedImagesDeleted,
      bytesFreed,
      bytesFreedFormatted: formatBytes(bytesFreed),
      details: details.slice(0, 100), // Limit details to first 100 entries
    };
  } catch (error) {
    console.error('Error cleaning up orphaned images:', error);
    return {
      orphanedBoatFolders: 0,
      orphanedBoatFoldersDeleted: 0,
      orphanedImages: 0,
      orphanedImagesDeleted: 0,
      bytesFreed: 0,
      bytesFreedFormatted: '0 B',
      details: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}
