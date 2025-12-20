'use client';

import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  isInvalid?: boolean;
  touched?: boolean;
  startContent?: React.ReactNode;
  classNames?: {
    base?: string;
    label?: string;
    inputWrapper?: string;
    input?: string;
    errorMessage?: string;
  };
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      isInvalid,
      touched,
      startContent,
      classNames,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const hasError = isInvalid || (touched && error);

    return (
      <div className={cn('flex flex-col gap-1 w-full', classNames?.base)}>
        {label && (
          <label
            className={cn(
              '!text-oceanblue text-md font-medium',
              classNames?.label
            )}
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            'relative flex items-center px-3 bg-fullwhite border-2 border-oceanblue/10 data-[hover=true]:border-articblue data-[hover=true]:bg-articblue/10 transition-colors rounded-lg',
            hasError && 'border-red-500 border-2',
            classNames?.inputWrapper
          )}
        >
          {startContent && (
            <div className="flex-shrink-0 mr-3 text-zinc-400">
              {startContent}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full h-[48px] bg-transparent text-darkgrey placeholder:text-oceanblue/40 outline-none',
              'data-[focus=true]:bg-fullwhite',
              startContent && 'pl-0',
              classNames?.input,
              className
            )}
            {...props}
          />
        </div>
        {hasError && error && (
          <p
            className={cn(
              'text-red-500 text-xs mt-1',
              classNames?.errorMessage
            )}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;