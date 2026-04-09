import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/* Illustration SVG femme forte */
function HeroIllustration() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 220, height: 'auto' }}>
      {/* soleil / halo */}
      <circle cx="100" cy="70" r="52" fill="rgba(255,218,185,0.45)" />
      <circle cx="100" cy="70" r="38" fill="rgba(255,182,193,0.4)" />
      {/* corps */}
      <ellipse cx="100" cy="128" rx="28" ry="14" fill="rgba(232,84,122,0.15)" />
      {/* robe */}
      <path d="M80 100 Q76 120 72 138 Q100 145 128 138 Q124 120 120 100 Z"
        fill="url(#robe)" />
      {/* bras gauche levé */}
      <path d="M80 102 Q68 90 62 76" stroke="#E8547A" strokeWidth="6"
        strokeLinecap="round" />
      <circle cx="60" cy="73" r="5" fill="#F7A07A" />
      {/* bras droit */}
      <path d="M120 102 Q130 112 132 108" stroke="#E8547A" strokeWidth="6"
        strokeLinecap="round" />
      {/* torse */}
      <rect x="84" y="82" width="32" height="22" rx="8" fill="#F2789A" />
      {/* tête */}
      <circle cx="100" cy="68" r="20" fill="#F7C5A0" />
      {/* cheveux */}
      <path d="M82 62 Q84 44 100 44 Q118 44 120 62 Q116 52 100 50 Q84 52 82 62Z"
        fill="#3D1A1A" />
      <path d="M82 62 Q78 72 82 80" stroke="#3D1A1A" strokeWidth="4"
        strokeLinecap="round" />
      {/* visage */}
      <circle cx="93"  cy="68" r="2.5" fill="#6B4455" />
      <circle cx="107" cy="68" r="2.5" fill="#6B4455" />
      <path d="M94 76 Q100 80 106 76" stroke="#E8547A" strokeWidth="1.8"
        strokeLinecap="round" fill="none" />
      {/* hijab optionnel - foulard */}
      <path d="M80 64 Q82 44 100 43 Q118 44 120 64 Q116 58 100 56 Q84 58 80 64Z"
        fill="rgba(247,160,122,0.0)" />
      {/* étoiles déco */}
      <text x="150" y="40"  fontSize="14" fill="#F7A07A" opacity=".8">✦</text>
      <text x="36"  y="50"  fontSize="10" fill="#F2789A" opacity=".7">✦</text>
      <text x="160" y="95"  fontSize="8"  fill="#FCDCC8" opacity=".9">✦</text>
      <text x="28"  y="100" fontSize="12" fill="#F7A07A" opacity=".6">✦</text>
      <defs>
        <linearGradient id="robe" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#F2789A" />
          <stop offset="100%" stopColor="#F7A07A" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function AuthPage() {
  const [mode,     setMode]     = useState('signup')   // 'signup' | 'signin'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [info,     setInfo]     = useState('')
  const [busy,     setBusy]     = useState(false)

  const { signUp, signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setInfo(''); setBusy(true)

    if (mode === 'signup') {
      const { error: err } = await signUp(email, password)
      if (err) setError(err.message)
      else     setInfo('✉️ Vérifie ton email pour confirmer ton compte !')
    } else {
      const { error: err } = await signIn(email, password)
      if (err) setError('Email ou mot de passe incorrect 💔')
      else     navigate('/onboarding')
    }
    setBusy(false)
  }

  return (
    <div className="app-shell">
      <div className="screen" style={{ justifyContent: 'center', paddingTop: 32, paddingBottom: 40, gap: 0 }}>

        {/* Logo */}
        <div className="anim-0" style={{ textAlign: 'center', marginBottom: 4 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 48, fontWeight: 600, lineHeight: 1,
            background: 'var(--grad-btn)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Aliyah</h1>
          <p style={{ fontSize: 13, color: 'var(--text-soft)', fontStyle: 'italic', marginTop: 4 }}>
            Pour les mamans qui s'élèvent 💕
          </p>
        </div>

        {/* Illustration */}
        <div className="anim-1" style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <HeroIllustration />
        </div>

        {/* Card formulaire */}
        <div className="card anim-2" style={{ width: '100%', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Titre */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--text-dark)', marginBottom: 4 }}>
              {mode === 'signup' ? 'Créer mon compte 🌸' : 'Bon retour, maman 👋'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.5 }}>
              {mode === 'signup'
                ? 'Rejoins des milliers de mamans qui avancent.'
                : 'Tu nous as manqué. Reconnecte-toi.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label>Email</label>
              <input type="email" placeholder="ton@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label>Mot de passe</label>
              <input type="password" placeholder={mode === 'signup' ? 'Min. 8 caractères' : '••••••••'}
                value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
            </div>

            {error && <div className="error-banner">{error}</div>}
            {info  && (
              <div style={{
                background: 'rgba(247,160,122,0.12)', border: '1px solid rgba(247,160,122,0.3)',
                borderRadius: 'var(--r-sm)', padding: '11px 16px',
                color: 'var(--coral)', fontSize: 13, fontWeight: 500, textAlign: 'center',
              }}>{info}</div>
            )}

            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? '…' : mode === 'signup' ? 'Je commence 🚀' : 'Se connecter 💗'}
            </button>
          </form>

          {/* Switch mode */}
          <div style={{ textAlign: 'center' }}>
            {mode === 'signup' ? (
              <span style={{ fontSize: 13, color: 'var(--text-soft)' }}>
                Déjà un compte ?{' '}
                <button onClick={() => { setMode('signin'); setError(''); setInfo('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rose)', fontWeight: 600, fontSize: 13 }}>
                  Me connecter
                </button>
              </span>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--text-soft)' }}>
                Pas encore de compte ?{' '}
                <button onClick={() => { setMode('signup'); setError(''); setInfo('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rose)', fontWeight: 600, fontSize: 13 }}>
                  S'inscrire
                </button>
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
