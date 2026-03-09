'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { FloatingPaths } from '@/components/ui/FloatingPaths';
import Logo from '@/components/icons/Logo';

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
    <div className="relative min-h-[700px] md:overflow-hidden lg:grid lg:grid-cols-2 gap-20 max-w-screen-xl mx-auto mt-[60px] mb-[120px]">
      {/* Left panel - same style as sign in */}
      <div className="relative hidden h-full flex-col border-r bg-oceanblue p-10 lg:flex rounded-xl">
        <div className="z-10 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-xl">
              &ldquo;The Dragonfly team responded quickly and helped me find the
              perfect trimaran. Excellent support!&rdquo;
            </p>
            <footer className="font-mono font-semibold text-sm">
              ~ Dragonfly User
            </footer>
          </blockquote>
        </div>
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      {/* Right panel - Contact form */}
      <div className="relative flex flex-col justify-center p-4">
        <div
          aria-hidden
          className="-z-10 absolute inset-0 isolate opacity-60 contain-strict"
        >
          <div className="-translate-y-87.5 absolute top-0 right-0 h-320 w-140 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,--theme(--color-foreground/.06)_0,hsla(0,0%,55%,.02)_50%,--theme(--color-foreground/.01)_80%)]" />
          <div className="absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="-translate-y-87.5 absolute top-0 right-0 h-320 w-60 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,--theme(--color-foreground/.04)_0,--theme(--color-foreground/.01)_80%,transparent_100%)]" />
        </div>

        <div className="mx-auto space-y-4 sm:w-sm w-full px-4 sm:px-0">
          <Logo className="h-5 lg:hidden" />

          <div className="flex flex-col space-y-1 mb-6">
            <h1 className="font-bold text-oceanblue text-40 text-center">
              Get in touch
            </h1>
            <p className="text-base text-darkgrey text-center">
              We&apos;d love to hear from you. Send us a message.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-oceanblue text-14 font-medium mb-1.5"
                >
                  Full name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  onBlur={handleBlur('name')}
                  required
                  placeholder="Your name"
                  className={`w-full p-3 rounded-md text-oceanblue bg-lightgrey border-2 transition-colors text-14 ${
                    errors.name ? 'border-red-500' : 'border-transparent'
                  }`}
                  maxLength={100}
                />
                {errors.name && (
                  <p className="text-red-600 text-12 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-oceanblue text-14 font-medium mb-1.5"
                >
                  Email *
                </label>
                <input
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  onBlur={handleBlur('email')}
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  required
                  className={`w-full p-3 rounded-md text-oceanblue bg-lightgrey border-2 transition-colors text-14 ${
                    errors.email ? 'border-red-500' : 'border-transparent'
                  }`}
                  maxLength={254}
                />
                {errors.email && (
                  <p className="text-red-600 text-12 mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-oceanblue text-14 font-medium mb-1.5"
              >
                Subject *
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                value={formData.subject}
                onChange={handleInputChange('subject')}
                onBlur={handleBlur('subject')}
                required
                placeholder="What is this about?"
                className={`w-full p-3 rounded-md text-oceanblue bg-lightgrey border-2 transition-colors text-14 ${
                  errors.subject ? 'border-red-500' : 'border-transparent'
                }`}
                maxLength={200}
              />
              {errors.subject && (
                <p className="text-red-600 text-12 mt-1">{errors.subject}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-oceanblue text-14 font-medium mb-1.5"
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
                placeholder="Your message..."
                rows={5}
                className={`w-full px-4 py-3 rounded-md text-14 text-oceanblue placeholder-darkgrey/60 resize-none bg-lightgrey border-2 transition-colors ${
                  errors.message ? 'border-red-500' : 'border-transparent'
                }`}
                maxLength={5000}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.message && (
                  <p className="text-red-600 text-12">{errors.message}</p>
                )}
                <p className="text-darkgrey text-12 ml-auto">
                  {formData.message.length}/5000
                </p>
              </div>
            </div>

            {/* Honeypot field */}
            <div
              style={{
                position: 'absolute',
                left: '-9999px',
                visibility: 'hidden'
              }}
            >
              <label htmlFor="honeypot">Do not fill this field</label>
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

            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-800 text-14">{errors.general}</p>
              </div>
            )}

            {submitStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-green-800 text-14">
                  Your message has been sent successfully! We&apos;ll get back
                  to you shortly.
                </p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-800 text-14">
                  An error occurred while sending. Please try again.
                </p>
              </div>
            )}

            {submitStatus === 'rate_limit' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-yellow-800 text-14">
                  Too many attempts. Please wait before trying again.
                </p>
              </div>
            )}

            <Button
              text={
                isLoadingCSRF
                  ? 'Loading...'
                  : isSubmitting
                    ? 'Sending...'
                    : 'Send message'
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
  );
}
