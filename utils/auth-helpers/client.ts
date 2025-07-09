'use client';

import { authClient } from '@/lib/auth-client';
import { getURL } from '@/utils/helpers';
import { redirectToPath } from './server';
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
    const provider = String(formData.get('provider')).trim() as 'google' | 'github' | 'discord';

    // Utilisation de Better-Auth pour OAuth
    const result = await authClient.signIn.social({
      provider: provider,
      callbackURL: getURL('/auth/callback')
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error in signInWithOAuth:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// Nouvelles fonctions utiles
export async function signInWithEmail(
  email: string, 
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await authClient.signIn.email({
      email,
      password
    });

    if (result.error) {
      return { success: false, error: result.error.message };
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
    // Créer le compte avec Better Auth
    const signUpResult = await authClient.signUp.email({
      email,
      password,
      name
    });

    if (signUpResult.error) {
      console.error("SignUp error:", signUpResult.error);
      return { success: false, error: signUpResult.error.message || 'Sign up failed' };
    }

    // Après inscription réussie, connecter automatiquement l'utilisateur
    const signInResult = await authClient.signIn.email({
      email,
      password
    });

    if (signInResult.error) {
      console.error("Auto sign-in error:", signInResult.error);
      // L'inscription a réussi mais la connexion automatique a échoué
      return { success: false, error: 'Account created but auto sign-in failed. Please sign in manually.' };
    }

    return { success: true };
  } catch (err) {
    console.error("Error in signUpWithEmail:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
