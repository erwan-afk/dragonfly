import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma/client';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const boatCreateLimiter = createRateLimiter('boat_create', 5, 60);

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
            photos,
            currency,
            specifications,
            vatPaid,
            productId
        } = body;

        // Validation
        if (!model || !price || !country || !description) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Vérifier la limite de description
        if (description.length > 2000) {
            return NextResponse.json(
                { error: 'Description must be less than 2000 characters' },
                { status: 400 }
            );
        }

        // Create boat with Prisma (standard fields)
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
                userId: session.user.id
            }
        });

        // Update email and condition with raw SQL (new columns not yet in Prisma client)
        if (email || condition) {
            await prisma.$executeRaw`
                UPDATE "boats" SET
                    email = ${email || null},
                    "condition" = ${condition || null}
                WHERE id = ${boat.id}
            `;
        }

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