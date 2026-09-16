export type AdminPage = 'dashboard' | 'reservations' | 'articles' | 'services' | 'doctors' | 'schedule'

export type AdminReservationStatus =
  | 'Menunggu Konfirmasi'
  | 'Dikonfirmasi'
  | 'Selesai'
  | 'Dibatalkan'

export type AdminReservation = {
  id: string
  code: string
  customer: string
  phone: string
  doctor: string
  service: string
  date: string
  time: string
  status: AdminReservationStatus
  complaint: string
  customerWhatsappUrl?: string
}

export type AdminArticleStatus = 'Draft' | 'Published'

export type AdminArticle = {
  id: string
  title: string
  category: string
  excerpt: string
  imageName: string
  content: string
  status: AdminArticleStatus
  updatedAt: string
}

export type AdminService = {
  id: string
  title: string
  categoryId: string
  category: string
  description: string
  duration: string
  price: string
  isActive: boolean
}

export type AdminServiceCategory = {
  id: string
  name: string
  iconKey: string
  sortOrder: number
}

export type AdminDoctor = {
  id: string
  name: string
  role: string
  photoName: string
  note: string
  isActive: boolean
}

export type AdminScheduleStatus = 'Tersedia' | 'Penuh' | 'Libur'

export type AdminScheduleSlot = {
  id: string
  doctorId: string
  doctorName: string
  date: string
  day: string
  time: string
  status: AdminScheduleStatus
  bookedBy?: string
  bookingCode?: string
  serviceTitle?: string
}
