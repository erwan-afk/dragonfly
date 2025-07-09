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
import BoatListingForm from '@/components/ui/BoatListingForm/BoatListingForm';
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
}

export const PricingCard: React.FC<PricingCardProps> = ({
  title,
  price,
  features,
  buttonText,
  stripePrice,
  stripeProduct,

  popular = false,
  renewal = false
}) => {
  const router = useRouter();
  const [priceIdLoading, setPriceIdLoading] = useState<string>();
  const currentPath = usePathname();

  return (
    <div
      className={`flex flex-col  ${renewal ? 'bg-fullwhite' : ' bg-fullwhite'}  py-40 px-32 gap-32 w-full rounded-16 ${popular ? 'border-2 border-articblue scale-110 mx- ' : ''}`}
    >
      <div className="w-full flex flex-row justify-between items-center">
        <h2
          className={`${renewal ? 'text-darkgrey' : ' text-articblue'} flex items-center font-light leading-[60%] h-[25px] text-24`}
        >
          {title}
        </h2>
        {popular && ( // Condition d'affichage
          <div
            className={`border-2 border-articblue text-articblue h-fit px-[10px] py-[4px] gap-[5px] flex flex-row items-center rounded-[100px]`}
          >
            <motion.div
              initial={{ rotate: 0, scale: 1 }}
              whileInView={{
                rotate: [0, 15, -15, 0],
                scale: [1, 1.4, 1.4, 1]
              }}
              transition={{
                duration: 0.8,
                ease: 'easeInOut',
                delay: 0.5
              }}
              viewport={{ amount: 0.5 }}
            >
              <Star />
            </motion.div>
            <div className="uppercase font-medium text-articblue leading-[80%] text-[12px]">
              Popular
            </div>
          </div>
        )}
      </div>

      <h1 className="font-medium text-32 text-darkgrey">{price}</h1>

      <button
        onClick={() => {
          const queryString = new URLSearchParams({
            preference: title
          }).toString();
          window.location.href = `/list-boat?${queryString}`;
        }}
        className="bg-articblue w-full rounded-full py-[5px] text-20 hover:bg-[#4A888A] duration-200 transition-all"
      >
        {buttonText}
      </button>
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
