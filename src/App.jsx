import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthPage       from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import HomePage       from './pages/HomePage'
import {
  PlanningPage, RecettesPage, JuridiquePage, ActivitesPage, ProfilPage,
} from './pages/Placeholders'

/* Spinner de chargement */
function Loader() {
  return (
    <div className="app-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, margin: '0 auto 16px',
          background: 'var(--grad-btn)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, animation: 'pulse 1.5s ease-in-out infinite',
        }}>🌸</div>
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--text-soft)' }}>
          Un instant…
        </p>
      </div>
    </div>
  )
}

/* Guard pour routes privées */
function Guard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  return user ? children : <Navigate to="/" replace />
}

function AppRoutes() {
  const { user, profile } = useAuth()

  return (
    <Routes>
      {/* Public */}
      <Route path="/"
        element={user
          ? <Navigate to={profile?.onboarding_complete ? '/home' : '/onboarding'} replace />
          : <AuthPage />
        }
      />

      {/* Onboarding */}
      <Route path="/onboarding"
        element={
          <Guard>
            {profile?.onboarding_complete ? <Navigate to="/home" replace /> : <OnboardingPage />}
          </Guard>
        }
      />

      {/* Écrans protégés */}
      <Route path="/home"      element={<Guard><HomePage /></Guard>} />
      <Route path="/planning"  element={<Guard><PlanningPage /></Guard>} />
      <Route path="/recettes"  element={<Guard><RecettesPage /></Guard>} />
      <Route path="/juridique" element={<Guard><JuridiquePage /></Guard>} />
      <Route path="/activites" element={<Guard><ActivitesPage /></Guard>} />
      <Route path="/profil"    element={<Guard><ProfilPage /></Guard>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
