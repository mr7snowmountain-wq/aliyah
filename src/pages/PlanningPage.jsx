import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import CardCarousel from '../components/CardCarousel'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

/* ── Keyframes ── */
const STYLES = `
@keyframes sonar {
  0%   { transform: scale(1);   opacity: 0.65; }
  100% { transform: scale(2.8); opacity: 0;    }
}
@keyframes mic-float {
  0%, 100% { transform: translateY(0)   scale(1);    }
  50%       { transform: translateY(-5px) scale(1.03); }
}
@keyframes spin-ring {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
`
if (typeof document !== 'undefined' && !document.getElementById('planning-styles')) {
  const s = document.createElement('style')
  s.id = 'planning-styles'
  s.textContent = STYLES
  document.head.appendChild(s)
}

/* ── Appel Claude ── */
async function transcriptToPlanning(text) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `Tu es l'assistante Aliyah pour une maman. À partir de ce texte dicté, extrais TOUTES les tâches et retourne UNIQUEMENT un tableau JSON valide, sans markdown, sans explication.

Format strict : [{"heure":"08:00","tache":"Déposer les enfants à l'école","emoji":"🏫","done":false}]

Règles : inclure TOUTES les tâches, inventer une heure logique si non précisée, emoji pertinent, done=false.
Texte : "${text}"`,
    }),
  })
  if (!res.ok) throw new Error('Erreur API')
  const data  = await res.json()
  const raw   = data.content[0].text.trim()
  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('JSON introuvable')
  return JSON.parse(match[0])
}

/* ── Supabase ── */
async function savePlanning(tasks, userId) {
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase.from('plannings').upsert(
    { user_id: userId, date: today, tasks, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,date' }
  )
  if (error) console.error('Save error:', error)
}

/* ── Bouton micro ── */
function MicButton({ status, onStart, onStop }) {
  const isListening = status === 'listening'
  const isLoading   = status === 'loading'

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 130, height: 130 }}>

      {/* Anneaux sonar quand on écoute */}
      {isListening && [0, 1, 2].map(i => (
        <span key={i} style={{
          position: 'absolute', width: 84, height: 84, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,84,122,0.3), rgba(244,133,106,0.08))',
          animation: `sonar 2s ease-out ${i * 0.65}s infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Spinner de chargement */}
      {isLoading && (
        <span style={{
          position: 'absolute', width: 100, height: 100, borderRadius: '50%',
          border: '3px solid rgba(232,84,122,0.15)',
          borderTopColor: 'var(--rose)',
          borderRightColor: 'var(--coral)',
          animation: 'spin-ring 1s linear infinite',
          pointerEvents: 'none',
        }} />
      )}

      <button
        onClick={isListening ? onStop : onStart}
        disabled={isLoading}
        style={{
          position: 'relative', zIndex: 2,
          width: 84, height: 84, borderRadius: '50%', border: 'none',
          /* Gradient rose/coral même pendant le chargement */
          background: isListening
            ? 'linear-gradient(135deg, #c0392b, #e74c3c)'
            : 'linear-gradient(135deg, var(--rose), var(--coral))',
          color: '#fff',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          boxShadow: isListening
            ? '0 0 0 5px rgba(232,84,122,0.2), 0 6px 24px rgba(192,57,43,0.45)'
            : '0 6px 28px rgba(232,84,122,0.5)',
          transition: 'background 0.3s, box-shadow 0.3s',
          animation: (!isListening && !isLoading) ? 'mic-float 3s ease-in-out infinite' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: isLoading ? '1.6rem' : '1.8rem',
          opacity: isLoading ? 0.85 : 1,
        }}
      >
        {isLoading ? '🌸' : isListening ? (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="11" rx="3" fill="white"/>
            <path d="M5 10a7 7 0 0014 0" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M12 19v3M9 22h6" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        )}
      </button>
    </div>
  )
}

/* ── Page ── */
export default function PlanningPage() {
  const navigate = useNavigate()
  const { user }  = useAuth()

  const [tasks,      setTasks]      = useState([])
  const [status,     setStatus]     = useState('idle')
  const [errorMsg,   setErrorMsg]   = useState('')
  const [transcript, setTranscript] = useState('')

  const statusRef          = useRef('idle')
  const finalTranscriptRef = useRef('')
  const isProcessingRef    = useRef(false)

  /* Charger planning du jour */
  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    supabase.from('plannings').select('tasks')
      .eq('user_id', user.id).eq('date', today).single()
      .then(({ data }) => {
        if (data?.tasks?.length > 0) {
          setTasks(data.tasks)
          setStatus('done'); statusRef.current = 'done'
        }
      })
    return () => stopCurrentRecognition()
  }, [user])

  function stopCurrentRecognition() {
    try { window.__aliyahRec?.stop() } catch {}
    window.__aliyahRec = null
  }

  /* ── Traitement vers Claude ── */
  async function doProcess() {
    if (isProcessingRef.current) return
    isProcessingRef.current = true
    stopCurrentRecognition()

    const text = finalTranscriptRef.current.trim()
    if (!text) {
      setStatus('idle'); statusRef.current = 'idle'
      isProcessingRef.current = false; return
    }
    setStatus('loading'); statusRef.current = 'loading'
    try {
      const parsed = await transcriptToPlanning(text)
      setTasks(parsed)
      if (user) await savePlanning(parsed, user.id)
      setStatus('done'); statusRef.current = 'done'
    } catch {
      setErrorMsg("Je n'ai pas réussi à analyser. Réessaie 🌸")
      setStatus('error'); statusRef.current = 'error'
    }
    isProcessingRef.current = false
  }

  /* ── Créer une instance SR fraîche ── */
  function buildRecognition() {
    const SR  = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang           = 'fr-FR'
    rec.continuous     = false   // false = plus simple + évite duplication
    rec.interimResults = true
    window.__aliyahRec = rec

    rec.onstart = () => { setStatus('listening'); statusRef.current = 'listening' }

    rec.onresult = (e) => {
      // e.resultIndex garantit qu'on ne retraite pas les anciens résultats
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscriptRef.current += e.results[i][0].transcript + ' '
        } else {
          interim = e.results[i][0].transcript
        }
      }
      // Afficher seulement le nouveau texte, pas tout l'accumulé (évite la répétition visuelle)
      setTranscript(finalTranscriptRef.current + interim)
    }

    rec.onerror = (e) => {
      if (e.error === 'no-speech') return  // silence → redémarre
      setErrorMsg('Erreur micro : ' + e.error)
      setStatus('error'); statusRef.current = 'error'
    }

    rec.onend = () => {
      if (statusRef.current === 'listening') {
        // Coupure navigateur → NOUVELLE instance propre + relance
        buildRecognition().start()
      }
      // Si status = 'loading', stopListening() gère tout
    }

    return rec
  }

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setErrorMsg("Ton navigateur ne supporte pas le micro. Essaie Chrome.")
      setStatus('error'); return
    }
    finalTranscriptRef.current = ''
    isProcessingRef.current    = false
    setTranscript('')
    buildRecognition().start()
  }

  function stopListening() {
    statusRef.current = 'loading'   // bloque le restart dans onend
    setStatus('loading')
    stopCurrentRecognition()
    doProcess()
  }

  function toggleTask(index) {
    setTasks(prev => {
      const updated = prev.map((t, i) => i === index ? { ...t, done: !t.done } : t)
      if (user) savePlanning(updated, user.id)
      return updated
    })
  }

  function reset() {
    setTasks([]); setTranscript('')
    setStatus('idle'); statusRef.current = 'idle'
    finalTranscriptRef.current = ''; isProcessingRef.current = false
    setErrorMsg('')
    if (user) {
      const today = new Date().toISOString().split('T')[0]
      supabase.from('plannings').delete().eq('user_id', user.id).eq('date', today)
    }
  }

  const doneCount = tasks.filter(t => t.done).length

  return (
    <div className="app-shell">
      <div className="screen" style={{ paddingTop: 0, paddingBottom: 110, gap: 0, justifyContent: 'flex-start' }}>

        {/* Header */}
        <div style={{
          width: '100%',
          background: 'linear-gradient(135deg, var(--rose), var(--coral))',
          borderRadius: '0 0 28px 28px',
          padding: '52px 24px 28px', marginBottom: 24,
          color: '#fff', boxShadow: '0 6px 24px rgba(232,84,122,0.18)',
        }}>
          <button onClick={() => navigate('/home')}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer', marginBottom: 8 }}>
            ←
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>📅 Mon Planning</h1>
          <p style={{ margin: '6px 0 0', opacity: 0.85, fontSize: '0.9rem' }}>
            Dicte ta journée, je m'occupe du reste 🌸
          </p>
        </div>

        <div style={{ width: '100%', padding: '0 4px' }}>

          {/* Zone micro */}
          {status !== 'done' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
              <MicButton status={status} onStart={startListening} onStop={stopListening} />

              <p style={{ marginTop: 8, color: 'var(--text-soft)', fontSize: '0.85rem', textAlign: 'center', minHeight: 22 }}>
                {status === 'idle'      && 'Appuie et dicte ta journée'}
                {status === 'listening' && '🔴 Je t\'écoute… appuie ⏹ quand tu as fini'}
                {status === 'loading'   && 'Aliyah prépare ton planning…'}
              </p>

              {transcript && (
                <div className="card" style={{ marginTop: 14, padding: '12px 16px', width: '100%' }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-hint)', margin: 0, lineHeight: 1.55 }}>
                    <em>"{transcript}"</em>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Erreur */}
          {status === 'error' && (
            <div className="error-banner" style={{ marginBottom: 20 }}>
              {errorMsg}
              <button onClick={reset}
                style={{ background: 'none', border: 'none', color: 'var(--rose)', fontWeight: 700, cursor: 'pointer', marginLeft: 8 }}>
                Réessayer
              </button>
            </div>
          )}

          {/* Planning */}
          {tasks.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 className="section-title" style={{ margin: 0 }}>Ta journée ✨</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--rose)', fontWeight: 700 }}>
                  {doneCount}/{tasks.length} faites
                </span>
              </div>

              {/* Barre de progression */}
              <div style={{ height: 7, background: 'rgba(232,84,122,0.1)', borderRadius: 10, marginBottom: 20, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${tasks.length ? (doneCount / tasks.length) * 100 : 0}%`,
                  background: 'linear-gradient(90deg, var(--rose), var(--coral))',
                  borderRadius: 10, transition: 'width 0.5s ease',
                }} />
              </div>

              {/* Carrousel swipeable */}
              <CardCarousel tasks={tasks} onToggle={toggleTask} />

              <button onClick={reset} className="btn btn-ghost" style={{ width: '100%', marginTop: 24 }}>
                🎙 Nouveau planning
              </button>
            </>
          )}
        </div>

      </div>
      <BottomNav />
    </div>
  )
}
