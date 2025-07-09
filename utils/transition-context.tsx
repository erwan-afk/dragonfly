'use client';

import React, { ReactNode } from 'react';

// Context vidé - plus de transitions

interface ProviderProps {
  children: ReactNode;
}

export function TransitionProvider({ children }: ProviderProps) {
  return <>{children}</>;
}

export function useTransition() {
  return {};
}

export function usePageAnimation() {
  return {};
}
