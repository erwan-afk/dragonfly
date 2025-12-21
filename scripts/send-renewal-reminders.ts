#!/usr/bin/env tsx

/**
 * Script pour envoyer des rappels de renouvellement d'annonces
 * Ce script vérifie les annonces qui expirent dans 7 jours et envoie un email de renouvellement
 */

import { PrismaClient } from '@prisma/client';
import * as nodemailer from 'nodemailer';

/**
 * Script de diagnostic rapide pour vérifier la configuration
 */
async function quickDiagnostic() {
  console.log('🔍 DIAGNOSTIC RAPIDE - Vérification de la configuration');
  console.log('=' .repeat(60));

  // Vérifier les variables d'environnement
  console.log('📋 Variables d\'environnement:');
  console.log(`   SMTP_USER: ${process.env.SMTP_USER ? '✅ Défini' : '❌ Manquant'}`);
  console.log(`   SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? '✅ Défini' : '❌ Manquant'}`);
  console.log(`   NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://dragonfly-trimarans.org'}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Défini' : '❌ Manquant'}`);
  console.log('');

  // Tester la connexion à la base de données
  console.log('🗄️ Test de connexion à la base de données:');
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('   ✅ Connexion réussie');

    const boatCount = await prisma.boat.count({ where: { status: 'active' } });
    console.log(`   📊 Nombre d'annonces actives: ${boatCount}`);

    await prisma.$disconnect();
    } catch (error) {
      console.log('   ❌ Échec de connexion:', error instanceof Error ? error.message : String(error));
    }
  console.log('');

  // Tester la configuration SMTP
  console.log('📧 Test de configuration SMTP:');
  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    const transporter = nodemailer.createTransport({
      host: 'mail.infomaniak.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    try {
      await transporter.verify();
      console.log('   ✅ Configuration SMTP valide');
    } catch (error) {
      console.log('   ❌ Configuration SMTP invalide:', error instanceof Error ? error.message : String(error));
    }
  } else {
    console.log('   ❌ Variables SMTP manquantes');
  }

  console.log('=' .repeat(60));
  console.log('💡 Pour lancer le script complet: npm run tsx scripts/send-renewal-reminders.ts');
  console.log('💡 Pour mettre à jour les données existantes: npm run tsx scripts/send-renewal-reminders.ts --update-existing');
  console.log('💡 Pour tester avec une annonce expirant bientôt: npm run tsx scripts/send-renewal-reminders.ts --test-expiring-soon');
  console.log('💡 Pour tester l\'API: curl -X POST https://dragonfly-livid.vercel.app/api/send-renewal-reminders -H "Authorization: Bearer <TOKEN>"');
}

const prisma = new PrismaClient();

// Configuration SMTP (même que dans contact/route.ts)
const transporter = nodemailer.createTransport({
  host: 'mail.infomaniak.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});


/**
 * Vérifie si une date est dans un intervalle de ±12 heures autour d'une date cible
 */
function isWithinIntervalDays(targetDate: Date, checkDate: Date, days: number): boolean {
  const targetTime = targetDate.getTime();
  const checkTime = checkDate.getTime();
  const intervalMs = days * 24 * 60 * 60 * 1000; // jours en millisecondes
  const toleranceMs = 12 * 60 * 60 * 1000; // ±12 heures de tolérance

  return Math.abs(targetTime - checkTime) <= (intervalMs + toleranceMs);
}

/**
 * Formate une date en français
 */
function formatDateFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Envoie un email de renouvellement pour une annonce
 */
async function sendRenewalEmail(boat: any, expiryDate: Date) {
  const user = boat.user;
  if (!user?.email) {
    console.warn(`⚠️  Aucun email trouvé pour l'utilisateur ${user?.name || 'inconnu'} (boat ID: ${boat.id})`);
    return false;
  }

  const renewalDate = formatDateFr(expiryDate);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  console.log(`📅 Days until expiru: ${daysUntilExpiry}`);
  const mailOptions = {
    from: `"Dragonfly Trimarans" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: `🔔 Votre annonce "${boat.model}" expire bientôt - Renouvelez-la !`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e3a8a; margin: 0;">⏰ Rappel de renouvellement d'annonce</h1>
        </div>

        <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #1e3a8a; margin-top: 0;">Bonjour ${user.name || 'Cher utilisateur'},</h2>

          <p style="font-size: 16px; line-height: 1.6; margin: 20px 0;">
            Votre annonce pour le <strong>${boat.model}</strong> arrive bientôt à expiration.
          </p>

          <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px;">
            <h3 style="color: #1e3a8a; margin-top: 0;">📅 Détails de l'expiration :</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li><strong>Date d'expiration :</strong> ${renewalDate}</li>
              <li><strong>Jours restants :</strong> ${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''}</li>
              <li><strong>Prix du bateau :</strong> ${boat.price.toLocaleString('fr-FR')} €</li>
            </ul>
          </div>

          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #065f46; margin-top: 0;">🔄 Renouvelez votre annonce</h3>
            <p style="margin: 10px 0;">
              Pour continuer à recevoir des demandes d'informations sur votre bateau,
              <strong>renouvelez votre annonce dès maintenant</strong> !
            </p>

            <div style="text-align: center; margin: 25px 0;">
              <a
  href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://dragonfly-trimarans.org'}/list-boat?preference=Renewal"
  style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;"
>
  🔄 Renouveler mon annonce
</a>

            </div>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              💡 <strong>Conseil :</strong> Le renouvellement peut se faire à tout moment avant l'expiration.
              Votre annonce reste visible jusqu'à la date d'expiration.
            </p>
          </div>

          <p style="margin: 30px 0 10px 0;">
            Cordialement,<br>
            <strong>L'équipe Dragonfly Trimarans</strong>
          </p>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

        <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
          Cet email a été envoyé automatiquement par le système de Dragonfly Trimarans.<br>
          Si vous ne souhaitez plus recevoir ces rappels, vous pouvez
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://dragonfly-trimarans.org'}/account" style="color: #3b82f6;">gérer vos préférences</a>.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de renouvellement envoyé à ${user.email} pour l'annonce "${boat.model}" (expire le ${renewalDate})`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi de l'email à ${user.email}:`, error);
    return false;
  }
}

/**
 * Fonction principale qui vérifie et envoie les rappels de renouvellement
 */
async function sendRenewalReminders() {
  console.log('🚀 Démarrage de la vérification des renouvellements d\'annonces...');
  console.log(`📅 Date actuelle: ${formatDateFr(new Date())}`);

  try {
    // Vérifier la configuration SMTP
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('❌ Configuration SMTP manquante: SMTP_USER ou SMTP_PASSWORD non définis');
      throw new Error('Configuration SMTP incomplète');
    }
    console.log('✅ Configuration SMTP vérifiée');

    // Récupérer toutes les annonces actives avec les informations utilisateur et la date d'expiration
    console.log('🔍 Recherche des annonces actives...');
    const activeBoats = await prisma.boat.findMany({
      where: {
        status: 'active',
        expiresAt: {
          not: null // S'assurer que expiresAt est défini
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        payments: {
          select: {
            id: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1 // Prendre le paiement le plus récent
        }
      }
    });

    console.log(`📊 ${activeBoats.length} annonces actives trouvées`);

    if (activeBoats.length === 0) {
      console.log('ℹ️  Aucune annonce active trouvée - arrêt du processus');
      return;
    }

    const today = new Date();
    let remindersSent = 0;
    let errors = 0;
    let boatsChecked = 0;

    for (const boat of activeBoats) {
      boatsChecked++;
      console.log(`🔍 Vérification annonce ${boatsChecked}/${activeBoats.length}: "${boat.model}" (ID: ${boat.id})`);

      try {
        // Utiliser la date d'expiration stockée en base de données
        if (!boat.expiresAt) {
          console.warn(`⚠️  Aucune date d'expiration pour l'annonce ${boat.id} - ignorée`);
          errors++;
          continue;
        }

        const expiryDate = boat.expiresAt;
        console.log(`   ⏰ Date d'expiration (depuis BDD): ${formatDateFr(expiryDate)}`);

        // Calculer les jours restants
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   📊 Jours jusqu'à expiration: ${daysUntilExpiry}`);

        // Vérifier si l'annonce expire dans exactement 7 jours (±12 heures de tolérance)
        const isWithin7Days = isWithinIntervalDays(expiryDate, today, 7);
        console.log(`   🎯 Dans l'intervalle de 7 jours (±12h): ${isWithin7Days ? 'OUI' : 'NON'}`);

        if (isWithin7Days) {
          console.log(`🎯 Annonce "${boat.model}" expire le ${formatDateFr(expiryDate)} - envoi du rappel`);

          // Vérifier les informations utilisateur
          if (!boat.user) {
            console.warn(`⚠️  Aucun utilisateur associé à l'annonce ${boat.id}`);
            errors++;
            continue;
          }

          if (!boat.user.email) {
            console.warn(`⚠️  Aucun email pour l'utilisateur ${boat.user.name || 'inconnu'} (annonce ID: ${boat.id})`);
            errors++;
            continue;
          }

          console.log(`📧 Envoi d'email à: ${boat.user.email} (${boat.user.name || 'nom inconnu'})`);

          const success = await sendRenewalEmail(boat, expiryDate);
          if (success) {
            remindersSent++;
            console.log(`✅ Email envoyé avec succès pour "${boat.model}"`);
          } else {
            errors++;
            console.log(`❌ Échec de l'envoi d'email pour "${boat.model}"`);
          }

          // Petit délai pour éviter de spammer le serveur SMTP
          console.log('⏳ Pause de 1 seconde...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log(`ℹ️  Annonce "${boat.model}" hors intervalle (expiration dans ${daysUntilExpiry} jours)`);
        }
      } catch (error) {
        console.error(`❌ Erreur lors du traitement de l'annonce ${boat.id}:`, error);
        errors++;
      }
    }

    console.log(`✅ Vérification terminée: ${remindersSent} rappels envoyés, ${errors} erreurs, ${boatsChecked} annonces vérifiées`);

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des renouvellements:', error);
    process.exit(1);
  } finally {
    console.log('🔌 Déconnexion de la base de données');
    await prisma.$disconnect();
  }
}

/**
 * Met à jour les annonces existantes sans expiresAt
 */
async function updateExistingBoats() {
  console.log('🔄 Mise à jour des annonces existantes sans date d\'expiration...');

  const prisma = new PrismaClient();
  try {
    const now = new Date();
    const threeMonthsFromNow = new Date(now);
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    const result = await prisma.boat.updateMany({
      where: {
        status: 'active',
        expiresAt: null
      },
      data: {
        expiresAt: threeMonthsFromNow
      }
    });

    console.log(`✅ ${result.count} annonces mises à jour avec expiresAt = ${formatDateFr(threeMonthsFromNow)}`);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Mode test: définit une annonce pour expirer dans 7 jours pour tester les emails
 */
async function testExpiringSoon() {
  console.log('🧪 MODE TEST - Définition d\'une annonce pour expirer dans 7 jours...');

  const prisma = new PrismaClient();
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Prendre la première annonce active
    const firstBoat = await prisma.boat.findFirst({
      where: { status: 'active' },
      select: { id: true, model: true }
    });

    if (!firstBoat) {
      console.log('❌ Aucune annonce active trouvée pour le test');
      return;
    }

    await prisma.boat.update({
      where: { id: firstBoat.id },
      data: { expiresAt: sevenDaysFromNow }
    });

    console.log(`✅ Annonce "${firstBoat.model}" (ID: ${firstBoat.id}) définie pour expirer le ${formatDateFr(sevenDaysFromNow)}`);
    console.log('💡 Relancez le script normal pour tester l\'envoi d\'email');
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--diagnostic') || args.includes('-d')) {
    // Mode diagnostic rapide
    quickDiagnostic().catch(console.error);
  } else if (args.includes('--update-existing') || args.includes('-u')) {
    // Mode mise à jour des données existantes
    updateExistingBoats().catch(console.error);
  } else if (args.includes('--test-expiring-soon') || args.includes('-t')) {
    // Mode test: définir une annonce pour expirer dans 7 jours
    testExpiringSoon().catch(console.error);
  } else {
    // Mode envoi des rappels (par défaut)
    console.log('🎯 Script lancé directement - mode test/debug activé');
    console.log('💡 Les logs détaillés sont activés pour diagnostiquer les problèmes');
    console.log('🔍 Vérifiez la sortie pour identifier où le processus bloque');
    console.log('💡 Utilisez --diagnostic pour un test rapide de configuration');
    console.log('');

    sendRenewalReminders()
      .then(() => {
        console.log('');
        console.log('✅ Script terminé avec succès');
        process.exit(0);
      })
      .catch((error) => {
        console.error('');
        console.error('❌ Script terminé avec erreur:', error);
        process.exit(1);
      });
  }
}

export { sendRenewalReminders };
