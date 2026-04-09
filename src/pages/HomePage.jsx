import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import BottomNav from '../components/BottomNav'
import CardCarousel from '../components/CardCarousel'
import { supabase } from '../lib/supabase'

/* ── Messages motivants ── */
const MESSAGES_MOTIVANTS = [
  "Chaque petit pas compte. Tu avances, maman. 💪",
  "Tu es la héroïne de votre histoire. 🌟",
  "Aujourd'hui, célèbre la maman incroyable que tu es. 🌸",
  "Ta force est une leçon quotidienne pour ton enfant. 💜",
  "Tu n'as pas besoin d'être parfaite. Juste présente. 💕",
  "Les mamans fortes élèvent des enfants forts. ✨",
  "Respire. Tu gères tout avec amour. 🌺",
]

const MODULES = [
  { label: 'Planning',   emoji: '📅', path: '/planning',  color: 'rgba(242,120,154,0.15)', border: 'rgba(242,120,154,0.35)' },
  { label: 'Juridique',  emoji: '⚖️', path: '/juridique', color: 'rgba(247,160,122,0.15)', border: 'rgba(247,160,122,0.35)' },
  { label: 'Recettes',   emoji: '🍲', path: '/recettes',  color: 'rgba(244,133,106,0.15)', border: 'rgba(244,133,106,0.35)' },
  { label: 'Activités',  emoji: '🎨', path: '/activites', color: 'rgba(232,84,122,0.1)',   border: 'rgba(232,84,122,0.3)'   },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'Bonsoir'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

/* ── PlanningCard ── */
function PlanningCard({ item, index }) {
  return (
    <div className="stack-card" style={{ zIndex: 4 - index }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 14, flexShrink: 0,
          background: item.done
            ? 'linear-gradient(135deg, #F7A07A, #E8547A)'
            : 'rgba(255,200,215,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>
          {item.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14, fontWeight: 600,
            color: 'var(--text-dark)',
            textDecoration: item.done ? 'line-through' : 'none',
            opacity: item.done ? 0.5 : 1,
          }}>{item.tache}</p>
          <p style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 2, fontWeight: 500 }}>
            {item.heure}
          </p>
        </div>
        <div style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
          background: item.done ? 'linear-gradient(135deg,#F7A07A,#E8547A)' : 'transparent',
          border: item.done ? 'none' : '2px solid rgba(232,84,122,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, color: 'white', fontWeight: 700,
        }}>
          {item.done ? '✓' : ''}
        </div>
      </div>
    </div>
  )
}

/* ── ModuleBtn ── */
function ModuleBtn({ mod, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 8,
      background: mod.color, border: `1.5px solid ${mod.border}`,
      borderRadius: 20, padding: '18px 12px', cursor: 'pointer',
      transition: 'transform .15s, box-shadow .15s',
      flex: '1 1 calc(50% - 6px)', minWidth: 0,
    }}
    onMouseDown={e => e.currentTarget.style.transform = 'scale(.96)'}
    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <span style={{ fontSize: 28 }}>{mod.emoji}</span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text-dark)' }}>
        {mod.label}
      </span>
    </button>
  )
}

/* ── Page principale ── */
export default function HomePage() {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()
  const [planningTasks, setPlanningTasks] = useState([])
  const [planningLoading, setPlanningLoading] = useState(true)

  const nom     = profile?.mama_name || 'maman'
  const message = MESSAGES_MOTIVANTS[new Date().getDay() % MESSAGES_MOTIVANTS.length]
  const date    = new Date().toLocaleDateString('fr-MA', { weekday: 'long', day: 'numeric', month: 'long' })

  // Charger le planning du jour depuis Supabase
  useEffect(() => {
    async function loadPlanning() {
      if (!user) return
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('plannings')
        .select('tasks')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()
      setPlanningTasks(data?.tasks || [])
      setPlanningLoading(false)
    }
    loadPlanning()
  }, [user])

  const doneCount = planningTasks.filter(t => t.done).length
  const previewTasks = planningTasks.slice(0, 4) // max 4 sur le dashboard

  return (
    <div className="app-shell">
      <div className="screen" style={{ paddingTop: 0, paddingBottom: 100, gap: 0, justifyContent: 'flex-start' }}>

        {/* ── Hero header ── */}
        <div className="anim-0" style={{
          width: '100%',
          background: 'linear-gradient(135deg, #FFB6C1 0%, #FFDAB9 100%)',
          borderRadius: '0 0 32px 32px',
          padding: '52px 24px 28px',
          marginBottom: 24,
          boxShadow: '0 6px 24px rgba(232,84,122,0.18)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 13, color: 'rgba(109,68,85,.7)', marginBottom: 3 }}>{getGreeting()},</p>
              <h1 className="greeting-name">{nom} 💜</h1>
              <p style={{ fontSize: 11, color: 'rgba(109,68,85,.6)', marginTop: 5 }}>{date}</p>
            </div>
            <button
              onClick={signOut}
              style={{
                width: 40, height: 40,
                background: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,.7)',
                borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}
              title="Se déconnecter"
            >
              👤
            </button>
          </div>

          {/* Message motivant */}
          <div style={{
            background: 'rgba(255,255,255,0.45)',
            border: '1px solid rgba(255,255,255,.7)',
            borderRadius: 16, padding: '12px 16px', marginTop: 16,
            backdropFilter: 'blur(10px)',
          }}>
            <p className="motivant-text">"{message}"</p>
          </div>
        </div>

        {/* ── Planning du jour ── */}
        <section className="anim-1" style={{ width: '100%', marginBottom: 24, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 className="section-title">Planning du jour 📅</h2>
            <button
              onClick={() => navigate('/planning')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--rose)', fontSize: 12, fontWeight: 600 }}>
              {planningTasks.length > 0 ? `Tout voir (${doneCount}/${planningTasks.length}) →` : 'Créer →'}
            </button>
          </div>

          {planningLoading ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-hint)', fontSize: 13 }}>
              Chargement…
            </div>
          ) : previewTasks.length > 0 ? (
            <CardCarousel
              tasks={previewTasks}
              onToggle={() => navigate('/planning')}
              onCardTap={() => navigate('/planning')}
            />
          ) : (
            /* Aucun planning → invite à en créer un */
            <div
              onClick={() => navigate('/planning')}
              style={{
                background: 'rgba(255,255,255,0.5)',
                border: '1.5px dashed rgba(232,84,122,0.3)',
                borderRadius: 20, padding: '24px 20px',
                textAlign: 'center', cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎙</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)', marginBottom: 4 }}>
                Aucun planning aujourd'hui
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-soft)' }}>
                Appuie pour dicter ta journée
              </p>
            </div>
          )}
        </section>

        {/* ── Modules ── */}
        <section className="anim-2" style={{ width: '100%' }}>
          <h2 className="section-title">Mes espaces 🌸</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {MODULES.map(mod => (
              <ModuleBtn key={mod.label} mod={mod} onClick={() => navigate(mod.path)} />
            ))}
          </div>
        </section>

      </div>
      <BottomNav />
    </div>
  )
}
