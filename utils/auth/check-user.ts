import { auth } from './auth';
import { headers } from 'next/headers';
import prisma from '@/utils/prisma/client';

export type UserCheck = {
  isAuthenticated: boolean;
  isBanned: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
};

/**
 * Check user authentication, ban status, and role
 * Use this in server components and API routes
 */
export async function checkUser(): Promise<UserCheck> {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    return {
      isAuthenticated: false,
      isBanned: false,
      isAdmin: false,
      isSuperAdmin: false,
      user: null
    };
  }

  // Get fresh user data from database (including ban status)
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      banned: true,
      ban_reason: true,
      ban_expires: true
    }
  });

  if (!dbUser) {
    return {
      isAuthenticated: false,
      isBanned: false,
      isAdmin: false,
      isSuperAdmin: false,
      user: null
    };
  }

  // Check if ban has expired
  const isBanned = dbUser.banned === true &&
    (!dbUser.ban_expires || new Date(dbUser.ban_expires) > new Date());

  return {
    isAuthenticated: true,
    isBanned,
    isAdmin: dbUser.role === 'admin' || dbUser.role === 'superAdmin',
    isSuperAdmin: dbUser.role === 'superAdmin',
    user: {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role
    }
  };
}

/**
 * Require authenticated non-banned user
 * Throws error if not authenticated or banned
 */
export async function requireAuth(): Promise<UserCheck> {
  const check = await checkUser();

  if (!check.isAuthenticated) {
    throw new Error('Authentication required');
  }

  if (check.isBanned) {
    throw new Error('Account is banned');
  }

  return check;
}

/**
 * Require admin role
 * Throws error if not admin or banned
 */
export async function requireAdmin(): Promise<UserCheck> {
  const check = await requireAuth();

  if (!check.isAdmin) {
    throw new Error('Admin access required');
  }

  return check;
}

/**
 * Require super admin role
 * Throws error if not super admin or banned
 */
export async function requireSuperAdmin(): Promise<UserCheck> {
  const check = await requireAuth();

  if (!check.isSuperAdmin) {
    throw new Error('Super Admin access required');
  }

  return check;
}
