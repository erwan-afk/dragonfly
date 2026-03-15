'use client';

import Button from '@/components/ui/Button';
import LogoCloud from '@/components/ui/LogoCloud';
import { getStripe } from '@/utils/stripe/client';
import { checkoutWithStripe } from '@/utils/stripe/server';
import { getErrorRedirect } from '@/utils/helpers';
import {
  UserSimple as User,
  StripePrice,
  StripeProduct
} from '@/types/database';
import cn from 'classnames';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import Valide from '@/components/icons/Valide';
import Star from '@/components/icons/Star';
import { motion } from 'framer-motion';

// Types importés de @/types/database

// Cette interface Props n'est pas utilisée dans ce composant

interface PricingCardProps {
  title: string;
  price: string;
  features: string[];
  buttonText: string;
  stripePrice: StripePrice;
  stripeProduct: StripeProduct;

  popular?: boolean;
  renewal?: boolean;
  isHovered?: boolean;
  isOtherHovered?: boolean;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  features,
  buttonText,
  stripePrice,
  stripeProduct,

  popular = false,
  renewal = false,
  isHovered = false,
  isOtherHovered = false
}) => {
  const router = useRouter();
  const [priceIdLoading, setPriceIdLoading] = useState<string>();
  const currentPath = usePathname();

  // Déterminer la couleur de la bordure
  const getBorderClass = () => {
    if (popular) {
      if (isHovered) return 'border-articblue';
      if (isOtherHovered) return 'border-smokygrey';
      return 'border-oceanblue';
    }
    return isHovered ? 'border-articblue' : 'border-smokygrey';
  };

  return (
    <div
      className={`flex flex-col bg-fullwhite py-24 px-16  lg:py-40 lg:px-32 gap-24 lg:gap-32 w-full h-full rounded-16 border-2 transition-colors overflow-hidden ${getBorderClass()}`}
    >
      <div className="w-full flex flex-row justify-center sm:justify-between items-center">
        <h2
          className={`${renewal ? 'text-darkgrey' : ' text-oceanblue'} flex items-center  leading-[60%] h-[25px] text-24`}
        >
          {title}
        </h2>
        {popular && ( // Condition d'affichage
          <div
            className={`border-2 hidden sm:block border-oceanblue text-oceanblue h-fit px-[10px] py-[4px] gap-[5px] flex flex-row items-center rounded-[100px]`}
          >
            <motion.div
              key={isHovered ? 'hovered' : 'not-hovered'} // Force re-render on hover
              initial={{ rotate: 0, scale: 1 }}
              animate={
                isHovered
                  ? {
                      rotate: [0, 15, -15, 0],
                      scale: [1, 1.4, 1.4, 1]
                    }
                  : { rotate: 0, scale: 1 }
              }
              transition={{
                duration: 0.8,
                ease: 'easeInOut'
              }}
            >
              <Star />
            </motion.div>
            <div className="uppercase font-medium text-oceanblue leading-[80%] text-[12px]">
              Popular
            </div>
          </div>
        )}
      </div>

      {popular && ( // Condition d'affichage
        <div className="flex flex-row justify-center">
        <div
          className={`border-2 sm:hidden w-fit border-oceanblue text-oceanblue h-fit px-[10px] py-[4px] gap-[5px] flex flex-row items-center rounded-[100px]`}
        >
          <motion.div
            key={isHovered ? 'hovered' : 'not-hovered'} // Force re-render on hover
            initial={{ rotate: 0, scale: 1 }}
            animate={
              isHovered
                ? {
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.4, 1.4, 1]
                  }
                : { rotate: 0, scale: 1 }
            }
            transition={{
              duration: 0.8,
              ease: 'easeInOut'
            }}
          >
            <Star />
          </motion.div>
          <div className="uppercase font-medium text-oceanblue leading-[80%] text-[12px]">
            Popular
          </div>
        </div>
        </div>
      )}

      <h1 className="font-medium text-24 xs:text-32 text-oceanblue break-words text-center sm:text-left">{price}</h1>

      <div className="flex justify-center sm:justify-start">
      <Button
        text={title}
        href="/pricing"
        bgColor={popular ? 'bg-oceanblue' : 'bg-articblue'}
        textColor="text-fullwhite"
        icon="link"
        textsize="text-12"
        onClick={() => {
          const queryString = new URLSearchParams({
            preference: title
          }).toString();
          window.location.href = `/list-boat?${queryString}`;
        }}
      />
      </div>
      <div className="h-[1px] w-full bg-smokygrey"></div>
      <div className="flex flex-col gap-24">
        <div className="text-oceanblue flex flex-col font-medium">Features</div>
        <div className="flex flex-col gap-[12px]">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-row gap-[10px] text-articblue"
            >
              <div className="h-full pt-[2px]">
                <Valide />
              </div>

              <div className="text-darkgrey leading-[120%]">{feature}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
