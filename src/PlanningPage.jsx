import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'

// ─── Appel Claude Haiku ──────────────────────────────────────────────────────
async function transcriptToPlanning(text) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Tu es l'assistante Aliyah. À partir de ce texte dicté par une mère, extrais les tâches de la journée et retourne UNIQUEMENT un tableau JSON valide, sans markdown, sans explication.

Format strict : [{"heure":"08:00","tache":"Déposer les enfants à l'école","emoji":"🏫","done":false}]

Si aucune heure n'est mentionnée, invente une heure logique.
Texte : "${text}"`,
        },
      ],
    }),
  })

  if (!res.ok) throw new Error('Erreur API Claude')
  const data = await res.json()
  const raw = data.content[0].text.trim()
  return JSON.parse(raw)
}

// ─── Composant carte tâche ────────────────────────────────────────────────────
function TaskCard({ task, index, onToggle }) {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px 18px',
        marginBottom: '10px',
        opacity: task.done ? 0.5 : 1,
        transition: 'opacity 0.3s',
        animationDelay: `${index * 0.08}s`,
        animationFillMode: 'both',
      }}
      onClick={() => onToggle(index)}
    >
      <span style={{ fontSize: '1.6rem' }}>{task.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--rose)', fontWeight: 700 }}>
          {task.heure}
        </div>
        <div
          style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            textDecoration: task.done ? 'line-through' : 'none',
            color: 'var(--text)',
          }}
        >
          {task.tache}
        </div>
      </div>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: '2px solid var(--rose)',
          background: task.done ? 'var(--rose)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}
      >
        {task.done && <span style={{ color: '#fff', fontSize: '0.75rem' }}>✓</span>}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function PlanningPage() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [status, setStatus] = useState('idle') // idle | listening | loading | done | error
  const [errorMsg, setErrorMsg] = useState('')
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)

  // Nettoyage au démontage
  useEffect(() => {
    return () => recognitionRef.current?.stop()
  }, [])

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setErrorMsg("Ton navigateur ne supporte pas la reconnaissance vocale. Essaie Chrome.")
      setStatus('error')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'fr-FR'
    recognition.continuous = false
    recognition.interimResults = false
    recognitionRef.current = recognition

    recognition.onstart = () => setStatus('listening')

    recognition.onresult = async (e) => {
      const text = e.results[0][0].transcript
      setTranscript(text)
      setStatus('loading')
      try {
        const parsed = await transcriptToPlanning(text)
        setTasks(parsed)
        setStatus('done')
      } catch (err) {
        setErrorMsg("Je n'ai pas réussi à analyser ton planning. Réessaie 🌸")
        setStatus('error')
      }
    }

    recognition.onerror = (e) => {
      setErrorMsg('Erreur micro : ' + e.error)
      setStatus('error')
    }

    recognition.onend = () => {
      if (status === 'listening') setStatus('idle')
    }

    recognition.start()
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setStatus('idle')
  }

  function toggleTask(index) {
    setTasks(prev =>
      prev.map((t, i) => (i === index ? { ...t, done: !t.done } : t))
    )
  }

  function reset() {
    setTasks([])
    setTranscript('')
    setStatus('idle')
    setErrorMsg('')
  }

  const doneCount = tasks.filter(t => t.done).length

  return (
    <div className="screen" style={{ paddingBottom: 90 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--rose), var(--coral))',
        borderRadius: '0 0 28px 28px',
        padding: '52px 24px 28px',
        marginBottom: 24,
        color: '#fff',
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

      <div style={{ padding: '0 20px' }}>

        {/* Bouton micro */}
        {status !== 'done' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
            <button
              onClick={status === 'listening' ? stopListening : startListening}
              disabled={status === 'loading'}
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                border: 'none',
                background: status === 'listening'
                  ? 'linear-gradient(135deg, #e53935, #e35d5b)'
                  : 'linear-gradient(135deg, var(--rose), var(--coral))',
                color: '#fff',
                fontSize: '2rem',
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                boxShadow: status === 'listening'
                  ? '0 0 0 12px rgba(232,84,122,0.2), 0 4px 20px rgba(232,84,122,0.4)'
                  : '0 4px 20px rgba(232,84,122,0.35)',
                transition: 'all 0.3s',
                animation: status === 'listening' ? 'pulse 1.5s infinite' : 'none',
              }}
            >
              {status === 'loading' ? '⏳' : status === 'listening' ? '⏹' : '🎙'}
            </button>
            <p style={{ marginTop: 12, color: 'var(--text-light)', fontSize: '0.85rem', textAlign: 'center' }}>
              {status === 'idle' && 'Appuie et dicte ta journée'}
              {status === 'listening' && 'Je t\'écoute... Appuie pour arrêter'}
              {status === 'loading' && 'Aliyah analyse ton planning...'}
            </p>

            {/* Transcript */}
            {transcript && (
              <div className="card" style={{ marginTop: 16, padding: '12px 16px', width: '100%' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', margin: 0 }}>
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
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                Ta journée ✨
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--rose)', fontWeight: 600 }}>
                {doneCount}/{tasks.length} faites
              </span>
            </div>

            {/* Barre de progression */}
            <div style={{
              height: 6,
              background: '#f0e6ea',
              borderRadius: 10,
              marginBottom: 20,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${tasks.length ? (doneCount / tasks.length) * 100 : 0}%`,
                background: 'linear-gradient(90deg, var(--rose), var(--coral))',
                borderRadius: 10,
                transition: 'width 0.4s ease',
              }} />
            </div>

            {tasks.map((task, i) => (
              <TaskCard key={i} task={task} index={i} onToggle={toggleTask} />
            ))}

            <button
              onClick={reset}
              className="btn-ghost"
              style={{ width: '100%', marginTop: 16 }}
            >
              🎙 Nouveau planning
            </button>
          </>
        )}

      </div>

      <BottomNav />
    </div>
  )
}
