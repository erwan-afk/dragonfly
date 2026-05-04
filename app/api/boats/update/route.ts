import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma/client';
import {
  getMaxPhotos,
  getPriceLimit
} from '@/lib/product-features';

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

        const formData = await request.formData();
        const id = formData.get('id') as string;
        const model = formData.get('model') as string;
        const description = formData.get('description') as string;
        const country = formData.get('country') as string;
        const price = formData.get('price') as string;
        const currency = formData.get('currency') as string;
        const specifications = formData.get('specifications') as string;
        const vat_paid = formData.get('vat_paid') as string;
        const photos = formData.get('photos') as string;

        // Validation
        if (!id || !model || !price || !country || !description) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Vérifier que la description n'est pas trop longue
        if (description.length > 2000) {
            return NextResponse.json(
                { error: 'Description must be less than 2000 characters' },
                { status: 400 }
            );
        }

        // Vérifier que le bateau appartient à l'utilisateur
        const existingBoat = await prisma.boat.findFirst({
            where: {
                id: id,
                userId: session.user.id
            }
        });

        if (!existingBoat) {
            return NextResponse.json({ error: 'Boat not found or unauthorized' }, { status: 404 });
        }

        // Déterminer le plan actuel basé sur les paiements
        const { getCurrentBoatPlan } = await import('@/utils/boats/payments');
        const currentPlan = await getCurrentBoatPlan(id);
        const maxPhotosAllowed = getMaxPhotos(currentPlan);
        const priceLimitAllowed = getPriceLimit(currentPlan, currency);

        // Vérifications de sécurité côté serveur
        if (priceLimitAllowed && parseFloat(price) > priceLimitAllowed) {
            return NextResponse.json(
                {
                    error: `Price exceeds plan limit (${priceLimitAllowed}). Please upgrade your plan first.`
                },
                { status: 400 }
            );
        }

        // Compter le nombre total de photos
        const existingPhotos = existingBoat.photos || [];
        let totalPhotos = existingPhotos.length;

        // Si de nouvelles photos sont uploadées, les compter
        if (photos) {
            const photoUrls = photos.split(',').filter(url => url.trim());
            totalPhotos += photoUrls.length;
        }

        if (totalPhotos > maxPhotosAllowed) {
            return NextResponse.json(
                {
                    error: `Too many photos (${totalPhotos}). Maximum ${maxPhotosAllowed} photos allowed for your plan. Please upgrade your plan first.`
                },
                { status: 400 }
            );
        }

        // Parser les spécifications
        let parsedSpecifications: string[] = [];
        try {
            parsedSpecifications = JSON.parse(specifications || '[]');
        } catch (e) {
            parsedSpecifications = [];
        }

        // Parser les photos
        let parsedPhotos: string[] = [];
        try {
            parsedPhotos = photos ? photos.split(',') : [];
        } catch (e) {
            parsedPhotos = [];
        }

        // Mettre à jour le bateau
        const updatedBoat = await prisma.boat.update({
            where: { id: id },
            data: {
                model,
                price: parseFloat(price),
                country,
                description,
                photos: parsedPhotos,
                currency: currency || 'EUR',
                specifications: parsedSpecifications,
                vatPaid: vat_paid === 'true',
                updatedAt: new Date()
            }
        });

        console.log('✅ Boat updated successfully:', updatedBoat.id);

        return NextResponse.json({
            success: true,
            boat: updatedBoat,
            message: 'Boat updated successfully'
        });

    } catch (error) {
        console.error('❌ Error updating boat:', error);
        return NextResponse.json(
            { error: 'Failed to update boat' },
            { status: 500 }
        );
    }
}
