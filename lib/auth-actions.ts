'use client';

import { authClient } from './auth-client';
import { getURL } from '@/utils/helpers';
import { redirectToPath } from '@/utils/auth-helpers/server';  // Ajustez le chemin si nécessaire
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export async function handleRequest(
  e: React.FormEvent<HTMLFormElement>,
  requestFunc: (formData: FormData) => Promise<string>,
  router: AppRouterInstance | null = null
): Promise<{ success: boolean; error?: string }> {
  e.preventDefault();

  try {
    const formData = new FormData(e.currentTarget);
    const redirectUrl: string = await requestFunc(formData);

    if (router) {
      router.push(redirectUrl);
    } else {
      await redirectToPath(redirectUrl);
    }

    return { success: true };
  } catch (err) {
    console.error("Error in handleRequest:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function signInWithOAuth(
  e: React.FormEvent<HTMLFormElement>
): Promise<{ success: boolean; error?: string }> {
  e.preventDefault();
  
  try {
    const formData = new FormData(e.currentTarget);
    const provider = String(formData.get('provider')).trim();

    // Utilisation de Better-Auth pour OAuth
    const { data, error } = await authClient.signIn.social({
      provider: provider as 'google' | 'github',
      callbackURL: getURL('/auth/callback')
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error in signInWithOAuth:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function signInWithEmail(
  email: string, 
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await authClient.signIn.email({
      email,
      password
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error in signInWithEmail:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function signUpWithEmail(
  email: string, 
  password: string, 
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name,
      callbackURL: getURL('/auth/callback')
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error in signUpWithEmail:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function signOutUser(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await authClient.signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error in signOut:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
