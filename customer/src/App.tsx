import { useEffect, useMemo, useState } from 'react'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { emptyReservationDraft, initialUser } from './data/customer'
import { doctors as fallbackDoctors } from './data/doctors'
import { serviceCategories as fallbackServiceCategories } from './data/services'
import { DetailReservasi } from './pages/akun/DetailReservasi'
import { ProfilSaya } from './pages/akun/ProfilSaya'
import { RiwayatReservasi } from './pages/akun/RiwayatReservasi'
import { AuthGate } from './pages/auth/AuthGate'
import { AuthPage } from './pages/auth/AuthPage'
import { Artikel } from './pages/public/Artikel'
import { Beranda } from './pages/public/Beranda'
import { DetailArtikel } from './pages/public/DetailArtikel'
import { DetailLayanan } from './pages/public/DetailLayanan'
import { Dokter } from './pages/public/Dokter'
import { FallbackPage } from './pages/public/FallbackPage'
import { Kontak } from './pages/public/Kontak'
import { Layanan } from './pages/public/Layanan'
import { TentangKami } from './pages/public/TentangKami'
import { Reservasi } from './pages/reservasi/Reservasi'
import {
  cancelReservationRequest,
  createReservation,
  getDoctors,
  getPublishedArticles,
  getReservations,
  getSchedules,
  getServiceCatalog,
  loginCustomer,
  registerCustomer,
  type ApiSchedule,
} from './services/api'
import type { Article, Doctor, Reservation, ReservationDraft, ServiceCategory, User, UserProfile, View } from './types'
import { getActiveNav } from './utils/reservation'
import './styles/app.css'

const customerSessionKey = 'vlanda-dental-customer-session'

function App() {
  const [view, setView] = useState<View>('home')
  const [previousView, setPreviousView] = useState<View>('home')
  const [accountOpen, setAccountOpen] = useState(false)
  const [returnAfterLogin, setReturnAfterLogin] = useState<View>('profile')
  const [selectedServiceId, setSelectedServiceId] = useState('scaling')
  const [activeServiceCategoryId, setActiveServiceCategoryId] = useState('all')
  const [serviceSearch, setServiceSearch] = useState('')
  const [articleCategory, setArticleCategory] = useState('Semua')
  const [articleSearch, setArticleSearch] = useState('')
  const [articles, setArticles] = useState<Article[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>(fallbackDoctors)
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(fallbackServiceCategories)
  const [selectedArticleId, setSelectedArticleId] = useState('')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [selectedReservationCode, setSelectedReservationCode] = useState('')
  const [reservationError, setReservationError] = useState('')
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false)
  const [schedules, setSchedules] = useState<ApiSchedule[]>([])
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false)
  const [hasLoadedSchedules, setHasLoadedSchedules] = useState(false)
  const [reservationStep, setReservationStep] = useState(0)
  const [draft, setDraft] = useState<ReservationDraft>(emptyReservationDraft)
  const [profileDraft, setProfileDraft] = useState<UserProfile>(initialUser.profile)
  const [isProfileEditing, setIsProfileEditing] = useState(false)
  const [authDraft, setAuthDraft] = useState<UserProfile>(initialUser.profile)
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [user, setUser] = useState<User | null>(() => {
    const savedSession = window.localStorage.getItem(customerSessionKey)

    if (!savedSession) {
      return null
    }

    try {
      return JSON.parse(savedSession) as User
    } catch {
      return null
    }
  })

  const allServices = useMemo(
    () => serviceCategories.flatMap((category) => category.services),
    [serviceCategories],
  )
  const selectedService = allServices.find((service) => service.id === selectedServiceId)
  const selectedReservation = reservations.find((reservation) => reservation.id === selectedReservationCode)
  const selectedArticle = articles.find((article) => article.id === selectedArticleId)

  useEffect(() => {
    if (user) {
      window.localStorage.setItem(customerSessionKey, JSON.stringify(user))
      return
    }

    window.localStorage.removeItem(customerSessionKey)
  }, [user])

  useEffect(() => {
    getServiceCatalog()
      .then((nextCategories) => {
        setServiceCategories(nextCategories)
        const nextServices = nextCategories.flatMap((category) => category.services)
        setSelectedServiceId((currentId) =>
          nextServices.some((service) => service.id === currentId) ? currentId : nextServices[0]?.id ?? '',
        )
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    getDoctors()
      .then((nextDoctors) => {
        setDoctors(nextDoctors)
        setDraft((currentDraft) => ({
          ...currentDraft,
          doctorId: nextDoctors.some((doctor) => doctor.id === currentDraft.doctorId)
            ? currentDraft.doctorId
            : nextDoctors[0]?.id ?? '',
        }))
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    getPublishedArticles()
      .then((nextArticles) => {
        setArticles(nextArticles)
        setSelectedArticleId((currentId) => currentId || nextArticles[0]?.id || '')
      })
      .catch(() => {
        setArticles([])
      })
  }, [])

  useEffect(() => {
    if (!user) {
      setReservations([])
      return
    }

    let shouldIgnore = false

    getReservations(user.token)
      .then((nextReservations) => {
        if (shouldIgnore) return

        setReservations(nextReservations)
        setSelectedReservationCode((currentCode) => currentCode || nextReservations[0]?.id || '')
      })
      .catch(() => {
        if (!shouldIgnore) {
          setReservationError('Riwayat reservasi belum bisa dimuat. Pastikan backend aktif.')
        }
      })

    const pollingId = window.setInterval(() => {
      getReservations(user.token)
        .then((nextReservations) => {
          if (shouldIgnore) return

          setReservations(nextReservations)
        })
        .catch(() => undefined)
    }, 30000)

    return () => {
      shouldIgnore = true
      window.clearInterval(pollingId)
    }
  }, [user])

  function navigate(nextView: View) {
    setPreviousView(view)
    setView(nextView)
    setAccountOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBack() {
    navigate(previousView === 'service-detail' ? 'services' : previousView)
  }

  function fillDraftFromUser(profile: UserProfile, serviceId = draft.serviceId) {
    setDraft((current) => ({
      ...current,
      serviceId,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      birthDate: profile.birthDate,
    }))
  }

  function startReservation(serviceId = draft.serviceId) {
    setSelectedServiceId(serviceId)

    if (!user) {
      setReturnAfterLogin('reservation')
      navigate('login')
      return
    }

    loadSchedules()
    fillDraftFromUser(user.profile, serviceId)
    setReservationStep(0)
    navigate('reservation')
  }

  function openServiceDetail(serviceId: string) {
    setSelectedServiceId(serviceId)
    navigate('service-detail')
  }

  function openArticleDetail(articleId: string) {
    setSelectedArticleId(articleId)
    navigate('article-detail')
  }

  function completeLogin(nextUser: User) {
    setUser(nextUser)
    setProfileDraft(nextUser.profile)

    if (returnAfterLogin === 'reservation') {
      loadSchedules()
      fillDraftFromUser(nextUser.profile)
      setReservationStep(0)
    }

    setAuthError('')
    setAuthPassword('')
    navigate(returnAfterLogin)
    setReturnAfterLogin('profile')
  }

  function loadSchedules() {
    if (hasLoadedSchedules || isLoadingSchedules) {
      return
    }

    setIsLoadingSchedules(true)
    getSchedules()
      .then((nextSchedules) => {
        setSchedules(nextSchedules)
        setHasLoadedSchedules(true)
        setReservationError('')
      })
      .catch(() => setReservationError('Jadwal belum bisa dimuat. Pastikan backend aktif.'))
      .finally(() => setIsLoadingSchedules(false))
  }

  async function handleAuthSubmit(mode: 'login' | 'register') {
    const email = authDraft.email.trim().toLowerCase()
    const password = authPassword.trim()

    if (!email || !password) {
      setAuthError('Email dan password wajib diisi.')
      return
    }

    if (mode === 'register') {
      const name = authDraft.name.trim()
      const phone = authDraft.phone.trim()

      if (!name || !phone) {
        setAuthError('Nama lengkap dan nomor telepon wajib diisi.')
        return
      }

      if (password.length < 6) {
        setAuthError('Password minimal 6 karakter.')
        return
      }

      const nextProfile = {
        ...authDraft,
        email,
        name,
        phone,
      }

      try {
        const nextUser = await registerCustomer(nextProfile, password)
        completeLogin(nextUser)
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'Register gagal.')
      }

      return
    }

    try {
      const nextUser = await loginCustomer(email, password)
      setAuthDraft(nextUser.profile)
      completeLogin(nextUser)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Login gagal.')
    }
  }

  function handleLogout() {
    setUser(null)
    setAccountOpen(false)
    setIsProfileEditing(false)
    setAuthPassword('')
    setAuthError('')
    setReservations([])
    setSelectedReservationCode('')
    navigate('home')
  }

  async function submitReservation() {
    if (!user) {
      setReturnAfterLogin('reservation')
      navigate('login')
      return
    }

    const service =
      allServices.find((currentService) => currentService.id === draft.serviceId) ?? allServices[0]

    if (!service) {
      setReservationError('Layanan belum bisa dimuat. Pastikan backend aktif.')
      return
    }

    setReservationError('')
    setIsSubmittingReservation(true)

    try {
      const nextReservation = await createReservation(user.token, {
        complaint: draft.complaint || 'Belum ada keluhan tambahan.',
        date: draft.date,
        doctorId: draft.doctorId,
        scheduleId: draft.scheduleId,
        serviceId: service.id,
        time: draft.time,
      })

      setReservations((current) => [nextReservation, ...current])
      setSelectedReservationCode(nextReservation.id)
      setDraft(emptyReservationDraft)
      navigate('reservation-detail')
    } catch (error) {
      setReservationError(error instanceof Error ? error.message : 'Reservasi gagal dikirim.')
    } finally {
      setIsSubmittingReservation(false)
    }
  }

  async function cancelReservation(id: string) {
    if (!user) {
      return
    }

    try {
      const updatedReservation = await cancelReservationRequest(user.token, id)
      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === id ? updatedReservation : reservation,
        ),
      )
    } catch {
      setReservationError('Reservasi belum bisa dibatalkan. Coba lagi sebentar.')
    }
  }

  return (
    <div className="app-shell">
      <Navbar
        accountOpen={accountOpen}
        activeNav={getActiveNav(view)}
        navigate={navigate}
        onLogout={handleLogout}
        setAccountOpen={setAccountOpen}
        startReservation={() => startReservation()}
        user={user}
      />
      <main>{renderPage()}</main>
      {view === 'login' || view === 'register' ? null : (
        <Footer navigate={navigate} serviceCategories={serviceCategories} startReservation={startReservation} />
      )}
    </div>
  )

  function renderPage() {
    if (view === 'home') {
      return (
        <Beranda
          articles={articles}
          openArticleDetail={openArticleDetail}
          openArticles={() => navigate('articles')}
          openServiceDetail={openServiceDetail}
          doctors={doctors}
          services={allServices}
          startReservation={startReservation}
        />
      )
    }

    if (view === 'services') {
      return (
        <Layanan
          activeCategoryId={activeServiceCategoryId}
          openServiceDetail={openServiceDetail}
          search={serviceSearch}
          serviceCategories={serviceCategories}
          setActiveCategoryId={setActiveServiceCategoryId}
          setSearch={setServiceSearch}
          startReservation={startReservation}
        />
      )
    }

    if (view === 'service-detail') {
      return selectedService ? (
        <DetailLayanan
          goBack={goBack}
          service={selectedService}
          serviceCategories={serviceCategories}
          startReservation={startReservation}
        />
      ) : (
        <FallbackPage
          actionLabel="Kembali ke Layanan"
          description="Layanan yang Anda buka tidak tersedia atau sudah diperbarui admin."
          onAction={() => navigate('services')}
          title="Layanan Tidak Ditemukan"
        />
      )
    }

    if (view === 'doctors') {
      return <Dokter doctors={doctors} startReservation={startReservation} />
    }

    if (view === 'articles') {
      return (
        <Artikel
          activeCategory={articleCategory}
          articles={articles}
          openArticleDetail={openArticleDetail}
          search={articleSearch}
          setActiveCategory={setArticleCategory}
          setSearch={setArticleSearch}
          startReservation={() => startReservation()}
        />
      )
    }

    if (view === 'article-detail') {
      return selectedArticle ? (
        <DetailArtikel article={selectedArticle} navigate={navigate} startReservation={() => startReservation()} />
      ) : (
        <FallbackPage
          actionLabel="Kembali ke Artikel"
          description="Artikel yang Anda buka tidak tersedia atau belum dipublikasikan."
          onAction={() => navigate('articles')}
          title="Artikel Tidak Ditemukan"
        />
      )
    }

    if (view === 'about') {
      return <TentangKami startReservation={() => startReservation()} />
    }

    if (view === 'contact') {
      return <Kontak startReservation={() => startReservation()} />
    }

    if (view === 'login' || view === 'register') {
      return (
        <AuthPage
          authDraft={authDraft}
          authError={authError}
          authPassword={authPassword}
          mode={view}
          navigate={navigate}
          onSubmit={() => handleAuthSubmit(view)}
          setAuthDraft={setAuthDraft}
          setAuthError={setAuthError}
          setAuthPassword={setAuthPassword}
        />
      )
    }

    if (view === 'reservation') {
      return user ? (
        <Reservasi
          draft={draft}
          goBack={() => navigate(previousView === 'login' || previousView === 'register' ? 'home' : previousView)}
          isLoadingSchedules={isLoadingSchedules}
          isSubmitting={isSubmittingReservation}
          reservationError={reservationError}
          reservationStep={reservationStep}
          doctors={doctors}
          schedules={schedules}
          serviceCategories={serviceCategories}
          setDraft={setDraft}
          setReservationStep={setReservationStep}
          submitReservation={submitReservation}
        />
      ) : (
        <AuthGate navigate={navigate} />
      )
    }

    if (view === 'profile') {
      return user ? (
        <ProfilSaya
          isEditing={isProfileEditing}
          profile={user.profile}
          profileDraft={profileDraft}
          saveProfile={() => {
            setUser((currentUser) =>
              currentUser ? { ...currentUser, profile: profileDraft } : currentUser,
            )
            setIsProfileEditing(false)
          }}
          setIsEditing={setIsProfileEditing}
          setProfileDraft={setProfileDraft}
        />
      ) : (
        <AuthGate navigate={navigate} />
      )
    }

    if (view === 'history') {
      return user ? (
        <RiwayatReservasi
          openDetail={(code) => {
            setSelectedReservationCode(code)
            navigate('reservation-detail')
          }}
          reservations={reservations}
        />
      ) : (
        <AuthGate navigate={navigate} />
      )
    }

    return user && selectedReservation ? (
      <DetailReservasi
        cancelReservation={cancelReservation}
        goBack={() => navigate('history')}
        reservation={selectedReservation}
        startReservation={startReservation}
      />
    ) : user ? (
      <FallbackPage
        actionLabel="Kembali ke Riwayat"
        description="Reservasi ini tidak tersedia atau sudah tidak dapat dibuka."
        onAction={() => navigate('history')}
        title="Reservasi Tidak Ditemukan"
      />
    ) : (
      <AuthGate navigate={navigate} />
    )
  }
}

export default App
