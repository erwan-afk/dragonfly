'use server';

import { auth } from '@/utils/auth/auth';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getURL, getErrorRedirect, getStatusRedirect } from 'utils/helpers';
import prisma from '@/utils/prisma/client';

function isValidEmail(email: string) {
  var regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return regex.test(email);
}

export async function redirectToPath(path: string) {
  return redirect(path);
}

export async function getCurrentUser() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    return session?.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get('email')).trim();
  let redirectPath: string;

  if (!isValidEmail(email)) {
    redirectPath = getErrorRedirect(
      '/signin/email_signin',
      'Invalid email address.',
      'Please try again.'
    );
    return redirect(redirectPath);
  }

  try {
    // Better Auth ne supporte pas directement les liens magiques par défaut
    // Rediriger vers l'authentification par mot de passe
    redirectPath = getStatusRedirect(
      '/signin/password_signin',
      'Email authentication not implemented',
      'Please use password authentication or implement magic links.'
    );
  } catch (error: any) {
    redirectPath = getErrorRedirect(
      '/signin/email_signin',
      'Authentication error.',
      error.message
    );
  }

  return redirect(redirectPath);
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get('email')).trim();
  const password = String(formData.get('password')).trim();
  let redirectPath: string;

  if (!isValidEmail(email)) {
    redirectPath = getErrorRedirect(
      '/signin/password_signin',
      'Invalid email address.',
      'Please try again.'
    );
    return redirect(redirectPath);
  }

  try {
    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
      headers: await headers(),
    });

    // Better Auth renvoie directement l'utilisateur en cas de succès
    if (result && result.user) {
      redirectPath = getStatusRedirect('/account', 'Success!', 'You are now signed in.');
    } else {
      redirectPath = getErrorRedirect(
        '/signin/password_signin',
        'Sign in failed.',
        'Invalid credentials.'
      );
    }
  } catch (error: any) {
    redirectPath = getErrorRedirect(
      '/signin/password_signin',
      'Sign in failed.',
      error.message || 'An error occurred during sign in.'
    );
  }

  return redirect(redirectPath);
}

export async function signUp(formData: FormData) {
  const email = String(formData.get('email')).trim();
  const password = String(formData.get('password')).trim();
  const name = String(formData.get('name')).trim() || email.split('@')[0];
  let redirectPath: string;

  console.log('🔍 SignUp started for email:', email);

  if (!isValidEmail(email)) {
    console.log('❌ Invalid email format');
    redirectPath = getErrorRedirect(
      '/signin/signup',
      'Invalid email address.',
      'Please try again.'
    );
    return redirect(redirectPath);
  }

  try {
    console.log('🔍 Creating account...');
    // 1. Créer le compte
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
      headers: await headers(), // Inclure les headers
    });

    console.log('✅ SignUp result:', signUpResult ? 'Success' : 'Failed');

    if (!signUpResult || !signUpResult.user) {
      console.log('❌ SignUp failed - no user returned');
      redirectPath = getErrorRedirect(
        '/signin/signup',
        'Sign up failed.',
        'Unable to create account.'
      );
      return redirect(redirectPath);
    }

    console.log('✅ Account created successfully!');
    
    // 2. Connecter automatiquement l'utilisateur après la création du compte
    try {
      console.log('🔍 Auto-signing in user...');
      const signInResult = await auth.api.signInEmail({
        body: {
          email,
          password,
        },
        headers: await headers(),
      });

      if (signInResult && signInResult.user) {
        console.log('✅ Auto-signin successful! Redirecting to account...');
        redirectPath = getStatusRedirect(
          '/account',
          'Welcome!',
          'Your account has been created successfully and you are now signed in.'
        );
      } else {
        console.log('⚠️ Auto-signin failed, redirecting to signin page');
        redirectPath = getStatusRedirect(
          '/signin/password_signin',
          'Account created successfully!',
          'Please sign in with your new credentials to access your account.'
        );
      }
    } catch (signInError: any) {
      console.log('⚠️ Auto-signin error:', signInError.message);
      // Si la connexion automatique échoue, rediriger vers signin
      redirectPath = getStatusRedirect(
        '/signin/password_signin',
        'Account created successfully!',
        'Please sign in with your new credentials to access your account.'
      );
    }

    console.log('🔍 Redirect path:', redirectPath);
  } catch (error: any) {
    console.log('❌ SignUp error:', error.message);
    redirectPath = getErrorRedirect(
      '/signin/signup',
      'Sign up failed.',
      error.message || 'An error occurred during sign up.'
    );
  }

  console.log('🔍 Final redirect to:', redirectPath);
  return redirect(redirectPath);
}

export async function signOut() {
  try {
    await auth.api.signOut({
      headers: await headers()
    });
    redirect('/signin');
  } catch (error) {
    console.error('Error signing out:', error);
    redirect('/signin');
  }
}

export async function resetPassword(formData: FormData) {
  const email = String(formData.get('email')).trim();
  let redirectPath: string;

  if (!isValidEmail(email)) {
    redirectPath = getErrorRedirect(
      '/signin/forgot_password',
      'Invalid email address.',
      'Please try again.'
    );
    return redirect(redirectPath);
  }

  try {
    // Implémenter la logique de réinitialisation du mot de passe avec Better Auth
    redirectPath = getStatusRedirect(
      '/signin/forgot_password',
      'Password reset not implemented',
      'Please implement password reset functionality.'
    );
  } catch (error: any) {
    redirectPath = getErrorRedirect(
      '/signin/forgot_password',
      'Reset password failed.',
      error.message
    );
  }

  return redirect(redirectPath);
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get('password')).trim();
  let redirectPath: string;

  try {
    // Implémenter la logique de mise à jour du mot de passe avec Better Auth
    redirectPath = getStatusRedirect(
      '/account',
      'Password update not implemented',
      'Please implement password update functionality.'
    );
  } catch (error: any) {
    redirectPath = getErrorRedirect(
      '/signin/update_password',
      'Update password failed.',
      error.message
    );
  }

  return redirect(redirectPath);
}

export async function updateEmail(formData: FormData) {
  const newEmail = String(formData.get('newEmail')).trim();
  let redirectPath: string;

  // Vérifier que l'e-mail est valide
  if (!isValidEmail(newEmail)) {
    redirectPath = getErrorRedirect(
      '/account',
      'Your email could not be updated.',
      'Invalid email address.'
    );
    return redirect(redirectPath);
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      redirectPath = getErrorRedirect(
        '/account',
        'You could not be updated.',
        'You are not signed in.'
      );
      return redirect(redirectPath);
    }

    // Mettre à jour l'e-mail dans la base de données avec Prisma
    await prisma.user.update({
      where: { id: user.id },
      data: { email: newEmail }
    });

    redirectPath = getStatusRedirect(
      '/account',
      'Success!',
      'Your email has been updated.'
    );
  } catch (error: any) {
    redirectPath = getErrorRedirect(
      '/account',
      'Your email could not be updated.',
      error.message
    );
  }

  return redirect(redirectPath);
}

export async function updateName(formData: FormData) {
  const name = String(formData.get('name')).trim();
  let redirectPath: string;

  try {
    const user = await getCurrentUser();
    if (!user) {
      redirectPath = getErrorRedirect(
        '/account',
        'You could not be updated.',
        'You are not signed in.'
      );
      return redirect(redirectPath);
    }

    // Mettre à jour le nom dans la base de données avec Prisma
    await prisma.user.update({
      where: { id: user.id },
      data: { name }
    });

    redirectPath = getStatusRedirect(
      '/account',
      'Success!',
      'Your name has been updated.'
    );
  } catch (error: any) {
    redirectPath = getErrorRedirect(
      '/account',
      'Your name could not be updated.',
      error.message
    );
  }

  return redirect(redirectPath);
}

export async function updateListing(formData: FormData): Promise<string> {
  const id = String(formData.get('id')).trim();
  const model = String(formData.get('model')).trim();
  const description = String(formData.get('description')).trim();
  const country = String(formData.get('country')).trim();
  const price = String(formData.get('price')).trim();
  const currency = String(formData.get('currency')).trim();
  const specifications = String(formData.get('specifications')).trim();
  const vat_paid = String(formData.get('vat_paid')).trim();
  const photos = String(formData.get('photos')).trim();

  try {
    const user = await getCurrentUser();
    if (!user) {
      return getErrorRedirect(
        '/account',
        'You could not be updated.',
        'You are not signed in.'
      );
    }

    // Update the listing with Prisma
    await prisma.boat.update({
      where: { id: id },
      data: {
        model,
        description,
        country,
        price: parseFloat(price),
        currency,
        specifications: JSON.parse(specifications),
        vatPaid: vat_paid === 'true',
        photos: photos.split(',').filter(Boolean),
        updatedAt: new Date()
      }
    });

    return getStatusRedirect(
      '/account',
      'Success!',
      'Your listing has been updated.'
    );
  } catch (error: any) {
    return getErrorRedirect(
      '/account',
      'Your listing could not be updated.',
      error.message || 'An unexpected error occurred.'
    );
  }
}