import { FC } from 'react';
import Link from "next/link";
import Text from './Text';
import NavElement from './nav-element';
interface Props {
  children: React.ReactNode;
}

export const ContentContainer: React.FC<Props> = ({ children }) => {

  return (
    <div className='drawer'>
      <input id="my-drawer" type="checkbox" className="grow drawer-toggle" />
      <div className='z-50'>
        {children}
      </div>
      {/* SideBar / Drawer */}
      <div className="drawer-side fixed w-screen h-screen z-50">
        <label htmlFor="my-drawer" className="drawer-overlay gap-6"></label>

        <ul className="p-4 overflow-y-auto menu w-80 bg-base-100 gap-10 sm:flex items-center">
          <li>
            <Text variant="heading" className='font-extrabold tracking-tighter text-center text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mt-10'>Menu</Text>
          </li>
          <li>
          <NavElement
            label="Home"
            href="/"
          />
          </li>
          <li>
          <NavElement
            label="Create Escrow"
            href="/create-escrow"
          />
          </li>
        </ul>
      </div>
    </div>
  );
};
