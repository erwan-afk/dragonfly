'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ArrowButton from '@/components/icons/ArrowButton';
import EyeButton from '@/components/icons/EyeButton';
import AddButton from '@/components/icons/AddButton';
import GitHub from '@/components/icons/GitHub';
import Google from '@/components/icons/Google';

interface ButtonProps {
  text: string;
  href?: string;
  onClick?: () => void;
  icon?: 'view' | 'add' | 'link' | 'github' | 'google';
  bgColor?: string;
  iconColor?: string;
  outline?: string;
  textColor?: string;
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
  lowercase?: boolean;
  anim_disabled?: boolean;
  fullwidth?: boolean;
}

const icons = {
  view: EyeButton,
  add: AddButton,
  link: ArrowButton,
  github: GitHub,
  google: Google
};

export default function Button({
  text,
  href,
  onClick,
  icon,
  bgColor = 'bg-oceanblue',
  iconColor = 'text-fullwhite',
  outline = '',
  textColor = '',
  type = 'button',
  loading,
  lowercase,
  anim_disabled,
  fullwidth
}: ButtonProps) {
  const IconComponent = icon ? icons[icon] : null;

  const ButtonWrapper = anim_disabled ? 'button' : motion.button;
  const TextWrapper = anim_disabled ? 'span' : motion.span;
  const IconWrapper = anim_disabled ? 'span' : motion.span;

  const buttonClasses = `relative flex items-center py-1 pl-[12px] font-medium ${bgColor} ${iconColor} ${fullwidth ? `w-full justify-center` : 'w-fit'} text-16 rounded-[100px] overflow-hidden
    ${outline ? `border-2 ${outline}` : ''}
    ${lowercase ? 'pr-[12px]' : 'uppercase pr-[8px]'}
    ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`;

  const textContent = (
    <TextWrapper
      className={`flex items-center gap-2 ${textColor}`}
      {...(anim_disabled
        ? {}
        : {
            variants: {
              initial: { x: 0 },
              hover: { x: icon ? 16 : 0 }
            },
            transition: { duration: 0.3, ease: 'easeInOut' }
          })}
    >
      {loading ? '...' : text}
      {IconComponent && !loading && (
        <IconWrapper
          {...(anim_disabled
            ? {}
            : {
                variants: {
                  initial: { x: 0, opacity: 1 },
                  hover: { x: 20, opacity: 0 }
                },
                transition: { duration: 0.3, ease: 'easeInOut' }
              })}
        >
          <IconComponent className={iconColor} />
        </IconWrapper>
      )}
    </TextWrapper>
  );

  // Render button when onClick is provided
  if (onClick) {
    return (
      <ButtonWrapper
        type={type}
        onClick={loading ? undefined : onClick}
        disabled={loading}
        className={`${buttonClasses} ${fullwidth ? 'w-full' : ''}`}
        {...(anim_disabled
          ? {}
          : { whileHover: loading ? 'initial' : 'hover', initial: 'initial' })}
      >
        {textContent}
      </ButtonWrapper>
    );
  }

  // Render Link when href is provided - FIXED: Use Next.js Link instead of <a>
  if (href) {
    return (
      <Link href={href} className={`inline-block ${fullwidth ? `w-full` : ''}`}>
        <ButtonWrapper
          className={buttonClasses}
          {...(anim_disabled
            ? {}
            : { whileHover: 'hover', initial: 'initial' })}
        >
          {textContent}
        </ButtonWrapper>
      </Link>
    );
  }

  // Fallback render (shouldn't normally reach here)
  return (
    <ButtonWrapper
      className={buttonClasses}
      {...(anim_disabled ? {} : { whileHover: 'hover', initial: 'initial' })}
    >
      {textContent}
    </ButtonWrapper>
  );
}
