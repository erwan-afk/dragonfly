'use client';

import React from 'react';
import Link from 'next/link';

interface InnerProps {
  children: React.ReactNode;
  backgroundColor?: string;
  showNavigation?: boolean;
}

export default function Inner({
  children,
  backgroundColor = '#ffffff',
  showNavigation = true
}: InnerProps) {
  return (
    <div style={{ backgroundColor }}>
      {showNavigation && (
        <div className="header flex gap-6 p-4 bg-white border-b">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Home
          </Link>
          <Link
            href="/forsale"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            For Sale
          </Link>
          <Link
            href="/contact"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Contact
          </Link>
          <Link
            href="/account"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Account
          </Link>
        </div>
      )}
      {children}
    </div>
  );
}
