#!/usr/bin/env tsx

/**
 * Script pour envoyer des rappels de renouvellement d'annonces
 * Ce script vérifie les annonces qui expirent dans 7 jours et envoie un email de renouvellement
 */

import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { getProductFeatures } from '../lib/product-features';

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
 * Calcule la date d'expiration d'une annonce basée sur sa date de création et le produit
 */
function calculateExpiryDate(createdAt: Date, productName?: string | null): Date {
  const features = getProductFeatures(productName);
  const expiryDate = new Date(createdAt);
  expiryDate.setMonth(expiryDate.getMonth() + features.duration.months);
  return expiryDate;
}

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
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://dragonfly-trimarans.org'}/pricing"
                 style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                📋 Voir les options de renouvellement
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

  try {
    // Récupérer toutes les annonces actives avec les informations utilisateur
    const activeBoats = await prisma.boat.findMany({
      where: {
        status: 'active'
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

    const today = new Date();
    let remindersSent = 0;
    let errors = 0;

    for (const boat of activeBoats) {
      try {
        // Utiliser la date de création comme référence (on pourrait améliorer pour utiliser les paiements)
        const referenceDate = boat.createdAt;
        const expiryDate = calculateExpiryDate(referenceDate, null); // Par défaut 3 mois pour le moment

        // Vérifier si l'annonce expire dans exactement 7 jours
        if (isWithinIntervalDays(expiryDate, today, 7)) {
          console.log(`🎯 Annonce "${boat.model}" expire le ${formatDateFr(expiryDate)} - envoi du rappel`);

          const success = await sendRenewalEmail(boat, expiryDate);
          if (success) {
            remindersSent++;
          } else {
            errors++;
          }

          // Petit délai pour éviter de spammer le serveur SMTP
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Erreur lors du traitement de l'annonce ${boat.id}:`, error);
        errors++;
      }
    }

    console.log(`✅ Vérification terminée: ${remindersSent} rappels envoyés, ${errors} erreurs`);

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des renouvellements:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  sendRenewalReminders();
}

export { sendRenewalReminders };
