import { NavLink, Outlet } from 'react-router-dom'
import { Home, TrendingUp, Calculator, FlaskConical, Settings } from 'lucide-react'

const tabs = [
  { to: '/', label: 'Home', Icon: Home, end: true },
  { to: '/progress', label: 'Progress', Icon: TrendingUp },
  { to: '/calc', label: 'Calc', Icon: Calculator },
  { to: '/peptides', label: 'Peptides', Icon: FlaskConical },
  { to: '/settings', label: 'Settings', Icon: Settings },
]

export default function TabLayout() {
  return (
    <div className="flex flex-col h-dvh">
      <main className="flex-1 overflow-y-auto pb-[calc(52px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      <nav
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-[52px] bg-[var(--color-background-primary)] border-t border-[var(--color-border-primary)] flex items-center z-40"
        aria-label="Main navigation"
      >
        {tabs.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium uppercase tracking-wide transition-colors ${
                isActive
                  ? 'text-teal'
                  : 'text-[var(--color-text-tertiary)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.75}
                  className={isActive ? 'text-teal' : 'text-[var(--color-text-tertiary)]'}
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
