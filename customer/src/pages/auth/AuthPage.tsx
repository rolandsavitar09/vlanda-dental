import heroClinic from '../../assets/hero-clinic.png'
import type { UserProfile, View } from '../../types'

type AuthPageProps = {
  authDraft: UserProfile
  authError: string
  authPassword: string
  mode: 'login' | 'register'
  navigate: (view: View) => void
  onSubmit: () => void
  setAuthDraft: (profile: UserProfile) => void
  setAuthError: (message: string) => void
  setAuthPassword: (password: string) => void
}

export function AuthPage({
  authDraft,
  authError,
  authPassword,
  mode,
  navigate,
  onSubmit,
  setAuthDraft,
  setAuthError,
  setAuthPassword,
}: AuthPageProps) {
  const isRegister = mode === 'register'

  return (
    <section className="auth-page">
      <div className="auth-visual">
        <img src={heroClinic} alt="Ruang klinik Vlanda Dental" />
        <div>
          <span className="pill">Customer Area</span>
          <h1>{isRegister ? 'Buat Akun Customer' : 'Masuk ke Akun Customer'}</h1>
          <p>
            Login diperlukan agar customer dapat membuat reservasi, melihat status konfirmasi,
            dan membuka riwayat reservasi.
          </p>
        </div>
      </div>
      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <h2>{isRegister ? 'Register' : 'Login'}</h2>
        {authError ? <p className="auth-error">{authError}</p> : null}
        {isRegister ? (
          <label>
            Nama Lengkap
            <input
              value={authDraft.name}
              onChange={(event) => {
                setAuthError('')
                setAuthDraft({ ...authDraft, name: event.target.value })
              }}
            />
          </label>
        ) : null}
        <label>
          Email
          <input
            type="email"
            value={authDraft.email}
            onChange={(event) => {
              setAuthError('')
              setAuthDraft({ ...authDraft, email: event.target.value })
            }}
          />
        </label>
        {isRegister ? (
          <label>
            Nomor Telepon
            <input
              value={authDraft.phone}
              onChange={(event) => {
                setAuthError('')
                setAuthDraft({ ...authDraft, phone: event.target.value })
              }}
            />
          </label>
        ) : null}
        <label>
          Password
          <input
            type="password"
            placeholder="Masukkan password"
            value={authPassword}
            onChange={(event) => {
              setAuthError('')
              setAuthPassword(event.target.value)
            }}
          />
        </label>
        <button className="primary-button" type="submit">
          {isRegister ? 'Daftar dan Masuk' : 'Masuk'}
        </button>
        <button
          className="text-button"
          type="button"
          onClick={() => {
            setAuthError('')
            setAuthPassword('')
            navigate(isRegister ? 'login' : 'register')
          }}
        >
          {isRegister ? 'Sudah punya akun? Login' : 'Belum punya akun? Register'}
        </button>
      </form>
    </section>
  )
}
