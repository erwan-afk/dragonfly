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
    console.error('❌ CRON_SECRET_TOKEN non configuré dans les variables d\'environnement');
    return false;
  }

  if (!authHeader) {
    console.error('❌ Header Authorization manquant dans la requête');
    return false;
  }

  if (!authHeader.startsWith('Bearer ')) {
    console.error('❌ Header Authorization ne commence pas par "Bearer "');
    return false;
  }

  const token = authHeader.replace('Bearer ', '');
  const tokenValid = token === expectedToken;

  return tokenValid;
}

/**
 * GET /api/send-renewal-reminders
 * Endpoint pour déclencher manuellement l'envoi des rappels de renouvellement
 * Utilisé principalement pour les tests ou déclenchements manuels
 */
export async function GET(request: NextRequest) {
  // Vérification de l'autorisation
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const startTime = Date.now();

  try {
    // Exécuter la fonction de rappel des renouvellements
    await sendRenewalReminders();

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Renewal reminders processed successfully',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erreur lors du traitement des rappels de renouvellement après ${duration}ms:`, error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An error occurred while processing renewal reminders',
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`
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
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const startTime = Date.now();

  try {
    // Exécuter la fonction de rappel des renouvellements
    await sendRenewalReminders();

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Renewal reminders processed successfully',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erreur lors du traitement des rappels de renouvellement après ${duration}ms:`, error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An error occurred while processing renewal reminders',
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`
      },
      { status: 500 }
    );
  }
}

// Bloquer les autres méthodes HTTP
export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
