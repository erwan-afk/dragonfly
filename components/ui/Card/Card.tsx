import { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export default function Card({ title, description, footer, children }: Props) {
  return (
    <div className="w-full  mt-[12px] mb-[112px] bg-lightgrey px-[60px] py-[80px] m-auto rounded-[24px] ">
      <h3 className=" text-40 text-oceanblue">{title}</h3>
      <p className="text-zinc-300">{description}</p>
      {children}

      {footer && (
        <div className="p-4 border-t rounded-b-md border-zinc-700 bg-zinc-900 text-zinc-500">
          {footer}
        </div>
      )}
    </div>
  );
}
