import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Products', path: '/owners/admin' },
  { label: 'Orders', path: '/owners/orders' },
  { label: 'Create Product', path: '/owners/create-product' },
  { label: 'Go to Main Website', path: '/shop' },
];

const OwnerSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/owners/admin') {
      return (
        location.pathname === '/owners/admin' ||
        location.pathname.startsWith('/owners/edit-product/') ||
        location.pathname.startsWith('/owners/product/')
      );
    }
    if (path === '/owners/create-product') {
      return location.pathname === '/owners/create-product';
    }
    if (path === '/owners/orders') {
      return (
        location.pathname === '/owners/orders' ||
        location.pathname === '/owners/orders/delivered' ||
        location.pathname === '/owners/orders/cancelled'
      );
    }
    return location.pathname === path;
  };

  return (
    <aside className='bg-white border border-zinc-200 rounded-xl p-4 min-h-[calc(100vh-140px)] lg:sticky lg:top-24'>
      <p className='text-sm font-semibold text-zinc-700 mb-3'>Admin Menu</p>
      <div className='space-y-2'>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full text-left px-3 py-2 rounded-md cursor-pointer transition-colors ${
              isActive(item.path)
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </aside>
  );
};

export default OwnerSidebar;
