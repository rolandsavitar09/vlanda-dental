export type View =
  | 'home'
  | 'services'
  | 'service-detail'
  | 'doctors'
  | 'articles'
  | 'article-detail'
  | 'about'
  | 'contact'
  | 'login'
  | 'register'
  | 'reservation'
  | 'profile'
  | 'history'
  | 'reservation-detail'

export type IconName =
  | 'arrow'
  | 'calendar'
  | 'chat'
  | 'check'
  | 'clock'
  | 'heart'
  | 'location'
  | 'phone'
  | 'shield'
  | 'spark'
  | 'tooth'
  | 'user'
  | 'users'

export type NavItem = {
  label: string
  view: View
}

export type Service = {
  id: string
  title: string
  description: string
  duration: string
  categoryId: string
  price: string
}

export type ServiceCategory = {
  id: string
  title: string
  icon: IconName
  iconKey?: string
  iconUrl?: string
  services: Service[]
}

export type Doctor = {
  id: string
  name: string
  role: string
  initials: string
  photo: string
  schedule: DoctorSchedule[]
  note: string
}

export type DoctorSchedule = {
  day: string
  detail: string
}

export type Article = {
  id: string
  slug: string
  title: string
  category: string
  date: string
  excerpt: string
  content: string
  imageUrl: string
}

export type UserProfile = {
  name: string
  email: string
  phone: string
  birthDate: string
}

export type User = {
  id: string
  token: string
  role: string
  profile: UserProfile
}

export type ReservationStatus =
  | 'Menunggu Konfirmasi'
  | 'Dikonfirmasi'
  | 'Selesai'
  | 'Dibatalkan'

export type Reservation = {
  id: string
  code: string
  serviceId: string
  serviceTitle: string
  doctorId: string
  doctorName: string
  date: string
  time: string
  status: ReservationStatus
  complaint: string
}

export type ReservationDraft = {
  serviceId: string
  doctorId: string
  scheduleId: string
  date: string
  time: string
  name: string
  email: string
  phone: string
  birthDate: string
  complaint: string
}

export type ReservationTimeOption = {
  id: string
  status: string
  time: string
}
