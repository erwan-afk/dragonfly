import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma';

export async function GET(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Récupérer le dernier bateau créé par cet utilisateur dans les dernières 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const latestBoat = await prisma.$queryRaw`
      SELECT id, model, price, country, created_at 
      FROM boats 
      WHERE user_id = ${userId} 
      AND created_at >= ${fiveMinutesAgo}
      ORDER BY created_at DESC 
      LIMIT 1
    ` as any[];

    if (!latestBoat || latestBoat.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "No recent boat found" 
      }, { status: 404 });
    }

    const boat = latestBoat[0];

    return NextResponse.json({
      success: true,
      boat: {
        id: boat.id,
        model: boat.model,
        price: boat.price,
        country: boat.country,
        createdAt: boat.created_at
      }
    });

  } catch (error) {
    console.error('Error retrieving latest boat:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to retrieve boat" },
      { status: 500 }
    );
  }
} 