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
  specificationsData
} from './BoatListingForm';
import {
  getMaxPhotos,
  getPriceLimit,
  getDuration,
  getUpgradePlan,
  getPriceLimitSummaryText
} from '@/lib/product-features';

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
    return [...products].sort(
      (a, b) => order[classifyPlan(a.name)] - order[classifyPlan(b.name)]
    );
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

  // Créer le PaymentIntent au chargement
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!selectedPrice || !selectedPrice.unitAmount || !user) {
        return;
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
            metadata: {
              listing_type: 'boat',
              user_id: user.id
            }
          })
        });

        const result = await response.json();

        if (response.ok && result.clientSecret) {
          setClientSecret(result.clientSecret);
          setPaymentIntentId(result.paymentIntentId);
          console.log('✅ Payment intent created:', result.paymentIntentId);
        } else {
          console.error('❌ Failed to create payment intent:', result.error);
        }
      } catch (error) {
        console.error('❌ Error creating payment intent:', error);
      }
    };

    createPaymentIntent();
  }, [selectedPrice, user]);

  // Utiliser les fonctions importées depuis la configuration partagée
  const maxPhotos = getMaxPhotos(selectedProduct?.name);
  const priceLimit = getPriceLimit(selectedProduct?.name);
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
          (description.length < 20 || description.length > 2000) &&
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
            {priceLimit.toLocaleString()}). Upgrade to{' '}
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
      const data = await response.json();

      if (data.success && data.boats) {
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
    return desc.length <= 2000;
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
        `This price exceeds your plan limit (${getCurrencySymbol(currency)}${priceLimit.toLocaleString()}). Please upgrade your plan.`
      );
    }
    if (description.length < 20)
      errors.push('Description must be at least 20 characters');
    if (description.length > 2000)
      errors.push('Description must be less than 2000 characters');
    if (maxPhotos > 0 && photoFiles.length === 0)
      errors.push('Please add at least one photo');

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleBeforePayment = async (): Promise<{
    success: boolean;
    boatId?: string;
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
      return { success: false };
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
      return { success: false };
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

      if (photoFiles.length > 0) {
        console.log(`📸 Uploading ${photoFiles.length} photos...`);
        setUploadingPhotos(true);
        const uploadPromise = (async () => {
          const uploadFormData = new FormData();
          const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          uploadFormData.append('sessionId', sessionId);

          photoFiles.forEach((file, index) => {
            uploadFormData.append(`file${index}`, file);
          });

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData
          });

          const uploadResult = await uploadResponse.json();

          if (uploadResult.success) {
            tempImageKeys =
              uploadResult.keys || (uploadResult.key ? [uploadResult.key] : []);
            console.log('✅ Images uploaded:', tempImageKeys);
            return tempImageKeys.length;
          } else {
            throw new Error(uploadResult.error || 'Upload failed');
          }
        })();

        toast.promise(uploadPromise, {
          loading: `Uploading ${photoFiles.length} image(s)...`,
          success: (count) => `${count} image(s) uploaded successfully!`,
          error: 'Failed to upload images'
        });

        await uploadPromise;
        setUploadingPhotos(false);
      } else {
        console.log('ℹ️ No photos to upload');
      }

      console.log('🚤 Creating boat...');
      const boatResponse = await fetch('/api/boats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          price: priceBoat,
          country,
          description,
          photos: tempImageKeys,
          currency,
          specifications,
          vatPaid
        })
      });

      const boatResult = await boatResponse.json();
      console.log('📋 Boat creation response:', boatResult);

      if (!boatResult.success) {
        console.error('❌ Boat creation failed:', boatResult.error);
        toast.error(boatResult.error || 'Failed to create listing', {
          duration: 4000,
          position: 'top-right'
        });
        setIsLoading(false);
        return { success: false };
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
      toast.error('An unexpected error occurred', {
        duration: 4000,
        position: 'top-right'
      });
      setIsLoading(false);
      setUploadingPhotos(false);
      return { success: false };
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
          body: JSON.stringify({ boatId: selectedBoatId })
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

    setTimeout(() => router.push('/account?section=ads&payment=success'), 1500);
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

  const priceString = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: selectedPrice?.currency || 'USD',
    minimumFractionDigits: 0
  }).format(Number(selectedPrice?.unitAmount || 0) / 100);

  if (!products.length || !selectedPrice) {
    return <div>Erreur: Aucun produit disponible</div>;
  }

  const isFormValid = validateForm().isValid;

  return (
    <div className="flex flex-row w-full justify-center gap-[150px] pb-[112px]  mx-auto max-w-screen-2xl px-6">
      {/* Formulaire au centre */}
      <div className=" flex-1 max-w-lg  flex flex-col gap-[32px] rounded-[24px]">
        <h1 className="text-40 text-oceanblue">
          <span className="text-articblue">
            {isRenewalMode ? 'Renew' : 'Create'}
          </span>{' '}
          your advert
        </h1>
        <div className="flex flex-col gap-[32px]">
          {/* Listing Type - 4 boutons */}
          <div className="flex flex-col gap-4">
            <label className="text-oceanblue text-md font-medium">
              Listing Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              {orderedProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleProductChange(product.id)}
                  disabled={isLoading}
                  className={`
                    px-6 py-4 rounded-lg border-2 transition-all duration-300
                    ${
                      selectedProductId === product.id
                        ? 'bg-articblue border-articblue text-white'
                        : 'bg-fullwhite border-articblue text-oceanblue hover:bg-articblue/10'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                    font-medium text-center
                  `}
                >
                  {product.name}
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

                      // Formate le prix
                      const formatPrice = (price: number): string => {
                        return new Intl.NumberFormat('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(price);
                      };

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
                            group flex flex-row overflow-hidden transition-all cursor-pointer duration-300 rounded-[16px] relative
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
                          <div className="w-1/3 flex justify-start items-end overflow-hidden relative">
                            <div className="absolute z-10 m-3 bg-fullwhite w-fit px-[10px] rounded-[7px] text-oceanblue">
                              {boat.country}
                            </div>
                            <div
                              className="w-full h-full bg-cover bg-center p-2 transition-transform duration-300 group-hover:scale-110"
                              style={{ backgroundImage: `url(${imageUrl})` }}
                            ></div>
                          </div>

                          {/* Contenu */}
                          <div className="flex flex-col p-32 flex-1 bg-fullwhite justify-around">
                            <div className="flex flex-col">
                              <h3 className="text-24 font-medium text-articblue">
                                {boat.model}
                              </h3>
                            </div>

                            <div className="text-oceanblue flex flex-row text-16">
                              Price:
                              <span className="text-oceanblue font-medium text-16 pl-2">
                                {formatPrice(Number(boat.price))}{' '}
                                {boat.currency}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1 mt-2">
                              <p className="text-oceanblue text-16">
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
                                <p className="text-red-500 text-16 font-medium">
                                  Expired
                                </p>
                              )}
                              {!isExpired && (
                                <p className="text-orange-500 text-16 font-medium">
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
                <div className="flex-1 flex flex-row gap-24 items-center justify-center">
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
                        ? `Up to ${getCurrencySymbol(currency)}${priceLimit.toLocaleString()}`
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
                  <div className=" min-w-full mt-3 flex flex-row items-center justify-between max-w-[420px] rounded-lg border border-red-300 bg-red-50 p-3">
                    <div className="flex flex-row items-center justify-between gap-3 w-full">
                      <div className="text-sm text-red-800">
                        <p className="font-semibold">
                          Price too high for {selectedProduct?.name}
                        </p>
                        <p className="mt-1">
                          Limit: {getCurrencySymbol(currency)}
                          {priceLimit.toLocaleString()}. Upgrade to{' '}
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
                    inputWrapper: `bg-fullwhite border-2 border-oceanblue/10 data-[hover=true]:bg-articblue/10 data-[hover=true]:border-articblue data-[focus=true]:border-articblue data-[focus=true]:bg-fullwhite transition-colors ${(description.length < 20 || description.length > 2000) && touched.description ? 'border-red-500' : ''}`,
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
                  description={`${description.length} / 2000 characters`}
                />
              </div>
              <div className="pt-8">
                <ValidationCheckbox
                  isValid={
                    description.length >= 20 && description.length <= 2000
                  }
                  shouldPulse={
                    shouldPulseInvalid &&
                    (description.length < 20 || description.length > 2000)
                  }
                />
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
                    <div className="grid grid-cols-3 gap-4">
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
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                                    aria-label="Remove photo"
                                  >
                                    <svg
                                      className="w-4 h-4"
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
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 px-2 text-center">
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
                                      className="w-12 h-12 mb-2 animate-pulse"
                                      fill="none"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span className="text-sm font-semibold">
                                      Drop photo here
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <svg
                                      className="w-10 h-10 mb-2"
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
      <div className="w-full max-w-md border-2 border-oceanblue/10 p-6 gap-[24px] flex flex-col rounded-2xl self-start sticky top-[70px] ">
        <h1 className="text-24 text-oceanblue">Order summary</h1>
        <div className="flex flex-col gap-[32px]">
          <div className="flex flex-col gap-[24px] px-[20px] border-2 border-articblue rounded-lg p-4 text-oceanblue ">
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
                    getCurrencySymbol(currency)
                  )}
                </p>
              </div>
              {/* Nombre de photos */}
              <div className="flex flex-row gap-[10px] items-center text-oceanblue">
                <Valide />
                <p>
                  {maxPhotos > 0
                    ? `Includes ${maxPhotos} photo${maxPhotos > 1 ? 's' : ''}`
                    : 'No photos included'}
                </p>
              </div>
              {/* Durée */}
              <div className="flex flex-row gap-[10px] items-center text-oceanblue">
                <Valide />
                <p>Duration of {duration.text}</p>
              </div>
            </div>
            <div className="w-full h-[1px] bg-stonegrey"></div>
            <div className="flex flex-row gap-[10px] text-18 justify-between text-darkgrey font-semibold">
              <p>Total</p>
              <p>{priceString}</p>
            </div>
          </div>

          {/* Payment Element */}
          {user &&
          selectedPrice &&
          selectedPrice.unitAmount &&
          selectedPrice.unitAmount > BigInt(0) &&
          clientSecret ? (
            <Elements
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
                userId={user.id}
                paymentIntentId={paymentIntentId}
                returnUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/account?section=ads&payment=success`}
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
            <div className="flex flex-row justify-center items-center text-articblue">
              <Lock />
              <p className="text-darkgrey">Secure Checkout - SSL Encrypted</p>
            </div>
            <div className="flex flex-row justify-center items-center gap-[10px]">
              <p className="flex flex-col justify-center text-stonegrey text-[12px]">
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
