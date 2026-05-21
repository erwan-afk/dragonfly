import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma/client';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';
import { isValidVideoUrl } from '@/utils/video-embed';
import { getMaxPhotos } from '@/lib/product-features';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const boatSearchLimiter = createRateLimiter('boat_search', 100, 60);
const boatCreateLimiter = createRateLimiter('boat_create', 5, 60);

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  );
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rateLimitResponse = await checkRateLimit(boatSearchLimiter, ip);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    const boats = await prisma.boat.findMany({
      where: {
        status: 'active',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        model: true,
        price: true,
        currency: true,
        country: true,
        photos: true,
        condition: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ boats, limit, offset });
  } catch (error) {
    console.error('❌ Error fetching boats:', error);
    return NextResponse.json({ error: 'Failed to fetch boats' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limiting per user
        const rateLimitResponse = await checkRateLimit(boatCreateLimiter, session.user.id);
        if (rateLimitResponse) return rateLimitResponse;

        const body = await request.json();
        const {
            model,
            price,
            country,
            description,
            email,
            condition,
            year,
            photos,
            currency,
            specifications,
            vatPaid,
            productId,
            hasExtraPhotos,
            videoUrl
        } = body;

        // Validation
        if (!model || !price || !country || !description) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Input validation
        if (description.length < 300) {
            return NextResponse.json({ error: 'Description must be at least 300 characters' }, { status: 400 });
        }
        if (description.length > 2000) {
            return NextResponse.json({ error: 'Description must be less than 2000 characters' }, { status: 400 });
        }
        if (model.length > 200) {
            return NextResponse.json({ error: 'Model name too long' }, { status: 400 });
        }
        if (country.length > 100) {
            return NextResponse.json({ error: 'Country name too long' }, { status: 400 });
        }
        if (photos && (!Array.isArray(photos) || photos.length > 20)) {
            return NextResponse.json({ error: 'Invalid photos (max 20)' }, { status: 400 });
        }
        if (specifications && (!Array.isArray(specifications) || specifications.length > 50)) {
            return NextResponse.json({ error: 'Invalid specifications (max 50)' }, { status: 400 });
        }
        if (email && (typeof email !== 'string' || email.length > 255)) {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
        }

        // Year validation
        let parsedYear: number | null = null;
        if (year !== undefined && year !== null && year !== '') {
            const yearNum = typeof year === 'number' ? year : parseInt(String(year), 10);
            const maxYear = new Date().getFullYear() + 1;
            if (!Number.isInteger(yearNum) || yearNum < 1960 || yearNum > maxYear) {
                return NextResponse.json(
                    { error: `Year must be between 1960 and ${maxYear}` },
                    { status: 400 }
                );
            }
            parsedYear = yearNum;
        }

        // Add-ons validation
        if (videoUrl) {
            if (typeof videoUrl !== 'string' || videoUrl.length > 500) {
                return NextResponse.json({ error: 'Invalid video URL' }, { status: 400 });
            }
            if (!isValidVideoUrl(videoUrl)) {
                return NextResponse.json(
                    { error: 'Video URL must be a valid YouTube, Vimeo or Dailymotion link' },
                    { status: 400 }
                );
            }
        }

        // Enforce photo cap based on plan + extras
        if (productId && photos && photos.length > 0) {
            const product = await prisma.product.findUnique({
                where: { id: productId },
                select: { name: true }
            });
            const planMax = getMaxPhotos(product?.name);
            const cap = planMax + (hasExtraPhotos ? 5 : 0);
            if (cap > 0 && photos.length > cap) {
                return NextResponse.json(
                    { error: `Too many photos (max ${cap} for this plan/add-ons)` },
                    { status: 400 }
                );
            }
        }

        // Create boat with Prisma
        const boat = await prisma.boat.create({
            data: {
                model,
                price: parseFloat(price),
                country,
                description,
                photos: photos || [],
                currency: currency || 'EUR',
                specifications: specifications || [],
                vatPaid: vatPaid || false,
                productId: productId || null,
                status: 'pending',
                userId: session.user.id,
                email: email || null,
                condition: condition || null,
                year: parsedYear,
                hasExtraPhotos: !!hasExtraPhotos,
                videoUrl: videoUrl || null
            } as any
        });

        return NextResponse.json({
            success: true,
            boatId: boat.id,
            message: 'Boat created successfully with pending status'
        });

    } catch (error) {
        console.error('❌ Error creating boat:', error);
        return NextResponse.json(
            { error: 'Failed to create boat' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { boatId, status } = body;

        if (!boatId || !status) {
            return NextResponse.json(
                { error: 'Missing boatId or status' },
                { status: 400 }
            );
        }

        // Sécurité: l'utilisateur ne doit jamais pouvoir activer ("active") une annonce via API.
        // L'activation est réservée au webhook Stripe après paiement confirmé.
        if (status === 'active' || status === 'pending') {
            return NextResponse.json(
                { error: 'Forbidden status transition' },
                { status: 403 }
            );
        }

        // Vérifier que le bateau appartient à l'utilisateur
        const existingBoat = await prisma.boat.findFirst({
            where: {
                id: boatId,
                userId: session.user.id
            }
        });

        if (!existingBoat) {
            return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
        }

        // Mettre à jour le statut
        const updatedBoat = await prisma.boat.update({
            where: { id: boatId },
            data: {
                status,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            boat: updatedBoat,
            message: `Boat status updated to ${status}`
        });

    } catch (error) {
        console.error('❌ Error updating boat status:', error);
        return NextResponse.json(
            { error: 'Failed to update boat status' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const boatId = searchParams.get('boatId');

        if (!boatId) {
            return NextResponse.json(
                { error: 'Missing boatId' },
                { status: 400 }
            );
        }

        // Vérifier que le bateau appartient à l'utilisateur
        const existingBoat = await prisma.boat.findFirst({
            where: {
                id: boatId,
                userId: session.user.id
            }
        });

        if (!existingBoat) {
            return NextResponse.json({ error: 'Boat not found' }, { status: 404 });
        }

        // Supprimer le bateau (ou le marquer comme supprimé)
        await prisma.boat.delete({
            where: { id: boatId }
        });

        return NextResponse.json({
            success: true,
            message: 'Boat deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error deleting boat:', error);
        return NextResponse.json(
            { error: 'Failed to delete boat' },
            { status: 500 }
        );
    }
} 