import { useState, useEffect } from 'react'
import { registerPush, isPushEnabled, unregisterPush } from '../lib/push'
import { useAuth } from '../hooks/useAuth'

export default function NotifButton() {
  const { user } = useAuth()
  const [enabled,  setEnabled]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [checked,  setChecked]  = useState(false)

  useEffect(() => {
    isPushEnabled().then(v => { setEnabled(v); setChecked(true) })
  }, [])

  if (!checked) return null
  // Cacher si le navigateur ne supporte pas
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null

  async function toggle() {
    setLoading(true)
    if (enabled) {
      await unregisterPush(user?.id)
      setEnabled(false)
    } else {
      const result = await registerPush(user?.id)
      if (result.success) setEnabled(true)
      else if (result.error === 'refusé') alert('Tu as bloqué les notifications. Active-les dans les réglages de ton navigateur.')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        display        : 'flex',
        alignItems     : 'center',
        gap            : 10,
        width          : '100%',
        background     : enabled
          ? 'linear-gradient(135deg, var(--rose), var(--coral))'
          : 'rgba(255,255,255,0.75)',
        border         : enabled ? 'none' : '1.5px solid rgba(232,84,122,0.25)',
        borderRadius   : 16,
        padding        : '14px 18px',
        cursor         : loading ? 'not-allowed' : 'pointer',
        backdropFilter : 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow      : enabled
          ? '0 4px 18px rgba(232,84,122,0.3)'
          : '0 2px 8px rgba(232,84,122,0.08)',
        transition     : 'all 0.3s ease',
        opacity        : loading ? 0.7 : 1,
      }}
    >
      <span style={{ fontSize: 20 }}>{enabled ? '🔔' : '🔕'}</span>
      <div style={{ textAlign: 'left' }}>
        <p style={{
          fontSize   : 14, fontWeight: 700,
          color      : enabled ? 'white' : 'var(--text-dark)',
          marginBottom: 2,
        }}>
          {loading ? 'Chargement…' : enabled ? 'Notifications activées' : 'Activer les notifications'}
        </p>
        <p style={{ fontSize: 11, color: enabled ? 'rgba(255,255,255,0.8)' : 'var(--text-soft)' }}>
          {enabled ? 'Rappels 15 min avant chaque tâche' : 'Rappels planning, motivations…'}
        </p>
      </div>
      <div style={{ marginLeft: 'auto' }}>
        <div style={{
          width: 38, height: 22, borderRadius: 11,
          background: enabled ? 'rgba(255,255,255,0.3)' : 'rgba(232,84,122,0.15)',
          border: enabled ? '1.5px solid rgba(255,255,255,0.5)' : '1.5px solid rgba(232,84,122,0.2)',
          position: 'relative', transition: 'all 0.3s',
        }}>
          <div style={{
            position: 'absolute', top: 2,
            left: enabled ? 18 : 2,
            width: 14, height: 14, borderRadius: '50%',
            background: enabled ? 'white' : 'var(--rose)',
            transition: 'left 0.3s ease',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }} />
        </div>
      </div>
    </button>
  )
}
