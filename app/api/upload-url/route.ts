import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';
import { generateTempUploadSignedUrl, generateFinalUploadSignedUrl } from '@/utils/cloudflare/r2';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Body = {
  sessionId?: string;
  boatId?: string;
  filename: string;
  contentType: string;
  size?: number;
  isEdit?: boolean;
};

function sanitizeFilename(filename: string) {
  // Keep only safe characters, prevent path traversal.
  const base = filename.split('/').pop()?.split('\\').pop() || 'image';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as Body;
    const sessionId = body.sessionId ? String(body.sessionId) : undefined;
    const boatId = body.boatId ? String(body.boatId) : undefined;
    const filename = sanitizeFilename(String(body.filename || 'image'));
    const contentType = String(body.contentType || '');
    const size = typeof body.size === 'number' ? body.size : undefined;
    const isEdit = Boolean(body.isEdit);

    // Validation des paramètres selon le mode
    if (isEdit) {
      if (!boatId) {
        return NextResponse.json(
          { error: 'boatId is required for edit mode' },
          { status: 400 }
        );
      }
    } else {
      if (!sessionId || !sessionId.startsWith('session_')) {
        return NextResponse.json(
          { error: 'Invalid sessionId' },
          { status: 400 }
        );
      }
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG and WebP images are allowed' },
        { status: 400 }
      );
    }

    // Soft guard (client-provided size; still useful to avoid signing huge uploads).
    const maxSize = 15 * 1024 * 1024; // 15MB
    if (size && size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 15MB' },
        { status: 400 }
      );
    }

    const result = isEdit
      ? await generateFinalUploadSignedUrl(
          boatId!,
          filename,
          contentType,
          300
        )
      : await generateTempUploadSignedUrl(
          sessionId!,
          session.user.id,
          filename,
          contentType,
          300
        );

    if (!result.success || !result.url || !result.key) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate upload URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key
    });
  } catch (error) {
    console.error('Upload-url error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload-url failed' },
      { status: 500 }
    );
  }
}


