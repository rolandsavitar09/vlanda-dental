import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { ApiError } from '../middleware/error.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getParam } from '../utils/request.js'

export const schedulesRouter = Router()

const withScheduleBooking = {
  doctor: true,
  reservations: {
    where: { status: { not: 'CANCELLED' } },
    include: {
      service: true,
      user: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
} as const

type ScheduleWithBooking = Awaited<ReturnType<typeof prisma.doctorSchedule.findMany>>[number] & {
  reservations: Array<{
    id: string
    code: string | null
    service: { title: string }
    user: { name: string }
  }>
}

const attachComputedBooking = async (schedules: ScheduleWithBooking[]) => {
  const reservationIds = schedules
    .map((schedule) => schedule.note)
    .filter((id): id is string => Boolean(id))
  const reservations = reservationIds.length > 0
    ? await prisma.reservation.findMany({
        where: { id: { in: reservationIds }, status: { not: 'CANCELLED' } },
        include: { service: true, user: true },
      })
    : []
  const reservationById = new Map(reservations.map((reservation) => [reservation.id, reservation]))

  return schedules.map((schedule) => {
    const scheduleReservations =
      schedule.reservations.length > 0
        ? schedule.reservations
        : schedule.note && reservationById.has(schedule.note)
          ? [reservationById.get(schedule.note)]
          : []

    return {
      ...schedule,
      reservations: scheduleReservations,
      status:
        schedule.status === 'OFF'
          ? 'OFF'
          : scheduleReservations.length > 0 || schedule.status === 'FULL'
            ? 'FULL'
            : 'AVAILABLE',
    }
  })
}

schedulesRouter.get(
  '/admin',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const doctorId = typeof req.query.doctorId === 'string' ? req.query.doctorId : undefined
    const status = typeof req.query.status === 'string' ? req.query.status : undefined

    const schedules = await prisma.doctorSchedule.findMany({
      where: {
        ...(doctorId ? { doctorId } : {}),
        ...(status ? { status } : {}),
      },
      include: withScheduleBooking,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    })

    res.json(await attachComputedBooking(schedules))
  }),
)

schedulesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const doctorId = typeof req.query.doctorId === 'string' ? req.query.doctorId : undefined
    const status = typeof req.query.status === 'string' ? req.query.status : undefined

    const schedules = await prisma.doctorSchedule.findMany({
      where: {
        ...(doctorId ? { doctorId } : {}),
        ...(status ? { status } : {}),
      },
      include: withScheduleBooking,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    })

    const computedSchedules = await attachComputedBooking(schedules)
    res.json(
      computedSchedules.map(({ reservations: _reservations, ...schedule }) => schedule),
    )
  }),
)

schedulesRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { doctorId, date, time, status, note } = req.body

    if (!doctorId || !date || !time) {
      throw new ApiError(400, 'Dokter, tanggal, dan jam wajib diisi')
    }

    const schedule = await prisma.doctorSchedule.create({
      data: {
        doctorId,
        date: new Date(date),
        time,
        status: status ?? 'AVAILABLE',
        note,
      },
      include: withScheduleBooking,
    })

    const [computedSchedule] = await attachComputedBooking([schedule])
    res.status(201).json(computedSchedule)
  }),
)

schedulesRouter.put(
  '/day/status',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { doctorId, date, status } = req.body

    if (!doctorId || !date || !status) {
      throw new ApiError(400, 'Dokter, tanggal, dan status wajib diisi')
    }

    throw new ApiError(409, 'Perubahan status massal dinonaktifkan. Pilih satu slot jadwal.')
  }),
)

schedulesRouter.put(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { date, ...payload } = req.body
    const schedule = await prisma.$transaction(async (tx) => {
      const id = getParam(req.params.id, 'id')
      const current = await tx.doctorSchedule.findUnique({ where: { id } })
      if (!current) throw new ApiError(404, 'Slot jadwal tidak ditemukan')
      const activeReservation = await tx.reservation.findFirst({
        where: { scheduleId: id, status: { not: 'CANCELLED' } }, select: { id: true },
      })
      const ownerReservation = current.note
        ? await tx.reservation.findFirst({ where: { id: current.note, status: { not: 'CANCELLED' } }, select: { id: true } })
        : null
      const reservationsOnDate = await tx.reservation.findMany({
        where: { doctorId: current.doctorId, date: current.date, status: { not: 'CANCELLED' } },
        include: { service: { select: { estimatedDuration: true } } },
      })
      const isCoveredByReservation = reservationsOnDate.some((reservation) => {
        const duration = reservation.service.estimatedDuration
        const hourMatch = duration.match(/(\d+)\s*jam/i)
        const minuteMatches = Array.from(duration.matchAll(/(\d+)\s*menit/gi))
        const minutes = hourMatch?.[1] ? Number(hourMatch[1]) * 60
          : minuteMatches.length ? Math.max(...minuteMatches.map((match) => Number(match[1]))) : 30
        const [hour, minute] = reservation.time.split('.').map(Number)
        const start = hour * 60 + minute
        const count = Math.max(1, Math.ceil(minutes / 30))
        return Array.from({ length: count }, (_value, index) => {
          const total = start + index * 30
          return `${String(Math.floor(total / 60)).padStart(2, '0')}.${String(total % 60).padStart(2, '0')}`
        }).includes(current.time)
      })
      if (activeReservation || ownerReservation || isCoveredByReservation) {
        throw new ApiError(409, 'Slot sudah dimiliki reservasi dan tidak dapat diubah')
      }
      const updated = await tx.doctorSchedule.updateMany({
        where: { id, status: current.status, note: current.note },
        data: { ...payload, ...(date ? { date: new Date(date) } : {}) },
      })
      if (updated.count !== 1) throw new ApiError(409, 'Slot berubah bersamaan, muat ulang jadwal')
      return tx.doctorSchedule.findUniqueOrThrow({ where: { id }, include: withScheduleBooking })
    })

    const [computedSchedule] = await attachComputedBooking([schedule])
    res.json(computedSchedule)
  }),
)

schedulesRouter.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.$transaction(async (tx) => {
      const id = getParam(req.params.id, 'id')
      const activeReservation = await tx.reservation.findFirst({
        where: { OR: [{ scheduleId: id }, { schedule: { id } }], status: { not: 'CANCELLED' } },
      })
      if (activeReservation) throw new ApiError(409, 'Slot memiliki reservasi aktif dan tidak dapat dihapus')
      await tx.doctorSchedule.delete({ where: { id } })
    })

    res.status(204).send()
  }),
)
