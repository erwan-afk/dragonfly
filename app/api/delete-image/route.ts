import { NextRequest, NextResponse } from 'next/server';
import { deleteImageFromR2, urlToKey } from '@/utils/cloudflare/r2';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get the session
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl, boatId } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 });
    }

    if (!boatId) {
      return NextResponse.json({ error: 'Missing boatId' }, { status: 400 });
    }

    // Verify the user owns this boat
    const boat = await prisma.boat.findUnique({
      where: { id: boatId },
      select: { userId: true }
    });

    if (!boat) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
    }

    if (boat.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Extract the key from the URL
    const key = urlToKey(imageUrl);

    if (!key) {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    }

    // Verify the image belongs to this boat's folder
    if (!key.startsWith(`boats/${boatId}/`)) {
      return NextResponse.json({ error: 'Image does not belong to this boat' }, { status: 403 });
    }

    // Delete the image from R2
    const deleted = await deleteImageFromR2(key);

    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
    }

    console.log(`✅ Deleted replaced image: ${key} for boat: ${boatId}`);

    return NextResponse.json({ success: true, deletedKey: key });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
