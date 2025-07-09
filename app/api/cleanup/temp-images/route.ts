import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { 
  cleanupOldTempImages, 
  deleteAllTempImages, 
  deleteTempSessionImages,
  listTempImages 
} from '@/utils/cloudflare/r2';

export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification (optionnel - vous pouvez retirer cette partie pour un cron job)
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, sessionId, hoursOld } = await req.json();

    switch (action) {
      case 'cleanup-old':
        const hours = hoursOld || 2; // Par défaut 2 heures
        const result = await cleanupOldTempImages(hours);
        
        return NextResponse.json({
          success: true,
          message: `Temp images cleanup completed`,
          result
        });

      case 'delete-session':
        if (!sessionId) {
          return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
        }
        
        const sessionResult = await deleteTempSessionImages(sessionId);
        
        return NextResponse.json({
          success: sessionResult,
          message: sessionResult 
            ? `Temp images for session ${sessionId} deleted successfully` 
            : `Failed to delete temp images for session ${sessionId}`
        });

      case 'delete-all':
        const deleteResult = await deleteAllTempImages();
        
        return NextResponse.json({
          success: true,
          message: `All temp images cleanup completed`,
          result: deleteResult
        });

      case 'list':
        const tempImages = await listTempImages();
        
        return NextResponse.json({
          success: true,
          totalFound: tempImages.length,
          tempImages
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in temp images cleanup:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cleanup failed' },
      { status: 500 }
    );
  }
}

// GET pour lister les images temporaires
export async function GET() {
  try {
    const tempImages = await listTempImages();
    
    return NextResponse.json({
      success: true,
      totalFound: tempImages.length,
      tempImages
    });
  } catch (error) {
    console.error('Error listing temp images:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list temp images' },
      { status: 500 }
    );
  }
} 