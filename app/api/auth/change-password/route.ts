import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/utils/auth/auth';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    try {
      // Use Better Auth's changePassword method
      const result = await auth.api.changePassword({
        body: {
          currentPassword,
          newPassword,
          revokeOtherSessions: false, // Keep other sessions active
        },
        headers: await headers()
      });

      if (!result) {
        return NextResponse.json(
          { error: 'Failed to change password' },
          { status: 400 }
        );
      }

      console.log(`✅ Password changed successfully for user: ${session.user.id}`);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Password changed successfully' 
      });

    } catch (authError: any) {
      console.error('❌ Better Auth error:', authError);
      
      // Handle specific Better Auth errors
      if (authError.message?.includes('current password')) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to change password. Please try again.' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Error changing password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 