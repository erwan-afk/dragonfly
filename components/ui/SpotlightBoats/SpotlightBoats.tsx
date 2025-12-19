'use client';
import { useEffect, useRef, useState } from 'react';
import ArrowDropdown from '@/components/icons/ArrowDropdown';
import ArrowSeemore from '@/components/icons/ArrowSeemore';

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger
} from '@heroui/dropdown';
import { Autocomplete, AutocompleteItem } from '@heroui/autocomplete';
import { Avatar } from '@heroui/avatar';
import { Slider } from '@heroui/slider';
import {
  EditIcon,
  EyeIcon,
  TrashIcon,
  MoreVertical,
  ArrowUpDown
} from 'lucide-react';
import Link from 'next/link'; // Importez Link depuis next/link
import { Spinner } from '@heroui/spinner';
import { Skeleton } from '@heroui/skeleton';
import { useRouter } from 'next/navigation';
import { Boat } from '@/types/database';
import { getModelLabel } from '@/utils/constants';

interface SpotlightBoatsProps {
  boats: Boat[];
  spotlight?: boolean;
  edit?: boolean;
  userId?: string; // Ajoutez cette prop pour l'ID de l'utilisateur connecté
  isLoading?: boolean; // Nouveau prop pour l'état de chargement
}

export default function SpotlightBoats({
  boats,
  spotlight,
  edit,
  userId,
  isLoading
}: SpotlightBoatsProps) {
  const router = useRouter();
  const renderStartedAtRef = useRef<number>(Date.now());
  const loggedImageEventsRef = useRef<Set<string>>(new Set());

  const shouldLogImages =
    process.env.NODE_ENV !== 'production' ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost');

  // Client-side fallback: account page should already pass absolute URLs, but right after payment
  // we can momentarily receive R2 keys (boats/... or temp_session_...). Normalize them here too.
  const normalizePhotoUrl = (value: any, boatId?: string): string => {
    if (!value || typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';

    // Handle empty strings from server (indicates temp URL was filtered out)
    if (!trimmed) return '';

    // Handle temporary session URLs - try to convert them to R2 URLs
    if (trimmed.includes('temp_session_') && trimmed.startsWith('http')) {
      // Extract filename from temp URL
      const urlParts = trimmed.split('/');
      const tempFilename = urlParts[urlParts.length - 1];

      if (tempFilename && boatId) {
        // Extract the original filename from temp filename
        // temp format: {timestamp}-{originalFilename}
        // We want to construct: boats/{boatId}/{timestamp}-{originalFilename}
        const bucket = process.env.NEXT_PUBLIC_R2_BUCKET_NAME;
        const accountId = process.env.NEXT_PUBLIC_R2_ACCOUNT_ID;
        const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

        if (publicUrl) {
          const hasProtocol =
            publicUrl.startsWith('http://') || publicUrl.startsWith('https://');
          const base = hasProtocol ? publicUrl : `https://${publicUrl}`;
          return `${base}/boats/${boatId}/${tempFilename}`;
        }

        if (bucket && accountId) {
          return `https://${bucket}.${accountId}.r2.cloudflarestorage.com/boats/${boatId}/${tempFilename}`;
        }
      }
      // If we can't convert, return empty to trigger error handling
      return '';
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (trimmed.startsWith('/')) return trimmed;

    const bucket = process.env.NEXT_PUBLIC_R2_BUCKET_NAME;
    const accountId = process.env.NEXT_PUBLIC_R2_ACCOUNT_ID;
    const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

    if (publicUrl) {
      const hasProtocol =
        publicUrl.startsWith('http://') || publicUrl.startsWith('https://');
      const base = hasProtocol ? publicUrl : `https://${publicUrl}`;
      return `${base}/${trimmed}`;
    }

    if (bucket && accountId) {
      return `https://${bucket}.${accountId}.r2.cloudflarestorage.com/${trimmed}`;
    }

    // If envs are not exposed, we can't build the URL reliably. Return as-is.
    return trimmed;
  };

  const logImageEvent = (
    kind: 'load' | 'error',
    boatId: string,
    url: string
  ) => {
    if (!shouldLogImages) return;
    const key = `${kind}:${boatId}:${url}`;
    if (loggedImageEventsRef.current.has(key)) return;
    loggedImageEventsRef.current.add(key);

    const dt = Date.now() - renderStartedAtRef.current;
    // eslint-disable-next-line no-console
    console.log(`[SpotlightBoats:image:${kind}] +${dt}ms`, {
      boatId,
      url
    });
  };
  const maxPrice =
    boats.length > 0
      ? Math.max(...boats.map((boat) => Number(boat.price) || 0))
      : 1000;

  console.log(maxPrice);

  const [selectedPrice, setSelectedPrice] = useState<[number, number]>([
    0,
    maxPrice
  ]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState<string>('created_desc');
  const [loadingBoatId, setLoadingBoatId] = useState<string | null>(null);
  const [deletingBoatId, setDeletingBoatId] = useState<string | null>(null);
  const [imageRetryCount, setImageRetryCount] = useState<
    Record<string, number>
  >({});
  // Supprimer l'ancien useEffect qui calculait incorrectement l'expiration
  // Le calcul sera fait individuellement pour chaque bateau dans le map

  const handleDeleteBoat = async (boatId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this boat listing? This action cannot be undone.'
      )
    ) {
      return;
    }

    setDeletingBoatId(boatId);
    try {
      const response = await fetch(`/api/boats/${boatId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete boat');
      }

      // Refresh server components data without doing a full page reload,
      // so we keep the current tab ("My ads") without flashing to "My details".
      router.refresh();
    } catch (error) {
      console.error('Error deleting boat:', error);
      alert('Failed to delete boat listing. Please try again.');
    } finally {
      setDeletingBoatId(null);
    }
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString('us-US'); // Utilise 'fr-FR' pour ajouter une virgule comme séparateur de milliers
  };

  const handleImageError = (
    boatId: string,
    originalUrl: string,
    imgElement: HTMLImageElement
  ) => {
    const currentRetryCount = imageRetryCount[boatId] || 0;

    // If URL is empty (indicates temp URL that couldn't be converted), wait for data update
    if (!originalUrl || originalUrl.trim() === '') {
      console.log(
        `Image for boat ${boatId} has empty URL, waiting for data update...`
      );
      // Don't retry, let the refresh cycle handle it
      imgElement.style.display = 'none';
      return;
    }

    if (currentRetryCount < 3) {
      // Retry with a timestamp to bypass cache
      const retryUrl = `${originalUrl}${originalUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
      setImageRetryCount((prev) => ({
        ...prev,
        [boatId]: currentRetryCount + 1
      }));

      // Small delay before retry
      setTimeout(() => {
        imgElement.src = retryUrl;
      }, 500);
    } else {
      // After 3 retries, hide the image
      logImageEvent('error', boatId, originalUrl);
      imgElement.style.display = 'none';
    }
  };

  // Fonction pour créer des skeletons de cards
  const createSkeletonCards = (count: number) => {
    return Array.from({ length: count }, (_, index) => (
      <Skeleton
        key={`skeleton-${index}`}
        className={`group ${!spotlight ? 'border-stonegrey border' : ''} flex flex-row overflow-hidden transition-all duration-300 rounded-[16px]`}
      >
        <div className="w-full h-full"></div>
      </Skeleton>
    ));
  };

  // Condition pour appliquer les filtres uniquement si edit est false
  const filteredBoats = edit
    ? boats
    : (() => {
        // Appliquer les filtres
        const filtered = boats.filter((boat) => {
          const price = Number(boat.price) ?? 0;
          const inPriceRange =
            price >= selectedPrice[0] && price <= selectedPrice[1];
          const matchesModel = !selectedModel || boat.model === selectedModel;
          const matchesCountry =
            !selectedCountry || boat.country === selectedCountry;
          return inPriceRange && matchesModel && matchesCountry;
        });

        // Appliquer le tri
        return filtered.sort((a, b) => {
          switch (selectedSort) {
            case 'price_asc':
              return (Number(a.price) ?? 0) - (Number(b.price) ?? 0);
            case 'price_desc':
              return (Number(b.price) ?? 0) - (Number(a.price) ?? 0);
            case 'created_asc':
              return (
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
              );
            case 'created_desc':
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
            case 'model_asc':
              return a.model.localeCompare(b.model);
            case 'model_desc':
              return b.model.localeCompare(a.model);
            default:
              return (
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
              );
          }
        });
      })();

  // Fonction pour rendre une vraie table pour le mode edit
  const renderTableView = () => {
    if (!edit || boats.length === 0) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-articblue to-oceanblue border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-fullwhite uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-fullwhite uppercase tracking-wider">
                  Boat Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-fullwhite uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-fullwhite uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-fullwhite uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-fullwhite uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-fullwhite uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {boats.map((boat) => {
                // Parse les photos si elles sont sous forme de chaîne JSON
                const photos =
                  boat.photos && typeof boat.photos === 'string'
                    ? JSON.parse(boat.photos)
                    : boat.photos;

                // Ajoute le préfixe à chaque URL de photo
                const prefixedPhotos = Array.isArray(photos)
                  ? photos
                      .map((photo) => normalizePhotoUrl(photo, boat.id))
                      .filter((url) => url && url.trim() !== '')
                  : [];

                // Vérifie si on a des images valides
                const hasValidImages = prefixedPhotos.length > 0;
                const imageUrl = hasValidImages ? prefixedPhotos[0] : null;

                // Formate la date de création
                const formattedDate = boat.createdAt
                  ? new Date(boat.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      day: 'numeric',
                      month: 'long'
                    })
                  : 'Unknown';

                // Calcule la date d'expiration (3 mois par défaut, 4 mois pour podium)
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
                      expiration.setMonth(expiration.getMonth() + monthsToAdd);
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
                const isExpired = expirationDate ? expirationDate < now : false;
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

                return (
                  <tr
                    key={boat.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/boat/${boat.id}`);
                    }}
                  >
                    {/* Image */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative w-30 h-20 overflow-hidden rounded-lg bg-gray-100">
                        {hasValidImages && imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={`${getModelLabel(boat.model)} photo`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onLoad={() =>
                              logImageEvent('load', boat.id, imageUrl as string)
                            }
                            onError={(e) => {
                              handleImageError(
                                boat.id,
                                imageUrl as string,
                                e.currentTarget
                              );
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-articblue"></div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Boat Details */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getModelLabel(boat.model)}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <span>{boat.country}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">
                        {formatPrice(Number(boat.price))} {boat.currency}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          isExpired
                            ? 'bg-red-100 text-red-800'
                            : expiresSoon
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {isExpired
                          ? 'Expired'
                          : expiresSoon
                            ? 'Expiring Soon'
                            : 'Active'}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formattedDate}
                    </td>

                    {/* Expires */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={
                          isExpired
                            ? 'text-red-600 font-medium'
                            : expiresSoon
                              ? 'text-yellow-600 font-medium'
                              : ''
                        }
                      >
                        {formattedExpirationDate}
                        {expiresSoon && ` (${daysUntilExpiration}d)`}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Dropdown>
                        <DropdownTrigger>
                          <button
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {deletingBoatId === boat.id ? (
                              <Spinner
                                classNames={{
                                  wrapper: 'min-w-[16px]',
                                  dots: 'bg-articblue'
                                }}
                                variant="wave"
                              />
                            ) : (
                              <MoreVertical size={16} />
                            )}
                          </button>
                        </DropdownTrigger>
                        <DropdownMenu
                          aria-label="Boat actions"
                          classNames={{
                            base: 'max-h-[400px] overflow-y-auto bg-fullwhite shadow-lg border border-gray-200',
                            list: 'bg-fullwhite'
                          }}
                          onAction={(key) => {
                            if (key === 'view') {
                              router.push(`/boat/${boat.id}`);
                              return;
                            }
                            if (key === 'edit') {
                              sessionStorage.setItem(
                                `boat-${boat.id}`,
                                JSON.stringify(boat)
                              );
                              router.push(`/edit-listing/${boat.id}`);
                              return;
                            }
                            if (key === 'delete') {
                              handleDeleteBoat(boat.id);
                            }
                          }}
                        >
                          <DropdownItem
                            key="view"
                            startContent={<EyeIcon size={14} />}
                            classNames={{
                              base: 'text-gray-700 data-[hover=true]:bg-gray-50 data-[hover=true]:text-gray-900'
                            }}
                          >
                            View Listing
                          </DropdownItem>
                          <DropdownItem
                            key="edit"
                            startContent={<EditIcon size={14} />}
                            classNames={{
                              base: 'text-gray-700 data-[hover=true]:bg-gray-50 data-[hover=true]:text-gray-900'
                            }}
                          >
                            Edit Listing
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            startContent={<TrashIcon size={14} />}
                            classNames={{
                              base: 'text-red-600 data-[hover=true]:bg-red-50 data-[hover=true]:text-red-700'
                            }}
                          >
                            Delete Listing
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      {edit ? (
        renderTableView()
      ) : (
        <>
          {!spotlight && ( // Ne pas afficher les filtres si spotlight est true
            <div className="">
              <div className="flex justify-between items-center">
                {/* Filtres à gauche */}
                <div className="flex gap-8">
                  {/* Filtre par prix */}
                  <Dropdown
                    classNames={{ content: 'hover:bg-fullwhite' }}
                    className="hover:bg-fullwhite !important"
                  >
                    <DropdownTrigger>
                      <button className="rounded-[100px] px-[20px] h-[30px] flex flex-row gap-2 items-center  hover:bg-smokygrey bg-lightgrey text-oceanblue">
                        <div className="font-medium text-14 ">Price</div>
                        <ArrowDropdown />
                      </button>
                    </DropdownTrigger>
                    <DropdownMenu
                      aria-label="Dynamic Actions"
                      className="hover:bg-fullwhite !important"
                      classNames={{
                        base: 'hover:bg-fullwhite  !important',
                        list: 'hover:bg-fullwhite !important'
                      }}
                    >
                      <DropdownItem
                        key="price"
                        classNames={{
                          base: 'data-[hover]:bg-fullwhite cursor-default '
                        }}
                      >
                        <Slider
                          classNames={{ labelWrapper: 'flex flex-row gap-6' }}
                          className="max-w-lg text-oceanblue "
                          defaultValue={selectedPrice}
                          onChange={(value) =>
                            setSelectedPrice(value as [number, number])
                          }
                          formatOptions={{ style: 'currency', currency: 'EUR' }}
                          label="Price Range"
                          maxValue={maxPrice}
                          minValue={0}
                          step={maxPrice > 1000 ? maxPrice / 20 : 50}
                        />
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>

                  {/* Filtre par modèle */}
                  <div className="flex flex-col">
                    <Autocomplete
                      className="w-[200px] "
                      aria-label="Select a model"
                      classNames={{
                        base: 'max-w-xs h-[30px]',
                        listboxWrapper: 'max-h-[320px] ',
                        selectorButton: 'text-oceanblue h-[28px] w-[28px] text',
                        clearButton: 'text-oceanblue h-[28px] w-[28px]'
                      }}
                      inputProps={{
                        classNames: {
                          input:
                            ' h-[30px] text-oceanblue placeholder:pl-1 placeholder:text-32 placeholder:text-oceanblue placeholder:font-medium group-data-[has-value=true]:font-medium group-data-[has-value=true]:text-oceanblue ',
                          mainWrapper: 'max-h-[30px] text-oceanblue',
                          inputWrapper:
                            'text-oceanblue max-h-[30px] min-h-[0px] border-none shadow-none bg-lightgrey '
                        }
                      }}
                      listboxProps={{
                        itemClasses: {
                          base: [
                            'text-oceanblue',
                            'rounded-medium',
                            'text-default-500',
                            'transition-opacity',
                            'data-[hover=true]:text-oceanblue',
                            'data-[pressed=true]:opacity-70',
                            'data-[hover=true]:bg-default-200',
                            'data-[selectable=true]:focus:bg-default-100',
                            'data-[focus-visible=true]:ring-default-500',
                            'data-[selectable=true]:text-oceanblue'
                          ]
                        }
                      }}
                      placeholder="Select a model"
                      popoverProps={{
                        offset: 10,
                        classNames: {
                          base: 'rounded-large ',
                          content: 'p-1 bg-fullwhite',
                          arrow: ''
                        }
                      }}
                      radius="full"
                      onSelectionChange={(value) =>
                        setSelectedModel(value as string)
                      }
                    >
                      {Array.from(new Set(boats.map((boat) => boat.model))).map(
                        (model) => (
                          <AutocompleteItem key={model}>
                            {model}
                          </AutocompleteItem>
                        )
                      )}
                    </Autocomplete>
                  </div>

                  {/* Filtre par localisation */}
                  <div className="flex flex-col">
                    <Autocomplete
                      className="w-[200px]"
                      aria-label="Select a country"
                      classNames={{
                        base: 'max-w-xs h-[30px]',
                        listboxWrapper: 'max-h-[320px] ',
                        selectorButton: 'text-oceanblue h-[28px] w-[28px] text',
                        clearButton: 'text-oceanblue h-[28px] w-[28px]'
                      }}
                      inputProps={{
                        classNames: {
                          input:
                            ' h-[30px] text-oceanblue placeholder:pl-1 placeholder:text-32 placeholder:text-oceanblue placeholder:font-medium group-data-[has-value=true]:font-medium group-data-[has-value=true]:text-oceanblue ',
                          mainWrapper: 'max-h-[30px] text-oceanblue',
                          inputWrapper:
                            'text-oceanblue max-h-[30px] min-h-[0px] border-none shadow-none bg-lightgrey '
                        }
                      }}
                      listboxProps={{
                        itemClasses: {
                          base: [
                            'text-oceanblue',
                            'rounded-medium',
                            'text-default-500',
                            'transition-opacity',
                            'data-[hover=true]:text-oceanblue',
                            'data-[pressed=true]:opacity-70',
                            'data-[hover=true]:bg-default-200',
                            'data-[selectable=true]:focus:bg-default-100',
                            'data-[focus-visible=true]:ring-default-500',
                            'data-[selectable=true]:text-oceanblue'
                          ]
                        }
                      }}
                      placeholder="Select a country"
                      popoverProps={{
                        offset: 10,
                        classNames: {
                          base: 'rounded-large ',
                          content: 'p-1 bg-fullwhite',
                          arrow: ''
                        }
                      }}
                      radius="full"
                      onSelectionChange={(value) =>
                        setSelectedCountry(value as string)
                      }
                    >
                      <AutocompleteItem
                        key="Argentina"
                        startContent={
                          <Avatar
                            alt="Argentina"
                            className="w-6 h-6"
                            src="https://flagcdn.com/ar.svg"
                          />
                        }
                      >
                        Argentina
                      </AutocompleteItem>
                      <AutocompleteItem
                        key="Venezuela"
                        startContent={
                          <Avatar
                            alt="Venezuela"
                            className="w-6 h-6"
                            src="https://flagcdn.com/ve.svg"
                          />
                        }
                      >
                        Venezuela
                      </AutocompleteItem>
                      <AutocompleteItem
                        key="Brazil"
                        startContent={
                          <Avatar
                            alt="Brazil"
                            className="w-6 h-6"
                            src="https://flagcdn.com/br.svg"
                          />
                        }
                      >
                        Brazil
                      </AutocompleteItem>
                      <AutocompleteItem
                        key="Switzerland"
                        startContent={
                          <Avatar
                            alt="Switzerland"
                            className="w-6 h-6"
                            src="https://flagcdn.com/ch.svg"
                          />
                        }
                      >
                        Switzerland
                      </AutocompleteItem>
                      <AutocompleteItem
                        key="Germany"
                        startContent={
                          <Avatar
                            alt="Germany"
                            className="w-6 h-6"
                            src="https://flagcdn.com/de.svg"
                          />
                        }
                      >
                        Germany
                      </AutocompleteItem>
                      <AutocompleteItem
                        key="Spain"
                        startContent={
                          <Avatar
                            alt="Spain"
                            className="w-6 h-6"
                            src="https://flagcdn.com/es.svg"
                          />
                        }
                      >
                        Spain
                      </AutocompleteItem>
                      <AutocompleteItem
                        key="France"
                        startContent={
                          <Avatar
                            alt="France"
                            className="w-6 h-6"
                            src="https://flagcdn.com/fr.svg"
                          />
                        }
                      >
                        France
                      </AutocompleteItem>
                      <AutocompleteItem
                        key="Italy"
                        startContent={
                          <Avatar
                            alt="Italy"
                            className="w-6 h-6"
                            src="https://flagcdn.com/it.svg"
                          />
                        }
                      >
                        Italy
                      </AutocompleteItem>
                      <AutocompleteItem
                        key="Mexico"
                        startContent={
                          <Avatar
                            alt="Mexico"
                            className="w-6 h-6"
                            src="https://flagcdn.com/mx.svg"
                          />
                        }
                      >
                        Mexico
                      </AutocompleteItem>
                    </Autocomplete>
                  </div>
                </div>

                {/* Tri */}
                <Dropdown
                  classNames={{ content: 'hover:bg-fullwhite' }}
                  className="hover:bg-fullwhite !important"
                >
                  <DropdownTrigger>
                    <button className="rounded-[100px] px-[20px] h-[30px] flex flex-row gap-2 items-center hover:bg-smokygrey bg-lightgrey text-oceanblue">
                      <div className="font-medium text-14">Sort</div>
                      <ArrowUpDown size={16} />
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Sort options"
                    className="hover:bg-fullwhite !important"
                    classNames={{
                      base: 'hover:bg-fullwhite !important',
                      list: 'hover:bg-fullwhite !important'
                    }}
                  >
                    <DropdownItem
                      key="created_desc"
                      classNames={{
                        base: 'data-[hover]:bg-fullwhite cursor-pointer text-oceanblue'
                      }}
                      onClick={() => setSelectedSort('created_desc')}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">Newest First</span>
                        <span className="text-xs text-gray-500">
                          Most recent listings
                        </span>
                      </div>
                    </DropdownItem>
                    <DropdownItem
                      key="created_asc"
                      classNames={{
                        base: 'data-[hover]:bg-fullwhite cursor-pointer text-oceanblue'
                      }}
                      onClick={() => setSelectedSort('created_asc')}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">Oldest First</span>
                        <span className="text-xs text-gray-500">
                          Oldest listings
                        </span>
                      </div>
                    </DropdownItem>
                    <DropdownItem
                      key="price_asc"
                      classNames={{
                        base: 'data-[hover]:bg-fullwhite cursor-pointer text-oceanblue'
                      }}
                      onClick={() => setSelectedSort('price_asc')}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">Price: Low to High</span>
                        <span className="text-xs text-gray-500">
                          Cheapest first
                        </span>
                      </div>
                    </DropdownItem>
                    <DropdownItem
                      key="price_desc"
                      classNames={{
                        base: 'data-[hover]:bg-fullwhite cursor-pointer text-oceanblue'
                      }}
                      onClick={() => setSelectedSort('price_desc')}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">Price: High to Low</span>
                        <span className="text-xs text-gray-500">
                          Most expensive first
                        </span>
                      </div>
                    </DropdownItem>
                    <DropdownItem
                      key="model_asc"
                      classNames={{
                        base: 'data-[hover]:bg-fullwhite cursor-pointer text-oceanblue'
                      }}
                      onClick={() => setSelectedSort('model_asc')}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">Model: A-Z</span>
                        <span className="text-xs text-gray-500">
                          Alphabetical order
                        </span>
                      </div>
                    </DropdownItem>
                    <DropdownItem
                      key="model_desc"
                      classNames={{
                        base: 'data-[hover]:bg-fullwhite cursor-pointer text-oceanblue'
                      }}
                      onClick={() => setSelectedSort('model_desc')}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">Model: Z-A</span>
                        <span className="text-xs text-gray-500">
                          Reverse alphabetical
                        </span>
                      </div>
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>
          )}

          <div
            className={`gap-32 ${!spotlight ? 'grid grid-cols-2 gap-x-[17px] gap-y-[32px]' : 'flex flex-col'}`}
          >
            {isLoading
              ? createSkeletonCards(spotlight ? 3 : 6)
              : filteredBoats.map((boat) => {
                  // Parse les photos si elles sont sous forme de chaîne JSON
                  const photos =
                    boat.photos && typeof boat.photos === 'string'
                      ? JSON.parse(boat.photos)
                      : boat.photos;

                  // Ajoute le préfixe à chaque URL de photo
                  const prefixedPhotos = Array.isArray(photos)
                    ? photos
                        .map((photo) => normalizePhotoUrl(photo, boat.id))
                        .filter((url) => url && url.trim() !== '')
                    : [];

                  // Vérifie si on a des images valides ou si c'est une nouvelle annonce en traitement
                  const hasValidImages = prefixedPhotos.length > 0;
                  const imageUrl = hasValidImages ? prefixedPhotos[0] : null;

                  // Formate la date de création
                  const formattedDate = boat.createdAt
                    ? new Date(boat.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        day: 'numeric',
                        month: 'long'
                      })
                    : 'Unknown';

                  // Calcule la date d'expiration (3 mois par défaut, 4 mois pour podium)
                  // Même logique que dans BoatListingFormV2
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

                  return edit ? (
                    <div
                      key={boat.id}
                      className={`group border-stonegrey border-2 hover:border-articblue overflow-hidden transition-all cursor-pointer duration-300 rounded-[16px] ${
                        edit ? 'bg-white' : ''
                      }`}
                    >
                      {/* Version tableau pour le mode edit */}
                      <div className="p-6">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Image */}
                          <div className="col-span-3">
                            <div className="relative overflow-hidden min-h-[120px] rounded-lg">
                              <div className="absolute z-10 m-2 bg-fullwhite w-fit px-[8px] py-[4px] rounded-[5px] text-oceanblue text-xs">
                                {boat.country}
                              </div>
                              {hasValidImages && imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={`${getModelLabel(boat.model)} photo`}
                                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-lg"
                                  loading="lazy"
                                  onLoad={() =>
                                    logImageEvent(
                                      'load',
                                      boat.id,
                                      imageUrl as string
                                    )
                                  }
                                  onError={(e) => {
                                    handleImageError(
                                      boat.id,
                                      imageUrl as string,
                                      e.currentTarget
                                    );
                                  }}
                                />
                              ) : (
                                <div className="absolute inset-0 w-full h-full bg-gray-100 flex items-center justify-center rounded-lg">
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-articblue"></div>
                                    <span className="text-xs text-oceanblue font-medium">
                                      Loading...
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Informations principales */}
                          <div className="col-span-5">
                            <div className="flex flex-col gap-2">
                              <h3 className="text-24 font-semibold text-articblue">
                                {getModelLabel(boat.model)}
                              </h3>
                              <div className="flex items-center gap-4 text-16 text-oceanblue">
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">Price:</span>
                                  <span className="text-articblue font-semibold">
                                    {formatPrice(Number(boat.price))}{' '}
                                    {boat.currency}
                                  </span>
                                </div>
                              </div>
                              <div className="text-14 text-oceanblue">
                                Created: {formattedDate}
                              </div>
                            </div>
                          </div>

                          {/* Statut et expiration */}
                          <div className="col-span-3">
                            <div className="flex flex-col gap-1">
                              <div className="text-14">
                                <span className="font-medium text-oceanblue">
                                  Expires:{' '}
                                </span>
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
                              </div>
                              {isExpired && (
                                <span className="text-red-500 font-medium text-14">
                                  Expired
                                </span>
                              )}
                              {!isExpired && daysUntilExpiration !== null && (
                                <span
                                  className={`font-medium text-14 ${
                                    expiresSoon
                                      ? 'text-orange-500'
                                      : 'text-oceanblue'
                                  }`}
                                >
                                  {expiresSoon
                                    ? `${daysUntilExpiration} days left`
                                    : 'Active'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="col-span-1 flex justify-end">
                            <Dropdown>
                              <DropdownTrigger>
                                <div
                                  className="w-[40px] h-[40px] flex justify-center text-articblue bg-gray-50 hover:bg-articblue hover:text-white border border-articblue rounded-lg transition-all duration-300 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  {deletingBoatId === boat.id ? (
                                    <Spinner
                                      classNames={{
                                        wrapper: 'min-w-[20px]',
                                        dots: 'bg-articblue group-hover:bg-fullwhite'
                                      }}
                                      variant="wave"
                                    />
                                  ) : (
                                    <MoreVertical size={18} />
                                  )}
                                </div>
                              </DropdownTrigger>
                              <DropdownMenu
                                aria-label="Boat actions"
                                classNames={{
                                  base: 'max-h-[400px] overflow-y-auto bg-fullwhite',
                                  list: 'bg-fullwhite'
                                }}
                                onAction={(key) => {
                                  if (key === 'view') {
                                    router.push(`/boat/${boat.id}`);
                                    return;
                                  }
                                  if (key === 'edit') {
                                    sessionStorage.setItem(
                                      `boat-${boat.id}`,
                                      JSON.stringify(boat)
                                    );
                                    router.push(`/edit-listing/${boat.id}`);
                                    return;
                                  }
                                  if (key === 'delete') {
                                    handleDeleteBoat(boat.id);
                                  }
                                }}
                              >
                                <DropdownItem
                                  key="view"
                                  startContent={<EyeIcon size={16} />}
                                  classNames={{
                                    base: 'text-oceanblue data-[hover=true]:bg-lightgrey data-[hover=true]:text-oceanblue'
                                  }}
                                >
                                  View Listing
                                </DropdownItem>
                                <DropdownItem
                                  key="edit"
                                  startContent={<EditIcon size={16} />}
                                  classNames={{
                                    base: 'text-oceanblue data-[hover=true]:bg-lightgrey data-[hover=true]:text-oceanblue'
                                  }}
                                >
                                  Edit Listing
                                </DropdownItem>
                                <DropdownItem
                                  key="delete"
                                  startContent={<TrashIcon size={16} />}
                                  classNames={{
                                    base: 'text-danger data-[hover=true]:bg-red-50 data-[hover=true]:text-danger'
                                  }}
                                >
                                  Delete Listing
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                        </div>
                      </div>
                      {/* Clickable area: image + content (keeps dropdown area non-navigable) */}
                      <div
                        role="link"
                        tabIndex={0}
                        className="flex flex-row flex-1"
                        onClick={() => router.push(`/boat/${boat.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            router.push(`/boat/${boat.id}`);
                          }
                        }}
                      >
                        {/* Image (stable sizing to avoid flicker) */}
                        <div className="w-1/3 relative overflow-hidden min-h-[180px]">
                          <div className="absolute z-10 m-3 bg-fullwhite w-fit px-[10px] rounded-[7px] text-oceanblue">
                            {boat.country}
                          </div>
                          {hasValidImages && imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={`${getModelLabel(boat.model)} photo`}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              loading="lazy"
                              onLoad={() =>
                                logImageEvent(
                                  'load',
                                  boat.id,
                                  imageUrl as string
                                )
                              }
                              onError={(e) => {
                                handleImageError(
                                  boat.id,
                                  imageUrl as string,
                                  e.currentTarget
                                );
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 w-full h-full bg-gray-100 flex items-center justify-center">
                              <div className="flex flex-col items-center gap-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-articblue"></div>
                                <span className="text-xs text-oceanblue font-medium">
                                  Loading image...
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Contenu */}
                        <div className="flex flex-col p-32 flex-1 bg-fullwhite justify-around">
                          <div className="flex flex-col">
                            <h3 className="text-32 font-medium text-articblue">
                              {getModelLabel(boat.model)}
                            </h3>
                          </div>

                          <div className="text-oceanblue flex flex-row text-20">
                            Price:
                            <span className="text-oceanblue font-medium text-20 ">
                              {formatPrice(Number(boat.price))} {boat.currency}
                            </span>
                          </div>
                          <div className="text-oceanblue flex flex-col text-16 gap-1">
                            <div>
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
                            </div>
                            {isExpired && (
                              <span className="text-red-500 font-medium text-16">
                                Expired
                              </span>
                            )}
                            {!isExpired && daysUntilExpiration !== null && (
                              <span
                                className={`font-medium text-16 ${
                                  expiresSoon
                                    ? 'text-orange-500'
                                    : 'text-oceanblue'
                                }`}
                              >
                                Expires in {daysUntilExpiration} day
                                {daysUntilExpiration !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Menu Actions pour le mode edit */}
                      <div
                        className="bg-fullwhite flex items-center justify-center"
                        // Keep dropdown interactions from bubbling into the clickable card area.
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Dropdown>
                          <DropdownTrigger>
                            <div
                              className="w-[60px] mr-24 h-fit py-2 flex justify-center text-articblue bg-fullwhite border-2 border-articblue rounded-[75px] transition-all duration-300 hover:text-fullwhite hover:bg-articblue cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              {deletingBoatId === boat.id ? (
                                <Spinner
                                  classNames={{
                                    wrapper: 'min-w-[30px]',
                                    dots: 'bg-articblue group-hover:bg-fullwhite'
                                  }}
                                  variant="wave"
                                />
                              ) : (
                                <MoreVertical size={20} />
                              )}
                            </div>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label="Boat actions"
                            classNames={{
                              base: 'max-h-[400px] overflow-y-auto bg-fullwhite',
                              list: 'bg-fullwhite'
                            }}
                            onAction={(key) => {
                              if (key === 'view') {
                                router.push(`/boat/${boat.id}`);
                                return;
                              }
                              if (key === 'edit') {
                                sessionStorage.setItem(
                                  `boat-${boat.id}`,
                                  JSON.stringify(boat)
                                );
                                router.push(`/edit-listing/${boat.id}`);
                                return;
                              }
                              if (key === 'delete') {
                                handleDeleteBoat(boat.id);
                              }
                            }}
                          >
                            <DropdownItem
                              key="view"
                              startContent={<EyeIcon size={16} />}
                              classNames={{
                                base: 'text-oceanblue data-[hover=true]:bg-lightgrey data-[hover=true]:text-oceanblue'
                              }}
                            >
                              View Listing
                            </DropdownItem>
                            <DropdownItem
                              key="edit"
                              startContent={<EditIcon size={16} />}
                              classNames={{
                                base: 'text-oceanblue data-[hover=true]:bg-lightgrey data-[hover=true]:text-oceanblue'
                              }}
                            >
                              Edit Listing
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              startContent={<TrashIcon size={16} />}
                              classNames={{
                                base: 'text-danger data-[hover=true]:bg-red-50 data-[hover=true]:text-danger'
                              }}
                            >
                              Delete Listing
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </div>
                  ) : (
                    <Link href={`/boat/${boat.id}`} key={boat.id}>
                      <div
                        className={`group ${!spotlight ? 'border-stonegrey border-2 hover:border-articblue' : ''} flex flex-row  overflow-hidden transition-all cursor-pointer duration-300 rounded-[16px]`}
                        style={{
                          boxShadow: '0px 1px 20px 0px #00000014'
                        }}
                      >
                        {/* Image (stable sizing to avoid flicker) */}
                        <div className="w-1/3 relative overflow-hidden min-h-[180px]">
                          <div className="absolute z-10 m-3 bg-fullwhite w-fit px-[10px] rounded-[7px] text-oceanblue">
                            {boat.country}
                          </div>
                          {hasValidImages && imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={`${getModelLabel(boat.model)} photo`}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              loading="lazy"
                              onLoad={() =>
                                logImageEvent(
                                  'load',
                                  boat.id,
                                  imageUrl as string
                                )
                              }
                              onError={(e) => {
                                handleImageError(
                                  boat.id,
                                  imageUrl as string,
                                  e.currentTarget
                                );
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 w-full h-full bg-gray-100 flex items-center justify-center">
                              <div className="flex flex-col items-center gap-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-articblue"></div>
                                <span className="text-xs text-oceanblue font-medium">
                                  Loading image...
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Contenu */}
                        <div className="flex flex-col p-32 flex-1 bg-fullwhite justify-around">
                          <div className="flex flex-col">
                            <p className="text-oceanblue text-16 italic">
                              {formattedDate}
                            </p>
                            <h3 className="text-32 font-medium text-articblue">
                              {getModelLabel(boat.model)}
                            </h3>
                          </div>

                          <div className="text-oceanblue flex flex-row text-20">
                            Price:
                            <span className="text-oceanblue font-medium text-20 pl-2">
                              {formatPrice(Number(boat.price))} {boat.currency}
                            </span>
                          </div>
                        </div>

                        {/* Flèche See More */}
                        <div className="bg-fullwhite flex items-center justify-center">
                          <div className="w-[60px] mr-24 h-fit py-2 flex justify-center text-articblue bg-fullwhite border-2 border-articblue rounded-[75px] transition-all duration-300 group-hover:text-fullwhite group-hover:bg-articblue">
                            <ArrowSeemore />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </>
      )}
    </>
  );
}
