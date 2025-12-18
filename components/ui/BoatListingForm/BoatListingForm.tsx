'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type {
  User,
  UserSimple,
  ProductWithPrices,
  Price,
  Product
} from '@/types/database';
import { getStripe } from '@/utils/stripe/client';
import { checkoutWithStripe } from '@/utils/stripe/server';
import { getErrorRedirect, getPaymentErrorRedirect } from '@/utils/helpers';
import { emergencyCleanupClient } from '@/utils/boats/client';
import { Select, SelectItem, SelectSection } from '@heroui/select';
import { Avatar } from '@heroui/avatar';
import { Input, Textarea } from '@heroui/input';
import { NumberInput } from '@heroui/number-input';
import { Checkbox } from '@heroui/checkbox';
import Valide from '@/components/icons/Valide';
import Lock from '@/components/icons/lock';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentForm from '@/components/ui/StripePaymentForm/StripePaymentForm';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE ??
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
    ''
);

export const dragonflyModels = [
  { key: 'df25', label: 'Dragonfly 25' },
  { key: 'df800', label: 'Dragonfly 800' },
  { key: 'df28', label: 'Dragonfly 28' },
  { key: 'df920', label: 'Dragonfly 920' },
  { key: 'df1000', label: 'Dragonfly 1000' },
  { key: 'df32', label: 'Dragonfly 32' },
  { key: 'df35', label: 'Dragonfly 35' },
  { key: 'df1200', label: 'Dragonfly 1200' },
  { key: 'df40', label: 'Dragonfly 40' }
];

export const currencies = [
  { key: 'USD', label: 'USD', symbol: '$' },
  { key: 'EUR', label: 'EUR', symbol: '€' },
  { key: 'GBP', label: 'GBP', symbol: '£' },
  { key: 'JPY', label: 'JPY', symbol: '¥' },
  { key: 'AUD', label: 'AUD', symbol: 'A$' },
  { key: 'CAD', label: 'CAD', symbol: 'C$' },
  { key: 'CHF', label: 'CHF', symbol: 'CHF' },
  { key: 'CNY', label: 'CNY', symbol: '¥' },
  { key: 'INR', label: 'INR', symbol: '₹' },
  { key: 'MXN', label: 'MXN', symbol: 'MX$' }
];

export const countries = [
  { key: 'argentina', label: 'Argentina', flag: 'https://flagcdn.com/ar.svg' },
  { key: 'venezuela', label: 'Venezuela', flag: 'https://flagcdn.com/ve.svg' },
  { key: 'brazil', label: 'Brazil', flag: 'https://flagcdn.com/br.svg' },
  {
    key: 'switzerland',
    label: 'Switzerland',
    flag: 'https://flagcdn.com/ch.svg'
  },
  { key: 'germany', label: 'Germany', flag: 'https://flagcdn.com/de.svg' },
  { key: 'spain', label: 'Spain', flag: 'https://flagcdn.com/es.svg' },
  { key: 'france', label: 'France', flag: 'https://flagcdn.com/fr.svg' },
  { key: 'italy', label: 'Italy', flag: 'https://flagcdn.com/it.svg' },
  { key: 'mexico', label: 'Mexico', flag: 'https://flagcdn.com/mx.svg' }
];

export const specificationsData = [
  {
    title: 'Hull and Structure',
    items: [
      { key: 'carbon-mast', label: 'Carbon mast' },
      { key: 'carbon-beams', label: 'Carbon beams' },
      { key: 'epoxy-construction', label: 'Epoxy construction' },
      { key: 'coppercoat-antifouling', label: 'Coppercoat antifouling' }
    ]
  },
  {
    title: 'Sails and Rigging',
    items: [
      { key: 'self-tacking-jib', label: 'Self-tacking jib' },
      { key: 'furling-genoa', label: 'Furling genoa' },
      { key: 'electric-winches', label: 'Electric winches' },
      { key: 'gennaker-spinnaker', label: 'Gennaker/Spinnaker' }
    ]
  },
  {
    title: 'Navigation and Electronics',
    items: [
      { key: 'autopilot', label: 'Autopilot' },
      { key: 'chartplotter', label: 'Chartplotter' },
      { key: 'vhf-radio', label: 'VHF radio' },
      { key: 'wind-instruments', label: 'Wind instruments' },
      { key: 'radar', label: 'Radar' },
      { key: 'depth-sounder', label: 'Depth sounder' }
    ]
  },
  {
    title: 'Comfort and Interior',
    items: [
      { key: 'marine-toilet', label: 'Marine toilet' },
      { key: 'shower', label: 'Shower' },
      { key: 'hot-water-system', label: 'Hot water system' },
      { key: 'refrigerator', label: 'Refrigerator' },
      { key: 'heating-system', label: 'Heating system' },
      { key: 'air-conditioning', label: 'Air conditioning' }
    ]
  },
  {
    title: 'Power and Propulsion',
    items: [
      { key: 'outboard-engine', label: 'Outboard engine' },
      { key: 'electric-motor', label: 'Electric motor' },
      { key: 'solar-panels', label: 'Solar panels' },
      { key: 'lithium-batteries', label: 'Lithium batteries' }
    ]
  },
  {
    title: 'Safety Equipment',
    items: [
      { key: 'life-raft', label: 'Life raft' },
      { key: 'epirb', label: 'EPIRB' },
      { key: 'fire-extinguishers', label: 'Fire extinguishers' },
      { key: 'bilge-pumps', label: 'Bilge pumps' }
    ]
  },
  {
    title: 'Condition and History',
    items: [
      { key: 'one-owner', label: 'One owner' },
      { key: 'full-service-history', label: 'Full service history' },
      { key: 'professional-maintenance', label: 'Professional maintenance' },
      { key: 'recent-survey', label: 'Recent survey' }
    ]
  },
  {
    title: 'Additional Features',
    items: [
      { key: 'dinghy', label: 'Dinghy' },
      { key: 'trailer', label: 'Trailer' }
    ]
  }
];

interface BoatListingFormProps {
  user: UserSimple | null | undefined;
  products: ProductWithPrices[];
  preference: string | null;
}

export default function BoatListingForm({
  user,
  products,
  preference
}: BoatListingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Get the currently selected product and its price
  const defaultProductId =
    products.find((p) => p.name === preference)?.id || products[0]?.id || '';
  const [selectedProductId, setSelectedProductId] =
    useState<string>(defaultProductId);

  const selectedProduct =
    products.find((p) => p.id === selectedProductId) || products[0];
  const selectedPrice = selectedProduct?.prices[0];

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

  // Payment states - clientSecret créé au chargement
  const [clientSecret, setClientSecret] = useState<string>('');
  const [boatId, setBoatId] = useState<string | null>(null);
  const [paymentReady, setPaymentReady] = useState(false);

  // Early return if no valid products are available
  if (!products.length || !selectedPrice) {
    return (
      <div className="min-h-screen bg-black py-8">
        <Card
          title="Error"
          description="Unable to load listing options. Please try again later."
        >
          <button
            type="button"
            className="mt-4"
            onClick={() => router.push('/')}
          >
            Return to Home
          </button>
        </Card>
      </div>
    );
  }

  const getCurrencySymbol = (currency: string | null) => {
    if (!currency) return ''; // Gérer le cas où la devise est null
    const currencyData = currencies.find(
      (c) => c.key === currency.toUpperCase()
    );
    return currencyData ? currencyData.symbol : currency.toUpperCase();
  };

  // Handle product selection
  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProductId(e.target.value);
  };

  // Handlers for form fields
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setModel(e.target.value);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCountry(e.target.value);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrency(e.target.value);
  };

  // Fixed: Changed to match HeroUI's expected type
  const handleSpecificationsChange = (keys: any) => {
    // Convert the selection to an array of strings
    const selectedKeys = Array.from(keys).map((key) => String(key));
    setSpecifications(selectedKeys);
  };

  const handleVatPaidChange = (checked: boolean) => {
    setVatPaid(checked);
  };

  // Fixed: Changed to match Textarea's expected type
  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDescription(e.target.value);
  };

  // Handle file selection for photos
  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles);
    setPhotoFiles((prev) => [...prev, ...newFiles]);

    // Generate previews for each new file
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreview((prev) => [...prev, ...newPreviews]);
  };

  // Remove a photo from the upload list
  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));

    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(photoPreview[index]);
    setPhotoPreview((prev) => prev.filter((_, i) => i !== index));
  };

  // Sérialiser les images pour les métadonnées Stripe (pas d'upload pour l'instant)
  const serializeImagesForPayment = (): string => {
    if (photoFiles.length === 0) return '';

    // Créer un résumé des fichiers à uploader après paiement
    const imageMetadata = photoFiles.map((file, index) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      index: index
    }));

    return JSON.stringify(imageMetadata);
  };

  // Validation pour la description (2000 caractères max)
  const validateDescription = (desc: string): boolean => {
    return desc.length <= 2000;
  };

  // Cette fonction sera appelée par le StripePaymentForm AVANT de confirmer le paiement
  const handleBeforePayment = async (): Promise<{
    success: boolean;
    boatId?: string;
  }> => {
    setIsLoading(true);

    if (!user) {
      router.push('/signin/signup');
      return { success: false };
    }

    // Validation de la description
    if (!validateDescription(description)) {
      alert('La description doit faire moins de 2000 caractères.');
      setIsLoading(false);
      return { success: false };
    }

    // Validation des champs requis
    if (!model || !country || !priceBoat) {
      alert(
        'Veuillez remplir tous les champs obligatoires (modèle, pays, prix).'
      );
      setIsLoading(false);
      return { success: false };
    }

    let tempBoatId: string | null = null;

    try {
      // Upload des images
      let tempImageKeys: string[] = [];

      if (photoFiles.length > 0) {
        setUploadingPhotos(true);
        console.log(
          `📤 Uploading ${photoFiles.length} images to temporary storage...`
        );

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
          if (uploadResult.keys) {
            tempImageKeys = uploadResult.keys;
          } else if (uploadResult.key) {
            tempImageKeys = [uploadResult.key];
          }
          console.log(`✅ ${tempImageKeys.length} image(s) uploaded`);
        } else {
          console.error('❌ Image upload failed:', uploadResult.error);
          alert("Erreur lors de l'upload des images.");
          setIsLoading(false);
          setUploadingPhotos(false);
          return { success: false };
        }

        setUploadingPhotos(false);
      }

      // Créer le bateau
      console.log('🚤 Creating boat with pending status...');
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

      if (!boatResult.success) {
        console.error('❌ Failed to create boat:', boatResult.error);
        alert(
          `Erreur lors de la création du bateau: ${boatResult.error || 'Erreur inconnue'}`
        );
        setIsLoading(false);
        return { success: false };
      }

      tempBoatId = boatResult.boatId;
      setBoatId(tempBoatId);
      console.log('✅ Boat created with ID:', tempBoatId);
      setIsLoading(false);

      return { success: true, boatId: tempBoatId };
    } catch (error) {
      console.error('Error during form submission:', error);

      if (tempBoatId) {
        try {
          await emergencyCleanupClient(
            tempBoatId,
            `Form submission exception: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        } catch (cleanupError) {
          console.error('❌ Emergency cleanup failed:', cleanupError);
        }
      }

      alert("Une erreur inattendue s'est produite.");
      setIsLoading(false);
      setUploadingPhotos(false);
      return { success: false };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Le formulaire ne fait plus rien, tout est géré par handleBeforePayment
  };

  const handlePaymentSuccess = () => {
    console.log('✅ Payment successful!');
    router.push('/account?section=ads&payment=success');
  };

  const handlePaymentError = (error: string) => {
    console.error('❌ Payment failed:', error);
    // Le bateau reste en statut pending, il sera nettoyé par le cron job
    alert(`Erreur de paiement: ${error}`);
  };

  // Safe access to price properties with fallback
  const priceString = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: selectedPrice?.currency || 'USD',
    minimumFractionDigits: 0
  }).format(Number(selectedPrice?.unitAmount || 0) / 100);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-row w-full justify-center gap-[56px] pb-[112px] mx-auto max-w-screen-xl"
    >
      <div className="bg-lightgrey w-full p-[50px] flex flex-col gap-[48px] rounded-[24px]">
        <h1 className="text-40 text-oceanblue">
          <span className="text-articblue">Create</span> your advert
        </h1>
        <div className="flex flex-col gap-[24px]">
          <Select
            classNames={{
              label: 'text-oceanblue',
              trigger: 'bg-fullwhite border-articblue border-2',
              value: 'text-oceanblue'
            }}
            className="text-oceanblue  h-[40px]"
            labelPlacement="outside"
            size="lg"
            label="Listing Type"
            disallowEmptySelection
            selectedKeys={selectedProductId ? [selectedProductId] : []}
            onChange={handleProductChange}
            scrollShadowProps={{
              isEnabled: false
            }}
            isDisabled={showPayment}
          >
            {products.map((product) => (
              <SelectItem className="text-oceanblue" key={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </Select>
          <Select
            classNames={{
              label: 'text-oceanblue',
              trigger: 'bg-fullwhite',
              value: 'text-oceanblue'
            }}
            className="text-oceanblue h-[40px]"
            labelPlacement="outside"
            size="lg"
            label="Model"
            placeholder="Select a model"
            selectedKeys={model ? [model] : []}
            onChange={handleModelChange}
            scrollShadowProps={{
              isEnabled: false
            }}
            isDisabled={showPayment}
          >
            {dragonflyModels.map((modele) => (
              <SelectItem className="text-oceanblue" key={modele.key}>
                {modele.label}
              </SelectItem>
            ))}
          </Select>

          <Select
            className="text-oceanblue h-[40px]"
            label="Country"
            size="lg"
            classNames={{
              label: 'text-oceanblue',
              trigger: 'bg-fullwhite',
              value: 'text-oceanblue'
            }}
            labelPlacement="outside"
            placeholder="Select a country"
            selectedKeys={country ? [country] : []}
            onChange={handleCountryChange}
            isDisabled={showPayment}
          >
            {countries.map(({ key, label, flag }) => (
              <SelectItem
                className="text-oceanblue"
                key={key}
                startContent={
                  <Avatar alt={label} className="w-6 h-6" src={flag} />
                }
              >
                {label}
              </SelectItem>
            ))}
          </Select>

          <div className="flex flex-row gap-24 justify-center">
            <NumberInput
              className="text-oceanblue placeholder:text-oceanblue h-[40px]"
              label="Price"
              size="lg"
              classNames={{
                label: 'text-oceanblue',
                inputWrapper: 'bg-fullwhite',
                mainWrapper: 'h-fit',
                input: 'placeholder:text-oceanblue/40'
              }}
              labelPlacement="outside"
              placeholder="From 0$ to 25 000 $"
              value={priceBoat}
              onValueChange={setPriceBoat}
              isDisabled={showPayment}
            />

            <Select
              classNames={{
                label: 'text-oceanblue',
                trigger: 'bg-fullwhite',
                value: 'text-oceanblue'
              }}
              className="text-oceanblue h-[40px] max-w-[100px]"
              labelPlacement="outside"
              size="lg"
              scrollShadowProps={{
                isEnabled: false
              }}
              startContent={getCurrencySymbol(currency)}
              label="Currency"
              defaultSelectedKeys={['USD']}
              selectedKeys={currency ? [currency] : ['USD']}
              onChange={handleCurrencyChange}
              isDisabled={showPayment}
            >
              {currencies.map((curr) => (
                <SelectItem className="text-oceanblue" key={curr.key}>
                  {curr.label}
                </SelectItem>
              ))}
            </Select>
          </div>

          <Select
            selectionMode="multiple"
            className="text-oceanblue h-[40px] max-w-[512px]"
            size="lg"
            classNames={{
              label: 'text-oceanblue',
              trigger: 'bg-fullwhite',
              value: 'text-oceanblue'
            }}
            labelPlacement="outside"
            label="Specifications"
            placeholder="Select features"
            selectedKeys={new Set(specifications)}
            onSelectionChange={handleSpecificationsChange}
            isDisabled={showPayment}
          >
            {specificationsData.map((section, index) => (
              <SelectSection
                key={section.title}
                title={section.title}
                showDivider={index !== specificationsData.length - 1}
              >
                {section.items.map((item) => (
                  <SelectItem key={item.key} className="text-oceanblue">
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
            isDisabled={showPayment}
          >
            VAT paid
          </Checkbox>

          <Textarea
            classNames={{
              label: 'text-oceanblue',
              inputWrapper: 'bg-fullwhite',
              input: 'placeholder:text-oceanblue'
            }}
            className="text-oceanblue"
            labelPlacement="outside"
            size="lg"
            label="Description"
            minRows={6}
            placeholder="Enter your description"
            value={description}
            onValueChange={setDescription}
            isDisabled={showPayment}
          />

          {/* Photo Upload Section */}
          <div className="space-y-4">
            <label className="block text-oceanblue">Photos</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              className="w-full text-oceanblue"
              disabled={showPayment}
            />

            {photoPreview.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-4">
                {photoPreview.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-32 h-32 object-cover rounded"
                    />
                    {!showPayment && (
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full p-[50px] gap-[48px] flex flex-col ">
        <h1 className="text-40 text-oceanblue">Checkout</h1>
        <div className="flex flex-col gap-[32px] ">
          <div className=" text-oceanblue text-24">
            {selectedProduct?.name || 'Start line'}
          </div>
          <div className="flex flex-col gap-[12px] px-[20px] text-oceanblue">
            <div className="flex flex-row gap-[10px] items-center">
              <Valide /> <p>Boats up to €30,000</p>
            </div>
            <div className="flex flex-row gap-[10px] items-center">
              <Valide /> <p>Includes 3 photos</p>
            </div>
            <div className="flex flex-row gap-[10px] items-center">
              <Valide /> <p>Duration of 3 months</p>
            </div>
          </div>
          <div className="w-full h-[1px] bg-stonegrey"></div>
          <div className="flex flex-row gap-[10px] text-18 justify-between text-darkgrey font-semibold">
            <p>Total</p>
            <p>{priceString}</p>
          </div>

          {!showPayment ? (
            <button
              type="submit"
              className="w-full bg-articblue text-white font-medium px-[53px] py-[20px] rounded-[7px] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || uploadingPhotos}
            >
              {isLoading || uploadingPhotos
                ? 'Processing...'
                : 'Continue to Payment'}
            </button>
          ) : (
            <div className="mt-4 border-2 border-green-500 p-4">
              <p className="text-green-600 mb-4">
                Payment section is visible! (Debug)
              </p>
              <p className="text-sm mb-2">
                Client Secret: {clientSecret ? 'Present' : 'Missing'}
              </p>
              <p className="text-sm mb-2">
                Stripe Promise: {stripePromise ? 'Present' : 'Missing'}
              </p>
              {clientSecret && stripePromise ? (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#0066cc'
                      }
                    }
                  }}
                >
                  <StripePaymentForm
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    returnUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/account?section=ads&payment=success`}
                  />
                </Elements>
              ) : (
                <p className="text-red-600">
                  Missing clientSecret or stripePromise
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col justify-center">
            <div className="flex flex-row justify-center items-center  text-articblue">
              <Lock />
              <p className="text-darkgrey">Secure Checkout - SSL Encrypted</p>
            </div>
            <div className="flex flex-row justify-center items-center gap-[10px] ">
              <p className="flex flex-col justify-center text-stonegrey text-[12px]">
                Ensuring your financial and personal details are secure during
                every transaction.
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
