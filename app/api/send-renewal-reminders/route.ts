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
  console.log('🔐 Vérification de l\'autorisation...');

  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CRON_SECRET_TOKEN;

  console.log('🔍 Headers présents:', Object.keys(Object.fromEntries(request.headers.entries())));
  console.log('🔍 Header Authorization présent:', !!authHeader);

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

  console.log('🔐 Token fourni:', token ? `${token.substring(0, 8)}...` : 'null');
  console.log('🔐 Token attendu:', expectedToken ? `${expectedToken.substring(0, 8)}...` : 'null');
  console.log('🔐 Token valide:', tokenValid);

  return tokenValid;
}

/**
 * GET /api/send-renewal-reminders
 * Endpoint pour déclencher manuellement l'envoi des rappels de renouvellement
 * Utilisé principalement pour les tests ou déclenchements manuels
 */
export async function GET(request: NextRequest) {
  console.log('📨 Requête GET reçue sur /api/send-renewal-reminders');
  console.log('🌐 User-Agent:', request.headers.get('user-agent'));
  console.log('🌍 IP:', request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown');

  // Vérification de l'autorisation
  if (!isAuthorized(request)) {
    console.warn('❌ Tentative d\'accès non autorisé à /api/send-renewal-reminders (GET)');
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 401 }
    );
  }

  console.log('✅ Autorisation validée pour GET');
  console.log('🔄 Déclenchement manuel des rappels de renouvellement...');

  const startTime = Date.now();

  try {
    // Exécuter la fonction de rappel des renouvellements
    console.log('🚀 Lancement de sendRenewalReminders()...');
    await sendRenewalReminders();

    const duration = Date.now() - startTime;
    console.log(`✅ Rappels traités avec succès en ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: 'Rappels de renouvellement traités avec succès',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erreur lors du traitement des rappels de renouvellement après ${duration}ms:`, error);

    return NextResponse.json(
      {
        error: 'Erreur interne du serveur',
        message: 'Une erreur est survenue lors du traitement des rappels',
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
  console.log('📨 Requête POST reçue sur /api/send-renewal-reminders');
  console.log('🌐 User-Agent:', request.headers.get('user-agent'));
  console.log('🌍 IP:', request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown');

  // Vérification de l'autorisation
  if (!isAuthorized(request)) {
    console.warn('❌ Tentative d\'accès non autorisé à /api/send-renewal-reminders (POST)');
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 401 }
    );
  }

  console.log('✅ Autorisation validée pour POST');
  console.log('⏰ Déclenchement automatique des rappels de renouvellement (cron job)...');

  const startTime = Date.now();

  try {
    // Exécuter la fonction de rappel des renouvellements
    console.log('🚀 Lancement de sendRenewalReminders()...');
    await sendRenewalReminders();

    const duration = Date.now() - startTime;
    console.log(`✅ Rappels traités avec succès en ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: 'Rappels de renouvellement traités avec succès',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erreur lors du traitement des rappels de renouvellement après ${duration}ms:`, error);

    return NextResponse.json(
      {
        error: 'Erreur interne du serveur',
        message: 'Une erreur est survenue lors du traitement des rappels',
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`
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
