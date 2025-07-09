'use client';

import Link from 'next/link';

export default function DemoAnimationsPage() {
  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">
          Page de Démonstration
        </h1>

        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Retour à l'accueil
          </Link>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">
            Page Simple Sans Transitions
          </h2>
          <p className="text-gray-600 mb-4">
            Cette page n'utilise plus de transitions spéciales. Navigation
            normale.
          </p>
        </div>

        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold mb-4">Navigation</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/forsale"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Page For Sale
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Page Contact
            </Link>
            <Link
              href="/demo-transitions"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Démo Transitions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
