import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { path: '/home',      label: 'Home',     Icon: HomeIcon    },
  { path: '/planning',  label: 'Planning', Icon: CalIcon     },
  { path: null,         label: '',         Icon: null, fab: true },
  { path: '/recettes',  label: 'Recettes', Icon: ForkIcon    },
  { path: '/profil',    label: 'Profil',   Icon: UserIcon    },
]

function HomeIcon({ active }) {
  const s = active ? '#E8547A' : '#C9A0AE'
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M3 10L12 3l9 7v10a1 1 0 01-1 1H5a1 1 0 01-1-1V10z"
      stroke={s} strokeWidth="1.8" strokeLinejoin="round"
      fill={active ? 'rgba(232,84,122,0.12)' : 'none'} />
    <path d="M9 21V13h6v8" stroke={s} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
}
function CalIcon({ active }) {
  const s = active ? '#E8547A' : '#C9A0AE'
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="17" rx="3" stroke={s} strokeWidth="1.8"
      fill={active ? 'rgba(232,84,122,0.1)' : 'none'} />
    <path d="M3 9h18M8 2v4M16 2v4" stroke={s} strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="8" cy="13" r="1.2" fill={s} />
    <circle cx="12" cy="13" r="1.2" fill={s} />
    <circle cx="16" cy="13" r="1.2" fill={s} />
  </svg>
}
function ForkIcon({ active }) {
  const s = active ? '#E8547A' : '#C9A0AE'
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M18 2v6a3 3 0 01-3 3v11M6 2v4M6 10v12M10 2v4a4 4 0 01-4 4"
      stroke={s} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
}
function UserIcon({ active }) {
  const s = active ? '#E8547A' : '#C9A0AE'
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke={s} strokeWidth="1.8"
      fill={active ? 'rgba(232,84,122,0.1)' : 'none'} />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={s} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
}
function PlusIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
}

export default function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.78)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(255,200,215,0.35)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '8px 8px calc(8px + env(safe-area-inset-bottom))',
      boxShadow: '0 -4px 24px rgba(232,84,122,0.07)',
    }}>
      {TABS.map((tab, i) => {
        if (tab.fab) return (
          <button key="fab"
            onClick={() => navigate('/planning')}
            style={{
              width: 52, height: 52,
              background: 'linear-gradient(135deg, #F7A07A, #E8547A)',
              border: '3px solid white', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', marginTop: -20,
              boxShadow: '0 4px 18px rgba(232,84,122,0.45)',
              transition: 'transform .15s',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(.92)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <PlusIcon />
          </button>
        )

        const active = pathname === tab.path
        return (
          <button key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 10px', borderRadius: 12,
              transition: 'transform .12s',
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(.9)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{
              width: 34, height: 34,
              background: active ? 'rgba(232,84,122,0.1)' : 'transparent',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .2s',
            }}>
              <tab.Icon active={active} />
            </div>
            <span style={{
              fontSize: 10, fontFamily: 'var(--font-body)',
              fontWeight: active ? 600 : 400,
              color: active ? 'var(--rose)' : 'var(--text-hint)',
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
