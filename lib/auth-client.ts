'use client';

import { createAuthClient } from "better-auth/react";

console.log('🔍 Initializing Better Auth client...');
console.log('📍 Base URL:', process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000');

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000',
});

console.log('✅ Better Auth client initialized');

export const { 
  signIn, 
  signUp, 
  signOut, 
  useSession,
  getSession 
} = authClient;

console.log('📤 Better Auth client methods exported:', { 
  signIn: !!signIn, 
  signUp: !!signUp, 
  signOut: !!signOut, 
  useSession: !!useSession, 
  getSession: !!getSession,
  'signIn.social': !!signIn?.social
});
