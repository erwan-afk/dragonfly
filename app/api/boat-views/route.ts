import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma/client';
import { generateSessionId } from '@/utils/session-id';
import { createRateLimiter, checkRateLimit } from '@/utils/rate-limit';

export const dynamic = 'force-dynamic';

const viewLimiter = createRateLimiter('boat_view', 30, 60); // 30 views/min per IP

function getClientIP(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  const ip =
    cfConnectingIP ||
    realIP ||
    (forwarded ? forwarded.split(',')[0].trim() : null);

  return ip || null;
}

// POST /api/boat-views - Enregistrer une vue d'annonce
export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = getClientIP(request) || 'unknown';
    const rateLimitResponse = await checkRateLimit(viewLimiter, ip);
    if (rateLimitResponse) return rateLimitResponse;

    const { boatId } = await request.json();

    if (!boatId) {
      return NextResponse.json(
        { error: 'boatId is required' },
        { status: 400 }
      );
    }

    // Vérifier que le bateau existe et est actif
    const boat = await prisma.boat.findFirst({
      where: {
        id: boatId,
        status: 'active'
      }
    });

    if (!boat) {
      return NextResponse.json(
        { error: 'Boat not found or not active' },
        { status: 404 }
      );
    }

    // Obtenir l'utilisateur connecté (optionnel)
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id || null;

    // Obtenir les informations de la requête
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get('user-agent');
    const sessionId = generateSessionId(ipAddress, userAgent);

    // Vérifier si une vue similaire existe déjà aujourd'hui pour éviter le spam
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Construire la condition de recherche pour éviter les vues dupliquées
    const whereCondition: any = {
      boatId,
      viewedAt: {
        gte: today,
        lt: tomorrow
      }
    };

    // Si l'utilisateur est connecté, vérifier par userId
    if (userId) {
      whereCondition.userId = userId;
    } else {
      // Si pas connecté, vérifier par IP ou session
      whereCondition.OR = [
        ...(ipAddress ? [{ ipAddress }] : []),
        { sessionId }
      ];
    }

    const existingView = await prisma.boat_view.findFirst({
      where: whereCondition
    });

    // Si une vue existe déjà aujourd'hui pour cet utilisateur/IP/session, ne pas créer de nouvelle vue
    if (existingView) {
      return NextResponse.json({
        success: true,
        message: 'View already recorded today',
        viewId: existingView.id
      });
    }

    // Créer la nouvelle vue
    const view = await prisma.boat_view.create({
      data: {
        boatId,
        userId,
        ipAddress,
        sessionId
      }
    });

    // Incrémenter le compteur de vues du bateau
    await prisma.boat.update({
      where: { id: boatId },
      data: { viewCount: { increment: 1 } }
    });

    return NextResponse.json({
      success: true,
      viewId: view.id
    });
  } catch (error) {
    console.error('Error recording boat view:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/boat-views?boatId=... - Obtenir les statistiques de vues d'une annonce
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boatId = searchParams.get('boatId');

    if (!boatId) {
      return NextResponse.json(
        { error: 'boatId parameter is required' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur a le droit de voir ces stats (propriétaire ou admin)
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire du bateau ou admin
    const boat = await prisma.boat.findFirst({
      where: {
        id: boatId,
        OR: [
          { userId } // Propriétaire
          // TODO: Ajouter vérification admin si nécessaire
        ]
      }
    });

    if (!boat) {
      return NextResponse.json(
        { error: 'Boat not found or access denied' },
        { status: 404 }
      );
    }

    // Obtenir les statistiques de vues
    const totalViews = await prisma.boat_view.count({
      where: { boatId }
    });

    // Vues par jour (derniers 30 jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyViews = await prisma.$queryRaw`
      SELECT
        DATE(viewed_at) as date,
        COUNT(*) as views
      FROM boat_views
      WHERE boat_id = ${boatId} AND viewed_at >= ${thirtyDaysAgo}
      GROUP BY DATE(viewed_at)
      ORDER BY DATE(viewed_at) DESC
    `;

    // Vues uniques par utilisateur (derniers 30 jours)
    const uniqueUserViewsResult = await prisma.boat_view.groupBy({
      by: ['userId'],
      where: {
        boatId,
        viewedAt: { gte: thirtyDaysAgo },
        userId: { not: null }
      }
    });
    const uniqueUserViews = uniqueUserViewsResult.length;

    return NextResponse.json({
      boatId,
      totalViews,
      uniqueUserViews,
      dailyViews
    });
  } catch (error) {
    console.error('Error fetching boat view stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
