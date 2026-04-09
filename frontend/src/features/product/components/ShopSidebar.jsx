import React from 'react'

const ShopSidebar = ({ sortBy, setSortBy, filterBy, setFilterBy }) => {
  return (
    <aside className='bg-white/90 backdrop-blur border border-zinc-200 rounded-2xl p-5 space-y-8 lg:sticky lg:top-24'>
      <div>
        <label className='text-xs uppercase tracking-wider text-zinc-500 block mb-2'>Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className='bg-white border border-zinc-300 rounded-lg px-3 py-2 w-full text-sm'
        >
          <option value='popular'>Popular</option>
          <option value='price-low'>Price Low to High</option>
          <option value='price-high'>Price High to Low</option>
        </select>
      </div>

      <div className='space-y-2'>
        <button
          onClick={() => setFilterBy('new')}
          className={`w-full text-left px-3 py-2 rounded-lg text-base cursor-pointer transition-colors ${
            filterBy === 'new'
              ? 'bg-zinc-900 text-white'
              : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
          }`}
        >
          New Collection
        </button>
        <button
          onClick={() => setFilterBy('all')}
          className={`w-full text-left px-3 py-2 rounded-lg text-base cursor-pointer transition-colors ${
            filterBy === 'all'
              ? 'bg-zinc-900 text-white'
              : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
          }`}
        >
          All Products
        </button>
        <button
          onClick={() => setFilterBy('discounted')}
          className={`w-full text-left px-3 py-2 rounded-lg text-base cursor-pointer transition-colors ${
            filterBy === 'discounted'
              ? 'bg-zinc-900 text-white'
              : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
          }`}
        >
          Discounted Products
        </button>
      </div>
    </aside>
  )
}

export default ShopSidebar
