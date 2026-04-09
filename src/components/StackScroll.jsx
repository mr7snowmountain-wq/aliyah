/**
 * StackScroll — Stack de cartes style iOS Wallet, scrollable
 *
 * Principe : chaque carte est en position:absolute dans un conteneur
 * de hauteur explicite. Le scroll fonctionne car la hauteur ne dépend
 * pas des marges négatives (qui trompent le navigateur).
 */

const CARD_H = 76    // hauteur d'une carte (px)
const PEEK   = 26    // portion de la carte suivante visible (px)

/* ── Cache la scrollbar partout ── */
if (typeof document !== 'undefined' && !document.getElementById('stack-scroll-style')) {
  const s = document.createElement('style')
  s.id = 'stack-scroll-style'
  s.textContent = `.ss-wrap::-webkit-scrollbar{display:none}.ss-wrap{-ms-overflow-style:none;scrollbar-width:none}`
  document.head.appendChild(s)
}

export default function StackScroll({ tasks, onToggle }) {
  const n          = tasks.length
  if (n === 0) return null

  // Hauteur totale du contenu (toutes les cartes empilées)
  const innerH     = (n - 1) * PEEK + CARD_H + 16
  // Hauteur visible du conteneur (montre la 1ère carte + peek des 3 suivantes)
  const containerH = CARD_H + Math.min(n - 1, 3) * PEEK + 4

  return (
    <div style={{ position: 'relative', width: '100%' }}>

      {/* Conteneur scroll momentum iOS */}
      <div
        className="ss-wrap"
        style={{
          height: containerH,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
        }}
      >
        {/* Spacer : donne la bonne hauteur scrollable */}
        <div style={{ height: innerH, position: 'relative' }}>
          {tasks.map((task, i) => (
            <div
              key={i}
              onClick={() => onToggle(i)}
              style={{
                position : 'absolute',
                top      : i * PEEK,
                left     : 0,
                right    : 0,
                // ── Visuel carte (identique au dashboard) ──
                background     : task.done ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.75)',
                backdropFilter : 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border         : '1.5px solid rgba(255,255,255,0.85)',
                borderRadius   : 20,
                padding        : '14px 16px',
                zIndex         : n - i,
                cursor         : 'pointer',
                // Légère réduction de taille + ombre décroissante
                transform      : `scale(${1 - i * 0.012}) translateY(${i * 2}px)`,
                transformOrigin: 'top center',
                boxShadow      : `0 ${Math.max(2, 8 - i * 2)}px ${Math.max(6, 24 - i * 5)}px rgba(232,84,122,${Math.max(0.04, 0.18 - i * 0.04)})`,
                opacity        : task.done ? 0.55 : Math.max(0.55, 1 - i * 0.1),
                transition     : 'opacity 0.25s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Icône emoji */}
                <div style={{
                  width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                  background: task.done
                    ? 'linear-gradient(135deg, rgba(247,160,122,0.45), rgba(232,84,122,0.45))'
                    : 'rgba(255,200,215,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {task.emoji}
                </div>

                {/* Texte */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
                    color: 'var(--text-dark)',
                    textDecoration: task.done ? 'line-through' : 'none',
                    opacity: task.done ? 0.6 : 1,
                    marginBottom: 2,
                  }}>
                    {task.tache}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-hint)', fontWeight: 500 }}>
                    {task.heure}
                  </p>
                </div>

                {/* Checkmark */}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  background: task.done
                    ? 'linear-gradient(135deg,#F7A07A,#E8547A)'
                    : 'transparent',
                  border: task.done ? 'none' : '2px solid rgba(232,84,122,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: 'white', fontWeight: 700,
                }}>
                  {task.done ? '✓' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dégradé bas si plus de 3 cartes → invite au scroll */}
      {n > 3 && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 44,
          background: 'linear-gradient(to top, rgba(255,248,245,0.95) 0%, transparent 100%)',
          pointerEvents: 'none',
          borderRadius: '0 0 20px 20px',
        }} />
      )}
    </div>
  )
}
