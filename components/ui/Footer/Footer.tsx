import Link from 'next/link';

import Logo from '@/components/icons/Logo';
import GitHub from '@/components/icons/GitHub';
import Button from '../Button/Button';
import CookieSettingsButton from '../CookieConsent/CookieSettingsButton';

export default function Footer() {
  return (
    <footer
      className="w-full pt-[60px] lg:pt-[96px] bg-darkgrey flex flex-col justify-center items-center gap-[40px] lg:gap-[80px] px-4 sm:px-32 xl:px-0"
      style={{
        backgroundImage: `url('/images/motif_noir.jpg')`,
        backgroundRepeat: 'repeat',
        backgroundSize: '500px'
      }}
    >
      <div
        className="max-w-screen-xl w-full bg-cover bg-center rounded-16"
        style={{ backgroundImage: `url('images/vagues.png')` }}
      >
        <div className=" flex flex-col gap-[24px] lg:gap-[40px] justify-center items-center py-32 lg:py-64 bg-oceanblue/50 rounded-16 backdrop-blur-md px-16 xs:px-16 lg:px-32">
          <h1 className="font-medium text-18 xs:text-24 lg:text-40 leading-[100%] text-center">
            JOIN OUR COMMUNITY
          </h1>
          <div className="w-full lg:w-2/3 text-center text-14 lg:text-16">
            Whether you're looking to sell your trimaran quickly and profitably,
            or searching for your dream trimaran, our community provides the
            tools and connections you need. Sign up today to unlock the full
            potential of our automated marketplace and join a network of
            dedicated trimaran enthusiasts.
          </div>
          <div className="flex flex-row gap-24">
            <Button
              text="Place an ad"
              icon="link"
              bgColor="bg-fullwhite"
              iconColor="text-oceanblue"
              href="/list-boat"
            />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-screen-xl w-full flex flex-col md:flex-row gap-32 lg:gap-40 justify-between px-8 xs:px-16 xl:px-0">
        <div className="flex flex-col gap-24 md:gap-0 md:justify-between">
          <Logo footer />
          <p className="font-light max-w-[530px] text-14 lg:text-16">
            3Hulls. All rights reserved. Content submitted by users is the sole
            responsibility of the respective submitters. All trademarks and
            copyrights mentioned herein are acknowledged as the property of
            their respective owners.
          </p>
        </div>
        <div className="flex flex-row gap-24 sm:gap-40 flex-wrap">
          <div className="flex flex-col gap-16 sm:gap-24">
            <div className="font-medium">Support</div>
            <Link
              href="/contact"
              className="w-fit font-light text-white hover:underline"
            >
              Contact us
            </Link>
            <Link
              href="/privacy"
              className="w-fit font-light text-white hover:underline"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="w-fit font-light text-white hover:underline"
            >
              Terms
            </Link>
            <Link
              href="/policies"
              className="w-fit font-light text-white hover:underline"
            >
              Cookies
            </Link>
            <Link
              href="/legal-notice"
              className="w-fit font-light text-white hover:underline"
            >
              Legal notice
            </Link>
            <Link
              href="/sales-terms"
              className="w-fit font-light text-white hover:underline"
            >
              Sales terms
            </Link>
            <CookieSettingsButton />
          </div>
          <div className="flex flex-col gap-16 sm:gap-24">
            <div className="font-medium">Navigation</div>
            <Link
              href="/"
              className="w-fit font-light text-white hover:underline"
            >
              Home
            </Link>
            <Link
              href="/forsale"
              className="w-fit font-light text-white hover:underline"
            >
              For sale
            </Link>
            <Link
              href="/forum"
              className="w-fit font-light text-white hover:underline"
            >
              Forum
            </Link>
            <Link
              href="/useful-links"
              className="w-fit font-light text-white hover:underline"
            >
              Useful links
            </Link>
          </div>
          <div className="flex flex-col gap-16 sm:gap-24">
            <div className="font-medium">Actions</div>
            <Link
              href="/list-boat"
              className="w-fit font-light text-white hover:underline"
            >
              Place an ad
            </Link>
            <Link
              href="/signin"
              className="w-fit font-light text-white hover:underline"
            >
              Sign Up
            </Link>
            <Link
              href="/signin"
              className="w-fit font-light text-white hover:underline"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-xl w-full border-t-[0.5px] border-stonegrey text-smokygrey flex flex-col sm:flex-row justify-between py-24 lg:py-40 gap-8 px-16 xl:px-0">
        <div className="text-14">All rights reserved by 3Hulls</div>
        <div className="text-14">&copy; 2026 3Hulls</div>
      </div>
    </footer>
  );
}
