/**
 * CardCarousel — Carrousel de cartes style iOS
 * Swipe gauche/droite pour faire défiler, une carte à la fois au premier plan.
 * Props :
 *   tasks      — tableau [{heure, tache, emoji, done}]
 *   onToggle   — (index) => void  appelé quand on coche/décoche
 *   onCardTap  — (index) => void  appelé quand on tape la carte (optionnel)
 */
import { useState, useRef } from 'react'

export default function CardCarousel({ tasks, onToggle, onCardTap }) {
  const [idx, setIdx]       = useState(0)
  const touchStartX         = useRef(null)
  const touchStartY         = useRef(null)
  const isDragging          = useRef(false)
  const [dragX, setDragX]   = useState(0)   // offset live pendant le drag
  const n = tasks.length
  if (n === 0) return null

  /* ── Navigation ── */
  function goTo(i) { setIdx(((i % n) + n) % n); setDragX(0) }
  function goNext() { goTo(idx + 1) }
  function goPrev() { goTo(idx - 1) }

  /* ── Touch handlers ── */
  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isDragging.current  = false
  }

  function onTouchMove(e) {
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current
    // Si scroll vertical dominant → ne pas intercepter
    if (!isDragging.current && Math.abs(dy) > Math.abs(dx)) return
    isDragging.current = true
    setDragX(dx)
    e.preventDefault()
  }

  function onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 44) {
      dx < 0 ? goNext() : goPrev()
    } else {
      setDragX(0)
    }
    isDragging.current = false
  }

  /* ── Calcul position de chaque carte ── */
  function getCardStyle(i) {
    let offset = i - idx
    // Wrap-around pour avoir la carte précédente/suivante accessible
    if (offset > n / 2)  offset -= n
    if (offset < -n / 2) offset += n

    const absOff   = Math.abs(offset)
    const visible  = absOff <= 1.4

    // translateX en % de la largeur de la carte (110% = plein écran + gap)
    const baseX    = offset * 108 + (dragX / 3.2)   // drag live
    const scale    = 1 - absOff * 0.07
    const opacity  = offset === 0 ? 1 : Math.max(0, 1 - absOff * 0.45)
    const zIndex   = offset === 0 ? 10 : 5 - absOff

    return {
      visible,
      style: {
        position       : 'absolute',
        left           : '50%',
        top            : 0,
        width          : '88%',
        transform      : `translateX(calc(-50% + ${baseX}%)) scale(${scale})`,
        transformOrigin: 'center center',
        opacity,
        zIndex,
        transition     : isDragging.current
          ? 'none'
          : 'transform 0.38s cubic-bezier(.25,.8,.25,1), opacity 0.3s ease',
        cursor         : 'pointer',
      },
    }
  }

  const current = tasks[idx]

  return (
    <div style={{ userSelect: 'none' }}>

      {/* ── Zone des cartes ── */}
      <div
        style={{ position: 'relative', height: 88, marginBottom: 14, overflow: 'visible' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {tasks.map((task, i) => {
          const { visible, style } = getCardStyle(i)
          if (!visible) return null
          return (
            <div key={i} style={style}
              onClick={() => {
                if (Math.abs(dragX) > 8) return   // ignore si c'était un swipe
                if (i === idx) {
                  onCardTap ? onCardTap(i) : onToggle(i)
                } else {
                  goTo(i)
                }
              }}
            >
              {/* ── Carte ── */}
              <div style={{
                display        : 'flex',
                alignItems     : 'center',
                gap            : 12,
                background     : task.done ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.82)',
                backdropFilter : 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border         : i === idx
                  ? '1.5px solid rgba(232,84,122,0.3)'
                  : '1.5px solid rgba(255,255,255,0.8)',
                borderRadius   : 20,
                padding        : '14px 16px',
                boxShadow      : i === idx
                  ? '0 8px 28px rgba(232,84,122,0.18)'
                  : '0 4px 12px rgba(232,84,122,0.08)',
                opacity        : task.done ? 0.65 : 1,
                transition     : 'opacity 0.2s',
              }}>
                {/* Emoji */}
                <div style={{
                  width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                  background: task.done
                    ? 'linear-gradient(135deg,rgba(247,160,122,.45),rgba(232,84,122,.45))'
                    : 'rgba(255,200,215,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {task.emoji}
                </div>

                {/* Texte */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--rose)', marginBottom: 3 }}>
                    {task.heure}
                  </p>
                  <p style={{
                    fontSize: 14, fontWeight: 600, color: 'var(--text-dark)',
                    textDecoration: task.done ? 'line-through' : 'none',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {task.tache}
                  </p>
                </div>

                {/* Checkmark — seulement sur la carte active */}
                {i === idx && (
                  <div
                    onClick={e => { e.stopPropagation(); onToggle(i) }}
                    style={{
                      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                      background: task.done
                        ? 'linear-gradient(135deg,var(--rose),var(--coral))'
                        : 'transparent',
                      border: task.done ? 'none' : '2px solid rgba(232,84,122,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    {task.done && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Indicateurs dots ── */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
        {tasks.map((_, i) => (
          <div
            key={i}
            onClick={() => goTo(i)}
            style={{
              height    : 5,
              borderRadius: 3,
              width     : i === idx ? 22 : 5,
              background: i === idx ? 'var(--rose)' : 'rgba(232,84,122,0.22)',
              transition: 'all 0.3s ease',
              cursor    : 'pointer',
            }}
          />
        ))}
      </div>

    </div>
  )
}
