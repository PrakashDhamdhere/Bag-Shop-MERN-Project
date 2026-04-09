import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { useFlash } from '../../flash/hooks/useFlash'
import { createOrder } from '../../order/services/order.api'
import { addToCart, getShopProductById } from '../services/shop.api'

const ProductDetails = () => {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { user, handleGetMe } = useAuth()
  const { showFlash } = useFlash()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [buyingNow, setBuyingNow] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  const stockValue = Number(product?.stock || 0)
  const isOutOfStock = stockValue <= 0

  const getEffectivePrice = (item) => {
    const basePrice = Number(item?.price || 0)
    const discountPercent = Number(item?.discount || 0)

    if (!discountPercent || discountPercent <= 0) {
      return Math.floor(basePrice)
    }

    const discounted = basePrice - (basePrice * discountPercent) / 100
    return Math.max(0, Math.floor(discounted))
  }

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true)
        const response = await getShopProductById(productId)
        setProduct(response.product || null)
      } catch (err) {
        const message = err.response?.data?.message || 'Could not load product details'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [productId])

  const handleAddToCart = async () => {
    if (!product || adding || buyingNow) return
    if (isOutOfStock) {
      showFlash('This product is out of stock', 'error')
      return
    }

    try {
      setAdding(true)
      const safeQuantity = Math.min(Math.max(1, Number(quantity || 1)), stockValue)
      for (let i = 0; i < safeQuantity; i += 1) {
        await addToCart(product._id)
      }
      showFlash(`${safeQuantity} item${safeQuantity > 1 ? 's' : ''} added to cart`, 'success')
      navigate('/cart')
    } catch (err) {
      const message = err.response?.data?.message || 'Could not add product to cart'
      setError(message)
      showFlash(message, 'error')
    } finally {
      setAdding(false)
    }
  }

  const handleBuyNow = async () => {
    if (!product || adding || buyingNow) return
    if (isOutOfStock) {
      showFlash('This product is out of stock', 'error')
      return
    }

    let currentUser = user
    try {
      if (!currentUser) {
        const meResponse = await handleGetMe()
        currentUser = meResponse?.user || null
      }
    } catch {
      navigate('/')
      return
    }

    const phoneValue = String(currentUser?.contact || '').trim()
    const addressValue = String(currentUser?.address || '').trim()

    if (!phoneValue || !addressValue) {
      showFlash('Please add your address and phone number in My Account before checkout', 'error', 3500)
      navigate('/my-account')
      return
    }

    setIsCheckoutOpen(true)
  }

  const placeDirectOrderWithCOD = async () => {
    if (!product || adding || buyingNow) return
    if (isOutOfStock) {
      showFlash('This product is out of stock', 'error')
      return
    }

    try {
      setBuyingNow(true)
      let currentUser = user
      if (!currentUser) {
        const meResponse = await handleGetMe()
        currentUser = meResponse?.user || null
      }

      const phoneValue = String(currentUser?.contact || '').trim()
      const addressValue = String(currentUser?.address || '').trim()

      if (!phoneValue || !addressValue) {
        showFlash('Please add your address and phone number in My Account before checkout', 'error', 3500)
        navigate('/my-account')
        return
      }

      const unitPrice = getEffectivePrice(product)
      const safeQuantity = Math.min(Math.max(1, Number(quantity || 1)), stockValue)
      const subtotal = unitPrice * safeQuantity

      const orderPayload = {
        items: [
          {
            productId: product._id,
            name: product.name,
            price: unitPrice,
            quantity: safeQuantity,
            subtotal,
          },
        ],
        totalAmount: subtotal,
        paymentId: `COD-${Date.now()}`,
        paymentStatus: 'cod_pending',
        orderStatus: 'confirmed',
      }

      await createOrder(orderPayload)
      setIsCheckoutOpen(false)
      showFlash('Order placed successfully', 'success', 3000)
      await handleGetMe()
      navigate('/my-orders')
    } catch (err) {
      const message = err.response?.data?.message || 'Could not process Buy Now'
      setError(message)
      showFlash(message, 'error')
    } finally {
      setBuyingNow(false)
    }
  }

  if (loading) {
    return <div className='p-6'>Loading product details...</div>
  }

  if (!product) {
    return (
      <div className='max-w-5xl mx-auto px-6 py-8'>
        <p className='text-red-600'>{error || 'Product not found'}</p>
        <button
          type='button'
          onClick={() => navigate('/shop')}
          className='mt-4 px-4 py-2 rounded-md bg-zinc-900 text-white cursor-pointer'
        >
          Back to Shop
        </button>
      </div>
    )
  }

  return (
    <div className='max-w-6xl mx-auto px-6 py-8'>
      {error ? <p className='text-red-600 text-sm mb-3'>{error}</p> : null}

      <button
        type='button'
        onClick={() => navigate(-1)}
        className='fixed top-24 left-6 z-20 inline-flex items-center justify-center px-4 py-2 rounded-md bg-zinc-900 text-white cursor-pointer'
      >
        Back
      </button>

      <div className='bg-white border border-zinc-200 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2'>
        <div className='p-6' style={{ backgroundColor: product.bgcolor || '#e4e4e7' }}>
          {product.image ? (
            <img
              src={`data:image/jpeg;base64,${product.image}`}
              alt={product.name}
              className='w-full h-full max-h-120 object-contain'
            />
          ) : null}
        </div>

        <div className='p-6 lg:p-8'>
          <h1 className='text-3xl font-semibold leading-tight'>{product.name}</h1>

          <div className='mt-3'>
            {Number(product.discount || 0) > 0 ? (
              <p className='text-2xl font-semibold'>
                Rs. {getEffectivePrice(product)}
                <span className='line-through text-base text-zinc-500 ml-2'>Rs. {Math.floor(Number(product.price || 0))}</span>
                <span className='ml-2 text-sm px-2 py-1 rounded-full bg-zinc-900 text-white'>
                  {Number(product.discount || 0)}% OFF
                </span>
              </p>
            ) : (
              <p className='text-2xl font-semibold'>Rs. {Math.floor(Number(product.price || 0))}</p>
            )}
          </div>

          <div className='mt-4 space-y-2 text-sm text-zinc-700'>
            <p><span className='font-medium'>Category:</span> {product.category || 'general'}</p>
            <p>
              <span className='font-medium'>Stock:</span>{' '}
              {isOutOfStock ? (
                <span className='text-red-600 font-semibold'>Out of stock</span>
              ) : (
                `${stockValue} available`
              )}
            </p>
          </div>

          <div className='mt-5'>
            <h2 className='text-lg font-semibold mb-2'>Description</h2>
            <p className='text-zinc-700 leading-relaxed'>
              {product.description || 'No description available for this product yet.'}
            </p>
          </div>

          <div className='mt-6'>
            <p className='text-sm font-medium text-zinc-700 mb-2'>Quantity</p>
            <div className='inline-flex items-center bg-zinc-100 rounded-full overflow-hidden'>
              <button
                type='button'
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                disabled={adding || buyingNow}
                className='h-10 w-10 text-2xl leading-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              >
                -
              </button>
              <span className='w-10 text-center font-semibold'>{quantity}</span>
              <button
                type='button'
                onClick={() => setQuantity((prev) => {
                  if (stockValue > 0) {
                    return Math.min(stockValue, prev + 1)
                  }
                  return prev
                })}
                disabled={adding || buyingNow || isOutOfStock}
                className='h-10 w-10 text-2xl leading-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              >
                +
              </button>
            </div>
          </div>

          <div className='mt-7 flex flex-wrap gap-3'>
            <button
              type='button'
              onClick={handleAddToCart}
              disabled={adding || buyingNow || isOutOfStock}
              className='px-5 py-3 rounded-md bg-zinc-900 text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
            >
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
            <button
              type='button'
              onClick={handleBuyNow}
              disabled={adding || buyingNow || isOutOfStock}
              className='px-5 py-3 rounded-md bg-amber-600 text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
            >
              {buyingNow ? 'Processing...' : 'Buy Now'}
            </button>
          </div>
        </div>
      </div>

      {isCheckoutOpen ? (
        <div className='fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4'>
          <div className='w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6'>
            <h3 className='text-xl font-semibold'>Place Your Order</h3>
            <p className='text-zinc-600 mt-1 text-sm'>
              Choose your payment method. Online payment will be available soon.
            </p>

            <div className='mt-5 space-y-3'>
              <label className='flex items-center justify-between border border-zinc-200 rounded-lg p-3 opacity-60 cursor-not-allowed'>
                <div className='flex items-center gap-3'>
                  <input type='radio' disabled name='payment-mode' />
                  <span>Online Payment</span>
                </div>
                <span className='text-xs px-2 py-1 rounded bg-amber-100 text-amber-700'>Coming Soon</span>
              </label>

              <label className='flex items-center justify-between border border-zinc-300 rounded-lg p-3 bg-zinc-50'>
                <div className='flex items-center gap-3'>
                  <input type='radio' name='payment-mode' checked readOnly />
                  <span className='font-medium'>Cash on Delivery</span>
                </div>
                <span className='text-xs px-2 py-1 rounded bg-green-100 text-green-700'>Selected</span>
              </label>
            </div>

            <div className='mt-5 text-sm text-zinc-600'>
              <p>Delivery To: {user?.address || '-'}</p>
              <p>Phone: {user?.contact || '-'}</p>
              <p className='mt-2'>Quantity: {Math.min(Math.max(1, Number(quantity || 1)), Math.max(1, stockValue || 1))}</p>
              <p className='font-semibold text-zinc-800 mt-2'>
                Total: Rs. {getEffectivePrice(product) * Math.min(Math.max(1, Number(quantity || 1)), Math.max(1, stockValue || 1))}
              </p>
            </div>

            <div className='mt-6 flex items-center justify-end gap-3'>
              <button
                type='button'
                onClick={() => setIsCheckoutOpen(false)}
                disabled={buyingNow}
                className='px-4 py-2 rounded-md bg-zinc-200 text-zinc-800 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={placeDirectOrderWithCOD}
                disabled={buyingNow || isOutOfStock}
                className='px-4 py-2 rounded-md bg-zinc-900 text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed'
              >
                {buyingNow ? 'Placing Order...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default ProductDetails
