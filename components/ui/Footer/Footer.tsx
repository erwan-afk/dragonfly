import Link from 'next/link';

import Logo from '@/components/icons/Logo';
import GitHub from '@/components/icons/GitHub';
import Button from '../Button/Button';

export default function Footer() {
  return (
    <footer className="w-full pt-[96px] bg-darkgrey flex flex-col gap-[80px]">
      <div
        className="mx-auto max-w-screen-xl  bg-cover bg-center rounded-16"
        style={{ backgroundImage: `url('images/vagues.png')` }}
      >
        <div className="flex flex-col gap-[40px] justify-center items-center py-64 bg-oceanblue/50 rounded-16 backdrop-blur-md">
          <h1 className=" font-medium text-40 leading-[100%]">
            JOIN OUR COMMUNITY
          </h1>
          <div className="w-2/3 text-center">
            Whether you're looking to sell your trimaran quickly and profitably,
            or searching for your dream Dragonfly, our community provides the
            tools and connections you need. Sign up today to unlock the full
            potential of our automated marketplace and join a network of
            dedicated Dragonfly enthusiasts.
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
      <div className="mx-auto max-w-screen-xl w-full flex flex-row gap-40 justify-between">
        <div className=" flex flex-col justify-between">
          <Logo footer />
          <p className="font-light max-w-[530px]">
            Dragonfly Trimarans Marketplace. All rights reserved. Content
            submitted by users is the sole responsibility of the respective
            submitters. All trademarks and copyrights mentioned herein are
            acknowledged as the property of their respective owners.
          </p>
        </div>
        <div className=" flex flex-row gap-40">
          <div className="flex flex-col gap-24">
            <div className="font-medium">Support</div>
            <Link
              href="/contact"
              className=" w-fit font-light text-white hover:underline"
            >
              Contact us
            </Link>
            <Link
              href="/privacy"
              className=" w-fit font-light text-white hover:underline"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className=" w-fit font-light text-white hover:underline"
            >
              Terms
            </Link>
            <Link
              href="/policies"
              className=" w-fit font-light text-white hover:underline"
            >
              Cookies
            </Link>
          </div>
          <div className="flex flex-col gap-24">
            <div className="font-medium">Navigation</div>
            <Link
              href="/"
              className=" w-fit font-light text-white hover:underline"
            >
              Home
            </Link>
            <Link
              href="/forsale"
              className=" w-fit font-light text-white hover:underline"
            >
              For sale
            </Link>
            <Link
              href="/forum"
              className=" w-fit font-light text-white hover:underline"
            >
              Forum
            </Link>
            <Link
              href="/useful-links"
              className=" w-fit font-light text-white hover:underline"
            >
              Useful links
            </Link>
          </div>
          <div className="flex flex-col gap-24">
            <div className="font-medium">Actions</div>
            <Link
              href="/list-boat"
              className=" w-fit font-light text-white hover:underline"
            >
              Place an ad
            </Link>
            <Link
              href="/signin"
              className=" w-fit font-light text-white hover:underline"
            >
              Sign Up
            </Link>
            <Link
              href="/signin"
              className=" w-fit font-light text-white hover:underline"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-xl w-full border-t-[0.5px] border-stonegrey text-smokygrey flex flex-row justify-between py-40">
        <div className="text-14 ">
          All rights reserved by Dragonfly Trimarans Marketplace
        </div>
        <div className="text-14">© 2026 Dragonfly</div>
      </div>
    </footer>
  );
}
