import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import fs from 'node:fs'
import path from 'node:path'

const prisma = new PrismaClient()

const categories = [
  { id: 'consultation', name: 'Pemeriksaan & Konsultasi', iconKey: 'consultation', sortOrder: 1 },
  { id: 'orthodonti', name: 'Orthodonti', iconKey: 'orthodonti', sortOrder: 2 },
  { id: 'dentures', name: 'Gigi Tiruan', iconKey: 'denture', sortOrder: 3 },
  { id: 'adult-care', name: 'Perawatan Gigi Dewasa', iconKey: 'adult-tooth', sortOrder: 4 },
  { id: 'kids-care', name: 'Perawatan Gigi Anak', iconKey: 'child-tooth', sortOrder: 5 },
]

const services = [
  ['pemeriksaan-klinis', 'consultation', 'Pemeriksaan Klinis', 'Pemeriksaan kondisi gigi dan mulut secara menyeluruh.', '20 Menit'],
  ['konsultasi-gigi', 'consultation', 'Konsultasi Gigi', 'Diskusi keluhan gigi bersama dokter sebelum tindakan.', '20 Menit'],
  ['orthodonti-classic', 'orthodonti', 'Orthodonti Classic', 'Perawatan behel konvensional untuk merapikan gigi.', '1 Jam'],
  ['orthodonti-self-ligating', 'orthodonti', 'Orthodonti Self Ligating', 'Perawatan behel dengan sistem self ligating.', '1 Jam'],
  ['orthodonti-ceramik', 'orthodonti', 'Orthodonti Ceramik', 'Perawatan behel dengan bahan keramik yang lebih estetik.', '1 Jam'],
  ['kontrol-ortho', 'orthodonti', 'Kontrol Ortho', 'Kontrol rutin perawatan orthodonti.', '15-30 Menit'],
  ['lepas-bracket', 'orthodonti', 'Lepas Bracket', 'Proses pelepasan behel oleh dokter gigi.', '30 Menit'],
  ['retainer-post-ortho', 'orthodonti', 'Retainer Post Ortho', 'Pembuatan retainer setelah perawatan orthodonti.', '25 Menit'],
  ['crown', 'dentures', 'Crown', 'Pembuatan mahkota gigi tiruan dengan hasil natural.', '30 Menit'],
  ['inlay', 'dentures', 'Inlay', 'Restorasi gigi tidak langsung untuk kerusakan tertentu.', '30 Menit'],
  ['onlay', 'dentures', 'Onlay', 'Gigi tiruan jadi 5- hari.', '30 Menit'],
  ['gigi-tiruan-jembatan', 'dentures', 'Gigi Tiruan Jembatan', 'Gigi tiruan jadi 5-7 hari.', '30 Menit'],
  ['akrilik', 'dentures', 'Akrilik', 'Gigi tiruan lepasan berbahan akrilik.', '30 Menit'],
  ['valplast', 'dentures', 'Valplas', 'Gigi tiruan fleksibel dengan tampilan lebih estetis.', '30 Menit'],
  ['termosen', 'dentures', 'Termosen', 'Gigi tiruan jadi 5- hari.', '30 Menit'],
  ['flexible-resin-denture', 'dentures', 'Flexible resin denture', 'Gigi tiruan jadi 5-7 hari.', '30 Menit'],
  ['pemeriksaan-gigi-sakit', 'adult-care', 'Pemeriksaan Gigi Sakit', 'Pemeriksaan awal untuk menentukan penyebab nyeri gigi.', '25 Menit'],
  ['drainase-abses', 'adult-care', 'Drainase abses', 'Tindakan drainase abses sesuai indikasi dokter.', '25 Menit'],
  ['scaling', 'adult-care', 'Scalling', 'Membersihkan karang gigi agar mulut terasa lebih segar.', '30 Menit'],
  ['dental-spa', 'adult-care', 'Dental Spa', 'Perawatan kebersihan gigi dengan sentuhan nyaman.', '30 Menit'],
  ['bleaching', 'adult-care', 'Bleaching', 'Perawatan untuk membantu mencerahkan warna gigi.', '1 Jam'],
  ['penambahan-gigi-depan', 'adult-care', 'Penambahan gigi depan', 'Perawatan penambahan gigi bagian depan.', '30 Menit'],
  ['penambahan-gigi-belakang', 'adult-care', 'Penambahan gigi belakang', 'Perawatan penambahan gigi bagian belakang.', '30 Menit'],
  ['perawatan-saluran-akar', 'adult-care', 'Perawatan saluran akar (PSA, mumifikasi akar)', 'Perawatan saluran akar sesuai indikasi dokter.', '30 Menit'],
  ['pencabutan-gigi', 'adult-care', 'Pencabutan Gigi', 'Tindakan pencabutan gigi sesuai indikasi dokter.', '30 Menit'],
  ['lepas-jahitan', 'adult-care', 'Lepas Jahitan (AFF jahitan)', 'Pelepasan jahitan setelah tindakan.', '30 Menit'],
  ['penghalusan-gigi-tajam', 'adult-care', 'Penghalusan gigi tajam (Selektive Grinding)', 'Penghalusan bagian gigi yang tajam.', '30 Menit'],
  ['operkulektomi', 'adult-care', 'Operkulektomi', 'Tindakan operkulektomi sesuai indikasi dokter.', '30 Menit'],
  ['gingivektomi', 'adult-care', 'Gingivektomi', 'Tindakan gingivektomi sesuai indikasi dokter.', '30 Menit'],
  ['pemeriksaan-anak', 'kids-care', 'Pemeriksaan Gigi Sakit', 'Pemeriksaan gigi anak dengan pendekatan ramah.', '25 Menit'],
  ['drainase-abses-anak', 'kids-care', 'Drainase abses', 'Tindakan drainase abses pada anak sesuai indikasi dokter.', '25 Menit'],
  ['scalling-anak', 'kids-care', 'Scalling', 'Membersihkan karang gigi anak agar mulut lebih sehat.', '30 Menit'],
  ['imunisasi-gigi-anak', 'kids-care', 'Imunisasi gigi anak', 'Perawatan perlindungan gigi anak sesuai kebutuhan.', '25 Menit'],
  ['pulpotomi', 'kids-care', 'Pulpotomi', 'Perawatan pulpa gigi anak sesuai indikasi dokter.', '25 Menit'],
  ['pulpektomi', 'kids-care', 'Pulpektomi', 'Perawatan pulpa gigi anak sesuai indikasi dokter.', '25 Menit'],
  ['tambal-gic', 'kids-care', 'Tambal GIC', 'Penambalan gigi anak memakai bahan glass ionomer.', '25 Menit'],
  ['tambal-komposit-anak', 'kids-care', 'Tambal komposit', 'Penambalan gigi anak menggunakan bahan komposit.', '25 Menit'],
  ['pencabutan-gigi-susu', 'kids-care', 'Pencabutan Gigi Susu', 'Pencabutan gigi susu bila sudah waktunya atau bermasalah.', '25 Menit'],
  ['fisure-sealent', 'kids-care', 'Fisure sealent', 'Perawatan perlindungan permukaan gigi anak.', '25 Menit'],
  ['prr', 'kids-care', 'PRR', 'Perawatan restoratif preventif sesuai indikasi dokter.', '25 Menit'],
]

async function main() {
  fs.mkdirSync('uploads/doctors', { recursive: true })
  const doctorAssets = [
    ['../customer/src/assets/drg linda.png', 'uploads/doctors/drg-linda.png'],
    ['../customer/src/assets/drg vinda.png', 'uploads/doctors/drg-vinda.png'],
  ] as const

  for (const [source, target] of doctorAssets) {
    const sourcePath = path.resolve(process.cwd(), source)
    const targetPath = path.resolve(process.cwd(), target)

    if (fs.existsSync(sourcePath) && !fs.existsSync(targetPath)) {
      fs.copyFileSync(sourcePath, targetPath)
    }
  }

  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD ?? 'admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL ?? 'admin@vlandadental.com' },
    update: {
      name: 'Admin Vlanda Dental',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
    create: {
      id: 'user-admin',
      name: 'Admin Vlanda Dental',
      email: process.env.ADMIN_EMAIL ?? 'admin@vlandadental.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  })

  await prisma.user.upsert({
    where: { email: 'customer@vlandadental.com' },
    update: {
      name: 'Customer Demo',
      phone: '081335455194',
      role: 'CUSTOMER',
    },
    create: {
      id: 'user-customer',
      name: 'Customer Demo',
      email: 'customer@vlandadental.com',
      phone: '081335455194',
      passwordHash: await bcrypt.hash('customer123', 10),
      role: 'CUSTOMER',
    },
  })

  await prisma.doctor.upsert({
    where: { id: 'linda' },
    update: {
      isActive: true,
      name: 'drg. Linda Agustin Ekawati',
      note: 'Berpengalaman menangani pemeriksaan, scaling, dan konsultasi keluarga.',
      photoUrl: '/uploads/doctors/drg-linda.png',
      role: 'Dokter Gigi Umum',
    },
    create: {
      id: 'linda',
      name: 'drg. Linda Agustin Ekawati',
      role: 'Dokter Gigi Umum',
      photoUrl: '/uploads/doctors/drg-linda.png',
      note: 'Berpengalaman menangani pemeriksaan, scaling, dan konsultasi keluarga.',
    },
  })

  await prisma.doctor.upsert({
    where: { id: 'ervinda' },
    update: {
      isActive: true,
      name: 'drg. Ervinda Yuliawati',
      note: 'Fokus pada pendekatan ramah untuk pasien dewasa maupun anak.',
      photoUrl: '/uploads/doctors/drg-vinda.png',
      role: 'Dokter Gigi Umum',
    },
    create: {
      id: 'ervinda',
      name: 'drg. Ervinda Yuliawati',
      role: 'Dokter Gigi Umum',
      photoUrl: '/uploads/doctors/drg-vinda.png',
      note: 'Fokus pada pendekatan ramah untuk pasien dewasa maupun anak.',
    },
  })

  for (const category of categories) {
    await prisma.serviceCategory.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    })
  }

  const serviceOrderByCategory = new Map<string, number>()

  for (const [id, categoryId, title, description, estimatedDuration] of services) {
    const sortOrder = (serviceOrderByCategory.get(categoryId) ?? 0) + 1
    serviceOrderByCategory.set(categoryId, sortOrder)
    const service = { id, categoryId, title, description, estimatedDuration, isActive: true, sortOrder }

    await prisma.service.upsert({
      where: { id },
      update: service,
      create: service,
    })
  }

  const slots = createDoctorSlots(getTodayUtc(), 60)

  for (const { id, doctorId, date, time, status } of slots) {
    const scheduleDate = new Date(date)

    await prisma.doctorSchedule.upsert({
      where: {
        doctorId_date_time: {
          date: scheduleDate,
          doctorId,
          time,
        },
      },
      update: {},
      create: { id, doctorId, date: scheduleDate, time, status },
    })
  }

  await prisma.article.upsert({
    where: { slug: 'cara-menjaga-kesehatan-gigi-sehari-hari' },
    update: {
      authorId: admin.id,
      category: 'Tips & Edukasi',
      content: [
        'Menjaga kesehatan gigi bisa dimulai dari kebiasaan sederhana setiap hari.',
        'Sikat gigi dua kali sehari, kurangi makanan terlalu manis, dan lakukan pemeriksaan rutin agar masalah dapat ditemukan lebih awal.',
      ].join('\n'),
      excerpt: 'Kebiasaan sederhana untuk membantu menjaga kesehatan gigi dan mulut.',
      isPublished: true,
      publishedAt: new Date(),
      title: 'Cara Menjaga Kesehatan Gigi Sehari-hari',
    },
    create: {
      authorId: admin.id,
      category: 'Tips & Edukasi',
      content: [
        'Menjaga kesehatan gigi bisa dimulai dari kebiasaan sederhana setiap hari.',
        'Sikat gigi dua kali sehari, kurangi makanan terlalu manis, dan lakukan pemeriksaan rutin agar masalah dapat ditemukan lebih awal.',
      ].join('\n'),
      excerpt: 'Kebiasaan sederhana untuk membantu menjaga kesehatan gigi dan mulut.',
      isPublished: true,
      publishedAt: new Date(),
      slug: 'cara-menjaga-kesehatan-gigi-sehari-hari',
      title: 'Cara Menjaga Kesehatan Gigi Sehari-hari',
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })

function createDoctorSlots(startDate: Date, totalDays: number) {
  const slots: Array<{ id: string; doctorId: string; date: string; time: string; status: string }> = []

  for (let dayOffset = 0; dayOffset < totalDays; dayOffset += 1) {
    const date = new Date(startDate)
    date.setUTCDate(startDate.getUTCDate() + dayOffset)
    const day = date.getUTCDay()
    const dateKey = date.toISOString().slice(0, 10)

    const lindaRanges: Array<readonly [string, string]> = day === 0 || day === 6
      ? [['07.30', '12.00'], ['15.00', '20.30']]
      : [['15.00', '20.30']]
    addSlots(slots, 'linda', dateKey, lindaRanges)

    if (day === 0 || day === 6) {
      addSlots(slots, 'ervinda', dateKey, [['07.30', '12.00'], ['15.00', '20.30']])
    }
  }

  return slots
}

function getTodayUtc() {
  const date = new Date()
  date.setUTCHours(0, 0, 0, 0)

  return date
}

function addSlots(
  slots: Array<{ id: string; doctorId: string; date: string; time: string; status: string }>,
  doctorId: string,
  date: string,
  ranges: Array<readonly [string, string]>,
) {
  for (const [start, end] of ranges) {
    let minutes = toMinutes(start)
    const endMinutes = toMinutes(end)

    while (minutes < endMinutes) {
      const time = toTime(minutes)
      slots.push({
        date: `${date}T00:00:00.000Z`,
        doctorId,
        id: `slot-${doctorId}-${date}-${time.replace('.', '')}`,
        status: 'AVAILABLE',
        time,
      })
      minutes += 30
    }
  }
}

function toMinutes(time: string) {
  const [hour, minute] = time.split('.').map(Number)

  return hour * 60 + minute
}

function toTime(totalMinutes: number) {
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60

  return `${String(hour).padStart(2, '0')}.${String(minute).padStart(2, '0')}`
}
