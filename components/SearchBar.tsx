'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@heroui/checkbox';
import {
  dragonflyModels as BOAT_MODELS,
  countries as COUNTRIES,
  currencies as CURRENCIES
} from '@/utils/constants';
import { specificationsData as ATTRIBUTES } from '@/utils/specifications';
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger
} from '@heroui/dropdown';
import ArrowDropdown from '@/components/icons/ArrowDropdown';
import Link from 'next/link';
import FlagIcon from './icons/Flag';

export default function SearchBar() {
  const router = useRouter();
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedAttributes, setSelectedAttributes] = useState<Set<string>>(
    new Set()
  );
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('EUR');
  const [isAttributeDropdownOpen, setIsAttributeDropdownOpen] = useState(false);

  const flatAttributes = useMemo(
    () => ATTRIBUTES.flatMap((section: any) => section.items),
    []
  );

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (selectedModel) {
      params.append('model', selectedModel);
    }

    if (selectedCountry) {
      params.append('country', selectedCountry);
    }

    if (maxPrice > 0) {
      params.append('maxPrice', maxPrice.toString());
      params.append('currency', currency);
    }

    if (selectedAttributes.size > 0) {
      params.append('attributes', Array.from(selectedAttributes).join(','));
    }

    router.push(`/forsale?${params.toString()}`);
  };

  const toggleAttribute = useCallback((attrKey: string) => {
    setSelectedAttributes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(attrKey)) {
        newSet.delete(attrKey);
      } else {
        newSet.add(attrKey);
      }
      return newSet;
    });
  }, []);

  return (
    <div className="bg-fullwhite rounded-16 p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 items-center w-full md:w-auto md:min-w-[340px]">
      <div className="flex flex-row w-full text-black text-14 sm:text-16 gap-4">
        <div className="cursor-pointer w-full text-articblue font-medium text-center border-b-2 border-articblue pb-2">
          Buy
        </div>
        <Link
          href="/list-boat"
          className="cursor-pointer w-full text-center border-b-2 font-normal border-transparent pb-2 hover:border-articblue hover:text-articblue hover:font-medium transition-all duration-200"
        >
          Sell
        </Link>
      </div>
      {/* Première ligne : Model + Prix max */}
      <div className="grid grid-cols-2 w-full gap-2 sm:gap-4 items-center">
        {/* Dropdown Model */}
        <div className="w-full">
          <Dropdown>
            <DropdownTrigger>
              <button className="w-full rounded-full px-3 sm:px-5 h-7 sm:h-10 flex flex-row gap-1 sm:gap-2 items-center justify-between bg-lightgrey text-oceanblue hover:bg-smokygrey transition-colors min-w-0">
                <div className="font-medium text-[12px] sm:text-14 truncate flex-1">
                  {selectedModel
                    ? BOAT_MODELS.find((m) => m.key === selectedModel)?.label ||
                      'Model'
                    : 'Model'}
                </div>
                <ArrowDropdown className="flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Select a model"
              classNames={{
                base: 'max-h-[400px] overflow-y-auto bg-fullwhite',
                list: 'bg-fullwhite'
              }}
              onAction={(key) => {
                setSelectedModel(key as string);
              }}
            >
              {[{ key: '', label: 'All models' }, ...BOAT_MODELS].map(
                (model) => (
                  <DropdownItem
                    key={model.key}
                    classNames={{
                      base:
                        selectedModel === model.key
                          ? 'bg-lightgrey text-oceanblue font-medium data-[hover=true]:bg-lightgrey'
                          : 'text-oceanblue data-[hover=true]:bg-lightgrey data-[hover=true]:text-oceanblue'
                    }}
                  >
                    {model.label}
                  </DropdownItem>
                )
              )}
            </DropdownMenu>
          </Dropdown>
        </div>

        {/* Prix max + Currency */}
        <div className="w-full h-fit flex flex-row items-center bg-lightgrey rounded-full h-7 sm:h-10 overflow-hidden px-6 gap-2">
          <input
            type="number"
            min={0}
            placeholder="Price max"
            value={maxPrice === 0 ? '' : maxPrice}
            onChange={(e) =>
              setMaxPrice(e.target.value === '' ? 0 : Number(e.target.value))
            }
            className="flex-1 max-w-20 bg-transparent text-oceanblue font-medium text-[12px] sm:text-14 placeholder:text-oceanblue  outline-none   "
          />
          <Dropdown>
            <DropdownTrigger>
              <button className="flex items-center gap-1 text-oceanblue font-medium text-[12px] sm:text-14 shrink-0 cursor-pointer">
                {CURRENCIES.find((c) => c.key === currency)?.symbol || currency}
                <ArrowDropdown className="w-3 h-3" />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Select currency"
              classNames={{ base: 'bg-fullwhite', list: 'bg-fullwhite' }}
              onAction={(key) => setCurrency(key as string)}
            >
              {CURRENCIES.map((c) => (
                <DropdownItem
                  key={c.key}
                  classNames={{
                    base:
                      currency === c.key
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
      </div>

      {/* Deuxième ligne : Attributs + Localisation */}
      <div className="grid grid-cols-2 w-full gap-2 sm:gap-4">
        {/* Dropdown Attributs */}
        <div className="w-full">
          <Dropdown
            isOpen={isAttributeDropdownOpen}
            onOpenChange={setIsAttributeDropdownOpen}
          >
            <DropdownTrigger>
              <button className="w-full rounded-full px-3 sm:px-5 h-7 sm:h-10 flex flex-row gap-1 sm:gap-2 items-center justify-between bg-lightgrey text-oceanblue hover:bg-smokygrey transition-colors min-w-0">
                <div className="font-medium text-[12px] sm:text-14 truncate flex-1">
                  {selectedAttributes.size === 0
                    ? 'Attributes'
                    : `${selectedAttributes.size} selected`}
                </div>
                <ArrowDropdown className="flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Attributes"
              closeOnSelect={false}
              classNames={{
                base: 'max-h-[400px] overflow-y-auto bg-fullwhite',
                list: 'bg-fullwhite'
              }}
            >
              {flatAttributes.map((attr: any) => (
                <DropdownItem
                  key={attr.key}
                  classNames={{
                    base: 'cursor-pointer py-2 text-oceanblue data-[hover=true]:bg-lightgrey data-[hover=true]:text-oceanblue'
                  }}
                  onPress={() => toggleAttribute(attr.key)}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      disableAnimation
                      isSelected={selectedAttributes.has(attr.key)}
                      size="sm"
                      classNames={{
                        wrapper: 'after:bg-oceanblue after:border-oceanblue'
                      }}
                    />
                    <span className="text-oceanblue text-sm">{attr.label}</span>
                  </div>
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>

        {/* Dropdown Localisation */}
        <div className="w-full">
          <Dropdown>
            <DropdownTrigger>
              <button className="w-full rounded-full px-3 sm:px-5 h-7 sm:h-10 flex flex-row gap-1 sm:gap-2 items-center justify-between bg-lightgrey text-oceanblue hover:bg-smokygrey transition-colors min-w-0">
                <div className="font-medium text-[12px] sm:text-14 truncate flex-1">
                  {selectedCountry
                    ? COUNTRIES.find((c) => c.key === selectedCountry)?.label ||
                      'Location'
                    : 'Location'}
                </div>
                {selectedCountry ? (
                  <FlagIcon
                    flag={
                      COUNTRIES.find((c) => c.key === selectedCountry)?.flag ||
                      ''
                    }
                  />
                ) : (
                  ''
                )}

                <ArrowDropdown className="flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Select a location"
              classNames={{
                base: 'max-h-[400px] overflow-y-auto bg-fullwhite',
                list: 'bg-fullwhite'
              }}
              onAction={(key) => {
                setSelectedCountry(key as string);
              }}
            >
              {[
                { key: '', label: 'Tous les pays', flag: '' },
                ...COUNTRIES
              ].map((country) => (
                <DropdownItem
                  key={country.key}
                  classNames={{
                    base:
                      selectedCountry === country.key
                        ? 'bg-lightgrey text-16 text-oceanblue font-medium data-[hover=true]:bg-lightgrey'
                        : 'text-oceanblue data-[hover=true]:bg-lightgrey data-[hover=true]:text-oceanblue'
                  }}
                >
                  <div className="flex items-center gap-2">
                    {country.label}
                    {country.flag ? <FlagIcon flag={country.flag} /> : ''}
                  </div>
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Bouton Search */}
      <button
        onClick={handleSearch}
        className="bg-articblue w-full text-center text-14 sm:text-16 text-fullwhite px-8 py-1 rounded-full font-medium hover:bg-oceanblue transition-colors whitespace-nowrap"
      >
        Search
      </button>
    </div>
  );
}
