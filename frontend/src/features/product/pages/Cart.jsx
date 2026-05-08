import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { addToCart, getCart, removeFromCart } from "../services/shop.api";
import { useFlash } from "../../flash/hooks/useFlash";
import { createOrder, createPaymentOrder, verifyPayment } from "../../order/services/order.api";

const Cart = () => {
  const navigate = useNavigate();
  const { user, handleGetMe } = useAuth();
  const { showFlash } = useFlash();

  const [cartItems, setCartItems] = useState([]);
  const [totalMRP, setTotalMRP] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingProductId, setUpdatingProductId] = useState("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("online");

  const loadCart = async () => {
    const response = await getCart();
    setCartItems(response.user?.cart || []);
    setTotalMRP(response.totalMRP || 0);
  };

  useEffect(() => {
    const init = async () => {
      try {
        await handleGetMe();
        await loadCart();
      } catch {
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const groupedCartItems = useMemo(() => {
    const map = new Map();

    cartItems.forEach((item) => {
      const existing = map.get(item._id);
      if (existing) {
        existing.qty += 1;
      } else {
        map.set(item._id, {
          ...item,
          qty: 1,
        });
      }
    });

    return Array.from(map.values());
  }, [cartItems]);

  const getEffectivePrice = (item) => {
    const basePrice = Number(item?.price || 0);
    const discountPercent = Number(item?.discount || 0);

    if (!discountPercent || discountPercent <= 0) {
      return Math.floor(basePrice);
    }

    const discounted = basePrice - (basePrice * discountPercent) / 100;
    return Math.max(0, Math.floor(discounted));
  };

  const onIncreaseQty = async (productId) => {
    if (updatingProductId) return;

    setError("");
    try {
      setUpdatingProductId(productId);
      const response = await addToCart(productId);
      await loadCart();
      showFlash(response.message || "Product added to cart", "success");
    } catch (err) {
      const message = err.response?.data?.message || "Could not increase quantity";
      setError(message);
      showFlash(message, "error");
    } finally {
      setUpdatingProductId("");
    }
  };

  const onDecreaseQty = async (productId) => {
    if (updatingProductId) return;

    setError("");
    try {
      setUpdatingProductId(productId);
      const response = await removeFromCart(productId);
      await loadCart();
      showFlash(response.message || "Product removed from cart", "success");
    } catch (err) {
      const message = err.response?.data?.message || "Could not remove item from cart";
      setError(message);
      showFlash(message, "error");
    } finally {
      setUpdatingProductId("");
    }
  };

  const hasRequiredProfileInfo = () => {
    const phoneValue = String(user?.contact || "").trim();
    const addressValue = String(user?.address || "").trim();
    return phoneValue.length > 0 && addressValue.length > 0;
  };

  const openCheckout = () => {
    if (!hasRequiredProfileInfo()) {
      showFlash("Please add your address and phone number in My Account before checkout", "error", 3500);
      navigate('/my-account');
      return;
    }

    setIsCheckoutOpen(true);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const placeOrderWithRazorpay = async () => {
    if (placingOrder) return;

    try {
      setPlacingOrder(true);
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay script');
      }

      // Create payment order on backend
      const paymentOrderResponse = await createPaymentOrder(totalMRP, 'INR');
      const { order, key } = paymentOrderResponse;

      const options = {
        key: key,
        amount: order.amount, // Already in paise from backend
        currency: order.currency,
        order_id: order.id,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            if (verifyResponse.verified) {
              // Create order in database with verified payment
              const orderItems = groupedCartItems.map((item) => {
                const effectivePrice = getEffectivePrice(item);
                return {
                  productId: item._id,
                  name: item.name,
                  price: effectivePrice,
                  quantity: Number(item.qty || 0),
                  subtotal: effectivePrice * Number(item.qty || 0),
                };
              });

              const orderPayload = {
                items: orderItems,
                totalAmount: Number(totalMRP || 0),
                paymentId: response.razorpay_payment_id,
                paymentStatus: 'paid',
                orderStatus: 'confirmed',
              };

              const createOrderResponse = await createOrder(orderPayload);

              // Remove items from cart
              for (const item of cartItems) {
                await removeFromCart(item._id);
              }

              await loadCart();
              setIsCheckoutOpen(false);
              setPaymentMethod('online');
              showFlash(createOrderResponse.message || 'Order placed successfully with online payment', 'success', 3000);
            } else {
              throw new Error(verifyResponse.message || 'Payment verification failed');
            }
          } catch (err) {
            const message = err.message || 'Error processing payment';
            setError(message);
            showFlash(message, 'error', 3500);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.contact || '',
        },
        theme: {
          color: '#18181b',
        },
        modal: {
          ondismiss: function () {
            setPlacingOrder(false);
            showFlash('Payment cancelled', 'info', 2000);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      const message = err.message || 'Could not initiate payment';
      setError(message);
      showFlash(message, 'error', 3500);
      setPlacingOrder(false);
    }
  };

  const placeOrderWithCOD = async () => {
    if (placingOrder) return;

    try {
      setPlacingOrder(true);
      const orderItems = groupedCartItems.map((item) => {
        const effectivePrice = getEffectivePrice(item);

        return {
          productId: item._id,
          name: item.name,
          price: effectivePrice,
          quantity: Number(item.qty || 0),
          subtotal: effectivePrice * Number(item.qty || 0),
        };
      });

      const orderPayload = {
        items: orderItems,
        totalAmount: Number(totalMRP || 0),
        paymentId: `COD-${Date.now()}`,
        paymentStatus: 'cod_pending',
        orderStatus: 'confirmed',
      };

      const response = await createOrder(orderPayload);

      for (const item of cartItems) {
        // remove one-by-one because backend remove API decreases quantity by one item.
        await removeFromCart(item._id);
      }

      await loadCart();
      setIsCheckoutOpen(false);
      setPaymentMethod('online');
      showFlash(response.message || 'Order placed successfully', 'success', 3000);
    } catch (err) {
      const message = err.response?.data?.message || 'Could not place order';
      setError(message);
      showFlash(message, 'error', 3500);
    } finally {
      setPlacingOrder(false);
    }
  };

  const handlePlaceOrder = () => {
    if (paymentMethod === 'online') {
      placeOrderWithRazorpay();
    } else {
      placeOrderWithCOD();
    }
  };

  if (loading) {
    return <div className="p-6">Loading cart...</div>;
  }

  if (groupedCartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-semibold mb-6">Your Cart</h1>
        <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center">
          <p className="text-xl font-medium">Your cart is empty</p>
          <p className="text-zinc-600 mt-2">Add some products from the shop to see them here.</p>
          <button
            onClick={() => navigate('/shop')}
            className="mt-6 px-5 py-2 rounded-md bg-zinc-900 text-white cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold mb-4">Your Cart</h1>
      {error ? <p className="text-red-600 text-sm mb-3">{error}</p> : null}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-4">
          {groupedCartItems.map((item) => (
            <div
              key={item._id}
              className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-lg overflow-hidden shrink-0"
                  style={{ backgroundColor: item.bgcolor || '#e4e4e7' }}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/shop/${item._id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/shop/${item._id}`);
                    }
                  }}
                >
                  {item.image ? (
                    <img
                      src={`data:image/jpeg;base64,${item.image}`}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  ) : null}
                </div>
                <div>
                  <h2
                    className="text-lg font-semibold leading-tight cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/shop/${item._id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/shop/${item._id}`);
                      }
                    }}
                  >
                    {item.name}
                  </h2>
                  {Number(item.discount || 0) > 0 ? (
                    <p className="text-zinc-600">
                      Rs. {getEffectivePrice(item)}{" "}
                      <span className="line-through text-zinc-400 text-sm ml-1">Rs. {item.price}</span>
                    </p>
                  ) : (
                    <p className="text-zinc-600">Rs. {item.price}</p>
                  )}
                  <p className="text-sm text-zinc-500 mt-1">Subtotal: Rs. {getEffectivePrice(item) * item.qty}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="flex items-center bg-zinc-100 rounded-full overflow-hidden">
                  <button
                    onClick={() => onDecreaseQty(item._id)}
                    disabled={updatingProductId === item._id}
                    className="h-10 w-10 text-2xl leading-none cursor-pointer disabled:opacity-50"
                    title="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-semibold">{item.qty}</span>
                  <button
                    onClick={() => onIncreaseQty(item._id)}
                    disabled={updatingProductId === item._id}
                    className="h-10 w-10 text-2xl leading-none cursor-pointer disabled:opacity-50"
                    title="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="bg-white border border-zinc-200 rounded-xl p-5 sticky top-24">
          <h3 className="text-lg font-semibold">Price Summary</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Items</span>
              <span>{cartItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total MRP</span>
              <span>Rs. {totalMRP}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{totalMRP > 0 ? "Free" : "Rs. 0"}</span>
            </div>
            <div className="h-px bg-zinc-200 my-2" />
            <div className="flex justify-between font-semibold text-base">
              <span>Grand Total</span>
              <span>Rs. {totalMRP}</span>
            </div>
          </div>

          <button
            onClick={openCheckout}
            className="w-full mt-5 py-2 rounded-md bg-zinc-900 text-white cursor-pointer"
          >
            Proceed to Checkout
          </button>
        </aside>
      </div>

      {isCheckoutOpen ? (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-semibold">Place Your Order</h3>
            <p className="text-zinc-600 mt-1 text-sm">
              Choose your payment method
            </p>

            <div className="mt-5 space-y-3">
              <label className="flex items-center justify-between border border-zinc-300 rounded-lg p-3 hover:bg-zinc-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="payment-mode" 
                    value="online"
                    checked={paymentMethod === "online"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className="font-medium">Online Payment (Razorpay)</span>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">Live</span>
              </label>

              <label className="flex items-center justify-between border border-zinc-300 rounded-lg p-3 bg-zinc-50 hover:bg-zinc-100 cursor-pointer">
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="payment-mode" 
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className="font-medium">Cash on Delivery</span>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">Available</span>
              </label>
            </div>

            <div className="mt-5 text-sm text-zinc-600">
              <p>Delivery To: {user?.address || '-'}</p>
              <p>Phone: {user?.contact || '-'}</p>
              <p className="font-semibold text-zinc-800 mt-2">Total: Rs. {totalMRP}</p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCheckoutOpen(false);
                  setPaymentMethod("online");
                }}
                disabled={placingOrder}
                className="px-4 py-2 rounded-md bg-zinc-200 text-zinc-800 cursor-pointer disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="px-4 py-2 rounded-md bg-zinc-900 text-white cursor-pointer disabled:opacity-60"
              >
                {placingOrder ? (paymentMethod === 'online' ? 'Processing Payment...' : 'Placing Order...') : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Cart;
