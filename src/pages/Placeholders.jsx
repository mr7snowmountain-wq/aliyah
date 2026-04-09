import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'

function PlaceholderPage({ emoji, title, color }) {
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
export function ProfilPage()    { return <PlaceholderPage emoji="👤" title="Mon Profil"     /> }
