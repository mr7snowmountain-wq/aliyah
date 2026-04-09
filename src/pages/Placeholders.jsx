import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import NotifButton from '../components/NotifButton'
import { useAuth } from '../hooks/useAuth'

function PlaceholderPage({ emoji, title }) {
  const navigate = useNavigate()
  return (
    <div className="app-shell">
      <div className="screen" style={{ justifyContent: 'center', paddingTop: 60, paddingBottom: 100 }}>
        <button onClick={() => navigate('/home')} style={{
          alignSelf: 'flex-start', background: 'none', border: 'none',
          cursor: 'pointer', color: 'var(--text-soft)', fontSize: 14,
          marginBottom: 32, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ← Retour
        </button>
        <div className="card" style={{ padding: '40px 28px', textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>{emoji}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-dark)', marginBottom: 10 }}>
            {title}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.6, fontStyle: 'italic' }}>
            Cette section arrive bientôt, maman. 🌸<br />
            On travaille sur quelque chose de beau pour toi.
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

export function RecettesPage()  { return <PlaceholderPage emoji="🍲" title="Mes Recettes"  /> }
export function JuridiquePage() { return <PlaceholderPage emoji="⚖️" title="Espace Juridique" /> }
export function ActivitesPage() { return <PlaceholderPage emoji="🎨" title="Activités Enfant" /> }

export function ProfilPage() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()
  const nom = profile?.mama_name || 'maman'

  return (
    <div className="app-shell">
      <div className="screen" style={{ paddingTop: 0, paddingBottom: 100, gap: 0, justifyContent: 'flex-start' }}>

        {/* Header */}
        <div style={{
          width: '100%',
          background: 'linear-gradient(135deg, #FFB6C1 0%, #FFDAB9 100%)',
          borderRadius: '0 0 32px 32px',
          padding: '52px 24px 32px', marginBottom: 28,
          boxShadow: '0 6px 24px rgba(232,84,122,0.15)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--rose), var(--coral))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, marginBottom: 12,
              boxShadow: '0 4px 16px rgba(232,84,122,0.3)',
            }}>👤</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text-dark)' }}>
              {nom}
            </h1>
          </div>
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Notifications */}
          <NotifButton />

          {/* Déconnexion */}
          <button
            onClick={signOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', background: 'rgba(255,255,255,0.75)',
              border: '1.5px solid rgba(232,84,122,0.2)',
              borderRadius: 16, padding: '14px 18px', cursor: 'pointer',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            <span style={{ fontSize: 20 }}>🚪</span>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)' }}>
              Se déconnecter
            </p>
          </button>
        </div>

      </div>
      <BottomNav />
    </div>
  )
}
