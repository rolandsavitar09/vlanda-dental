import { Icon } from '../../components/common/Icon'
import type { View } from '../../types'

type AuthGateProps = {
  navigate: (view: View) => void
}

export function AuthGate({ navigate }: AuthGateProps) {
  return (
    <section className="content-section gate-page">
      <div className="gate-card">
        <span className="round-icon">
          <Icon name="user" />
        </span>
        <h1>Masuk untuk melanjutkan</h1>
        <p>
          Akun customer dipakai untuk menyimpan data diri, mengirim reservasi,
          dan melihat status konfirmasi dari admin.
        </p>
        <div className="hero-actions center-actions">
          <button className="primary-button" type="button" onClick={() => navigate('login')}>
            Login
          </button>
          <button className="secondary-button" type="button" onClick={() => navigate('register')}>
            Register
          </button>
        </div>
      </div>
    </section>
  )
}
