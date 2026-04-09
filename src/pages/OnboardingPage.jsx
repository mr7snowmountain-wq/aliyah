import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const STEPS = [
  {
    emoji: '👋',
    title: 'Comment tu t\'appelles ?',
    hint: 'Ton prénom, celui qu\'on utilisera pour toi.',
    field: 'mama_name',
    placeholder: 'Ton prénom…',
    type: 'text',
  },
  {
    emoji: '⭐',
    title: 'Et ton enfant ?',
    hint: 'Le prénom de ton trésor.',
    field: 'child_name',
    placeholder: 'Prénom de ton enfant…',
    type: 'text',
  },
  {
    emoji: '🎂',
    title: 'Quel âge a-t-il / elle ?',
    hint: 'Pour des conseils adaptés à son âge.',
    field: 'child_age',
    placeholder: 'ex : 4 ans',
    type: 'text',
  },
]

/* Barre de progression */
function ProgressBar({ step, total }) {
  return (
    <div style={{ width: '100%', marginBottom: 32 }}>
      <div style={{
        height: 6, background: 'rgba(232,84,122,0.15)',
        borderRadius: 999, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${((step + 1) / total) * 100}%`,
          background: 'var(--grad-btn)',
          borderRadius: 999,
          transition: 'width .4s cubic-bezier(.34,1.56,.64,1)',
        }} />
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: 8, fontSize: 11, color: 'var(--text-hint)',
      }}>
        <span>Étape {step + 1} sur {total}</span>
        <span>{Math.round(((step + 1) / total) * 100)} %</span>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const [step,   setStep]   = useState(0)
  const [values, setValues] = useState({ mama_name: '', child_name: '', child_age: '' })
  const [error,  setError]  = useState('')
  const [busy,   setBusy]   = useState(false)

  const { saveProfile } = useAuth()
  const navigate = useNavigate()
  const current = STEPS[step]

  function handleChange(val) {
    setValues(p => ({ ...p, [current.field]: val }))
    setError('')
  }

  async function handleNext() {
    if (!values[current.field].trim()) {
      setError('Ce champ est requis 💕')
      return
    }
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      setBusy(true)
      const { error: err } = await saveProfile({
        mama_name:           values.mama_name,
        child_name:          values.child_name,
        child_age:           values.child_age,
        onboarding_complete: true,
      })
      if (err) { setError('Erreur de sauvegarde, réessaie.'); setBusy(false) }
      else     navigate('/home')
    }
  }

  function handleBack() {
    if (step > 0) { setStep(s => s - 1); setError('') }
  }

  return (
    <div className="app-shell">
      <div className="screen" style={{ justifyContent: 'center', paddingTop: 48, paddingBottom: 40 }}>

        {/* Logo petit */}
        <p className="anim-0" style={{
          fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600,
          background: 'var(--grad-btn)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          marginBottom: 32, alignSelf: 'flex-start',
        }}>
          Aliyah 🌸
        </p>

        {/* Progress bar */}
        <div className="anim-1" style={{ width: '100%' }}>
          <ProgressBar step={step} total={STEPS.length} />
        </div>

        {/* Card étape — re-monte à chaque step */}
        <div key={step} className="card scale-in" style={{ width: '100%', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

          {/* Emoji */}
          <div style={{
            width: 68, height: 68, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,182,193,.5), rgba(255,218,185,.5))',
            border: '2px solid rgba(255,255,255,.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30,
            boxShadow: '0 4px 16px rgba(232,84,122,.15)',
            animation: 'float 3s ease-in-out infinite',
          }}>
            {current.emoji}
          </div>

          {/* Texte */}
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--text-dark)', marginBottom: 6 }}>
              {current.title}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-soft)', fontStyle: 'italic' }}>
              {current.hint}
            </p>
          </div>

          {/* Input */}
          <div className="field" style={{ width: '100%' }}>
            <input
              type={current.type}
              placeholder={current.placeholder}
              value={values[current.field]}
              onChange={e => handleChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNext()}
              autoFocus
              style={{ textAlign: 'center', fontSize: 16, fontWeight: 500 }}
            />
          </div>

          {error && <div className="error-banner">{error}</div>}

          {/* Boutons */}
          <button className="btn btn-primary" onClick={handleNext} disabled={busy} style={{ width: '100%' }}>
            {busy ? '…' : step === STEPS.length - 1
              ? `C'est parti, ${values.mama_name || 'maman'} ! 🚀`
              : 'Suivant →'}
          </button>

          {step > 0 && (
            <button onClick={handleBack}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-hint)', fontSize: 13 }}>
              ← Retour
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
