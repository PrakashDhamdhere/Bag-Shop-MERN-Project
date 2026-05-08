import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { cancelMyOrder, getMyOrders } from '../services/order.api';
import { useFlash } from '../../flash/hooks/useFlash';

const statusPillClass = {
  confirmed: 'bg-blue-100 text-blue-700',
  ready_to_dispatch: 'bg-indigo-100 text-indigo-700',
  on_the_way: 'bg-amber-100 text-amber-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const paymentPillClass = {
  cod_pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-sky-100 text-sky-700',
};

function humanizeStatus(value) {
  if (!value) return '-';
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function humanizePaymentStatus(value) {
  if (value === 'cod_pending') return 'Pending';
  return humanizeStatus(value);
}

function getPaymentMethod(order) {
  const paymentId = String(order?.paymentId || '');
  if (paymentId.startsWith('COD-') || order?.paymentStatus === 'cod_pending') {
    return 'Cash on Delivery';
  }
  return 'Online (Razorpay)';
}

function isCashOnDeliveryOrder(order) {
  const paymentId = String(order?.paymentId || '');
  return paymentId.startsWith('COD-') || order?.paymentStatus === 'cod_pending';
}

const MyOrders = () => {
  const navigate = useNavigate();
  const { handleGetMe } = useAuth();
  const { showFlash } = useFlash();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingOrderId, setCancellingOrderId] = useState('');
  const [confirmCancelOrder, setConfirmCancelOrder] = useState(null);

  const cancellableStatuses = ['confirmed', 'ready_to_dispatch'];

  const handleCancelOrder = async (orderId) => {
    if (cancellingOrderId) return;

    try {
      setCancellingOrderId(orderId);
      const response = await cancelMyOrder(orderId);

      setOrders((prev) => prev.map((order) => (
        order._id === orderId ? response.order : order
      )));

      showFlash(response.message || 'Order cancelled successfully', 'success');
      setConfirmCancelOrder(null);
    } catch (err) {
      const message = err.response?.data?.message || 'Could not cancel order';
      showFlash(message, 'error', 3500);
    } finally {
      setCancellingOrderId('');
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await handleGetMe();
        const response = await getMyOrders();
        setOrders(response.orders || []);
      } catch (err) {
        const statusCode = err?.response?.status;
        if (statusCode === 401) {
          navigate('/');
          return;
        }
        setError(err.response?.data?.message || 'Could not load orders');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  if (loading) {
    return <div className='p-6'>Loading orders...</div>;
  }

  if (!orders.length) {
    return (
      <div className='max-w-5xl mx-auto px-6 py-10'>
        <h1 className='text-3xl font-semibold mb-6'>My Orders</h1>
        <div className='bg-white border border-zinc-200 rounded-2xl p-10 text-center'>
          <p className='text-xl font-medium'>No orders yet</p>
          <p className='text-zinc-600 mt-2'>Your placed orders will appear here with live status updates.</p>
          <button
            onClick={() => navigate('/shop')}
            className='mt-6 px-5 py-2 rounded-md bg-zinc-900 text-white cursor-pointer'
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-5xl mx-auto px-6 py-8'>
      <h1 className='text-3xl font-semibold mb-2'>My Orders</h1>
      <p className='text-zinc-600 mb-6'>Track your order status and payment details.</p>
      {error ? <p className='text-red-600 text-sm mb-4'>{error}</p> : null}

      <div className='space-y-4'>
        {orders.map((order) => {
          const createdDate = order.createdAt
            ? new Date(order.createdAt).toLocaleString()
            : '-';

          const isCompleted = ['delivered', 'cancelled'].includes(order.orderStatus);
          const isCodOrder = isCashOnDeliveryOrder(order);

          return (
            <div key={order._id} className={`bg-white border border-zinc-200 rounded-xl p-5 ${isCompleted ? 'opacity-60' : ''}`}>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <div>
                  <p className='text-sm text-zinc-500'>Order ID</p>
                  <p className='font-semibold'>{order._id}</p>
                  <p className='text-xs text-zinc-500 mt-1'>Placed on {createdDate}</p>
                </div>

                <div className='flex flex-wrap items-center gap-2'>
                  <span className={`text-xs px-3 py-1 rounded-full ${statusPillClass[order.orderStatus] || 'bg-zinc-100 text-zinc-700'}`}>
                    {humanizeStatus(order.orderStatus)}
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

              <div className={`mt-4 grid grid-cols-1 ${isCodOrder ? 'sm:grid-cols-1' : 'sm:grid-cols-3'} gap-3 text-sm`}>
                <div className='border border-zinc-200 rounded-md px-3 py-2'>
                  <p className='text-zinc-500'>Payment Method</p>
                  <p className='font-medium'>{getPaymentMethod(order)}</p>
                </div>

                {!isCodOrder ? (
                  <div className='border border-zinc-200 rounded-md px-3 py-2'>
                    <p className='text-zinc-500'>Payment Status</p>
                    <span className={`inline-flex mt-1 text-xs px-2.5 py-1 rounded-full ${paymentPillClass[order.paymentStatus] || 'bg-zinc-100 text-zinc-700'}`}>
                      {humanizePaymentStatus(order.paymentStatus)}
                    </span>
                  </div>
                ) : null}

                {!isCodOrder ? (
                  <div className='border border-zinc-200 rounded-md px-3 py-2'>
                    <p className='text-zinc-500'>Payment ID</p>
                    <p className='font-medium break-all'>{order.paymentId || '-'}</p>
                  </div>
                ) : null}
              </div>

              <div className='mt-4 flex justify-between items-center'>
                <p className='text-sm text-zinc-500'>Total Amount</p>
                <div className='flex items-center gap-3'>
                  {cancellableStatuses.includes(order.orderStatus) ? (
                    <button
                      onClick={() => setConfirmCancelOrder(order)}
                      disabled={cancellingOrderId === order._id}
                      className='px-3 py-1.5 rounded-md bg-red-600 text-white text-sm cursor-pointer disabled:opacity-60'
                    >
                      {cancellingOrderId === order._id ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  ) : null}
                  <p className='text-lg font-semibold'>Rs. {order.totalAmount || 0}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {confirmCancelOrder ? (
        <div className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4'>
          <div className='w-full max-w-md bg-white rounded-xl p-6 shadow-2xl'>
            <h3 className='text-xl font-semibold'>Cancel this order?</h3>
            <p className='text-zinc-600 mt-2'>
              Are you sure you want to cancel order {confirmCancelOrder._id}?
            </p>

            <div className='mt-6 flex items-center justify-end gap-3'>
              <button
                onClick={() => setConfirmCancelOrder(null)}
                disabled={Boolean(cancellingOrderId)}
                className='px-4 py-2 rounded-md bg-zinc-200 text-zinc-800 cursor-pointer disabled:opacity-60'
              >
                No, Keep Order
              </button>
              <button
                onClick={() => handleCancelOrder(confirmCancelOrder._id)}
                disabled={cancellingOrderId === confirmCancelOrder._id}
                className='px-4 py-2 rounded-md bg-red-600 text-white cursor-pointer disabled:opacity-60'
              >
                {cancellingOrderId === confirmCancelOrder._id ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MyOrders;
