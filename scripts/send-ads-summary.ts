#!/usr/bin/env tsx

/**
 * Script pour envoyer un récapitulatif des annonces actives aux propriétaires
 * Ce script envoie un email récapitulatif des annonces de chaque utilisateur
 */

import { PrismaClient } from '@prisma/client';
import * as nodemailer from 'nodemailer';

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
 * Formate un prix en euros
 */
function formatPrice(price: any): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(Number(price));
}

/**
 * Envoie un email de récapitulatif des annonces à un utilisateur
 */
async function sendAdsSummaryEmail(user: any, boats: any[]) {
  if (!user?.email) {
    console.warn(`⚠️ Aucun email trouvé pour l'utilisateur ${user?.name || 'inconnu'}`);
    return false;
  }

  const totalValue = boats.reduce((sum, boat) => sum + Number(boat.price), 0);
  const activeBoats = boats.filter(boat => boat.status === 'active');
  const expiringSoon = boats.filter(boat => {
    if (!boat.expires_at) return false;
    const daysUntilExpiry = Math.ceil((new Date(boat.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  const mailOptions = {
    from: `"Dragonfly Trimarans" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: `📊 Récapitulatif de vos annonces - ${activeBoats.length} annonce${activeBoats.length > 1 ? 's' : ''} active${activeBoats.length > 1 ? 's' : ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e3a8a; margin: 0;">📊 Récapitulatif de vos annonces</h1>
          <p style="color: #6b7280; margin: 10px 0;">Mis à jour le ${formatDateFr(new Date())}</p>
        </div>

        <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #1e3a8a; margin-top: 0;">Bonjour ${user.name || 'Cher utilisateur'},</h2>

          <p style="font-size: 16px; line-height: 1.6; margin: 20px 0;">
            Voici un récapitulatif de vos annonces sur Dragonfly Trimarans :
          </p>

          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="color: #1e3a8a; margin-top: 0;">📈 Statistiques générales</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li><strong>Annonces actives :</strong> ${activeBoats.length}</li>
              <li><strong>Valeur totale :</strong> ${formatPrice(totalValue)}</li>
              <li><strong>Expirant bientôt :</strong> ${expiringSoon.length} annonce${expiringSoon.length > 1 ? 's' : ''}</li>
            </ul>
          </div>

          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e3a8a; margin-top: 0;">🚤 Vos annonces détaillées</h3>
            ${boats.map((boat, index) => `
              <div style="border-bottom: 1px solid #e5e7eb; padding: 15px 0; ${index === 0 ? 'border-top: none;' : ''}">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div style="flex: 1;">
                    <h4 style="margin: 0 0 5px 0; color: #1e3a8a;">${boat.model}</h4>
                    <p style="margin: 5px 0; color: #374151;"><strong>Prix :</strong> ${formatPrice(boat.price)}</p>
                    <p style="margin: 5px 0; color: #374151;"><strong>Statut :</strong>
                      <span style="padding: 2px 8px; border-radius: 12px; font-size: 12px; ${
                        boat.status === 'active'
                          ? 'background-color: #dcfce7; color: #166534;'
                          : 'background-color: #fee2e2; color: #991b1b;'
                      }">
                        ${boat.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                    ${boat.expires_at ? `
                      <p style="margin: 5px 0; color: #374151;">
                        <strong>Expire le :</strong> ${formatDateFr(new Date(boat.expires_at))}
                        ${(() => {
                          const daysUntilExpiry = Math.ceil((new Date(boat.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
                            return `<span style="color: #f59e0b; font-weight: bold;">(${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''})</span>`;
                          } else if (daysUntilExpiry <= 0) {
                            return `<span style="color: #ef4444; font-weight: bold;">(Expiré)</span>`;
                          }
                          return '';
                        })()}
                      </p>
                    ` : ''}
                  </div>
                  ${boat.photos && boat.photos.length > 0 ? `
                    <div style="margin-left: 15px;">
                      <img src="${boat.photos[0]}" alt="${boat.model}" style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #e5e7eb;">
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>

          ${expiringSoon.length > 0 ? `
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">⚠️ Annonces expirant bientôt</h3>
              <p style="color: #92400e; margin: 10px 0;">
                ${expiringSoon.length} de vos annonces expire${expiringSoon.length > 1 ? 'nt' : ''} dans moins de 30 jours.
                Pensez à les renouveler pour continuer à recevoir des demandes.
              </p>
              <div style="text-align: center; margin: 15px 0;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://dragonfly-trimarans.org'}/pricing"
                   style="background-color: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  🔄 Voir les options de renouvellement
                </a>
              </div>
            </div>
          ` : ''}

          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #065f46; margin-top: 0;">💡 Conseils pour vos annonces</h3>
            <ul style="color: #065f46; margin: 10px 0; padding-left: 20px;">
              <li>Une annonce avec des photos de qualité reçoit 3x plus de demandes</li>
              <li>Un prix réaliste et une description détaillée améliorent les conversions</li>
              <li>Les annonces renouvelées régulièrement restent visibles plus longtemps</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://dragonfly-trimarans.org'}/account"
               style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              📋 Gérer mes annonces
            </a>
          </div>

          <p style="margin: 30px 0 10px 0;">
            Cordialement,<br>
            <strong>L'équipe Dragonfly Trimarans</strong>
          </p>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

        <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
          Cet email a été envoyé automatiquement par le système de Dragonfly Trimarans.<br>
          Si vous ne souhaitez plus recevoir ces récapitulatifs, vous pouvez
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://dragonfly-trimarans.org'}/account" style="color: #3b82f6;">gérer vos préférences</a>.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de récapitulatif envoyé à ${user.email} (${boats.length} annonce${boats.length > 1 ? 's' : ''})`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de l'envoi de l'email à ${user.email}:`, error);
    return false;
  }
}

/**
 * Fonction principale qui envoie les récapitulatifs des annonces
 */
async function sendAdsSummary() {
  console.log('🚀 Démarrage de l\'envoi des récapitulatifs d\'annonces...');
  console.log(`📅 Date actuelle: ${formatDateFr(new Date())}`);

  try {
    // Vérifier la configuration SMTP
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('❌ Configuration SMTP manquante: SMTP_USER ou SMTP_PASSWORD non définis');
      throw new Error('Configuration SMTP incomplète');
    }
    console.log('✅ Configuration SMTP vérifiée');

    // Récupérer toutes les annonces avec les informations utilisateur
    console.log('🔍 Recherche de toutes les annonces...');
    const allBoats = await prisma.boat.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`📊 ${allBoats.length} annonces trouvées au total`);

    if (allBoats.length === 0) {
      console.log('ℹ️  Aucune annonce trouvée - arrêt du processus');
      return;
    }

    // Grouper les annonces par utilisateur
    const boatsByUser = new Map();
    for (const boat of allBoats) {
      if (!boat.user) continue;

      const userId = boat.user.id;
      if (!boatsByUser.has(userId)) {
        boatsByUser.set(userId, {
          user: boat.user,
          boats: []
        });
      }
      boatsByUser.get(userId).boats.push(boat);
    }

    console.log(`👥 ${boatsByUser.size} utilisateur${boatsByUser.size > 1 ? 's' : ''} avec des annonces trouvé${boatsByUser.size > 1 ? 's' : ''}`);

    let emailsSent = 0;
    let errors = 0;

    // Envoyer un email à chaque utilisateur
    for (const [userId, userData] of boatsByUser) {
      console.log(`📧 Envoi du récapitulatif à ${userData.user.email} (${userData.boats.length} annonce${userData.boats.length > 1 ? 's' : ''})...`);

      const success = await sendAdsSummaryEmail(userData.user, userData.boats);
      if (success) {
        emailsSent++;
      } else {
        errors++;
      }

      // Petit délai pour éviter de spammer le serveur SMTP
      console.log('⏳ Pause de 2 secondes...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`✅ Envoi terminé: ${emailsSent} récapitulatifs envoyés, ${errors} erreurs`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi des récapitulatifs:', error);
    process.exit(1);
  } finally {
    console.log('🔌 Déconnexion de la base de données');
    await prisma.$disconnect();
  }
}

/**
 * Mode test: envoie un récapitulatif à un utilisateur spécifique
 */
async function sendTestSummary(userEmail?: string) {
  console.log('🧪 MODE TEST - Envoi d\'un récapitulatif de test...');

  try {
    let targetUser;

    if (userEmail) {
      // Chercher l'utilisateur par email
      targetUser = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true, name: true, email: true }
      });

      if (!targetUser) {
        console.log(`❌ Utilisateur avec l'email ${userEmail} non trouvé`);
        return;
      }
    } else {
      // Prendre le premier utilisateur qui a des annonces
      const userWithBoats = await prisma.boat.findFirst({
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (!userWithBoats?.user) {
        console.log('❌ Aucun utilisateur avec des annonces trouvé');
        return;
      }

      targetUser = userWithBoats.user;
    }

    // Récupérer toutes les annonces de cet utilisateur
    const userBoats = await prisma.boat.findMany({
      where: { userId: targetUser.id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    console.log(`📧 Envoi d'un récapitulatif de test à ${targetUser.email} (${userBoats.length} annonce${userBoats.length > 1 ? 's' : ''})`);

    const success = await sendAdsSummaryEmail(targetUser, userBoats);
    if (success) {
      console.log('✅ Email de test envoyé avec succès');
    } else {
      console.log('❌ Échec de l\'envoi du email de test');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--test') || args.includes('-t')) {
    // Mode test: envoyer à un utilisateur spécifique ou au premier trouvé
    const emailArg = args.find(arg => arg.startsWith('--email='));
    const email = emailArg ? emailArg.split('=')[1] : undefined;
    sendTestSummary(email).catch(console.error);
  } else {
    // Mode envoi à tous les utilisateurs
    console.log('🎯 Script lancé directement - mode envoi des récapitulatifs');
    console.log('💡 Les logs détaillés sont activés pour diagnostiquer les problèmes');
    console.log('💡 Utilisez --test pour envoyer un email de test à un utilisateur');
    console.log('💡 Utilisez --test --email=user@example.com pour tester avec un email spécifique');
    console.log('');

    sendAdsSummary()
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

export { sendAdsSummary };
