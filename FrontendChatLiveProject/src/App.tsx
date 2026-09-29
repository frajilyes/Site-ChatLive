import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/auth/RequireAuth'
import { Layout } from './components/layout/Layout'
import HomePage from './pages/HomePage'

const FeaturesPage = lazy(() => import('./pages/FeaturesPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const CommunitiesPage = lazy(() => import('./pages/CommunitiesPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))

const RequireAdmin = lazy(() =>
  import('./components/auth/RequireAdmin').then((module) => ({
    default: module.RequireAdmin,
  })),
)
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

const CareersPage = lazy(() => import('./pages/CareersPage'))
const PressPage = lazy(() => import('./pages/PressPage'))
const HelpPage = lazy(() => import('./pages/HelpPage'))
const StatusPage = lazy(() => import('./pages/StatusPage'))
const ApiDocsPage = lazy(() => import('./pages/ApiDocsPage'))
const ChangelogPage = lazy(() => import('./pages/ChangelogPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const SecurityPage = lazy(() => import('./pages/SecurityPage'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route
          path="/chat"
          element={
            <RequireAuth>
              <ChatPage />
            </RequireAuth>
          }
        />
        <Route path="/communities" element={<CommunitiesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerifyEmailPage />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
          }
        />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/press" element={<PressPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/api-docs" element={<ApiDocsPage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/security" element={<SecurityPage />} />

        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/fonctionnalites" element={<Navigate to="/features" replace />} />
        <Route path="/messagerie" element={<Navigate to="/chat" replace />} />
        <Route path="/communautes" element={<Navigate to="/communities" replace />} />
        <Route path="/tarifs" element={<Navigate to="/pricing" replace />} />
        <Route path="/a-propos" element={<Navigate to="/about" replace />} />
        <Route path="/connexion" element={<Navigate to="/login" replace />} />
        <Route path="/inscription" element={<Navigate to="/register" replace />} />
        <Route path="/confirmation" element={<Navigate to="/verify" replace />} />
        <Route path="/administration" element={<Navigate to="/admin" replace />} />
        <Route path="/carrieres" element={<Navigate to="/careers" replace />} />
        <Route path="/presse" element={<Navigate to="/press" replace />} />
        <Route path="/aide" element={<Navigate to="/help" replace />} />
        <Route path="/statut" element={<Navigate to="/status" replace />} />
        <Route path="/documentation-api" element={<Navigate to="/api-docs" replace />} />
        <Route path="/journal" element={<Navigate to="/changelog" replace />} />
        <Route path="/confidentialite" element={<Navigate to="/privacy" replace />} />
        <Route path="/conditions" element={<Navigate to="/terms" replace />} />
        <Route path="/securite" element={<Navigate to="/security" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
