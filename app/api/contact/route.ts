import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import validator from 'validator';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { validateCSRFToken } from '@/utils/csrf';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configuration du rate limiter
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'contact_form',
  points: 3, // Nombre de tentatives
  duration: 3600, // Par heure (3600 secondes)
});

// Configuration SMTP Infomaniak
const transporter = nodemailer.createTransport({
  host: 'mail.infomaniak.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Simple HTML escaper for server-side sanitization (no jsdom needed)
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  csrfToken: string;
  sessionId: string;
  honeypot?: string; // Hidden field to catch bots
}

interface ValidationError {
  field: string;
  message: string;
}

// Fonction de validation des données
function validateContactData(data: any): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  
  // Validation des champs requis
  if (!data.name || typeof data.name !== 'string') {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (data.name.length < 2 || data.name.length > 100) {
    errors.push({ field: 'name', message: 'Name must be between 2 and 100 characters' });
  }

  if (!data.email || typeof data.email !== 'string') {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!validator.isEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  } else if (data.email.length > 254) {
    errors.push({ field: 'email', message: 'Email is too long' });
  }

  if (!data.subject || typeof data.subject !== 'string') {
    errors.push({ field: 'subject', message: 'Subject is required' });
  } else if (data.subject.length < 5 || data.subject.length > 200) {
    errors.push({ field: 'subject', message: 'Subject must be between 5 and 200 characters' });
  }

  if (!data.message || typeof data.message !== 'string') {
    errors.push({ field: 'message', message: 'Message is required' });
  } else if (data.message.length < 10 || data.message.length > 5000) {
    errors.push({ field: 'message', message: 'Message must be between 10 and 5000 characters' });
  }

  return { isValid: errors.length === 0, errors };
}

// Fonction de sanitisation des données
function sanitizeData(data: ContactFormData): ContactFormData {
  return {
    name: escapeHtml(data.name.trim()),
    email: validator.normalizeEmail(data.email.trim().toLowerCase()) || '',
    subject: escapeHtml(data.subject.trim()),
    message: escapeHtml(data.message.trim()),
    csrfToken: data.csrfToken,
    sessionId: data.sessionId,
    honeypot: data.honeypot || '',
  };
}

// Fonction de détection de spam
function detectSpam(data: ContactFormData): boolean {
  const spamKeywords = [
    'viagra', 'casino', 'lottery', 'winner', 'congratulations',
    'click here', 'free money', 'make money', 'work from home',
    'buy now', 'limited time', 'act now', 'urgent'
  ];

  const content = `${data.name} ${data.subject} ${data.message}`.toLowerCase();
  
  // Vérifier les mots-clés spam
  const hasSpamKeywords = spamKeywords.some(keyword => content.includes(keyword));
  
  // Vérifier les liens suspects
  const hasMultipleLinks = (content.match(/https?:\/\//g) || []).length > 2;
  
  // Vérifier les caractères répétés
  const hasRepeatedChars = /(.)\1{10,}/.test(content);
  
  return hasSpamKeywords || hasMultipleLinks || hasRepeatedChars;
}

// Fonction de logging sécurisé
function logSuspiciousActivity(ip: string, userAgent: string, reason: string) {
  const timestamp = new Date().toISOString();
  console.warn(`[SECURITY] ${timestamp} - IP: ${ip} - User-Agent: ${userAgent} - Reason: ${reason}`);
}

export async function POST(request: NextRequest) {
  if (!process.env.CONTACT_EMAIL) {
    console.error('CONTACT_EMAIL environment variable is not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    // Récupération des informations de la requête
    const ip = request.ip || 
              request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Vérification du Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      logSuspiciousActivity(ip, userAgent, 'Invalid Content-Type');
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // Rate limiting
    try {
      await rateLimiter.consume(ip);
    } catch (rateLimiterRes) {
      logSuspiciousActivity(ip, userAgent, 'Rate limit exceeded');
      return NextResponse.json(
        { error: 'Too many attempts. Please try again in one hour.' },
        { status: 429 }
      );
    }

    // Parsing des données
    let data;
    try {
      data = await request.json();
    } catch (error) {
      logSuspiciousActivity(ip, userAgent, 'Invalid JSON');
      return NextResponse.json(
        { error: 'Invalid data' },
        { status: 400 }
      );
    }

    // Validation des champs CSRF
    if (!data.csrfToken || !data.sessionId) {
      logSuspiciousActivity(ip, userAgent, 'Missing CSRF token');
      return NextResponse.json(
        { error: 'Security token missing' },
        { status: 400 }
      );
    }

    // Validation du token CSRF
    if (!await validateCSRFToken(data.sessionId, data.csrfToken)) {
      logSuspiciousActivity(ip, userAgent, 'Invalid CSRF token');
      return NextResponse.json(
        { error: 'Invalid security token' },
        { status: 401 }
      );
    }

    // Honeypot check - if filled, it's likely a bot
    if (data.honeypot && data.honeypot.trim() !== '') {
      logSuspiciousActivity(ip, userAgent, 'Honeypot triggered');
      return NextResponse.json(
        { error: 'Bot detected' },
        { status: 400 }
      );
    }

    // Validation des données
    const { isValid, errors } = validateContactData(data);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid data', details: errors },
        { status: 400 }
      );
    }

    // Sanitisation des données
    const sanitizedData = sanitizeData(data);

    // Détection de spam
    if (detectSpam(sanitizedData)) {
      logSuspiciousActivity(ip, userAgent, 'Spam detected');
      return NextResponse.json(
        { error: 'Message detected as spam' },
        { status: 400 }
      );
    }

    // Préparation de l'email
    const mailOptions = {
      from: `"Contact Dragonfly" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL,
      subject: `[Contact] ${sanitizedData.subject}`,
      replyTo: sanitizedData.email,
      text: `New contact message\n\nName: ${sanitizedData.name}\nEmail: ${sanitizedData.email}\nSubject: ${sanitizedData.subject}\nDate: ${new Date().toLocaleString('en-GB')}\nIP: ${ip}\n\nMessage:\n${sanitizedData.message}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
            New contact message
          </h2>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e3a8a; margin-top: 0;">Contact details:</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${sanitizedData.name}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${sanitizedData.email}">${sanitizedData.email}</a></p>
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${sanitizedData.subject}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleString('en-GB')}</p>
            <p style="margin: 5px 0;"><strong>IP:</strong> ${ip}</p>
          </div>

          <h3 style="color: #1e3a8a; margin-top: 30px;">Message:</h3>
          <div style="background-color: #ffffff; padding: 20px; border-left: 4px solid #3b82f6; margin: 10px 0; border-radius: 4px;">
            <p style="line-height: 1.6; margin: 0; white-space: pre-wrap;">${sanitizedData.message}</p>
          </div>

          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #1e3a8a; font-size: 14px; margin: 0;">
              Reply directly to this email to reach ${sanitizedData.email}.
            </p>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

          <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
            Sent from the Dragonfly Trimarans contact form
          </p>
        </div>
      `,
    };

    // Envoi de l'email
    await transporter.sendMail(mailOptions);

    // Log de succès
    console.log(`[SUCCESS] Contact form submitted from IP: ${ip}`);

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    
    // Ne pas exposer les détails de l'erreur
    return NextResponse.json(
      { error: 'A technical error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}

// Bloquer les autres méthodes HTTP
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
} 