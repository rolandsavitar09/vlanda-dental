import { env } from '../config/env.js'

type ReservationNotification = {
  code?: string | null
  customerName: string
  customerPhone?: string | null
  date: Date
  doctorName: string
  serviceTitle: string
  status?: string
  time: string
}

export const normalizeWhatsappNumber = (value?: string | null) => {
  if (!value) return ''

  const digits = value.replace(/\D/g, '')

  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`
  }

  return digits
}

export const createWhatsappLink = (phone: string, message: string) =>
  `https://wa.me/${normalizeWhatsappNumber(phone)}?text=${encodeURIComponent(message)}`

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date)

const formatStatus = (status?: string) => {
  const statusMap: Record<string, string> = {
    CANCELLED: 'Dibatalkan',
    COMPLETED: 'Selesai',
    CONFIRMED: 'Dikonfirmasi',
    PENDING: 'Menunggu Konfirmasi',
    RESCHEDULED: 'Dijadwalkan Ulang',
  }

  return status ? statusMap[status] ?? status : '-'
}

const postWhatsappMessage = async (to: string | null | undefined, message: string) => {
  const normalizedPhone = normalizeWhatsappNumber(to)

  if (!normalizedPhone || !env.whatsappApiUrl || !env.whatsappApiToken) {
    return
  }

  try {
    await fetch(env.whatsappApiUrl, {
      body: JSON.stringify({ message, to: normalizedPhone }),
      headers: {
        Authorization: `Bearer ${env.whatsappApiToken}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
  } catch (error) {
    console.error('WhatsApp notification failed:', error)
  }
}

export const notifyAdminNewReservation = async (reservation: ReservationNotification) => {
  const message = [
    'Reservasi baru Vlanda Dental',
    `Kode: ${reservation.code ?? '-'}`,
    `Customer: ${reservation.customerName}`,
    `Layanan: ${reservation.serviceTitle}`,
    `Dokter: ${reservation.doctorName}`,
    `Tanggal: ${formatDate(reservation.date)}`,
    `Jam: ${reservation.time}`,
  ].join('\n')

  await postWhatsappMessage(env.adminWhatsappNumber, message)
}

export const notifyCustomerReservationUpdate = async (reservation: ReservationNotification) => {
  const message = [
    'Update reservasi Vlanda Dental',
    `Kode: ${reservation.code ?? '-'}`,
    `Status: ${formatStatus(reservation.status)}`,
    `Layanan: ${reservation.serviceTitle}`,
    `Dokter: ${reservation.doctorName}`,
    `Tanggal: ${formatDate(reservation.date)}`,
    `Jam: ${reservation.time}`,
  ].join('\n')

  await postWhatsappMessage(reservation.customerPhone, message)
}
