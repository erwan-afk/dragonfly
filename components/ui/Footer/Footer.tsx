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
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi
            consectetur quis enim ut volutpat. In massa nulla, blandit sit amet
            semper eget, accumsan eget nisl. In facilisis felis nulla.{' '}
          </div>
          <div className="flex flex-row gap-24">
            <Button
              text="Sign Up"
              icon="link"
              bgColor="bg-fullwhite"
              iconColor="text-oceanblue"
              href="/forum"
            />
            <Button
              text="Login in"
              icon="link"
              bgColor="bg-oceanblue"
              iconColor="text-fullwhite"
              href="/forum"
            />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-screen-xl w-full flex flex-row gap-40 justify-between">
        <div className=" flex flex-col justify-between">
          <Logo />
          <p className="font-light max-w-[530px]">
            No responsibility is accepted by the publisher of these web pages
            for contents submitted by other people! All Trademarks and
            Copyrights shown or mentioned on this website are here with
            acknowledged.
          </p>
        </div>
        <div className=" flex flex-row gap-40">
          <div className="flex flex-col gap-24">
            <div className="font-medium">Support</div>
            <Link
              href="#"
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
              href="#"
              className=" w-fit font-light text-white hover:underline"
            >
              Cookies
            </Link>
          </div>
          <div className="flex flex-col gap-24">
            <div className="font-medium">Navigation</div>
            <Link
              href="#"
              className=" w-fit font-light text-white hover:underline"
            >
              Home
            </Link>
            <Link
              href="#"
              className=" w-fit font-light text-white hover:underline"
            >
              For sale
            </Link>
            <Link
              href="#"
              className=" w-fit font-light text-white hover:underline"
            >
              Forum
            </Link>
            <Link
              href="#"
              className=" w-fit font-light text-white hover:underline"
            >
              Usefull links
            </Link>
          </div>
          <div className="flex flex-col gap-24">
            <div className="font-medium">Actions</div>
            <Link
              href="#"
              className=" w-fit font-light text-white hover:underline"
            >
              Place an ad
            </Link>
            <Link
              href="#"
              className=" w-fit font-light text-white hover:underline"
            >
              Sign Up
            </Link>
            <Link
              href="#"
              className=" w-fit font-light text-white hover:underline"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-xl w-full border-t-[0.5px] border-stonegrey text-smokygrey flex flex-row justify-between py-40">
        <div className="text-14 ">
          Provence Online Shopping: Beautiful things direct from Provence
        </div>
        <div className="text-14">© 2025 Dragonfly</div>
      </div>
    </footer>
  );
}
