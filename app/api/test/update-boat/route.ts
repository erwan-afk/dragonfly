import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma/client';

export const dynamic = 'force-dynamic';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { boatId, productId } = body;

    if (!boatId || !productId) {
      return NextResponse.json(
        { error: 'Missing boatId or productId' },
        { status: 400 }
      );
    }

    console.log(`🧪 TEST: Updating boat ${boatId} with productId ${productId}`);

    // Vérifier que l'utilisateur est propriétaire du bateau
    const boat = await prisma.boat.findFirst({
      where: {
        id: boatId,
        userId: session.user.id
      }
    });

    if (!boat) {
      return NextResponse.json({ error: 'Boat not found or unauthorized' }, { status: 404 });
    }

    // Mettre à jour le productId
    await prisma.boat.update({
      where: { id: boatId },
      data: { productId }
    });

    console.log(`✅ TEST: Boat ${boatId} productId updated to: ${productId}`);

    // Vérifier le résultat
    const updatedBoat = await prisma.boat.findUnique({
      where: { id: boatId },
      select: { productId: true }
    });

    return NextResponse.json({
      success: true,
      message: 'Boat updated successfully',
      boat: { id: boatId, productId: updatedBoat?.productId }
    });

  } catch (error) {
    console.error('❌ TEST: Error updating boat:', error);
    return NextResponse.json(
      { error: 'Failed to update boat' },
      { status: 500 }
    );
  }
}
