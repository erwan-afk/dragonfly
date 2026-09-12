import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { dragonflyModels, currencies, countries, boatConditions } from '@/utils/constants';
import { formatPriceNumber } from '@/utils/format-price';
import { groupSpecsBySection } from '@/utils/specifications';
import { normalizeImageUrls } from '@/utils/image-urls';
import FlagIcon from '@/components/icons/Flag';
import ModelImage from '@/components/ui/ModelImage/ModelImage';
import type { ModelData } from '@/utils/models-data';
import { SellerContact } from './SellerContact';
import { FavoriteButton } from '@/components/ui/FavoriteButton/FavoriteButton';
import { ShareButton } from './ShareButton';
import { SpecGroupIcon } from './SpecGroupIcon';

function getModelStartYear(yearsProduced: string): string | null {
  const match = yearsProduced.match(/\d{4}/);
  return match ? match[0] : null;
}

export interface SimilarBoat {
  id: string;
  model: string;
  year: number | string | null;
  price: number;
  currency: string;
  country: string;
  photos: string[] | null;
}

export interface BoatDetailsProps {
  boat: {
    id: string;
    model: string;
    price: number;
    currency: string;
    description: string | null;
    country: string;
    specifications: string[] | null;
    user: { name: string | null };
  };
  year: number | string | null;
  formattedDate: string;
  condition: string | null;
  viewCount: number;
  isSold: boolean;
  isOwner: boolean;
  isActive: boolean;
  model: ModelData;
  similarBoats: SimilarBoat[];
  sellerMemberSinceYear: number | null;
  sellerListingsCount: number;
  isFavoritedInitial: boolean;
  isAuthenticated: boolean;
}

function StatusBanners({ isSold, isActive, isOwner }: Pick<BoatDetailsProps, 'isSold' | 'isActive' | 'isOwner'>) {
  if (isSold) {
    return (
      <div className="rounded-8 border border-red-200 bg-red-50 px-16 py-8 flex items-center gap-8">
        <span className="font-bold text-14 tracking-wider uppercase text-red-700">Sold</span>
        <span className="text-14 text-red-600">This boat has been sold and is no longer available.</span>
      </div>
    );
  }
  if (!isActive && isOwner) {
    return (
      <div className="rounded-8 border border-orange-200 bg-orange-50 px-16 py-8 text-oceanblue">
        <div className="font-medium text-14">Payment is being processed</div>
        <div className="text-14 text-darkgrey">Your listing will appear publicly once Stripe confirms payment.</div>
      </div>
    );
  }
  return null;
}

export function BoatDetails(props: BoatDetailsProps) {
  const {
    boat,
    year,
    formattedDate,
    condition,
    viewCount,
    isSold,
    isOwner,
    isActive,
    model,
    similarBoats,
    sellerMemberSinceYear,
    sellerListingsCount,
    isFavoritedInitial,
    isAuthenticated
  } = props;

  const modelLabel = dragonflyModels.find((m) => m.key === boat.model)?.label || boat.model;
  const conditionLabel = condition ? boatConditions.find((c) => c.key === condition)?.label || condition : null;
  const countryFlag = countries.find((c) => c.key === boat.country)?.flag || '';
  const countryLabel = countries.find((c) => c.key === boat.country)?.label || boat.country;
  const specGroups = groupSpecsBySection(boat.specifications || []);
  const titleSuffix = year ? ` — ${year}` : '';
  const priceLabel = `${formatPriceNumber(boat.price, boat.currency)} ${currencies.find((c) => c.key === boat.currency)?.symbol || boat.currency}`;
  const startYear = getModelStartYear(model.yearsProduced);
  const modelLoa = model.specs.find((s) => s.label === 'Length overall')?.value;
  const modelBeam = model.specs.find((s) => s.label === 'Beam (sailing)')?.value;
  const modelWeight = model.specs.find((s) => s.label === 'Displacement')?.value;

  return (
    <div className="flex flex-col gap-32">
      <StatusBanners isSold={isSold} isActive={isActive} isOwner={isOwner} />

      <div className="flex flex-wrap gap-40 items-start">
        {/* LEFT: main content */}
        <div className="min-w-0 flex-[2_1_460px] flex flex-col gap-24">
          <div className="flex items-start justify-between gap-16">
            <div className="flex flex-col gap-[14px]">
              <div className="flex gap-8 flex-wrap">
                <span className="bg-[#16333a] text-fullwhite text-[11px] font-bold tracking-wide px-[10px] py-[6px] rounded-[6px] flex items-center gap-[6px] uppercase">
                  {countryLabel} {countryFlag && <FlagIcon flag={countryFlag} />}
                </span>
                {conditionLabel && (
                  <span className="bg-[#e5f4f2] text-[#2c8a82] text-[11px] font-bold tracking-wide px-[10px] py-[6px] rounded-[6px] uppercase">
                    {conditionLabel}
                  </span>
                )}
              </div>
              <h1 className="text-[32px] font-bold text-[#2c8a82] leading-tight">
                {modelLabel}
                {titleSuffix}
              </h1>
              <div className="text-[13px] text-[#8b979d]">
                Listed {formattedDate} · {viewCount} view{viewCount !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="flex gap-[10px] shrink-0">
              <FavoriteButton boatId={boat.id} initialFavorited={isFavoritedInitial} isAuthenticated={isAuthenticated} />
              <ShareButton />
            </div>
          </div>

          {/* Model strip */}
          <div className="border border-[#eef1f5] rounded-12 p-[20px]">
            <div className="flex gap-16">
              <div className="relative w-[88px] h-[64px] rounded-8 overflow-hidden bg-[#eef1f5] shrink-0">
                <ModelImage src={model.image} alt={model.name} fill sizes="88px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold tracking-wide text-[#7c8990] uppercase">Model overview</div>
                <div className="text-[13px] text-[#37464d] mt-[4px]">
                  {startYear ? `In production since ${startYear}` : model.yearsProduced} · Designed by {model.designer}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-8 mt-16">
              {modelLoa && (
                <div className="bg-[#f7f9fa] rounded-8 p-[10px] text-center">
                  <div className="text-14 font-bold text-[#16232b]">{modelLoa}</div>
                  <div className="text-[11px] text-[#8b979d]">LOA</div>
                </div>
              )}
              {modelBeam && (
                <div className="bg-[#f7f9fa] rounded-8 p-[10px] text-center">
                  <div className="text-14 font-bold text-[#16232b]">{modelBeam}</div>
                  <div className="text-[11px] text-[#8b979d]">Beam</div>
                </div>
              )}
              {modelWeight && (
                <div className="bg-[#f7f9fa] rounded-8 p-[10px] text-center">
                  <div className="text-14 font-bold text-[#16232b]">{modelWeight}</div>
                  <div className="text-[11px] text-[#8b979d]">Weight</div>
                </div>
              )}
            </div>
            <Link
              href={`/models/${model.key}?from=${encodeURIComponent(`/boat/${boat.id}`)}`}
              className="inline-flex items-center gap-[4px] mt-[14px] text-[13px] font-semibold text-[#2c8a82] hover:underline"
            >
              View model page <ArrowRight size={13} />
            </Link>
          </div>

          <div className="w-full h-[1px] bg-[#eef1f5]" />

          <div>
            <div className="text-[13px] font-bold tracking-wide text-[#7c8990] uppercase mb-[12px]">Description</div>
            <p className="text-[15px] leading-[1.7] text-[#37464d] whitespace-pre-line break-words m-0">{boat.description}</p>
          </div>

          <div className="w-full h-[1px] bg-[#eef1f5]" />

          <div>
            <div className="text-[13px] font-bold tracking-wide text-[#7c8990] uppercase mb-16">Specifications</div>
            {specGroups.length === 0 ? (
              <p className="text-14 text-[#8b979d] italic">No specifications provided.</p>
            ) : (
              specGroups.map((group) => (
                <div key={group.title} className="mb-[28px] last:mb-0">
                  <div className="flex items-start gap-[10px] mb-[12px]">
                    <div className="w-[26px] h-[26px] rounded-[7px] text-[#2c8a82] flex items-center justify-center shrink-0 -mt-[2px]">
                      <SpecGroupIcon title={group.title} />
                    </div>
                    <span className="text-[14.5px] font-semibold text-[#16232b] leading-[1.4]">{group.title}</span>
                  </div>
                  <div className="grid gap-[10px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                    {group.items.map((spec) => (
                      <div
                        key={spec.key}
                        className="flex items-center bg-[#f7f9fa] rounded-8 px-[14px] py-[12px] text-[13.5px] leading-[1.4] text-[#37464d]"
                      >
                        {spec.label}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: sticky sidebar */}
        <div className="flex-[1_1_300px] min-w-[280px] flex flex-col gap-16 lg:sticky lg:top-24">
          <div className="border border-[#eef1f5] rounded-[14px] p-[22px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="text-[28px] font-bold text-[#16232b]">{priceLabel}</div>

            {!isOwner && (
              <div className="mt-16">
                <SellerContact listingId={boat.id} model={boat.model} country={boat.country} isLoggedIn={isAuthenticated} />
              </div>
            )}

            <div className="w-full h-[1px] bg-[#eef1f5] my-[18px]" />

            <div className="flex items-center gap-[12px]">
              <div className="w-[44px] h-[44px] rounded-full bg-[#16333a] text-fullwhite font-bold flex items-center justify-center shrink-0">
                {boat.user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-[14.5px] font-semibold text-[#16232b]">{boat.user.name || 'Anonymous user'}</div>
                <div className="text-[12.5px] text-[#8b979d]">
                  {sellerMemberSinceYear ? `Member since ${sellerMemberSinceYear}` : 'New seller'} · {sellerListingsCount} listing
                  {sellerListingsCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {similarBoats.length > 0 && (
        <>
          <div className="w-full h-[1px] bg-[#eef1f5]" />
          <div>
            <div className="text-18 font-bold text-[#16232b] mb-16">Similar listings</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-[20px]">
              {similarBoats.map((similar) => {
                const similarModelLabel = dragonflyModels.find((m) => m.key === similar.model)?.label || similar.model;
                const similarCountryLabel = countries.find((c) => c.key === similar.country)?.label || similar.country;
                const similarPhotos = normalizeImageUrls(similar.photos || []);
                const similarImage = similarPhotos[0];
                const similarSymbol = currencies.find((c) => c.key === similar.currency)?.symbol || similar.currency;

                return (
                  <Link
                    key={similar.id}
                    href={`/boat/${similar.id}`}
                    className="block border border-[#eef1f5] rounded-12 overflow-hidden hover:border-[#2c8a82]/40 transition-colors"
                  >
                    <div className="h-[140px] bg-[#eef1f5] relative">
                      {similarImage && (
                        <ModelImage src={similarImage} alt={similarModelLabel} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
                      )}
                    </div>
                    <div className="p-[14px]">
                      <div className="text-[15px] font-semibold text-[#16232b]">
                        {similarModelLabel}
                        {similar.year ? ` — ${similar.year}` : ''}
                      </div>
                      <div className="text-[12.5px] text-[#8b979d] my-[4px]">{similarCountryLabel}</div>
                      <div className="text-16 font-bold text-[#2c8a82]">
                        {formatPriceNumber(similar.price, similar.currency)} {similarSymbol}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
