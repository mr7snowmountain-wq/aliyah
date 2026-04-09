import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

/* ── Appel Claude API ── */
async function transcriptToPlanning(text) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `Tu es l'assistante Aliyah pour une maman. À partir de ce texte dicté, extrais TOUTES les tâches mentionnées et retourne UNIQUEMENT un tableau JSON valide, sans markdown, sans explication, sans texte avant ou après.

Format strict : [{"heure":"08:00","tache":"Déposer les enfants à l'école","emoji":"🏫","done":false}]

Règles :
- Inclure TOUTES les tâches, même si beaucoup
- Si aucune heure précise, invente une heure logique dans la journée
- Emoji pertinent pour chaque tâche
- done toujours false
- Texte : "${text}"`,
    }),
  })

  if (!res.ok) throw new Error('Erreur API')
  const data = await res.json()
  const raw = data.content[0].text.trim()
  // Extraire le JSON même s'il y a du texte autour
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

/* ── TaskCard ── */
function TaskCard({ task, index, onToggle }) {
  return (
    <div
      className="stack-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        opacity: task.done ? 0.5 : 1,
        transition: 'opacity 0.3s',
        cursor: 'pointer',
      }}
      onClick={() => onToggle(index)}
    >
      <span style={{ fontSize: '1.6rem' }}>{task.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--rose)', fontWeight: 700 }}>
          {task.heure}
        </div>
        <div style={{
          fontSize: '0.95rem',
          fontWeight: 600,
          textDecoration: task.done ? 'line-through' : 'none',
          color: 'var(--text-dark)',
        }}>
          {task.tache}
        </div>
      </div>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        border: '2px solid var(--rose)',
        background: task.done ? 'var(--rose)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'background 0.2s',
      }}>
        {task.done && <span style={{ color: '#fff', fontSize: '0.75rem' }}>✓</span>}
      </div>
    </div>
  )
}

/* ── Page principale ── */
export default function PlanningPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [status, setStatus] = useState('idle')   // idle | listening | loading | done | error
  const [errorMsg, setErrorMsg] = useState('')
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)
  const statusRef = useRef('idle')
  const finalTranscriptRef = useRef('')           // accumule tout ce qui est dit

  useEffect(() => {
    // Charger le planning du jour s'il existe
    async function loadToday() {
      if (!user) return
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('plannings')
        .select('tasks')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()
      if (data?.tasks?.length > 0) {
        setTasks(data.tasks)
        setStatus('done')
        statusRef.current = 'done'
      }
    }
    loadToday()
    return () => recognitionRef.current?.stop()
  }, [user])

  /* ── Traitement après arrêt du micro ── */
  async function processTranscript() {
    const text = finalTranscriptRef.current.trim()
    if (!text) {
      setStatus('idle')
      statusRef.current = 'idle'
      return
    }
    setStatus('loading')
    statusRef.current = 'loading'
    try {
      const parsed = await transcriptToPlanning(text)
      setTasks(parsed)
      if (user) await savePlanningToSupabase(parsed, user.id)
      setStatus('done')
      statusRef.current = 'done'
    } catch (err) {
      setErrorMsg("Je n'ai pas réussi à analyser ton planning. Réessaie 🌸")
      setStatus('error')
      statusRef.current = 'error'
    }
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setErrorMsg("Ton navigateur ne supporte pas la reconnaissance vocale. Essaie Chrome.")
      setStatus('error')
      return
    }

    finalTranscriptRef.current = ''
    setTranscript('')

    const recognition = new SpeechRecognition()
    recognition.lang = 'fr-FR'
    recognition.continuous = true        // ← ne se coupe plus automatiquement
    recognition.interimResults = true    // ← affiche ce qui est dit en temps réel
    recognitionRef.current = recognition

    recognition.onstart = () => {
      setStatus('listening')
      statusRef.current = 'listening'
    }

    recognition.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscriptRef.current += e.results[i][0].transcript + ' '
        } else {
          interim += e.results[i][0].transcript
        }
      }
      setTranscript(finalTranscriptRef.current + interim)
    }

    recognition.onerror = (e) => {
      if (e.error === 'no-speech') return  // ignore silence, on continue
      setErrorMsg('Erreur micro : ' + e.error)
      setStatus('error')
      statusRef.current = 'error'
    }

    recognition.onend = () => {
      // Déclenché quand on appuie sur stop OU coupure inattendue
      if (statusRef.current === 'listening') {
        processTranscript()
      }
    }

    recognition.start()
  }

  function stopListening() {
    // On passe en 'processing' pour que onend lance le traitement
    statusRef.current = 'listening'
    recognitionRef.current?.stop()
  }

  function toggleTask(index) {
    setTasks(prev => {
      const updated = prev.map((t, i) => i === index ? { ...t, done: !t.done } : t)
      // Sauvegarder la mise à jour
      if (user) savePlanningToSupabase(updated, user.id)
      return updated
    })
  }

  function reset() {
    setTasks([])
    setTranscript('')
    setStatus('idle')
    statusRef.current = 'idle'
    finalTranscriptRef.current = ''
    setErrorMsg('')
    // Supprimer le planning du jour
    if (user) {
      const today = new Date().toISOString().split('T')[0]
      supabase.from('plannings').delete()
        .eq('user_id', user.id).eq('date', today)
    }
  }

  const doneCount = tasks.filter(t => t.done).length

  return (
    <div className="app-shell">
      <div className="screen" style={{ paddingTop: 0, paddingBottom: 100, gap: 0, justifyContent: 'flex-start' }}>

        {/* ── Header ── */}
        <div style={{
          width: '100%',
          background: 'linear-gradient(135deg, var(--rose), var(--coral))',
          borderRadius: '0 0 28px 28px',
          padding: '52px 24px 28px',
          marginBottom: 24,
          color: '#fff',
          boxShadow: '0 6px 24px rgba(232,84,122,0.18)',
        }}>
          <button
            onClick={() => navigate('/home')}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer', marginBottom: 8 }}
          >
            ←
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>📅 Mon Planning</h1>
          <p style={{ margin: '6px 0 0', opacity: 0.85, fontSize: '0.9rem' }}>
            Dicte ta journée, je m'occupe du reste 🌸
          </p>
        </div>

        {/* ── Contenu ── */}
        <div style={{ width: '100%', padding: '0 4px' }}>

          {/* Bouton micro — visible sauf quand on a un planning */}
          {status !== 'done' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
              <button
                onClick={status === 'listening' ? stopListening : startListening}
                disabled={status === 'loading'}
                style={{
                  width: 80, height: 80, borderRadius: '50%', border: 'none',
                  background: status === 'listening'
                    ? 'linear-gradient(135deg, #e53935, #e35d5b)'
                    : 'linear-gradient(135deg, var(--rose), var(--coral))',
                  color: '#fff', fontSize: '2rem',
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  boxShadow: status === 'listening'
                    ? '0 0 0 14px rgba(232,84,122,0.2), 0 4px 20px rgba(232,84,122,0.4)'
                    : '0 4px 20px rgba(232,84,122,0.35)',
                  transition: 'all 0.3s',
                  animation: status === 'listening' ? 'pulse 1.5s infinite' : 'none',
                }}
              >
                {status === 'loading' ? '⏳' : status === 'listening' ? '⏹' : '🎙'}
              </button>

              <p style={{ marginTop: 12, color: 'var(--text-soft)', fontSize: '0.85rem', textAlign: 'center' }}>
                {status === 'idle'      && 'Appuie et dicte ta journée'}
                {status === 'listening' && 'Je t\'écoute… Appuie ⏹ pour arrêter'}
                {status === 'loading'   && 'Aliyah analyse ton planning…'}
              </p>

              {/* Transcription en temps réel */}
              {transcript && (
                <div className="card" style={{ marginTop: 16, padding: '12px 16px', width: '100%' }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-hint)', margin: 0, lineHeight: 1.5 }}>
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

          {/* Planning généré */}
          {tasks.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 className="section-title" style={{ margin: 0 }}>Ta journée ✨</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--rose)', fontWeight: 600 }}>
                  {doneCount}/{tasks.length} faites
                </span>
              </div>

              {/* Barre de progression */}
              <div style={{ height: 6, background: '#f0e6ea', borderRadius: 10, marginBottom: 20, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${tasks.length ? (doneCount / tasks.length) * 100 : 0}%`,
                  background: 'linear-gradient(90deg, var(--rose), var(--coral))',
                  borderRadius: 10, transition: 'width 0.4s ease',
                }} />
              </div>

              {/* Cards en stack */}
              <div className="stack-container">
                {tasks.map((task, i) => (
                  <TaskCard key={i} task={task} index={i} onToggle={toggleTask} />
                ))}
              </div>

              {/* Bouton nouveau planning */}
              <button onClick={reset} className="btn btn-ghost" style={{ width: '100%', marginTop: 16 }}>
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
