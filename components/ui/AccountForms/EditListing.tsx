'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { UserSimple, ProductWithPrices } from '@/types/database';
import { handleRequest } from '@/utils/auth-helpers/client';
import { updateListing } from '@/utils/auth-helpers/server';
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
import { Boat } from '@/types/database';
import {
  getMaxPhotos,
  getPriceLimit,
  getDuration,
  getUpgradePlan,
  getPriceLimitSummaryText
} from '@/lib/product-features';

import {
  dragonflyModels,
  currencies,
  countries,
  boatConditions
} from '@/utils/constants';
import { specificationsData } from '@/utils/specifications';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE ??
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
    ''
);

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
              ? 'bg-articblue scale-110'
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

export default function EditListing({
  boat
}: {
  boat: Boat & { user?: any; plan?: string };
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false); // General loading state for form disabling
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Upgrade states
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState(false);
  const [selectedUpgradeProductId, setSelectedUpgradeProductId] =
    useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');

  // Save states
  const [isSaving, setIsSaving] = useState(false);
  const [saveCompleted, setSaveCompleted] = useState(false);

  // Success message state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Products for upgrade
  const [products, setProducts] = useState<any[]>([]);

  // Validation states
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [shouldPulseInvalid, setShouldPulseInvalid] = useState(false);

  // Refs for scrolling to invalid fields
  const modelFieldRef = useRef<HTMLDivElement>(null);
  const priceFieldRef = useRef<HTMLDivElement>(null);
  const countryFieldRef = useRef<HTMLDivElement>(null);
  const descriptionFieldRef = useRef<HTMLDivElement>(null);
  const photosFieldRef = useRef<HTMLDivElement>(null);

  // Form states - add type safety checks
  const [model, setModel] = useState(
    typeof boat.model === 'string' ? boat.model : ''
  );
  const [country, setCountry] = useState(
    typeof boat.country === 'string' ? boat.country : ''
  );
  const [priceBoat, setPriceBoat] = useState(
    typeof boat.price === 'number' ? boat.price : 0
  );
  const [currency, setCurrency] = useState(
    typeof boat.currency === 'string' ? boat.currency : 'USD'
  );

  // Handle specifications with proper type checking
  const [specifications, setSpecifications] = useState<string[]>(() => {
    // Specifications are already parsed on the server side
    return Array.isArray(boat.specifications) ? boat.specifications : [];
  });

  // Helper function for plan classification
  const classifyPlan = (name: string | null | undefined) => {
    const n = (name || '').toLowerCase().trim();
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

  const normalizePlanName = (name: string | null | undefined) =>
    (name || '').toLowerCase().trim();

  // Photo upload state with proper type checking
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>(() => {
    // Photos are already parsed on the server side
    return Array.isArray(boat.photos) ? boat.photos : [];
  });

  const [existingPhotos, setExistingPhotos] = useState<string[]>(() => {
    // Photos are already parsed on the server side
    return Array.isArray(boat.photos) ? boat.photos : [];
  });

  // Track which existing photos are being replaced
  const [replacedPhotoIndices, setReplacedPhotoIndices] = useState<Set<number>>(
    new Set()
  );

  // Track the original URLs of replaced photos (to delete from R2)
  const [replacedPhotoUrls, setReplacedPhotoUrls] = useState<Map<number, string>>(
    new Map()
  );

  // Use the plan determined from payments (passed from the page)
  const [currentPlan, setCurrentPlan] = useState(
    (boat as any).plan || 'start line'
  );

  // Apply plan limitations
  const maxPhotos = getMaxPhotos(currentPlan);
  const priceLimit = getPriceLimit(currentPlan);
  const upgradePlan = getUpgradePlan(currentPlan);
  const durationData = getDuration(currentPlan);
  const duration =
    typeof durationData === 'object' ? durationData.months : durationData;

  const [vatPaid, setVatPaid] = useState(!!(boat as any).vatPaid);
  const [contactEmail, setContactEmail] = useState(
    typeof (boat as any).email === 'string' ? (boat as any).email : (boat.user?.email || '')
  );
  const [condition, setCondition] = useState(
    typeof (boat as any).condition === 'string' ? (boat as any).condition : ''
  );
  const [description, setDescription] = useState(
    typeof boat.description === 'string' ? boat.description : ''
  );

  const PRICE_LIMIT_TOAST_ID = 'price-limit-upgrade';
  const isPriceOverLimit = !!priceLimit && priceBoat > priceLimit;

  const getCurrencySymbol = (currency: string | null) => {
    if (!currency) return '';
    const currencyData = currencies.find(
      (c) => c.key === currency.toUpperCase()
    );
    return currencyData ? currencyData.symbol : currency.toUpperCase();
  };

  // Upgrade product logic
  const upgradeProduct = useMemo(() => {
    if (!upgradePlan) return null;
    const planName = upgradePlan.toLowerCase();
    return products.find((p) => {
      const productName = p.name?.toLowerCase() || '';
      return (
        productName.includes(planName) ||
        productName.includes(planName.replace('-', '')) ||
        productName.includes(planName.replace('-', ' '))
      );
    });
  }, [products, upgradePlan]);

  // Price limit effect with upgrade toast
  useEffect(() => {
    if (isPriceOverLimit && upgradePlan && upgradeProduct) {
      toast(
        (t) => (
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-base">
              💡 Upgrade to {upgradePlan} plan
            </p>
            <p className="text-sm text-gray-700">
              This price exceeds the{' '}
              <strong>{currentPlan.replace('-', ' ')}</strong> limit (
              {getCurrencySymbol(currency)}
              {priceLimit.toLocaleString()}). Upgrade to{' '}
              <strong>{upgradePlan}</strong> to list boats at this price.
            </p>
            <button
              onClick={() => {
                handleProductChange(upgradeProduct.id);
                toast.dismiss(t.id);
              }}
              className="mt-2 px-4 py-2 bg-articblue text-white rounded-lg hover:bg-articblue/90 transition-colors text-sm font-medium w-full"
            >
              Upgrade to {upgradePlan}
            </button>
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
    } else {
      toast.dismiss(PRICE_LIMIT_TOAST_ID);
    }
  }, [
    isPriceOverLimit,
    upgradePlan,
    upgradeProduct,
    currentPlan,
    currency,
    priceLimit,
    getCurrencySymbol
  ]);

  // Load products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        if (response.ok && data.products) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };
    loadProducts();
  }, []);

  // Create PaymentIntent for upgrades
  useEffect(() => {
    if (!selectedUpgradeProductId || !products.length) return;

    const createUpgradePaymentIntent = async () => {
      try {
        const upgradeProduct = products.find(
          (p) => p.id === selectedUpgradeProductId
        );
        const upgradePrice = upgradeProduct?.prices[0];

        if (!upgradePrice || !upgradePrice.unitAmount) return;

        console.log('💳 Creating upgrade payment intent...', {
          boatId: boat.id,
          upgradeProductId: selectedUpgradeProductId,
          upgradePrice: {
            id: upgradePrice.id,
            unitAmount: upgradePrice.unitAmount,
            currency: upgradePrice.currency
          }
        });
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Number(upgradePrice.unitAmount),
            currency: upgradePrice.currency || 'eur',
            priceId: upgradePrice.id,
            metadata: {
              listing_type: 'upgrade',
              boat_id: boat.id,
              user_id: boat.userId,
              product_id: selectedUpgradeProductId // Passer directement le product ID
            }
          })
        });

        const result = await response.json();

        if (response.ok && result.clientSecret) {
          setClientSecret(result.clientSecret);
          setPaymentIntentId(result.paymentIntentId);
          console.log(
            '✅ Upgrade payment intent created:',
            result.paymentIntentId
          );
        }
      } catch (error) {
        console.error('❌ Error creating upgrade payment intent:', error);
      }
    };

    createUpgradePaymentIntent();
  }, [selectedUpgradeProductId, products, boat.id, boat.userId]);

  // Handlers for form fields with validation
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

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDescription(e.target.value);
  };

  // Photo management state for drag & drop
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

    const remainingSlots =
      maxPhotos - (photoFiles.length + existingPhotos.length);
    const filesToAdd = imageFiles.slice(0, remainingSlots);

    if (filesToAdd.length === 0) {
      toast.error(`Maximum ${maxPhotos} photos allowed`, {
        duration: 3000,
        position: 'top-right'
      });
      return;
    }

    // Si un index cible est spécifié
    if (targetIndex !== undefined) {
      // Vérifier si on remplace une photo existante
      if (targetIndex < existingPhotos.length) {
        // Remplacer une photo existante
        const newPhotoPreview = [...photoPreview];

        // Store the original URL before replacing (to delete from R2 later)
        const originalUrl = existingPhotos[targetIndex];
        if (originalUrl && !replacedPhotoUrls.has(targetIndex)) {
          setReplacedPhotoUrls((prev) => new Map(prev).set(targetIndex, originalUrl));
        }

        // Libérer l'ancienne URL blob si c'était une nouvelle photo
        if (newPhotoPreview[targetIndex].startsWith('blob:')) {
          URL.revokeObjectURL(newPhotoPreview[targetIndex]);
        }

        // Marquer cette photo existante comme remplacée
        setReplacedPhotoIndices((prev) => new Set([...prev, targetIndex]));

        // Ajouter le nouveau fichier aux photos à uploader
        setPhotoFiles((prev) => [...prev, filesToAdd[0]]);

        // Mettre à jour le preview avec l'URL blob temporaire
        newPhotoPreview[targetIndex] = URL.createObjectURL(filesToAdd[0]);
        setPhotoPreview(newPhotoPreview);

        // Gérer les fichiers restants si possible
        if (filesToAdd.length > 1) {
          const additionalFiles = filesToAdd.slice(1);
          const additionalSlots =
            maxPhotos - (photoFiles.length + 1 + existingPhotos.length);
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
        // Insérer dans les nouvelles photos (case vide ou remplacement)
        const actualIndex = targetIndex - existingPhotos.length;
        if (actualIndex < photoFiles.length) {
          // Remplacer une nouvelle photo existante
          const newPhotoFiles = [...photoFiles];
          const newPhotoPreview = [...photoPreview];

          // Libérer l'ancienne URL
          URL.revokeObjectURL(newPhotoPreview[targetIndex]);

          // Remplacer par la nouvelle photo
          newPhotoFiles[actualIndex] = filesToAdd[0];
          newPhotoPreview[targetIndex] = URL.createObjectURL(filesToAdd[0]);

          setPhotoFiles(newPhotoFiles);
          setPhotoPreview(newPhotoPreview);

          // Ajouter les fichiers restants si possible
          if (filesToAdd.length > 1) {
            const additionalFiles = filesToAdd.slice(1);
            const additionalSlots =
              maxPhotos - (newPhotoFiles.length + existingPhotos.length);
            const additionalToAdd = additionalFiles.slice(0, additionalSlots);

            if (additionalToAdd.length > 0) {
              setPhotoFiles((prev) => [...prev, ...additionalToAdd]);
              const additionalPreviews = additionalToAdd.map((file) =>
                URL.createObjectURL(file)
              );
              setPhotoPreview((prev) => [...prev, ...additionalPreviews]);
            }
          }
        } else if (actualIndex === photoFiles.length) {
          // Ajouter à la fin
          setPhotoFiles((prev) => [...prev, ...filesToAdd]);
          const newPreviews = filesToAdd.map((file) =>
            URL.createObjectURL(file)
          );
          setPhotoPreview((prev) => [...prev, ...newPreviews]);
        }
      }
    } else {
      // Ajouter à la fin (pas d'index cible)
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

  const removePhoto = (index: number) => {
    const isExisting = index < existingPhotos.length;

    if (isExisting) {
      // Check if this existing photo was replaced
      const wasReplaced = replacedPhotoIndices.has(index);

      if (wasReplaced) {
        // Find the corresponding file in photoFiles and remove it
        const fileIndexToRemove =
          Array.from(replacedPhotoIndices).indexOf(index);
        if (fileIndexToRemove >= 0 && fileIndexToRemove < photoFiles.length) {
          setPhotoFiles((prev) =>
            prev.filter((_, i) => i !== fileIndexToRemove)
          );
        }

        // Remove from replaced indices and URLs
        setReplacedPhotoIndices((prev) => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
        setReplacedPhotoUrls((prev) => {
          const newMap = new Map(prev);
          newMap.delete(index);
          return newMap;
        });
      } else {
        // This is an existing photo being removed - track it for deletion
        const photoUrl = existingPhotos[index];
        if (photoUrl) {
          setReplacedPhotoUrls((prev) => new Map(prev).set(index, photoUrl));
        }
      }

      // Remove from existing photos and preview
      setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
      setPhotoPreview((prev) => prev.filter((_, i) => i !== index));
    } else {
      const actualIndex = index - existingPhotos.length;
      if (actualIndex >= 0) {
        setPhotoFiles((prev) => prev.filter((_, i) => i !== actualIndex));
        URL.revokeObjectURL(photoPreview[index]);
        setPhotoPreview((prev) => prev.filter((_, i) => i !== index));
      }
    }
  };

  const handlePhotoClick = (index: number) => {
    if (maxPhotos === 0) {
      toast.error('This offer does not allow photo uploads', {
        duration: 3000,
        position: 'top-right'
      });
      return;
    }

    if (index < photoPreview.length) {
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

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading && index >= existingPhotos.length) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading && index >= existingPhotos.length) {
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
    if (index >= existingPhotos.length) {
      processPhotoFiles(Array.from(files), index);
    } else {
      // Si on dépose sur une photo existante, la remplacer
      processPhotoFiles(Array.from(files), index);
    }
  };

  // Delete replaced images from R2
  const deleteReplacedImages = async (): Promise<void> => {
    if (replacedPhotoUrls.size === 0) return;

    console.log(`🗑️ Deleting ${replacedPhotoUrls.size} replaced images from R2...`);

    for (const [index, imageUrl] of replacedPhotoUrls) {
      try {
        const response = await fetch('/api/delete-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl,
            boatId: boat.id
          })
        });

        if (response.ok) {
          console.log(`✅ Deleted replaced image at index ${index}: ${imageUrl}`);
        } else {
          const error = await response.json();
          console.warn(`⚠️ Failed to delete image at index ${index}:`, error);
        }
      } catch (error) {
        console.error(`❌ Error deleting image at index ${index}:`, error);
      }
    }
  };

  // Upload photos using signed URLs (like BoatListingFormV2)
  const uploadPhotos = async (): Promise<string[]> => {
    if (photoFiles.length === 0) return [];

    const uploadedKeys: string[] = [];

    for (const [index, file] of photoFiles.entries()) {
      // 1) Ask server for a signed URL (authenticated)
      const presignRes = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boatId: boat.id.toString(),
          filename: file.name,
          contentType: file.type,
          size: file.size,
          isEdit: true
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

    return uploadedKeys;
  };

  const handleProductChange = (productId: string) => {
    setSelectedUpgradeProductId(productId);
    setIsUpgrading(true);
    setClientSecret(''); // Reset client secret to trigger new payment intent
    setPaymentIntentId('');
    console.log('Selected product for upgrade:', productId);
  };

  const waitForBoatUpgrade = async (
    boatId: string,
    expectedPlan: string,
    maxAttempts: number = 30
  ): Promise<boolean> => {
    console.log(
      `🔍 Waiting for boat ${boatId} upgrade to plan: ${expectedPlan}`
    );
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        console.log(
          `🔄 Attempt ${attempt + 1}/${maxAttempts} - Checking boat plan...`
        );
        // Appeler l'API pour récupérer le plan actuel du bateau
        const response = await fetch(`/api/boats/plan/${boatId}`);
        if (response.ok) {
          const data = await response.json();
          console.log(
            `📊 Current plan: "${data.plan}", Expected: "${expectedPlan}"`
          );
          if (data.plan === expectedPlan) {
            console.log('✅ Boat upgrade confirmed:', expectedPlan);
            return true;
          }
        } else {
          console.error(
            `❌ API call failed: ${response.status} ${response.statusText}`
          );
        }
        // Attendre 2 secondes avant de réessayer
        console.log(`⏳ Waiting 2 seconds before next attempt...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('❌ Error checking boat plan:', error);
        // Attendre quand même avant de réessayer
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    console.error(
      `❌ Boat upgrade not confirmed within timeout (${maxAttempts * 2}s)`
    );
    return false;
  };

  const handleUpgradePaymentSuccess = async () => {
    console.log('✅ Upgrade payment successful!');
    setIsProcessingUpgrade(true);

    try {
      // SOLUTION: Puisque le webhook ne fonctionne pas de manière fiable,
      // mettre à jour directement le bateau après paiement réussi
      console.log('🔄 Directly updating boat after successful payment...');

      const updateResponse = await fetch('/api/boats/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boatId: boat.id,
          newPlan: selectedUpgradeProductId,
          paymentIntentId
        })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update boat');
      }

      const updateResult = await updateResponse.json();
      console.log('✅ Boat updated successfully:', updateResult);

      // Récupérer le nouveau plan après mise à jour
      try {
        const planResponse = await fetch(`/api/boats/plan/${boat.id}`);
        if (planResponse.ok) {
          const planData = await planResponse.json();
          setCurrentPlan(planData.plan);
          console.log('✅ Plan updated to:', planData.plan);
        }
      } catch (error) {
        console.error('❌ Error fetching updated plan:', error);
      }

      // Mettre à jour l'état local du plan
      setIsUpgrading(false);
      setSelectedUpgradeProductId('');
      setClientSecret('');
      setPaymentIntentId('');

      setSuccessMessage('Your listing has been upgraded successfully!');
      setShowSuccessMessage(true);
    } catch (error) {
      console.error('❌ Error processing upgrade:', error);
      toast.error(
        'Upgrade failed. Please contact support if the issue persists.',
        {
          duration: 5000,
          position: 'top-right'
        }
      );
    } finally {
      setIsProcessingUpgrade(false);
    }
  };

  const handleUpgradePaymentError = (error: string) => {
    console.error('❌ Upgrade payment failed:', error);
    toast.error(`Payment failed: ${error}`, {
      duration: 5000,
      position: 'top-right'
    });
    setIsUpgrading(false);
    setSelectedUpgradeProductId('');
    setClientSecret('');
    setPaymentIntentId('');
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

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
    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
      errors.push('Please enter a valid contact email');
    if (maxPhotos > 0 && photoFiles.length + existingPhotos.length === 0)
      errors.push('Please add at least one photo');

    return {
      isValid: errors.length === 0,
      errors
    };
  };

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
          photoFiles.length + existingPhotos.length === 0 &&
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
    photoFiles.length,
    existingPhotos.length
  ]);

  const handleUpgradeSubmit = async () => {
    if (!selectedUpgradeProductId) return;

    try {
      // Call upgrade API
      const response = await fetch('/api/boats/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boatId: boat.id,
          newPlan: selectedUpgradeProductId,
          paymentIntentId
        })
      });

      const result = await response.json();

      if (result.success) {
        // Récupérer le nouveau plan après mise à jour
        try {
          const planResponse = await fetch(`/api/boats/plan/${boat.id}`);
          if (planResponse.ok) {
            const planData = await planResponse.json();
            setCurrentPlan(planData.plan);
            console.log('✅ Plan updated to:', planData.plan);
          }
        } catch (error) {
          console.error('❌ Error fetching updated plan:', error);
        }

        setSuccessMessage('Your listing has been upgraded successfully!');
        setShowSuccessMessage(true);
      } else {
        toast.error(result.error || 'Failed to upgrade listing', {
          duration: 5000,
          position: 'top-right'
        });
      }
    } catch (error) {
      console.error('Error upgrading:', error);
      toast.error('Failed to upgrade listing', {
        duration: 5000,
        position: 'top-right'
      });
    } finally {
      setIsUpgrading(false);
      setSelectedUpgradeProductId('');
      setClientSecret('');
      setPaymentIntentId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSaving(true);
    setSaveCompleted(false);

    try {
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
        setIsSaving(false);
        setIsLoading(false);
        return;
      }

      // Upload photos if any
      let newPhotoUrls: string[] = [];
      if (photoFiles.length > 0) {
        console.log(`📸 Uploading ${photoFiles.length} photos...`);
        setUploadingPhotos(true);
        try {
          newPhotoUrls = await uploadPhotos();
          console.log('✅ Photos uploaded:', newPhotoUrls);
        } catch (error) {
          console.error('❌ Failed to upload photos:', error);
          toast.error(
            'There was a problem uploading your photos. Please try again.',
            {
              duration: 4000,
              position: 'top-right'
            }
          );
          setIsSaving(false);
          setIsLoading(false);
          setUploadingPhotos(false);
          return;
        }
        setUploadingPhotos(false);
      }

      // Delete old replaced/removed images from R2
      if (replacedPhotoUrls.size > 0) {
        console.log('🗑️ Cleaning up replaced/removed images...');
        await deleteReplacedImages();
      }

      // Combine existing and new photo URLs, handling replaced photos
      let allPhotoUrls = [...existingPhotos];

      // Replace URLs for photos that were replaced
      let newPhotoIndex = 0;
      replacedPhotoIndices.forEach((replacedIndex) => {
        if (newPhotoIndex < newPhotoUrls.length) {
          allPhotoUrls[replacedIndex] = newPhotoUrls[newPhotoIndex];
          newPhotoIndex++;
        }
      });

      // Add remaining new photos
      if (newPhotoIndex < newPhotoUrls.length) {
        allPhotoUrls = [...allPhotoUrls, ...newPhotoUrls.slice(newPhotoIndex)];
      }

      // Create a FormData object for the update
      const formData = new FormData();
      formData.append('id', boat.id.toString());
      formData.append('model', model);
      formData.append('description', description);
      formData.append('country', country);
      formData.append('price', priceBoat.toString());
      formData.append('currency', currency);
      formData.append('specifications', JSON.stringify(specifications));
      formData.append('vat_paid', vatPaid ? 'true' : 'false');
      formData.append('email', contactEmail);
      formData.append('condition', condition);
      formData.append('photos', allPhotoUrls.join(','));

      // Call the update function
      const result = await handleRequest(
        { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>,
        () => updateListing(formData),
        null // Don't pass router to handleRequest, we'll handle redirect manually
      );

      if (!result.success) {
        toast.error(result.error || 'Failed to update listing', {
          duration: 4000,
          position: 'top-right'
        });
        setIsSaving(false);
        setIsLoading(false);
        return;
      }

      // Success - show success message
      setSaveCompleted(true);
      setSuccessMessage('Your listing has been updated successfully!');
      setShowSuccessMessage(true);
    } catch (error) {
      console.error('❌ Error updating listing:', error);
      toast.error(
        'An error occurred while updating your listing. Please try again.',
        {
          duration: 4000,
          position: 'top-right'
        }
      );
    } finally {
      // Only disable loading if save didn't complete successfully
      if (!saveCompleted) {
        setIsSaving(false);
        setIsLoading(false);
      }
      setUploadingPhotos(false);
    }
  };

  // Combine existing and new photos for preview
  const allPhotoPreviews = existingPhotos
    .map((existingPhoto, index) => {
      // If this photo was replaced, use the blob URL from photoPreview
      if (replacedPhotoIndices.has(index)) {
        return photoPreview[index] || existingPhoto;
      }
      return existingPhoto;
    })
    .concat(
      // Add new photos that aren't replacements
      photoPreview.slice(existingPhotos.length)
    );

  const isFormValid = validateForm().isValid;

  return (
    <div className="flex flex-col lg:flex-row w-full justify-center gap-8 lg:gap-[150px] pb-[112px] mx-auto max-w-screen-2xl px-16 xl:px-6">
      {/* Formulaire au centre */}
      <form
        id="edit-listing-form"
        onSubmit={handleSubmit}
        className="flex-1 max-w-full lg:max-w-lg flex flex-col gap-[32px] rounded-[24px]"
      >
        <h1 className="text-24 lg:text-40 text-oceanblue">
          <span className="text-articblue">Edit</span> your advert
        </h1>

        {/* Success message */}
        {showSuccessMessage && (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">{successMessage}</span>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="text-green-600 hover:text-green-800 transition-colors"
              aria-label="Fermer le message"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Current Plan Information */}
        <div className="flex flex-col gap-[24px] px-[20px] border-2 border-articblue rounded-lg p-4 text-oceanblue bg-articblue/5">
          <div className="flex flex-col gap-[12px]">
            <div className="flex flex-row items-center gap-3">
              <div className="text-oceanblue text-20 font-medium capitalize">
                {currentPlan.replace('-', ' ')} Plan
              </div>
            </div>
            <div className="flex flex-row gap-[10px] items-center text-oceanblue">
              <Valide />
              <p>
                {getPriceLimitSummaryText(
                  currentPlan,
                  getCurrencySymbol(currency)
                )}
              </p>
            </div>
            <div className="flex flex-row gap-[10px] items-center text-oceanblue">
              <Valide />
              <p>
                {maxPhotos > 0
                  ? `Includes ${maxPhotos} photo${maxPhotos > 1 ? 's' : ''}`
                  : 'No photos included'}
              </p>
            </div>
            <div className="flex flex-row gap-[10px] items-center text-oceanblue">
              <Valide />
              <p>Duration of {durationData.text || `${duration} months`}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleProductChange(upgradeProduct.id)}
            className="shrink-0 px-3 py-2 bg-articblue text-white rounded-lg hover:bg-articblue/90 transition-colors text-sm font-medium"
          >
            Upgrade
          </button>
        </div>

        <div className="flex flex-col gap-[32px]">
          {/* Model avec checkbox de validation */}
          <div ref={modelFieldRef} className="flex flex-row gap-4 items-center">
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
                isDisabled={isLoading || isProcessingUpgrade}
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

          {/* Country avec checkbox de validation */}
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
                isDisabled={isLoading || isProcessingUpgrade}
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

          {/* Price avec checkbox de validation */}
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
                  isDisabled={isLoading || isProcessingUpgrade}
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
                  isDisabled={isLoading || isProcessingUpgrade}
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
            {isPriceOverLimit && priceLimit && upgradeProduct && (
              <div className=" min-w-full mt-3 flex flex-row items-center justify-between max-w-[420px] rounded-lg border border-red-300 bg-red-50 p-3">
                <div className="flex flex-row items-center justify-between gap-3 w-full">
                  <div className="text-sm text-red-800">
                    <p className="font-semibold">
                      Price too high for {currentPlan.replace('-', ' ')} plan
                    </p>
                    <p className="mt-1">
                      Limit: {getCurrencySymbol(currency)}
                      {priceLimit?.toLocaleString()}. Upgrade to{' '}
                      <strong>{upgradePlan}</strong> to list at this price.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleProductChange(upgradeProduct.id)}
                    className="shrink-0 px-3 py-2 bg-articblue text-white rounded-lg hover:bg-articblue/90 transition-colors text-sm font-medium"
                  >
                    Upgrade
                  </button>
                </div>
              </div>
            )}
          </div>

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

          <Checkbox
            color="success"
            className="text-fullwhite"
            classNames={{ icon: 'text-fullwhite' }}
            isSelected={vatPaid}
            onValueChange={handleVatPaidChange}
          >
            VAT paid
          </Checkbox>

          {/* Description avec checkbox de validation */}
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
                isDisabled={isLoading || isProcessingUpgrade}
                description={`${description.length} / 2000 characters`}
              />
            </div>
            <div className="pt-8">
              <ValidationCheckbox
                isValid={description.length >= 20 && description.length <= 2000}
                shouldPulse={
                  shouldPulseInvalid &&
                  (description.length < 20 || description.length > 2000)
                }
              />
            </div>
          </div>

          {/* Email avec checkbox de validation */}
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
                disabled={isLoading || isProcessingUpgrade}
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

          {/* Condition avec checkbox de validation */}
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
                isDisabled={isLoading || isProcessingUpgrade}
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

          {/* Photos avec checkbox de validation */}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Array.from({ length: maxPhotos }).map((_, index) => {
                    const hasPhoto = index < allPhotoPreviews.length;
                    const preview = allPhotoPreviews[index];

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
                        onClick={() => !isLoading && handlePhotoClick(index)}
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
                  {photoFiles.length + existingPhotos.length} / {maxPhotos}{' '}
                  photos
                </p>
              </div>
              <div className="pt-8">
                <ValidationCheckbox
                  isValid={photoFiles.length + existingPhotos.length > 0}
                  shouldPulse={
                    shouldPulseInvalid &&
                    photoFiles.length + existingPhotos.length === 0
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
        </div>
      </form>

      {/* Payment Element à droite */}
      <div className="w-full lg:max-w-md border-2 border-oceanblue/10 p-4 md:p-6 gap-[24px] flex flex-col rounded-2xl self-start lg:sticky top-[120px]">
        <h1 className="text-20 lg:text-24 text-oceanblue">Edit </h1>
        <div className="flex flex-col gap-[32px]">
          {/* Plan Summary - Only show when upgrading */}
          {isUpgrading && selectedUpgradeProductId && upgradeProduct && (
            <div className="flex flex-col gap-[24px] px-[20px] border-2 border-orange-300 rounded-lg p-4 text-oceanblue bg-orange-50">
              <div className="flex flex-col gap-[12px]">
                <h3 className="text-lg font-semibold text-orange-800">
                  Upgrade to {upgradeProduct.name}
                </h3>
                <div className="flex flex-row gap-[10px] items-center text-orange-700">
                  <Valide />
                  <p>
                    {getPriceLimitSummaryText(
                      upgradeProduct.name,
                      getCurrencySymbol(currency)
                    )}
                  </p>
                </div>
                <div className="flex flex-row gap-[10px] items-center text-orange-700">
                  <Valide />
                  <p>Includes {getMaxPhotos(upgradeProduct.name)} photos</p>
                </div>
                <div className="flex flex-row gap-[10px] items-center text-orange-700">
                  <Valide />
                  <p>
                    Duration of{' '}
                    {(() => {
                      const dur = getDuration(upgradeProduct.name);
                      return typeof dur === 'object'
                        ? dur.text
                        : `${dur} months`;
                    })()}
                  </p>
                </div>
                <div className="w-full h-[1px] bg-orange-300"></div>
                <div className="flex flex-row gap-[10px] text-18 justify-between text-darkgrey font-semibold">
                  <p>Total</p>
                  <p>
                    {upgradeProduct.prices[0]?.unitAmount
                      ? `$${(upgradeProduct.prices[0].unitAmount / 100).toFixed(2)}`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Element or Action Buttons */}
          {isUpgrading && clientSecret ? (
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
                onSuccess={handleUpgradePaymentSuccess}
                onError={handleUpgradePaymentError}
                onBeforePayment={() => Promise.resolve({ success: true })}
                amount={upgradeProduct?.prices[0]?.unitAmount || 0}
                currency={upgradeProduct?.prices[0]?.currency || 'eur'}
                priceId={upgradeProduct?.prices[0]?.id || ''}
                userId={boat.userId}
                paymentIntentId={paymentIntentId}
                returnUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/account`}
              />
            </Elements>
          ) : isProcessingUpgrade ? (
            <div className="flex flex-col items-center justify-center gap-4 p-6 bg-articblue/5 rounded-lg border border-articblue/20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-articblue"></div>
              <div className="text-center">
                <p className="text-oceanblue font-medium">
                  Processing your upgrade...
                </p>
                <p className="text-stonegrey text-sm mt-1">
                  Please wait while we update your listing plan
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <button
                type="submit"
                form="edit-listing-form"
                className="bg-articblue text-white font-medium px-6 py-4 rounded-lg hover:bg-articblue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving || uploadingPhotos || isProcessingUpgrade}
              >
                {uploadingPhotos
                  ? 'Uploading photos...'
                  : saveCompleted
                    ? 'Changes saved!'
                    : isSaving
                      ? 'Saving changes...'
                      : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-fullwhite border-2 border-oceanblue text-oceanblue font-medium px-6 py-4 rounded-lg hover:border-oceanblue hover:bg-oceanblue hover:text-fullwhite transition-colors"
                disabled={isProcessingUpgrade}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Security notice - only show when upgrading */}
          {isUpgrading && (
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
          )}
        </div>
      </div>
    </div>
  );
}
