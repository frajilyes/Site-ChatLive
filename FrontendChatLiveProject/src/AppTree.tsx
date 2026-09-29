import { StrictMode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { AuthProvider } from './context/AuthProvider'
import { SiteProvider } from './context/SiteProvider'

export function tree() {
  return (
    <StrictMode>
      <BrowserRouter>
        <SiteProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SiteProvider>
      </BrowserRouter>
    </StrictMode>
  )
}
