import type { Reservation } from '../types'

export const initialReservations: Reservation[] = [
  {
    id: 'mock-rsv-001',
    code: 'RSV-001',
    serviceId: 'scaling',
    serviceTitle: 'Scaling Gigi',
    doctorId: 'linda',
    doctorName: 'drg. Linda Agustin Ekawati',
    date: '2026-09-15',
    time: '16.30',
    status: 'Dikonfirmasi',
    complaint: 'Gigi terasa ngilu saat makan atau minum.',
  },
  {
    id: 'mock-rsv-002',
    code: 'RSV-002',
    serviceId: 'pemeriksaan-klinis',
    serviceTitle: 'Pemeriksaan Klinis',
    doctorId: 'ervinda',
    doctorName: 'drg. Ervinda Yuliawati',
    date: '2026-09-02',
    time: '08.00',
    status: 'Selesai',
    complaint: 'Kontrol rutin dan pemeriksaan kondisi gigi.',
  },
]
