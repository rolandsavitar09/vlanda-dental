import type { ReservationDraft, User } from '../types'

export const initialUser: User = {
  id: '',
  token: '',
  role: 'CUSTOMER',
  profile: {
    name: 'Roland Savitar',
    email: 'roland@email.com',
    phone: '081335455194',
    birthDate: '',
  },
}

export const emptyReservationDraft: ReservationDraft = {
  serviceId: 'scaling',
  doctorId: 'linda',
  scheduleId: '',
  date: '',
  time: '',
  name: '',
  email: '',
  phone: '',
  birthDate: '',
  complaint: '',
}
