import type {
  AdminArticle,
  AdminDoctor,
  AdminReservation,
  AdminReservationStatus,
  AdminScheduleSlot,
  AdminScheduleStatus,
  AdminService,
  AdminServiceCategory,
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

type ApiUser = {
  id: string
  name: string
  email: string
  role: string
}

type AuthResponse = {
  token: string
  user: ApiUser
}

type ApiReservation = {
  id: string
  code?: string | null
  serviceId: string
  doctorId: string
  date: string
  time: string
  complaint?: string | null
  status: string
  user: {
    id: string
    name: string
    email: string
    phone?: string | null
  }
  service: {
    id: string
    title: string
  }
  doctor: {
    id: string
    name: string
  }
}

type ApiArticle = {
  id: string
  title: string
  category: string
  excerpt: string
  content: string
  imageUrl?: string | null
  isPublished: boolean
  updatedAt: string
}

type ApiDoctor = {
  id: string
  name: string
  role: string
  photoUrl?: string | null
  note?: string | null
  isActive: boolean
}

type ApiService = {
  id: string
  categoryId: string
  title: string
  description: string
  estimatedDuration: string
  price?: string | null
  isActive: boolean
  category?: ApiServiceCategorySummary
}

type ApiServiceCategorySummary = {
  id: string
  name: string
  iconKey?: string | null
  sortOrder: number
}

type ApiServiceCategory = {
  id: string
  name: string
  iconKey?: string | null
  sortOrder: number
  services: ApiService[]
}

type ApiSchedule = {
  id: string
  doctorId: string
  date: string
  time: string
  status: string
  doctor: {
    id: string
    name: string
  }
  reservations?: Array<{
    code?: string | null
    service: {
      title: string
    }
    user: {
      name: string
    }
  }>
}

type RequestOptions = RequestInit & {
  token?: string
}

const statusToView: Record<string, AdminReservationStatus> = {
  CANCELLED: 'Dibatalkan',
  COMPLETED: 'Selesai',
  CONFIRMED: 'Dikonfirmasi',
  PENDING: 'Menunggu Konfirmasi',
  RESCHEDULED: 'Dikonfirmasi',
}

const statusToApi: Record<AdminReservationStatus, string> = {
  Dibatalkan: 'CANCELLED',
  Dikonfirmasi: 'CONFIRMED',
  'Menunggu Konfirmasi': 'PENDING',
  Selesai: 'COMPLETED',
}

const scheduleStatusToView: Record<string, AdminScheduleStatus> = {
  AVAILABLE: 'Tersedia',
  FULL: 'Penuh',
  OFF: 'Libur',
}

const scheduleStatusToApi: Record<AdminScheduleStatus, string> = {
  Libur: 'OFF',
  Penuh: 'FULL',
  Tersedia: 'AVAILABLE',
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers)

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(error?.message ?? 'Permintaan ke server gagal')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export async function loginAdmin(email: string, password: string) {
  const response = await request<AuthResponse>('/api/auth/admin/login', {
    body: JSON.stringify({ email, password }),
    method: 'POST',
  })

  if (response.user.role !== 'ADMIN' && response.user.role !== 'DOCTOR') {
    throw new Error('Akses admin tidak valid.')
  }

  return response
}

export async function getAdminReservations(token: string) {
  const reservations = await request<ApiReservation[]>('/api/reservations', { token })

  return reservations.map(toAdminReservation)
}

export async function updateAdminReservationStatus(
  token: string,
  id: string,
  status: AdminReservationStatus,
) {
  const reservation = await request<ApiReservation>(`/api/reservations/${id}/status`, {
    body: JSON.stringify({ status: statusToApi[status] }),
    method: 'PUT',
    token,
  })

  return toAdminReservation(reservation)
}

export async function rescheduleAdminReservation(
  token: string,
  id: string,
  date: string,
  time: string,
) {
  const reservation = await request<ApiReservation>(`/api/reservations/${id}/reschedule`, {
    body: JSON.stringify({ date, time }),
    method: 'PUT',
    token,
  })

  return toAdminReservation(reservation)
}

export async function getAdminArticles(token: string) {
  const articles = await request<ApiArticle[]>('/api/articles/admin', { token })

  return articles.map(toAdminArticle)
}

export async function saveAdminArticle(
  token: string,
  article: AdminArticle,
  imageFile?: File | null,
) {
  const formData = new FormData()
  formData.set('title', article.title)
  formData.set('category', article.category)
  formData.set('excerpt', article.excerpt)
  formData.set('content', article.content)
  formData.set('isPublished', String(article.status === 'Published'))

  if (imageFile) {
    formData.set('image', imageFile)
  }

  const articleId = article.id.trim()
  const savedArticle = await request<ApiArticle>(articleId ? `/api/articles/${articleId}` : '/api/articles', {
    body: formData,
    method: articleId ? 'PUT' : 'POST',
    token,
  })

  return toAdminArticle(savedArticle)
}

export async function deleteAdminArticle(token: string, id: string) {
  await request<void>(`/api/articles/${id}`, {
    method: 'DELETE',
    token,
  })
}

export async function getAdminServiceCatalog(token: string) {
  const categories = await request<ApiServiceCategory[]>('/api/services/admin', { token })
  const services = categories.flatMap((category) =>
    category.services.map((service) => toAdminService(service, category)),
  )

  return {
    categories: categories.map(toAdminServiceCategory),
    services,
  }
}

export async function saveAdminService(token: string, service: AdminService) {
  const payload = {
    categoryId: service.categoryId,
    description: service.description,
    estimatedDuration: service.duration,
    isActive: service.isActive,
    price: service.price,
    title: service.title,
  }
  const serviceId = service.id.trim()
  const savedService = await request<ApiService>(serviceId ? `/api/services/${serviceId}` : '/api/services', {
    body: JSON.stringify(payload),
    method: serviceId ? 'PUT' : 'POST',
    token,
  })

  return toAdminService(savedService, savedService.category)
}

export async function deleteAdminService(token: string, id: string) {
  await request<void>(`/api/services/${id}`, {
    method: 'DELETE',
    token,
  })
}

export async function createAdminServiceCategory(
  token: string,
  payload: { name: string; iconKey: string },
  iconFile?: File | null,
) {
  const formData = new FormData()
  formData.set('name', payload.name)
  formData.set('iconKey', payload.iconKey)

  if (iconFile) {
    formData.set('icon', iconFile)
  }

  const category = await request<ApiServiceCategory>('/api/services/categories', {
    body: formData,
    method: 'POST',
    token,
  })

  return toAdminServiceCategory(category)
}

export async function getAdminDoctors(token: string) {
  const doctors = await request<ApiDoctor[]>('/api/doctors/admin', { token })

  return doctors.map(toAdminDoctor)
}

export async function saveAdminDoctor(
  token: string,
  doctor: AdminDoctor,
  photoFile?: File | null,
) {
  const formData = new FormData()
  formData.set('name', doctor.name)
  formData.set('role', doctor.role)
  formData.set('photoUrl', doctor.photoName)
  formData.set('note', doctor.note)
  formData.set('isActive', String(doctor.isActive))

  if (photoFile) {
    formData.set('photo', photoFile)
  }

  const doctorId = doctor.id.trim()
  const savedDoctor = await request<ApiDoctor>(doctorId ? `/api/doctors/${doctorId}` : '/api/doctors', {
    body: formData,
    method: doctorId ? 'PUT' : 'POST',
    token,
  })

  return toAdminDoctor(savedDoctor)
}

export async function deleteAdminDoctor(token: string, id: string) {
  await request<void>(`/api/doctors/${id}`, {
    method: 'DELETE',
    token,
  })
}

export async function getAdminSchedules(token: string) {
  const schedules = await request<ApiSchedule[]>('/api/schedules/admin', { token })

  return schedules.map(toAdminSchedule)
}

export async function saveAdminSchedule(token: string, slot: AdminScheduleSlot) {
  const payload = {
    doctorId: slot.doctorId,
    date: slot.date,
    note: '',
    status: scheduleStatusToApi[slot.status],
    time: slot.time,
  }
  const slotId = slot.id.trim()
  const savedSchedule = await request<ApiSchedule>(slotId ? `/api/schedules/${slotId}` : '/api/schedules', {
    body: JSON.stringify(payload),
    method: slotId ? 'PUT' : 'POST',
    token,
  })

  return toAdminSchedule(savedSchedule)
}

export async function updateAdminScheduleDayStatus(
  token: string,
  doctorId: string,
  date: string,
  status: AdminScheduleStatus,
) {
  const schedules = await request<ApiSchedule[]>('/api/schedules/day/status', {
    body: JSON.stringify({
      date,
      doctorId,
      status: scheduleStatusToApi[status],
    }),
    method: 'PUT',
    token,
  })

  return schedules.map(toAdminSchedule)
}

export async function deleteAdminSchedule(token: string, id: string) {
  await request<void>(`/api/schedules/${id}`, {
    method: 'DELETE',
    token,
  })
}

function toAdminReservation(reservation: ApiReservation): AdminReservation {
  const status = statusToView[reservation.status] ?? 'Menunggu Konfirmasi'

  return {
    code: reservation.code ?? reservation.id,
    complaint: reservation.complaint || 'Belum ada keluhan tambahan.',
    customer: reservation.user.name,
    customerWhatsappUrl: createCustomerWhatsappUrl(reservation, status),
    date: reservation.date.slice(0, 10),
    doctor: reservation.doctor.name,
    id: reservation.id,
    phone: reservation.user.phone ?? '-',
    service: reservation.service.title,
    status,
    time: reservation.time,
  }
}

function createCustomerWhatsappUrl(reservation: ApiReservation, status: AdminReservationStatus) {
  const phone = normalizeWhatsappNumber(reservation.user.phone ?? '')
  const message = [
    'Halo, ini Vlanda Dental.',
    `Reservasi ${reservation.code ?? reservation.id} saat ini: ${status}.`,
    `Layanan: ${reservation.service.title}`,
    `Dokter: ${reservation.doctor.name}`,
    `Tanggal: ${reservation.date.slice(0, 10)}`,
    `Jam: ${reservation.time}`,
  ].join('\n')

  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : ''
}

function normalizeWhatsappNumber(value: string) {
  const digits = value.replace(/\D/g, '')

  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`
  }

  return digits
}

function toAdminSchedule(schedule: ApiSchedule): AdminScheduleSlot {
  const reservation = schedule.reservations?.[0]

  return {
    bookedBy: reservation?.user.name,
    bookingCode: reservation?.code ?? undefined,
    date: schedule.date.slice(0, 10),
    day: formatDay(schedule.date),
    doctorId: schedule.doctorId,
    doctorName: schedule.doctor.name,
    id: schedule.id,
    serviceTitle: reservation?.service.title,
    status: scheduleStatusToView[schedule.status] ?? 'Tersedia',
    time: schedule.time,
  }
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date(value))
}

function toAdminDoctor(doctor: ApiDoctor): AdminDoctor {
  return {
    id: doctor.id,
    isActive: doctor.isActive,
    name: doctor.name,
    note: doctor.note ?? '',
    photoName: doctor.photoUrl?.startsWith('/uploads') ? `${API_BASE_URL}${doctor.photoUrl}` : doctor.photoUrl ?? '',
    role: doctor.role,
  }
}

function toAdminService(service: ApiService, category?: ApiServiceCategorySummary): AdminService {
  return {
    category: category?.name ?? service.category?.name ?? '',
    categoryId: service.categoryId,
    description: service.description,
    duration: service.estimatedDuration,
    id: service.id,
    isActive: service.isActive,
    price: service.price ?? '',
    title: service.title,
  }
}

function toAdminServiceCategory(category: ApiServiceCategory): AdminServiceCategory {
  return {
    iconKey: category.iconKey ?? 'tooth',
    id: category.id,
    name: category.name,
    sortOrder: category.sortOrder,
  }
}

function toAdminArticle(article: ApiArticle): AdminArticle {
  return {
    category: article.category,
    content: article.content,
    excerpt: article.excerpt,
    id: article.id,
    imageName: article.imageUrl ?? '',
    status: article.isPublished ? 'Published' : 'Draft',
    title: article.title,
    updatedAt: article.updatedAt.slice(0, 10),
  }
}
