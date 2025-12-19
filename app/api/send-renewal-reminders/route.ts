import { NextRequest, NextResponse } from 'next/server';
import { sendRenewalReminders } from '../../../scripts/send-renewal-reminders';

// Force dynamic rendering pour les tâches de fond
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes maximum pour les tâches longues

/**
 * Vérifie si la requête est autorisée (token secret partagé)
 */
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET_TOKEN;

  if (!expectedToken) {
    console.error('❌ CRON_SECRET_TOKEN non configuré');
    return false;
  }

  if (!authHeader) {
    console.error('❌ Header Authorization manquant');
    return false;
  }

  const token = authHeader.replace('Bearer ', '');
  return token === expectedToken;
}

/**
 * GET /api/send-renewal-reminders
 * Endpoint pour déclencher manuellement l'envoi des rappels de renouvellement
 * Utilisé principalement pour les tests ou déclenchements manuels
 */
export async function GET(request: NextRequest) {
  // Vérification de l'autorisation
  if (!isAuthorized(request)) {
    console.warn('❌ Tentative d\'accès non autorisé à /api/send-renewal-reminders');
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 401 }
    );
  }

  console.log('🔄 Déclenchement manuel des rappels de renouvellement...');

  try {
    // Exécuter la fonction de rappel des renouvellements
    await sendRenewalReminders();

    return NextResponse.json({
      success: true,
      message: 'Rappels de renouvellement traités avec succès',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur lors du traitement des rappels de renouvellement:', error);

    return NextResponse.json(
      {
        error: 'Erreur interne du serveur',
        message: 'Une erreur est survenue lors du traitement des rappels'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/send-renewal-reminders
 * Endpoint principal pour les cron jobs automatiques
 * Identique à GET mais avec une méthode POST pour une meilleure sémantique
 */
export async function POST(request: NextRequest) {
  // Vérification de l'autorisation
  if (!isAuthorized(request)) {
    console.warn('❌ Tentative d\'accès non autorisé à /api/send-renewal-reminders');
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 401 }
    );
  }

  console.log('⏰ Déclenchement automatique des rappels de renouvellement (cron job)...');

  try {
    // Exécuter la fonction de rappel des renouvellements
    await sendRenewalReminders();

    return NextResponse.json({
      success: true,
      message: 'Rappels de renouvellement traités avec succès',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur lors du traitement des rappels de renouvellement:', error);

    return NextResponse.json(
      {
        error: 'Erreur interne du serveur',
        message: 'Une erreur est survenue lors du traitement des rappels'
      },
      { status: 500 }
    );
  }
}

// Bloquer les autres méthodes HTTP
export async function PUT() {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 });
}
