import type { IconName, ReservationDraft, ReservationStatus, View } from '../types'

export function getActiveNav(view: View) {
  if (view === 'service-detail') {
    return 'services'
  }

  if (view === 'article-detail') {
    return 'articles'
  }

  if (['profile', 'history', 'reservation-detail', 'login', 'register', 'reservation'].includes(view)) {
    return undefined
  }

  return view
}

export function getCategoryIcon(categoryId: string): IconName {
  if (categoryId === 'consultation') {
    return 'chat'
  }

  if (categoryId === 'kids-care') {
    return 'spark'
  }

  return 'tooth'
}

export function statusClass(status: ReservationStatus) {
  if (status === 'Menunggu Konfirmasi') {
    return 'waiting'
  }

  if (status === 'Dikonfirmasi') {
    return 'confirmed'
  }

  if (status === 'Selesai') {
    return 'finished'
  }

  return 'cancelled'
}

export function validateReservationStep(step: number, draft: ReservationDraft) {
  if (step === 0) {
    return Boolean(draft.serviceId)
  }

  if (step === 1) {
    return Boolean(draft.doctorId)
  }

  if (step === 2) {
    return Boolean(draft.date)
  }

  if (step === 3) {
    return Boolean(draft.scheduleId && draft.time)
  }

  if (step === 4) {
    return Boolean(draft.name && draft.email && draft.phone)
  }

  return true
}
