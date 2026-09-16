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
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return { end, start }
}

const createDailyReservationCode = async (
  tx: Prisma.TransactionClient,
  date: Date,
) => {
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

const toMinutes = (time: string) => {
  const [hour, minute] = time.split('.').map(Number)

  return hour * 60 + minute
}

const createBlockedTimes = (startTime: string, estimatedDuration: string) => {
  const blocks = Math.max(1, Math.ceil(parseEstimatedDuration(estimatedDuration) / 30) + 1)
  const startMinutes = toMinutes(startTime)

  return Array.from({ length: blocks }, (_item, index) => {
    const totalMinutes = startMinutes + index * 30
    const hour = Math.floor(totalMinutes / 60)
    const minute = totalMinutes % 60

    return `${String(hour).padStart(2, '0')}.${String(minute).padStart(2, '0')}`
  })
}

const assertReservationSlotsAvailable = async (
  tx: Prisma.TransactionClient,
  {
    date,
    doctorId,
    ignoredReservationId,
    serviceDuration,
    time,
  }: {
    date: Date
    doctorId: string
    ignoredReservationId?: string
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
  })
  const selectedSchedule = schedules.find((schedule) => schedule.time === time)

  if (!selectedSchedule || schedules.length < blockedTimes.length) {
    throw new ApiError(409, 'Slot durasi layanan ini tidak cukup tersedia')
  }

  const hasConflict = schedules.some(
    (schedule) =>
      schedule.status === 'OFF' ||
      (schedule.status === 'FULL' && schedule.note !== ignoredReservationId),
  )

  if (hasConflict) {
    throw new ApiError(409, 'Jadwal pengganti bentrok dengan reservasi lain')
  }

  return { blockedTimes, selectedSchedule }
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

    if (scheduleId) {
      const schedule = await prisma.doctorSchedule.findUnique({ where: { id: scheduleId } })
      if (
        !schedule ||
        schedule.status !== 'AVAILABLE' ||
        schedule.doctorId !== doctorId ||
        schedule.time !== time ||
        schedule.date.toISOString().slice(0, 10) !== String(date).slice(0, 10)
      ) {
        throw new ApiError(409, 'Jadwal tidak tersedia')
      }
    }

    const reservationDate = new Date(date)
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

      const { blockedTimes, selectedSchedule } = await assertReservationSlotsAvailable(tx, {
        date: reservationDate,
        doctorId,
        serviceDuration: service.estimatedDuration,
        time,
      })

      if (scheduleId && selectedSchedule.id !== scheduleId) {
        throw new ApiError(409, 'Jadwal tidak tersedia')
      }

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
        where: {
          date: reservationDate,
          doctorId,
          time: { in: blockedTimes },
        },
        data: { note: nextReservation.id, status: 'FULL' },
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
      const currentReservation = await tx.reservation.findUnique({
        where: { id: getParam(req.params.id, 'id') },
      })

      if (!currentReservation) {
        throw new ApiError(404, 'Reservasi tidak ditemukan')
      }

      const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'DOCTOR'

      if (!isAdmin && currentReservation.userId !== req.user?.userId) {
        throw new ApiError(403, 'Reservasi ini bukan milik akun Anda')
      }

      if (currentReservation.status === 'COMPLETED') {
        throw new ApiError(409, 'Reservasi selesai tidak bisa dibatalkan')
      }

      const updatedReservation = await tx.reservation.update({
        where: { id: currentReservation.id },
        data: { status: 'CANCELLED' },
        include: includeReservationRelations,
      })

      if (currentReservation.scheduleId) {
        await tx.doctorSchedule.updateMany({
          where: {
            OR: [
              { id: currentReservation.scheduleId },
              { note: currentReservation.id },
            ],
          },
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
      const currentReservation = await tx.reservation.findUnique({
        where: { id: getParam(req.params.id, 'id') },
      })

      if (!currentReservation) {
        throw new ApiError(404, 'Reservasi tidak ditemukan')
      }

      const updatedReservation = await tx.reservation.update({
        where: { id: currentReservation.id },
        data: { status, adminNote },
        include: includeReservationRelations,
      })

      if (status === 'CANCELLED' && currentReservation.scheduleId) {
        await tx.doctorSchedule.updateMany({
          where: {
            OR: [
              { id: currentReservation.scheduleId },
              { note: currentReservation.id },
            ],
          },
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
      const currentReservation = await tx.reservation.findUnique({
        where: { id: getParam(req.params.id, 'id') },
      })

      if (!currentReservation) {
        throw new ApiError(404, 'Reservasi tidak ditemukan')
      }

      const nextDate = new Date(date)
      const service = await tx.service.findUnique({ where: { id: currentReservation.serviceId } })

      if (!service) {
        throw new ApiError(404, 'Layanan tidak ditemukan')
      }

      const { blockedTimes, selectedSchedule } = await assertReservationSlotsAvailable(tx, {
        date: nextDate,
        doctorId: currentReservation.doctorId,
        ignoredReservationId: currentReservation.id,
        serviceDuration: service.estimatedDuration,
        time,
      })

      if (scheduleId && selectedSchedule.id !== scheduleId) {
        throw new ApiError(409, 'Jadwal pengganti tidak tersedia')
      }

      const activeReservationAtTarget = await tx.reservation.findFirst({
        where: {
          date: nextDate,
          doctorId: currentReservation.doctorId,
          id: { not: currentReservation.id },
          status: { not: 'CANCELLED' },
          time,
        },
      })

      if (activeReservationAtTarget) {
        throw new ApiError(409, 'Jadwal pengganti bentrok dengan reservasi lain')
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

      if (currentReservation.scheduleId) {
        await tx.doctorSchedule.updateMany({
          where: {
            OR: [
              { id: currentReservation.scheduleId },
              { note: currentReservation.id },
            ],
          },
          data: { note: null, status: 'AVAILABLE' },
        })
      }

      await tx.doctorSchedule.updateMany({
        where: {
          date: nextDate,
          doctorId: currentReservation.doctorId,
          time: { in: blockedTimes },
        },
        data: { note: currentReservation.id, status: 'FULL' },
      })

      return updatedReservation
    })

    res.json(reservation)
  }),
)
