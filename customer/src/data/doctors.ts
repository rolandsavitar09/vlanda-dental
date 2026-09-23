import drgLinda from '../assets/drg-linda-card.png'
import drgVinda from '../assets/drg-vinda-card.png'
import type { Doctor } from '../types'

export const doctors: Doctor[] = [
  {
    id: 'ervinda',
    initials: 'EY',
    name: 'drg. Ervinda Yuliawati',
    note: 'Fokus pada pendekatan ramah untuk pasien dewasa maupun anak.',
    photo: drgVinda,
    role: 'Dokter Gigi Umum',
    schedule: [
      {
        day: 'Sabtu',
        detail: 'Sesi 1: 07.30 WIB - 12.00 WIB (Lihat jadwal terlampir)\nSesi 2: 15.30 WIB - 20.30 WIB',
      },
      { day: 'Minggu', detail: 'Sesi 1: 07.30 WIB - 12.00 WIB\nSesi 2: 15.30 WIB - 20.30 WIB' },
    ],
  },
  {
    id: 'linda',
    initials: 'LA',
    name: 'drg. Linda Agustin Ekawati',
    note: 'Berpengalaman menangani pemeriksaan, scaling, dan konsultasi keluarga.',
    photo: drgLinda,
    role: 'Dokter Gigi Umum',
    schedule: [
      { day: 'Senin - Jumat', detail: 'Sesi 2: 15.30 WIB - 20.30 WIB' },
      {
        day: 'Sabtu - Minggu',
        detail: 'Sesi 1: 07.30 WIB - 12.00 WIB (Lihat jadwal terlampir)\nSesi 2: 15.30 WIB - 20.30 WIB',
      },
    ],
  },
]
