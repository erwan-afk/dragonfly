'use client';

import { useState, useEffect, useCallback } from 'react';
import CustomerPortalForm from '@/components/ui/AccountForms/CustomerPortalForm';
import MyListings from '@/components/ui/AccountForms/MyListing';
import { Json, User, Boat } from '@/types/database';
import EmailForm from '../AccountForms/EmailForm';
import NameForm from '../AccountForms/NameForm';
import PasswordForm from '../AccountForms/PasswordForm';
import { Skeleton } from '@heroui/skeleton';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import SpotlightBoats from '../SpotlightBoats/SpotlightBoats';
import Button from '../Button/Button';
import { useLoadingBar } from '../LoadingProvider';
import { getModelLabel, getProductLabel } from '@/utils/constants';
import Link from 'next/link';

interface UserDetails {
  avatar_url: string | null;
  billing_address: Json | null;
  created_at: Date;
  email: string | null;
  full_name: string | null;
  id: string;
  payment_method: Json | null;
}

interface AccountClientProps {
  userDetails: UserDetails;
  boats: Boat[];
  payments: any[];
  products: any[];
  isLoading?: boolean;
}

export function AccountClient({
  userDetails,
  boats,
  payments,
  products,
  isLoading = false
}: AccountClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { withLoading, stopLoading } = useLoadingBar();
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [currentBoats, setCurrentBoats] = useState(boats);
  const [statusMessage, setStatusMessage] = useState<{
    title: string;
    description: string;
  } | null>(null);

  // Gérer les messages de statut depuis l'URL
  useEffect(() => {
    const status = searchParams.get('status');
    const statusDescription = searchParams.get('status_description');

    if (status && statusDescription) {
      setStatusMessage({
        title: status,
        description: statusDescription
      });

      // Nettoyer l'URL après avoir affiché le message
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('status');
      newSearchParams.delete('status_description');

      const newUrl =
        pathname +
        (newSearchParams.toString() ? `?${newSearchParams.toString()}` : '');
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  // Fonction pour recharger les données des bateaux
  const refreshBoatsData = useCallback(async () => {
    try {
      const response = await fetch('/api/user/boats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.boats) {
          console.log(
            '🔄 Boats data refreshed:',
            data.boats.map((b: any) => ({
              id: b.id,
              status: b.status,
              model: b.model
            }))
          );
          setCurrentBoats(data.boats);
          return data.boats;
        }
      } else {
        console.error('Failed to refresh boats data:', response.status);
      }
    } catch (error) {
      console.error('Error refreshing boats data:', error);
    }
    return null;
  }, []);

  // Détecter si on vient d'un paiement réussi
  useEffect(() => {
    const payment = searchParams.get('payment');

    if (payment === 'success') {
      setShowPaymentSuccess(true);
      console.log('✅ Just arrived after successful payment');

      // Garder l'état "just paid" pendant 8 secondes pour montrer la transition
      const timeout = setTimeout(() => {
        setShowPaymentSuccess(false);
        // Nettoyer l'URL
        router.replace('/account', { scroll: false });
      }, 8000);

      return () => clearTimeout(timeout);
    }
  }, [searchParams, router]);

  // Mettre à jour currentBoats quand les props changent
  useEffect(() => {
    setCurrentBoats(boats);
  }, [boats]);

  // Gérer le loading après paiement réussi
  useEffect(() => {
    // Si on a des données (boats), arrêter le loading global
    if (boats && userDetails) {
      stopLoading();
    }
  }, [boats, userDetails, stopLoading]);

  // Vérifier périodiquement les changements de statut quand il y a des bateaux en pending ou après un paiement
  useEffect(() => {
    const pendingBoats = currentBoats.filter(
      (b: any) => b?.status === 'pending'
    );

    // Continuer le polling si :
    // 1. Il y a des bateaux en pending, OU
    // 2. On vient d'arriver après un paiement réussi (pour attendre la transition pending -> active)
    const shouldPoll = pendingBoats.length > 0 || showPaymentSuccess;

    if (shouldPoll) {
      console.log('🔄 Starting polling for boat status updates...', {
        pendingCount: pendingBoats.length,
        showPaymentSuccess,
        totalBoats: currentBoats.length
      });

      const interval = setInterval(() => {
        refreshBoatsData();
      }, 3000); // Vérifier toutes les 3 secondes

      return () => {
        console.log('🛑 Stopping polling');
        clearInterval(interval);
      };
    }
  }, [currentBoats, refreshBoatsData, showPaymentSuccess]);

  const pendingBoats = currentBoats.filter((b: any) => b?.status === 'pending');
  const activeBoats = currentBoats.filter((b: any) => b?.status === 'active');
  const pendingBoatsCount = pendingBoats.length;
  const hasPendingBoats = pendingBoatsCount > 0;

  const handleSignOut = async () => {
    try {
      await withLoading(async () => {
        await signOut();
        // Force a full page refresh to update all components
        window.location.href = '/signin';
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Attendre que les données soient chargées avant d'afficher
  if (!userDetails || !boats) {
    return (
      <section className="mx-auto max-w-screen-xl rounded-16 mb-[120px] h-fit flex flex-row gap-48 justify-between items-start">
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-articblue mx-auto mb-4"></div>
            <p className="text-oceanblue">Loading your account...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-screen-xl rounded-16 mb-[120px] h-fit flex flex-row gap-48 justify-between items-start">
      {isLoading ? (
        <>
          <Skeleton
            className="w-[200px] h-[600px] rounded-[24px] bg-gray-200"
            isLoaded={false}
          />
          <Skeleton
            className="flex-1 h-[600px] rounded-[24px] bg-gray-200"
            isLoaded={false}
          />
        </>
      ) : (
        <>
          {/* Contenu de droite qui peut avoir n'importe quelle hauteur */}
          <div className="w-full rounded-[24px] flex flex-col gap-48 ">
            <>
              <h1 className=" text-56 text-articblue">My ads</h1>

              {/* Status message banner */}
              {statusMessage && (
                <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-md mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">✅</div>
                    <div>
                      <div className="font-medium">{statusMessage.title}</div>
                      <div className="text-sm">{statusMessage.description}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pending banner */}
              {hasPendingBoats && (
                <div className="bg-articblue/10 border border-articblue/30 text-articblue px-4 py-3 rounded-md mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full border-2 border-articblue border-t-transparent animate-spin" />
                    <div className="text-sm">
                      Payment is being confirmed…{' '}
                      <span className="font-medium">
                        {pendingBoatsCount} pending ad(s)
                      </span>{' '}
                      will appear here automatically.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="text-sm px-3 py-2 rounded-md bg-articblue text-white hover:bg-articblue/90 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              )}

              {activeBoats.length === 0 && pendingBoats.length === 0 ? (
                <div className="flex flex-col gap-[20px] w-full items-center justify-center">
                  <p className="text-oceanblue text-18 text-center">
                    Vous n'avez pas encore d'annonces.{' '}
                    <Link
                      href="/list-boat"
                      className="text-articblue font-medium hover:underline"
                    >
                      Commencez dès maintenant !
                    </Link>
                  </p>
                  <Button
                    text="Place an ad"
                    href="/list-boat"
                    icon="add"
                    bgColor="bg-articblue"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {pendingBoats.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <div className="text-oceanblue font-medium">
                        Pending ads
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {pendingBoats.map((boat: any) => (
                          <div
                            key={boat.id}
                            className="rounded-xl border border-articblue/30 bg-articblue/5 p-4 flex items-center justify-between gap-4"
                          >
                            <div className="flex flex-col">
                              <div className="text-articblue font-semibold">
                                {getModelLabel(boat.model)}
                              </div>
                              <div className="text-sm text-oceanblue">
                                This ad is pending confirmation and will become
                                clickable once active.
                              </div>
                            </div>
                            <div className="h-4 w-4 rounded-full border-2 border-articblue border-t-transparent animate-spin" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeBoats.length > 0 && (
                    <SpotlightBoats
                      accountTable
                      userId={userDetails.id}
                      boats={activeBoats}
                      products={products}
                      isLoading={isLoading}
                    />
                  )}

                  {/* Indicateur de paiement réussi en bas */}
                  {showPaymentSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
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
                        <div>
                          <h3 className="text-green-800 font-medium">
                            🎉 Payment Successful!
                          </h3>
                          <p className="text-green-700 text-sm">
                            Your boat listing is now live and visible to all
                            users.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <h1 className="text-40 text-articblue">My details</h1>
              <div className="flex flex-row gap-48">
                <div className="flex flex-col w-full">
                  <h3 className="text-20 text-articblue font-medium mb-4">
                    Change personal informations
                  </h3>
                  <div className="flex flex-col gap-4 w-full">
                    <EmailForm userEmail={userDetails.email} />
                    <NameForm userName={userDetails.full_name} />
                  </div>
                </div>
                <div className="max-h-full w-[1px] bg-darkgrey/30"></div>
                <div className="flex flex-col w-full">
                  <h3 className="text-20 text-articblue font-medium mb-4">
                    Change Password
                  </h3>
                  <PasswordForm />
                </div>
              </div>

              {/* Section des achats */}
              <h1 className="text-40 text-articblue">My purchases</h1>

              {payments && payments.length > 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-articblue to-oceanblue border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-fullwhite uppercase tracking-wider">
                            Boat
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-fullwhite uppercase tracking-wider">
                            Plan
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-fullwhite uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-fullwhite uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-fullwhite uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payments.map((payment: any) => (
                          <tr
                            key={payment.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            {/* Boat */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                                  <svg
                                    className="w-5 h-5 text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                    />
                                  </svg>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {getModelLabel(payment.boat_model) ||
                                      'Boat Purchase'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Plan */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-articblue/10 text-articblue">
                                {payment.product_name || 'Standard'}
                              </span>
                            </td>

                            {/* Amount */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">
                                €
                                {parseFloat(payment.amount.toString()).toFixed(
                                  2
                                )}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  payment.status === 'succeeded' ||
                                  payment.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {payment.status === 'succeeded' ||
                                payment.status === 'completed'
                                  ? 'Completed'
                                  : payment.status}
                              </span>
                            </td>

                            {/* Date */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(payment.created_at).toLocaleDateString(
                                'en-US',
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                }
                              )}
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Footer */}
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{payments.length}</span>{' '}
                        purchase{payments.length > 1 ? 's' : ''} total
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Total spent</div>
                        <div className="text-xl font-bold text-articblue">
                          €
                          {payments
                            .reduce(
                              (total, payment) =>
                                total + parseFloat(payment.amount.toString()),
                              0
                            )
                            .toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No purchases yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your purchase history will appear here once you make a
                    payment.
                  </p>
                </div>
              )}
            </>

            <div className="w-full h-[1px] bg-darkgrey/20" />
            <button
              type="button"
              onClick={handleSignOut}
              className="text-left text-danger px-4 py-2 rounded-full border border-danger w-fit hover:bg-danger/5 transition-all duration-300"
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </section>
  );
}
