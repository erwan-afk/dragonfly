'use client';

import { PricingCard } from '@/components/ui/PrincingCard/PrincingCard';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { formatPriceCurrency } from '@/utils/format-price';
import {
  getPriceLimitSummaryText,
  START_LINE_LIMIT_BY_CURRENCY
} from '@/lib/product-features';
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger
} from '@heroui/dropdown';
import ArrowDropdown from '@/components/icons/ArrowDropdown';

const LIMIT_CURRENCIES = Object.keys(START_LINE_LIMIT_BY_CURRENCY);

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
  CAD: 'CA$',
  AUD: 'A$'
};

interface PricingSectionProps {
  products: any[];
  user: any;
  userSubscription: any;
}

export default function PricingSection({
  products,
  user,
  userSubscription
}: PricingSectionProps) {
  const pathname = usePathname();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [limitCurrency, setLimitCurrency] = useState<string>('EUR');

  // Mapper les noms de produits aux features correspondantes
  const buildFeaturesMap = (
    currency: string | null | undefined,
    symbol: string
  ): Record<string, string[]> => ({
    'Start Line': [
      getPriceLimitSummaryText('start line', symbol, currency),
      'Includes 3 photos',
      'Duration of 3 months'
    ],
    'Mid-Course': [
      getPriceLimitSummaryText('mid-course', symbol, currency),
      'Includes 5 photos',
      'Duration of 3 months'
    ],
    Podium: [
      'All boats',
      'Includes 10 photos',
      'Duration of 4 months',
      'Regular prominence on the home page'
    ],
    Renewal: ['Advertisement extended for a further 3 months']
  });

  const toTitleCase = (str: string) =>
    str.replace(/\b\w/g, (c) => c.toUpperCase());

  const getCurrencySymbol = (currency: string | null | undefined): string => {
    const symbols: Record<string, string> = {
      eur: ' €',
      usd: ' $',
      gbp: ' £',
      chf: ' CHF',
      cad: ' CA$',
      aud: ' A$'
    };
    return (
      symbols[(currency ?? '').toLowerCase()] ??
      ' ' + (currency?.toUpperCase() ?? '')
    );
  };

  const classifyPlan = (name: string): number => {
    const n = (name || '').toLowerCase();
    if (n.includes('boost')) return 999;
    if (n.includes('start') && n.includes('line')) return 0;
    if (n.includes('mid') || n.includes('course')) return 1;
    if (n.includes('podium')) return 2;
    if (n.includes('renewal')) return 3;
    return 999;
  };

  const sortedProducts = [...products]
    .filter((p) => classifyPlan(p.name) !== 999)
    .sort((a, b) => classifyPlan(a.name) - classifyPlan(b.name));

  return (
    <section
      className={`w-full ${pathname === '/pricing' ? '' : 'pb-[100px]'}  `}
    >
      <div className="mx-auto max-w-screen-xl flex flex-col gap-32 px-16 xs:px-16 xl:px-0">
        <div className="flex flex-row items-center justify-between gap-16">
          {pathname !== '/pricing' ? (
            <h1 className="text-oceanblue text-32">
              <span className="text-articblue">Pricing</span> for ads
            </h1>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-8">
            <span className="text-darkgrey text-14">Boat price in</span>
            <Dropdown>
              <DropdownTrigger>
                <button className="flex items-center gap-2 rounded-lg px-3 h-9 bg-fullwhite border-2 border-oceanblue/10 hover:border-articblue hover:bg-articblue/10 transition-colors !text-oceanblue font-medium text-14 cursor-pointer">
                  {CURRENCY_SYMBOLS[limitCurrency] || limitCurrency}{' '}
                  {limitCurrency}
                  <ArrowDropdown className="w-3 h-3" />
                </button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Select currency for boat price limit"
                classNames={{ base: 'bg-fullwhite', list: 'bg-fullwhite' }}
                onAction={(key) => setLimitCurrency(key as string)}
              >
                {LIMIT_CURRENCIES.map((code) => (
                  <DropdownItem
                    key={code}
                    classNames={{
                      base:
                        limitCurrency === code
                          ? '!bg-lightgrey data-[hover=true]:!bg-lightgrey'
                          : 'data-[hover=true]:!bg-lightgrey',
                      title:
                        limitCurrency === code
                          ? '!text-oceanblue !font-medium'
                          : '!text-oceanblue'
                    }}
                  >
                    {CURRENCY_SYMBOLS[code] || code} {code}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        <div className="flex flex-col sm:grid sm:grid-cols-2 xl:grid-cols-4 gap-16 justify-center items-stretch">
          {sortedProducts.map((product, index) => {
            const price = product?.prices?.[0];
            const productName = toTitleCase(product.name ?? 'No title');
            const popular = productName === 'Mid-Course';
            const renewal = productName === 'Renewal';

            if (!price) return null;

            return (
              <div
                key={product.id}
                className="flex"
                onMouseEnter={() => setHoveredCard(productName)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <PricingCard
                  title={productName}
                  price={formatPriceCurrency(
                    Number(price.unit_amount ?? 0) / 100,
                    (price.currency || 'eur').toUpperCase()
                  )}
                  buttonText={renewal ? 'Upgrade an ad' : 'Place an ad'}
                  features={
                    buildFeaturesMap(
                      limitCurrency,
                      CURRENCY_SYMBOLS[limitCurrency] || limitCurrency
                    )[productName] || [
                      'Custom package',
                      'Flexible options available'
                    ]
                  }
                  stripePrice={price}
                  stripeProduct={product}
                  popular={popular}
                  renewal={renewal}
                  isHovered={hoveredCard === productName}
                  isOtherHovered={
                    hoveredCard !== null && hoveredCard !== productName
                  }
                />
              </div>
            );
          })}
        </div>

        <div className="flex flex-row justify-center items-center gap-8">
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="0.3"
              y="0.3"
              width="12.4"
              height="12.3531"
              rx="6.17656"
              fill="none"
            />
            <rect
              x="0.3"
              y="0.3"
              width="12.4"
              height="12.3531"
              rx="6.17656"
              stroke="black"
              strokeWidth="0.6"
            />
            <path
              d="M6.7432 10H6.0432V4.73H6.7432V10ZM6.9532 3.51C6.9532 3.66333 6.89987 3.79 6.7932 3.89C6.6932 3.99 6.55654 4.04 6.3832 4.04C6.2232 4.04 6.08987 3.99 5.9832 3.89C5.87654 3.79 5.8232 3.66333 5.8232 3.51C5.8232 3.35667 5.87654 3.23333 5.9832 3.14C6.08987 3.04 6.2232 2.99 6.3832 2.99C6.55654 2.99 6.6932 3.04 6.7932 3.14C6.89987 3.23333 6.9532 3.35667 6.9532 3.51Z"
              fill="black"
            />
          </svg>{' '}
          <span className="text-darkgrey text-[12px]">
            We offer a range of advertising plans crafted to meet diverse needs
            and budgets, ensuring your Dragonfly stands out in the marketplace.
            Each plan is designed to maximize exposure and accelerate your sale.
          </span>
        </div>
      </div>
    </section>
  );
}
