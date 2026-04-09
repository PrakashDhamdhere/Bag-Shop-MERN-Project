import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { addToCart, getShopProducts, removeFromCart } from '../services/shop.api'
import { useFlash } from '../../flash/hooks/useFlash'
import ShopSidebar from '../components/ShopSidebar'

const Shop = () => {
  const navigate = useNavigate()
  const { handleGetMe } = useAuth()
  const { showFlash } = useFlash()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sortBy, setSortBy] = useState('popular')
  const [filterBy, setFilterBy] = useState('all')
  const [cartQtyByProduct, setCartQtyByProduct] = useState({})
  const [updatingProductId, setUpdatingProductId] = useState("")

  const buildQuantityMap = (cartItems = []) => {
    return cartItems.reduce((acc, productId) => {
      const key = String(productId)
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
  }

  const getEffectivePrice = (product) => {
    const basePrice = Number(product?.price || 0)
    const discountPercent = Number(product?.discount || 0)

    if (!discountPercent || discountPercent <= 0) {
      return Math.floor(basePrice)
    }

    const discounted = basePrice - (basePrice * discountPercent) / 100
    return Math.max(0, Math.floor(discounted))
  }

  useEffect(() => {
    const init = async () => {
      try {
        const meResponse = await handleGetMe()
        setCartQtyByProduct(buildQuantityMap(meResponse?.user?.cart || []))
        const response = await getShopProducts()
        setProducts(response.products || [])
      } catch {
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  const onAddToCart = async (product) => {
    const productId = String(product?._id || '')
    if (!productId) return
    const stockValue = Number(product?.stock || 0)
    const currentQty = Number(cartQtyByProduct[productId] || 0)

    if (stockValue <= 0) {
      showFlash('This product is out of stock', 'error')
      return
    }

    if (currentQty >= stockValue) {
      showFlash(`Only ${stockValue} item${stockValue > 1 ? 's are' : ' is'} available in stock`, 'error')
      return
    }

    if (updatingProductId) return
    setError("")
    try {
      setUpdatingProductId(productId)
      const response = await addToCart(productId)
      setCartQtyByProduct((prev) => ({
        ...prev,
        [productId]: (prev[productId] || 0) + 1,
      }))
      showFlash(response.message || 'Product added to cart', 'success')
    } catch (err) {
      const message = err.response?.data?.message || "Could not add product to cart"
      setError(message)
      showFlash(message, 'error')
    } finally {
      setUpdatingProductId("")
    }
  }

  const onDecreaseQty = async (productId) => {
    const currentQty = Number(cartQtyByProduct[productId] || 0)
    if (currentQty <= 0 || updatingProductId) return

    setError("")
    try {
      setUpdatingProductId(productId)
      const response = await removeFromCart(productId)
      setCartQtyByProduct((prev) => {
        const nextQty = Math.max((prev[productId] || 0) - 1, 0)
        if (nextQty === 0) {
          const updated = { ...prev }
          delete updated[productId]
          return updated
        }
        return {
          ...prev,
          [productId]: nextQty,
        }
      })
      showFlash(response.message || 'Product removed from cart', 'success')
    } catch (err) {
      const message = err.response?.data?.message || "Could not remove product from cart"
      setError(message)
      showFlash(message, 'error')
    } finally {
      setUpdatingProductId("")
    }
  }

  const filteredProducts = products.filter((product) => {
    if (filterBy === 'new') {
      return true
    }
    if (filterBy === 'discounted') {
      return Number(product.discount || 0) > 0
    }
    return true
  })

  const newCollectionProducts = [...products]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 4)

  const sortProducts = (items) => {
    return [...items].sort((a, b) => {
      if (sortBy === 'price-low') return Number(a.price) - Number(b.price)
      if (sortBy === 'price-high') return Number(b.price) - Number(a.price)
      return Number(b.salesCount || 0) - Number(a.salesCount || 0)
    })
  }

  const displayedProducts = filterBy === 'new'
    ? sortProducts(newCollectionProducts)
    : sortProducts(filteredProducts)

  const stockAwareProducts = [...displayedProducts].sort((a, b) => {
    const aOutOfStock = Number(a.stock || 0) <= 0
    const bOutOfStock = Number(b.stock || 0) <= 0

    if (aOutOfStock === bOutOfStock) return 0
    return aOutOfStock ? 1 : -1
  })

  if (loading) {
    return <div className='p-6'>Loading shop...</div>
  }

  return (
      <div className='max-w-400 mx-auto px-6 pt-6 pb-0 box-border h-[calc(100vh-81px)] overflow-hidden grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8'>
        <ShopSidebar
          sortBy={sortBy}
          setSortBy={setSortBy}
          filterBy={filterBy}
          setFilterBy={setFilterBy}
        />

        <section className='h-full overflow-y-auto pr-2'>
          {error ? <p className='text-red-600 text-sm mb-4'>{error}</p> : null}

          <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5'>
            {stockAwareProducts.map((product) => {
              const isOutOfStock = Number(product.stock || 0) <= 0
              const stockValue = Number(product.stock || 0)
              const currentQty = Number(cartQtyByProduct[product._id] || 0)
              const isAtStockLimit = currentQty >= stockValue && stockValue > 0

              return (
              <div
                key={product._id}
                className={`rounded-2xl overflow-hidden shadow-sm border border-zinc-200 transition-shadow ${isOutOfStock ? 'opacity-60' : 'hover:shadow-md'}`}
                style={{ backgroundColor: product.bgcolor || '#d4d4d8' }}
                role='button'
                tabIndex={0}
                onClick={() => navigate(`/shop/${product._id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/shop/${product._id}`)
                  }
                }}
              >
                <div className='h-65 p-3 relative'>
                  {Number(product.discount || 0) > 0 ? (
                    <span className='absolute top-2 left-2 text-xs font-semibold bg-zinc-900 text-white px-2 py-1 rounded-full'>
                      {product.discount}% OFF
                    </span>
                  ) : null}
                  {product.image ? (
                    <img
                      src={`data:image/jpeg;base64,${product.image}`}
                      alt={product.name}
                      className='w-full h-full object-contain'
                    />
                  ) : null}
                </div>

                <div
                  className='p-4 flex items-center justify-between gap-2 overflow-hidden'
                  style={{
                    backgroundColor: product.panelcolor || '#52525b',
                    color: product.textcolor || '#f4f4f5',
                  }}
                >
                  <div className='min-w-0 flex-1 pr-2'>
                    <h2 className='text-xl leading-tight truncate'>{product.name}</h2>
                    {Number(product.discount || 0) > 0 ? (
                      <p className='text-xl leading-tight truncate whitespace-nowrap overflow-hidden'>
                        Rs {getEffectivePrice(product)}
                        <span className='line-through text-sm ml-2 opacity-75 align-middle'>Rs {Math.floor(Number(product.price || 0))}</span>
                      </p>
                    ) : (
                      <p className='text-xl leading-tight truncate whitespace-nowrap overflow-hidden'>Rs {Math.floor(Number(product.price || 0))}</p>
                    )}
                  </div>

                  {isOutOfStock ? (
                    <span className='px-3 py-2 rounded-full bg-zinc-200 text-zinc-700 text-xs font-semibold shrink-0'>
                      Out of stock
                    </span>
                  ) : (cartQtyByProduct[product._id] || 0) > 0 ? (
                    <div className='flex items-center bg-white text-zinc-700 rounded-full overflow-hidden shrink-0'>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDecreaseQty(product._id)
                        }}
                        disabled={updatingProductId === product._id}
                        className='h-10 w-10 text-2xl leading-none cursor-pointer disabled:opacity-50'
                      >
                        -
                      </button>
                      <span className='w-8 text-center font-semibold'>
                        {cartQtyByProduct[product._id] || 0}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onAddToCart(product)
                        }}
                        disabled={updatingProductId === product._id || isAtStockLimit}
                        className='h-10 w-10 text-2xl leading-none cursor-pointer disabled:opacity-50'
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onAddToCart(product)
                      }}
                      disabled={updatingProductId === product._id || isAtStockLimit}
                      className='h-10 w-10 rounded-full bg-white text-zinc-700 text-2xl leading-none cursor-pointer shrink-0 disabled:opacity-50'
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
              )
            })}
          </div>
        </section>
    </div>
  )
}

export default Shop