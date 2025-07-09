'use server';

import prisma from '@/utils/prisma/client';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function signUpDirect(email: string, password: string, name: string) {
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return { success: false, error: 'User already exists' };
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur avec SQL brut pour éviter les conflits de nommage
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    await prisma.$executeRaw`
      INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at, role)
      VALUES (${userId}, ${name}, ${email}, false, NOW(), NOW(), 'user')
    `;
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, error: 'Failed to create user' };
    }

    // Créer un compte avec le mot de passe hashé
    await prisma.account.create({
      data: {
        user_id: user.id,
        account_id: user.id,
        provider_id: 'email',
        password: hashedPassword,
        created_at: new Date(),
        updated_at: new Date(),
      }
    });

    // Créer une session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    await prisma.session.create({
      data: {
        id: generateSessionId(),
        user_id: user.id,
        token: sessionToken,
        expires_at: expiresAt,
        created_at: new Date(),
        updated_at: new Date(),
      }
    });

    // Définir le cookie de session
    const cookieStore = cookies();
    cookieStore.set('auth_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 jours
    });

    return { success: true, user };
  } catch (error) {
    console.error('SignUp error:', error);
    return { success: false, error: 'Failed to create account' };
  }
}

export async function signInDirect(email: string, password: string) {
  try {
    // Trouver l'utilisateur et son compte
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    const account = await prisma.account.findFirst({
      where: {
        user_id: user.id,
        provider_id: 'email'
      }
    });

    if (!account) {
      return { success: false, error: 'Invalid credentials' };
    }
    if (!account.password) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Vérifier le mot de passe
    const isValid = await bcrypt.compare(password, account.password);
    if (!isValid) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Créer une session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    await prisma.session.create({
      data: {
        id: generateSessionId(),
        user_id: user.id,
        token: sessionToken,
        expires_at: expiresAt,
        created_at: new Date(),
        updated_at: new Date(),
      }
    });

    // Définir le cookie de session
    const cookieStore = cookies();
    cookieStore.set('auth_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 jours
    });

    return { success: true, user };
  } catch (error) {
    console.error('SignIn error:', error);
    return { success: false, error: 'Failed to sign in' };
  }
}

export async function getCurrentUserDirect() {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('auth_session')?.value;

    if (!sessionToken) {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    if (!session || session.expires_at < new Date()) {
      return null;
    }

    return session.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

function generateSessionToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
} 