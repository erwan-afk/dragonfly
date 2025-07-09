'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [boatId, setBoatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestBoat = async () => {
      try {
        setLoading(true);

        // Attendre un peu pour laisser le webhook se terminer
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Récupérer le dernier bateau créé par l'utilisateur
        const response = await fetch('/api/payment/latest-boat');
        const result = await response.json();

        if (result.success && result.boat) {
          setBoatId(result.boat.id);
          console.log('✅ Bateau récupéré avec succès:', result.boat.id);
        } else {
          console.warn('⚠️ Aucun bateau récent trouvé, nouvel essai...');
          // Réessayer une fois après 2 secondes
          setTimeout(async () => {
            try {
              const retryResponse = await fetch('/api/payment/latest-boat');
              const retryResult = await retryResponse.json();

              if (retryResult.success && retryResult.boat) {
                setBoatId(retryResult.boat.id);
                console.log(
                  '✅ Bateau récupéré lors du retry:',
                  retryResult.boat.id
                );
              } else {
                setError('Impossible de récupérer les informations du bateau');
              }
            } catch (retryError) {
              console.error('Erreur lors du retry:', retryError);
              setError('Impossible de récupérer les informations du bateau');
            } finally {
              setLoading(false);
            }
          }, 2000);
          return;
        }
      } catch (error) {
        console.error('Error fetching latest boat:', error);
        setError('Impossible de récupérer les informations du bateau');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestBoat();
  }, []);

  const handleContinue = () => {
    if (boatId) {
      router.push(`/boat/${boatId}`);
    } else {
      router.push('/account?section=ads');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {/* Icône de succès */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Paiement réussi !
          </h1>

          <p className="text-gray-600 mb-6">
            Votre annonce a été créée avec succès.
          </p>

          {/* État de chargement */}
          {loading && (
            <div className="mb-6">
              <div className="flex justify-center items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">
                  Finalisation de votre annonce...
                </span>
              </div>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
              <p className="text-red-600 text-xs mt-1">
                Vous pouvez accéder à votre annonce depuis votre compte.
              </p>
            </div>
          )}

          {/* Message de succès */}
          {!loading && !error && boatId && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm">
                ✅ Votre annonce a été créée avec succès !
              </p>
              <p className="text-green-600 text-xs mt-1">
                Toutes les images ont été traitées automatiquement.
              </p>
            </div>
          )}

          {/* Bouton continuer */}
          <div className="space-y-3">
            <Button
              text={boatId ? 'Voir mon annonce' : 'Aller à mon compte'}
              onClick={handleContinue}
              loading={loading}
              fullwidth
            />

            <button
              onClick={() => router.push('/account?section=ads')}
              className="w-full text-gray-500 hover:text-gray-700 text-sm"
            >
              Aller à mon compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
