import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAdminOrders, ownerLogout, updateOrderStatus } from '../services/owner.api';
import OwnerSidebar from '../components/OwnerSidebar';
import OwnerHeader from '../components/OwnerHeader';

const ORDER_STATUS_OPTIONS = [
  'confirmed',
  'ready_to_dispatch',
  'on_the_way',
  'delivered',
  'cancelled',
];

const statusPillClass = {
  confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
  ready_to_dispatch: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  on_the_way: 'bg-amber-100 text-amber-800 border border-amber-200',
  delivered: 'bg-green-100 text-green-800 border border-green-200',
  cancelled: 'bg-red-100 text-red-800 border border-red-200',
};

const statusCardClass = {
  confirmed: 'border-l-4 border-l-blue-500',
  ready_to_dispatch: 'border-l-4 border-l-indigo-500',
  on_the_way: 'border-l-4 border-l-amber-500',
  delivered: 'border-l-4 border-l-green-500',
  cancelled: 'border-l-4 border-l-red-500',
};

const statusSelectClass = {
  confirmed: 'border-blue-300 bg-blue-50/40 text-blue-900',
  ready_to_dispatch: 'border-indigo-300 bg-indigo-50/40 text-indigo-900',
  on_the_way: 'border-amber-300 bg-amber-50/40 text-amber-900',
  delivered: 'border-green-300 bg-green-50/40 text-green-900',
  cancelled: 'border-red-300 bg-red-50/40 text-red-900',
};


function humanize(value) {
  if (!value) return '-';
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const OwnerOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDeliveredView = location.pathname === '/owners/orders/delivered';
  const isCancelledView = location.pathname === '/owners/orders/cancelled';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState('');

  const loadOrders = async () => {
    const response = await getAdminOrders();
    setOrders(response.orders || []);
  };

  const onLogout = async () => {
    await ownerLogout();
    navigate('/owners/login');
  };

  const visibleOrders = orders.filter((order) => {
    if (isDeliveredView) {
      return order.orderStatus === 'delivered';
    }
    if (isCancelledView) {
      return order.orderStatus === 'cancelled';
    }
    return order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled';
  });

  useEffect(() => {
    const init = async () => {
      try {
        await loadOrders();
      } catch {
        navigate('/owners/login');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const onOrderStatusChange = async (orderId, nextStatus) => {
    if (updatingOrderId) return;
    setError('');

    try {
      setUpdatingOrderId(orderId);
      const response = await updateOrderStatus(orderId, { orderStatus: nextStatus });
      setOrders((prev) => prev.map((order) => (order._id === orderId ? response.order : order)));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update order status');
    } finally {
      setUpdatingOrderId('');
    }
  };

  if (loading) {
    return <div className='p-6'>Loading orders...</div>;
  }

  return (
    <div className='min-h-screen bg-zinc-100 text-zinc-800'>
      <OwnerHeader onLogout={onLogout} />

      <div className='max-w-400 mx-auto px-6 py-8 box-border min-h-[calc(100vh-81px)] grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start'>
        <OwnerSidebar />

        <section>
        <h1 className='text-3xl font-semibold mb-2'>
          {isDeliveredView ? 'Delivered Orders' : isCancelledView ? 'Cancelled Orders' : 'Orders'}
        </h1>
        <p className='text-zinc-600 mb-6'>
          {isDeliveredView
            ? 'Delivered orders are listed here separately.'
            : isCancelledView
              ? 'Cancelled orders are listed here separately.'
              : 'Manage active order statuses from here.'}
        </p>

        <div className='flex flex-wrap items-center gap-2 mb-5'>
          <button
            onClick={() => navigate('/owners/orders')}
            className={`px-3 py-2 rounded-md cursor-pointer ${!isDeliveredView && !isCancelledView ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-800'}`}
          >
            Orders ({orders.filter((order) => order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled').length})
          </button>
          <button
            onClick={() => navigate('/owners/orders/delivered')}
            className={`px-3 py-2 rounded-md cursor-pointer ${isDeliveredView ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-800'}`}
          >
            Delivered Orders ({orders.filter((order) => order.orderStatus === 'delivered').length})
          </button>
          <button
            onClick={() => navigate('/owners/orders/cancelled')}
            className={`px-3 py-2 rounded-md cursor-pointer ${isCancelledView ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-800'}`}
          >
            Cancelled Orders ({orders.filter((order) => order.orderStatus === 'cancelled').length})
          </button>
        </div>
        {error ? <p className='text-red-600 text-sm mb-4'>{error}</p> : null}

        {!visibleOrders.length ? (
          <div className='bg-white border border-zinc-200 rounded-xl p-10 text-center'>
            <p className='text-xl font-medium'>
              {isDeliveredView ? 'No delivered orders yet' : isCancelledView ? 'No cancelled orders yet' : 'No active orders yet'}
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            {visibleOrders.map((order) => {
              const createdDate = order.createdAt ? new Date(order.createdAt).toLocaleString() : '-';
              const isCancelledOrder = order.orderStatus === 'cancelled';
              const isDeliveredOrder = order.orderStatus === 'delivered';

              return (
                <div
                  key={order._id}
                  className={`bg-white border border-zinc-200 rounded-xl p-5 ${statusCardClass[order.orderStatus] || ''}`}
                >
                  <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div>
                      <p className='text-sm text-zinc-500'>Order ID</p>
                      <p className='font-semibold'>{order._id}</p>
                      <p className='text-sm text-zinc-600 mt-1'>
                        Customer: {order.userId?.fullname || '-'} ({order.userId?.email || '-'})
                      </p>
                      <p className='text-sm text-zinc-700 mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-100'>
                        <span className='text-xs font-semibold text-blue-700'>Phone</span>
                        <span className='font-medium'>{order.userId?.contact || '-'}</span>
                      </p>
                      <div className='text-sm text-zinc-700 mt-2 px-3 py-2 rounded-md bg-amber-50 border border-amber-100'>
                        <span className='text-xs font-semibold text-amber-700 block mb-1'>Address</span>
                        <p className='leading-relaxed'>
                          {
                            [
                              order.userId?.address,
                              order.userId?.city,
                              order.userId?.state,
                              order.userId?.pincode,
                              order.userId?.country,
                            ]
                              .filter(Boolean)
                              .join(', ') || '-'
                          }
                        </p>
                      </div>
                      <p className='text-xs text-zinc-500 mt-1'>Placed on {createdDate}</p>
                    </div>

                    <div className='flex flex-wrap items-center gap-2'>
                      <span className={`text-xs px-3 py-1.5 rounded-full font-semibold tracking-wide uppercase ${statusPillClass[order.orderStatus] || 'bg-zinc-100 text-zinc-700 border border-zinc-200'}`}>
                        {humanize(order.orderStatus)}
                      </span>
                    </div>
                  </div>

                  <div className='mt-4 border border-zinc-200 rounded-lg overflow-hidden'>
                    {(order.items || []).map((item, index) => (
                      <div
                        key={`${item.productId || item.name || 'item'}-${index}`}
                        className='px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 last:border-b-0'
                      >
                        <div>
                          <p className='font-medium'>{item.name || 'Product'}</p>
                          <p className='text-sm text-zinc-500'>Qty: {item.quantity || 1}</p>
                        </div>
                        <p className='font-semibold'>Rs. {item.subtotal || item.price || 0}</p>
                      </div>
                    ))}
                  </div>

                  <div className='mt-4 grid grid-cols-1 gap-3'>
                    <label className='text-sm text-zinc-700'>
                      Order Status
                      <select
                        value={order.orderStatus || 'confirmed'}
                        onChange={(e) => onOrderStatusChange(order._id, e.target.value)}
                        disabled={updatingOrderId === order._id || isCancelledOrder || isDeliveredOrder}
                        className={`mt-1 w-full px-3 py-2 border rounded-md disabled:opacity-60 ${statusSelectClass[order.orderStatus] || 'border-zinc-300 bg-white text-zinc-900'}`}
                      >
                        {ORDER_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {humanize(status)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className='mt-4 flex justify-between items-center'>
                    <p className='text-sm text-zinc-500'>
                      Total Amount
                      {isCancelledOrder ? ' (Locked: cancelled by user)' : ''}
                    </p>
                    <p className='text-lg font-semibold'>Rs. {order.totalAmount || 0}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </section>
      </div>
    </div>
  );
};

export default OwnerOrders;
