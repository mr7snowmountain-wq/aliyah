import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

/* ── Keyframes injectés une seule fois ── */
const STYLES = `
@keyframes sonar {
  0%   { transform: scale(1);   opacity: 0.7; }
  100% { transform: scale(2.8); opacity: 0;   }
}
@keyframes mic-idle-float {
  0%, 100% { transform: translateY(0px) scale(1); }
  50%       { transform: translateY(-4px) scale(1.03); }
}
@keyframes spin-ring {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
/* Stack scroll — cache la scrollbar sur tous navigateurs */
.tasks-scroll::-webkit-scrollbar { display: none; }
.tasks-scroll { -ms-overflow-style: none; scrollbar-width: none; }
`
if (typeof document !== 'undefined' && !document.getElementById('planning-styles')) {
  const s = document.createElement('style')
  s.id = 'planning-styles'
  s.textContent = STYLES
  document.head.appendChild(s)
}

/* ── Appel Claude API ── */
async function transcriptToPlanning(text) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `Tu es l'assistante Aliyah pour une maman. À partir de ce texte dicté, extrais TOUTES les tâches mentionnées et retourne UNIQUEMENT un tableau JSON valide, sans markdown, sans explication.

Format strict : [{"heure":"08:00","tache":"Déposer les enfants à l'école","emoji":"🏫","done":false}]

Règles :
- Inclure TOUTES les tâches
- Si aucune heure précise, invente une heure logique
- Emoji pertinent pour chaque tâche
- done toujours false
Texte : "${text}"`,
    }),
  })
  if (!res.ok) throw new Error('Erreur API')
  const data = await res.json()
  const raw = data.content[0].text.trim()
  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Format JSON invalide')
  return JSON.parse(match[0])
}

/* ── Sauvegarde Supabase ── */
async function savePlanningToSupabase(tasks, userId) {
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase
    .from('plannings')
    .upsert(
      { user_id: userId, date: today, tasks, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' }
    )
  if (error) console.error('Erreur sauvegarde planning:', error)
}

/* ── Bouton micro avec animation sonar ── */
function MicButton({ status, onStart, onStop }) {
  const isListening = status === 'listening'
  const isLoading   = status === 'loading'

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 120, height: 120 }}>

      {/* Anneaux sonar — visibles uniquement en écoute */}
      {isListening && [0, 1, 2].map(i => (
        <span key={i} style={{
          position: 'absolute',
          width: 84, height: 84,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,84,122,0.35), rgba(244,133,106,0.1))',
          animation: `sonar 2.2s ease-out ${i * 0.7}s infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Anneau spinner pendant le chargement */}
      {isLoading && (
        <span style={{
          position: 'absolute',
          width: 96, height: 96,
          borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: 'var(--rose)',
          borderRightColor: 'var(--coral)',
          animation: 'spin-ring 0.9s linear infinite',
          pointerEvents: 'none',
        }} />
      )}

      <button
        onClick={isListening ? onStop : onStart}
        disabled={isLoading}
        style={{
          position: 'relative', zIndex: 2,
          width: 84, height: 84, borderRadius: '50%', border: 'none',
          background: isListening
            ? 'linear-gradient(135deg, #c0392b, #e74c3c)'
            : isLoading
            ? 'linear-gradient(135deg, #ccc, #aaa)'
            : 'linear-gradient(135deg, var(--rose), var(--coral))',
          color: '#fff',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          boxShadow: isListening
            ? '0 0 0 5px rgba(232,84,122,0.25), 0 6px 24px rgba(192,57,43,0.5)'
            : '0 6px 24px rgba(232,84,122,0.45)',
          transition: 'background 0.3s, box-shadow 0.3s',
          animation: !isListening && !isLoading ? 'mic-idle-float 3s ease-in-out infinite' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {isLoading ? (
          /* Icône hourglass SVG */
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M6 2h12M6 22h12M8 2v5l8 5-8 5v5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : isListening ? (
          /* Icône stop */
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
        ) : (
          /* Icône micro */
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

/* ── TaskCard ── */
function TaskCard({ task, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        background: task.done ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.82)',
        border: '1.5px solid rgba(255,200,215,0.55)',
        borderRadius: 20, padding: '16px 18px',
        opacity: task.done ? 0.65 : 1,
        transition: 'opacity 0.25s, background 0.25s',
        cursor: 'pointer',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 4px 20px rgba(232,84,122,0.08)',
      }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 14, flexShrink: 0,
        background: task.done
          ? 'linear-gradient(135deg, rgba(247,160,122,0.5), rgba(232,84,122,0.5))'
          : 'linear-gradient(135deg, rgba(255,200,215,0.4), rgba(255,218,185,0.3))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
      }}>
        {task.emoji}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--rose)', marginBottom: 3, letterSpacing: '0.3px' }}>
          {task.heure}
        </p>
        <p style={{
          fontSize: 15, fontWeight: 600, color: 'var(--text-dark)',
          textDecoration: task.done ? 'line-through' : 'none',
        }}>
          {task.tache}
        </p>
      </div>

      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: task.done ? 'linear-gradient(135deg, var(--rose), var(--coral))' : 'transparent',
        border: task.done ? 'none' : '2px solid rgba(232,84,122,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.25s',
      }}>
        {task.done && (
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </div>
  )
}

/* ── Stack scrollable style iPhone Wallet ── */
function TaskStack({ tasks, onToggle }) {
  const CARD_H    = 82    // hauteur visible de chaque carte (px)
  const PEEK      = 14    // combien on voit de la carte suivante
  const total     = tasks.length
  // On montre ~3 cartes dans le "stack" avant que l'utilisateur scroll
  const visibleH  = CARD_H + (Math.min(total - 1, 5) * PEEK) + 24

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Conteneur scroll momentum style iOS */}
      <div
        className="tasks-scroll"
        style={{
          overflowY: 'auto',
          maxHeight: visibleH,
          WebkitOverflowScrolling: 'touch',  // momentum iOS
          position: 'relative',
          paddingBottom: 8,
        }}
      >
        {tasks.map((task, i) => (
          <div
            key={i}
            style={{
              /* Chaque carte "dépasse" sous la précédente de PEEK px */
              marginTop: i === 0 ? 0 : -(CARD_H - PEEK),
              position: 'relative',
              zIndex: total - i,
              /* Scale légèrement réduit pour les cartes derrière */
              transform: `scale(${1 - i * 0.015})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease',
            }}
          >
            <TaskCard task={task} onToggle={() => onToggle(i)} />
          </div>
        ))}
      </div>

      {/* Dégradé en bas pour indiquer qu'il y a plus de cartes */}
      {total > 3 && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
          background: 'linear-gradient(to top, rgba(255,240,245,0.95), transparent)',
          pointerEvents: 'none',
          borderRadius: '0 0 20px 20px',
        }} />
      )}
    </div>
  )
}

/* ── Page principale ── */
export default function PlanningPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tasks, setTasks]       = useState([])
  const [status, setStatus]     = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [transcript, setTranscript] = useState('')

  const recognitionRef     = useRef(null)
  const statusRef          = useRef('idle')
  const finalTranscriptRef = useRef('')
  const isProcessingRef    = useRef(false)   // évite le double-traitement

  /* Charger planning du jour */
  useEffect(() => {
    async function loadToday() {
      if (!user) return
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('plannings').select('tasks')
        .eq('user_id', user.id).eq('date', today).single()
      if (data?.tasks?.length > 0) {
        setTasks(data.tasks)
        setStatus('done')
        statusRef.current = 'done'
      }
    }
    loadToday()
    return () => recognitionRef.current?.stop()
  }, [user])

  /* ── Traitement du transcript → Claude ── */
  async function doProcess() {
    if (isProcessingRef.current) return   // verrou anti-doublon
    isProcessingRef.current = true

    const text = finalTranscriptRef.current.trim()
    if (!text) {
      setStatus('idle'); statusRef.current = 'idle'
      isProcessingRef.current = false; return
    }
    setStatus('loading'); statusRef.current = 'loading'
    try {
      const parsed = await transcriptToPlanning(text)
      setTasks(parsed)
      if (user) await savePlanningToSupabase(parsed, user.id)
      setStatus('done'); statusRef.current = 'done'
    } catch {
      setErrorMsg("Je n'ai pas réussi à analyser. Réessaie 🌸")
      setStatus('error'); statusRef.current = 'error'
    }
    isProcessingRef.current = false
  }

  /* ── Démarrer le micro ── */
  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setErrorMsg("Ton navigateur ne supporte pas le micro. Essaie Chrome.")
      setStatus('error'); return
    }

    finalTranscriptRef.current = ''
    isProcessingRef.current = false
    setTranscript('')

    const rec = new SR()
    rec.lang            = 'fr-FR'
    rec.continuous      = true   // reste ouvert
    rec.interimResults  = true   // affichage temps réel
    recognitionRef.current = rec

    rec.onstart = () => { setStatus('listening'); statusRef.current = 'listening' }

    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalTranscriptRef.current += e.results[i][0].transcript + ' '
        else interim += e.results[i][0].transcript
      }
      setTranscript(finalTranscriptRef.current + interim)
    }

    rec.onerror = (e) => {
      if (e.error === 'no-speech') return  // silence → on continue
      setErrorMsg('Erreur micro : ' + e.error)
      setStatus('error'); statusRef.current = 'error'
    }

    rec.onend = () => {
      if (statusRef.current === 'listening') {
        // Coupure inattendue du navigateur → on relance pour continuer
        try { rec.start() }
        catch { doProcess() }   // si le relancement échoue, on traite ce qu'on a
      }
      // Si status === 'loading', stopListening() a déjà lancé doProcess()
    }

    rec.start()
  }

  /* ── Arrêter le micro (bouton stop) ── */
  function stopListening() {
    statusRef.current = 'loading'   // bloque le restart dans onend
    setStatus('loading')
    recognitionRef.current?.stop()
    doProcess()
  }

  function toggleTask(index) {
    setTasks(prev => {
      const updated = prev.map((t, i) => i === index ? { ...t, done: !t.done } : t)
      if (user) savePlanningToSupabase(updated, user.id)
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

        {/* ── Header ── */}
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

        {/* ── Contenu ── */}
        <div style={{ width: '100%', padding: '0 4px' }}>

          {/* Zone micro */}
          {status !== 'done' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
              <MicButton status={status} onStart={startListening} onStop={stopListening} />

              <p style={{ marginTop: 8, color: 'var(--text-soft)', fontSize: '0.85rem', textAlign: 'center', minHeight: 20 }}>
                {status === 'idle'      && 'Appuie et dicte ta journée'}
                {status === 'listening' && '🔴 À toi… appuie ⏹ quand tu as fini'}
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
              <button onClick={reset} style={{ background: 'none', border: 'none', color: 'var(--rose)', fontWeight: 700, cursor: 'pointer', marginLeft: 8 }}>
                Réessayer
              </button>
            </div>
          )}

          {/* Liste des tâches */}
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

              {/* Stack scrollable style iPhone */}
              <TaskStack tasks={tasks} onToggle={toggleTask} />

              <button onClick={reset} className="btn btn-ghost" style={{ width: '100%', marginTop: 20 }}>
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
