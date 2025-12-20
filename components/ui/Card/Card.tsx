import { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export default function Card({ title, description, footer, children }: Props) {
  return (
    <div className="w-full flex flex-col gap-32 m-auto rounded-[24px] bg-lightgrey p-64">
      <h3 className=" text-40 text-oceanblue">{title}</h3>

      {description && <p className="text-zinc-300">{description}</p>}
      {children}
      {footer && (
        <div className="p-4 border-t rounded-b-md border-zinc-700 bg-zinc-900 text-zinc-500">
          {footer}
        </div>
      )}
    </div>
  );
}
