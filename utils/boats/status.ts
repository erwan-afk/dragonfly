import prisma from '@/utils/prisma/client';
import { deleteAllBoatImages } from '@/utils/cloudflare/r2';

export async function activateBoat(boatId: string) {
    try {
        const boat = await prisma.boat.update({
            where: { id: boatId },
            data: {
                status: 'active',
                updatedAt: new Date()
            }
        });
        console.log(`✅ Boat ${boatId} activated successfully`);
        return boat;
    } catch (error) {
        console.error(`❌ Error activating boat ${boatId}:`, error);
        throw error;
    }
}

export async function deleteBoat(boatId: string) {
    try {
        await prisma.boat.delete({
            where: { id: boatId }
        });
        console.log(`✅ Boat ${boatId} deleted successfully`);
    } catch (error) {
        console.error(`❌ Error deleting boat ${boatId}:`, error);
        throw error;
    }
}

export async function safeDeleteBoat(boatId: string, maxRetries: number = 3) {
    let retries = 0;

    while (retries < maxRetries) {
        try {
            await deleteBoat(boatId);
            return { success: true, retries };
        } catch (error) {
            retries++;
            console.error(`❌ Attempt ${retries} failed for boat ${boatId}:`, error);

            if (retries < maxRetries) {
                // Attendre avant de réessayer (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
            }
        }
    }

    console.error(`❌ Failed to delete boat ${boatId} after ${maxRetries} attempts`);
    return { success: false, retries };
}

export async function emergencyCleanup(boatId: string, reason: string) {
    console.log(`🚨 Emergency cleanup triggered for boat ${boatId} - Reason: ${reason}`);

    // Première étape : supprimer les images
    try {
        console.log(`🗑️ Deleting images for boat ${boatId}...`);
        const imagesDeleted = await deleteAllBoatImages(boatId);
        if (imagesDeleted) {
            console.log(`✅ All images deleted for boat ${boatId}`);
        } else {
            console.log(`⚠️ Some images may not have been deleted for boat ${boatId}`);
        }
    } catch (imageError) {
        console.error(`❌ Error deleting images for boat ${boatId}:`, imageError);
        // Continue with boat deletion even if image deletion fails
    }

    // Deuxième étape : supprimer le bateau
    try {
        // Première tentative : suppression normale
        await deleteBoat(boatId);
        console.log(`✅ Emergency cleanup successful for boat ${boatId}`);
        return { success: true, method: 'direct' };
    } catch (error) {
        console.error(`❌ Direct deletion failed for boat ${boatId}, trying safe deletion...`);

        // Deuxième tentative : suppression avec retry
        const result = await safeDeleteBoat(boatId);
        if (result.success) {
            console.log(`✅ Emergency cleanup successful for boat ${boatId} after ${result.retries} retries`);
            return { success: true, method: 'retry', retries: result.retries };
        }

        // Troisième tentative : marquer comme supprimé
        try {
            await prisma.boat.update({
                where: { id: boatId },
                data: {
                    status: 'deleted',
                    updatedAt: new Date()
                }
            });
            console.log(`⚠️ Boat ${boatId} marked as deleted instead of physical deletion`);
            return { success: true, method: 'mark_deleted' };
        } catch (markError) {
            console.error(`❌ Complete emergency cleanup failed for boat ${boatId}:`, markError);
            return { success: false, method: 'failed' };
        }
    }
}

export async function markBoatAsInactive(boatId: string) {
    try {
        const boat = await prisma.boat.update({
            where: { id: boatId },
            data: {
                status: 'inactive',
                updatedAt: new Date()
            }
        });
        console.log(`✅ Boat ${boatId} marked as inactive`);
        return boat;
    } catch (error) {
        console.error(`❌ Error marking boat ${boatId} as inactive:`, error);
        throw error;
    }
}

export async function markBoatAsSold(boatId: string) {
    try {
        const boat = await prisma.boat.update({
            where: { id: boatId },
            data: {
                status: 'sold',
                updatedAt: new Date()
            }
        });
        console.log(`✅ Boat ${boatId} marked as sold`);
        return boat;
    } catch (error) {
        console.error(`❌ Error marking boat ${boatId} as sold:`, error);
        throw error;
    }
}

export async function getBoatsByStatus(status: 'pending' | 'active' | 'inactive' | 'deleted' | 'sold') {
    try {
        const boats = await prisma.boat.findMany({
            where: { status },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar_url: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return boats;
    } catch (error) {
        console.error(`❌ Error fetching boats with status ${status}:`, error);
        throw error;
    }
} 