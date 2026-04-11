/**
 * CardCarousel — Défilement vertical style tambour/drum
 * Swipe HAUT → carte suivante remonte depuis le bas
 * Swipe BAS  → carte précédente redescend depuis le haut
 * Effet 3D rotateX pour donner l'impression d'un cylindre qui tourne
 */
import { useState, useRef, useEffect } from 'react'

const CARD_H    = 76   // hauteur d'une carte px
const PEEK_Y    = 14   // portion visible des cartes adjacentes
const PERSP     = 520  // perspective 3D (px)
const TILT      = 18   // degrés de rotation max des cartes adjacentes

export default function CardCarousel({ tasks, onToggle, onCardTap }) {
  const [idx, setIdx]     = useState(0)
  const [dragY, setDragY] = useState(0)
  const touchStartY       = useRef(null)
  const touchStartX       = useRef(null)
  const isDragging        = useRef(false)
  const containerRef      = useRef(null)   // ← ref pour attach touch non-passif
  const n = tasks.length
  if (n === 0) return null

  /* ── Navigation ── */
  function goTo(i) { setIdx(((i % n) + n) % n); setDragY(0) }

  /* ── Touch handlers (attachés via ref pour passive:false) ── */
  function onTouchStart(e) {
    touchStartY.current = e.touches[0].clientY
    touchStartX.current = e.touches[0].clientX
    isDragging.current  = false
  }

  function onTouchMove(e) {
    const dy = e.touches[0].clientY - touchStartY.current
    const dx = e.touches[0].clientX - touchStartX.current
    // Si mouvement horizontal dominant → laisser scroller la page
    if (!isDragging.current && Math.abs(dx) > Math.abs(dy)) return
    isDragging.current = true
    setDragY(dy)
    e.preventDefault()   // fonctionne car passive:false
  }

  function onTouchEnd(e) {
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dy) > 40) {
      dy < 0 ? goTo(idx + 1) : goTo(idx - 1)
    } else {
      setDragY(0)
    }
    isDragging.current = false
  }

  /* Attacher les listeners natifs (passive:false) pour pouvoir appeler preventDefault */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('touchstart', onTouchStart, { passive: true  })
    el.addEventListener('touchmove',  onTouchMove,  { passive: false })
    el.addEventListener('touchend',   onTouchEnd,   { passive: true  })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove',  onTouchMove)
      el.removeEventListener('touchend',   onTouchEnd)
    }
  })   // re-bind à chaque render pour avoir idx/dragY frais dans les closures

  /* ── Style par carte ── */
  function cardStyle(i) {
    let offset = i - idx
    if (offset >  n / 2) offset -= n
    if (offset < -n / 2) offset += n

    const abs     = Math.abs(offset)
    if (abs > 1.5) return null   // invisible

    const baseY   = offset * (CARD_H - PEEK_Y) + dragY * 0.35
    const rotX    = -offset * TILT + (dragY / CARD_H) * TILT * 0.4
    const scale   = 1 - abs * 0.06
    const opacity = abs === 0 ? 1 : Math.max(0.3, 0.55 - abs * 0.1)
    const zIndex  = abs === 0 ? 10 : 4 - abs

    return {
      position       : 'absolute',
      left           : '50%',
      top            : '50%',
      width          : '100%',
      transform      : `
        translateX(-50%)
        translateY(calc(-50% + ${baseY}px))
        perspective(${PERSP}px)
        rotateX(${rotX}deg)
        scale(${scale})
      `,
      transformOrigin: 'center center',
      opacity,
      zIndex,
      transition     : isDragging.current
        ? 'none'
        : 'transform 0.4s cubic-bezier(.25,.8,.25,1), opacity 0.3s ease',
      cursor         : 'pointer',
    }
  }

  return (
    /* position:relative indispensable pour que les dots absolute se positionnent ici */
    <div style={{ userSelect: 'none', position: 'relative' }}>

      {/* ── Zone des cartes ── */}
      <div
        ref={containerRef}
        style={{
          position  : 'relative',
          height    : CARD_H + PEEK_Y * 2 + 8,
          marginBottom: 12,
          overflow  : 'hidden',
          WebkitMaskImage : 'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)',
          maskImage       : 'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)',
        }}
      >
        {tasks.map((task, i) => {
          const style = cardStyle(i)
          if (!style) return null
          const isActive = i === idx

          return (
            <div key={i} style={style}
              onClick={() => {
                if (Math.abs(dragY) > 8) return
                if (!isActive) { goTo(i); return }
                onCardTap ? onCardTap(i) : onToggle(i)
              }}
            >
              <div style={{
                display             : 'flex',
                alignItems          : 'center',
                gap                 : 12,
                background          : task.done
                  ? 'rgba(255,255,255,0.55)'
                  : 'rgba(255,255,255,0.82)',
                backdropFilter      : 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border              : isActive
                  ? '1.5px solid rgba(232,84,122,0.3)'
                  : '1.5px solid rgba(255,255,255,0.75)',
                borderRadius        : 20,
                padding             : '14px 16px',
                boxShadow           : isActive
                  ? '0 8px 28px rgba(232,84,122,0.18)'
                  : '0 2px 8px rgba(232,84,122,0.06)',
                opacity             : task.done ? 0.65 : 1,
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

                {/* Checkmark — carte active seulement */}
                {isActive && (
                  <div
                    onClick={e => { e.stopPropagation(); onToggle(i) }}
                    style={{
                      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                      background: task.done
                        ? 'linear-gradient(135deg,var(--rose),var(--coral))'
                        : 'transparent',
                      border: task.done ? 'none' : '2px solid rgba(232,84,122,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.25s',
                    }}
                  >
                    {task.done && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8"
                          strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Dots verticaux sur le côté droit ── */}
      {n > 1 && (
        <div style={{
          display       : 'flex',
          flexDirection : 'column',
          alignItems    : 'center',
          gap           : 4,
          position      : 'absolute',
          right         : 0,
          top           : 0,
          bottom        : 12,    // aligner avec la zone cartes (marginBottom: 12)
          justifyContent: 'center',
          paddingRight  : 2,
        }}>
          {tasks.map((_, i) => (
            <div
              key={i}
              onClick={() => goTo(i)}
              style={{
                width       : 5,
                borderRadius: 3,
                height      : i === idx ? 20 : 5,
                background  : i === idx ? 'var(--rose)' : 'rgba(232,84,122,0.22)',
                transition  : 'all 0.3s ease',
                cursor      : 'pointer',
              }}
            />
          ))}
        </div>
      )}

    </div>
  )
}
