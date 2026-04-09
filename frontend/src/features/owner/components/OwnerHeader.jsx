import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Products', path: '/owners/admin' },
  { label: 'Orders', path: '/owners/orders' },
  { label: 'Create Product', path: '/owners/create-product' },
];

const OwnerHeader = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/owners/admin') {
      return location.pathname === '/owners/admin' || location.pathname.startsWith('/owners/edit-product/');
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
    <header className='w-full bg-[#1f2937] border-b border-[#111827] shadow-md'>
      <div className='max-w-400 mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-3'>
        <button
          onClick={() => navigate('/owners/admin')}
          className='text-3xl font-semibold italic text-amber-200 cursor-pointer'
        >
          BagShop Admin
        </button>

        <div className='flex items-center gap-3'>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`px-4 py-2 rounded-md cursor-pointer ${
                isActive(item.path) ? 'bg-zinc-900 text-white' : 'bg-zinc-700 text-white'
              }`}
            >
              {item.label}
            </button>
          ))}

          <button
            onClick={onLogout}
            className='px-4 py-2 bg-red-500 text-white rounded-md cursor-pointer'
          >
            Logout Admin
          </button>
        </div>
      </div>
    </header>
  );
};

export default OwnerHeader;
