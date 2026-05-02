'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  OAuthAccountNotLinked: {
    title: 'Compte déjà existant',
    description:
      'Un compte avec cette adresse email existe déjà avec un autre mode de connexion. Connectez-vous avec la méthode utilisée lors de la création de votre compte.',
  },
  OAuthCallbackError: {
    title: 'Erreur de connexion OAuth',
    description:
      "La connexion via le fournisseur tiers a échoué. Veuillez réessayer ou utiliser une autre méthode de connexion.",
  },
  EmailNotVerified: {
    title: 'Email non vérifié',
    description:
      "Votre adresse email n'a pas encore été vérifiée. Veuillez consulter votre boîte de réception.",
  },
  AccessDenied: {
    title: 'Accès refusé',
    description: "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource.",
  },
  UserNotFound: {
    title: 'Utilisateur introuvable',
    description: "Aucun compte n'est associé à ces informations. Vérifiez vos identifiants ou créez un compte.",
  },
  CredentialsSignin: {
    title: 'Identifiants incorrects',
    description: "L'adresse email ou le mot de passe est incorrect. Veuillez réessayer.",
  },
  SessionExpired: {
    title: 'Session expirée',
    description: 'Votre session a expiré. Veuillez vous reconnecter.',
  },
};

const DEFAULT_ERROR = {
  title: 'Une erreur est survenue',
  description:
    "Une erreur inattendue s'est produite lors de l'authentification. Veuillez réessayer.",
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error') ?? '';
  const error = ERROR_MESSAGES[errorCode] ?? DEFAULT_ERROR;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md text-center">
        <div className="mb-4 flex justify-center">
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 text-3xl">
            ⚠️
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{error.title}</h1>
        {errorCode && (
          <p className="text-xs text-gray-400 mb-3 font-mono">{errorCode}</p>
        )}
        <p className="text-gray-600 mb-8">{error.description}</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/signin"
            className="w-full rounded-lg bg-blue-900 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
          >
            Retour à la connexion
          </Link>
          <Link
            href="/"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorContent />
    </Suspense>
  );
}
