'use client';
import { useEffect, useState } from 'react';
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
import { EditIcon, EyeIcon, TrashIcon, MoreVertical } from 'lucide-react';
import Link from 'next/link'; // Importez Link depuis next/link
import { Spinner } from '@heroui/spinner';
import { Skeleton } from '@heroui/skeleton';
import { useRouter } from 'next/navigation';
import { Boat } from '@/types/database';

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
  const [loadingBoatId, setLoadingBoatId] = useState<string | null>(null);
  const [deletingBoatId, setDeletingBoatId] = useState<string | null>(null);
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
    : boats.filter((boat) => {
        const price = Number(boat.price) ?? 0;
        const inPriceRange =
          price >= selectedPrice[0] && price <= selectedPrice[1];
        const matchesModel = !selectedModel || boat.model === selectedModel;
        const matchesCountry =
          !selectedCountry || boat.country === selectedCountry;
        return inPriceRange && matchesModel && matchesCountry;
      });

  return (
    <>
      {!spotlight &&
        !edit && ( // Ne pas afficher les filtres si edit est true
          <div className="">
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
                      <AutocompleteItem key={model}>{model}</AutocompleteItem>
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
                ? photos.map((photo) => `${photo}`)
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

              return edit ? (
                <div
                  key={boat.id}
                  className={`group ${!spotlight ? 'border-stonegrey border hover:border-articblue' : ''} flex flex-row overflow-hidden transition-all cursor-pointer duration-300 rounded-[16px]`}
                >
                  {/* Image avec effet de zoom */}
                  <div className="w-1/3 flex justify-start items-end overflow-hidden">
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
                      <h3 className="text-32 font-medium text-articblue">
                        {boat.model}
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
                            expiresSoon ? 'text-orange-500' : 'text-oceanblue'
                          }`}
                        >
                          Expires in {daysUntilExpiration} day
                          {daysUntilExpiration !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Menu Actions pour le mode edit */}
                  <div className="bg-fullwhite flex items-center justify-center">
                    <Dropdown>
                      <DropdownTrigger>
                        <div className="w-[60px] mr-24 h-fit py-2 flex justify-center text-articblue bg-fullwhite border-2 border-articblue rounded-[75px] transition-all duration-300 hover:text-fullwhite hover:bg-articblue cursor-pointer">
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
                      >
                        <DropdownItem
                          key="view"
                          startContent={<EyeIcon size={16} />}
                          onClick={() => router.push(`/boat/${boat.id}`)}
                          classNames={{
                            base: 'text-oceanblue data-[hover=true]:bg-lightgrey data-[hover=true]:text-oceanblue'
                          }}
                        >
                          View Listing
                        </DropdownItem>
                        <DropdownItem
                          key="edit"
                          startContent={<EditIcon size={16} />}
                          onClick={() => {
                            sessionStorage.setItem(
                              `boat-${boat.id}`,
                              JSON.stringify(boat)
                            );
                            router.push(`/edit-listing/${boat.id}`);
                          }}
                          classNames={{
                            base: 'text-oceanblue data-[hover=true]:bg-lightgrey data-[hover=true]:text-oceanblue'
                          }}
                        >
                          Edit Listing
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          startContent={<TrashIcon size={16} />}
                          onClick={() => handleDeleteBoat(boat.id)}
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
                    {/* Image avec effet de zoom */}
                    <div className="w-1/3 flex justify-start items-end overflow-hidden">
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
                        <p className="text-oceanblue text-16 italic">
                          {formattedDate}
                        </p>
                        <h3 className="text-32 font-medium text-articblue">
                          {boat.model}
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
  );
}
