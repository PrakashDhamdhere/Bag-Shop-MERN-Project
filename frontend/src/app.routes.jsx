import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Shop from './features/product/pages/Shop'
import RegisterAndLogin from './features/auth/pages/RegisterAndLogin'
import Cart from './features/product/pages/Cart'
import ProductDetails from './features/product/pages/ProductDetails'
import MyAccount from './features/auth/pages/MyAccount'
import MyOrders from './features/order/pages/MyOrders'
import OwnerLogin from './features/owner/pages/OwnerLogin'
import OwnerAdmin from './features/owner/pages/OwnerAdmin'
import OwnerOrders from './features/owner/pages/OwnerOrders'
import CreateProduct from './features/owner/pages/CreateProduct'
import EditProduct from './features/owner/pages/EditProduct'
import OwnerProductDetails from './features/owner/pages/OwnerProductDetails'
import UserLayout from './layouts/UserLayout'

const AppRoutes = () => {
  return (
    <BrowserRouter>
        <Routes>
            <Route path='/' element={<RegisterAndLogin />} />
            <Route element={<UserLayout />}>
              <Route path='/shop' element={<Shop />} />
              <Route path='/shop/:productId' element={<ProductDetails />} />
              <Route path='/cart' element={<Cart />} />
              <Route path='/my-account' element={<MyAccount />} />
              <Route path='/my-orders' element={<MyOrders />} />
            </Route>
            <Route path='/owners/login' element={<OwnerLogin />} />
            <Route path='/owners/admin' element={<OwnerAdmin />} />
            <Route path='/owners/orders' element={<OwnerOrders />} />
            <Route path='/owners/orders/delivered' element={<OwnerOrders />} />
            <Route path='/owners/orders/cancelled' element={<OwnerOrders />} />
            <Route path='/owners/create-product' element={<CreateProduct />} />
            <Route path='/owners/edit-product/:productId' element={<EditProduct />} />
            <Route path='/owners/product/:productId' element={<OwnerProductDetails />} />
        </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes