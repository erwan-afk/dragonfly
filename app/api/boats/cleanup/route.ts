import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { emergencyCleanup, getBoatsByStatus } from '@/utils/boats/status';

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, boatId, reason } = await request.json();

        if (action === 'emergency_cleanup' && boatId) {
            // Nettoyage d'urgence d'un bateau spécifique
            const result = await emergencyCleanup(boatId, reason || 'Manual cleanup');

            return NextResponse.json({
                success: true,
                result,
                message: `Emergency cleanup ${result.success ? 'successful' : 'failed'}`
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('❌ Error in cleanup API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as 'pending' | 'active' | 'inactive' | 'deleted';

        if (!status) {
            return NextResponse.json({ error: 'Status parameter required' }, { status: 400 });
        }

        const boats = await getBoatsByStatus(status);

        return NextResponse.json({
            success: true,
            boats,
            count: boats.length
        });

    } catch (error) {
        console.error('❌ Error fetching boats by status:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 