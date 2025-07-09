'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  honeypot: string; // Hidden field to catch bots
}

interface CSRFData {
  sessionId: string;
  token: string;
  expiresAt: number;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  honeypot?: string;
  general?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: FormErrors;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    honeypot: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error' | 'rate_limit'
  >('idle');
  const [submitCount, setSubmitCount] = useState(0);
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);
  const [csrfData, setCsrfData] = useState<CSRFData | null>(null);
  const [isLoadingCSRF, setIsLoadingCSRF] = useState(true);

  // Validation en temps réel
  const validateField = (
    name: keyof FormData,
    value: string
  ): string | undefined => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Le nom est requis';
        if (value.length < 2)
          return 'Le nom doit contenir au moins 2 caractères';
        if (value.length > 100)
          return 'Le nom ne peut pas dépasser 100 caractères';
        if (!/^[a-zA-ZÀ-ÿ\s'-]+$/.test(value))
          return 'Le nom contient des caractères invalides';
        break;

      case 'email':
        if (!value.trim()) return "L'email est requis";
        if (value.length > 254) return "L'email est trop long";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Format d'email invalide";
        break;

      case 'subject':
        if (!value.trim()) return 'Le sujet est requis';
        if (value.length < 5)
          return 'Le sujet doit contenir au moins 5 caractères';
        if (value.length > 200)
          return 'Le sujet ne peut pas dépasser 200 caractères';
        break;

      case 'message':
        if (!value.trim()) return 'Le message est requis';
        if (value.length < 10)
          return 'Le message doit contenir au moins 10 caractères';
        if (value.length > 5000)
          return 'Le message ne peut pas dépasser 5000 caractères';
        break;
    }
    return undefined;
  };

  // Validation complète du formulaire
  const validateForm = (): ValidationResult => {
    const newErrors: FormErrors = {};

    // Validation de chaque champ
    Object.keys(formData).forEach((key) => {
      const fieldName = key as keyof FormData;
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    // Vérification anti-spam simple
    const content =
      `${formData.name} ${formData.subject} ${formData.message}`.toLowerCase();
    const suspiciousPatterns = [
      /https?:\/\/[^\s]{3,}/g, // URLs
      /(.)\1{5,}/g, // Caractères répétés
      /[^\w\s\-\.@àáâãäåçèéêëìíîïñòóôõöùúûüÿæœ]/g // Caractères spéciaux excessifs
    ];

    const urlCount = (content.match(suspiciousPatterns[0]) || []).length;
    if (urlCount > 2) {
      newErrors.general = 'Trop de liens détectés dans le message';
    }

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  };

  // Gestion des changements de champs
  const handleInputChange =
    (name: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;

      // Mise à jour de la valeur
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));

      // Validation en temps réel (avec délai pour éviter la surcharge)
      if (errors[name]) {
        const error = validateField(name, value);
        setErrors((prev) => ({
          ...prev,
          [name]: error
        }));
      }
    };

  // Gestion de la perte de focus pour validation
  const handleBlur = (name: keyof FormData) => () => {
    const error = validateField(name, formData[name]);
    setErrors((prev) => ({
      ...prev,
      [name]: error
    }));
  };

  // Protection contre les soumissions multiples
  const canSubmit = (): boolean => {
    const now = Date.now();
    const timeSinceLastSubmit = now - lastSubmitTime;

    // Limite de 3 soumissions par heure
    if (submitCount >= 3 && timeSinceLastSubmit < 3600000) {
      return false;
    }

    // Minimum 30 secondes entre chaque soumission
    if (timeSinceLastSubmit < 30000) {
      return false;
    }

    return true;
  };

  // Gestion de la soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Vérification des limites de soumission
    if (!canSubmit()) {
      setSubmitStatus('rate_limit');
      return;
    }

    // Vérification du token CSRF
    if (!csrfData) {
      setErrors({
        general: 'Token de sécurité manquant. Veuillez recharger la page.'
      });
      return;
    }

    // Vérification de l'expiration du token
    if (Date.now() > csrfData.expiresAt) {
      setErrors({
        general: 'Token de sécurité expiré. Veuillez recharger la page.'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrors({});

    // Validation côté client
    const { isValid, errors: validationErrors } = validateForm();
    if (!isValid) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      // Préparation des données avec tokens CSRF
      const submitData = {
        ...formData,
        csrfToken: csrfData.token,
        sessionId: csrfData.sessionId
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          honeypot: ''
        });
        setErrors({});
        setSubmitCount((prev) => prev + 1);
        setLastSubmitTime(Date.now());
      } else {
        // Gestion des erreurs spécifiques
        if (response.status === 429) {
          setSubmitStatus('rate_limit');
        } else if (response.status === 400 && data.details) {
          // Erreurs de validation côté serveur
          const serverErrors: FormErrors = {};
          data.details.forEach((error: any) => {
            serverErrors[error.field as keyof FormData] = error.message;
          });
          setErrors(serverErrors);
        } else {
          setSubmitStatus('error');
          setErrors({ general: data.error || 'Une erreur est survenue' });
        }
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      setSubmitStatus('error');
      setErrors({
        general: 'Erreur de connexion. Vérifiez votre connexion internet.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Récupération du token CSRF lors du chargement
  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        const response = await fetch('/api/csrf');
        if (response.ok) {
          const data = await response.json();
          setCsrfData(data);
        } else {
          console.error('Failed to fetch CSRF token');
        }
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
      } finally {
        setIsLoadingCSRF(false);
      }
    };

    fetchCSRFToken();
  }, []);

  // Réinitialisation du status après un délai
  useEffect(() => {
    if (submitStatus === 'success') {
      const timer = setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitStatus]);

  return (
    <div className="w-full bg-fullwhite">
      <div className="mx-auto max-w-screen-xl">
        {/* Section droite - Formulaire */}
        <div className="max-w-xl mx-auto mb-[70px] bg-lightgrey rounded-[12px] p-[50px]">
          <div className="w-lg">
            <h1 className="text-oceanblue text-56 mb-8">
              <span className="text-articblue">Contact</span> our team
            </h1>
            <p className="text-darkgrey text-18 font-light mb-12 leading-relaxed">
              Si vous avez une question et souhaitez que nous vous contactions,
              veuillez nous le faire savoir en utilisant le formulaire
              ci-dessous.
            </p>
          </div>

          <div className="bg-lightgrey rounded-[12px] p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-oceanblue text-16 font-medium mb-2"
                >
                  Nom complet *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  onBlur={handleBlur('name')}
                  required
                  placeholder="Votre nom et prénom"
                  className={`w-full p-3 rounded-md text-oceanblue bg-white border-2 transition-colors ${
                    errors.name ? 'border-red-500' : 'border-transparent'
                  }`}
                  maxLength={100}
                />
                {errors.name && (
                  <p className="text-red-600 text-14 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-oceanblue text-16 font-medium mb-2"
                >
                  Email *
                </label>
                <input
                  id="email"
                  placeholder="nom@exemple.com"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  onBlur={handleBlur('email')}
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  required
                  className={`w-full p-3 rounded-md text-oceanblue bg-white border-2 transition-colors ${
                    errors.email ? 'border-red-500' : 'border-transparent'
                  }`}
                  maxLength={254}
                />
                {errors.email && (
                  <p className="text-red-600 text-14 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-oceanblue text-16 font-medium mb-2"
                >
                  Sujet *
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleInputChange('subject')}
                  onBlur={handleBlur('subject')}
                  required
                  placeholder="Sujet de votre message"
                  className={`w-full p-3 rounded-md text-oceanblue bg-white border-2 transition-colors ${
                    errors.subject ? 'border-red-500' : 'border-transparent'
                  }`}
                  maxLength={200}
                />
                {errors.subject && (
                  <p className="text-red-600 text-14 mt-1">{errors.subject}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-oceanblue text-16 font-medium mb-2"
                >
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange('message')}
                  onBlur={handleBlur('message')}
                  required
                  placeholder="Votre message..."
                  rows={6}
                  className={`w-full px-4 py-3 rounded-[8px] text-16 text-oceanblue placeholder-darkgrey/60 resize-none bg-white border-2 transition-colors ${
                    errors.message ? 'border-red-500' : 'border-transparent'
                  }`}
                  maxLength={5000}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.message && (
                    <p className="text-red-600 text-14">{errors.message}</p>
                  )}
                  <p className="text-darkgrey text-12 ml-auto">
                    {formData.message.length}/5000
                  </p>
                </div>
              </div>

              {/* Champ honeypot caché pour détecter les bots */}
              <div
                style={{
                  position: 'absolute',
                  left: '-9999px',
                  visibility: 'hidden'
                }}
              >
                <label htmlFor="honeypot">Ne pas remplir ce champ</label>
                <input
                  id="honeypot"
                  name="honeypot"
                  type="text"
                  value={formData.honeypot}
                  onChange={handleInputChange('honeypot')}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Messages d'erreur généraux */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-[8px] p-4">
                  <p className="text-red-800 text-16">✗ {errors.general}</p>
                </div>
              )}

              {/* Message de succès */}
              {submitStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-[8px] p-4">
                  <p className="text-green-800 text-16">
                    ✓ Votre message a été envoyé avec succès ! Nous vous
                    répondrons dans les plus brefs délais.
                  </p>
                </div>
              )}

              {/* Message d'erreur */}
              {submitStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-[8px] p-4">
                  <p className="text-red-800 text-16">
                    ✗ Une erreur s'est produite lors de l'envoi. Veuillez
                    réessayer.
                  </p>
                </div>
              )}

              {/* Message de limitation */}
              {submitStatus === 'rate_limit' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-[8px] p-4">
                  <p className="text-yellow-800 text-16">
                    ⚠ Trop de tentatives d'envoi. Veuillez patienter avant de
                    réessayer.
                  </p>
                </div>
              )}

              <Button
                text={
                  isLoadingCSRF
                    ? 'Chargement...'
                    : isSubmitting
                      ? 'Envoi en cours...'
                      : 'Envoyer le message'
                }
                type="submit"
                onClick={undefined}
                bgColor="bg-articblue"
                textColor="text-fullwhite"
                fullwidth={true}
                anim_disabled={isSubmitting || !canSubmit() || isLoadingCSRF}
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
