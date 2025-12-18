'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import CustomerPortalForm from '@/components/ui/AccountForms/CustomerPortalForm';
import MyListings from '@/components/ui/AccountForms/MyListing';
import { Json, User, Boat } from '@/types/database';
import EmailForm from '../AccountForms/EmailForm';
import NameForm from '../AccountForms/NameForm';
import PasswordForm from '../AccountForms/PasswordForm';
import { Skeleton } from '@heroui/skeleton';

import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import SpotlightBoats from '../SpotlightBoats/SpotlightBoats';
import Button from '../Button/Button';
import { useLoadingBar } from '../LoadingProvider';

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
  isLoading?: boolean;
}

export function AccountClient({
  userDetails,
  boats,
  isLoading = false
}: AccountClientProps) {
  const searchParams = useSearchParams();
  // Avoid UI "flash" (details -> ads) by selecting the initial tab synchronously.
  // Priority: URL (?section=ads|details) > localStorage > default ("details")
  const [activeView, setActiveView] = useState<'details' | 'ads'>(() => {
    const section = searchParams.get('section');
    if (section === 'ads' || section === 'details') return section;
    try {
      const savedTab = localStorage.getItem('activeAccountTab');
      if (savedTab === 'ads' || savedTab === 'details') return savedTab;
    } catch {
      // ignore (SSR / privacy mode)
    }
    return 'details';
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { withLoading } = useLoadingBar();

  // Keep state in sync with URL params (payment redirect) and persist in localStorage
  useEffect(() => {
    const section = searchParams.get('section');
    const payment = searchParams.get('payment');

    if (section === 'ads') {
      setActiveView('ads');

      // Si c'est après un paiement réussi, afficher le message de succès
      if (payment === 'success') {
        setShowSuccessMessage(true);
        console.log('✅ Redirected to My ads section after successful payment');

        // Attendre un peu pour que le webhook ait le temps de traiter
        // puis rafraîchir les données (le cache est désactivé, donc les données seront rechargées)
        setTimeout(() => {
          // Rafraîchir la page sans le paramètre payment pour éviter une boucle
          router.replace('/account?section=ads', { scroll: false });
        }, 2000);
      }

      // Save the active tab to localStorage
      localStorage.setItem('activeAccountTab', 'ads');

      // Hide success message after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);

      return () => clearTimeout(timer);
    } else if (section === 'details') {
      setActiveView('details');
      localStorage.setItem('activeAccountTab', 'details');
    }
  }, [searchParams, router]);

  // Handle tab switching with localStorage persistence
  const handleTabChange = (newTab: 'details' | 'ads') => {
    setActiveView(newTab);
    localStorage.setItem('activeAccountTab', newTab);
    // Persist in URL so a refresh lands on the correct tab immediately.
    router.replace(`/account?section=${newTab}`, { scroll: false });
    console.log(`📝 Tab changed to: ${newTab}`);
  };

  const handleSignOut = async () => {
    try {
      await withLoading(async () => {
        await signOut();
        // Force a full page refresh to update all components
        window.location.href = '/';
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <section className="mx-auto max-w-screen-xl rounded-16 mb-[120px] h-fit mt-10 flex flex-row gap-48 justify-between items-start">
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
          {/* Menu de gauche avec position sticky */}
          <div className="text-oceanblue flex flex-col gap-40 justify-between min-h-full sticky ">
            <div className="flex flex-col gap-16 items-start">
              <h1 className="text-24">My profile</h1>
              <div className="flex flex-col gap-16 flex-1 h-full">
                <div
                  className={`rounded-full ${activeView === 'details' ? 'bg-articblue text-fullwhite' : 'bg-lightgrey text-oceanblue hover:bg-articblue/20'} px-[12px] text-16 py-[10px] cursor-pointer w-fit transition-all duration-300`}
                  onClick={() => handleTabChange('details')}
                >
                  My details
                </div>
                <div
                  className={`rounded-full ${activeView === 'ads' ? 'bg-articblue text-fullwhite' : 'bg-lightgrey text-oceanblue hover:bg-articblue/20'} px-[12px] text-16 py-[10px] cursor-pointer w-fit   transition-all duration-300`}
                  onClick={() => handleTabChange('ads')}
                >
                  My ads
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-left text-danger px-4 py-2 rounded-full border border-danger w-full hover:bg-danger/5 transition-all duration-300"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Contenu de droite qui peut avoir n'importe quelle hauteur */}
          <div className="flex-1 bg-lightgrey rounded-[24px] flex flex-col gap-48 p-[55px]">
            {activeView === 'details' ? (
              <>
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
              </>
            ) : (
              <>
                <h1 className="text-40 text-articblue">My ads</h1>

                {/* Success message after payment */}
                {showSuccessMessage && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
                    <strong className="font-bold">🎉 Success! </strong>
                    <span className="block sm:inline">
                      Your boat listing has been created successfully and is now
                      live!
                    </span>
                    <span
                      className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
                      onClick={() => setShowSuccessMessage(false)}
                    >
                      <svg
                        className="fill-current h-6 w-6 text-green-500"
                        role="button"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                      >
                        <title>Close</title>
                        <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
                      </svg>
                    </span>
                  </div>
                )}

                {boats.length === 0 ? (
                  <div className="flex flex-col gap-[20px]">
                    <p className="text-oceanblue text-18">
                      Vous n'avez pas encore d'annonces.{' '}
                      <span className="text-articblue font-medium">
                        Commencez dès maintenant !
                      </span>
                    </p>
                    <Button
                      text="Place an ad"
                      href="/list-boat"
                      icon="add"
                      bgColor="bg-articblue"
                    />
                  </div>
                ) : (
                  <SpotlightBoats
                    spotlight
                    edit
                    userId={userDetails.id}
                    boats={boats}
                    isLoading={isLoading}
                  />
                )}
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
