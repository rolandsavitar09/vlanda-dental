import logoVlanda from '../../assets/logo vlanda dental.png'
import type { AdminPage } from '../../types'
import type { ReactNode } from 'react'

type AdminShellProps = {
  activePage: AdminPage
  children: ReactNode
  onLogout: () => void
  pendingReservationCount: number
  setActivePage: (page: AdminPage) => void
  title: string
}

export function AdminShell({
  activePage,
  children,
  onLogout,
  pendingReservationCount,
  setActivePage,
  title,
}: AdminShellProps) {
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <img src={logoVlanda} alt="Vlanda Dental" />
        <nav aria-label="Menu admin">
          <button
            className={activePage === 'dashboard' ? 'active' : ''}
            type="button"
            onClick={() => setActivePage('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={activePage === 'reservations' ? 'active' : ''}
            type="button"
            onClick={() => setActivePage('reservations')}
          >
            Reservasi
            {pendingReservationCount > 0 ? <span className="nav-badge">{pendingReservationCount}</span> : null}
          </button>
          <button
            className={activePage === 'articles' ? 'active' : ''}
            type="button"
            onClick={() => setActivePage('articles')}
          >
            Artikel
          </button>
          <button
            className={activePage === 'services' ? 'active' : ''}
            type="button"
            onClick={() => setActivePage('services')}
          >
            Layanan
          </button>
          <button
            className={activePage === 'doctors' ? 'active' : ''}
            type="button"
            onClick={() => setActivePage('doctors')}
          >
            Dokter
          </button>
          <button
            className={activePage === 'schedule' ? 'active' : ''}
            type="button"
            onClick={() => setActivePage('schedule')}
          >
            Jadwal
          </button>
        </nav>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>{title}</h1>
          </div>
          <button type="button" onClick={onLogout}>Keluar</button>
        </header>
        {children}
      </section>
    </main>
  )
}
