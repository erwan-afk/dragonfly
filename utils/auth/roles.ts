import { auth } from './auth';
import { headers } from 'next/headers';

export type Role = 'user' | 'admin' | 'superAdmin';

export async function getCurrentUserRole(): Promise<Role | null> {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session?.user) {
    return null;
  }

  return (session.user as any).role || 'user';
}

export async function isAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === 'admin' || role === 'superAdmin';
}

export async function isSuperAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === 'superAdmin';
}

export async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error('Unauthorized: Admin access required');
  }
}

export async function requireSuperAdmin() {
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    throw new Error('Unauthorized: Super Admin access required');
  }
}
