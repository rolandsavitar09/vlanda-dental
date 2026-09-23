import { useEffect, useMemo, useRef, useState } from 'react'
import heroClinic from './assets/hero-clinic.png'
import logoVlanda from './assets/logo vlanda dental.png'
import { AdminShell } from './components/layout/AdminShell'
import { ArticlesPage } from './pages/artikel/ArticlesPage'
import { Dashboard } from './pages/dashboard/Dashboard'
import { DoctorsPage } from './pages/dokter/DoctorsPage'
import { SchedulePage } from './pages/jadwal/SchedulePage'
import { ServicesPage } from './pages/layanan/ServicesPage'
import { ReservationsPage } from './pages/reservasi/ReservationsPage'
import { getAdminDoctors, getAdminReservations, isAuthError, loginAdmin } from './services/api'
import type {
  AdminArticle,
  AdminDoctor,
  AdminPage,
  AdminReservation,
  AdminReservationStatus,
  AdminScheduleSlot,
  AdminService,
} from './types'

const adminSessionKey = 'vlanda-dental-admin-session'

type AdminSession = {
  email: string
  name: string
  token: string
}

export function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [session, setSession] = useState<AdminSession | null>(() => {
    const savedSession = window.localStorage.getItem(adminSessionKey)

    if (!savedSession) {
      return null
    }

    try {
      return JSON.parse(savedSession) as AdminSession
    } catch {
      return null
    }
  })
  const [activePage, setActivePage] = useState<AdminPage>('dashboard')
  const [reservationStatusFilter, setReservationStatusFilter] = useState<'Semua' | AdminReservationStatus>('Semua')
  const [selectedReservationId, setSelectedReservationId] = useState('')
  const [reservations, setReservations] = useState<AdminReservation[]>([])
  const [articles, setArticles] = useState<AdminArticle[]>([])
  const [services, setServices] = useState<AdminService[]>([])
  const [doctors, setDoctors] = useState<AdminDoctor[]>([])
  const [scheduleSlots, setScheduleSlots] = useState<AdminScheduleSlot[]>([])
  const [dataError, setDataError] = useState('')
  const activePageRef = useRef(activePage)
  const knownReservationIdsRef = useRef<Set<string>>(new Set())
  const pendingReservationCount = useMemo(
    () => reservations.filter((reservation) => reservation.status === 'Menunggu Konfirmasi').length,
    [reservations],
  )

  useEffect(() => {
    activePageRef.current = activePage
  }, [activePage])

  useEffect(() => {
    if (!session) {
      setReservations([])
      setDataError('')
      knownReservationIdsRef.current = new Set()
      return
    }

    let shouldIgnore = false
    const offlineMessage = 'Backend belum tersambung. Data lama tetap ditampilkan dan akan dicoba refresh otomatis.'

    const handleDataLoadError = (loadError: unknown) => {
      if (shouldIgnore) return

      if (isAuthError(loadError)) {
        handleLogout()
        return
      }

      setDataError(offlineMessage)
    }

    const loadReservations = async (withNewReservationCheck = false) => {
      try {
        const nextReservations = await getAdminReservations(session.token)

        if (shouldIgnore) return

        const knownIds = knownReservationIdsRef.current
        const hasNewPendingReservation = nextReservations.some(
          (reservation) => reservation.status === 'Menunggu Konfirmasi' && !knownIds.has(reservation.id),
        )

        knownReservationIdsRef.current = new Set(nextReservations.map((reservation) => reservation.id))
        setReservations(nextReservations)
        setDataError('')

        if (withNewReservationCheck && hasNewPendingReservation && activePageRef.current !== 'reservations') {
          setReservationStatusFilter('Menunggu Konfirmasi')
        }
      } catch (loadError) {
        handleDataLoadError(loadError)
      }
    }

    loadReservations()
    const pollingId = window.setInterval(() => {
      loadReservations(true)
    }, 30000)

    getAdminDoctors(session.token)
      .then(setDoctors)
      .catch(handleDataLoadError)
    return () => {
      shouldIgnore = true
      window.clearInterval(pollingId)
    }
  }, [session])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError('Email dan password admin wajib diisi.')
      return
    }

    try {
      const response = await loginAdmin(email.trim().toLowerCase(), password.trim())
      const nextSession = {
        email: response.user.email,
        name: response.user.name,
        token: response.token,
      }

      window.localStorage.setItem(adminSessionKey, JSON.stringify(nextSession))
      setSession(nextSession)
      setError('')
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Akses admin tidak valid.')
    }
  }

  function handleLogout() {
    setEmail('')
    setPassword('')
    setError('')
    setActivePage('dashboard')
    setSession(null)
    window.localStorage.removeItem(adminSessionKey)
  }

  if (session) {
    const pageTitle = {
      articles: 'Manajemen Artikel',
      dashboard: 'Dashboard',
      doctors: 'Manajemen Dokter',
      reservations: 'Manajemen Reservasi',
      schedule: 'Jadwal Dokter',
      services: 'Manajemen Layanan',
    } satisfies Record<AdminPage, string>

    return (
      <AdminShell
        activePage={activePage}
        onLogout={handleLogout}
        pendingReservationCount={pendingReservationCount}
        setActivePage={setActivePage}
        title={pageTitle[activePage]}
      >
        {dataError ? <p className="admin-connection-alert">{dataError}</p> : null}
        {activePage === 'dashboard' ? (
          <Dashboard
            openReservations={(status, reservationId) => {
              setReservationStatusFilter(status ?? 'Semua')
              setSelectedReservationId(reservationId ?? '')
              setActivePage('reservations')
            }}
            reservations={reservations}
          />
        ) : null}
        {activePage === 'reservations' ? (
          <ReservationsPage
            reservations={reservations}
            activeStatus={reservationStatusFilter}
            selectedReservationId={selectedReservationId}
            setActiveStatus={setReservationStatusFilter}
            setSelectedReservationId={setSelectedReservationId}
            setReservations={setReservations}
            token={session.token}
          />
        ) : null}
        {activePage === 'articles' ? (
          <ArticlesPage articles={articles} setArticles={setArticles} token={session.token} />
        ) : null}
        {activePage === 'services' ? (
          <ServicesPage services={services} setServices={setServices} token={session.token} />
        ) : null}
        {activePage === 'doctors' ? (
          <DoctorsPage doctors={doctors} setDoctors={setDoctors} token={session.token} />
        ) : null}
        {activePage === 'schedule' ? (
          <SchedulePage
            doctors={doctors}
            scheduleSlots={scheduleSlots}
            setScheduleSlots={setScheduleSlots}
            token={session.token}
          />
        ) : null}
      </AdminShell>
    )
  }

  return (
    <main className="admin-login-page">
      <section className="login-visual" aria-label="Area admin Vlanda Dental">
        <img src={heroClinic} alt="Ruang klinik Vlanda Dental" />
        <div className="visual-content">
          <span>Area Internal</span>
          <h1>Admin Vlanda Dental</h1>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <img className="admin-logo" src={logoVlanda} alt="Vlanda Dental" />
          <div className="form-heading">
            <p>Login Admin</p>
            <h2>Masuk ke Panel</h2>
          </div>

          {error ? (
            <div className="login-error" role="alert">
              {error}
            </div>
          ) : null}

          <label>
            Email Admin
            <input
              type="email"
              value={email}
              placeholder="Masukkan email admin"
              onChange={(event) => {
                setError('')
                setEmail(event.target.value)
              }}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              placeholder="Masukkan password"
              onChange={(event) => {
                setError('')
                setPassword(event.target.value)
              }}
            />
          </label>

          <button type="submit">Masuk Admin</button>
          <small>Akses hanya untuk admin, CS, dan dokter Vlanda Dental.</small>
        </form>
      </section>
    </main>
  )
}
