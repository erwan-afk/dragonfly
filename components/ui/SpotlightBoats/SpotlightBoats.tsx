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
import { ArrowUpCircle, Rocket, Plus } from 'lucide-react';
import { Button } from '@heroui/button';
import {
  EditIcon,
  EyeIcon,
  TrashIcon,
  MoreVertical,
  ArrowUpDown,
  RefreshCw,
  SlidersHorizontal,
  X,
  Check,
  CheckSquare
} from 'lucide-react';
import Link from 'next/link';
import { Spinner } from '@heroui/spinner';
import { Skeleton } from '@heroui/skeleton';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Boat } from '@/types/database';
import {
  countries,
  getModelLabel,
  getProductLabel,
  dragonflyModels,
  currencies,
  boatConditions,
  getBoatYears
} from '@/utils/constants';
import FlagIcon from '@/components/icons/Flag';
import { specificationsData } from '@/utils/specifications';
import { formatPriceNumber } from '@/utils/format-price';
import { normalizePhotoUrl } from '@/utils/image-urls.client';

interface SpotlightBoatsProps {
  boats: Boat[];
  suggestedBoats?: Boat[]; // Bateaux suggérés quand les filtres URL ne retournent rien
  spotlight?: boolean;
  gridView?: boolean; // 3 colonnes, 1 ligne — layout homepage alternatif
  accountTable?: boolean; // Nouveau prop pour le mode tableau account
  userId?: string;
  products?: any[];
  isLoading?: boolean;
  searchResultsInfo?: string | null; // Informations sur les résultats de recherche
}

export default function SpotlightBoats({
  boats,
  suggestedBoats = [],
  spotlight,
  gridView,
  accountTable,
  userId,
  products = [],
  isLoading,
  searchResultsInfo
}: SpotlightBoatsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const renderStartedAtRef = useRef<number>(Date.now());
  const loggedImageEventsRef = useRef<Set<string>>(new Set());

  const shouldLogImages =
    process.env.NODE_ENV !== 'production' ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost');

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

  // Initialize states from URL parameters
  const [selectedPrice, setSelectedPrice] = useState<[number, number]>(() => {
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');
    const calculatedMaxPrice =
      boats.length > 0
        ? Math.max(...boats.map((boat) => Number(boat.price) || 0))
        : 1000;
    return [
      minPriceParam ? parseFloat(minPriceParam) : 0,
      maxPriceParam ? parseFloat(maxPriceParam) : calculatedMaxPrice
    ];
  });
  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    () => searchParams.get('currency') || 'EUR'
  );
  const [selectedModel, setSelectedModel] = useState<string | null>(() =>
    searchParams.get('model')
  );
  const [selectedCountry, setSelectedCountry] = useState<string | null>(() =>
    searchParams.get('country')
  );
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(() => {
    const attributes = searchParams.get('attributes');
    return attributes ? attributes.split(',') : [];
  });
  const [selectedSort, setSelectedSort] = useState<string>(
    () => searchParams.get('sort') || 'created_desc'
  );
  const [selectedCondition, setSelectedCondition] = useState<string | null>(
    () => searchParams.get('condition')
  );
  const [selectedYearMin, setSelectedYearMin] = useState<string | null>(
    () => searchParams.get('yearMin') || searchParams.get('year') || null
  );
  const [selectedYearMax, setSelectedYearMax] = useState<string | null>(
    () => searchParams.get('yearMax') || searchParams.get('year') || null
  );

  // Ref to track if we're initializing from URL
  const isInitializing = useRef(true);
  // Timer for debouncing URL updates
  const urlUpdateTimer = useRef<NodeJS.Timeout | null>(null);

  // Update URL without triggering navigation/re-render
  const syncFiltersToURL = () => {
    if (accountTable) return;

    const params = new URLSearchParams();

    if (selectedModel) params.set('model', selectedModel);
    if (selectedCountry) params.set('country', selectedCountry);
    if (selectedPrice[0] > 0)
      params.set('minPrice', Math.round(selectedPrice[0]).toString());
    if (selectedPrice[1] < maxPrice)
      params.set('maxPrice', Math.round(selectedPrice[1]).toString());
    if (selectedCurrency !== 'EUR') params.set('currency', selectedCurrency);
    if (selectedSpecs.length > 0)
      params.set('attributes', selectedSpecs.join(','));
    if (selectedCondition) params.set('condition', selectedCondition);
    if (selectedYearMin) params.set('yearMin', selectedYearMin);
    if (selectedYearMax) params.set('yearMax', selectedYearMax);
    if (selectedSort !== 'created_desc') params.set('sort', selectedSort);

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // Use replaceState to update URL without triggering re-render
    window.history.replaceState(null, '', newUrl);
  };

  // Update URL when filters change (debounced)
  useEffect(() => {
    if (accountTable) return;

    if (isInitializing.current) {
      isInitializing.current = false;
      return;
    }

    if (urlUpdateTimer.current) {
      clearTimeout(urlUpdateTimer.current);
    }

    urlUpdateTimer.current = setTimeout(syncFiltersToURL, 300);

    return () => {
      if (urlUpdateTimer.current) {
        clearTimeout(urlUpdateTimer.current);
      }
    };
  }, [
    selectedModel,
    selectedCountry,
    selectedPrice,
    selectedCurrency,
    selectedSpecs,
    selectedCondition,
    selectedYearMin,
    selectedYearMax,
    selectedSort,
    accountTable,
    maxPrice,
    pathname
  ]);

  const [deletingBoatId, setDeletingBoatId] = useState<string | null>(null);
  const [soldBoatId, setSoldBoatId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const {
    isOpen: isDeleteModalOpen,
    onOpen: onOpenDeleteModal,
    onClose: onCloseDeleteModal
  } = useDisclosure();
  const [boatToDelete, setBoatToDelete] = useState<Boat | null>(null);

  // Upgrade modal state
  const {
    isOpen: isUpgradeModalOpen,
    onOpen: onOpenUpgradeModal,
    onClose: onCloseUpgradeModal
  } = useDisclosure();
  const [boatToUpgrade, setBoatToUpgrade] = useState<Boat | null>(null);

  // Mobile filter/sort fullscreen modals
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);

  const openUpgradeModal = (boat: Boat) => {
    setBoatToUpgrade(boat);
    onOpenUpgradeModal();
  };

  const handleUpgradeClick = (boat: Boat, e: React.MouseEvent) => {
    e.stopPropagation();
    openUpgradeModal(boat);
  };

  const getUpgradeOptions = (currentProductId: string | null | undefined) => {
    // Sort products by price to determine upgrade hierarchy
    const sortedProducts = [...products].sort((a, b) => {
      const priceA = a.prices?.[0]?.unit_amount || 0;
      const priceB = b.prices?.[0]?.unit_amount || 0;
      return priceA - priceB;
    });

    const currentIndex = sortedProducts.findIndex(
      (p) => p.id === currentProductId
    );
    // Return products that are higher in the hierarchy (more expensive)
    return sortedProducts.filter((_, index) => index > currentIndex);
  };

  const openDeleteModal = (boat: Boat) => {
    setBoatToDelete(boat);
    onOpenDeleteModal();
  };

  const handleDeleteBoat = (boat: Boat) => {
    openDeleteModal(boat);
  };

  const handleMarkAsSold = async (boat: Boat) => {
    setSoldBoatId(boat.id);
    try {
      const response = await fetch(`/api/boats/${boat.id}/sold`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to mark as sold');
      router.refresh();
    } catch {
      alert('Failed to mark boat as sold. Please try again.');
    } finally {
      setSoldBoatId(null);
    }
  };

  const handleRelist = async (boat: Boat) => {
    setSoldBoatId(boat.id);
    try {
      const response = await fetch(`/api/boats/${boat.id}/sold`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to relist');
      router.refresh();
    } catch {
      alert('Failed to relist boat. Please try again.');
    } finally {
      setSoldBoatId(null);
    }
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

  const formatPrice = (price: number, currency?: string | null): string => {
    return formatPriceNumber(price, currency);
  };

  const getCurrencySymbol = (currency: string): string => {
    try {
      return (0)
        .toLocaleString('en', {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        })
        .replace(/[\d\s,.]/, '')
        .trim();
    } catch {
      return currency;
    }
  };

  const handleImageError = (boatId: string, url: string) => {
    logImageEvent('error', boatId, url);
    setFailedImages((prev) => {
      const next = new Set(prev);
      next.add(boatId);
      return next;
    });
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
    : gridView
      ? [...boats].sort((a, b) => {
          const isBoosted = (boat: any) => {
            const raw =
              (boat as any).boostExpiresAt || (boat as any).boost_expires_at;
            return !!raw && new Date(raw).getTime() > Date.now();
          };
          const tier = (boat: any) => {
            const name = ((boat as any).productName || '').toLowerCase();
            if (name === 'podium') return 1;
            if (isBoosted(boat)) return 2;
            if (name.includes('mid-course') || name.includes('mid course'))
              return 3;
            return 4;
          };
          const tierDiff = tier(a) - tier(b);
          if (tierDiff !== 0) return tierDiff;
          return ((b as any).viewCount ?? 0) - ((a as any).viewCount ?? 0);
        })
      : (() => {
          const filtered = boats.filter((boat) => {
            const price = Number(boat.price) ?? 0;
            const inPriceRange =
              price >= selectedPrice[0] && price <= selectedPrice[1];
            const matchesModel = !selectedModel || boat.model === selectedModel;
            const matchesCountry =
              !selectedCountry || boat.country === selectedCountry;
            const matchesSpecs =
              selectedSpecs.length === 0 ||
              selectedSpecs.every((spec) =>
                boat.specifications?.includes(spec)
              );
            const matchesCondition =
              !selectedCondition ||
              (boat as any).condition === selectedCondition;
            const boatYear = Number((boat as any).year);
            const yMin = selectedYearMin ? parseInt(selectedYearMin, 10) : null;
            const yMax = selectedYearMax ? parseInt(selectedYearMax, 10) : null;
            const matchesYear =
              (!yMin && !yMax) ||
              (Number.isFinite(boatYear) &&
                (yMin === null || boatYear >= yMin) &&
                (yMax === null || boatYear <= yMax));
            return (
              inPriceRange &&
              matchesModel &&
              matchesCountry &&
              matchesSpecs &&
              matchesCondition &&
              matchesYear
            );
          });

          return filtered.sort((a, b) => {
            const isBoostActive = (boat: any) => {
              const raw =
                (boat as any).boostExpiresAt || (boat as any).boost_expires_at;
              return !!raw && new Date(raw).getTime() > Date.now();
            };
            const getTierPriority = (boat: any) => {
              const name = ((boat as any).productName || '').toLowerCase();
              if (name.includes('podium')) return 1;
              if (isBoostActive(boat)) return 2;
              if (name.includes('mid-course') || name.includes('mid course'))
                return 3;
              return 4;
            };
            const tierDiff = getTierPriority(a) - getTierPriority(b);
            if (tierDiff !== 0) return tierDiff;

            // Within boost tier, most recently boosted first
            if (isBoostActive(a) && isBoostActive(b)) {
              const aBoost = new Date(
                (a as any).boostedAt || (a as any).boosted_at || 0
              ).getTime();
              const bBoost = new Date(
                (b as any).boostedAt || (b as any).boosted_at || 0
              ).getTime();
              if (aBoost !== bBoost) return bBoost - aBoost;
            }

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
              case 'year_asc': {
                const ay = (a as any).year;
                const by = (b as any).year;
                if (ay == null && by == null) return 0;
                if (ay == null) return 1;
                if (by == null) return -1;
                return ay - by;
              }
              case 'year_desc': {
                const ay = (a as any).year;
                const by = (b as any).year;
                if (ay == null && by == null) return 0;
                if (ay == null) return 1;
                if (by == null) return -1;
                return by - ay;
              }
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

    // Helper to compute boat display data
    const getBoatDisplayData = (boat: Boat) => {
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

      const expirationDate =
        (boat as any).expiresAt || (boat as any).expires_at
          ? new Date((boat as any).expiresAt || (boat as any).expires_at)
          : null;

      const formattedExpirationDate = expirationDate
        ? expirationDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        : null;

      const now = new Date();
      const daysUntilExpiration = expirationDate
        ? Math.ceil(
            (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
        : null;
      const isExpired =
        daysUntilExpiration !== null && daysUntilExpiration <= 0;
      const expiresSoon =
        daysUntilExpiration !== null &&
        daysUntilExpiration <= 14 &&
        daysUntilExpiration > 0;

      const productId = (boat as any).productId || (boat as any).product_id;
      const isSold = (boat as any).status === 'sold';

      const boostExpiresRaw =
        (boat as any).boostExpiresAt || (boat as any).boost_expires_at;
      const boostExpirationDate = boostExpiresRaw
        ? new Date(boostExpiresRaw)
        : null;
      const isBoostActive = boostExpirationDate
        ? boostExpirationDate.getTime() > Date.now()
        : false;
      const formattedBoostExpiration = boostExpirationDate
        ? boostExpirationDate.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : null;

      const hasExtraPhotos = !!(
        (boat as any).hasExtraPhotos ?? (boat as any).has_extra_photos
      );
      const videoUrl =
        (boat as any).videoUrl || (boat as any).video_url || null;
      const allExtrasPurchased = hasExtraPhotos && !!videoUrl;

      return {
        hasValidImages,
        imageUrl,
        formattedDate,
        expirationDate,
        formattedExpirationDate,
        daysUntilExpiration,
        isExpired,
        expiresSoon,
        productId,
        isSold,
        isBoostActive,
        formattedBoostExpiration,
        hasExtraPhotos,
        videoUrl,
        allExtrasPurchased
      };
    };

    // Shared actions dropdown
    const renderActionsDropdown = (boat: Boat) => (
      <Dropdown>
        <DropdownTrigger>
          <button
            className="text-oceanblue hover:text-oceanblue px-4 py-4 rounded-lg hover:bg-articblue/20 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {deletingBoatId === boat.id || soldBoatId === boat.id ? (
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
              sessionStorage.setItem(`boat-${boat.id}`, JSON.stringify(boat));
              router.push(`/edit-listing/${boat.id}`);
              return;
            }
            if (key === 'renew') {
              router.push(`/list-boat?preference=Renewal&boatId=${boat.id}`);
              return;
            }
            if (key === 'delete') {
              handleDeleteBoat(boat);
            }
            if (key === 'mark_sold') {
              handleMarkAsSold(boat);
            }
            if (key === 'relist') {
              handleRelist(boat);
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
          {
            ((boat as any).status !== 'sold' && (
              <DropdownItem
                key="renew"
                startContent={<RefreshCw size={14} />}
                classNames={{
                  base: 'text-articblue data-[hover=true]:bg-articblue/10 data-[hover=true]:text-articblue'
                }}
              >
                Renew Listing
              </DropdownItem>
            )) as any
          }
          {
            ((boat as any).status === 'active' && (
              <DropdownItem
                key="mark_sold"
                startContent={<CheckSquare size={14} />}
                classNames={{
                  base: 'text-gray-600 data-[hover=true]:bg-gray-100 data-[hover=true]:text-gray-800'
                }}
              >
                Marquer comme vendu
              </DropdownItem>
            )) as any
          }
          {
            ((boat as any).status === 'sold' && (
              <DropdownItem
                key="relist"
                startContent={<RefreshCw size={14} />}
                classNames={{
                  base: 'text-green-600 data-[hover=true]:bg-green-50 data-[hover=true]:text-green-700'
                }}
              >
                Relist
              </DropdownItem>
            )) as any
          }
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
    );

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-200">
          {boats.map((boat) => {
            const d = getBoatDisplayData(boat);
            const upgradeOptions = getUpgradeOptions(d.productId);

            return (
              <div
                key={boat.id}
                className="p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => router.push(`/boat/${boat.id}`)}
              >
                {/* Top row: details + actions */}
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="relative w-16 h-12 sm:w-20 sm:h-14 overflow-hidden rounded-lg bg-gray-100 flex-shrink-0 hidden sm:block">
                    {d.hasValidImages &&
                    d.imageUrl &&
                    !failedImages.has(boat.id) ? (
                      <img
                        ref={(node) => {
                          if (
                            node &&
                            node.complete &&
                            node.naturalWidth === 0
                          ) {
                            handleImageError(boat.id, d.imageUrl as string);
                          }
                        }}
                        src={d.imageUrl}
                        alt={`${getModelLabel(boat.model)} photo`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onLoad={() =>
                          logImageEvent('load', boat.id, d.imageUrl as string)
                        }
                        onError={() =>
                          handleImageError(boat.id, d.imageUrl as string)
                        }
                      />
                    ) : (
                      <img
                        src="/images/No-image.png"
                        alt="No image available"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                      {getModelLabel(boat.model)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 truncate">
                      {boat.country}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-gray-900 mt-0.5">
                      {formatPrice(Number(boat.price), boat.currency)}{' '}
                      {getCurrencySymbol(boat.currency)}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center">
                    {renderActionsDropdown(boat)}
                  </div>
                </div>

                {/* Bottom row: status, plan, expiry, actions */}
                <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] sm:text-xs text-gray-500">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    {d.isSold ? (
                      <span className="inline-flex px-1.5 sm:px-2 py-0.5 font-semibold rounded-full border bg-gray-100 text-gray-700 border-gray-300 text-xs uppercase tracking-wide">
                        Vendu
                      </span>
                    ) : (
                      <span
                        className={`inline-flex px-1.5 sm:px-2 py-0.5 font-semibold rounded-full border ${
                          d.isExpired
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : d.expiresSoon
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : 'bg-green-50 text-green-700 border-green-200'
                        }`}
                      >
                        {d.isExpired
                          ? 'Expired'
                          : d.expiresSoon
                            ? 'Expiring'
                            : 'Active'}
                      </span>
                    )}
                    {d.isBoostActive && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 font-semibold rounded-full border bg-articblue/10 text-articblue border-articblue/30 text-xs"
                        title={`Boost active until ${d.formattedBoostExpiration}`}
                      >
                        <Rocket size={10} />
                        Boosted
                      </span>
                    )}
                    <span className="font-medium text-gray-700">
                      {getProductLabel(d.productId, products)}
                    </span>
                    {d.expirationDate && (
                      <span
                        className={
                          d.isExpired
                            ? 'text-red-600 font-medium'
                            : d.expiresSoon
                              ? 'text-orange-600 font-medium'
                              : ''
                        }
                      >
                        {d.isExpired
                          ? 'Expired'
                          : d.daysUntilExpiration !== null
                            ? `${d.daysUntilExpiration}d`
                            : ''}
                      </span>
                    )}
                  </div>
                  {!d.isSold && (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Link
                        href={`/list-boat?preference=Renewal&boatId=${boat.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 sm:py-1 font-medium rounded-md transition-colors ${
                          d.isExpired
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : d.expiresSoon
                              ? 'bg-orange-500 text-white hover:bg-orange-600'
                              : 'text-articblue border border-articblue/40 hover:bg-articblue/10'
                        }`}
                      >
                        <RefreshCw
                          size={8}
                          className="sm:w-[10px] sm:h-[10px]"
                        />
                        Renew
                      </Link>
                      {!d.isBoostActive && !d.isExpired && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/boost/${boat.id}`);
                          }}
                          className="inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 sm:py-1 font-medium rounded-md text-articblue border border-articblue/40 hover:bg-articblue/10 transition-colors"
                        >
                          <Rocket
                            size={8}
                            className="sm:w-[10px] sm:h-[10px]"
                          />
                          Boost
                        </button>
                      )}
                      {!d.allExtrasPurchased && !d.isExpired && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/extras/${boat.id}`);
                          }}
                          className="inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 sm:py-1 font-medium rounded-md text-articblue border border-articblue/40 hover:bg-articblue/10 transition-colors"
                        >
                          <Plus size={8} className="sm:w-[10px] sm:h-[10px]" />
                          Extras
                        </button>
                      )}
                      {upgradeOptions.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/upgrade/${boat.id}`);
                          }}
                          className="inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 sm:py-1 font-medium rounded-md text-white bg-articblue hover:bg-oceanblue transition-colors"
                        >
                          <ArrowUpCircle
                            size={8}
                            className="sm:w-[10px] sm:h-[10px]"
                          />
                          Upgrade
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-articblue to-oceanblue border-b border-gray-200">
                <tr>
                  <th className="hidden xl:table-cell px-3 xl:px-6 py-3 xl:py-4 text-left text-xs font-medium text-fullwhite uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-2 xl:px-6 py-3 xl:py-4 text-left text-xs font-medium text-fullwhite uppercase tracking-wider">
                    Boat Details
                  </th>
                  <th className="px-2 xl:px-6 py-3 xl:py-4 text-left text-xs font-medium text-fullwhite uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-2 xl:px-6 py-3 xl:py-4 text-left text-xs font-medium text-fullwhite uppercase tracking-wider">
                    Expires
                  </th>

                  <th className="px-2 xl:px-6 py-3 xl:py-4 text-center text-xs font-medium text-fullwhite uppercase tracking-wider">
                    Boost
                  </th>
                  <th className="px-2 xl:px-6 py-3 xl:py-4 text-center text-xs font-medium text-fullwhite uppercase tracking-wider">
                    Upgrade
                  </th>
                  <th className="px-2 xl:px-6 py-3 xl:py-4 text-center text-xs font-medium text-fullwhite uppercase tracking-wider">
                    Extras
                  </th>
                  <th className="px-2 xl:px-6 py-3 xl:py-4 text-right text-xs font-medium text-fullwhite uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {boats.map((boat) => {
                  const d = getBoatDisplayData(boat);

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
                      <td className="hidden xl:table-cell px-3 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                        <div className="relative w-30 h-20 overflow-hidden rounded-lg bg-gray-100">
                          {d.hasValidImages &&
                          d.imageUrl &&
                          !failedImages.has(boat.id) ? (
                            <img
                              ref={(node) => {
                                if (
                                  node &&
                                  node.complete &&
                                  node.naturalWidth === 0
                                ) {
                                  handleImageError(
                                    boat.id,
                                    d.imageUrl as string
                                  );
                                }
                              }}
                              src={d.imageUrl}
                              alt={`${getModelLabel(boat.model)} photo`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onLoad={() =>
                                logImageEvent(
                                  'load',
                                  boat.id,
                                  d.imageUrl as string
                                )
                              }
                              onError={() =>
                                handleImageError(boat.id, d.imageUrl as string)
                              }
                            />
                          ) : (
                            <img
                              src="/images/No-image.png"
                              alt="No image available"
                              className="w-full h-full object-cover"
                            />
                          )}
                          {/* Status indicator — top right */}
                          <div className="absolute top-1.5 right-1.5">
                            {d.isSold ? (
                              <span className="inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded bg-gray-700/80 text-white uppercase">
                                Sold
                              </span>
                            ) : d.isExpired ? (
                              <span className="inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded bg-red-600/80 text-white uppercase">
                                Expired
                              </span>
                            ) : d.expiresSoon ? (
                              <span className="inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded bg-yellow-500/80 text-white uppercase">
                                Soon
                              </span>
                            ) : (
                              <span
                                title="Active"
                                className="relative flex h-2.5 w-2.5"
                              >
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Boat Details */}
                      <td className="px-2 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getModelLabel(boat.model)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {boat.country}
                            </div>
                            <div className="text-sm text-gray-900 font-medium mt-0.5">
                              {formatPrice(Number(boat.price), boat.currency)}{' '}
                              {getCurrencySymbol(boat.currency)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Plan + Created */}
                      <td className="px-2 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm text-gray-900 font-medium">
                            {getProductLabel(d.productId, products)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {d.formattedDate}
                          </span>
                        </div>
                      </td>

                      {/* Expires */}
                      <td className="px-2 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5">
                          {d.expirationDate ? (
                            <span
                              className={`text-sm ${
                                d.isExpired
                                  ? 'text-red-600 font-medium'
                                  : d.expiresSoon
                                    ? 'text-orange-600 font-medium'
                                    : 'text-gray-500'
                              }`}
                            >
                              {d.formattedExpirationDate}
                              {d.daysUntilExpiration !== null &&
                                !d.isExpired && (
                                  <span className="ml-1">
                                    ({d.daysUntilExpiration}d left)
                                  </span>
                                )}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                          {!d.isSold && (
                            <Link
                              href={`/list-boat?preference=Renewal&boatId=${boat.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className={`inline-flex items-center gap-1 w-fit px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                                d.isExpired
                                  ? 'bg-red-500 text-white hover:bg-red-600'
                                  : d.expiresSoon
                                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                                    : 'text-articblue border border-articblue/40 hover:bg-articblue/10'
                              }`}
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                              {d.isExpired ? 'Renew Now' : 'Renew'}
                            </Link>
                          )}
                        </div>
                      </td>

                      {/* Boost */}
                      <td className="text-center px-2 py-3 xl:py-4 whitespace-nowrap">
                        {d.isSold || d.isExpired ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : d.isBoostActive ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-articblue/10 text-articblue border border-articblue/30"
                            title={`Until ${d.formattedBoostExpiration}`}
                          >
                            <Rocket size={10} />
                            Boosted
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/boost/${boat.id}`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-articblue/40 text-xs font-medium rounded-md text-articblue hover:bg-articblue/10 transition-colors duration-200"
                          >
                            <Rocket size={12} />
                            Boost
                          </button>
                        )}
                      </td>

                      {/* Upgrade */}
                      <td className="text-center px-2 py-3 xl:py-4 whitespace-nowrap">
                        {(() => {
                          if (d.isSold || d.isExpired)
                            return (
                              <span className="text-xs text-gray-400">—</span>
                            );
                          const upgradeOptions = getUpgradeOptions(d.productId);
                          if (!upgradeOptions.length)
                            return (
                              <span className="text-xs text-gray-400">—</span>
                            );
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/upgrade/${boat.id}`);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-articblue hover:bg-oceanblue transition-colors duration-200"
                            >
                              <ArrowUpCircle size={12} />
                              Upgrade
                            </button>
                          );
                        })()}
                      </td>

                      {/* Extras */}
                      <td className="text-center px-2 py-3 xl:py-4 whitespace-nowrap">
                        {d.isSold || d.isExpired ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : d.allExtrasPurchased ? (
                          <span className="text-xs text-green-600 font-medium">
                            ✓ All added
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/extras/${boat.id}`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-articblue/40 text-xs font-medium rounded-md text-articblue hover:bg-articblue/10 transition-colors duration-200"
                          >
                            <Plus size={12} />
                            Extras
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-2 xl:px-6 py-3 xl:py-4 whitespace-nowrap text-sm font-medium text-center">
                        {renderActionsDropdown(boat)}
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
                            {formatPrice(
                              Number(boatToDelete.price),
                              boatToDelete.currency
                            )}{' '}
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

        {/* Modal d'upgrade */}
        <Modal
          isOpen={isUpgradeModalOpen}
          onOpenChange={onCloseUpgradeModal}
          size="lg"
          hideCloseButton
        >
          <ModalContent>
            {(onClose) => {
              const currentProductId =
                (boatToUpgrade as any)?.productId ||
                (boatToUpgrade as any)?.product_id;
              const upgradeOptions = getUpgradeOptions(currentProductId);

              return (
                <>
                  <ModalHeader className="flex flex-col gap-1 text-center text-oceanblue">
                    <div className="flex items-center justify-center gap-2">
                      <ArrowUpCircle className="w-6 h-6 text-articblue" />
                      <span>Upgrade Your Listing</span>
                    </div>
                  </ModalHeader>
                  <ModalBody>
                    <div className="flex flex-col gap-4">
                      {boatToUpgrade && (
                        <div className="bg-gray-50 rounded-lg p-4 border">
                          <div className="text-sm text-gray-500 mb-1">
                            Current listing
                          </div>
                          <div className="font-medium text-oceanblue">
                            {getModelLabel(boatToUpgrade.model)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Current plan:{' '}
                            <span className="font-medium">
                              {getProductLabel(currentProductId, products)}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-gray-600 mb-2">
                        Select a plan to upgrade to:
                      </div>

                      <div className="flex flex-col gap-3">
                        {upgradeOptions.map((product) => {
                          const price = product.prices?.[0];
                          const priceAmount = price?.unit_amount
                            ? (price.unit_amount / 100).toFixed(2)
                            : '0.00';
                          const currency =
                            price?.currency?.toUpperCase() || 'EUR';

                          return (
                            <button
                              key={product.id}
                              onClick={() => {
                                onClose();
                                // Navigate to upgrade payment page
                                router.push(
                                  `/upgrade/${boatToUpgrade?.id}?plan=${product.id}`
                                );
                              }}
                              className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-articblue hover:bg-articblue/5 transition-all duration-200"
                            >
                              <div className="flex flex-col items-start">
                                <span className="font-medium text-oceanblue">
                                  {product.name}
                                </span>
                                {product.description && (
                                  <span className="text-sm text-gray-500">
                                    {product.description}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-articblue">
                                  {priceAmount} {currency}
                                </span>
                                <ArrowUpCircle
                                  size={18}
                                  className="text-articblue"
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {upgradeOptions.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          You already have the highest plan available.
                        </div>
                      )}
                    </div>
                  </ModalBody>
                  <ModalFooter className="flex flex-row justify-center gap-4">
                    <Button
                      onPress={onClose}
                      className="px-6 bg-fullwhite text-oceanblue border-2 border-oceanblue/10 hover:bg-oceanblue hover:text-fullwhite rounded-lg transition-all duration-200"
                    >
                      Cancel
                    </Button>
                  </ModalFooter>
                </>
              );
            }}
          </ModalContent>
        </Modal>
      </>
    );
  }

  // Mode normal (cards avec filtres)
  return (
    <>
      {/* Mobile Filter & Sort Buttons */}
      {!spotlight && !gridView && (
        <div className="flex md:hidden gap-3 w-full">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-oceanblue text-fullwhite py-3 rounded-xl font-medium text-16 active:bg-articblue transition-colors"
          >
            <SlidersHorizontal size={18} />
            Filter
            {(() => {
              let count = 0;
              if (selectedModel) count++;
              if (selectedCountry) count++;
              if (selectedPrice[0] > 0 || selectedPrice[1] < maxPrice) count++;
              if (selectedSpecs.length > 0) count += selectedSpecs.length;
              if (selectedCondition) count++;
              if (selectedYearMin || selectedYearMax) count++;
              return count > 0 ? ` (${count})` : '';
            })()}
          </button>
          <button
            onClick={() => setIsMobileSortOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-oceanblue text-fullwhite py-3 rounded-xl font-medium text-16 active:bg-articblue transition-colors"
          >
            <ArrowUpDown size={18} />
            Sort
          </button>
        </div>
      )}

      {/* Mobile Filter Fullscreen Modal */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-fullwhite flex flex-col md:hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-lightgrey">
            <h2 className="text-20 font-semibold text-oceanblue">Filters</h2>
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="p-2 text-oceanblue"
            >
              <X size={24} />
            </button>
          </div>

          {/* Filter Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {/* Price Filter */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-16 font-medium text-oceanblue">
                  Price Range
                </h3>
                <Dropdown>
                  <DropdownTrigger>
                    <button className="flex items-center gap-1 rounded-full px-3 h-7 bg-lightgrey text-oceanblue font-medium text-14">
                      {currencies.find((c) => c.key === selectedCurrency)
                        ?.symbol || selectedCurrency}
                      <ArrowDropdown className="w-3 h-3" />
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Select currency"
                    classNames={{ base: 'bg-fullwhite', list: 'bg-fullwhite' }}
                    onAction={(key) => setSelectedCurrency(key as string)}
                  >
                    {currencies.map((c) => (
                      <DropdownItem
                        key={c.key}
                        classNames={{
                          base:
                            selectedCurrency === c.key
                              ? 'bg-lightgrey text-oceanblue font-medium data-[hover=true]:bg-lightgrey'
                              : 'text-oceanblue data-[hover=true]:bg-lightgrey data-[hover=true]:text-oceanblue'
                        }}
                      >
                        {c.symbol} {c.label}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              </div>
              <Slider
                classNames={{ labelWrapper: 'flex flex-row gap-6' }}
                className="max-w-full text-oceanblue"
                defaultValue={selectedPrice}
                onChange={(value) =>
                  setSelectedPrice(value as [number, number])
                }
                formatOptions={{
                  style: 'currency',
                  currency: selectedCurrency
                }}
                label="Price"
                maxValue={maxPrice}
                minValue={0}
                step={maxPrice > 1000 ? maxPrice / 20 : 50}
              />
            </div>

            {/* Model Filter */}
            <div>
              <h3 className="text-16 font-medium text-oceanblue mb-3">Model</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedModel(null)}
                  className={`px-4 py-2 rounded-full text-14 font-medium transition-colors ${
                    !selectedModel
                      ? 'bg-articblue text-fullwhite'
                      : 'bg-lightgrey text-oceanblue'
                  }`}
                >
                  All
                </button>
                {dragonflyModels.map((model) => (
                  <button
                    key={model.key}
                    onClick={() =>
                      setSelectedModel(
                        selectedModel === model.key ? null : model.key
                      )
                    }
                    className={`px-4 py-2 rounded-full text-14 font-medium transition-colors ${
                      selectedModel === model.key
                        ? 'bg-articblue text-fullwhite'
                        : 'bg-lightgrey text-oceanblue'
                    }`}
                  >
                    {model.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Country Filter */}
            <div>
              <h3 className="text-16 font-medium text-oceanblue mb-3">
                Country
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCountry(null)}
                  className={`px-4 py-2 rounded-full text-14 font-medium transition-colors ${
                    !selectedCountry
                      ? 'bg-articblue text-fullwhite'
                      : 'bg-lightgrey text-oceanblue'
                  }`}
                >
                  All
                </button>
                {countries.map((country) => (
                  <button
                    key={country.key}
                    onClick={() =>
                      setSelectedCountry(
                        selectedCountry === country.key ? null : country.key
                      )
                    }
                    className={`px-4 py-2 rounded-full text-14 font-medium transition-colors flex items-center gap-1 ${
                      selectedCountry === country.key
                        ? 'bg-articblue text-fullwhite'
                        : 'bg-lightgrey text-oceanblue'
                    }`}
                  >
                    {country.label}
                    <FlagIcon flag={country.flag} />
                  </button>
                ))}
              </div>
            </div>

            {/* Year Range Filter */}
            <div>
              <h3 className="text-16 font-medium text-oceanblue mb-3">
                Year of build
              </h3>
              <div className="flex flex-row gap-8 items-center">
                <select
                  value={selectedYearMin ?? ''}
                  onChange={(e) =>
                    setSelectedYearMin(e.target.value || null)
                  }
                  className="flex-1 h-[36px] px-3 rounded-lg bg-lightgrey text-oceanblue text-14 font-medium border-2 border-transparent focus:border-articblue outline-none"
                  aria-label="Year from"
                >
                  <option value="">From</option>
                  {getBoatYears().map((y) => {
                    const key = String(y);
                    const disabled =
                      !!selectedYearMax &&
                      parseInt(selectedYearMax, 10) < y;
                    return (
                      <option key={key} value={key} disabled={disabled}>
                        {key}
                      </option>
                    );
                  })}
                </select>
                <span className="text-stonegrey text-14">–</span>
                <select
                  value={selectedYearMax ?? ''}
                  onChange={(e) =>
                    setSelectedYearMax(e.target.value || null)
                  }
                  className="flex-1 h-[36px] px-3 rounded-lg bg-lightgrey text-oceanblue text-14 font-medium border-2 border-transparent focus:border-articblue outline-none"
                  aria-label="Year to"
                >
                  <option value="">To</option>
                  {getBoatYears().map((y) => {
                    const key = String(y);
                    const disabled =
                      !!selectedYearMin &&
                      parseInt(selectedYearMin, 10) > y;
                    return (
                      <option key={key} value={key} disabled={disabled}>
                        {key}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Condition Filter */}
            <div>
              <h3 className="text-16 font-medium text-oceanblue mb-3">État</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCondition(null)}
                  className={`px-4 py-2 rounded-full text-14 font-medium transition-colors ${
                    !selectedCondition
                      ? 'bg-articblue text-fullwhite'
                      : 'bg-lightgrey text-oceanblue'
                  }`}
                >
                  Tous
                </button>
                {boatConditions.map((cond) => (
                  <button
                    key={cond.key}
                    onClick={() =>
                      setSelectedCondition(
                        selectedCondition === cond.key ? null : cond.key
                      )
                    }
                    className={`px-4 py-2 rounded-full text-14 font-medium transition-colors ${
                      selectedCondition === cond.key
                        ? 'bg-articblue text-fullwhite'
                        : 'bg-lightgrey text-oceanblue'
                    }`}
                  >
                    {cond.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Specifications Filter */}
            <div>
              <h3 className="text-16 font-medium text-oceanblue mb-3">
                Specifications
              </h3>
              <div className="space-y-2">
                {specificationsData
                  .flatMap((section) => section.items)
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        setSelectedSpecs((prev) =>
                          prev.includes(item.key)
                            ? prev.filter((k) => k !== item.key)
                            : [...prev, item.key]
                        );
                      }}
                      className="flex items-center gap-3 w-full py-2 px-3 rounded-lg text-left text-oceanblue active:bg-lightgrey"
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedSpecs.includes(item.key)
                            ? 'bg-articblue border-articblue'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedSpecs.includes(item.key) && (
                          <Check size={14} className="text-fullwhite" />
                        )}
                      </div>
                      <span className="text-14">{item.label}</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* Footer with actions */}
          <div className="px-4 py-4 border-t border-lightgrey flex gap-3">
            <button
              onClick={() => {
                setSelectedModel(null);
                setSelectedCountry(null);
                setSelectedPrice([0, maxPrice]);
                setSelectedSpecs([]);
                setSelectedCondition(null);
                setSelectedYearMin(null);
                setSelectedYearMax(null);
              }}
              className="flex-1 py-3 rounded-xl border-2 border-oceanblue text-oceanblue font-medium text-16"
            >
              Reset
            </button>
            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="flex-1 py-3 rounded-xl bg-articblue text-fullwhite font-medium text-16"
            >
              Show {filteredBoats.length} result
              {filteredBoats.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sort Fullscreen Modal */}
      {isMobileSortOpen && (
        <div className="fixed inset-0 z-50 bg-fullwhite flex flex-col md:hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-lightgrey">
            <h2 className="text-20 font-semibold text-oceanblue">Sort</h2>
            <button
              onClick={() => setIsMobileSortOpen(false)}
              className="p-2 text-oceanblue"
            >
              <X size={24} />
            </button>
          </div>

          {/* Sort Options */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {[
              {
                key: 'created_desc',
                label: 'Newest First',
                desc: 'Most recent listings'
              },
              {
                key: 'created_asc',
                label: 'Oldest First',
                desc: 'Oldest listings'
              },
              {
                key: 'price_asc',
                label: 'Price: Low to High',
                desc: 'Cheapest first'
              },
              {
                key: 'price_desc',
                label: 'Price: High to Low',
                desc: 'Most expensive first'
              },
              {
                key: 'model_asc',
                label: 'Model: A-Z',
                desc: 'Alphabetical order'
              },
              {
                key: 'model_desc',
                label: 'Model: Z-A',
                desc: 'Reverse alphabetical'
              },
              {
                key: 'year_desc',
                label: 'Year: Newest First',
                desc: 'Most recent year'
              },
              {
                key: 'year_asc',
                label: 'Year: Oldest First',
                desc: 'Oldest year first'
              }
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => {
                  setSelectedSort(option.key);
                  setIsMobileSortOpen(false);
                }}
                className={`w-full flex items-center justify-between py-4 px-3 border-b border-lightgrey text-left ${
                  selectedSort === option.key ? 'bg-lightgrey' : ''
                }`}
              >
                <div>
                  <div className="text-16 font-medium text-oceanblue">
                    {option.label}
                  </div>
                  <div className="text-14 text-darkgrey">{option.desc}</div>
                </div>
                {selectedSort === option.key && (
                  <Check size={20} className="text-articblue flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {!spotlight && !gridView && (
        <div className="hidden md:block">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            {/* Filtres à gauche */}
            <div className="flex gap-8 flex-wrap">
              {/* Filtre par prix */}
              <div className="flex flex-row items-center gap-2">
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
                        formatOptions={{
                          style: 'currency',
                          currency: selectedCurrency
                        }}
                        label="Price Range"
                        maxValue={maxPrice}
                        minValue={0}
                        step={maxPrice > 1000 ? maxPrice / 20 : 50}
                      />
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
                <Dropdown>
                  <DropdownTrigger>
                    <button className="rounded-[100px] px-[14px] h-[30px] flex flex-row gap-1 items-center hover:bg-smokygrey bg-lightgrey text-oceanblue">
                      <span className="font-medium text-14">
                        {currencies.find((c) => c.key === selectedCurrency)
                          ?.symbol || selectedCurrency}
                      </span>
                      <ArrowDropdown className="w-3 h-3" />
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Select currency"
                    classNames={{ base: 'bg-fullwhite', list: 'bg-fullwhite' }}
                    onAction={(key) => setSelectedCurrency(key as string)}
                  >
                    {currencies.map((c) => (
                      <DropdownItem
                        key={c.key}
                        classNames={{
                          base:
                            selectedCurrency === c.key
                              ? 'bg-lightgrey text-oceanblue font-medium data-[hover=true]:bg-lightgrey'
                              : 'text-oceanblue data-[hover=true]:bg-lightgrey data-[hover=true]:text-oceanblue'
                        }}
                      >
                        {c.symbol} {c.label}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              </div>

              {/* Filtre par modèle */}
              <div className="flex flex-col">
                <Autocomplete
                  className="w-full sm:w-[200px]"
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

              {/* Filtre par année — From */}
              <div className="flex flex-row items-center">
                <Dropdown>
                  <DropdownTrigger>
                    <button className="rounded-[100px] px-[20px] h-[30px] flex flex-row gap-2 items-center hover:bg-smokygrey bg-lightgrey text-oceanblue">
                      <div className="font-medium text-14">
                        {selectedYearMin
                          ? `From: ${selectedYearMin}`
                          : 'Year from'}
                      </div>
                      <ArrowDropdown />
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Select year from"
                    classNames={{
                      base: 'bg-fullwhite max-h-[320px] overflow-y-auto',
                      list: 'bg-fullwhite'
                    }}
                    onAction={(key) => {
                      const k = key as string;
                      setSelectedYearMin(k === 'all' ? null : k);
                    }}
                  >
                    {(
                      [{ key: 'all', label: 'Any' }] as {
                        key: string;
                        label: string;
                      }[]
                    )
                      .concat(
                        getBoatYears().map((y) => ({
                          key: String(y),
                          label: String(y)
                        }))
                      )
                      .map((item) => (
                        <DropdownItem
                          key={item.key}
                          classNames={{
                            base:
                              (item.key === 'all' && !selectedYearMin) ||
                              selectedYearMin === item.key
                                ? 'bg-lightgrey text-oceanblue font-medium data-[hover=true]:bg-lightgrey'
                                : 'text-oceanblue data-[hover=true]:bg-lightgrey data-[hover=true]:text-oceanblue'
                          }}
                        >
                          {item.label}
                        </DropdownItem>
                      ))}
                  </DropdownMenu>
                </Dropdown>
              </div>

              {/* Filtre par année — To */}
              <div className="flex flex-row items-center">
                <Dropdown>
                  <DropdownTrigger>
                    <button className="rounded-[100px] px-[20px] h-[30px] flex flex-row gap-2 items-center hover:bg-smokygrey bg-lightgrey text-oceanblue">
                      <div className="font-medium text-14">
                        {selectedYearMax
                          ? `To: ${selectedYearMax}`
                          : 'Year to'}
                      </div>
                      <ArrowDropdown />
                    </button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Select year to"
                    classNames={{
                      base: 'bg-fullwhite max-h-[320px] overflow-y-auto',
                      list: 'bg-fullwhite'
                    }}
                    onAction={(key) => {
                      const k = key as string;
                      setSelectedYearMax(k === 'all' ? null : k);
                    }}
                  >
                    {(
                      [{ key: 'all', label: 'Any' }] as {
                        key: string;
                        label: string;
                      }[]
                    )
                      .concat(
                        getBoatYears().map((y) => ({
                          key: String(y),
                          label: String(y)
                        }))
                      )
                      .map((item) => (
                        <DropdownItem
                          key={item.key}
                          classNames={{
                            base:
                              (item.key === 'all' && !selectedYearMax) ||
                              selectedYearMax === item.key
                                ? 'bg-lightgrey text-oceanblue font-medium data-[hover=true]:bg-lightgrey'
                                : 'text-oceanblue data-[hover=true]:bg-lightgrey data-[hover=true]:text-oceanblue'
                          }}
                        >
                          {item.label}
                        </DropdownItem>
                      ))}
                  </DropdownMenu>
                </Dropdown>
              </div>

              {/* Filtre par localisation */}
              <div className="flex flex-col">
                <Autocomplete
                  className="w-full sm:w-[200px]"
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
                  {countries.map((country) => (
                    <AutocompleteItem
                      key={country.key}
                      startContent={
                        <Avatar
                          alt={country.label}
                          className="w-6 h-6"
                          src={country.flag}
                        />
                      }
                    >
                      {country.label}
                    </AutocompleteItem>
                  ))}
                </Autocomplete>
              </div>

              {/* Filtre par spécifications */}
              <Dropdown
                classNames={{ content: 'bg-fullwhite' }}
                closeOnSelect={false}
              >
                <DropdownTrigger>
                  <button className="rounded-[100px] px-[20px] h-[30px] flex flex-row gap-2 items-center hover:bg-smokygrey bg-lightgrey text-oceanblue">
                    <div className="font-medium text-14">
                      Specifications{' '}
                      {selectedSpecs.length > 0 && `(${selectedSpecs.length})`}
                    </div>
                    <ArrowDropdown />
                  </button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Specifications filter"
                  classNames={{
                    base: 'max-h-[400px] overflow-y-auto',
                    list: 'bg-fullwhite'
                  }}
                  selectionMode="multiple"
                  selectedKeys={new Set(selectedSpecs)}
                  onSelectionChange={(keys) => {
                    setSelectedSpecs(Array.from(keys) as string[]);
                  }}
                >
                  {specificationsData
                    .flatMap((section) => section.items)
                    .sort((a, b) => a.label.localeCompare(b.label))
                    .map((item) => (
                      <DropdownItem
                        key={item.key}
                        classNames={{
                          base: 'text-oceanblue data-[hover=true]:bg-articblue/10 data-[selected=true]:bg-articblue/20'
                        }}
                      >
                        {item.label}
                      </DropdownItem>
                    ))}
                </DropdownMenu>
              </Dropdown>

              {/* Filtre par état */}
              <Dropdown
                classNames={{ content: 'bg-fullwhite' }}
                closeOnSelect={false}
              >
                <DropdownTrigger>
                  <button className="rounded-[100px] px-[20px] h-[30px] flex flex-row gap-2 items-center hover:bg-smokygrey bg-lightgrey text-oceanblue">
                    <div className="font-medium text-14">
                      {selectedCondition
                        ? boatConditions.find((c) => c.key === selectedCondition)
                            ?.label
                        : 'État'}
                    </div>
                    <ArrowDropdown />
                  </button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="État filter"
                  classNames={{ base: 'bg-fullwhite', list: 'bg-fullwhite' }}
                >
                  {([{ key: 'all', label: 'Tous' }, ...boatConditions] as {
                    key: string;
                    label: string;
                  }[]).map((cond) => (
                    <DropdownItem
                      key={cond.key}
                      classNames={{
                        base: `text-oceanblue data-[hover=true]:bg-articblue/10 ${
                          cond.key === 'all'
                            ? !selectedCondition
                              ? 'font-semibold'
                              : ''
                            : selectedCondition === cond.key
                              ? 'bg-articblue/20 font-semibold'
                              : ''
                        }`
                      }}
                      onClick={() =>
                        setSelectedCondition(
                          cond.key === 'all'
                            ? null
                            : selectedCondition === cond.key
                              ? null
                              : cond.key
                        )
                      }
                    >
                      {cond.label}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
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
                <DropdownItem
                  key="year_desc"
                  classNames={{
                    base: 'data-[hover]:bg-fullwhite cursor-pointer text-oceanblue'
                  }}
                  onClick={() => setSelectedSort('year_desc')}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">Year: Newest First</span>
                    <span className="text-xs text-gray-500">
                      Most recent year
                    </span>
                  </div>
                </DropdownItem>
                <DropdownItem
                  key="year_asc"
                  classNames={{
                    base: 'data-[hover]:bg-fullwhite cursor-pointer text-oceanblue'
                  }}
                  onClick={() => setSelectedSort('year_asc')}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">Year: Oldest First</span>
                    <span className="text-xs text-gray-500">
                      Oldest year first
                    </span>
                  </div>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      )}

      {/* Informations sur les résultats de recherche */}
      {!spotlight && !gridView && (
        <div className="flex flex-row items-center justify-between gap-4">
          {/* Résumé des filtres actifs */}
          <div className="flex flex-wrap items-center gap-2">
            {(() => {
              const chips: { key: string; label: string; onClear: () => void }[] = [];
              if (selectedModel) {
                const model = dragonflyModels.find((m) => m.key === selectedModel);
                if (model) chips.push({ key: 'model', label: model.label, onClear: () => setSelectedModel(null) });
              }
              if (selectedCountry) chips.push({ key: 'country', label: selectedCountry, onClear: () => setSelectedCountry(null) });
              if (selectedCondition) {
                const cond = boatConditions.find((c) => c.key === selectedCondition);
                if (cond) chips.push({ key: 'condition', label: cond.label, onClear: () => setSelectedCondition(null) });
              }
              if (selectedPrice[0] > 0 || selectedPrice[1] < maxPrice) {
                chips.push({ key: 'price', label: `${Math.round(selectedPrice[0]).toLocaleString()} – ${Math.round(selectedPrice[1]).toLocaleString()}`, onClear: () => setSelectedPrice([0, maxPrice]) });
              }
              if (selectedSpecs.length > 0) {
                selectedSpecs.forEach((key) => {
                  const spec = specificationsData.flatMap((s) => s.items).find((item) => item.key === key);
                  if (spec) chips.push({ key: `spec_${key}`, label: spec.label, onClear: () => setSelectedSpecs((prev) => prev.filter((k) => k !== key)) });
                });
              }
              if (selectedYearMin || selectedYearMax) {
                const label =
                  selectedYearMin && selectedYearMax
                    ? `${selectedYearMin} – ${selectedYearMax}`
                    : selectedYearMin
                      ? `≥ ${selectedYearMin}`
                      : `≤ ${selectedYearMax}`;
                chips.push({
                  key: 'year',
                  label,
                  onClear: () => {
                    setSelectedYearMin(null);
                    setSelectedYearMax(null);
                  }
                });
              }
              return chips.length > 0
                ? chips.map((chip) => (
                    <button
                      key={chip.key}
                      onClick={chip.onClear}
                      className="inline-flex items-center gap-1.5 px-3 h-[26px] rounded-full bg-articblue/10 text-articblue text-13 font-medium hover:bg-articblue/20 transition-colors"
                    >
                      {chip.label}
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  ))
                : null;
            })()}
          </div>
          {/* Compteur de résultats */}
          <p className="text-oceanblue text-16 shrink-0">
            {filteredBoats.length} result{filteredBoats.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      <div
        className={`gap-16 lg:gap-32 ${gridView ? 'grid grid-cols-1 sm:grid-cols-3 gap-[17px]' : !spotlight ? 'grid grid-cols-1 md:grid-cols-2 gap-x-[17px] gap-y-[16px] lg:gap-y-[32px]' : 'flex flex-col'}`}
      >
        {isLoading ? (
          createSkeletonCards(spotlight ? 3 : 6)
        ) : filteredBoats.length === 0 ? (
          <>
            <div className="col-span-2 flex flex-col items-center justify-center py-16 px-4">
              <div className="text-center">
                <div className="text-6xl mb-4">🚤</div>
                <h3 className="text-24 font-medium text-oceanblue mb-2">
                  No boats found
                </h3>
                <p className="text-16 text-oceanblue/70">
                  Try adjusting your search filters to find more results.
                </p>
                {/* Lien pour réinitialiser les filtres URL (prioritaire) */}
                {suggestedBoats.length > 0 ? (
                  <Link
                    href="/forsale"
                    className="mt-4 inline-block px-6 py-2 bg-articblue text-fullwhite rounded-full hover:bg-oceanblue transition-colors"
                  >
                    View all boats
                  </Link>
                ) : (
                  /* Bouton pour réinitialiser les filtres client (seulement si pas de filtres URL) */
                  boats.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedModel(null);
                        setSelectedCountry(null);
                        setSelectedSpecs([]);
                        setSelectedPrice([0, maxPrice]);
                        setSelectedCondition(null);
                        setSelectedYearMin(null);
                        setSelectedYearMax(null);
                      }}
                      className="mt-4 px-6 py-2 bg-articblue text-fullwhite rounded-full hover:bg-oceanblue transition-colors"
                    >
                      Clear all filters
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Section "See also" - Show some boats when filters return no results */}
            {(suggestedBoats.length > 0 || boats.length > 0) && (
              <div className="col-span-2 mt-16">
                <div className="border-t border-stonegrey pt-16">
                  <h3 className="text-24 font-medium text-oceanblue my-[32px]">
                    You might also like
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[17px] gap-y-[16px] lg:gap-y-[32px]">
                    {(suggestedBoats.length > 0
                      ? suggestedBoats
                      : boats.slice(0, 4)
                    ).map((boat) => {
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
                      const imageUrl = hasValidImages
                        ? prefixedPhotos[0]
                        : null;

                      const formattedDate = boat.createdAt
                        ? new Date(boat.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            day: 'numeric',
                            month: 'long'
                          })
                        : 'Unknown';

                      const suggestedBoostRaw =
                        (boat as any).boostExpiresAt ||
                        (boat as any).boost_expires_at;
                      const suggestedIsBoosted =
                        suggestedBoostRaw &&
                        new Date(suggestedBoostRaw).getTime() > Date.now();

                      return (
                        <Link href={`/boat/${boat.id}`} key={boat.id}>
                          <div
                            className="group border-stonegrey border-2 hover:border-articblue flex flex-col sm:flex-row overflow-hidden transition-all cursor-pointer duration-300 rounded-[16px]"
                            style={{
                              boxShadow: '0px 1px 20px 0px #00000014'
                            }}
                          >
                            {/* Image */}
                            <div className="w-full sm:w-1/3 relative overflow-hidden min-h-[180px]">
                              {suggestedIsBoosted && (
                                <div className="absolute top-3 left-3 z-20 bg-articblue text-fullwhite text-xs font-medium px-3 py-1.5 rounded-md shadow-lg flex items-center gap-1">
                                  <Rocket size={12} />
                                  Boosted
                                </div>
                              )}
                              <div className="absolute flex flex-row items-center gap-2 z-10 m-3 bg-fullwhite w-fit px-[10px] rounded-[7px] text-oceanblue bottom-0">
                                {countries.find(
                                  (country) => country.key === boat.country
                                )?.label || ''}
                                <FlagIcon
                                  flag={
                                    countries.find(
                                      (country) => country.key === boat.country
                                    )?.flag || ''
                                  }
                                />
                              </div>

                              {hasValidImages &&
                              imageUrl &&
                              !failedImages.has(boat.id) ? (
                                <img
                                  ref={(node) => {
                                    if (
                                      node &&
                                      node.complete &&
                                      node.naturalWidth === 0
                                    ) {
                                      handleImageError(
                                        boat.id,
                                        imageUrl as string
                                      );
                                    }
                                  }}
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
                                  onError={() =>
                                    handleImageError(
                                      boat.id,
                                      imageUrl as string
                                    )
                                  }
                                />
                              ) : (
                                <img
                                  src="/images/No-image.png"
                                  alt="No image available"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )}
                            </div>

                            {/* Contenu */}
                            <div className="flex flex-1 flex-col gap-16 bg-fullwhite p-24">
                              <div className="flex flex-col gap-8">
                                <p className="text-oceanblue text-14 italic">
                                  {formattedDate}
                                </p>
                                <h3 className="text-24 font-medium text-articblue leading-tight">
                                  {getModelLabel(boat.model)}
                                </h3>
                              </div>

                              <div className="flex-1 flex items-center">
                                <div className="text-oceanblue text-18">
                                  <span className="text-oceanblue/70">
                                    Price:{' '}
                                  </span>
                                  <span className="font-semibold text-oceanblue">
                                    {formatPrice(
                                      Number(boat.price),
                                      boat.currency
                                    )}{' '}
                                    {getCurrencySymbol(boat.currency)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-oceanblue/60 font-medium text-14">
                                  {boat.viewCount} views
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
                </div>
              </div>
            )}
          </>
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

            const isPodium =
              (boat as any).productName?.toLowerCase() === 'podium';
            const boostRaw =
              (boat as any).boostExpiresAt || (boat as any).boost_expires_at;
            const isBoosted =
              boostRaw && new Date(boostRaw).getTime() > Date.now();

            return (
              <Link
                href={`/boat/${boat.id}`}
                key={boat.id}
                className="h-full block"
              >
                <div
                  className={`group flex overflow-hidden transition-all cursor-pointer duration-300 rounded-[16px] h-full min-h-[220px] ${gridView ? 'flex-col' : 'flex-col sm:flex-row'} ${isPodium ? 'border-articblue border-2' : 'border-stonegrey/40 border-2 hover:border-stonegrey'}`}
                >
                  {/* Image */}
                  <div
                    className={`relative overflow-hidden ${gridView ? 'w-full min-h-[200px]' : 'w-full sm:w-1/2 min-h-[220px] self-stretch'}`}
                  >
                    {isPodium && (
                      <div className="absolute top-3 left-3 z-20 bg-articblue text-fullwhite text-xs font-medium px-3 py-1.5 rounded-md shadow-2xl drop-shadow-2xl">
                        Don’t miss
                      </div>
                    )}
                    {isBoosted && !isPodium && (
                      <div className="absolute top-3 left-3 z-20 bg-articblue text-fullwhite text-xs font-medium px-3 py-1.5 rounded-md shadow-lg flex items-center gap-1">
                        <Rocket size={12} />
                        Boosted
                      </div>
                    )}
                    {(boat as any).status === 'sold' && (
                      <div className="absolute top-3 right-3 z-20 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-lg tracking-wider uppercase">
                        Vendu
                      </div>
                    )}
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

                    {hasValidImages &&
                    imageUrl &&
                    !failedImages.has(boat.id) ? (
                      <img
                        ref={(node) => {
                          if (
                            node &&
                            node.complete &&
                            node.naturalWidth === 0
                          ) {
                            handleImageError(boat.id, imageUrl as string);
                          }
                        }}
                        src={imageUrl}
                        alt={`${getModelLabel(boat.model)} photo`}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                        onLoad={() =>
                          logImageEvent('load', boat.id, imageUrl as string)
                        }
                        onError={() =>
                          handleImageError(boat.id, imageUrl as string)
                        }
                      />
                    ) : (
                      <img
                        src="/images/No-image.png"
                        alt="No image available"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Contenu */}
                  <div
                    className={`flex flex-1 flex-col gap-16 bg-fullwhite ${spotlight || gridView ? 'p-8 xs:p-16 sm:p-24' : 'p-8 xs:p-16 sm:p-24'}`}
                  >
                    {spotlight || gridView ? (
                      /* Mode Spotlight - Layout épuré */
                      <>
                        <div className="flex flex-row justify-between h-full w-full">
                          {/* Section supérieure : Titre et date */}
                          <div className="flex flex-col h-fit">
                            <p className="text-oceanblue text-16 ">
                              {formattedDate}
                            </p>
                            <h3 className="text-20 xs:text-32 font-medium text-articblue leading-tight">
                              {getModelLabel(boat.model)}
                            </h3>
                          </div>

                          {/* Section centrale : Prix principal */}
                        </div>
                        <div
                          className="relative py-1 w-fit max-w-full"
                          style={{ overflowX: 'clip' }}
                        >
                          <div className="flex flex-row items-center gap-2 flex-nowrap">
                            {boat.specifications.map((specification) => (
                              <span
                                className="text-oceanblue bg-lightgrey px-2 py-1 rounded-[6px] text-[12px] xs:text-14 shrink-0"
                                key={specification}
                              >
                                {specification}
                              </span>
                            ))}
                          </div>
                          <div className="absolute inset-y-0 right-0 w-72 bg-gradient-to-l from-fullwhite to-transparent pointer-events-none" />
                        </div>
                        <div className="flex flex-row items-center gap-2 ">
                          <span className="text-oceanblue">Price: </span>
                          <span className="font-medium text-oceanblue">
                            {formatPrice(Number(boat.price), boat.currency)}{' '}
                            {getCurrencySymbol(boat.currency)}
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

                        {/* Specifications */}
                        {boat.specifications &&
                          boat.specifications.length > 0 && (
                            <div
                              className="relative py-1 w-fit max-w-full"
                              style={{ overflowX: 'clip' }}
                            >
                              <div className="flex flex-row items-center gap-2 flex-nowrap">
                                {boat.specifications
                                  .slice(0, 2)
                                  .map((specification) => (
                                    <span
                                      className="text-oceanblue bg-lightgrey px-2 py-1 rounded-[6px] text-[12px] shrink-0"
                                      key={specification}
                                    >
                                      {specification}
                                    </span>
                                  ))}
                              </div>
                              <div className="absolute inset-y-0 right-0 w-72 bg-gradient-to-l from-fullwhite to-transparent pointer-events-none" />
                            </div>
                          )}

                        {/* Section centrale : Prix */}
                        <div className="flex items-center">
                          <div className="text-oceanblue text-24">
                            <span className="font-semibold text-oceanblue">
                              {formatPrice(Number(boat.price), boat.currency)}{' '}
                              {getCurrencySymbol(boat.currency)}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Flèche See More */}
                  {!gridView && (
                    <div className="bg-fullwhite hidden sm:flex items-center justify-center">
                      <div className="w-[60px] mr-24 h-fit py-2 flex justify-center text-articblue bg-fullwhite border-2 border-articblue rounded-[75px] transition-all duration-300 group-hover:text-fullwhite group-hover:bg-articblue">
                        <ArrowSeemore />
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
