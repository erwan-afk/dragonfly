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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@heroui/modal';
import { Button } from '@heroui/button';
import {
  EditIcon,
  EyeIcon,
  TrashIcon,
  MoreVertical,
  ArrowUpDown
} from 'lucide-react';
import Link from 'next/link';
import { Spinner } from '@heroui/spinner';
import { Skeleton } from '@heroui/skeleton';
import { useRouter } from 'next/navigation';
import { Boat } from '@/types/database';
import {
  countries,
  getModelLabel,
  getProductLabel,
  dragonflyModels
} from '@/utils/constants';
import FlagIcon from '@/components/icons/Flag';

interface SpotlightBoatsProps {
  boats: Boat[];
  spotlight?: boolean;
  accountTable?: boolean; // Nouveau prop pour le mode tableau account
  userId?: string;
  products?: any[];
  isLoading?: boolean;
  searchResultsInfo?: string | null; // Informations sur les résultats de recherche
}

export default function SpotlightBoats({
  boats,
  spotlight,
  accountTable,
  userId,
  products = [],
  isLoading,
  searchResultsInfo
}: SpotlightBoatsProps) {
  const router = useRouter();
  const renderStartedAtRef = useRef<number>(Date.now());
  const loggedImageEventsRef = useRef<Set<string>>(new Set());

  const shouldLogImages =
    process.env.NODE_ENV !== 'production' ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost');

  const normalizePhotoUrl = (value: any, boatId?: string): string => {
    if (!value || typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';

    if (trimmed.includes('temp_session_') && trimmed.startsWith('http')) {
      const urlParts = trimmed.split('/');
      const tempFilename = urlParts[urlParts.length - 1];

      if (tempFilename && boatId) {
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
    console.log(`[SpotlightBoats:image:${kind}] +${dt}ms`, {
      boatId,
      url
    });
  };

  const maxPrice =
    boats.length > 0
      ? Math.max(...boats.map((boat) => Number(boat.price) || 0))
      : 1000;

  const [selectedPrice, setSelectedPrice] = useState<[number, number]>([
    0,
    maxPrice
  ]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedSort, setSelectedSort] = useState<string>('created_desc');
  const [deletingBoatId, setDeletingBoatId] = useState<string | null>(null);
  const [imageRetryCount, setImageRetryCount] = useState<
    Record<string, number>
  >({});

  const {
    isOpen: isDeleteModalOpen,
    onOpen: onOpenDeleteModal,
    onClose: onCloseDeleteModal
  } = useDisclosure();
  const [boatToDelete, setBoatToDelete] = useState<Boat | null>(null);

  const openDeleteModal = (boat: Boat) => {
    setBoatToDelete(boat);
    onOpenDeleteModal();
  };

  const handleDeleteBoat = (boat: Boat) => {
    openDeleteModal(boat);
  };

  const confirmDeleteBoat = async () => {
    if (!boatToDelete) return;

    setDeletingBoatId(boatToDelete.id);
    onCloseDeleteModal();
    setBoatToDelete(null);

    try {
      const response = await fetch(`/api/boats/${boatToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete boat');
      }

      router.refresh();
    } catch (error) {
      console.error('Error deleting boat:', error);
      alert('Failed to delete boat listing. Please try again.');
    } finally {
      setDeletingBoatId(null);
    }
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString('us-US');
  };

  const handleImageError = (
    boatId: string,
    originalUrl: string,
    imgElement: HTMLImageElement
  ) => {
    const currentRetryCount = imageRetryCount[boatId] || 0;

    if (!originalUrl || originalUrl.trim() === '') {
      console.log(
        `Image for boat ${boatId} has empty URL, waiting for data update...`
      );
      imgElement.style.display = 'none';
      return;
    }

    if (currentRetryCount < 3) {
      const retryUrl = `${originalUrl}${originalUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
      setImageRetryCount((prev) => ({
        ...prev,
        [boatId]: currentRetryCount + 1
      }));

      setTimeout(() => {
        imgElement.src = retryUrl;
      }, 500);
    } else {
      logImageEvent('error', boatId, originalUrl);
      imgElement.style.display = 'none';
    }
  };

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

  // Applique les filtres seulement si on n'est pas en mode accountTable
  const filteredBoats = accountTable
    ? boats
    : (() => {
        const filtered = boats.filter((boat) => {
          const price = Number(boat.price) ?? 0;
          const inPriceRange =
            price >= selectedPrice[0] && price <= selectedPrice[1];
          const matchesModel = !selectedModel || boat.model === selectedModel;
          const matchesCountry =
            !selectedCountry || boat.country === selectedCountry;
          return inPriceRange && matchesModel && matchesCountry;
        });

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

  // Mode tableau pour l'account
  const renderAccountTableView = () => {
    if (!accountTable || boats.length === 0) return null;

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
                <th className="px-6 py-4 text-left text-xs font-medium text-fullwhite uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-fullwhite uppercase tracking-wider">
                  Upgrade
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-fullwhite uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {boats.map((boat) => {
                const photos =
                  boat.photos && typeof boat.photos === 'string'
                    ? JSON.parse(boat.photos)
                    : boat.photos;

                const prefixedPhotos = Array.isArray(photos)
                  ? photos
                      .map((photo) => normalizePhotoUrl(photo, boat.id))
                      .filter((url) => url && url.trim() !== '')
                  : [];

                const hasValidImages = prefixedPhotos.length > 0;
                const imageUrl = hasValidImages ? prefixedPhotos[0] : null;

                const formattedDate = boat.createdAt
                  ? new Date(boat.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      day: 'numeric',
                      month: 'long'
                    })
                  : 'Unknown';

                const expirationDate = boat.createdAt
                  ? (() => {
                      const created = new Date(boat.createdAt);
                      const expiration = new Date(created);
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

                    {/* Plan */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900 font-medium">
                          {getProductLabel(
                            (boat as any).productId || (boat as any).product_id,
                            products
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Upgrade */}
                    <td className="text-center py-4 whitespace-nowrap">
                      {(() => {
                        const productId =
                          (boat as any).productId || (boat as any).product_id;
                        return productId ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Upgrade clicked for boat:', boat.id);
                            }}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-articblue hover:bg-oceanblue transition-colors duration-200"
                          >
                            Upgrade
                          </button>
                        ) : null;
                      })()}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <Dropdown>
                        <DropdownTrigger>
                          <button
                            className="text-oceanblue hover:text-oceanblue px-4 py-4 rounded-lg hover:bg-articblue/20 transition-colors"
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
                            base: 'max-h-[400px] overflow-y-auto',
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
                              handleDeleteBoat(boat);
                            }
                          }}
                        >
                          <DropdownItem
                            key="view"
                            startContent={<EyeIcon size={14} />}
                            classNames={{
                              base: 'text-oceanblue data-[hover=true]:bg-articblue/10 data-[hover=true]:text-oceanblue'
                            }}
                          >
                            View Listing
                          </DropdownItem>
                          <DropdownItem
                            key="edit"
                            startContent={<EditIcon size={14} />}
                            classNames={{
                              base: 'text-oceanblue data-[hover=true]:bg-articblue/10 data-[hover=true]:text-oceanblue'
                            }}
                          >
                            Edit Listing
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            startContent={<TrashIcon size={14} />}
                            classNames={{
                              base: 'text-red-600 data-[hover=true]:bg-red-600/10 data-[hover=true]:text-red-600'
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

  // Si on est en mode accountTable, on affiche uniquement le tableau
  if (accountTable) {
    return (
      <>
        {renderAccountTableView()}

        {/* Modal de confirmation de suppression */}
        <Modal
          isOpen={isDeleteModalOpen}
          onOpenChange={onCloseDeleteModal}
          size="md"
          hideCloseButton
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1 text-center text-oceanblue">
                  Delete Boat Listing
                </ModalHeader>
                <ModalBody>
                  <div className="flex flex-col gap-32 items-center justify-center">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <TrashIcon className="w-5 h-5 text-red-600" />
                      </div>
                    </div>
                    <div className="w-full text-center flex flex-col gap-16">
                      <h3 className="text-lg text-oceanblue mb-2">
                        Are you sure you want to delete this listing?
                      </h3>
                      {boatToDelete && (
                        <div className="bg-gray-50 rounded-lg p-3 border">
                          <div className="font-medium text-oceanblue">
                            {getModelLabel(boatToDelete.model)}
                          </div>
                          <div className="text-sm text-oceanblue mt-1">
                            {formatPrice(Number(boatToDelete.price))}{' '}
                            {boatToDelete.currency} • {boatToDelete.country}
                          </div>
                        </div>
                      )}
                      <p className="text-sm text-red-600 mt-3 font-medium text-center">
                        ⚠️ This action cannot be undone. The listing will be
                        permanently removed.
                      </p>
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter className="flex flex-row justify-center gap-4">
                  <Button
                    onPress={onClose}
                    className="px-6 bg-fullwhite text-oceanblue border-2 border-oceanblue/10 data-[hover=true]:bg-oceanblue data-[hover=true]:text-fullwhite rounded-lg"
                    style={{
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="danger"
                    onPress={confirmDeleteBoat}
                    isLoading={deletingBoatId === boatToDelete?.id}
                    className="px-6 text-fullwhite font-semibold rounded-lg"
                    startContent={
                      !deletingBoatId && (
                        <TrashIcon
                          size={18}
                          className="text-18 min-w-[18px] min-h-[18px]"
                        />
                      )
                    }
                  >
                    {deletingBoatId === boatToDelete?.id
                      ? 'Deleting...'
                      : 'Delete Listing'}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>
    );
  }

  // Mode normal (cards avec filtres)
  return (
    <>
      {!spotlight && (
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
                  <button className="rounded-[100px] px-[20px] h-[30px] flex flex-row gap-2 items-center hover:bg-smokygrey bg-lightgrey text-oceanblue">
                    <div className="font-medium text-14">Price</div>
                    <ArrowDropdown />
                  </button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Dynamic Actions"
                  className="hover:bg-fullwhite !important"
                  classNames={{
                    base: 'hover:bg-fullwhite !important',
                    list: 'hover:bg-fullwhite !important'
                  }}
                >
                  <DropdownItem
                    key="price"
                    classNames={{
                      base: 'data-[hover]:bg-fullwhite cursor-default'
                    }}
                  >
                    <Slider
                      classNames={{ labelWrapper: 'flex flex-row gap-6' }}
                      className="max-w-lg text-oceanblue"
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
                  className="w-[200px]"
                  aria-label="Select a model"
                  classNames={{
                    base: 'max-w-xs h-[30px]',
                    listboxWrapper: 'max-h-[320px]',
                    selectorButton: 'text-oceanblue h-[28px] w-[28px] text',
                    clearButton: 'text-oceanblue h-[28px] w-[28px]'
                  }}
                  inputProps={{
                    classNames: {
                      input:
                        'h-[30px] text-oceanblue placeholder:pl-1 placeholder:text-32 placeholder:text-oceanblue placeholder:font-medium group-data-[has-value=true]:font-medium group-data-[has-value=true]:text-oceanblue',
                      mainWrapper: 'max-h-[30px] text-oceanblue',
                      inputWrapper:
                        'text-oceanblue max-h-[30px] min-h-[0px] border-none shadow-none bg-lightgrey'
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
                      base: 'rounded-large',
                      content: 'p-1 bg-fullwhite',
                      arrow: ''
                    }
                  }}
                  radius="full"
                  onSelectionChange={(value) =>
                    setSelectedModel(value as string)
                  }
                  selectedKey={selectedModel}
                >
                  {dragonflyModels.map((model) => (
                    <AutocompleteItem key={model.key}>
                      {model.label}
                    </AutocompleteItem>
                  ))}
                </Autocomplete>
              </div>

              {/* Filtre par localisation */}
              <div className="flex flex-col">
                <Autocomplete
                  className="w-[200px]"
                  aria-label="Select a country"
                  classNames={{
                    base: 'max-w-xs h-[30px]',
                    listboxWrapper: 'max-h-[320px]',
                    selectorButton: 'text-oceanblue h-[28px] w-[28px] text',
                    clearButton: 'text-oceanblue h-[28px] w-[28px]'
                  }}
                  inputProps={{
                    classNames: {
                      input:
                        'h-[30px] text-oceanblue placeholder:pl-1 placeholder:text-32 placeholder:text-oceanblue placeholder:font-medium group-data-[has-value=true]:font-medium group-data-[has-value=true]:text-oceanblue',
                      mainWrapper: 'max-h-[30px] text-oceanblue',
                      inputWrapper:
                        'text-oceanblue max-h-[30px] min-h-[0px] border-none shadow-none bg-lightgrey'
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
                      base: 'rounded-large',
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

      {/* Informations sur les résultats de recherche */}
      {!spotlight && (
        <div className=" flex flex-row items-center justify-between gap-4 ">
          <p className="text-oceanblue text-16 ">
            {(() => {
              const activeFilters = [];
              if (selectedModel) {
                const model = dragonflyModels.find(
                  (m) => m.key === selectedModel
                );
                activeFilters.push(`${model?.label}`);
              }
              if (selectedCountry) activeFilters.push(`${selectedCountry}`);
              if (selectedPrice[0] > 0 || selectedPrice[1] < maxPrice) {
                activeFilters.push(`${selectedPrice[0]} - ${selectedPrice[1]}`);
              }

              return activeFilters.length > 0
                ? `Search for: ${activeFilters.join(', ')}`
                : 'Search :';
            })()}
          </p>
          <p className="text-oceanblue text-16 ">
            {filteredBoats.length} result{filteredBoats.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      <div
        className={`gap-32 ${!spotlight ? 'grid grid-cols-2 gap-x-[17px] gap-y-[32px]' : 'flex flex-col'}`}
      >
        {isLoading ? (
          createSkeletonCards(spotlight ? 3 : 6)
        ) : filteredBoats.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-16 px-4">
            <div className="text-center">
              <div className="text-6xl mb-4">🚤</div>
              <h3 className="text-24 font-medium text-oceanblue mb-2">
                No boats found
              </h3>
              <p className="text-16 text-oceanblue/70">
                Try adjusting your search filters to find more results.
              </p>
            </div>
          </div>
        ) : (
          filteredBoats.map((boat) => {
            const photos =
              boat.photos && typeof boat.photos === 'string'
                ? JSON.parse(boat.photos)
                : boat.photos;

            const prefixedPhotos = Array.isArray(photos)
              ? photos
                  .map((photo) => normalizePhotoUrl(photo, boat.id))
                  .filter((url) => url && url.trim() !== '')
              : [];

            const hasValidImages = prefixedPhotos.length > 0;
            const imageUrl = hasValidImages ? prefixedPhotos[0] : null;

            const formattedDate = boat.createdAt
              ? new Date(boat.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  day: 'numeric',
                  month: 'long'
                })
              : 'Unknown';

            return (
              <Link href={`/boat/${boat.id}`} key={boat.id}>
                <div
                  className={`group border-stonegrey border-2 hover:border-articblue flex flex-row overflow-hidden transition-all cursor-pointer duration-300 rounded-[16px]`}
                  style={{
                    boxShadow: '0px 1px 20px 0px #00000014'
                  }}
                >
                  {/* Image */}
                  <div className="w-1/3 relative overflow-hidden min-h-[180px]">
                    <div className="absolute flex flex-row items-center gap-2 z-10 m-3 bg-fullwhite w-fit px-[10px] rounded-[7px] text-oceanblue bottom-0">
                      {countries.find((country) => country.key === boat.country)
                        ?.label || ''}
                      <FlagIcon
                        flag={
                          countries.find(
                            (country) => country.key === boat.country
                          )?.flag || ''
                        }
                      />
                    </div>

                    {hasValidImages && imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={`${getModelLabel(boat.model)} photo`}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
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
                  <div
                    className={`flex flex-1 flex-col gap-16 bg-fullwhite ${spotlight ? 'p-32  ' : 'p-24 '}`}
                  >
                    {spotlight ? (
                      /* Mode Spotlight - Layout épuré */
                      <>
                        <div className="flex flex-row justify-between h-full w-full">
                          {/* Section supérieure : Titre et date */}
                          <div className="flex flex-col h-fit">
                            <p className="text-oceanblue text-16 ">
                              {formattedDate}
                            </p>
                            <h3 className="text-32 font-medium text-articblue leading-tight">
                              {getModelLabel(boat.model)}
                            </h3>
                          </div>

                          {/* Section centrale : Prix principal */}
                        </div>
                        <div className="flex flex-row items-center gap-2 ">
                          {boat.specifications.map((specification) => (
                            <span
                              className="text-oceanblue bg-lightgrey px-2 py-1 rounded-[6px] text-14"
                              key={specification}
                            >
                              {specification}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-row items-center gap-2 ">
                          <span className="text-oceanblue">Price: </span>
                          <span className="font-medium text-oceanblue">
                            {formatPrice(Number(boat.price))} {boat.currency}
                          </span>
                        </div>
                      </>
                    ) : (
                      /* Mode Normal - Layout vertical compact */
                      <>
                        {/* Section supérieure : Date et titre */}
                        <div className="flex flex-col gap-8">
                          <p className="text-oceanblue text-14 italic">
                            {formattedDate}
                          </p>
                          <h3 className="text-24 font-medium text-articblue leading-tight">
                            {getModelLabel(boat.model)}
                          </h3>
                        </div>

                        {/* Section centrale : Prix */}
                        <div className="flex-1 flex items-center">
                          <div className="text-oceanblue text-18">
                            <span className="text-oceanblue/70">Price: </span>
                            <span className="font-semibold text-oceanblue">
                              {formatPrice(Number(boat.price))} {boat.currency}
                            </span>
                          </div>
                        </div>

                        {/* Section inférieure : Statistiques */}
                        <div className="flex items-center justify-between">
                          <span className="text-oceanblue/60 font-medium text-14">
                            {boat.viewCount} views
                          </span>
                        </div>
                      </>
                    )}
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
          })
        )}
      </div>
    </>
  );
}
