import React from 'react'
import AppRoutes from './app.routes'
import AuthProvider from './features/auth/auth.context'
import FlashProvider from './features/flash/flash.context'

const App = () => {
  return (
    <FlashProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </FlashProvider>
    
  )
}

export default App