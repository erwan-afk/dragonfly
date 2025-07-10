import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma/client';

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            model,
            price,
            country,
            description,
            photos,
            currency,
            specifications,
            vatPaid
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

        // Créer le bateau avec statut pending
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
                status: 'pending', // Statut pending par défaut
                userId: session.user.id
            }
        });

        console.log('✅ Boat created with pending status:', boat.id);

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

        console.log(`✅ Boat ${boatId} status updated to ${status}`);

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

        console.log(`✅ Boat ${boatId} deleted`);

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