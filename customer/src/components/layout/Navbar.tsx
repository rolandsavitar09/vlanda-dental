import logoVlandaDental from '../../assets/logo-vlanda-small.png'
import { navItems } from '../../data/navigation'
import type { User, View } from '../../types'
import { getInitial, getShortName } from '../../utils/format'

type NavbarProps = {
  accountOpen: boolean
  activeNav?: View
  navigate: (view: View) => void
  onLogout: () => void
  setAccountOpen: (isOpen: boolean | ((isOpen: boolean) => boolean)) => void
  startReservation: () => void
  user: User | null
}

export function Navbar({
  accountOpen,
  activeNav,
  navigate,
  onLogout,
  setAccountOpen,
  startReservation,
  user,
}: NavbarProps) {
  return (
    <header className="site-header">
      <button className="brand" type="button" onClick={() => navigate('home')}>
        <img className="brand-logo" src={logoVlandaDental} alt="Vlanda Dental" decoding="async" />
      </button>

      <nav className="main-nav" aria-label="Navigasi utama">
        {navItems.map((item) => (
          <button
            className={activeNav === item.view ? 'active' : ''}
            key={item.view}
            type="button"
            onClick={() => navigate(item.view)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="header-actions">
        <button className="primary-button nav-reservation" type="button" onClick={startReservation}>
          Reservasi Sekarang
        </button>

        {user ? (
          <div className="account-menu">
            <button
              className="account-trigger"
              type="button"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((isOpen) => !isOpen)}
            >
              <span className="avatar">{getInitial(user.profile.name)}</span>
              <span>{getShortName(user.profile.name)}</span>
            </button>

            {accountOpen ? (
              <div className="account-dropdown">
                <div className="account-name">
                  <span className="avatar">{getInitial(user.profile.name)}</span>
                  <strong>{user.profile.name}</strong>
                </div>
                <button type="button" onClick={() => navigate('profile')}>
                  Profil Saya
                </button>
                <button type="button" onClick={() => navigate('history')}>
                  Riwayat Reservasi
                </button>
                <span className="dropdown-divider" />
                <button type="button" onClick={onLogout}>
                  Keluar
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  )
}
