import { Router } from 'express'
import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { requireAdmin, requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { ApiError } from '../middleware/error.js'
import { notifyAdminNewReservation, notifyCustomerReservationUpdate } from '../services/whatsapp.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getParam } from '../utils/request.js'

export const reservationsRouter = Router()

const includeReservationRelations = {
  user: { select: { id: true, name: true, email: true, phone: true } },
  service: true,
  doctor: true,
  schedule: true,
}

const getReservationDateRange = (date: string | Date) => {
  const start = new Date(date)
  start.setUTCHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)

  return { end, start }
}

const createDailyReservationCode = async (
  tx: Prisma.TransactionClient,
  date: Date,
) => {
  // Serialize code allocation per Jakarta calendar day so concurrent
  // reservations cannot calculate the same count + 1 value.
  const dayKey = jakartaDateKey(date)
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`vlanda-reservation-code:${dayKey}`}))`
  const { end, start } = getReservationDateRange(date)
  const totalToday = await tx.reservation.count({
    where: {
      date: {
        gte: start,
        lt: end,
      },
    },
  })

  return `RSV${String(totalToday + 1).padStart(4, '0')}`
}

const jakartaDateKey = (date: Date) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(date)

const parseJakartaDateTime = (date: unknown, time: unknown) => {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)
    || typeof time !== 'string' || !/^([01]\d|2[0-3])\.[0-5]\d$/.test(time)) {
    throw new ApiError(400, 'Format tanggal atau jam tidak valid')
  }
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split('.').map(Number)
  const instant = new Date(Date.UTC(year, month - 1, day, hour - 7, minute))
  if (jakartaDateKey(instant) !== date) throw new ApiError(400, 'Tanggal tidak valid')
  const now = new Date()
  const jakartaNow = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(now)
  const requested = `${date} ${time.replace('.', ':')}`
  if (requested <= jakartaNow) throw new ApiError(409, 'Jam yang sudah lewat tidak dapat dibooking')
  return new Date(Date.UTC(year, month - 1, day))
}

const parseEstimatedDuration = (value: string) => {
  const hourMatch = value.match(/(\d+)\s*jam/i)
  const minuteMatches = Array.from(value.matchAll(/(\d+)\s*menit/gi))

  if (hourMatch?.[1]) {
    return Number(hourMatch[1]) * 60
  }

  if (minuteMatches.length > 0) {
    return Math.max(...minuteMatches.map((match) => Number(match[1])))
  }

  return 30
}

const createBlockedTimes = (startTime: string, estimatedDuration: string) => {
  const blocks = Math.max(1, Math.ceil(parseEstimatedDuration(estimatedDuration) / 30))
  const [hour, minute] = startTime.split('.').map(Number)
  const startMinutes = hour * 60 + minute

  return Array.from({ length: blocks }, (_item, index) => {
    const totalMinutes = startMinutes + index * 30
    const hour = Math.floor(totalMinutes / 60)
    const minute = totalMinutes % 60

    return `${String(hour).padStart(2, '0')}.${String(minute).padStart(2, '0')}`
  })
}

const claimReservationSlots = async (
  tx: Prisma.TransactionClient,
  {
    date,
    doctorId,
    serviceDuration,
    time,
  }: {
    date: Date
    doctorId: string
    serviceDuration: string
    time: string
  },
) => {
  const blockedTimes = createBlockedTimes(time, serviceDuration)
  const schedules = await tx.doctorSchedule.findMany({
    where: {
      date,
      doctorId,
      time: { in: blockedTimes },
    },
    include: { reservations: { where: { status: { not: 'CANCELLED' } }, select: { id: true } } },
  })
  const selectedSchedule = schedules.find((schedule) => schedule.time === time)

  if (!selectedSchedule || schedules.length < blockedTimes.length
    || schedules.some((schedule) => schedule.reservations.length > 0)) {
    throw new ApiError(409, 'Slot durasi layanan ini tidak cukup tersedia')
  }

  return { blockedTimes, selectedSchedule }
}

const lockReservation = async (tx: Prisma.TransactionClient, id: string) => {
  await tx.$queryRaw`SELECT "id" FROM "Reservation" WHERE "id" = ${id} FOR UPDATE`
}

reservationsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'DOCTOR'
    const reservations = await prisma.reservation.findMany({
      where: isAdmin ? undefined : { userId: req.user?.userId },
      include: includeReservationRelations,
      orderBy: { createdAt: 'desc' },
    })

    res.json(reservations)
  }),
)

reservationsRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const { serviceId, doctorId, scheduleId, date, time, complaint } = req.body

    if (!serviceId || !doctorId || !date || !time) {
      throw new ApiError(400, 'Layanan, dokter, tanggal, dan jam wajib diisi')
    }

    const reservationDate = parseJakartaDateTime(date, time)
    const reservation = await prisma.$transaction(async (tx) => {
      const service = await tx.service.findUnique({ where: { id: serviceId } })

      if (!service) {
        throw new ApiError(404, 'Layanan tidak ditemukan')
      }

      if (!service.isActive) {
        throw new ApiError(409, 'Layanan tidak aktif')
      }

      const doctor = await tx.doctor.findUnique({ where: { id: doctorId } })

      if (!doctor || !doctor.isActive) {
        throw new ApiError(409, 'Dokter tidak tersedia')
      }

      const { blockedTimes, selectedSchedule } = await claimReservationSlots(tx, {
        date: reservationDate,
        doctorId,
        serviceDuration: service.estimatedDuration,
        time,
      })

      if (scheduleId && selectedSchedule.id !== scheduleId) {
        throw new ApiError(409, 'Jadwal tidak tersedia')
      }

      const claimed = await tx.doctorSchedule.updateMany({
        where: { date: reservationDate, doctorId, time: { in: blockedTimes }, status: 'AVAILABLE' },
        data: { note: 'claim-pending', status: 'FULL' },
      })
      if (claimed.count !== blockedTimes.length) throw new ApiError(409, 'Jadwal sudah diambil reservasi lain')

      const code = await createDailyReservationCode(tx, reservationDate)
      const nextReservation = await tx.reservation.create({
        data: {
          code,
          userId: req.user?.userId ?? '',
          serviceId,
          doctorId,
          scheduleId: selectedSchedule.id,
          date: reservationDate,
          time,
          complaint,
        },
        include: includeReservationRelations,
      })

      await tx.doctorSchedule.updateMany({
        where: { date: reservationDate, doctorId, time: { in: blockedTimes }, note: 'claim-pending' },
        data: { note: nextReservation.id },
      })

      return nextReservation
    })

    void notifyAdminNewReservation({
      code: reservation.code,
      customerName: reservation.user.name,
      customerPhone: reservation.user.phone,
      date: reservation.date,
      doctorName: reservation.doctor.name,
      serviceTitle: reservation.service.title,
      time: reservation.time,
    })

    res.status(201).json(reservation)
  }),
)

reservationsRouter.put(
  '/:id/cancel',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const reservation = await prisma.$transaction(async (tx) => {
      let currentReservation = await tx.reservation.findUnique({
        where: { id: getParam(req.params.id, 'id') },
      })

      if (!currentReservation) {
        throw new ApiError(404, 'Reservasi tidak ditemukan')
      }
      await lockReservation(tx, currentReservation.id)
      currentReservation = await tx.reservation.findUniqueOrThrow({ where: { id: currentReservation.id } })

      const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'DOCTOR'

      if (!isAdmin && currentReservation.userId !== req.user?.userId) {
        throw new ApiError(403, 'Reservasi ini bukan milik akun Anda')
      }

      if (currentReservation.status === 'COMPLETED') {
        throw new ApiError(409, 'Reservasi selesai tidak bisa dibatalkan')
      }
      if (currentReservation.status === 'CANCELLED') return tx.reservation.findUniqueOrThrow({
        where: { id: currentReservation.id }, include: includeReservationRelations,
      })

      const updatedReservation = await tx.reservation.update({
        where: { id: currentReservation.id },
        data: { status: 'CANCELLED' },
        include: includeReservationRelations,
      })

      await tx.doctorSchedule.updateMany({
        where: { note: currentReservation.id, status: 'FULL' },
        data: { note: null, status: 'AVAILABLE' },
      })

      return updatedReservation
    })

    void notifyCustomerReservationUpdate({
      code: reservation.code,
      customerName: reservation.user.name,
      customerPhone: reservation.user.phone,
      date: reservation.date,
      doctorName: reservation.doctor.name,
      serviceTitle: reservation.service.title,
      status: 'CANCELLED',
      time: reservation.time,
    })

    res.json(reservation)
  }),
)

reservationsRouter.put(
  '/:id/status',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status, adminNote } = req.body

    if (!status) throw new ApiError(400, 'Status wajib diisi')

    const reservation = await prisma.$transaction(async (tx) => {
      let currentReservation = await tx.reservation.findUnique({
        where: { id: getParam(req.params.id, 'id') },
      })

      if (!currentReservation) {
        throw new ApiError(404, 'Reservasi tidak ditemukan')
      }
      await lockReservation(tx, currentReservation.id)
      currentReservation = await tx.reservation.findUniqueOrThrow({ where: { id: currentReservation.id } })
      if (currentReservation.status === 'CANCELLED' && status !== 'CANCELLED') {
        throw new ApiError(409, 'Reservasi dibatalkan tidak dapat diaktifkan kembali')
      }

      const updatedReservation = await tx.reservation.update({
        where: { id: currentReservation.id },
        data: { status, adminNote },
        include: includeReservationRelations,
      })

      if (status === 'CANCELLED' && currentReservation.status !== 'CANCELLED') {
        await tx.doctorSchedule.updateMany({
          where: { note: currentReservation.id, status: 'FULL' },
          data: { note: null, status: 'AVAILABLE' },
        })
      }

      return updatedReservation
    })

    void notifyCustomerReservationUpdate({
      code: reservation.code,
      customerName: reservation.user.name,
      customerPhone: reservation.user.phone,
      date: reservation.date,
      doctorName: reservation.doctor.name,
      serviceTitle: reservation.service.title,
      status,
      time: reservation.time,
    })

    res.json(reservation)
  }),
)

reservationsRouter.put(
  '/:id/reschedule',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { scheduleId, date, time, adminNote } = req.body

    if (!date || !time) throw new ApiError(400, 'Tanggal dan jam wajib diisi')

    const reservation = await prisma.$transaction(async (tx) => {
      let currentReservation = await tx.reservation.findUnique({
        where: { id: getParam(req.params.id, 'id') },
      })

      if (!currentReservation) {
        throw new ApiError(404, 'Reservasi tidak ditemukan')
      }
      await lockReservation(tx, currentReservation.id)
      currentReservation = await tx.reservation.findUniqueOrThrow({ where: { id: currentReservation.id } })
      if (currentReservation.status === 'CANCELLED' || currentReservation.status === 'COMPLETED') {
        throw new ApiError(409, 'Reservasi ini tidak dapat dijadwalkan ulang')
      }

      const nextDate = parseJakartaDateTime(date, time)
      const service = await tx.service.findUnique({ where: { id: currentReservation.serviceId } })

      if (!service) {
        throw new ApiError(404, 'Layanan tidak ditemukan')
      }

      const { blockedTimes, selectedSchedule } = await claimReservationSlots(tx, {
        date: nextDate,
        doctorId: currentReservation.doctorId,
        serviceDuration: service.estimatedDuration,
        time,
      })

      if (scheduleId && selectedSchedule.id !== scheduleId) {
        throw new ApiError(409, 'Jadwal pengganti tidak tersedia')
      }

      const oldOwnedSlots = await tx.doctorSchedule.findMany({
        where: { note: currentReservation.id, status: 'FULL' }, select: { id: true, date: true, time: true },
      })
      const oldKeys = new Set(oldOwnedSlots.map((slot) => `${slot.date.toISOString()}|${slot.time}`))
      const newlyNeeded = blockedTimes.filter((slotTime) =>
        !oldKeys.has(`${nextDate.toISOString()}|${slotTime}`),
      )
      if (newlyNeeded.length) {
        const claimed = await tx.doctorSchedule.updateMany({
          where: { date: nextDate, doctorId: currentReservation.doctorId, time: { in: newlyNeeded }, status: 'AVAILABLE' },
          data: { note: currentReservation.id, status: 'FULL' },
        })
        if (claimed.count !== newlyNeeded.length) throw new ApiError(409, 'Jadwal pengganti bentrok dengan reservasi lain')
      }

      const shouldRefreshCode =
        currentReservation.date.toISOString().slice(0, 10) !== nextDate.toISOString().slice(0, 10)
      const nextCode = shouldRefreshCode
        ? await createDailyReservationCode(tx, nextDate)
        : currentReservation.code

      const updatedReservation = await tx.reservation.update({
        where: { id: currentReservation.id },
        data: {
          code: nextCode,
          scheduleId: selectedSchedule.id,
          date: nextDate,
          time,
          adminNote,
          status: 'RESCHEDULED',
        },
        include: includeReservationRelations,
      })

      const releaseTimes = oldOwnedSlots
        .filter((slot) => slot.date.toISOString() !== nextDate.toISOString() || !blockedTimes.includes(slot.time))
        .map((slot) => slot.id)
      if (releaseTimes.length) await tx.doctorSchedule.updateMany({
        where: { id: { in: releaseTimes }, note: currentReservation.id, status: 'FULL' },
        data: { note: null, status: 'AVAILABLE' },
      })

      return updatedReservation
    })

    res.json(reservation)
  }),
)
