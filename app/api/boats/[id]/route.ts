import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma/client';
import { deleteAllBoatImages } from '@/utils/cloudflare/r2';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const boatId = params.id;
    const userId = session.user.id;

    // First, check if the boat exists and belongs to the user
    const boat = await prisma.$queryRaw`
      SELECT id, user_id FROM boats WHERE id = ${boatId}
    ` as any[];

    if (!boat || boat.length === 0) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    if (boat[0].user_id !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own boats' }, 
        { status: 403 }
      );
    }

    // Delete images from R2 first
    console.log(`🗑️ Deleting images for boat: ${boatId}`);
    const imagesDeleted = await deleteAllBoatImages(boatId);
    
    if (imagesDeleted) {
      console.log(`✅ All images deleted for boat: ${boatId}`);
    } else {
      console.log(`⚠️ Some images may not have been deleted for boat: ${boatId}`);
      // Continue with deletion even if images deletion fails
    }

    // Delete related payments (foreign key constraint)
    await prisma.$executeRaw`
      DELETE FROM payments WHERE boat_id = ${boatId}
    `;

    // Delete the boat from database
    await prisma.$executeRaw`
      DELETE FROM boats WHERE id = ${boatId}
    `;

    console.log(`✅ Boat and images deleted: ${boatId} by user: ${userId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Boat listing and images deleted successfully' 
    });

  } catch (error) {
    console.error('❌ Error deleting boat:', error);
    return NextResponse.json(
      { error: 'Failed to delete boat listing' },
      { status: 500 }
    );
  }
} 