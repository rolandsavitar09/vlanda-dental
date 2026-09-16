import type {
  Article,
  Doctor,
  IconName,
  Reservation,
  ReservationStatus,
  ServiceCategory,
  User,
  UserProfile,
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

type ApiUser = {
  id: string
  name: string
  email: string
  phone?: string | null
  role: string
}

type AuthResponse = {
  token: string
  user: ApiUser
}

type ApiDoctor = {
  id: string
  name: string
  role: string
  photoUrl?: string | null
  note?: string | null
  isActive?: boolean
}

type ApiReservationService = {
  id: string
  title: string
}

type ApiCatalogService = {
  id: string
  categoryId: string
  title: string
  description: string
  estimatedDuration: string
  price?: string | null
  isActive: boolean
}

type ApiServiceCategory = {
  id: string
  name: string
  iconKey?: string | null
  services: ApiCatalogService[]
}

export type ApiSchedule = {
  id: string
  doctorId: string
  date: string
  time: string
  status: 'AVAILABLE' | 'FULL' | 'OFF' | string
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
  service: ApiReservationService
  doctor: ApiDoctor
}

type ApiArticle = {
  id: string
  slug: string
  title: string
  category: string
  excerpt: string
  content: string
  imageUrl?: string | null
  publishedAt?: string | null
  updatedAt: string
}

type RequestOptions = RequestInit & {
  token?: string
}

const statusMap: Record<string, ReservationStatus> = {
  CANCELLED: 'Dibatalkan',
  COMPLETED: 'Selesai',
  CONFIRMED: 'Dikonfirmasi',
  PENDING: 'Menunggu Konfirmasi',
  RESCHEDULED: 'Dikonfirmasi',
}

const doctorScheduleMap: Record<string, Doctor['schedule']> = {
  ervinda: [
    {
      day: 'Sabtu',
      detail: 'Sesi 1: 07.30 WIB - 12.00 WIB (Lihat jadwal terlampir)\nSesi 2: 15.00 WIB - 20.30 WIB',
    },
    { day: 'Minggu', detail: 'Sesi 1: 07.30 WIB - 12.00 WIB\nSesi 2: 15.00 WIB - 20.30 WIB' },
  ],
  linda: [
    { day: 'Senin - Jumat', detail: 'Sesi 2: 15.00 WIB - 20.30 WIB' },
    {
      day: 'Sabtu - Minggu',
      detail: 'Sesi 1: 07.30 WIB - 12.00 WIB (Lihat jadwal terlampir)\nSesi 2: 15.00 WIB - 20.30 WIB',
    },
  ],
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

  return response.json() as Promise<T>
}

function toUser(response: AuthResponse): User {
  return {
    id: response.user.id,
    role: response.user.role,
    token: response.token,
    profile: {
      birthDate: '',
      email: response.user.email,
      name: response.user.name,
      phone: response.user.phone ?? '',
    },
  }
}

export async function registerCustomer(profile: UserProfile, password: string) {
  const response = await request<AuthResponse>('/api/auth/register', {
    body: JSON.stringify({
      email: profile.email,
      name: profile.name,
      password,
      phone: profile.phone,
    }),
    method: 'POST',
  })

  return toUser(response)
}

export async function loginCustomer(email: string, password: string) {
  const response = await request<AuthResponse>('/api/auth/login', {
    body: JSON.stringify({ email, password }),
    method: 'POST',
  })

  return toUser(response)
}

export async function getSchedules() {
  return request<ApiSchedule[]>('/api/schedules')
}

export async function getPublishedArticles() {
  const articles = await request<ApiArticle[]>('/api/articles?published=true')

  return articles.map(toArticle)
}

export async function getServiceCatalog() {
  const categories = await request<ApiServiceCategory[]>('/api/services')

  return categories.map(toServiceCategory)
}

export async function getDoctors() {
  const doctors = await request<ApiDoctor[]>('/api/doctors')

  return doctors.map(toDoctor)
}

export async function getReservations(token: string) {
  const reservations = await request<ApiReservation[]>('/api/reservations', { token })

  return reservations.map(toReservation)
}

export async function createReservation(
  token: string,
  payload: {
    complaint: string
    date: string
    doctorId: string
    scheduleId: string
    serviceId: string
    time: string
  },
) {
  const reservation = await request<ApiReservation>('/api/reservations', {
    body: JSON.stringify(payload),
    method: 'POST',
    token,
  })

  return toReservation(reservation)
}

export async function cancelReservationRequest(token: string, reservationId: string) {
  const reservation = await request<ApiReservation>(`/api/reservations/${reservationId}/cancel`, {
    method: 'PUT',
    token,
  })

  return toReservation(reservation)
}

function toDoctor(doctor: ApiDoctor): Doctor {
  return {
    id: doctor.id,
    initials: doctor.name
      .split(' ')
      .filter(Boolean)
      .slice(-2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase(),
    name: doctor.name,
    note: doctor.note ?? '',
    photo: doctor.photoUrl?.startsWith('/uploads') ? `${API_BASE_URL}${doctor.photoUrl}` : doctor.photoUrl ?? '',
    role: doctor.role,
    schedule: doctorScheduleMap[doctor.id] ?? [],
  }
}

function toServiceCategory(category: ApiServiceCategory): ServiceCategory {
  const iconUrl = category.iconKey?.startsWith('/uploads') ? `${API_BASE_URL}${category.iconKey}` : ''

  return {
    icon: toCategoryIcon(category.iconKey, category.id),
    iconKey: category.iconKey ?? '',
    iconUrl,
    id: category.id,
    services: category.services
      .filter((service) => service.isActive)
      .map((service) => ({
        categoryId: service.categoryId,
        description: service.description,
        duration: service.estimatedDuration,
        id: service.id,
        price: service.price ?? 'Konsultasi harga',
        title: service.title,
      })),
    title: category.name,
  }
}

function toCategoryIcon(iconKey?: string | null, categoryId?: string): IconName {
  const key = iconKey ?? categoryId ?? ''

  if (key === 'consultation') {
    return 'chat'
  }

  if (key === 'child-tooth') {
    return 'spark'
  }

  return 'tooth'
}

function toReservation(reservation: ApiReservation): Reservation {
  return {
    code: reservation.code ?? reservation.id,
    complaint: reservation.complaint || 'Belum ada keluhan tambahan.',
    date: reservation.date.slice(0, 10),
    doctorId: reservation.doctorId,
    doctorName: reservation.doctor.name,
    id: reservation.id,
    serviceId: reservation.serviceId,
    serviceTitle: reservation.service.title,
    status: statusMap[reservation.status] ?? 'Menunggu Konfirmasi',
    time: reservation.time,
  }
}

function toArticle(article: ApiArticle): Article {
  return {
    category: article.category,
    content: article.content,
    date: formatArticleDate(article.publishedAt ?? article.updatedAt),
    excerpt: article.excerpt,
    id: article.id,
    imageUrl: article.imageUrl ? `${API_BASE_URL}${article.imageUrl}` : '',
    slug: article.slug,
    title: article.title,
  }
}

function formatArticleDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}
