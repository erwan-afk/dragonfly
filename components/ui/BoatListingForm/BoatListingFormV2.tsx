'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { UserSimple, ProductWithPrices } from '@/types/database';
import { emergencyCleanupClient } from '@/utils/boats/client';
import { Select, SelectItem, SelectSection } from '@heroui/select';
import { Avatar } from '@heroui/avatar';
import { Textarea } from '@heroui/input';
import NumberInput from '@/components/ui/NumberInput/NumberInput';
import { Checkbox } from '@heroui/checkbox';
import Valide from '@/components/icons/Valide';
import Lock from '@/components/icons/lock';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentForm from '@/components/ui/StripePaymentForm/StripePaymentForm';
import toast from 'react-hot-toast';
import {
  dragonflyModels,
  currencies,
  countries,
  boatConditions,
  getBoatYears
} from '@/utils/constants';
import { specificationsData } from '@/utils/specifications';
import { getModelLabel } from '@/utils/constants';
import {
  getMaxPhotos,
  getPriceLimit,
  getDuration,
  getUpgradePlan,
  getPriceLimitSummaryText
} from '@/lib/product-features';
import { formatPriceNumber, formatPriceCurrency } from '@/utils/format-price';
import { isValidVideoUrl } from '@/utils/video-embed';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE ??
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
    ''
);

interface BoatListingFormProps {
  user: UserSimple | null | undefined;
  products: ProductWithPrices[];
  preference: string | null;
}

// Composant de checkbox de validation
function ValidationCheckbox({
  isValid,
  optional,
  shouldPulse
}: {
  isValid: boolean;
  optional?: boolean;
  shouldPulse?: boolean;
}) {
  return (
    <div className="flex items-center justify-center flex-shrink-0">
      <div
        className={`
          w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300
          ${
            isValid
              ? 'bg-green-500 scale-110'
              : shouldPulse
                ? 'bg-red-500 border-2 border-red-600 animate-pulse-red'
                : 'bg-stonegrey/30 border-2 border-stonegrey'
          }
        `}
      >
        {isValid && (
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
        {!isValid && shouldPulse && (
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
    </div>
  );
}

export default function BoatListingFormV2({
  user,
  products,
  preference
}: BoatListingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Local testing helper: show autofill controls only on localhost or in dev.
  const showTestTools =
    process.env.NODE_ENV !== 'production' ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost');

  const normalizePlanName = (name: string | null | undefined) =>
    (name || '').toLowerCase().trim();

  const classifyPlan = (name: string | null | undefined) => {
    const n = normalizePlanName(name);
    if (n.includes('start line') || n.includes('startline'))
      return 'start line';
    if (
      n.includes('mid-course') ||
      n.includes('midcourse') ||
      n.includes('mid course')
    )
      return 'mid-course';
    if (n.includes('podium')) return 'podium';
    if (n.includes('renewal')) return 'renewal';
    return 'other';
  };

  // Keep product display consistent and predictable (and ensure "Start line" is truly the base default).
  const orderedProducts = useMemo(() => {
    const order: Record<string, number> = {
      'start line': 0,
      'mid-course': 1,
      podium: 2,
      renewal: 3,
      other: 999
    };
    return [...products]
      .filter((p) => classifyPlan(p.name) !== 'other')
      .sort((a, b) => order[classifyPlan(a.name)] - order[classifyPlan(b.name)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  const defaultProductId =
    // preference match (case-insensitive)
    orderedProducts.find(
      (p) => normalizePlanName(p.name) === normalizePlanName(preference)
    )?.id ||
    // otherwise default to Start line if present
    orderedProducts.find((p) => classifyPlan(p.name) === 'start line')?.id ||
    orderedProducts[0]?.id ||
    '';
  const [selectedProductId, setSelectedProductId] =
    useState<string>(defaultProductId);

  const selectedProduct =
    orderedProducts.find((p) => p.id === selectedProductId) ||
    orderedProducts[0];
  const selectedPrice = selectedProduct?.prices[0];
  const isRenewalMode =
    selectedProduct?.name?.toLowerCase().includes('renewal') ?? false;

  const [model, setModel] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [priceBoat, setPriceBoat] = useState(0);
  const [currency, setCurrency] = useState<string>('USD');
  const [specifications, setSpecifications] = useState<string[]>([]);
  const [vatPaid, setVatPaid] = useState(false);
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [condition, setCondition] = useState<string>('');
  const [year, setYear] = useState<number | null>(null);

  // Photo upload state
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Validation states
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [shouldPulseInvalid, setShouldPulseInvalid] = useState(false);

  // Refs for scrolling to invalid fields
  const modelFieldRef = useRef<HTMLDivElement>(null);
  const priceFieldRef = useRef<HTMLDivElement>(null);
  const countryFieldRef = useRef<HTMLDivElement>(null);
  const descriptionFieldRef = useRef<HTMLDivElement>(null);
  const photosFieldRef = useRef<HTMLDivElement>(null);

  // Renewal state
  const [selectedBoatId, setSelectedBoatId] = useState<string>('');
  const [userBoats, setUserBoats] = useState<any[]>([]);
  const [loadingBoats, setLoadingBoats] = useState(false);
  const hasLoadedBoatsRef = useRef(false);
  // Prevent duplicate boat creation when the user retries payment.
  // We create a "pending" boat before confirming payment; without this, a second attempt can create a second pending ad.
  const prePaymentBoatIdRef = useRef<string | null>(null);

  // Payment state
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');

  // Add-ons state
  const [wantExtraPhotos, setWantExtraPhotos] = useState(false);
  const [wantVideo, setWantVideo] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');

  const addOnProducts = useMemo(() => {
    const photoProduct = products.find((p) =>
      (p.name || '').toLowerCase().includes('extra photos')
    );
    const videoProduct = products.find((p) =>
      (p.name || '').toLowerCase().includes('video')
    );
    return { photoProduct, videoProduct };
  }, [products]);

  const photoAddOnPrice = addOnProducts.photoProduct?.prices?.[0];
  const videoAddOnPrice = addOnProducts.videoProduct?.prices?.[0];
  const photoAddOnPriceId = photoAddOnPrice?.id;
  const videoAddOnPriceId = videoAddOnPrice?.id;
  const photoAddOnAmount = Number(photoAddOnPrice?.unitAmount || 0);
  const videoAddOnAmount = Number(videoAddOnPrice?.unitAmount || 0);

  // Disable add-ons in renewal mode (renewal is duration-only)
  const addOnsAllowed = !isRenewalMode;

  // Créer le PaymentIntent au chargement
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!selectedPrice || !selectedPrice.unitAmount || !user) {
        return;
      }

      const addOnPriceIds: string[] = [];
      if (addOnsAllowed && wantExtraPhotos && photoAddOnPriceId) {
        addOnPriceIds.push(photoAddOnPriceId);
      }
      if (addOnsAllowed && wantVideo && videoAddOnPriceId) {
        addOnPriceIds.push(videoAddOnPriceId);
      }

      try {
        console.log('💳 Creating initial payment intent...');
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Number(selectedPrice.unitAmount),
            currency: selectedPrice.currency || 'eur',
            priceId: selectedPrice.id,
            addOnPriceIds,
            metadata: {
              listing_type: 'boat',
              user_id: user.id
            }
          })
        });

        const contentType = response.headers.get('content-type') || '';
        const raw = await response.text();
        const result = contentType.includes('application/json')
          ? JSON.parse(raw)
          : null;

        if (response.ok && result?.clientSecret) {
          setClientSecret(result.clientSecret);
          setPaymentIntentId(result.paymentIntentId);
          console.log('✅ Payment intent created:', result.paymentIntentId);
        } else {
          console.error('❌ Failed to create payment intent:', {
            status: response.status,
            error: result?.error,
            code: result?.code,
            raw: raw?.slice(0, 200)
          });
        }
      } catch (error) {
        console.error('❌ Error creating payment intent:', error);
      }
    };

    createPaymentIntent();
  }, [
    selectedPrice,
    user,
    addOnsAllowed,
    wantExtraPhotos,
    wantVideo,
    photoAddOnPriceId,
    videoAddOnPriceId
  ]);

  // Utiliser les fonctions importées depuis la configuration partagée
  const planMaxPhotos = getMaxPhotos(selectedProduct?.name);
  const maxPhotos =
    planMaxPhotos + (addOnsAllowed && wantExtraPhotos ? 5 : 0);
  const priceLimit = getPriceLimit(selectedProduct?.name, currency);
  const upgradePlan = getUpgradePlan(selectedProduct?.name);
  const duration = getDuration(selectedProduct?.name);

  const PRICE_LIMIT_TOAST_ID = 'price-limit-upgrade';
  const isPriceOverLimit = !!priceLimit && priceBoat > priceLimit;

  const upgradeProduct = useMemo(() => {
    if (!upgradePlan) return null;
    const planName = upgradePlan.toLowerCase();
    return orderedProducts.find((p) => {
      const productName = p.name?.toLowerCase() || '';
      return (
        productName.includes(planName) ||
        productName.includes(planName.replace('-', '')) ||
        productName.includes(planName.replace('-', ' '))
      );
    });
  }, [orderedProducts, upgradePlan]);

  // Supprimer les photos en trop si le nombre max change
  useEffect(() => {
    if (photoFiles.length > maxPhotos && maxPhotos > 0) {
      const photosToRemove = photoFiles.length - maxPhotos;
      const newPhotoFiles = photoFiles.slice(0, maxPhotos);
      const newPhotoPreview = photoPreview.slice(0, maxPhotos);

      // Libérer les URLs des photos supprimées
      photoPreview.slice(maxPhotos).forEach((url) => {
        URL.revokeObjectURL(url);
      });

      setPhotoFiles(newPhotoFiles);
      setPhotoPreview(newPhotoPreview);

      if (photosToRemove > 0) {
        toast(
          `Removed ${photosToRemove} photo(s). This offer allows up to ${maxPhotos} photos.`,
          {
            duration: 3000,
            position: 'top-right',
            icon: 'ℹ️'
          }
        );
      }
    } else if (maxPhotos === 0 && photoFiles.length > 0) {
      // Si l'offre ne permet pas de photos, supprimer toutes les photos
      photoPreview.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      setPhotoFiles([]);
      setPhotoPreview([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxPhotos]);

  // Scroll to invalid fields when they start pulsing
  useEffect(() => {
    if (shouldPulseInvalid) {
      // Small delay to ensure the pulse animation has started
      setTimeout(() => {
        // Priority: model > country > price > description > photos
        if (!model && modelFieldRef.current) {
          modelFieldRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        } else if (!country && countryFieldRef.current) {
          countryFieldRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        } else if (priceBoat <= 0 && priceFieldRef.current) {
          priceFieldRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        } else if (
          (description.length < 300 || description.length > 3500) &&
          descriptionFieldRef.current
        ) {
          descriptionFieldRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        } else if (
          maxPhotos > 0 &&
          photoFiles.length === 0 &&
          photosFieldRef.current
        ) {
          photosFieldRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 100);
    }
  }, [
    shouldPulseInvalid,
    priceBoat,
    model,
    country,
    description,
    maxPhotos,
    photoFiles.length
  ]);

  const getCurrencySymbol = (currency: string | null) => {
    if (!currency) return '';
    const currencyData = currencies.find(
      (c) => c.key === currency.toUpperCase()
    );
    return currencyData ? currencyData.symbol : currency.toUpperCase();
  };

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find((p) => p.id === productId);
    const isRenewal = product?.name?.toLowerCase().includes('renewal');

    // Si on passe en mode renewal, charger les annonces
    if (isRenewal) {
      // Réinitialiser le ref pour permettre le chargement si nécessaire
      hasLoadedBoatsRef.current = false;
      loadUserBoats();
    } else {
      // Réinitialiser la sélection d'annonce si on quitte le mode renewal
      setSelectedBoatId('');
      hasLoadedBoatsRef.current = false;
    }
  };

  // Centralize "price exceeds plan limit" behavior so it doesn't depend on input quirks.
  useEffect(() => {
    console.log('[priceLimitEffect] check', {
      isRenewalMode,
      priceBoat,
      priceLimit,
      upgradePlan,
      selectedProductName: selectedProduct?.name
    });

    if (isRenewalMode) {
      toast.dismiss(PRICE_LIMIT_TOAST_ID);
      return;
    }

    if (!priceLimit || !upgradePlan || priceBoat <= priceLimit) {
      toast.dismiss(PRICE_LIMIT_TOAST_ID);
      return;
    }

    console.log('[priceLimitEffect] over limit -> show upgrade toast', {
      priceBoat,
      priceLimit,
      upgradePlan
    });

    const upgradeProduct = products.find((p) => {
      const productName = p.name?.toLowerCase() || '';
      const planName = upgradePlan.toLowerCase();
      return (
        productName.includes(planName) ||
        productName.includes(planName.replace('-', '')) ||
        productName.includes(planName.replace('-', ' '))
      );
    });

    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-base">
            💡 Upgrade to {upgradePlan} plan
          </p>
          <p className="text-sm text-gray-700">
            This price exceeds the <strong>{selectedProduct?.name}</strong>{' '}
            limit ({getCurrencySymbol(currency)}
            {formatPriceNumber(priceLimit, currency)}). Upgrade to{' '}
            <strong>{upgradePlan}</strong> to list boats at this price.
          </p>
          {upgradeProduct && (
            <button
              onClick={() => {
                handleProductChange(upgradeProduct.id);
                toast.dismiss(t.id);
              }}
              className="mt-2 px-4 py-2 bg-articblue text-white rounded-lg hover:bg-articblue/90 transition-colors text-sm font-medium w-full"
            >
              Upgrade to {upgradePlan}
            </button>
          )}
        </div>
      ),
      {
        id: PRICE_LIMIT_TOAST_ID,
        duration: 8000,
        position: 'top-right',
        style: {
          maxWidth: '420px',
          padding: '16px'
        }
      }
    );
  }, [
    PRICE_LIMIT_TOAST_ID,
    currency,
    getCurrencySymbol,
    handleProductChange,
    isRenewalMode,
    priceBoat,
    priceLimit,
    products,
    selectedProduct?.name,
    upgradePlan
  ]);

  // Charger les annonces actives de l'utilisateur
  const loadUserBoats = async () => {
    if (!user) return;

    setLoadingBoats(true);
    try {
      const response = await fetch('/api/boats/my-active');
      const contentType = response.headers.get('content-type') || '';
      const raw = await response.text();
      const data = contentType.includes('application/json')
        ? JSON.parse(raw)
        : null;

      if (response.ok && data?.success && data?.boats) {
        setUserBoats(data.boats);
      } else {
        toast.error('Failed to load your ads', {
          duration: 3000,
          position: 'top-right'
        });
      }
    } catch (error) {
      console.error('Error loading user boats:', error);
      toast.error('Error loading your ads', {
        duration: 3000,
        position: 'top-right'
      });
    } finally {
      setLoadingBoats(false);
    }
  };

  // Charger les annonces automatiquement si on est en mode renewal au chargement initial
  useEffect(() => {
    if (isRenewalMode && user && !hasLoadedBoatsRef.current && !loadingBoats) {
      console.log(
        '🔄 Renewal mode detected on initial load, fetching user boats...'
      );
      hasLoadedBoatsRef.current = true;
      loadUserBoats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRenewalMode, user]);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setModel(e.target.value);
    setTouched({ ...touched, model: true });
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCountry(e.target.value);
    setTouched({ ...touched, country: true });
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrency(e.target.value);
  };

  const handleSpecificationsChange = (keys: any) => {
    const selectedKeys = Array.from(keys).map((key) => String(key));
    setSpecifications(selectedKeys);
  };

  const handleVatPaidChange = (checked: boolean) => {
    setVatPaid(checked);
  };

  const processPhotoFiles = (files: File[], targetIndex?: number) => {
    if (maxPhotos === 0) {
      toast.error('This offer does not allow photo uploads', {
        duration: 3000,
        position: 'top-right'
      });
      return;
    }

    // Filtrer uniquement les fichiers images
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      toast.error('Please drop image files only', {
        duration: 3000,
        position: 'top-right'
      });
      return;
    }

    const remainingSlots = maxPhotos - photoFiles.length;
    const filesToAdd = imageFiles.slice(0, remainingSlots);

    if (filesToAdd.length === 0) {
      toast.error(`Maximum ${maxPhotos} photos allowed`, {
        duration: 3000,
        position: 'top-right'
      });
      return;
    }

    // Si un index cible est spécifié et que la case est vide, insérer à cet index
    if (targetIndex !== undefined && targetIndex < photoFiles.length) {
      // Remplacer la photo existante
      const newPhotoFiles = [...photoFiles];
      const newPhotoPreview = [...photoPreview];

      // Libérer l'ancienne URL
      URL.revokeObjectURL(newPhotoPreview[targetIndex]);

      // Remplacer par la nouvelle photo
      newPhotoFiles[targetIndex] = filesToAdd[0];
      newPhotoPreview[targetIndex] = URL.createObjectURL(filesToAdd[0]);

      setPhotoFiles(newPhotoFiles);
      setPhotoPreview(newPhotoPreview);

      // Ajouter les fichiers restants si possible
      if (filesToAdd.length > 1) {
        const additionalFiles = filesToAdd.slice(1);
        const additionalSlots = maxPhotos - newPhotoFiles.length;
        const additionalToAdd = additionalFiles.slice(0, additionalSlots);

        if (additionalToAdd.length > 0) {
          setPhotoFiles((prev) => [...prev, ...additionalToAdd]);
          const additionalPreviews = additionalToAdd.map((file) =>
            URL.createObjectURL(file)
          );
          setPhotoPreview((prev) => [...prev, ...additionalPreviews]);
        }
      }
    } else {
      // Ajouter à la fin
      setPhotoFiles((prev) => [...prev, ...filesToAdd]);
      const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file));
      setPhotoPreview((prev) => [...prev, ...newPreviews]);
    }

    setTouched({ ...touched, photos: true });

    if (imageFiles.length > remainingSlots) {
      toast(
        `Only ${remainingSlots} photo(s) added. Maximum ${maxPhotos} photos allowed.`,
        {
          duration: 3000,
          position: 'top-right',
          icon: '⚠️'
        }
      );
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;
    processPhotoFiles(Array.from(selectedFiles));
  };

  const handlePhotoClick = (index: number) => {
    if (maxPhotos === 0) {
      toast.error('This offer does not allow photo uploads', {
        duration: 3000,
        position: 'top-right'
      });
      return;
    }

    if (index < photoFiles.length) {
      // Si c'est une photo existante, on peut la supprimer ou la remplacer
      return;
    }
    // Si c'est une case vide, déclencher l'input file
    const input = document.getElementById(
      'photo-upload-input'
    ) as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(photoPreview[index]);
    setPhotoPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading && index >= photoFiles.length) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading && index >= photoFiles.length) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Vérifier si on quitte vraiment la zone (pas juste un enfant)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);

    if (isLoading) return;

    if (maxPhotos === 0) {
      toast.error('This offer does not allow photo uploads', {
        duration: 3000,
        position: 'top-right'
      });
      return;
    }

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    // Si on dépose sur une case vide, insérer à cet index
    if (index >= photoFiles.length) {
      processPhotoFiles(Array.from(files), index);
    } else {
      // Si on dépose sur une photo existante, la remplacer
      processPhotoFiles(Array.from(files), index);
    }
  };

  const validateDescription = (desc: string): boolean => {
    return desc.length <= 3500;
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // En mode renewal, seule la sélection d'annonce est requise
    if (isRenewalMode) {
      if (!selectedBoatId) errors.push('Please select an ad to renew');
      return {
        isValid: errors.length === 0,
        errors
      };
    }

    // Validation normale pour les nouvelles annonces
    if (!model) errors.push('Please select a boat model');
    if (!country) errors.push('Please select a country');
    if (priceBoat <= 0) errors.push('Please enter a valid price');
    if (priceLimit && priceBoat > priceLimit) {
      errors.push(
        `This price exceeds your plan limit (${getCurrencySymbol(currency)}${formatPriceNumber(priceLimit, currency)}). Please upgrade your plan.`
      );
    }
    if (description.length < 300)
      errors.push('Description must be at least 300 characters');
    if (description.length > 3500)
      errors.push('Description must be less than 3500 characters');
    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
      errors.push('Please enter a valid contact email');
    if (maxPhotos > 0 && photoFiles.length === 0)
      errors.push('Please add at least one photo');
    if (addOnsAllowed && wantVideo && !isValidVideoUrl(videoUrlInput)) {
      errors.push('Video URL must be a valid YouTube, Vimeo or Dailymotion link');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleBeforePayment = async (onStepChange?: (step: number) => void): Promise<{
    success: boolean;
    boatId?: string;
    error?: string;
  }> => {
    console.log('🔄 handleBeforePayment called');
    setIsLoading(true);

    if (!user) {
      console.error('❌ No user found');
      toast.error('Please sign in to continue', {
        duration: 4000,
        position: 'top-right'
      });
      router.push('/signin/signup');
      return { success: false, error: 'Please sign in to continue' };
    }

    // Valider le formulaire
    console.log('🔍 Validating form...');
    const validation = validateForm();
    console.log('📋 Validation result:', validation);

    if (!validation.isValid) {
      console.error('❌ Form validation failed:', validation.errors);
      validation.errors.forEach((error) => {
        toast.error(error, {
          duration: 4000,
          position: 'top-right'
        });
      });
      setIsLoading(false);
      return { success: false, error: validation.errors[0] || 'Form invalid' };
    }

    // En mode renewal, on renouvelle directement l'annonce sélectionnée
    if (isRenewalMode && selectedBoatId) {
      console.log('🔄 Renewal mode: renewing boat', selectedBoatId);
      setIsLoading(false);
      return { success: true, boatId: selectedBoatId };
    }

    // If we already created a boat for this payment attempt, reuse it (avoid duplicate ads).
    if (prePaymentBoatIdRef.current) {
      console.log('♻️ Reusing pre-payment boat:', prePaymentBoatIdRef.current);
      setIsLoading(false);
      return { success: true, boatId: prePaymentBoatIdRef.current };
    }

    let tempBoatId: string | null = null;

    try {
      let tempImageKeys: string[] = [];

      onStepChange?.(0); // Step: Uploading images

      if (photoFiles.length > 0) {
        console.log(`📸 Uploading ${photoFiles.length} photos...`);
        setUploadingPhotos(true);
        const uploadPromise = (async () => {
          // Important (prod/Vercel): uploading multiple images in a single request can hit the
          // serverless request body limit and return 413 before our handler runs.
          // Scalable fix: direct-to-R2 upload using a short-lived signed URL.
          const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const uploadedKeys: string[] = [];

          for (const [index, file] of photoFiles.entries()) {
            // 1) Ask server for a signed URL (authenticated)
            const presignRes = await fetch('/api/upload-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId,
                filename: file.name,
                contentType: file.type,
                size: file.size
              })
            });

            const presignType = presignRes.headers.get('content-type') || '';
            const presignRaw = await presignRes.text();
            const presignJson = presignType.includes('application/json')
              ? JSON.parse(presignRaw)
              : null;

            if (!presignRes.ok || !presignJson?.success) {
              throw new Error(
                presignJson?.error ||
                  `Failed to prepare upload (${presignRes.status}): ${presignRaw.slice(0, 200)}`
              );
            }

            const signedUrl: string = presignJson.url;
            const key: string = presignJson.key;

            // 2) PUT directly to R2 (bypasses Vercel request body limits)
            const putRes = await fetch(signedUrl, {
              method: 'PUT',
              headers: {
                // Must match the ContentType used when signing
                'Content-Type': file.type
              },
              body: file
            });

            if (!putRes.ok) {
              throw new Error(
                `Upload failed for image ${index + 1} (${putRes.status})`
              );
            }

            uploadedKeys.push(key);
          }

          tempImageKeys = uploadedKeys;
          console.log('✅ Images uploaded:', tempImageKeys);
          return tempImageKeys.length;
        })();

        toast.promise(uploadPromise, {
          loading: `Uploading ${photoFiles.length} image(s)...`,
          success: (count) => `${count} image(s) uploaded successfully!`,
          error: 'Failed to upload images'
        });

        if (process.env.NODE_ENV === 'development') {
          try {
            await uploadPromise;
          } catch (uploadErr) {
            console.warn('⚠️ Photo upload failed (skipped in dev):', uploadErr);
            tempImageKeys = [];
          }
        } else {
          await uploadPromise;
        }
        setUploadingPhotos(false);
      } else {
        console.log('ℹ️ No photos to upload');
      }

      onStepChange?.(1); // Step: Creating listing
      console.log('🚤 Creating boat...');
      const boatResponse = await fetch('/api/boats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          price: priceBoat,
          country,
          description,
          email: contactEmail,
          condition: condition || null,
          year: year ?? null,
          photos: tempImageKeys,
          currency,
          specifications,
          vatPaid,
          productId: selectedProductId,
          hasExtraPhotos: addOnsAllowed && wantExtraPhotos,
          videoUrl:
            addOnsAllowed && wantVideo && isValidVideoUrl(videoUrlInput)
              ? videoUrlInput.trim()
              : null
        })
      });

      const boatContentType = boatResponse.headers.get('content-type') || '';
      const boatRaw = await boatResponse.text();
      const boatResult = boatContentType.includes('application/json')
        ? JSON.parse(boatRaw)
        : null;
      console.log('📋 Boat creation response:', boatResult);

      if (!boatResponse.ok || !boatResult?.success) {
        const errMsg =
          boatResult?.error ||
          `Failed to create listing (${boatResponse.status}): ${boatRaw.slice(0, 200)}`;
        console.error('❌ Boat creation failed:', errMsg);
        toast.error(errMsg, {
          duration: 4000,
          position: 'top-right'
        });
        setIsLoading(false);
        return { success: false, error: errMsg };
      }

      tempBoatId = boatResult.boatId;
      console.log('✅ Boat created:', tempBoatId);
      prePaymentBoatIdRef.current = tempBoatId;
      setIsLoading(false);

      return { success: true, boatId: tempBoatId || undefined };
    } catch (error) {
      console.error('❌ Error in handleBeforePayment:', error);
      if (tempBoatId) {
        console.log('🧹 Cleaning up boat:', tempBoatId);
        await emergencyCleanupClient(tempBoatId, 'Error during boat creation');
      }
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message, {
        duration: 4000,
        position: 'top-right'
      });
      setIsLoading(false);
      setUploadingPhotos(false);
      return { success: false, error: message };
    }
  };

  const handlePaymentSuccess = async () => {
    console.log('✅ Payment successful!');

    // Si on est en mode renewal, renouveler l'annonce
    if (isRenewalMode && selectedBoatId) {
      try {
        console.log('🔄 Renewing boat:', selectedBoatId);
        const response = await fetch('/api/boats/renew', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ boatId: selectedBoatId, paymentIntentId })
        });

        const result = await response.json();

        if (result.success) {
          toast.success('Your ad has been renewed for 3 more months!', {
            duration: 5000,
            position: 'top-right'
          });
        } else {
          toast.error(result.error || 'Failed to renew ad', {
            duration: 5000,
            position: 'top-right'
          });
        }
      } catch (error) {
        console.error('❌ Error renewing boat:', error);
        toast.error('Failed to renew ad', {
          duration: 5000,
          position: 'top-right'
        });
      }
    } else {
      toast.success('Your boat listing has been published!', {
        duration: 5000,
        position: 'top-right'
      });
    }

    setTimeout(() => router.push('/account?payment=success'), 1500);
  };

  const handlePaymentError = (error: string) => {
    console.error('❌ Payment failed:', error);

    // Si l'erreur indique que les champs requis ne sont pas remplis, déclencher l'animation pulse
    if (error.includes('Please complete all required fields')) {
      setShouldPulseInvalid(true);
      // Arrêter l'animation après 3 secondes
      setTimeout(() => {
        setShouldPulseInvalid(false);
      }, 3000);
    }

    toast.error(`Payment failed: ${error}`, {
      duration: 5000,
      position: 'top-right'
    });
  };

  const planAmountCents = Number(selectedPrice?.unitAmount || 0);
  const addOnsAmountCents =
    (addOnsAllowed && wantExtraPhotos ? photoAddOnAmount : 0) +
    (addOnsAllowed && wantVideo ? videoAddOnAmount : 0);
  const totalAmountCents = planAmountCents + addOnsAmountCents;

  const priceString = formatPriceCurrency(
    totalAmountCents / 100,
    selectedPrice?.currency || 'USD'
  );
  const planPriceString = formatPriceCurrency(
    planAmountCents / 100,
    selectedPrice?.currency || 'USD'
  );

  if (!products.length || !selectedPrice) {
    return <div>Error: No products available</div>;
  }

  const isFormValid = validateForm().isValid;

  return (
    <div className="flex flex-col lg:flex-row w-full justify-center gap-8 lg:gap-[150px] pb-[112px] mx-auto max-w-screen-2xl px-4 sm:px-8 lg:px-16 xl:px-6">
      {/* Formulaire au centre */}
      <div className="flex-1 max-w-full lg:max-w-lg flex flex-col gap-6 sm:gap-[32px] rounded-[24px]">
        <h1 className="text-20 sm:text-24 lg:text-40 text-oceanblue">
          <span className="text-articblue">
            {isRenewalMode ? 'Renew' : 'Create'}
          </span>{' '}
          your advert
        </h1>

        {showTestTools && !isRenewalMode && (
          <div className="flex flex-col gap-2 rounded-xl border border-stonegrey/20 bg-stonegrey/5 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
              <div className="text-xs sm:text-sm text-oceanblue">
                <span className="font-medium">Test tools</span> (dev only)
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    const fallbackModel = dragonflyModels[0]?.key || '';
                    const fallbackCountry = countries[0]?.key || '';
                    const fallbackCurrency = 'EUR';
                    const safePrice =
                      priceLimit && priceLimit > 0
                        ? Math.max(1000, Math.floor(priceLimit * 0.6))
                        : 250000;

                    setModel(fallbackModel);
                    setCountry(fallbackCountry);
                    setCurrency(fallbackCurrency);
                    setPriceBoat(safePrice);
                    setVatPaid(true);
                    setSpecifications(
                      specificationsData
                        .flatMap((s) => s.items.map((i) => i.key))
                        .slice(0, 4)
                    );
                    setDescription(
                      'Test listing (autofilled). Great condition, ready to sail. Contact me for details.'
                    );

                    // Mark fields as touched so validations show consistent UI
                    setTouched((prev) => ({
                      ...prev,
                      model: true,
                      country: true,
                      price: true,
                      description: true,
                      photos: true
                    }));
                    setShouldPulseInvalid(false);
                    toast.success(
                      'Form autofilled (photos must be added manually)',
                      {
                        duration: 2500,
                        position: 'top-right'
                      }
                    );
                  }}
                  className="px-3 py-2 rounded-lg bg-oceanblue text-white text-sm font-medium hover:bg-oceanblue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Autofill
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={async () => {
                    if (maxPhotos === 0) {
                      toast.error('This offer does not allow photo uploads', {
                        duration: 2500,
                        position: 'top-right'
                      });
                      return;
                    }

                    const fallbackModel = dragonflyModels[0]?.key || '';
                    const fallbackCountry = countries[0]?.key || '';
                    const fallbackCurrency = 'EUR';
                    const safePrice =
                      priceLimit && priceLimit > 0
                        ? Math.max(1000, Math.floor(priceLimit * 0.6))
                        : 250000;

                    setModel(fallbackModel);
                    setCountry(fallbackCountry);
                    setCurrency(fallbackCurrency);
                    setPriceBoat(safePrice);
                    setVatPaid(true);
                    setSpecifications(
                      specificationsData
                        .flatMap((s) => s.items.map((i) => i.key))
                        .slice(0, 4)
                    );
                    setDescription(
                      'Test listing (autofilled). Great condition, ready to sail. Contact me for details.'
                    );

                    try {
                      // Clear existing previews to avoid leaks
                      photoPreview.forEach((url) => URL.revokeObjectURL(url));

                      const demoPaths = [
                        '/images/boat-1.webp',
                        '/images/boat-2.webp',
                        '/images/boat-3.webp',
                        '/images/boat-4.webp'
                      ].slice(0, Math.max(1, maxPhotos));

                      const demoFiles: File[] = [];
                      const demoPreviews: string[] = [];

                      for (const p of demoPaths) {
                        const res = await fetch(p);
                        const blob = await res.blob();
                        const name = p.split('/').pop() || 'demo.webp';
                        const file = new File([blob], name, {
                          type: blob.type || 'image/webp'
                        });
                        demoFiles.push(file);
                        demoPreviews.push(URL.createObjectURL(file));
                      }

                      setPhotoFiles(demoFiles);
                      setPhotoPreview(demoPreviews);
                    } catch (e) {
                      console.error('Demo photo autofill failed:', e);
                      toast.error('Failed to load demo photos', {
                        duration: 2500,
                        position: 'top-right'
                      });
                    }

                    setTouched((prev) => ({
                      ...prev,
                      model: true,
                      country: true,
                      price: true,
                      description: true,
                      photos: true
                    }));
                    setShouldPulseInvalid(false);
                    toast.success('Autofilled with demo photos', {
                      duration: 2500,
                      position: 'top-right'
                    });
                  }}
                  className="px-3 py-2 rounded-lg bg-articblue text-white text-sm font-medium hover:bg-articblue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Autofill + photos
                </button>
              </div>
            </div>
            <div className="text-xs text-stonegrey">
              Note: real user file inputs can’t be auto-filled, but demo photos
              can be loaded from /public for testing.
            </div>
          </div>
        )}
        <div className="flex flex-col gap-6 sm:gap-[32px]">
          {/* Listing Type - 4 boutons */}
          <div className="flex flex-col gap-4">
            <label className="text-oceanblue text-md font-medium">
              Listing Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {orderedProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleProductChange(product.id)}
                  disabled={isLoading}
                  className={`
                    px-3 py-2 sm:px-6 sm:py-4 rounded-lg border-2 transition-all duration-300 text-sm sm:text-base
                    ${
                      selectedProductId === product.id
                        ? 'bg-articblue border-articblue text-white'
                        : 'bg-fullwhite border-articblue text-oceanblue hover:bg-articblue/10'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                    font-medium text-center
                  `}
                >
                  <span>{product.name}</span>
                  {product.prices[0] && (
                    <span className={`text-xs font-normal mt-0.5 block ${selectedProductId === product.id ? 'text-white/80' : 'text-stonegrey'}`}>
                      {formatPriceCurrency(
                        Number(product.prices[0].unitAmount ?? 0) / 100,
                        (product.prices[0].currency || 'eur').toUpperCase()
                      )}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sélecteur d'annonces en mode renewal */}
          {isRenewalMode && (
            <div className="flex flex-col gap-4">
              <label className="text-oceanblue text-md font-medium">
                Select an ad to renew
              </label>
              {loadingBoats ? (
                <div className="text-oceanblue text-center py-8">
                  Loading your ads...
                </div>
              ) : userBoats.length === 0 ? (
                <div className="text-oceanblue text-center py-8 border-2 border-stonegrey/20 rounded-lg bg-stonegrey/5">
                  No active ads available
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-4">
                    {userBoats.map((boat) => {
                      // Parse les photos si elles sont sous forme de chaîne JSON
                      const photos =
                        boat.photos && typeof boat.photos === 'string'
                          ? JSON.parse(boat.photos)
                          : boat.photos;

                      // Ajoute le préfixe à chaque URL de photo
                      const prefixedPhotos = Array.isArray(photos)
                        ? photos.map((photo: string) => `${photo}`)
                        : [];

                      // Sélectionne la première photo ou utilise une image par défaut
                      const imageUrl =
                        prefixedPhotos.length > 0
                          ? prefixedPhotos[0]
                          : '/images/default-boat-image.png';

                      // Formate la date de création
                      const formattedDate = boat.createdAt
                        ? new Date(boat.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'Unknown';

                      // Calcule la date d'expiration (3 mois par défaut, 4 mois pour podium)
                      // On ne peut pas savoir le plan original, donc on utilise 3 mois par défaut
                      const expirationDate = boat.createdAt
                        ? (() => {
                            const created = new Date(boat.createdAt);
                            const expiration = new Date(created);
                            // Par défaut 3 mois, mais on pourrait détecter podium par le nombre de photos (10 photos = podium = 4 mois)
                            const monthsToAdd =
                              boat.photos &&
                              Array.isArray(boat.photos) &&
                              boat.photos.length > 5
                                ? 4
                                : 3;
                            expiration.setMonth(
                              expiration.getMonth() + monthsToAdd
                            );
                            return expiration;
                          })()
                        : null;

                      const formattedExpirationDate = expirationDate
                        ? expirationDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'Unknown';

                      // Vérifie si l'annonce est expirée ou expire bientôt
                      const now = new Date();
                      const isExpired = expirationDate
                        ? expirationDate < now
                        : false;
                      const daysUntilExpiration = expirationDate
                        ? Math.ceil(
                            (expirationDate.getTime() - now.getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        : null;
                      const expiresSoon =
                        daysUntilExpiration !== null &&
                        daysUntilExpiration <= 7 &&
                        daysUntilExpiration > 0;

                      const formatPrice = (price: number): string =>
                        formatPriceNumber(price, boat.currency);

                      const isSelected = selectedBoatId === boat.id;

                      return (
                        <div
                          key={boat.id}
                          onClick={() => {
                            if (!isLoading) {
                              setSelectedBoatId(boat.id);
                              setTouched({ ...touched, boat: true });
                            }
                          }}
                          className={`
                            group flex flex-col sm:flex-row overflow-hidden transition-all cursor-pointer duration-300 rounded-[16px] relative
                            ${
                              isSelected
                                ? 'border-2 border-articblue shadow-lg'
                                : 'border-2 border-stonegrey hover:border-articblue'
                            }
                            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                            ${!selectedBoatId && touched.boat ? 'border-red-500' : ''}
                          `}
                        >
                          {/* Indicateur de sélection en haut à droite du bloc */}
                          <div className="absolute top-4 right-4 z-10">
                            {isSelected ? (
                              <div className="bg-articblue text-fullwhite rounded-full w-6 h-6 flex items-center justify-center">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2.5"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            ) : (
                              <div className="bg-stonegrey/30 border-2 border-stonegrey rounded-full w-6 h-6 flex items-center justify-center">
                                <svg
                                  className="w-4 h-4 text-stonegrey"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2.5"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Image avec effet de zoom */}
                          <div className="w-full sm:w-1/3 h-[150px] sm:h-auto flex justify-start items-end overflow-hidden relative">
                            <div className="absolute z-10 m-3 bg-fullwhite w-fit px-[10px] rounded-[7px] text-oceanblue">
                              {boat.country}
                            </div>
                            <div
                              className="w-full h-full bg-cover bg-center p-2 transition-transform duration-300 group-hover:scale-110"
                              style={{ backgroundImage: `url(${imageUrl})` }}
                            ></div>
                          </div>

                          {/* Contenu */}
                          <div className="flex flex-col p-3 sm:p-16 md:p-32 flex-1 bg-fullwhite justify-around">
                            <div className="flex flex-col">
                              <h3 className="text-16 sm:text-24 font-medium text-articblue truncate">
                                {getModelLabel(boat.model)}
                              </h3>
                            </div>

                            <div className="text-oceanblue flex flex-row text-14 sm:text-16 flex-wrap">
                              Price:
                              <span className="text-oceanblue font-medium text-14 sm:text-16 pl-2">
                                {formatPrice(Number(boat.price))}{' '}
                                {boat.currency}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1 mt-2">
                              <p className="text-oceanblue text-14 sm:text-16">
                                Expires:{' '}
                                <span
                                  className={`font-medium ${
                                    isExpired
                                      ? 'text-red-500'
                                      : expiresSoon
                                        ? 'text-orange-500'
                                        : 'text-oceanblue'
                                  }`}
                                >
                                  {formattedExpirationDate}
                                </span>
                              </p>
                              {isExpired && (
                                <p className="text-red-500 text-14 sm:text-16 font-medium">
                                  Expired
                                </p>
                              )}
                              {!isExpired && (
                                <p className="text-orange-500 text-14 sm:text-16 font-medium">
                                  Expires in {daysUntilExpiration} day
                                  {daysUntilExpiration !== 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {!selectedBoatId && touched.boat && (
                    <p className="text-red-500 text-sm">
                      Please select an ad to renew
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Model avec checkbox de validation */}
          {!isRenewalMode && (
            <div
              ref={modelFieldRef}
              className="flex flex-row gap-4 items-center"
            >
              <div className="flex-1">
                <Select
                  classNames={{
                    label: '!text-oceanblue text-md font-medium',
                    trigger: `bg-fullwhite border-2 border-oceanblue/10 data-[hover=true]:border-articblue data-[hover=true]:bg-articblue/10 transition-colors rounded-lg   ${!model && touched.model ? 'border-red-500 border-2' : ''}`,
                    value: 'text-oceanblue ',
                    listbox: 'bg-fullwhite',
                    popoverContent: 'bg-fullwhite'
                  }}
                  className="text-oceanblue h-[40px]"
                  labelPlacement="outside"
                  size="lg"
                  label="Model"
                  placeholder="Select a model"
                  selectedKeys={model ? [model] : []}
                  onChange={handleModelChange}
                  scrollShadowProps={{ isEnabled: false }}
                  isDisabled={isLoading}
                  isInvalid={!model && touched.model}
                  errorMessage={
                    !model && touched.model ? 'Please select a model' : ''
                  }
                >
                  {dragonflyModels.map((modele) => (
                    <SelectItem
                      key={modele.key}
                      classNames={{
                        base: '!text-oceanblue data-[hover=true]:!bg-articblue/10 !transition-colors',
                        title:
                          '!text-oceanblue data-[hover=true]:!text-articblue !transition-colors',
                        wrapper:
                          'data-[hover=true]:!bg-articblue/10 !transition-colors',
                        selectedIcon: '!text-articblue'
                      }}
                    >
                      {modele.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div className="pt-8">
                <ValidationCheckbox
                  isValid={!!model}
                  shouldPulse={shouldPulseInvalid && !model}
                />
              </div>
            </div>
          )}

          {/* Country avec checkbox de validation */}
          {!isRenewalMode && (
            <div
              ref={countryFieldRef}
              className="flex flex-row gap-4 items-center"
            >
              <div className="flex-1">
                <Select
                  className="text-oceanblue h-[40px]"
                  label="Country"
                  size="lg"
                  classNames={{
                    label: '!text-oceanblue text-md font-medium',
                    trigger: `bg-fullwhite border-2 border-oceanblue/10 data-[hover=true]:border-articblue data-[hover=true]:bg-articblue/10 transition-colors rounded-lg ${!country && touched.country ? 'border-red-500 border-2' : ''}`,
                    value: 'text-oceanblue',
                    listbox: 'bg-fullwhite',
                    popoverContent: 'bg-fullwhite'
                  }}
                  labelPlacement="outside"
                  placeholder="Select a country"
                  selectedKeys={country ? [country] : []}
                  onChange={handleCountryChange}
                  isDisabled={isLoading}
                  isInvalid={!country && touched.country}
                  errorMessage={
                    !country && touched.country ? 'Please select a country' : ''
                  }
                >
                  {countries.map(({ key, label, flag }) => (
                    <SelectItem
                      key={key}
                      classNames={{
                        base: '!text-oceanblue data-[hover=true]:!bg-articblue/10 !transition-colors',
                        title:
                          '!text-oceanblue data-[hover=true]:!text-articblue !transition-colors',
                        wrapper:
                          'data-[hover=true]:!bg-articblue/10 !transition-colors',
                        selectedIcon: '!text-articblue'
                      }}
                      startContent={
                        <Avatar alt={label} className="w-6 h-6" src={flag} />
                      }
                    >
                      {label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div className="pt-8">
                <ValidationCheckbox
                  isValid={!!country}
                  shouldPulse={shouldPulseInvalid && !country}
                />
              </div>
            </div>
          )}

          {/* Price avec checkbox de validation */}
          {!isRenewalMode && (
            <div className="flex flex-col w-full h-fit">
              <div
                ref={priceFieldRef}
                className="flex flex-row gap-4 items-center"
              >
                <div className="flex-1 flex flex-row gap-3 sm:gap-6 items-center justify-center">
                  <NumberInput
                    className="text-oceanblue placeholder:text-oceanblue max-h-[48px] h-[48px] w-full "
                    label="Price"
                    classNames={{
                      label: '!text-oceanblue text-md font-medium ',
                      inputWrapper: `px-3 shadow-sm max-h-[48px] h-[48px] bg-fullwhite border-2 border-oceanblue/10 data-[hover=true]:border-articblue data-[hover=true]:bg-articblue/10 transition-colors rounded-lg ${
                        (priceBoat <= 0 && touched.price) || isPriceOverLimit
                          ? 'border-red-500 border-2'
                          : ''
                      }`,
                      mainWrapper: 'w-full flex flex-col gap-1 ',
                      input:
                        'placeholder:text-oceanblue/40 outline-none w-full bg-transparent max-h-[44px]',
                      errorMessage: 'text-red-500 text-xs mt-1'
                    }}
                    labelPlacement="outside"
                    placeholder={
                      priceLimit
                        ? `Up to ${getCurrencySymbol(currency)}${formatPriceNumber(priceLimit, currency)}`
                        : 'Enter price (no limit)'
                    }
                    value={priceBoat}
                    onValueChange={(safeVal) => {
                      setPriceBoat(safeVal);
                      setTouched({ ...touched, price: true });
                    }}
                    isDisabled={isLoading}
                    isInvalid={
                      (priceBoat <= 0 && touched.price) || isPriceOverLimit
                    }
                    currency={currency}
                  />

                  <Select
                    classNames={{
                      label: '!text-oceanblue text-md font-medium',
                      trigger:
                        ' bg-fullwhite border-2 border-oceanblue/10 data-[hover=true]:border-articblue data-[hover=true]:bg-articblue/10 transition-colors rounded-lg',
                      value: 'text-oceanblue',
                      listbox: 'bg-fullwhite',
                      popoverContent: 'bg-fullwhite'
                    }}
                    className="text-oceanblue h-[48px] max-w-[100px] mt-[4px]"
                    labelPlacement="outside"
                    size="lg"
                    scrollShadowProps={{ isEnabled: false }}
                    startContent={getCurrencySymbol(currency)}
                    label="Currency"
                    defaultSelectedKeys={['USD']}
                    selectedKeys={currency ? [currency] : ['USD']}
                    onChange={handleCurrencyChange}
                    isDisabled={isLoading}
                  >
                    {currencies.map((curr) => (
                      <SelectItem
                        key={curr.key}
                        classNames={{
                          base: '!text-oceanblue data-[hover=true]:!bg-articblue/10 !transition-colors',
                          title:
                            '!text-oceanblue data-[hover=true]:!text-articblue !transition-colors',
                          wrapper:
                            'data-[hover=true]:!bg-articblue/10 !transition-colors',
                          selectedIcon: '!text-articblue'
                        }}
                      >
                        {curr.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="pt-8">
                  <ValidationCheckbox
                    isValid={priceBoat > 0 && !isPriceOverLimit}
                    shouldPulse={
                      shouldPulseInvalid && (priceBoat <= 0 || isPriceOverLimit)
                    }
                  />
                </div>
              </div>
              {!isRenewalMode &&
                isPriceOverLimit &&
                priceLimit &&
                upgradePlan && (
                  <div className=" min-w-full mt-3 flex flex-row items-center justify-between max-w-[420px] rounded-lg border border-red-300 bg-red-50 p-2 sm:p-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 w-full">
                      <div className="text-xs sm:text-sm text-red-800">
                        <p className="font-semibold">
                          Price too high for {selectedProduct?.name}
                        </p>
                        <p className="mt-1">
                          Limit: {getCurrencySymbol(currency)}
                          {formatPriceNumber(priceLimit, currency)}. Upgrade to{' '}
                          <strong>{upgradePlan}</strong> to list at this price.
                        </p>
                      </div>
                      {upgradeProduct && (
                        <button
                          type="button"
                          onClick={() => handleProductChange(upgradeProduct.id)}
                          className="shrink-0 px-3 py-2 bg-articblue text-white rounded-lg hover:bg-articblue/90 transition-colors text-sm font-medium"
                        >
                          Upgrade
                        </button>
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          {!isRenewalMode && (
            <Select
              selectionMode="multiple"
              className="text-oceanblue h-[40px] max-w-[512px]"
              size="lg"
              classNames={{
                label: '!text-oceanblue text-md font-medium',
                trigger:
                  'bg-fullwhite border-2 border-oceanblue/10 data-[hover=true]:border-articblue data-[hover=true]:bg-articblue/10 transition-colors rounded-lg',
                value: 'text-oceanblue',
                listbox: 'bg-fullwhite',
                popoverContent: 'bg-fullwhite'
              }}
              labelPlacement="outside"
              label="Specifications"
              placeholder="Select features"
              selectedKeys={new Set(specifications)}
              onSelectionChange={handleSpecificationsChange}
              isDisabled={isLoading}
            >
              {specificationsData.map((section, index) => (
                <SelectSection
                  key={section.title}
                  title={section.title}
                  showDivider={index !== specificationsData.length - 1}
                >
                  {section.items.map((item) => (
                    <SelectItem
                      key={item.key}
                      classNames={{
                        base: '!text-oceanblue data-[hover=true]:!bg-articblue/10 !transition-colors rounded-lg',
                        title:
                          '!text-oceanblue data-[hover=true]:!text-articblue !transition-colors',
                        wrapper:
                          'data-[hover=true]:!bg-articblue/10 !transition-colors rounded-lg',
                        selectedIcon: '!text-articblue'
                      }}
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectSection>
              ))}
            </Select>
          )}

          {!isRenewalMode && (
            <Checkbox
              color="success"
              classNames={{
                icon: 'text-fullwhite rounded-lg',
                label: '!text-oceanblue text-md font-medium'
              }}
              isSelected={vatPaid}
              onValueChange={handleVatPaidChange}
              isDisabled={isLoading}
            >
              VAT paid
            </Checkbox>
          )}

          {/* Description avec checkbox de validation */}
          {!isRenewalMode && (
            <div
              ref={descriptionFieldRef}
              className="flex flex-row gap-4 items-center"
            >
              <div className="flex-1">
                <Textarea
                  classNames={{
                    label: '!text-oceanblue text-md font-medium ',
                    inputWrapper: `bg-fullwhite border-2 border-oceanblue/10 data-[hover=true]:bg-articblue/10 data-[hover=true]:border-articblue data-[focus=true]:border-articblue data-[focus=true]:bg-fullwhite transition-colors ${(description.length < 300 || description.length > 3500) && touched.description ? 'border-red-500' : ''}`,
                    input: 'placeholder:text-oceanblue',
                    base: ' border-oceanblue/10 data-[hover=true]:border-articblue   data-[focus=true]:border-articblue data-[focus=true]:bg-fullwhite transition-colors rounded-lg'
                  }}
                  className="text-oceanblue"
                  labelPlacement="outside"
                  size="lg"
                  label="Description "
                  minRows={6}
                  placeholder="Enter your description (min. 20 characters)"
                  value={description}
                  onValueChange={(val) => {
                    setDescription(val);
                    setTouched({ ...touched, description: true });
                  }}
                  isDisabled={isLoading}
                  description={`${description.length} / 3500 characters`}
                />
              </div>
              <div className="pt-8">
                <ValidationCheckbox
                  isValid={
                    description.length >= 300 && description.length <= 3500
                  }
                  shouldPulse={
                    shouldPulseInvalid &&
                    (description.length < 300 || description.length > 3500)
                  }
                />
              </div>
            </div>
          )}

          {/* Email avec checkbox de validation */}
          {!isRenewalMode && (
            <div className="flex flex-row gap-4 items-center">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-oceanblue text-md font-medium">Contact Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={contactEmail}
                  onChange={(e) => {
                    setContactEmail(e.target.value);
                    setTouched({ ...touched, email: true });
                  }}
                  disabled={isLoading}
                  className={`w-full h-[48px] px-3 text-oceanblue bg-fullwhite border-2 rounded-lg outline-none transition-colors placeholder:text-oceanblue/40 ${
                    touched.email && (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
                      ? 'border-red-500'
                      : 'border-oceanblue/10 hover:border-articblue hover:bg-articblue/10'
                  }`}
                />
                {touched.email && (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) && (
                  <span className="text-red-500 text-xs">Please enter a valid email</span>
                )}
              </div>
              <div className="pt-6">
                <ValidationCheckbox
                  isValid={!!contactEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)}
                  shouldPulse={shouldPulseInvalid && (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))}
                />
              </div>
            </div>
          )}

          {/* Condition avec checkbox de validation */}
          {!isRenewalMode && (
            <div className="flex flex-row gap-4 items-center">
              <div className="flex-1">
                <Select
                  className="text-oceanblue h-[40px]"
                  label="Condition"
                  size="lg"
                  classNames={{
                    label: '!text-oceanblue text-md font-medium',
                    trigger: `bg-fullwhite border-2 border-oceanblue/10 data-[hover=true]:border-articblue data-[hover=true]:bg-articblue/10 transition-colors rounded-lg`,
                    value: 'text-oceanblue',
                    listbox: 'bg-fullwhite',
                    popoverContent: 'bg-fullwhite'
                  }}
                  labelPlacement="outside"
                  placeholder="Select condition"
                  selectedKeys={condition ? [condition] : []}
                  onChange={(e) => setCondition(e.target.value)}
                  isDisabled={isLoading}
                >
                  {boatConditions.map(({ key, label }) => (
                    <SelectItem
                      key={key}
                      classNames={{
                        base: '!text-oceanblue data-[hover=true]:!bg-articblue/10 !transition-colors',
                        title: '!text-oceanblue data-[hover=true]:!text-articblue !transition-colors',
                        selectedIcon: '!text-articblue'
                      }}
                    >
                      {label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div className="pt-8">
                <ValidationCheckbox
                  isValid={!!condition}
                  optional
                />
              </div>
            </div>
          )}

          {/* Year avec checkbox de validation */}
          {!isRenewalMode && (
            <div className="flex flex-row gap-4 items-center">
              <div className="flex-1">
                <Select
                  className="text-oceanblue h-[40px]"
                  label="Year"
                  size="lg"
                  classNames={{
                    label: '!text-oceanblue text-md font-medium',
                    trigger: `bg-fullwhite border-2 border-oceanblue/10 data-[hover=true]:border-articblue data-[hover=true]:bg-articblue/10 transition-colors rounded-lg`,
                    value: 'text-oceanblue',
                    listbox: 'bg-fullwhite',
                    popoverContent: 'bg-fullwhite'
                  }}
                  labelPlacement="outside"
                  placeholder="Select year"
                  selectedKeys={year ? [String(year)] : []}
                  onChange={(e) => {
                    const v = e.target.value;
                    setYear(v ? parseInt(v, 10) : null);
                  }}
                  isDisabled={isLoading}
                >
                  {getBoatYears().map((y) => (
                    <SelectItem
                      key={String(y)}
                      classNames={{
                        base: '!text-oceanblue data-[hover=true]:!bg-articblue/10 !transition-colors',
                        title: '!text-oceanblue data-[hover=true]:!text-articblue !transition-colors',
                        selectedIcon: '!text-articblue'
                      }}
                    >
                      {String(y)}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div className="pt-8">
                <ValidationCheckbox isValid={!!year} optional />
              </div>
            </div>
          )}

          {/* Photos avec checkbox de validation */}
          {!isRenewalMode && (
            <>
              {maxPhotos > 0 ? (
                <div
                  ref={photosFieldRef}
                  className="flex flex-row gap-4 items-start"
                >
                  <div className="flex-1 space-y-4">
                    <label className="block !text-oceanblue text-md font-medium">
                      Photos
                    </label>

                    {/* Input file caché */}
                    <input
                      id="photo-upload-input"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                      className="hidden"
                      disabled={isLoading}
                    />

                    {/* Grille de cases de preview */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                      {Array.from({ length: maxPhotos }).map((_, index) => {
                        const hasPhoto = index < photoPreview.length;
                        const preview = photoPreview[index];

                        return (
                          <div
                            key={index}
                            className={`
                        relative aspect-square rounded-lg border-2 overflow-hidden
                        transition-all duration-300 cursor-pointer
                        ${
                          hasPhoto
                            ? 'border-articblue'
                            : dragOverIndex === index
                              ? 'border-articblue border-solid bg-articblue/10 scale-105'
                              : 'border-dashed border-stonegrey/40 hover:border-articblue/60 bg-stonegrey/5'
                        }
                        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                            onClick={() =>
                              !isLoading && handlePhotoClick(index)
                            }
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                          >
                            {hasPhoto ? (
                              <>
                                <img
                                  src={preview}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {!isLoading && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removePhoto(index);
                                    }}
                                    className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white rounded-full w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                                    aria-label="Remove photo"
                                  >
                                    <svg
                                      className="w-3 h-3 sm:w-4 sm:h-4"
                                      fill="none"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2.5"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] sm:text-xs py-0.5 sm:py-1 px-1 sm:px-2 text-center">
                                  Photo {index + 1}
                                </div>
                              </>
                            ) : (
                              <div
                                className={`w-full h-full flex flex-col items-center justify-center transition-colors ${
                                  dragOverIndex === index
                                    ? 'text-articblue'
                                    : 'text-stonegrey hover:text-articblue'
                                }`}
                              >
                                {dragOverIndex === index ? (
                                  <>
                                    <svg
                                      className="w-8 h-8 sm:w-12 sm:h-12 mb-1 sm:mb-2 animate-pulse"
                                      fill="none"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span className="text-xs sm:text-sm font-semibold">
                                      Drop photo here
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      className="w-6 h-6 sm:w-10 sm:h-10 mb-1 sm:mb-2"
                                      fill="none"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="1.5"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="text-xs font-medium">
                                      Add photo
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <p className="text-xs text-stonegrey">
                      {photoFiles.length} / {maxPhotos} photos
                    </p>
                  </div>
                  <div className="pt-8">
                    <ValidationCheckbox
                      isValid={photoFiles.length > 0}
                      shouldPulse={
                        shouldPulseInvalid && photoFiles.length === 0
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-row gap-4 items-start">
                  <div className="flex-1 space-y-4">
                    <label className="block text-oceanblue font-medium">
                      Photos
                    </label>
                    <div className="p-4 bg-stonegrey/10 rounded-lg border border-stonegrey/20">
                      <p className="text-sm text-stonegrey">
                        This offer does not include photo uploads.
                      </p>
                    </div>
                  </div>
                  <div className="pt-8">
                    <ValidationCheckbox isValid={true} optional={true} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Payment Element à droite */}
      <div className="w-full lg:max-w-md border-2 border-oceanblue/10 p-3 sm:p-4 md:p-6 gap-4 sm:gap-[24px] flex flex-col rounded-2xl self-start lg:sticky top-[120px]">
        <h1 className="text-18 sm:text-20 lg:text-24 text-oceanblue">Order summary</h1>
        <div className="flex flex-col gap-6 sm:gap-[32px]">
          <div className="flex flex-col gap-4 sm:gap-[24px] px-3 sm:px-[20px] border-2 border-articblue rounded-lg p-3 sm:p-4 text-oceanblue text-sm sm:text-base">
            {/* Limite de prix */}
            <div className="flex flex-col gap-[12px]">
              <div className="text-oceanblue text-20 font-medium">
                {selectedProduct?.name || 'Start line'}
              </div>
              <div className="flex flex-row gap-[10px] items-center text-oceanblue">
                <Valide />
                <p>
                  {getPriceLimitSummaryText(
                    selectedProduct?.name,
                    getCurrencySymbol(currency),
                    currency
                  )}
                </p>
              </div>
              {/* Nombre de photos */}
              <div className="flex flex-row gap-[10px] items-center text-oceanblue">
                <Valide />
                <p>
                  {maxPhotos > 0
                    ? `Includes ${maxPhotos} photo${maxPhotos > 1 ? 's' : ''}${
                        wantExtraPhotos && addOnsAllowed
                          ? ` (${planMaxPhotos} + 5 extras)`
                          : ''
                      }`
                    : 'No photos included'}
                </p>
              </div>
              {/* Durée */}
              <div className="flex flex-row gap-[10px] items-center text-oceanblue">
                <Valide />
                <p>Duration of {duration.text}</p>
              </div>
              {wantVideo && addOnsAllowed && (
                <div className="flex flex-row gap-[10px] items-center text-oceanblue">
                  <Valide />
                  <p>Video link included</p>
                </div>
              )}
            </div>
            <div className="w-full h-[1px] bg-stonegrey"></div>
            {addOnsAmountCents > 0 && (
              <div className="flex flex-col gap-1 text-sm text-stonegrey">
                <div className="flex flex-row justify-between">
                  <span>Plan</span>
                  <span>{planPriceString}</span>
                </div>
                {wantExtraPhotos && addOnsAllowed && photoAddOnPrice && (
                  <div className="flex flex-row justify-between">
                    <span>+5 photos</span>
                    <span>
                      {formatPriceCurrency(
                        photoAddOnAmount / 100,
                        photoAddOnPrice.currency || 'eur'
                      )}
                    </span>
                  </div>
                )}
                {wantVideo && addOnsAllowed && videoAddOnPrice && (
                  <div className="flex flex-row justify-between">
                    <span>Video</span>
                    <span>
                      {formatPriceCurrency(
                        videoAddOnAmount / 100,
                        videoAddOnPrice.currency || 'eur'
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}
            <div className="flex flex-row gap-[10px] text-18 justify-between text-darkgrey font-semibold">
              <p>Total</p>
              <p>{priceString}</p>
            </div>
          </div>

          {/* Optional add-ons */}
          {addOnsAllowed && (photoAddOnPrice || videoAddOnPrice) && (
            <div className="flex flex-col gap-3 px-3 sm:px-[20px] border-2 border-oceanblue/20 rounded-lg p-3 sm:p-4 text-oceanblue">
              <div className="text-oceanblue text-18 font-medium">
                Optional add-ons
              </div>
              {photoAddOnPrice && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wantExtraPhotos}
                    onChange={(e) => setWantExtraPhotos(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-articblue"
                  />
                  <div className="flex-1 flex flex-row justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">+5 extra photos</div>
                      <div className="text-xs text-stonegrey">
                        Add 5 more photo slots
                      </div>
                    </div>
                    <div className="text-sm font-semibold">
                      {formatPriceCurrency(
                        photoAddOnAmount / 100,
                        photoAddOnPrice.currency || 'eur'
                      )}
                    </div>
                  </div>
                </label>
              )}
              {videoAddOnPrice && (
                <div className="flex flex-col gap-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wantVideo}
                      onChange={(e) => setWantVideo(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-articblue"
                    />
                    <div className="flex-1 flex flex-row justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">Video link</div>
                        <div className="text-xs text-stonegrey">
                          Embed YouTube, Vimeo or Dailymotion
                        </div>
                      </div>
                      <div className="text-sm font-semibold">
                        {formatPriceCurrency(
                          videoAddOnAmount / 100,
                          videoAddOnPrice.currency || 'eur'
                        )}
                      </div>
                    </div>
                  </label>
                  {wantVideo && (
                    <input
                      type="url"
                      value={videoUrlInput}
                      onChange={(e) => setVideoUrlInput(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 text-sm border border-stonegrey/30 rounded-md focus:outline-none focus:border-articblue"
                    />
                  )}
                  {wantVideo &&
                    videoUrlInput &&
                    !isValidVideoUrl(videoUrlInput) && (
                      <p className="text-xs text-orange-600">
                        Must be a valid YouTube, Vimeo or Dailymotion URL.
                      </p>
                    )}
                </div>
              )}
            </div>
          )}

          {/* Payment Element */}
          {user &&
          selectedPrice &&
          selectedPrice.unitAmount &&
          selectedPrice.unitAmount > BigInt(0) &&
          clientSecret ? (
            <Elements
              key={clientSecret}
              stripe={stripePromise}
              options={{
                clientSecret: clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#6cacaf'
                  }
                }
              }}
            >
              <StripePaymentForm
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onBeforePayment={handleBeforePayment}
                amount={Number(selectedPrice.unitAmount)}
                currency={selectedPrice.currency || 'eur'}
                priceId={selectedPrice.id}
                productId={selectedProductId}
                userId={user.id}
                paymentIntentId={paymentIntentId}
                returnUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/account`}
              />
            </Elements>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800">
              <p className="font-semibold">Payment Loading...</p>
              {/* <p className="text-sm mt-1">
                {!user && 'Please sign in'}
                {!selectedPrice && 'Loading price...'}
                {selectedPrice &&
                  (!selectedPrice.unitAmount ||
                    selectedPrice.unitAmount === BigInt(0)) &&
                  'Invalid price'}
                {user &&
                  selectedPrice &&
                  !clientSecret &&
                  'Initializing payment...'}
              </p> */}
            </div>
          )}

          <div className="flex flex-col justify-center">
            <div className="flex flex-row justify-center items-center text-articblue gap-1">
              <Lock />
              <p className="text-darkgrey text-xs sm:text-base">Secure Checkout - SSL Encrypted</p>
            </div>
            <div className="flex flex-row justify-center items-center gap-[10px]">
              <p className="flex flex-col justify-center text-stonegrey text-[10px] sm:text-[12px]">
                Ensuring your financial and personal details are secure during
                every transaction.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
